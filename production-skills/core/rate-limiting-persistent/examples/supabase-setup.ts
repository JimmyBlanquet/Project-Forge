/**
 * Supabase Rate Limiting Setup Example
 *
 * This example shows how to configure persistent rate limiting with Supabase.
 * Benefits:
 * - Survives server restarts and cold starts
 * - Consistent across multiple server instances
 * - Automatic fallback to in-memory if Supabase is down
 *
 * Prerequisites:
 * - Supabase project set up
 * - PostgreSQL function `increment_rate_limit` installed (see POSTGRESQL_SETUP.md)
 * - Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import {
  configureRateLimitStorage,
  SupabaseRateLimitProvider,
  checkRateLimit,
  checkGenerationRateLimit,
  checkCrudRateLimit,
} from '../src'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Configure the storage provider ONCE at app startup
const provider = new SupabaseRateLimitProvider(supabase)
configureRateLimitStorage(provider)

console.log('✓ Rate limiting configured with Supabase storage')

async function supabaseExample() {
  console.log('=== Supabase Persistent Rate Limiting ===\n')

  // Example 1: Custom rate limit with persistence
  console.log('Example 1: Custom rate limit')
  const result1 = await checkRateLimit('user123', {
    action: 'api_call',
    maxRequests: 100,
    windowSeconds: 3600, // 1 hour
  })

  console.log(`  Allowed: ${result1.allowed}`)
  console.log(`  Remaining: ${result1.remaining}/100`)
  console.log(`  Window resets: ${new Date(result1.resetAt).toLocaleString()}`)
  console.log()

  // Example 2: Different users have independent limits
  console.log('Example 2: User isolation')
  const userA = await checkCrudRateLimit('user_a')
  const userB = await checkCrudRateLimit('user_b')
  console.log(`  User A remaining: ${userA.remaining}/60`)
  console.log(`  User B remaining: ${userB.remaining}/60`)
  console.log()

  // Example 3: Different actions have independent limits
  console.log('Example 3: Action isolation')
  const gen = await checkGenerationRateLimit('user123')
  const crud = await checkCrudRateLimit('user123')
  console.log(`  User 123 - Generation remaining: ${gen.remaining}/10`)
  console.log(`  User 123 - CRUD remaining: ${crud.remaining}/60`)
  console.log()

  // Example 4: Handling rate limit exceeded
  console.log('Example 4: Rate limit exceeded handling')
  const result = await checkRateLimit('user789', {
    action: 'expensive_op',
    maxRequests: 5,
    windowSeconds: 60,
  })

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
    console.log(`  ✗ Rate limit exceeded!`)
    console.log(`  Retry after: ${retryAfter} seconds`)
    // In a real API, you would return:
    // return Response.json(
    //   { error: 'Rate limit exceeded', retryAfter },
    //   { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
    // )
  } else {
    console.log(`  ✓ Request allowed (${result.remaining} remaining)`)
  }
}

// Run the example
supabaseExample().catch(console.error)
