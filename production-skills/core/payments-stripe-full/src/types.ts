/**
 * Type definitions for Stripe integration
 */

import type Stripe from 'stripe'

/**
 * Stripe configuration
 */
export interface StripeConfig {
  secretKey: string
  publishableKey?: string
  webhookSecret?: string
  apiVersion?: string
}

/**
 * Checkout session options
 */
export interface CheckoutSessionOptions {
  userId: string
  priceId: string
  mode?: 'payment' | 'subscription' | 'setup'
  successUrl: string
  cancelUrl: string
  customerId?: string
  quantity?: number
  metadata?: Record<string, string>
}

/**
 * Webhook handling options
 */
export interface WebhookOptions {
  payload: string
  signature: string
  handlers: Record<string, (event: Stripe.Event) => Promise<void>>
}

/**
 * Customer creation options
 */
export interface CustomerOptions {
  email: string
  userId: string
  name?: string
  metadata?: Record<string, string>
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}
