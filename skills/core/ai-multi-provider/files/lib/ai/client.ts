import type { GenerateParams, GenerateResult, LLMProvider } from './providers/base'
import { createProviders } from './providers/factory'
import { AI_CONFIG } from './config'
import { llmTracer } from './tracer'
import { createLogger } from '@/lib/logger'
import { keywordBasedClassification } from './fallback'

const logger = createLogger({ module: 'llm-client' })

/**
 * Circuit breaker state per provider
 * Tracks retry attempts to prevent infinite loops
 */
interface CircuitBreakerState {
  retries: number
  lastAttempt: number
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

/**
 * Check if circuit breaker allows request for provider
 *
 * @param providerName - Provider name
 * @returns true if request is allowed, false if circuit breaker is open
 */
function canAttemptProvider(providerName: string): boolean {
  const state = circuitBreakers.get(providerName)
  if (!state) {
    return true
  }

  // Reset circuit breaker after 5 minutes
  const RESET_WINDOW_MS = 5 * 60 * 1000
  if (Date.now() - state.lastAttempt > RESET_WINDOW_MS) {
    circuitBreakers.delete(providerName)
    return true
  }

  return state.retries < AI_CONFIG.retryConfig.maxRetriesPerProvider
}

/**
 * Record failed attempt for circuit breaker
 *
 * @param providerName - Provider name
 */
function recordFailedAttempt(providerName: string): void {
  const state = circuitBreakers.get(providerName) || { retries: 0, lastAttempt: 0 }
  state.retries += 1
  state.lastAttempt = Date.now()
  circuitBreakers.set(providerName, state)

  logger.debug('Recorded failed attempt', {
    provider: providerName,
    retries: state.retries,
    maxRetries: AI_CONFIG.retryConfig.maxRetriesPerProvider,
  })
}

/**
 * Reset circuit breaker for provider (on success)
 *
 * @param providerName - Provider name
 */
function resetCircuitBreaker(providerName: string): void {
  circuitBreakers.delete(providerName)
}

/**
 * Unified LLM Client
 *
 * Provider-agnostic interface for LLM operations.
 * Automatically selects the appropriate provider based on:
 * 1. Task type (via AI_CONFIG.providerForTask)
 * 2. Model name (inferred from model string)
 * 3. Default provider (via AI_CONFIG.defaultProvider)
 *
 * Features:
 * - Multi-provider support (Anthropic, OpenAI, Mistral)
 * - Task-based routing for cost optimization
 * - Automatic fallback chain (US2 - to be implemented)
 * - Integrated cost and latency tracking
 *
 * @example
 * ```typescript
 * import { llmClient } from '@/lib/ai/client'
 * import { TaskName } from '@/lib/ai/providers/base'
 *
 * // Task-based routing (uses AI_CONFIG.providerForTask)
 * const result = await llmClient.generate({
 *   model: 'claude-haiku-4-5',
 *   prompt: 'Classify this email...',
 *   systemPrompt: EMAIL_CLASSIFICATION_PROMPT,
 *   task: TaskName.EmailClassification, // Routes to configured provider for this task
 * })
 *
 * // Direct provider selection (via model name)
 * const result = await llmClient.generate({
 *   model: 'gpt-4o', // Automatically uses OpenAI provider
 *   prompt: 'Generate response...',
 * })
 * ```
 */
export class LLMClient {
  private providers: Map<string, LLMProvider>

  constructor() {
    this.providers = createProviders()
    logger.info('LLM Client initialized', {
      availableProviders: Array.from(this.providers.keys()),
      defaultProvider: AI_CONFIG.defaultProvider,
    })
  }

  /**
   * Generate LLM completion
   *
   * Selects provider based on task configuration or model name,
   * executes generation, and tracks metrics via llmTracer.
   *
   * @param params - Generation parameters
   * @param traceContext - Optional trace context for observability
   * @returns Generation result with content, tokens, latency, and cost
   * @throws Error if provider unavailable or generation fails
   */
  async generate(
    params: GenerateParams,
    traceContext?: {
      operation?: string
      agentId?: string
      entityId?: string
      entityType?: 'email' | 'lead' | 'generation'
    }
  ): Promise<GenerateResult> {
    // Select provider based on task or model
    const providerName = this.selectProvider(params)
    const provider = this.providers.get(providerName)

    if (!provider) {
      const availableProviders = Array.from(this.providers.keys())
      throw new Error(
        `Provider "${providerName}" not available. Available providers: ${availableProviders.join(', ')}`
      )
    }

    logger.info('Generating content', {
      provider: providerName,
      model: params.model,
      task: params.task,
      operation: traceContext?.operation,
    })

    try {
      // Execute generation with timeout
      const result = await this.executeWithTimeout(provider, params, providerName)

      // Reset circuit breaker on success
      resetCircuitBreaker(providerName)

      // Trace to llm_traces table (async, non-blocking)
      if (traceContext?.operation) {
        llmTracer
          .trace(
            traceContext.operation,
            async () => {
              // Return a mock Anthropic.Message for tracer compatibility
              // TODO: Update tracer in US2 to accept GenerateResult directly
              return {
                id: 'mock',
                type: 'message',
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: result.content,
                  },
                ],
                model: result.model,
                stop_reason: 'end_turn',
                stop_sequence: null,
                usage: {
                  input_tokens: result.tokensInput,
                  output_tokens: result.tokensOutput,
                },
              } as any // Type assertion to bypass strict Anthropic.Message typing
            },
            {
              agentId: traceContext.agentId,
              entityId: traceContext.entityId,
              entityType: traceContext.entityType,
              promptText: params.prompt,
              providerName,
            }
          )
          .catch(err => {
            logger.warn('Trace persistence failed (non-blocking)', { error: err })
          })
      }

      return result
    } catch (error: any) {
      // Record failed attempt for circuit breaker
      recordFailedAttempt(providerName)

      logger.warn('Primary provider failed, trying fallback chain', {
        provider: providerName,
        model: params.model,
        error: {
          name: error?.name || 'UnknownError',
          message: error?.message || String(error),
        },
      })

      // Try fallback chain
      return await this.generateWithFallback(params, providerName)
    }
  }

  /**
   * Execute provider generation with timeout
   *
   * @param provider - LLM provider instance
   * @param params - Generation parameters
   * @param providerName - Provider name (for logging)
   * @returns Generation result
   * @throws Error if generation times out or fails
   */
  private async executeWithTimeout(
    provider: LLMProvider,
    params: GenerateParams,
    providerName: string
  ): Promise<GenerateResult> {
    const timeoutMs = AI_CONFIG.retryConfig.timeoutMs

    return Promise.race([
      provider.generate(params),
      new Promise<GenerateResult>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`Provider ${providerName} timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      ),
    ])
  }

  /**
   * Generate with fallback chain
   *
   * Tries each provider in the fallback chain until one succeeds.
   * If all providers fail, uses keyword-based classification as last resort.
   *
   * Circuit breaker: Skips providers that have exceeded maxRetriesPerProvider.
   *
   * @param params - Generation parameters
   * @param failedProvider - Provider that failed (to exclude from fallback chain)
   * @returns Generation result
   */
  private async generateWithFallback(
    params: GenerateParams,
    failedProvider: string
  ): Promise<GenerateResult> {
    // Get fallback chain excluding the failed provider
    const fallbackChain = AI_CONFIG.fallbackChain.filter(
      name => name !== failedProvider && canAttemptProvider(name)
    )

    logger.info('Starting fallback chain', {
      failedProvider,
      fallbackChain,
      availableProviders: fallbackChain.length,
    })

    // Try each provider in fallback chain
    for (const providerName of fallbackChain) {
      const provider = this.providers.get(providerName)

      if (!provider) {
        logger.warn('Fallback provider not available', {
          provider: providerName,
        })
        continue
      }

      try {
        logger.info('Trying fallback provider', {
          provider: providerName,
        })

        const result = await this.executeWithTimeout(provider, params, providerName)

        // Reset circuit breaker on success
        resetCircuitBreaker(providerName)

        logger.info('Fallback provider succeeded', {
          provider: providerName,
          model: result.model,
          tokensUsed: result.tokensInput + result.tokensOutput,
        })

        return result
      } catch (error: any) {
        // Record failed attempt
        recordFailedAttempt(providerName)

        logger.warn('Fallback provider failed', {
          provider: providerName,
          error: {
            name: error?.name || 'UnknownError',
            message: error?.message || String(error),
          },
        })

        // Continue to next provider
        continue
      }
    }

    // All LLM providers failed, use keyword-based fallback
    logger.error('All LLM providers failed, using keyword-based fallback', {
      failedProvider,
      attemptedFallbacks: fallbackChain,
    })

    return keywordBasedClassification(params.prompt)
  }

  /**
   * Select provider based on task configuration or model name
   *
   * Selection order:
   * 1. If params.task is set, use AI_CONFIG.providerForTask
   * 2. If model name contains provider hint (e.g., "gpt-4o"), infer provider
   * 3. Use AI_CONFIG.defaultProvider
   *
   * @param params - Generation parameters
   * @returns Provider name (e.g., "anthropic", "openai")
   */
  private selectProvider(params: GenerateParams): string {
    // 1. Task-based routing
    if (params.task) {
      const taskConfig = AI_CONFIG.providerForTask[params.task]
      if (taskConfig) {
        return taskConfig.provider
      }
    }

    // 2. Model name inference
    const model = params.model.toLowerCase()
    if (model.includes('gpt') || model.includes('openai')) {
      return 'openai'
    }
    if (model.includes('mistral')) {
      return 'mistral'
    }
    if (model.includes('claude')) {
      return 'anthropic'
    }

    // 3. Default provider
    return AI_CONFIG.defaultProvider
  }

  /**
   * Get list of available provider names
   *
   * @returns Array of provider names (e.g., ['anthropic', 'openai'])
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get a specific provider instance
   *
   * @param name - Provider name
   * @returns Provider instance or undefined if not available
   */
  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name)
  }
}

// Singleton instance for application-wide usage
let clientInstance: LLMClient | null = null

/**
 * Get singleton LLMClient instance
 *
 * @returns LLMClient instance
 */
export function getLLMClient(): LLMClient {
  if (!clientInstance) {
    clientInstance = new LLMClient()
  }
  return clientInstance
}

/**
 * Export singleton instance for direct import
 *
 * @example
 * ```typescript
 * import { llmClient } from '@/lib/ai/client'
 * const result = await llmClient.generate({ ... })
 * ```
 */
export const llmClient = getLLMClient()
