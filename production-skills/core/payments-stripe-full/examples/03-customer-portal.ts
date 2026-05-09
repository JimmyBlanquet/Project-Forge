/**
 * Example 3: Customer Portal
 *
 * Allow customers to manage their own subscriptions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCustomerPortalSession } from '@project-forge/payments-stripe-full'
import { createClient } from '@supabase/supabase-js'

const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/customer-portal
 * Create a customer portal session
 */
export async function POST(request: NextRequest) {
  try {
    const userId = 'user-123' // Get from auth

    // Get user's Stripe customer ID from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const portalSession = await createCustomerPortalSession(
      stripeConfig,
      user.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_URL}/account`
    )

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

/**
 * Client-side: Redirect to customer portal
 */
export const clientSideExample = `
async function openCustomerPortal() {
  const response = await fetch('/api/customer-portal', {
    method: 'POST',
  })

  const { url } = await response.json()

  // Redirect to Stripe Customer Portal
  window.location.href = url
}
`

/**
 * What customers can do in the portal:
 * - Update payment method
 * - View billing history
 * - Download invoices
 * - Cancel subscription
 * - Update subscription (if enabled in Stripe settings)
 */
