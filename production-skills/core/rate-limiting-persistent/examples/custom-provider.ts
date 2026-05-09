/**
 * Custom Storage Provider Example
 *
 * This example shows how to implement a custom storage provider for rate limiting.
 * We'll create a Redis provider as an example, but you can use the same pattern
 * for DynamoDB, MongoDB, or any other storage backend.
 *
 * The provider interface is simple:
 * - Implement `checkAndIncrement(key, maxRequests, windowSeconds)`
 * - Return `RateLimitResult | null`
 * - Returning `null` triggers automatic fallback to in-memory
 */

import type { RateLimitStorageProvider, RateLimitResult } from '../src'
import { configureRateLimitStorage, checkRateLimit } from '../src'

// ============================================================================
// Example 1: Redis Provider Implementation
// ============================================================================

/**
 * Redis-based rate limit storage provider
 *
 * Uses Redis INCR and EXPIRE for atomic rate limiting
 * Requires: npm install redis
 */
class RedisRateLimitProvider implements RateLimitStorageProvider {
  constructor(private redis: any) {}

  async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null> {
    try {
      // Get current count
      const count = await this.redis.incr(key)

      // Set expiration on first request
      if (count === 1) {
        await this.redis.expire(key, windowSeconds)
      }

      // Get TTL to calculate resetAt
      const ttl = await this.redis.ttl(key)
      const resetAt = Date.now() + ttl * 1000

      // Check if limit exceeded
      if (count > maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt,
        }
      }

      return {
        allowed: true,
        remaining: maxRequests - count,
        resetAt,
      }
    } catch (error) {
      console.error('[RateLimit] Redis error:', error)
      return null // Fallback to in-memory
    }
  }
}

// Setup example:
async function setupRedisProvider() {
  // Using ioredis or node-redis
  // const redis = new Redis({ host: 'localhost', port: 6379 })
  // const provider = new RedisRateLimitProvider(redis)
  // configureRateLimitStorage(provider)
  console.log('✓ Redis provider configured')
}

// ============================================================================
// Example 2: DynamoDB Provider Implementation
// ============================================================================

/**
 * DynamoDB-based rate limit storage provider
 *
 * Uses DynamoDB UpdateItem with conditional expressions
 * Requires: @aws-sdk/client-dynamodb
 */
class DynamoDBRateLimitProvider implements RateLimitStorageProvider {
  constructor(
    private dynamodb: any,
    private tableName: string
  ) {}

  async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const resetAt = now + windowSeconds

      // Try to increment counter atomically
      const response = await this.dynamodb.updateItem({
        TableName: this.tableName,
        Key: { key: { S: key } },
        UpdateExpression:
          'SET #count = if_not_exists(#count, :zero) + :incr, #resetAt = if_not_exists(#resetAt, :resetAt), #ttl = :ttl',
        ExpressionAttributeNames: {
          '#count': 'count',
          '#resetAt': 'resetAt',
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':zero': { N: '0' },
          ':incr': { N: '1' },
          ':resetAt': { N: resetAt.toString() },
          ':ttl': { N: resetAt.toString() },
        },
        ReturnValues: 'ALL_NEW',
      })

      const count = parseInt(response.Attributes.count.N)
      const itemResetAt = parseInt(response.Attributes.resetAt.N) * 1000

      // Check if window expired
      if (now * 1000 > itemResetAt) {
        // Reset the counter
        await this.dynamodb.putItem({
          TableName: this.tableName,
          Key: { key: { S: key } },
          Item: {
            key: { S: key },
            count: { N: '1' },
            resetAt: { N: (now + windowSeconds).toString() },
            ttl: { N: (now + windowSeconds).toString() },
          },
        })
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: (now + windowSeconds) * 1000,
        }
      }

      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAt: itemResetAt,
      }
    } catch (error) {
      console.error('[RateLimit] DynamoDB error:', error)
      return null // Fallback to in-memory
    }
  }
}

// ============================================================================
// Example 3: MongoDB Provider Implementation
// ============================================================================

/**
 * MongoDB-based rate limit storage provider
 *
 * Uses MongoDB findOneAndUpdate with upsert
 * Requires: mongodb
 */
class MongoDBRateLimitProvider implements RateLimitStorageProvider {
  constructor(
    private collection: any // MongoDB collection
  ) {}

  async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null> {
    try {
      const now = new Date()
      const resetAt = new Date(now.getTime() + windowSeconds * 1000)

      // Try to find existing entry
      const existing = await this.collection.findOne({
        key,
        resetAt: { $gt: now },
      })

      if (existing) {
        // Window still active
        if (existing.count >= maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: existing.resetAt.getTime(),
          }
        }

        // Increment counter
        const updated = await this.collection.findOneAndUpdate(
          { key, resetAt: { $gt: now } },
          { $inc: { count: 1 } },
          { returnDocument: 'after' }
        )

        return {
          allowed: true,
          remaining: maxRequests - updated.count,
          resetAt: updated.resetAt.getTime(),
        }
      }

      // Create new window
      await this.collection.insertOne({
        key,
        count: 1,
        resetAt,
        createdAt: now,
      })

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: resetAt.getTime(),
      }
    } catch (error) {
      console.error('[RateLimit] MongoDB error:', error)
      return null // Fallback to in-memory
    }
  }
}

// ============================================================================
// Example 4: Combining Multiple Providers (Tiered Fallback)
// ============================================================================

/**
 * Multi-tier provider that tries Redis first, then Supabase, then in-memory
 */
class TieredRateLimitProvider implements RateLimitStorageProvider {
  constructor(
    private providers: RateLimitStorageProvider[]
  ) {}

  async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null> {
    for (const provider of this.providers) {
      const result = await provider.checkAndIncrement(key, maxRequests, windowSeconds)
      if (result !== null) {
        return result
      }
    }
    return null // All providers failed, trigger built-in fallback
  }
}

// Usage:
async function setupTieredProvider() {
  // const redisProvider = new RedisRateLimitProvider(redis)
  // const supabaseProvider = new SupabaseRateLimitProvider(supabase)
  // const tieredProvider = new TieredRateLimitProvider([redisProvider, supabaseProvider])
  // configureRateLimitStorage(tieredProvider)
  console.log('✓ Tiered provider configured')
}

// ============================================================================
// Example 5: Using Custom Providers
// ============================================================================

async function customProviderExample() {
  console.log('=== Custom Provider Example ===\n')

  // Option 1: Redis
  // const redis = new Redis()
  // const redisProvider = new RedisRateLimitProvider(redis)
  // configureRateLimitStorage(redisProvider)

  // Option 2: DynamoDB
  // const dynamodb = new DynamoDBClient({ region: 'us-east-1' })
  // const dynamoProvider = new DynamoDBRateLimitProvider(dynamodb, 'rate-limits')
  // configureRateLimitStorage(dynamoProvider)

  // Option 3: MongoDB
  // const mongodb = await MongoClient.connect('mongodb://localhost:27017')
  // const collection = mongodb.db('app').collection('rate_limits')
  // const mongoProvider = new MongoDBRateLimitProvider(collection)
  // configureRateLimitStorage(mongoProvider)

  // Now use it normally
  const result = await checkRateLimit('user123', {
    action: 'api_call',
    maxRequests: 100,
    windowSeconds: 60,
  })

  console.log(`Allowed: ${result.allowed}`)
  console.log(`Remaining: ${result.remaining}`)
}

// Export providers for reuse
export { RedisRateLimitProvider, DynamoDBRateLimitProvider, MongoDBRateLimitProvider }
