import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks to avoid initialization errors
const { mockCookieStore, mockCreateServerClient, mockCreateSupabaseClient, MockNextRequest, MockNextResponse } = vi.hoisted(() => {
  const mockCookieStore = {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  }

  const mockCreateServerClient = vi.fn((url, key, options) => ({
    _url: url,
    _key: key,
    _type: 'server',
    _cookieOptions: options,
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  }))

  const mockCreateSupabaseClient = vi.fn((url, key, options) => ({
    _url: url,
    _key: key,
    _type: 'service',
    _options: options,
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }))

  class MockNextRequest {
    cookies = {
      getAll: vi.fn(() => [{ name: 'sb-token', value: 'test-token' }]),
    }
  }

  class MockNextResponse {
    cookies = {
      set: vi.fn(),
    }
  }

  return { mockCookieStore, mockCreateServerClient, mockCreateSupabaseClient, MockNextRequest, MockNextResponse }
})

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateSupabaseClient,
}))

import { createClient, createRouteHandlerClient, createServiceClient } from '../src/server'

describe('server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieStore.getAll.mockReturnValue([])
  })

  describe('createClient', () => {
    it('should create a server client with cookies', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = await createClient(config)

      expect(client).toBeDefined()
      expect(client._url).toBe(config.supabaseUrl)
      expect(client._key).toBe(config.supabaseAnonKey)
      expect(client._type).toBe('server')
    })

    it('should call cookies() to get cookie store', async () => {
      const { cookies } = await import('next/headers')
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await createClient(config)

      expect(cookies).toHaveBeenCalled()
    })

    it('should configure cookie handlers', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      await createClient(config)

      const cookieOptions = mockCreateServerClient.mock.calls[0][2]
      expect(cookieOptions.cookies).toBeDefined()
      expect(cookieOptions.cookies.getAll).toBeDefined()
      expect(cookieOptions.cookies.setAll).toBeDefined()
    })

    it('should handle cookies().getAll() errors gracefully', async () => {
      mockCookieStore.getAll.mockImplementationOnce(() => {
        throw new Error('Cookie error')
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = await createClient(config)

      expect(client).toBeDefined()
    })

    it('should handle cookies() failure', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockImplementationOnce(async () => {
        throw new Error('Failed to access cookies')
      })

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = await createClient(config)

      expect(client).toBeDefined()
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

      const client = await createClient<TestDatabase>(config)

      expect(client).toBeDefined()
    })
  })

  describe('createRouteHandlerClient', () => {
    it('should create client with request cookies', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }
      const request = new MockNextRequest() as any

      const client = createRouteHandlerClient(config, request)

      expect(client).toBeDefined()
      expect(client._url).toBe(config.supabaseUrl)
      expect(client._key).toBe(config.supabaseAnonKey)
    })

    it('should use request.cookies.getAll()', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }
      const request = new MockNextRequest() as any

      createRouteHandlerClient(config, request)

      const cookieOptions = mockCreateServerClient.mock.calls[0][2]
      const cookies = cookieOptions.cookies.getAll()

      expect(request.cookies.getAll).toHaveBeenCalled()
    })

    it('should set cookies on response if provided', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }
      const request = new MockNextRequest() as any
      const response = new MockNextResponse() as any

      createRouteHandlerClient(config, request, response)

      const cookieOptions = mockCreateServerClient.mock.calls[0][2]
      cookieOptions.cookies.setAll([
        { name: 'test', value: 'value', options: {} }
      ])

      expect(response.cookies.set).toHaveBeenCalledWith('test', 'value', {})
    })

    it('should handle no response gracefully', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }
      const request = new MockNextRequest() as any

      const client = createRouteHandlerClient(config, request)

      const cookieOptions = mockCreateServerClient.mock.calls[0][2]
      expect(() => {
        cookieOptions.cookies.setAll([
          { name: 'test', value: 'value' }
        ])
      }).not.toThrow()
    })
  })

  describe('createServiceClient', () => {
    it('should create service client with service role key', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
        supabaseServiceRoleKey: 'test-service-role-key',
      }

      const client = createServiceClient(config)

      expect(client).toBeDefined()
      expect(client._url).toBe(config.supabaseUrl)
      expect(client._key).toBe(config.supabaseServiceRoleKey)
      expect(client._type).toBe('service')
    })

    it('should configure auth options for service client', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
        supabaseServiceRoleKey: 'test-service-role-key',
      }

      createServiceClient(config)

      const authOptions = mockCreateSupabaseClient.mock.calls[0][2]
      expect(authOptions.auth.autoRefreshToken).toBe(false)
      expect(authOptions.auth.persistSession).toBe(false)
    })

    it('should support generic Database type', () => {
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
        supabaseServiceRoleKey: 'test-service-role-key',
      }

      const client = createServiceClient<TestDatabase>(config)

      expect(client).toBeDefined()
    })
  })
})
