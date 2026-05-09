/**
 * Example 2: Webhook Handler
 *
 * Complete webhook handling with database sync.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@project-forge/payments-stripe-full/webhooks'
import { createClient } from '@supabase/supabase-js'

const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhooks
 */
export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')!

  const result = await handleWebhook(stripeConfig, {
    payload,
    signature,
    handlers: {
      // Checkout completed - create subscription record
      'checkout.session.completed': async (event) => {
        const session = event.data.object

        const { error } = await supabase.from('subscriptions').insert({
          user_id: session.metadata.userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          price_id: session.metadata.priceId || '',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

        if (error) {
          console.error('Failed to create subscription:', error)
          throw error
        }

        console.log('Subscription created for user:', session.metadata.userId)
      },

      // Subscription updated
      'customer.subscription.updated': async (event) => {
        const subscription = event.data.object

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Failed to update subscription:', error)
          throw error
        }

        console.log('Subscription updated:', subscription.id)
      },

      // Subscription deleted
      'customer.subscription.deleted': async (event) => {
        const subscription = event.data.object

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Failed to cancel subscription:', error)
          throw error
        }

        console.log('Subscription canceled:', subscription.id)
      },

      // Invoice payment succeeded
      'invoice.payment_succeeded': async (event) => {
        const invoice = event.data.object

        // Create payment record
        await supabase.from('payments').insert({
          stripe_payment_intent_id: invoice.payment_intent,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
        })

        console.log('Payment succeeded:', invoice.id)
      },

      // Invoice payment failed
      'invoice.payment_failed': async (event) => {
        const invoice = event.data.object

        // Notify user of failed payment
        console.error('Payment failed for customer:', invoice.customer)

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer)
      },
    },
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ received: true })
}

/**
 * IMPORTANT: Configure webhook endpoint in Stripe Dashboard
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/stripe
 * 3. Select events: checkout.session.completed, customer.subscription.*, invoice.*
 * 4. Copy webhook secret to .env.local
 */
