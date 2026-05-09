import { describe, it, expect } from 'vitest'
import * as RateLimiting from '../src'

describe('rate-limiting-persistent exports', () => {
  it('should export core functions', () => {
    expect(RateLimiting.checkRateLimit).toBeDefined()
    expect(typeof RateLimiting.checkRateLimit).toBe('function')

    expect(RateLimiting.configureRateLimitStorage).toBeDefined()
    expect(typeof RateLimiting.configureRateLimitStorage).toBe('function')

    expect(RateLimiting.cleanupFallbackStore).toBeDefined()
    expect(typeof RateLimiting.cleanupFallbackStore).toBe('function')

    expect(RateLimiting.getFallbackStoreStats).toBeDefined()
    expect(typeof RateLimiting.getFallbackStoreStats).toBe('function')
  })

  it('should export pre-configured limiters', () => {
    expect(RateLimiting.checkGenerationRateLimit).toBeDefined()
    expect(RateLimiting.checkClassificationRateLimit).toBeDefined()
    expect(RateLimiting.checkSuggestionRateLimit).toBeDefined()
    expect(RateLimiting.checkExpensiveAIRateLimit).toBeDefined()
    expect(RateLimiting.checkCrudRateLimit).toBeDefined()
    expect(RateLimiting.checkReadRateLimit).toBeDefined()
  })

  it('should export SupabaseRateLimitProvider class', () => {
    expect(RateLimiting.SupabaseRateLimitProvider).toBeDefined()
    expect(typeof RateLimiting.SupabaseRateLimitProvider).toBe('function')
  })

  it('should be able to instantiate SupabaseRateLimitProvider', () => {
    const mockClient = { rpc: () => {} }
    const provider = new RateLimiting.SupabaseRateLimitProvider(mockClient)
    expect(provider).toBeDefined()
    expect(provider.checkAndIncrement).toBeDefined()
  })
})
