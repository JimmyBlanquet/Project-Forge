import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '../src/client'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url, key) => ({
    _url: url,
    _key: key,
    _type: 'browser',
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  })),
}))

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createClient', () => {
    it('should create a browser client with config', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = createClient(config)

      expect(client).toBeDefined()
      expect(client._url).toBe(config.supabaseUrl)
      expect(client._key).toBe(config.supabaseAnonKey)
      expect(client._type).toBe('browser')
    })

    it('should create client with generic Database type', () => {
      interface TestDatabase {
        public: {
          tables: {
            users: {
              Row: { id: string; email: string }
            }
          }
        }
      }

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = createClient<TestDatabase>(config)

      expect(client).toBeDefined()
      // TypeScript compilation validates the generic type works
    })

    it('should have auth methods', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = createClient(config)

      expect(client.auth.signInWithPassword).toBeDefined()
      expect(client.auth.signUp).toBeDefined()
      expect(client.auth.signOut).toBeDefined()
      expect(client.auth.getUser).toBeDefined()
    })

    it('should have database query methods', () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      }

      const client = createClient(config)

      expect(client.from).toBeDefined()
      expect(typeof client.from).toBe('function')
    })
  })
})
