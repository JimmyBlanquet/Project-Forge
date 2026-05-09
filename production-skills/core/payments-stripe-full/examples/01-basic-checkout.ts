/**
 * Example 1: Basic Stripe Checkout
 *
 * Shows how to create a checkout session and handle success/cancel.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@project-forge/payments-stripe-full'

const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
}

/**
 * POST /api/checkout
 * Create a checkout session for a subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json()
    const userId = 'user-123' // Get from auth

    // Create checkout session
    const session = await createCheckoutSession(stripeConfig, {
      userId,
      priceId,
      mode: 'subscription',
      successUrl: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * Client-side: Redirect to Stripe Checkout
 */
export const clientSideExample = `
import { loadStripe } from '@stripe/stripe-js'

async function handleSubscribe(priceId: string) {
  // Create checkout session
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  })

  const { sessionId } = await response.json()

  // Redirect to Stripe Checkout
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  await stripe.redirectToCheckout({ sessionId })
}
`
