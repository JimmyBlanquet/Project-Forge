/**
 * LLM Tracer
 *
 * Wraps Anthropic API calls to automatically track:
 * - Cost (tokens × pricing)
 * - Latency
 * - Success/errors
 * - Context (agent, entity)
 *
 * Usage:
 * ```typescript
 * const result = await llmTracer.trace(
 *   'email_classification',
 *   () => anthropic.messages.create({ ... }),
 *   { agentId, entityId: email.id, entityType: 'email' }
 * )
 * ```
 */

import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createLogger } from '@/lib/logger'
import { createHash } from 'crypto'

const logger = createLogger({ module: 'llm-tracer' })

// Anthropic pricing (as of 2025-01)
// https://www.anthropic.com/pricing
const PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 3.0 / 1_000_000, // $3 per million input tokens
    output: 15.0 / 1_000_000, // $15 per million output tokens
  },
  'claude-haiku-4-5': {
    input: 1.0 / 1_000_000, // $1.00 per million input tokens (fixed 2026-01-07)
    output: 5.0 / 1_000_000, // $5.00 per million output tokens (fixed 2026-01-07)
  },
  'claude-haiku-4-5-20251001': {
    input: 1.0 / 1_000_000, // $1.00 per million input tokens (fixed 2026-01-07)
    output: 5.0 / 1_000_000, // $5.00 per million output tokens (fixed 2026-01-07)
  },
  'claude-opus-4-5': {
    input: 15.0 / 1_000_000, // $15 per million input tokens
    output: 75.0 / 1_000_000, // $75 per million output tokens
  },
} as const

export interface TraceContext {
  agentId?: string
  entityId?: string
  entityType?: 'email' | 'lead' | 'generation'
  promptText?: string // For hashing (optional)
  providerName?: string // LLM provider (anthropic, openai, mistral)
}

export interface TraceResult<T = Anthropic.Message> {
  result: T
  traceId: string
  cost: number
  latencyMs: number
}

class LLMTracer {
  private supabase: ReturnType<typeof createClient<Database>> | null = null

  private getSupabase() {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !key) {
        logger.warn('Supabase credentials missing - traces will not be persisted')
        return null
      }

      this.supabase = createClient<Database>(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }

    return this.supabase
  }

  /**
   * Calculate cost based on token usage and model
   * Includes prompt caching adjustments for Anthropic models
   */
  private calculateCost(
    model: string,
    tokensInput: number,
    tokensOutput: number,
    usage?: any // Anthropic.Message.usage with cache fields
  ): number {
    const pricing = PRICING[model as keyof typeof PRICING]

    if (!pricing) {
      logger.warn(`Unknown model pricing: ${model}`)
      return 0
    }

    // Extract cache metrics (Anthropic-specific, undefined for other providers)
    const cacheCreationTokens = usage?.cache_creation_input_tokens || 0
    const cacheReadTokens = usage?.cache_read_input_tokens || 0
    const regularInputTokens = tokensInput - cacheCreationTokens - cacheReadTokens

    // Cost calculation with cache pricing:
    // - Regular input tokens: base price
    // - Cache write (creation): base price + 25%
    // - Cache read: base price - 90% (10% of base price)
    const inputCost =
      regularInputTokens * pricing.input +
      cacheCreationTokens * (pricing.input * 1.25) +
      cacheReadTokens * (pricing.input * 0.1)

    const outputCost = tokensOutput * pricing.output

    return inputCost + outputCost
  }

  /**
   * Hash prompt text for duplicate detection
   */
  private hashPrompt(text: string): string {
    return createHash('sha256').update(text).digest('hex').substring(0, 16)
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Persist trace to database
   */
  private async persistTrace(trace: {
    traceId: string
    operation: string
    model: string
    promptHash?: string
    tokensInput: number
    tokensOutput: number
    latencyMs: number
    cost: number
    agentId?: string
    entityId?: string
    entityType?: string
    providerName?: string
    success: boolean
    errorMessage?: string
    errorType?: string
  }): Promise<void> {
    const supabase = this.getSupabase()

    if (!supabase) {
      // Traces disabled (missing credentials)
      return
    }

    try {
      // TODO: Regenerate types after applying migration to all environments
      const { error } = await (supabase as any).from('llm_traces').insert({
        trace_id: trace.traceId,
        operation: trace.operation,
        model: trace.model,
        prompt_hash: trace.promptHash,
        tokens_input: trace.tokensInput,
        tokens_output: trace.tokensOutput,
        latency_ms: trace.latencyMs,
        cost: trace.cost,
        agent_id: trace.agentId,
        entity_id: trace.entityId,
        entity_type: trace.entityType,
        provider_name: trace.providerName || 'anthropic', // Default to anthropic for backward compatibility
        success: trace.success,
        error_message: trace.errorMessage,
        error_type: trace.errorType,
      })

      if (error) {
        logger.error('Failed to persist trace', {
          error: { name: error.name, message: error.message, stack: error.stack },
        })
      }
    } catch (err: any) {
      logger.error('Failed to persist trace', {
        error: {
          name: err?.name || 'UnknownError',
          message: err?.message || String(err),
          stack: err?.stack,
        },
      })
    }
  }

  /**
   * Trace an LLM operation
   *
   * Wraps an Anthropic API call and automatically tracks metrics.
   *
   * @param operation - Operation name (e.g., 'email_classification')
   * @param fn - Async function that returns Anthropic.Message
   * @param context - Optional context (agent, entity, prompt)
   * @returns Result with trace metadata
   */
  async trace<T extends Anthropic.Message = Anthropic.Message>(
    operation: string,
    fn: () => Promise<T>,
    context?: TraceContext
  ): Promise<TraceResult<T>> {
    const traceId = this.generateTraceId()
    const startTime = Date.now()

    try {
      // Execute LLM call
      const result = await fn()

      // Calculate metrics
      const latencyMs = Date.now() - startTime
      const cost = this.calculateCost(
        result.model,
        result.usage.input_tokens,
        result.usage.output_tokens,
        result.usage // Pass full usage object for cache metrics
      )

      // Extract cache metrics for logging (optional fields)
      const cacheCreationTokens = (result.usage as any).cache_creation_input_tokens || 0
      const cacheReadTokens = (result.usage as any).cache_read_input_tokens || 0

      // Log completion (include cache metrics if present)
      logger.info('llm_completion', {
        traceId,
        operation,
        model: result.model,
        tokensInput: result.usage.input_tokens,
        tokensOutput: result.usage.output_tokens,
        cacheCreation: cacheCreationTokens > 0 ? cacheCreationTokens : undefined,
        cacheRead: cacheReadTokens > 0 ? cacheReadTokens : undefined,
        latencyMs,
        cost: cost.toFixed(6),
      })

      // Persist trace (async, non-blocking)
      this.persistTrace({
        traceId,
        operation,
        model: result.model,
        promptHash: context?.promptText ? this.hashPrompt(context.promptText) : undefined,
        tokensInput: result.usage.input_tokens,
        tokensOutput: result.usage.output_tokens,
        latencyMs,
        cost,
        agentId: context?.agentId,
        entityId: context?.entityId,
        entityType: context?.entityType,
        providerName: context?.providerName,
        success: true,
      }).catch(err => {
        logger.warn('Trace persistence failed (non-blocking)', { error: err })
      })

      return {
        result,
        traceId,
        cost,
        latencyMs,
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      // Determine error type
      let errorType = 'unknown'
      if (error.message?.includes('rate_limit')) {
        errorType = 'rate_limit'
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout'
      } else if (error.status === 401 || error.status === 403) {
        errorType = 'authentication'
      } else if (error.status >= 500) {
        errorType = 'server_error'
      } else if (error.status >= 400) {
        errorType = 'client_error'
      }

      logger.error('llm_error', {
        traceId,
        operation,
        error: error.message,
        errorType,
        latencyMs,
      })

      // Persist error trace (async, non-blocking)
      this.persistTrace({
        traceId,
        operation,
        model: 'unknown',
        tokensInput: 0,
        tokensOutput: 0,
        latencyMs,
        cost: 0,
        agentId: context?.agentId,
        entityId: context?.entityId,
        entityType: context?.entityType,
        providerName: context?.providerName,
        success: false,
        errorMessage: error.message,
        errorType,
      }).catch(err => {
        logger.warn('Error trace persistence failed (non-blocking)', { error: err })
      })

      throw error
    }
  }
}

// Singleton instance
export const llmTracer = new LLMTracer()
