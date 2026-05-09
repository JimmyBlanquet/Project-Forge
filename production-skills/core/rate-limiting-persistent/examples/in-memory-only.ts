/**
 * Basic In-Memory Rate Limiting Example
 *
 * This example shows how to use the rate limiter without any persistent storage.
 * Perfect for:
 * - Development/testing environments
 * - Small applications without database
 * - Serverless functions with short lifetimes
 *
 * NOTE: In-memory limits reset on server restart/cold starts
 */

import {
  checkRateLimit,
  checkGenerationRateLimit,
  checkReadRateLimit,
} from '../src'

async function basicInMemoryExample() {
  console.log('=== Basic In-Memory Rate Limiting ===\n')

  // Example 1: Custom rate limit configuration
  const result1 = await checkRateLimit('user123', {
    action: 'custom_action',
    maxRequests: 5,
    windowSeconds: 60,
  })

  console.log('Custom rate limit check:')
  console.log(`  Allowed: ${result1.allowed}`)
  console.log(`  Remaining: ${result1.remaining}`)
  console.log(`  Resets at: ${new Date(result1.resetAt).toISOString()}`)
  console.log()

  // Example 2: Using pre-configured limiters
  console.log('Using pre-configured limiters:')

  // High-frequency reads (100 req/min)
  const readResult = await checkReadRateLimit('user123')
  console.log(`  Read operations - Remaining: ${readResult.remaining}/100`)

  // AI generation (10 req/min)
  const genResult = await checkGenerationRateLimit('user123')
  console.log(`  AI generation - Remaining: ${genResult.remaining}/10`)
  console.log()

  // Example 3: Testing rate limit exhaustion
  console.log('Testing rate limit exhaustion (max 3 requests):')
  for (let i = 1; i <= 5; i++) {
    const result = await checkRateLimit('user456', {
      action: 'test',
      maxRequests: 3,
      windowSeconds: 60,
    })
    console.log(
      `  Request ${i}: ${result.allowed ? '✓ Allowed' : '✗ Blocked'} (remaining: ${result.remaining})`
    )
  }
}

// Run the example
basicInMemoryExample().catch(console.error)
