/**
 * Classification Logger
 *
 * Specialized logger for Feature 004 - Smart Inbox & Classification IA
 * Structured logging for AI classification operations with cost tracking
 */

import { createLogger } from './index'
import type { LogContext } from './types'

const baseLogger = createLogger({ module: 'classification' })

/**
 * Classification operation context
 */
export interface ClassificationLogContext extends LogContext {
  email_id?: string
  connection_id?: string
  classification_type?: 'acheteur' | 'vendeur' | 'autre'
  confidence_score?: number
  intent_type?: string | null
  urgency_level?: 'haute' | 'normale' | 'basse'
  manually_corrected?: boolean
  tokens_input?: number
  tokens_output?: number
  generation_time_ms?: number
  model_used?: string
  // error is inherited from LogContext
}

/**
 * Thread summary operation context
 */
export interface ThreadSummaryLogContext extends LogContext {
  thread_id?: string
  connection_id?: string
  message_count?: number
  summary_length?: number
  key_points_count?: number
  tokens_input?: number
  tokens_output?: number
  generation_time_ms?: number
  model_used?: string
  // error is inherited from LogContext
}

/**
 * Batch operation context
 */
export interface BatchLogContext extends LogContext {
  batch_size?: number
  batch_index?: number
  total_batches?: number
  success_count?: number
  error_count?: number
  total_tokens_input?: number
  total_tokens_output?: number
  total_time_ms?: number
  // error is inherited from LogContext
}

/**
 * Classification Logger
 *
 * Provides specialized logging methods for AI classification operations
 */
export const classificationLogger = {
  /**
   * Log email classification start
   */
  classificationStarted: (ctx: ClassificationLogContext) => {
    baseLogger.info('Email classification started', {
      email_id: ctx.email_id,
      connection_id: ctx.connection_id,
    })
  },

  /**
   * Log email classification success
   */
  classificationCompleted: (ctx: ClassificationLogContext) => {
    baseLogger.info('Email classification completed', {
      email_id: ctx.email_id,
      classification_type: ctx.classification_type,
      confidence_score: ctx.confidence_score,
      intent_type: ctx.intent_type,
      urgency_level: ctx.urgency_level,
      tokens_input: ctx.tokens_input,
      tokens_output: ctx.tokens_output,
      generation_time_ms: ctx.generation_time_ms,
      model_used: ctx.model_used,
    })
  },

  /**
   * Log email classification failure
   */
  classificationFailed: (ctx: ClassificationLogContext) => {
    baseLogger.error('Email classification failed', {
      email_id: ctx.email_id,
      error: ctx.error,
      generation_time_ms: ctx.generation_time_ms,
    })
  },

  /**
   * Log manual classification correction
   */
  classificationCorrected: (ctx: ClassificationLogContext) => {
    baseLogger.info('Email classification corrected manually', {
      email_id: ctx.email_id,
      original_type: ctx.classification_type, // Original AI classification
      corrected_type: ctx.urgency_level, // Reusing field for corrected type
      manually_corrected: true,
    })
  },

  /**
   * Log thread summary start
   */
  threadSummaryStarted: (ctx: ThreadSummaryLogContext) => {
    baseLogger.info('Thread summary generation started', {
      thread_id: ctx.thread_id,
      connection_id: ctx.connection_id,
      message_count: ctx.message_count,
    })
  },

  /**
   * Log thread summary success
   */
  threadSummaryCompleted: (ctx: ThreadSummaryLogContext) => {
    baseLogger.info('Thread summary generation completed', {
      thread_id: ctx.thread_id,
      message_count: ctx.message_count,
      summary_length: ctx.summary_length,
      key_points_count: ctx.key_points_count,
      tokens_input: ctx.tokens_input,
      tokens_output: ctx.tokens_output,
      generation_time_ms: ctx.generation_time_ms,
      model_used: ctx.model_used,
    })
  },

  /**
   * Log thread summary failure
   */
  threadSummaryFailed: (ctx: ThreadSummaryLogContext) => {
    baseLogger.error('Thread summary generation failed', {
      thread_id: ctx.thread_id,
      message_count: ctx.message_count,
      error: ctx.error,
      generation_time_ms: ctx.generation_time_ms,
    })
  },

  /**
   * Log batch classification start
   */
  batchClassificationStarted: (ctx: BatchLogContext) => {
    baseLogger.info('Batch classification started', {
      batch_size: ctx.batch_size,
      total_batches: ctx.total_batches,
    })
  },

  /**
   * Log batch classification progress
   */
  batchClassificationProgress: (ctx: BatchLogContext) => {
    baseLogger.info('Batch classification progress', {
      batch_index: ctx.batch_index,
      total_batches: ctx.total_batches,
      batch_size: ctx.batch_size,
    })
  },

  /**
   * Log batch classification completed
   */
  batchClassificationCompleted: (ctx: BatchLogContext) => {
    baseLogger.info('Batch classification completed', {
      batch_size: ctx.batch_size,
      total_batches: ctx.total_batches,
      success_count: ctx.success_count,
      error_count: ctx.error_count,
      total_tokens_input: ctx.total_tokens_input,
      total_tokens_output: ctx.total_tokens_output,
      total_time_ms: ctx.total_time_ms,
    })
  },

  /**
   * Log batch classification failure
   */
  batchClassificationFailed: (ctx: BatchLogContext) => {
    baseLogger.error('Batch classification failed', {
      batch_index: ctx.batch_index,
      batch_size: ctx.batch_size,
      error: ctx.error,
    })
  },

  /**
   * Log low confidence classification (< 50%)
   */
  lowConfidenceDetected: (ctx: ClassificationLogContext) => {
    baseLogger.warn('Low confidence classification detected', {
      email_id: ctx.email_id,
      classification_type: ctx.classification_type,
      confidence_score: ctx.confidence_score,
      // This may indicate need for manual review
    })
  },

  /**
   * Log API cost metrics (for monitoring)
   */
  apiCostMetrics: (ctx: {
    operation: string
    model_used: string
    tokens_input: number
    tokens_output: number
    estimated_cost_usd: number
  }) => {
    baseLogger.info('AI API cost metrics', ctx)
  },

  /**
   * Log rate limit warning
   */
  rateLimitWarning: (ctx: { endpoint: string; retry_after_ms: number }) => {
    baseLogger.warn('Rate limit approaching', ctx)
  },

  /**
   * Generic debug log for classification operations
   */
  debug: (message: string, ctx?: ClassificationLogContext) => {
    baseLogger.debug(message, ctx)
  },

  /**
   * Generic info log for classification operations
   */
  info: (message: string, ctx?: ClassificationLogContext) => {
    baseLogger.info(message, ctx)
  },

  /**
   * Generic warning log for classification operations
   */
  warn: (message: string, ctx?: ClassificationLogContext) => {
    baseLogger.warn(message, ctx)
  },

  /**
   * Generic error log for classification operations
   */
  error: (message: string, ctx?: ClassificationLogContext) => {
    baseLogger.error(message, ctx)
  },
}

/**
 * Calculate estimated API cost (Claude Haiku 4.5 pricing)
 *
 * Haiku pricing: $1 per M input tokens, $5 per M output tokens
 */
export function calculateEstimatedCost(tokensInput: number, tokensOutput: number): number {
  const inputCostPerMillion = 1.0 // $1 per M tokens
  const outputCostPerMillion = 5.0 // $5 per M tokens

  const inputCost = (tokensInput / 1_000_000) * inputCostPerMillion
  const outputCost = (tokensOutput / 1_000_000) * outputCostPerMillion

  return inputCost + outputCost
}
