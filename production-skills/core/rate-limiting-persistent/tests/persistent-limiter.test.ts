import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkRateLimit,
  configureRateLimitStorage,
  cleanupFallbackStore,
  getFallbackStoreStats,
  resetFallbackStore,
  SupabaseRateLimitProvider,
  checkGenerationRateLimit,
  checkClassificationRateLimit,
  checkSuggestionRateLimit,
  checkExpensiveAIRateLimit,
  checkCrudRateLimit,
  checkReadRateLimit,
  type RateLimitConfig,
  type RateLimitStorageProvider,
} from '../src'

describe('rate-limiting-persistent', () => {
  beforeEach(() => {
    // Reset storage provider before each test
    configureRateLimitStorage(null as any)
    // Clear fallback store completely
    resetFallbackStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRateLimit with in-memory fallback', () => {
    it('should allow first request', async () => {
      const result = await checkRateLimit('user123', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('should track requests within window', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 3,
        windowSeconds: 60,
      }

      const result1 = await checkRateLimit('user123', config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await checkRateLimit('user123', config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await checkRateLimit('user123', config)
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should reject when limit exceeded', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 2,
        windowSeconds: 60,
      }

      await checkRateLimit('user123', config) // 1st request
      await checkRateLimit('user123', config) // 2nd request

      const result = await checkRateLimit('user123', config) // 3rd request - should fail
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 2,
        windowSeconds: 1, // 1 second window
      }

      const result1 = await checkRateLimit('user123', config)
      expect(result1.allowed).toBe(true)

      await checkRateLimit('user123', config)
      const result2 = await checkRateLimit('user123', config)
      expect(result2.allowed).toBe(false) // Limit exceeded

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const result3 = await checkRateLimit('user123', config)
      expect(result3.allowed).toBe(true) // Should reset
      expect(result3.remaining).toBe(1)
    })

    it('should isolate different users', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 2,
        windowSeconds: 60,
      }

      await checkRateLimit('user1', config)
      await checkRateLimit('user1', config)
      const result1 = await checkRateLimit('user1', config)
      expect(result1.allowed).toBe(false) // user1 limit exceeded

      const result2 = await checkRateLimit('user2', config)
      expect(result2.allowed).toBe(true) // user2 should still work
    })

    it('should isolate different actions', async () => {
      const config1: RateLimitConfig = {
        action: 'action1',
        maxRequests: 1,
        windowSeconds: 60,
      }
      const config2: RateLimitConfig = {
        action: 'action2',
        maxRequests: 1,
        windowSeconds: 60,
      }

      await checkRateLimit('user123', config1)
      const result1 = await checkRateLimit('user123', config1)
      expect(result1.allowed).toBe(false) // action1 limit exceeded

      const result2 = await checkRateLimit('user123', config2)
      expect(result2.allowed).toBe(true) // action2 should still work
    })
  })

  describe('SupabaseRateLimitProvider', () => {
    it('should call Supabase RPC with correct parameters', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [
            {
              allowed: true,
              remaining: 9,
              reset_at: '2026-01-16T20:00:00Z',
            },
          ],
          error: null,
        }),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      const result = await provider.checkAndIncrement('test:user123', 10, 60)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_rate_limit', {
        p_key: 'test:user123',
        p_max_requests: 10,
        p_window_seconds: 60,
      })

      expect(result).not.toBeNull()
      expect(result?.allowed).toBe(true)
      expect(result?.remaining).toBe(9)
      expect(result?.resetAt).toBe(new Date('2026-01-16T20:00:00Z').getTime())
    })

    it('should return null on Supabase error', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      const result = await provider.checkAndIncrement('test:user123', 10, 60)

      expect(result).toBeNull()
    })

    it('should return null when no data returned', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      const result = await provider.checkAndIncrement('test:user123', 10, 60)

      expect(result).toBeNull()
    })

    it('should return null on exception', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockRejectedValue(new Error('Network error')),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      const result = await provider.checkAndIncrement('test:user123', 10, 60)

      expect(result).toBeNull()
    })

    it('should handle rate limit exceeded response', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [
            {
              allowed: false,
              remaining: 0,
              reset_at: '2026-01-16T20:00:00Z',
            },
          ],
          error: null,
        }),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      const result = await provider.checkAndIncrement('test:user123', 10, 60)

      expect(result).not.toBeNull()
      expect(result?.allowed).toBe(false)
      expect(result?.remaining).toBe(0)
    })
  })

  describe('configureRateLimitStorage', () => {
    it('should use configured storage provider', async () => {
      const mockProvider: RateLimitStorageProvider = {
        checkAndIncrement: vi.fn().mockResolvedValue({
          allowed: true,
          remaining: 5,
          resetAt: Date.now() + 60000,
        }),
      }

      configureRateLimitStorage(mockProvider)

      await checkRateLimit('user123', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })

      expect(mockProvider.checkAndIncrement).toHaveBeenCalledWith('test:user123', 10, 60)
    })

    it('should fallback to in-memory when provider returns null', async () => {
      const mockProvider: RateLimitStorageProvider = {
        checkAndIncrement: vi.fn().mockResolvedValue(null),
      }

      configureRateLimitStorage(mockProvider)

      const result = await checkRateLimit('user123', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9) // In-memory fallback
    })

    it('should use in-memory when no provider configured', async () => {
      configureRateLimitStorage(null as any)

      const result = await checkRateLimit('user123', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })
  })

  describe('pre-configured rate limiters', () => {
    it('checkGenerationRateLimit should use correct config', async () => {
      const result = await checkGenerationRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9) // 10 - 1
    })

    it('checkClassificationRateLimit should use correct config', async () => {
      const result = await checkClassificationRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(29) // 30 - 1
    })

    it('checkSuggestionRateLimit should use correct config', async () => {
      const result = await checkSuggestionRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(19) // 20 - 1
    })

    it('checkExpensiveAIRateLimit should use correct config', async () => {
      const result = await checkExpensiveAIRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1
    })

    it('checkCrudRateLimit should use correct config', async () => {
      const result = await checkCrudRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(59) // 60 - 1
    })

    it('checkReadRateLimit should use correct config', async () => {
      const result = await checkReadRateLimit('user123')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99) // 100 - 1
    })

    it('should respect individual limits per limiter', async () => {
      // Use expensive AI limit (5 requests)
      for (let i = 0; i < 5; i++) {
        await checkExpensiveAIRateLimit('user123')
      }
      const result1 = await checkExpensiveAIRateLimit('user123')
      expect(result1.allowed).toBe(false) // Expensive AI exhausted

      // Generation limit should still work (different action)
      const result2 = await checkGenerationRateLimit('user123')
      expect(result2.allowed).toBe(true)
    })
  })

  describe('cleanupFallbackStore', () => {
    it('should remove expired entries', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 1, // 1 second
      }

      // Make a request
      await checkRateLimit('user123', config)

      // Check store has entry
      let stats = getFallbackStoreStats()
      expect(stats.size).toBe(1)

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Cleanup
      cleanupFallbackStore()

      // Check store is empty
      stats = getFallbackStoreStats()
      expect(stats.size).toBe(0)
    })

    it('should not remove active entries', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60, // 60 seconds
      }

      await checkRateLimit('user123', config)

      let stats = getFallbackStoreStats()
      expect(stats.size).toBe(1)

      cleanupFallbackStore()

      stats = getFallbackStoreStats()
      expect(stats.size).toBe(1) // Should still be there
    })
  })

  describe('getFallbackStoreStats', () => {
    it('should return correct statistics', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      }

      const stats1 = getFallbackStoreStats()
      expect(stats1.size).toBe(0)
      expect(stats1.keys).toEqual([])

      await checkRateLimit('user1', config)
      await checkRateLimit('user2', config)

      const stats2 = getFallbackStoreStats()
      expect(stats2.size).toBe(2)
      expect(stats2.keys).toContain('test:user1')
      expect(stats2.keys).toContain('test:user2')
    })
  })

  describe('edge cases', () => {
    it('should handle very short windows', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 5,
        windowSeconds: 0.1, // 100ms
      }

      const result1 = await checkRateLimit('user123', config)
      expect(result1.allowed).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 150))

      const result2 = await checkRateLimit('user123', config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4) // Should have reset
    })

    it('should handle zero maxRequests gracefully', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 0,
        windowSeconds: 60,
      }

      const result = await checkRateLimit('user123', config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should handle very large maxRequests', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 1000000,
        windowSeconds: 60,
      }

      const result = await checkRateLimit('user123', config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(999999)
    })

    it('should handle special characters in userId', async () => {
      const config: RateLimitConfig = {
        action: 'test',
        maxRequests: 5,
        windowSeconds: 60,
      }

      const specialUserId = 'user:with:colons@email.com'
      const result = await checkRateLimit(specialUserId, config)
      expect(result.allowed).toBe(true)
    })
  })

  describe('integration: Supabase provider with fallback', () => {
    it('should use Supabase when available then fallback on error', async () => {
      const mockSupabase = {
        rpc: vi
          .fn()
          .mockResolvedValueOnce({
            data: [{ allowed: true, remaining: 9, reset_at: '2026-01-16T20:00:00Z' }],
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' },
          }),
      }

      const provider = new SupabaseRateLimitProvider(mockSupabase)
      configureRateLimitStorage(provider)

      // First call - Supabase works
      const result1 = await checkRateLimit('user123', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(9) // From Supabase

      // Second call - Supabase fails, should fallback
      const result2 = await checkRateLimit('user456', {
        action: 'test',
        maxRequests: 10,
        windowSeconds: 60,
      })
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(9) // From fallback
    })
  })
})
