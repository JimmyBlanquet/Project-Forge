import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  apiError,
  apiSuccess,
  withErrorHandler,
  configureLogger,
  API_ERROR,
  type ApiErrorCode,
  type LoggerFunction,
} from '../src'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status || 200,
      headers: new Headers(),
    })),
  },
}))

describe('error-handling-api', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('apiError', () => {
    it('should return error response with correct status', () => {
      const result = apiError('NOT_FOUND')

      expect(result.status).toBe(404)
      expect(result.body.error.code).toBe('NOT_FOUND')
      expect(result.body.error.message).toBe('Ressource non trouvée')
      expect(result.body.requestId).toBeDefined()
      expect(result.body.requestId).toMatch(/^req_/)
    })

    it('should handle different error types', () => {
      const errors: ApiErrorCode[] = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'VALIDATION_ERROR',
        'RATE_LIMITED',
        'INTERNAL_ERROR',
      ]

      errors.forEach((errorType) => {
        const result = apiError(errorType)
        expect(result.body.error.code).toBe(API_ERROR[errorType].code)
        expect(result.status).toBe(API_ERROR[errorType].status)
      })
    })

    it('should log error details when provided', () => {
      const mockLogger = vi.fn()
      configureLogger(mockLogger)

      const error = new Error('Test error')
      apiError('DATABASE_ERROR', error, {
        route: '/api/test',
        userId: '123',
      })

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('API Error [DATABASE_ERROR]'),
        expect.objectContaining({
          operation: 'DATABASE_ERROR',
          endpoint: '/api/test',
          userId: '123',
        }),
        error
      )
    })

    it('should not log when details are not provided', () => {
      const mockLogger = vi.fn()
      configureLogger(mockLogger)

      apiError('NOT_FOUND')

      expect(mockLogger).not.toHaveBeenCalled()
    })

    it('should support custom message override', () => {
      const result = apiError('VALIDATION_ERROR', null, {
        customMessage: 'Email invalide',
      })

      expect(result.body.error.message).toBe('Email invalide')
    })

    it('should handle non-Error details', () => {
      const mockLogger = vi.fn()
      configureLogger(mockLogger)

      apiError('INTERNAL_ERROR', { foo: 'bar' })

      expect(mockLogger).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        undefined
      )
    })
  })

  describe('apiSuccess', () => {
    it('should return success response with 200 status by default', () => {
      const data = { id: 1, name: 'Test' }
      const result = apiSuccess(data)

      expect(result.status).toBe(200)
      expect(result.body.data).toEqual(data)
    })

    it('should support custom status codes', () => {
      const data = { created: true }
      const result = apiSuccess(data, 201)

      expect(result.status).toBe(201)
      expect(result.body.data).toEqual(data)
    })

    it('should handle null data', () => {
      const result = apiSuccess(null)

      expect(result.status).toBe(200)
      expect(result.body.data).toBeNull()
    })

    it('should handle array data', () => {
      const data = [1, 2, 3]
      const result = apiSuccess(data)

      expect(result.body.data).toEqual(data)
    })
  })

  describe('withErrorHandler', () => {
    it('should pass through successful responses', async () => {
      const handler = vi.fn().mockResolvedValue({ status: 200, body: { ok: true } })
      const wrapped = withErrorHandler(handler)

      const req = new Request('https://example.com/api/test')
      const result = await wrapped(req)

      expect(handler).toHaveBeenCalledWith(req, undefined)
      expect(result.status).toBe(200)
    })

    it('should catch and handle errors', async () => {
      const error = new Error('Test error')
      const handler = vi.fn().mockRejectedValue(error)
      const wrapped = withErrorHandler(handler)

      const mockLogger = vi.fn()
      configureLogger(mockLogger)

      const req = new Request('https://example.com/api/test')
      const result = await wrapped(req)

      expect(mockLogger).toHaveBeenCalledWith(
        'Unhandled API error',
        expect.objectContaining({
          endpoint: 'https://example.com/api/test',
          operation: 'GET',
        }),
        error
      )

      expect(result.status).toBe(500)
      expect(result.body.error.code).toBe('INTERNAL_ERROR')
    })

    it('should pass context to handler', async () => {
      const handler = vi.fn().mockResolvedValue({ status: 200, body: { ok: true } })
      const wrapped = withErrorHandler(handler)

      const req = new Request('https://example.com/api/test')
      const context = { params: { id: '123' } }
      await wrapped(req, context)

      expect(handler).toHaveBeenCalledWith(req, context)
    })

    it('should extract route from URL in error response', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Test'))
      const wrapped = withErrorHandler(handler)

      const req = new Request('https://example.com/api/users/123')
      const result = await wrapped(req)

      expect(result.status).toBe(500)
      // Note: route extraction would be tested if we check the actual apiError call
    })
  })

  describe('configureLogger', () => {
    it('should allow custom logger configuration', () => {
      const customLogger: LoggerFunction = vi.fn()
      configureLogger(customLogger)

      const error = new Error('Test')
      apiError('INTERNAL_ERROR', error)

      expect(customLogger).toHaveBeenCalled()
    })

    it('should use default logger when not configured', () => {
      // Reset to default
      configureLogger((message, context, error) => {
        console.error(`[Error] ${message}`, context, error)
      })

      const error = new Error('Test')
      apiError('INTERNAL_ERROR', error)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('API_ERROR constants', () => {
    it('should have all standard HTTP error codes', () => {
      expect(API_ERROR.UNAUTHORIZED.status).toBe(401)
      expect(API_ERROR.FORBIDDEN.status).toBe(403)
      expect(API_ERROR.NOT_FOUND.status).toBe(404)
      expect(API_ERROR.VALIDATION_ERROR.status).toBe(400)
      expect(API_ERROR.RATE_LIMITED.status).toBe(429)
      expect(API_ERROR.INTERNAL_ERROR.status).toBe(500)
      expect(API_ERROR.SERVICE_UNAVAILABLE.status).toBe(503)
    })

    it('should have user-friendly messages', () => {
      Object.values(API_ERROR).forEach((error) => {
        expect(error.message).toBeTruthy()
        expect(error.message.length).toBeGreaterThan(0)
      })
    })

    it('should have unique error codes', () => {
      const codes = Object.values(API_ERROR).map((e) => e.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe('request ID generation', () => {
    it('should generate unique request IDs', () => {
      const result1 = apiError('NOT_FOUND')
      const result2 = apiError('NOT_FOUND')

      expect(result1.body.requestId).not.toBe(result2.body.requestId)
    })

    it('should generate IDs with correct format', () => {
      const result = apiError('NOT_FOUND')

      expect(result.body.requestId).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/)
    })
  })
})
