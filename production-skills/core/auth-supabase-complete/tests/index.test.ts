import { describe, it, expect } from 'vitest'
import * as AuthModule from '../src'

describe('index exports', () => {
  it('should export createClient from client module', () => {
    expect(AuthModule.createClient).toBeDefined()
    expect(typeof AuthModule.createClient).toBe('function')
  })

  it('should export server client functions', () => {
    expect(AuthModule.createServerClient).toBeDefined()
    expect(typeof AuthModule.createServerClient).toBe('function')

    expect(AuthModule.createRouteHandlerClient).toBeDefined()
    expect(typeof AuthModule.createRouteHandlerClient).toBe('function')

    expect(AuthModule.createServiceClient).toBeDefined()
    expect(typeof AuthModule.createServiceClient).toBe('function')
  })

  it('should export auth utility functions', () => {
    expect(AuthModule.signOut).toBeDefined()
    expect(typeof AuthModule.signOut).toBe('function')

    expect(AuthModule.getUser).toBeDefined()
    expect(typeof AuthModule.getUser).toBe('function')

    expect(AuthModule.getProfile).toBeDefined()
    expect(typeof AuthModule.getProfile).toBe('function')

    expect(AuthModule.getUserWithProfile).toBeDefined()
    expect(typeof AuthModule.getUserWithProfile).toBe('function')

    expect(AuthModule.getSupabaseClient).toBeDefined()
    expect(typeof AuthModule.getSupabaseClient).toBe('function')
  })

  it('should export API middleware functions', () => {
    expect(AuthModule.requireAuth).toBeDefined()
    expect(typeof AuthModule.requireAuth).toBe('function')

    expect(AuthModule.requireAdminAuth).toBeDefined()
    expect(typeof AuthModule.requireAdminAuth).toBe('function')
  })

  it('should export route matching functions', () => {
    expect(AuthModule.isPublicRoute).toBeDefined()
    expect(typeof AuthModule.isPublicRoute).toBe('function')

    expect(AuthModule.isProtectedRoute).toBeDefined()
    expect(typeof AuthModule.isProtectedRoute).toBe('function')

    expect(AuthModule.createRouteMatcher).toBeDefined()
    expect(typeof AuthModule.createRouteMatcher).toBe('function')

    expect(AuthModule.DEFAULT_PUBLIC_ROUTES).toBeDefined()
    expect(Array.isArray(AuthModule.DEFAULT_PUBLIC_ROUTES)).toBe(true)
  })

  it('should have correct number of exports', () => {
    const exports = Object.keys(AuthModule)
    // 1 client + 3 server + 5 auth + 2 middleware + 4 route matcher = 15 exports
    expect(exports.length).toBeGreaterThanOrEqual(15)
  })
})
