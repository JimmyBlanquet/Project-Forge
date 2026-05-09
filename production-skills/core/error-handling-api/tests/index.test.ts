import { describe, it, expect } from 'vitest'
import { apiError } from '../src'

describe('error-handling-api', () => {
  it('should export apiError', () => {
    expect(apiError).toBeDefined()
  })

  // TODO: Add more tests
  it.todo('should handle basic use case')
  it.todo('should handle edge cases')
  it.todo('should handle errors gracefully')
})
