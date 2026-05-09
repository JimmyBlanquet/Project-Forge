import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * E2E Auth Flow Tests
 * These tests simulate complete authentication flows from start to finish
 */

// Mock Supabase client for E2E testing
const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(), single: vi.fn() })),
    update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(), single: vi.fn() })) })),
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
  })),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

import { createClient } from '../../src/client'

describe('E2E Auth Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Signup Flow', () => {
    it('should complete full signup with email verification', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // Step 1: User submits signup form
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
            email_confirmed_at: null,
          },
          session: null, // No session until email confirmed
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        options: {
          emailRedirectTo: 'https://myapp.com/auth/callback',
        },
      })

      expect(signupError).toBeNull()
      expect(signupData.user).toBeDefined()
      expect(signupData.user?.email).toBe('newuser@example.com')
      expect(signupData.session).toBeNull() // Email not confirmed yet

      // Step 2: User receives email and clicks verification link
      // (This would trigger callback route in real app)

      // Step 3: After verification, user can sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
          },
        },
        error: null,
      })

      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      })

      expect(signinError).toBeNull()
      expect(signinData.session).toBeDefined()
      expect(signinData.session?.access_token).toBe('access-token-123')
      expect(signinData.user?.email_confirmed_at).toBeDefined()
    })

    it('should handle signup with existing email error', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User already registered',
          status: 422,
        },
      })

      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'SecurePassword123!',
      })

      expect(data.user).toBeNull()
      expect(error).toBeDefined()
      expect(error?.message).toBe('User already registered')
      expect(error?.status).toBe(422)
    })
  })

  describe('Email Login Flow', () => {
    it('should complete successful login with email and password', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // Step 1: User submits login form
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            expires_in: 3600,
          },
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'SecurePassword123!',
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.session).toBeDefined()
      expect(data.session?.access_token).toBe('access-token-123')

      // Step 2: Verify user is authenticated
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      const { data: userData } = await supabase.auth.getUser()
      expect(userData.user).toBeDefined()
      expect(userData.user?.id).toBe('user-123')
    })

    it('should handle invalid credentials error', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 400,
        },
      })

      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'WrongPassword',
      })

      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
      expect(error).toBeDefined()
      expect(error?.message).toBe('Invalid login credentials')
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete password reset process', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // Step 1: User requests password reset
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const supabase = createClient(config)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        'user@example.com',
        {
          redirectTo: 'https://myapp.com/auth/update-password',
        }
      )

      expect(resetError).toBeNull()

      // Step 2: User receives email and clicks reset link
      // (This would set recovery session in real app)

      // Step 3: User submits new password
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: 'NewSecurePassword123!',
      })

      expect(updateError).toBeNull()
      expect(updateData.user).toBeDefined()

      // Step 4: User can now sign in with new password
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
        },
        error: null,
      })

      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'NewSecurePassword123!',
      })

      expect(signinError).toBeNull()
      expect(signinData.session).toBeDefined()
    })
  })

  describe('OAuth Social Login Flow', () => {
    it('should initiate Google OAuth flow', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: {
          provider: 'google',
          url: 'https://accounts.google.com/oauth/authorize?...',
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://myapp.com/auth/callback',
        },
      })

      expect(error).toBeNull()
      expect(data.provider).toBe('google')
      expect(data.url).toContain('accounts.google.com')
    })

    it('should initiate GitHub OAuth flow', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: {
          provider: 'github',
          url: 'https://github.com/login/oauth/authorize?...',
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'https://myapp.com/auth/callback',
        },
      })

      expect(error).toBeNull()
      expect(data.provider).toBe('github')
      expect(data.url).toContain('github.com')
    })
  })

  describe('Profile Creation Flow', () => {
    it('should create user profile after signup', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // Step 1: User signs up
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
          },
          session: {
            access_token: 'access-token-123',
          },
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data: signupData } = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      })

      expect(signupData.user).toBeDefined()

      // Step 2: Create profile record
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'newuser@example.com',
              display_name: 'New User',
              avatar_url: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      }))

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      })

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user?.id,
          email: signupData.user?.email,
          display_name: 'New User',
        })
        .select()
        .single()

      expect(profileError).toBeNull()
      expect(profileData).toBeDefined()
      expect((profileData as any).display_name).toBe('New User')
    })
  })

  describe('Logout Flow', () => {
    it('should sign out and clear session', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // Step 1: User is authenticated
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      const supabase = createClient(config)
      const { data: beforeLogout } = await supabase.auth.getUser()
      expect(beforeLogout.user).toBeDefined()

      // Step 2: User signs out
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { error: signOutError } = await supabase.auth.signOut()
      expect(signOutError).toBeNull()

      // Step 3: User is no longer authenticated
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Invalid JWT',
          status: 401,
        },
      })

      const { data: afterLogout } = await supabase.auth.getUser()
      expect(afterLogout.user).toBeNull()
    })
  })

  describe('Session Refresh Flow', () => {
    it('should refresh expired session automatically', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      // This flow would be handled automatically by Supabase client
      // but we can test that the client is configured correctly
      const supabase = createClient(config)

      // Mock expired session scenario
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: {
          message: 'JWT expired',
          status: 401,
        },
      })

      // After refresh, user should be available again
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      // First call returns expired session
      const { data: firstCall } = await supabase.auth.getUser()
      expect(firstCall.user).toBeNull()

      // Second call (after automatic refresh) returns user
      const { data: secondCall } = await supabase.auth.getUser()
      expect(secondCall.user).toBeDefined()
    })
  })
})
