/**
 * Stripe Checkout session management
 */

import type Stripe from 'stripe'
import { createStripeClient } from './client'
import type { StripeConfig, CheckoutSessionOptions } from './types'

/**
 * Create a Stripe Checkout session
 *
 * @param config - Stripe configuration
 * @param options - Checkout session options
 * @returns Checkout session
 *
 * @example
 * ```typescript
 * const session = await createCheckoutSession(config, {
 *   userId: 'user-123',
 *   priceId: 'price_monthly',
 *   mode: 'subscription',
 *   successUrl: '/success',
 *   cancelUrl: '/cancel',
 * })
 *
 * // Redirect to session.url
 * ```
 */
export async function createCheckoutSession(
  config: StripeConfig,
  options: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> {
  const stripe = createStripeClient(config)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: options.mode || 'subscription',
    line_items: [
      {
        price: options.priceId,
        quantity: options.quantity || 1,
      },
    ],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      userId: options.userId,
      ...options.metadata,
    },
  }

  if (options.customerId) {
    sessionParams.customer = options.customerId
  } else {
    sessionParams.customer_creation = 'always'
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return session
}

/**
 * Retrieve a checkout session
 *
 * @param config - Stripe configuration
 * @param sessionId - Checkout session ID
 * @returns Checkout session
 */
export async function getCheckoutSession(
  config: StripeConfig,
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = createStripeClient(config)
  return stripe.checkout.sessions.retrieve(sessionId)
}
