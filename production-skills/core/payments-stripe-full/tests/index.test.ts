/**
 * Integration tests for exports
 */

import { describe, it, expect } from 'vitest'

describe('payments-stripe-full', () => {
  it('should be able to import module', async () => {
    const module = await import('../src/index')
    expect(module).toBeDefined()
  })

  it('should export checkout functions', async () => {
    const { createCheckoutSession, getCheckoutSession } = await import('../src/index')
    expect(createCheckoutSession).toBeDefined()
    expect(getCheckoutSession).toBeDefined()
  })

  it('should export customer functions', async () => {
    const { createCustomer, getCustomer, updateCustomer, createCustomerPortalSession } = 
      await import('../src/index')
    expect(createCustomer).toBeDefined()
    expect(getCustomer).toBeDefined()
    expect(updateCustomer).toBeDefined()
    expect(createCustomerPortalSession).toBeDefined()
  })

  it('should export subscription functions', async () => {
    const { createSubscription, getSubscription, updateSubscription, cancelSubscription } = 
      await import('../src/index')
    expect(createSubscription).toBeDefined()
    expect(getSubscription).toBeDefined()
    expect(updateSubscription).toBeDefined()
    expect(cancelSubscription).toBeDefined()
  })

  it('should export webhook functions', async () => {
    const { handleWebhook, verifyWebhookSignature } = await import('../src/index')
    expect(handleWebhook).toBeDefined()
    expect(verifyWebhookSignature).toBeDefined()
  })
})
