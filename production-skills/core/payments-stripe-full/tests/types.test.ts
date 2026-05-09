/**
 * Tests for type exports
 */

import { describe, it, expect } from 'vitest'
import type {
  StripeConfig,
  CheckoutSessionOptions,
  CreateSubscriptionOptions,
  CreateCustomerOptions,
  WebhookOptions,
} from '../src/types'

describe('Types', () => {
  it('should have StripeConfig type', () => {
    const config: StripeConfig = {
      secretKey: 'sk_test',
      publishableKey: 'pk_test',
      webhookSecret: 'whsec_test',
    }
    expect(config).toBeDefined()
  })

  it('should have CheckoutSessionOptions type', () => {
    const options: CheckoutSessionOptions = {
      userId: 'user-123',
      priceId: 'price_123',
      successUrl: '/success',
      cancelUrl: '/cancel',
    }
    expect(options).toBeDefined()
  })

  it('should have CreateSubscriptionOptions type', () => {
    const options: CreateSubscriptionOptions = {
      customerId: 'cus_123',
      priceId: 'price_123',
    }
    expect(options).toBeDefined()
  })

  it('should have CreateCustomerOptions type', () => {
    const options: CreateCustomerOptions = {
      email: 'test@example.com',
      name: 'Test User',
    }
    expect(options).toBeDefined()
  })
})
