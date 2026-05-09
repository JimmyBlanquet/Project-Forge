import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks to avoid initialization errors
const { mockRedirect, mockSupabaseClient } = vi.hoisted(() => {
  const mockRedirect = vi.fn()

  const mockSupabaseClient = {
    auth: {
      signOut: vi.fn(),
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

  return { mockRedirect, mockSupabaseClient }
})

// Mock redirect
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// Mock createClient from server
vi.mock('../src/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}))

import { signOut, getUser, getProfile, getUserWithProfile, getSupabaseClient } from '../src/auth'

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      try {
        await signOut(config)
      } catch (e) {
        // redirect throws, which is expected
      }

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should redirect to /auth/login by default', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      try {
        await signOut(config)
      } catch (e) {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    })

    it('should redirect to custom URL if provided', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      try {
        await signOut(config, '/custom-logout')
      } catch (e) {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/custom-logout')
    })
  })

  describe('getUser', () => {
    it('should return user if authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const user = await getUser(config)

      expect(user).toEqual(mockUser)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
    })

    it('should return null if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const user = await getUser(config)

      expect(user).toBeNull()
    })

    it('should return null if auth error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const user = await getUser(config)

      expect(user).toBeNull()
    })
  })

  describe('getProfile', () => {
    it('should return profile if user authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', display_name: 'Test User' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
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

      const profile = await getProfile(config)

      expect(profile).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null if user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const profile = await getProfile(config)

      expect(profile).toBeNull()
    })

    it('should use custom table name if provided', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-123' },
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

      await getProfile(config, 'user_profiles')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should support generic ProfileType', async () => {
      interface CustomProfile {
        id: string
        username: string
      }

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile: CustomProfile = { id: 'user-123', username: 'testuser' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
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

      const profile = await getProfile<CustomProfile>(config)

      expect(profile).toEqual(mockProfile)
    })
  })

  describe('getUserWithProfile', () => {
    it('should return user and profile together', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', display_name: 'Test User' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
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

      const result = await getUserWithProfile(config)

      expect(result).toEqual({
        user: mockUser,
        profile: mockProfile,
      })
    })

    it('should return null if user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const result = await getUserWithProfile(config)

      expect(result).toBeNull()
    })

    it('should use custom table name', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-123' },
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

      await getUserWithProfile(config, 'custom_profiles')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('custom_profiles')
    })
  })

  describe('getSupabaseClient', () => {
    it('should return supabase client instance', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = await getSupabaseClient(config)

      expect(client).toBeDefined()
      expect(client).toBe(mockSupabaseClient)
    })

    it('should support generic Database type', async () => {
      interface TestDatabase {
        public: {
          tables: {
            users: {
              Row: { id: string }
            }
          }
        }
      }

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = await getSupabaseClient<TestDatabase>(config)

      expect(client).toBeDefined()
    })
  })
})
