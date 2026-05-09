/**
 * Stripe client initialization
 */

import Stripe from 'stripe'
import type { StripeConfig } from './types'

/**
 * Create Stripe client instance
 *
 * @param config - Stripe configuration
 * @returns Stripe client
 */
export function createStripeClient(config: StripeConfig): Stripe {
  return new Stripe(config.secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })
}
