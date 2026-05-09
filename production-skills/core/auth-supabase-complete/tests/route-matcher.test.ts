import { describe, it, expect } from 'vitest'
import {
  isPublicRoute,
  isProtectedRoute,
  createRouteMatcher,
  DEFAULT_PUBLIC_ROUTES,
} from '../src/route-matcher'

describe('route-matcher', () => {
  describe('isPublicRoute', () => {
    it('should return true for root route', () => {
      expect(isPublicRoute('/')).toBe(true)
    })

    it('should return true for exact public routes', () => {
      expect(isPublicRoute('/auth/login')).toBe(true)
      expect(isPublicRoute('/auth/signup')).toBe(true)
      expect(isPublicRoute('/auth/reset-password')).toBe(true)
    })

    it('should return true for paths starting with public routes', () => {
      expect(isPublicRoute('/auth/login/callback')).toBe(true)
      expect(isPublicRoute('/auth/signup/complete')).toBe(true)
    })

    it('should return false for protected routes', () => {
      expect(isPublicRoute('/dashboard')).toBe(false)
      expect(isPublicRoute('/profile')).toBe(false)
      expect(isPublicRoute('/settings')).toBe(false)
    })

    it('should work with custom public routes', () => {
      const customRoutes = ['/', '/public', '/blog']
      expect(isPublicRoute('/blog', customRoutes)).toBe(true)
      expect(isPublicRoute('/blog/post-1', customRoutes)).toBe(true)
      expect(isPublicRoute('/dashboard', customRoutes)).toBe(false)
    })

    it('should not match root with startsWith for non-root paths', () => {
      // Root should only match exact '/', not '/something'
      expect(isPublicRoute('/something')).toBe(false)
    })
  })

  describe('isProtectedRoute', () => {
    it('should return false for public routes', () => {
      expect(isProtectedRoute('/')).toBe(false)
      expect(isProtectedRoute('/auth/login')).toBe(false)
    })

    it('should return true for protected routes', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
      expect(isProtectedRoute('/profile')).toBe(true)
      expect(isProtectedRoute('/settings')).toBe(true)
    })

    it('should work with custom public routes', () => {
      const customRoutes = ['/', '/public']
      expect(isProtectedRoute('/dashboard', customRoutes)).toBe(true)
      expect(isProtectedRoute('/public', customRoutes)).toBe(false)
    })
  })

  describe('createRouteMatcher', () => {
    it('should create custom route matchers', () => {
      const customRoutes = ['/', '/about', '/contact']
      const { isPublic, isProtected } = createRouteMatcher(customRoutes)

      expect(isPublic('/about')).toBe(true)
      expect(isPublic('/contact')).toBe(true)
      expect(isPublic('/dashboard')).toBe(false)

      expect(isProtected('/dashboard')).toBe(true)
      expect(isProtected('/about')).toBe(false)
    })

    it('should handle nested routes', () => {
      const customRoutes = ['/', '/public']
      const { isPublic, isProtected } = createRouteMatcher(customRoutes)

      expect(isPublic('/public/blog')).toBe(true)
      expect(isPublic('/public/blog/post-1')).toBe(true)
      expect(isProtected('/private/data')).toBe(true)
    })
  })

  describe('DEFAULT_PUBLIC_ROUTES', () => {
    it('should include common auth routes', () => {
      expect(DEFAULT_PUBLIC_ROUTES).toContain('/')
      expect(DEFAULT_PUBLIC_ROUTES).toContain('/auth/login')
      expect(DEFAULT_PUBLIC_ROUTES).toContain('/auth/signup')
      expect(DEFAULT_PUBLIC_ROUTES).toContain('/auth/callback')
      expect(DEFAULT_PUBLIC_ROUTES).toContain('/auth/reset-password')
    })
  })
})
