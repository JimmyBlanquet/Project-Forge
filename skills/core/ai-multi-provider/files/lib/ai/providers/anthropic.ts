import Anthropic from '@anthropic-ai/sdk'
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages'
import type { LLMProvider, GenerateParams, GenerateResult, Feature, ModelPricing } from './base'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'anthropic-provider' })

/**
 * Anthropic pricing (as of 2026-01-07)
 * https://www.anthropic.com/pricing
 *
 * Prompt Caching (to be implemented in US4):
 * - Cache writes: +25% on base price
 * - Cache reads: -90% on base price
 */
const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-5': {
    input: 3.0 / 1_000_000, // $3 per million input tokens
    output: 15.0 / 1_000_000, // $15 per million output tokens
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.0 / 1_000_000,
    output: 15.0 / 1_000_000,
  },
  'claude-haiku-4-5': {
    input: 1.0 / 1_000_000, // $1.00 per million input tokens (fixed 2026-01-07)
    output: 5.0 / 1_000_000, // $5.00 per million output tokens (fixed 2026-01-07)
  },
  'claude-haiku-4-5-20251001': {
    input: 1.0 / 1_000_000,
    output: 5.0 / 1_000_000,
  },
  'claude-opus-4-5': {
    input: 15.0 / 1_000_000, // $15 per million input tokens
    output: 75.0 / 1_000_000, // $75 per million output tokens
  },
}

/**
 * Anthropic LLM Provider
 *
 * Implements LLMProvider interface for Anthropic Claude models.
 * Wraps the Anthropic SDK and normalizes responses to GenerateResult format.
 *
 * Features:
 * - Supports all Claude models (Opus, Sonnet, Haiku)
 * - **Prompt caching enabled**: Automatic caching of system prompts
 * - Streaming support (to be implemented)
 * - Accurate cost tracking with cache-aware pricing
 *
 * ## Prompt Caching
 *
 * System prompts are automatically cached using Anthropic's ephemeral cache mechanism.
 * This provides significant cost savings for repeated API calls with the same system prompt.
 *
 * **Cache Behavior:**
 * - **Cache Duration**: 5 minutes (ephemeral)
 * - **Cache Key**: Based on exact system prompt content
 * - **Cache Write Cost**: Base price + 25% premium
 * - **Cache Read Cost**: Base price - 90% discount (10% of base price)
 *
 * **Cost Savings Example (Haiku 4.5):**
 * - Without cache: 1000 tokens × $1.00/M = $0.001
 * - Cache write: 1000 tokens × $1.25/M = $0.00125 (first call)
 * - Cache read: 1000 tokens × $0.10/M = $0.0001 (subsequent calls within 5 min)
 * - **Savings**: 90% reduction on cache hits
 *
 * **Expected Savings (Email Classification):**
 * - System prompt: ~800 tokens (cached)
 * - User prompt: ~200 tokens (not cached, varies per email)
 * - With 80% cache hit rate → **76% cost reduction** on classification task
 *
 * @example
 * ```typescript
 * const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY!)
 *
 * // First call - creates cache (costs +25%)
 * const result1 = await provider.generate({
 *   model: 'claude-haiku-4-5',
 *   prompt: 'Classify this email...',
 *   systemPrompt: EMAIL_CLASSIFICATION_PROMPT, // Cached for 5 minutes
 *   temperature: 0.3,
 * })
 *
 * // Second call within 5 minutes - uses cache (costs -90%)
 * const result2 = await provider.generate({
 *   model: 'claude-haiku-4-5',
 *   prompt: 'Classify another email...',
 *   systemPrompt: EMAIL_CLASSIFICATION_PROMPT, // Cache hit!
 *   temperature: 0.3,
 * })
 * ```
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'
  readonly models = [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5',
    'claude-haiku-4-5-20251001',
  ]

  private client: Anthropic

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({ apiKey })
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const startTime = Date.now()

    try {
      // Validate model
      if (!this.models.includes(params.model)) {
        throw new Error(
          `Model "${params.model}" not supported by Anthropic provider. Supported models: ${this.models.join(', ')}`
        )
      }

      logger.info('Generating content with Anthropic', {
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        task: params.task,
        cacheEnabled: !!params.systemPrompt, // Cache only when system prompt present
      })

      // Build system parameter with prompt caching
      // Wrap systemPrompt in content array with cache_control for cost reduction
      const systemContent = params.systemPrompt
        ? [
            {
              type: 'text' as const,
              text: params.systemPrompt,
              cache_control: { type: 'ephemeral' as const },
            },
          ]
        : undefined

      // Call Anthropic API with prompt caching beta
      const response = await this.client.messages.create({
        model: params.model,
        max_tokens: params.maxTokens || 4096,
        temperature: params.temperature !== undefined ? params.temperature : 0.7,
        system: systemContent,
        messages: [
          {
            role: 'user',
            content: params.prompt,
          },
        ],
      })

      const latencyMs = Date.now() - startTime

      // Extract text content from response
      const content = response.content
        .filter((block): block is TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n')

      // Calculate cost with prompt caching adjustments
      const pricing = this.getPricing(params.model)

      // Extract cache metrics from usage (optional fields, may be undefined)
      const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens || 0
      const cacheReadTokens = (response.usage as any).cache_read_input_tokens || 0
      const regularInputTokens = response.usage.input_tokens - cacheCreationTokens - cacheReadTokens

      // Cost calculation with cache pricing:
      // - Regular input tokens: base price
      // - Cache write (creation): base price + 25%
      // - Cache read: base price - 90% (10% of base price)
      const cost =
        regularInputTokens * pricing.input +
        cacheCreationTokens * (pricing.input * 1.25) +
        cacheReadTokens * (pricing.input * 0.1) +
        response.usage.output_tokens * pricing.output

      logger.info('Content generated successfully with Anthropic', {
        model: params.model,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        cacheCreation: cacheCreationTokens,
        cacheRead: cacheReadTokens,
        latencyMs,
        cost: cost.toFixed(6),
        cacheSavings:
          cacheReadTokens > 0
            ? ((cacheReadTokens * pricing.input * 0.9) / 1000).toFixed(4) + 'c'
            : undefined,
      })

      return {
        content,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        latencyMs,
        model: params.model,
        cost,
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      logger.error('Failed to generate content with Anthropic', {
        model: params.model,
        error: {
          name: error?.name || 'UnknownError',
          message: error?.message || String(error),
        },
        status: error?.status,
        latencyMs,
      })

      throw error
    }
  }

  getPricing(model: string): ModelPricing {
    const pricing = ANTHROPIC_PRICING[model]

    if (!pricing) {
      logger.warn(`Unknown Anthropic model pricing: ${model}, using Haiku as fallback`)
      // Guaranteed to exist since we defined it above
      return ANTHROPIC_PRICING['claude-haiku-4-5']!
    }

    return pricing
  }

  supports(feature: Feature): boolean {
    switch (feature) {
      case 'caching':
        // Prompt caching support (implementation in US4)
        return true
      case 'streaming':
        // Streaming support (to be implemented)
        return true
      case 'structured_outputs':
        // Anthropic doesn't have native JSON schema enforcement like OpenAI
        return false
      default:
        return false
    }
  }
}
