import { TaskName } from './providers/base'

/**
 * AI Configuration
 *
 * Centralized configuration for multi-LLM provider support.
 * Controls provider selection, task routing, fallback behavior, and retry logic.
 *
 * Environment Variables:
 * - LLM_PROVIDER: Override default provider (default: "anthropic")
 * - LLM_CLASSIFICATION_PROVIDER: Override provider for email classification
 * - LLM_GENERATION_PROVIDER: Override provider for response generation
 * - LLM_EXTRACTION_PROVIDER: Override provider for lead extraction
 * - LLM_CONTENT_PROVIDER: Override provider for content generation
 *
 * Format for overrides: "{provider}/{model}" (e.g., "openai/gpt-4o-mini")
 */
export const AI_CONFIG = {
  /**
   * Default LLM provider
   *
   * Used when no task-specific provider is configured.
   * Can be overridden via LLM_PROVIDER environment variable.
   *
   * @default "anthropic"
   */
  defaultProvider: (process.env.LLM_PROVIDER || 'anthropic') as string,

  /**
   * Task-to-provider mapping
   *
   * Maps each task type to a preferred provider/model combination.
   * Enables cost optimization and quality targeting per use case.
   *
   * Can be overridden via environment variables:
   * - LLM_FAST_PROVIDER="openai/gpt-4o-mini"
   * - LLM_QUALITY_PROVIDER="anthropic/claude-sonnet-4-5"
   * - LLM_EXTRACTION_PROVIDER="anthropic/claude-haiku-4-5"
   * - LLM_GENERATION_PROVIDER="anthropic/claude-sonnet-4-5"
   *
   * @example
   * FastTask → Haiku (fast, cheap: $1/M input, $5/M output)
   * QualityTask → Sonnet (high quality: $3/M input, $15/M output)
   * ExtractionTask → Haiku (structured data, cheap)
   * GenerationTask → Sonnet (creative, high quality)
   */
  providerForTask: {
    [TaskName.FastTask]: parseProviderOverride(
      process.env.LLM_FAST_PROVIDER,
      'anthropic',
      'claude-haiku-4-5'
    ),
    [TaskName.QualityTask]: parseProviderOverride(
      process.env.LLM_QUALITY_PROVIDER,
      'anthropic',
      'claude-sonnet-4-5'
    ),
    [TaskName.ExtractionTask]: parseProviderOverride(
      process.env.LLM_EXTRACTION_PROVIDER,
      'anthropic',
      'claude-haiku-4-5'
    ),
    [TaskName.GenerationTask]: parseProviderOverride(
      process.env.LLM_GENERATION_PROVIDER,
      'anthropic',
      'claude-sonnet-4-5'
    ),
  },

  /**
   * Fallback provider chain
   *
   * Ordered list of providers to try if primary fails.
   * LLMClient will try each provider in order until one succeeds.
   * If all fail, keyword-based fallback is used.
   *
   * @example ['anthropic', 'openai', 'mistral']
   */
  fallbackChain: ['anthropic', 'openai', 'mistral'] as string[],

  /**
   * Retry and circuit breaker configuration
   *
   * Controls retry behavior and timeout limits to prevent:
   * - Cost explosion from infinite retries
   * - Slow failures from unresponsive providers
   */
  retryConfig: {
    /**
     * Maximum retries per provider before moving to next in fallback chain
     * @default 3
     */
    maxRetriesPerProvider: 3,

    /**
     * Request timeout in milliseconds
     * If exceeded, request fails and triggers fallback
     * @default 30000 (30 seconds)
     */
    timeoutMs: 30000,
  },
} as const

/**
 * Parse provider override from environment variable
 *
 * Format: "{provider}/{model}" (e.g., "openai/gpt-4o-mini")
 * If not set, returns default provider and model.
 *
 * @param override - Environment variable value
 * @param defaultProvider - Default provider name
 * @param defaultModel - Default model name
 * @returns Object with provider and model
 *
 * @example
 * parseProviderOverride("openai/gpt-4o", "anthropic", "claude-haiku-4-5")
 * // Returns: { provider: "openai", model: "gpt-4o" }
 */
function parseProviderOverride(
  override: string | undefined,
  defaultProvider: string,
  defaultModel: string
): { provider: string; model: string } {
  if (!override) {
    return { provider: defaultProvider, model: defaultModel }
  }

  const parts = override.split('/')
  if (parts.length !== 2) {
    console.warn(
      `Invalid provider override format: "${override}". Expected "{provider}/{model}". Using default: ${defaultProvider}/${defaultModel}`
    )
    return { provider: defaultProvider, model: defaultModel }
  }

  const [provider, model] = parts
  if (!provider || !model) {
    console.warn(
      `Invalid provider override (empty provider or model): "${override}". Using default: ${defaultProvider}/${defaultModel}`
    )
    return { provider: defaultProvider, model: defaultModel }
  }

  return { provider: provider.trim(), model: model.trim() }
}
