/**
 * Stripe webhook handling
 */

import type Stripe from 'stripe'
import { createStripeClient } from './client'
import type { StripeConfig, WebhookOptions } from './types'

/**
 * Handle Stripe webhook
 *
 * @param config - Stripe configuration (must include webhookSecret)
 * @param options - Webhook options
 * @returns Processing result
 *
 * @example
 * ```typescript
 * const result = await handleWebhook(config, {
 *   payload: await request.text(),
 *   signature: request.headers.get('stripe-signature')!,
 *   handlers: {
 *     'checkout.session.completed': async (event) => {
 *       const session = event.data.object
 *       await updateUserSubscription(session.customer, session.subscription)
 *     },
 *   },
 * })
 * ```
 */
export async function handleWebhook(
  config: StripeConfig,
  options: WebhookOptions
): Promise<{ success: boolean; type?: string; error?: string }> {
  if (!config.webhookSecret) {
    throw new Error('Webhook secret is required for webhook handling')
  }

  const stripe = createStripeClient(config)

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      options.payload,
      options.signature,
      config.webhookSecret
    )

    // Get handler for this event type
    const handler = options.handlers[event.type]

    if (handler) {
      await handler(event)
      return { success: true, type: event.type }
    }

    // No handler for this event type - still return success
    return { success: true, type: event.type }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe Webhook] Error:', error)
    return { success: false, error }
  }
}

/**
 * Verify webhook signature without processing
 *
 * @param config - Stripe configuration
 * @param payload - Raw webhook body
 * @param signature - Stripe signature header
 * @returns Verified event or null if invalid
 */
export function verifyWebhookSignature(
  config: StripeConfig,
  payload: string,
  signature: string
): Stripe.Event | null {
  if (!config.webhookSecret) {
    return null
  }

  const stripe = createStripeClient(config)

  try {
    return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret)
  } catch {
    return null
  }
}
