/**
 * Stripe customer management
 */

import type Stripe from 'stripe'
import { createStripeClient } from './client'
import type { StripeConfig, CreateCustomerOptions } from './types'

/**
 * Create a Stripe customer
 *
 * @param config - Stripe configuration
 * @param options - Customer options
 * @returns Stripe customer
 */
export async function createCustomer(
  config: StripeConfig,
  options: CreateCustomerOptions
): Promise<Stripe.Customer> {
  const stripe = createStripeClient(config)

  return stripe.customers.create({
    email: options.email,
    name: options.name,
    metadata: options.metadata,
  })
}

/**
 * Get customer by ID
 *
 * @param config - Stripe configuration
 * @param customerId - Stripe customer ID
 * @returns Stripe customer
 */
export async function getCustomer(
  config: StripeConfig,
  customerId: string
): Promise<Stripe.Customer> {
  const stripe = createStripeClient(config)
  return stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>
}

/**
 * Update customer
 *
 * @param config - Stripe configuration
 * @param customerId - Stripe customer ID
 * @param updates - Customer updates
 * @returns Updated customer
 */
export async function updateCustomer(
  config: StripeConfig,
  customerId: string,
  updates: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = createStripeClient(config)
  return stripe.customers.update(customerId, updates)
}

/**
 * Create customer portal session
 *
 * @param config - Stripe configuration
 * @param customerId - Stripe customer ID
 * @param returnUrl - Return URL after portal
 * @returns Portal session
 */
export async function createCustomerPortalSession(
  config: StripeConfig,
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = createStripeClient(config)

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
