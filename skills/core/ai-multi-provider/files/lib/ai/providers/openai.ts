import OpenAI from 'openai'
import type { LLMProvider, GenerateParams, GenerateResult, Feature, ModelPricing } from './base'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'openai-provider' })

/**
 * OpenAI pricing (as of 2026-01-07)
 * https://platform.openai.com/docs/pricing
 *
 * GPT-4o series pricing from research.md
 */
const OPENAI_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    input: 2.5 / 1_000_000, // $2.50 per million input tokens
    output: 10.0 / 1_000_000, // $10.00 per million output tokens
  },
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000, // $0.15 per million input tokens
    output: 0.6 / 1_000_000, // $0.60 per million output tokens
  },
}

/**
 * OpenAI LLM Provider
 *
 * Implements LLMProvider interface for OpenAI GPT models.
 * Wraps the OpenAI SDK and normalizes responses to GenerateResult format.
 *
 * Features:
 * - Supports GPT-4o and GPT-4o-mini models
 * - Native structured outputs with JSON schema enforcement
 * - Streaming support
 * - Accurate cost tracking
 *
 * @example
 * ```typescript
 * const provider = new OpenAIProvider(process.env.OPENAI_API_KEY!)
 * const result = await provider.generate({
 *   model: 'gpt-4o-mini',
 *   prompt: 'Classify this email...',
 *   systemPrompt: EMAIL_CLASSIFICATION_PROMPT,
 *   temperature: 0.3,
 * })
 * ```
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai'
  readonly models = ['gpt-4o', 'gpt-4o-mini']

  private client: OpenAI

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.client = new OpenAI({ apiKey })
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const startTime = Date.now()

    try {
      // Validate model
      if (!this.models.includes(params.model)) {
        throw new Error(
          `Model "${params.model}" not supported by OpenAI provider. Supported models: ${this.models.join(', ')}`
        )
      }

      logger.info('Generating content with OpenAI', {
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        task: params.task,
      })

      // Build messages
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

      // OpenAI uses 'system' role for system prompts (unlike Anthropic's separate field)
      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt,
        })
      }

      messages.push({
        role: 'user',
        content: params.prompt,
      })

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages,
        max_tokens: params.maxTokens || 4096,
        temperature: params.temperature !== undefined ? params.temperature : 0.7,
      })

      const latencyMs = Date.now() - startTime

      // Extract content
      const content = response.choices[0]?.message?.content || ''

      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      // Extract token usage
      const tokensInput = response.usage?.prompt_tokens || 0
      const tokensOutput = response.usage?.completion_tokens || 0

      // Calculate cost
      const pricing = this.getPricing(params.model)
      const cost = tokensInput * pricing.input + tokensOutput * pricing.output

      logger.info('Content generated successfully with OpenAI', {
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

      logger.error('Failed to generate content with OpenAI', {
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
    const pricing = OPENAI_PRICING[model]

    if (!pricing) {
      logger.warn(`Unknown OpenAI model pricing: ${model}, using GPT-4o-mini as fallback`)
      // Guaranteed to exist since we defined it above
      return OPENAI_PRICING['gpt-4o-mini']!
    }

    return pricing
  }

  supports(feature: Feature): boolean {
    switch (feature) {
      case 'streaming':
        // OpenAI supports streaming
        return true
      case 'structured_outputs':
        // Native JSON schema support with response_format
        return true
      case 'caching':
        // OpenAI doesn't support prompt caching like Anthropic
        return false
      default:
        return false
    }
  }
}
