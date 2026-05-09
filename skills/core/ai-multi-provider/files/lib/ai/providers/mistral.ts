import { Mistral } from '@mistralai/mistralai'
import type { LLMProvider, GenerateParams, GenerateResult, Feature, ModelPricing } from './base'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'mistral-provider' })

/**
 * Mistral AI pricing (as of 2026-01-07)
 * https://mistral.ai/pricing
 *
 * Pricing from research.md
 */
const MISTRAL_PRICING: Record<string, ModelPricing> = {
  'mistral-large-latest': {
    input: 2.0 / 1_000_000, // $2.00 per million input tokens
    output: 6.0 / 1_000_000, // $6.00 per million output tokens
  },
  'mistral-small-latest': {
    input: 0.2 / 1_000_000, // $0.20 per million input tokens
    output: 0.6 / 1_000_000, // $0.60 per million output tokens
  },
}

/**
 * Mistral AI LLM Provider
 *
 * Implements LLMProvider interface for Mistral AI models.
 * Wraps the Mistral SDK and normalizes responses to GenerateResult format.
 *
 * Features:
 * - Supports Mistral Large and Small models
 * - Streaming support
 * - Accurate cost tracking
 *
 * @example
 * ```typescript
 * const provider = new MistralProvider(process.env.MISTRAL_API_KEY!)
 * const result = await provider.generate({
 *   model: 'mistral-small-latest',
 *   prompt: 'Classify this email...',
 *   systemPrompt: EMAIL_CLASSIFICATION_PROMPT,
 *   temperature: 0.3,
 * })
 * ```
 */
export class MistralProvider implements LLMProvider {
  readonly name = 'mistral'
  readonly models = ['mistral-large-latest', 'mistral-small-latest']

  private client: Mistral

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Mistral API key is required')
    }

    this.client = new Mistral({ apiKey })
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const startTime = Date.now()

    try {
      // Validate model
      if (!this.models.includes(params.model)) {
        throw new Error(
          `Model "${params.model}" not supported by Mistral provider. Supported models: ${this.models.join(', ')}`
        )
      }

      logger.info('Generating content with Mistral', {
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        task: params.task,
      })

      // Build messages
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []

      // Mistral uses 'system' role for system prompts
      if (params.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: params.systemPrompt,
        })
      }

      messages.push({
        role: 'user' as const,
        content: params.prompt,
      })

      // Call Mistral API
      const response = await this.client.chat.complete({
        model: params.model,
        messages: messages as any, // Type assertion for Mistral SDK compatibility
        maxTokens: params.maxTokens || 4096,
        temperature: params.temperature !== undefined ? params.temperature : 0.7,
      })

      const latencyMs = Date.now() - startTime

      // Extract content from first choice
      const rawContent = response.choices?.[0]?.message?.content

      if (!rawContent) {
        throw new Error('No content in Mistral response')
      }

      // Handle content which might be string or ContentChunk[]
      const content =
        typeof rawContent === 'string'
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent
                .map(chunk => (typeof chunk === 'string' ? chunk : JSON.stringify(chunk)))
                .join('')
            : String(rawContent)

      // Extract token usage
      const tokensInput = response.usage?.promptTokens || 0
      const tokensOutput = response.usage?.completionTokens || 0

      // Calculate cost
      const pricing = this.getPricing(params.model)
      const cost = tokensInput * pricing.input + tokensOutput * pricing.output

      logger.info('Content generated successfully with Mistral', {
        model: params.model,
        tokensInput,
        tokensOutput,
        latencyMs,
        cost: cost.toFixed(6),
      })

      return {
        content,
        tokensInput,
        tokensOutput,
        latencyMs,
        model: params.model,
        cost,
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime

      logger.error('Failed to generate content with Mistral', {
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
    const pricing = MISTRAL_PRICING[model]

    if (!pricing) {
      logger.warn(`Unknown Mistral model pricing: ${model}, using mistral-small-latest as fallback`)
      // Guaranteed to exist since we defined it above
      return MISTRAL_PRICING['mistral-small-latest']!
    }

    return pricing
  }

  supports(feature: Feature): boolean {
    switch (feature) {
      case 'streaming':
        // Mistral supports streaming
        return true
      case 'structured_outputs':
        // Mistral doesn't have native JSON schema enforcement
        return false
      case 'caching':
        // Mistral doesn't support prompt caching
        return false
      default:
        return false
    }
  }
}
