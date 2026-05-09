/**
 * @project-forge/payments-stripe-full
 *
 * Production-ready Stripe integration for Next.js
 */

// Client
export { createStripeClient } from './client'

// Checkout
export { createCheckoutSession, getCheckoutSession } from './checkout'

// Customers
export {
  createCustomer,
  getCustomer,
  createCustomerPortalSession,
} from './customers'

// Subscriptions
export {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscription,
} from './subscriptions'

// Webhooks
export { handleWebhook } from './webhooks'

// Types
export type {
  StripeConfig,
  CheckoutSessionOptions,
  WebhookOptions,
  CustomerOptions,
  SubscriptionOptions,
} from './types'
