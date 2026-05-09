/**
 * Stripe subscription management
 */

import type Stripe from 'stripe'
import { createStripeClient } from './client'
import type { StripeConfig, CreateSubscriptionOptions } from './types'

/**
 * Create a subscription
 *
 * @param config - Stripe configuration
 * @param options - Subscription options
 * @returns Stripe subscription
 */
export async function createSubscription(
  config: StripeConfig,
  options: CreateSubscriptionOptions
): Promise<Stripe.Subscription> {
  const stripe = createStripeClient(config)

  const params: Stripe.SubscriptionCreateParams = {
    customer: options.customerId,
    items: [{ price: options.priceId }],
    metadata: options.metadata,
  }

  if (options.trialPeriodDays) {
    params.trial_period_days = options.trialPeriodDays
  }

  return stripe.subscriptions.create(params)
}

/**
 * Get subscription by ID
 *
 * @param config - Stripe configuration
 * @param subscriptionId - Stripe subscription ID
 * @returns Stripe subscription
 */
export async function getSubscription(
  config: StripeConfig,
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = createStripeClient(config)
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Update subscription (e.g., change price)
 *
 * @param config - Stripe configuration
 * @param subscriptionId - Stripe subscription ID
 * @param newPriceId - New price ID
 * @returns Updated subscription
 */
export async function updateSubscription(
  config: StripeConfig,
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const stripe = createStripeClient(config)

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
  })
}

/**
 * Cancel subscription
 *
 * @param config - Stripe configuration
 * @param subscriptionId - Stripe subscription ID
 * @param immediately - Cancel immediately (true) or at period end (false)
 * @returns Cancelled subscription
 */
export async function cancelSubscription(
  config: StripeConfig,
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = createStripeClient(config)

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId)
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}
