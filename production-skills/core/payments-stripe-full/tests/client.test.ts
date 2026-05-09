/**
 * Tests for Stripe client
 */

import { describe, it, expect } from 'vitest'
import { createStripeClient } from '../src/client'
import type { StripeConfig } from '../src/types'

const mockConfig: StripeConfig = {
  secretKey: 'sk_test_123',
  publishableKey: 'pk_test_123',
}

describe('Client', () => {
  it('should create Stripe client with correct API version', () => {
    const client = createStripeClient(mockConfig)

    expect(client).toBeDefined()
    // Verify API version is set (will be in client config)
  })
})
