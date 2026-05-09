import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks to avoid initialization errors
const { mockJson, mockSupabaseClient, MockNextRequest } = vi.hoisted(() => {
  const mockJson = vi.fn((body, init) => ({
    _body: body,
    _status: init?.status,
    _type: 'response',
  }))

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  }

  class MockNextRequest {
    cookies = {
      getAll: vi.fn(() => []),
    }
  }

  return { mockJson, mockSupabaseClient, MockNextRequest }
})

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: mockJson,
  },
}))

// Mock server module
vi.mock('../src/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
  createRouteHandlerClient: vi.fn(() => mockSupabaseClient),
}))

import { requireAuth, requireAdminAuth } from '../src/require-auth'

describe('require-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should return user and supabase client if authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAuth(config)

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(result.supabase).toBeDefined()
    })

    it('should return 401 error if user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(401)
      expect(result.error._body.error).toBe('Unauthorized')
      expect(result.supabase).toBeNull()
    })

    it('should return 503 error if auth service unavailable', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Service unavailable', status: 503 },
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(503)
      expect(result.error._body.error).toBe('Authentication service unavailable')
      expect(result.supabase).toBeNull()
    })

    it('should return 500 error on unexpected errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'))

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(500)
      expect(result.error._body.error).toBe('Error verifying authentication')
      expect(result.supabase).toBeNull()
    })

    it('should use route handler client if request provided', async () => {
      const { createRouteHandlerClient } = await import('../src/server')
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }
      const request = new MockNextRequest() as any

      const result = await requireAuth(config, request)

      expect(createRouteHandlerClient).toHaveBeenCalledWith(config, request)
      expect(result.user).toEqual(mockUser)
    })

    it('should log auth errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error', status: 401 },
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await requireAuth(config)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[requireAuth] Supabase auth error:',
        expect.objectContaining({
          message: 'Auth error',
          status: 401,
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('requireAdminAuth', () => {
    it('should return user and client if user is admin', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAdminAuth(config)

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(result.supabase).toBeDefined()
    })

    it('should return 403 error if user is not admin', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: false },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAdminAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(403)
      expect(result.error._body.error).toBe('Forbidden')
      expect(result.supabase).toBeNull()
    })

    it('should return 401 if user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAdminAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(401)
      expect(result.supabase).toBeNull()
    })

    it('should return 500 error if profile fetch fails', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAdminAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(500)
      expect(result.error._body.error).toBe('Error verifying permissions')
      expect(result.supabase).toBeNull()
    })

    it('should use custom profiles table name', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await requireAdminAuth(config, undefined, { profilesTable: 'user_profiles' })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should use custom admin field name', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await requireAdminAuth(config, undefined, { adminField: 'role' })

      expect(mockSelect).toHaveBeenCalledWith('role')
    })

    it('should handle unexpected errors', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await requireAdminAuth(config)

      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error._status).toBe(500)
      expect(result.supabase).toBeNull()
    })

    it('should log profile fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Profile error' },
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await requireAdminAuth(config)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[requireAdminAuth] Profile fetch error:',
        expect.objectContaining({ message: 'Profile error' })
      )

      consoleSpy.mockRestore()
    })
  })
})
