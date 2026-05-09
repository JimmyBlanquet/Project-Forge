/**
 * Tests for token refresh functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isTokenExpired } from '../src/token-refresh'

describe('token-refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      const pastDate = new Date(Date.now() - 1000)
      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('returns false for valid token', () => {
      const futureDate = new Date(Date.now() + 3600000)
      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('returns true for current time', () => {
      const now = new Date()
      expect(isTokenExpired(now)).toBe(true)
    })
  })
})
