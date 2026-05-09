import type { LLMProvider } from './base'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { MistralProvider } from './mistral'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'provider-factory' })

/**
 * Create and initialize LLM providers
 *
 * Scans environment variables for API keys and initializes available providers.
 * Providers without API keys are skipped with a warning.
 *
 * Environment Variables:
 * - ANTHROPIC_API_KEY: Anthropic Claude API key
 * - OPENAI_API_KEY: OpenAI GPT API key
 * - MISTRAL_API_KEY: Mistral AI API key
 *
 * @returns Map of provider name to provider instance
 *
 * @example
 * ```typescript
 * const providers = createProviders()
 * // Returns: Map { 'anthropic' => AnthropicProvider, 'openai' => OpenAIProvider, ... }
 *
 * const anthropic = providers.get('anthropic')
 * if (anthropic) {
 *   const result = await anthropic.generate({ ... })
 * }
 * ```
 */
export function createProviders(): Map<string, LLMProvider> {
  const providers = new Map<string, LLMProvider>()

  // Initialize Anthropic provider
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const anthropic = new AnthropicProvider(anthropicKey)
      providers.set('anthropic', anthropic)
      logger.info('Anthropic provider initialized', {
        models: anthropic.models,
      })
    } catch (error: any) {
      logger.error('Failed to initialize Anthropic provider', {
        error: {
          name: error?.name || 'UnknownError',
          message: error?.message || String(error),
        },
      })
    }
  } else {
    logger.warn('ANTHROPIC_API_KEY not set - Anthropic provider unavailable')
  }

  // Initialize OpenAI provider
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const openai = new OpenAIProvider(openaiKey)
      providers.set('openai', openai)
      logger.info('OpenAI provider initialized', {
        models: openai.models,
      })
    } catch (error: any) {
      logger.error('Failed to initialize OpenAI provider', {
        error: {
          name: error?.name || 'UnknownError',
          message: error?.message || String(error),
        },
      })
    }
  } else {
    logger.warn('OPENAI_API_KEY not set - OpenAI provider unavailable')
  }

  // Initialize Mistral provider
  const mistralKey = process.env.MISTRAL_API_KEY
  if (mistralKey) {
    try {
      const mistral = new MistralProvider(mistralKey)
      providers.set('mistral', mistral)
      logger.info('Mistral provider initialized', {
        models: mistral.models,
      })
    } catch (error: any) {
      logger.error('Failed to initialize Mistral provider', {
        error: {
          name: error?.name || 'UnknownError',
          message: error?.message || String(error),
        },
      })
    }
  } else {
    logger.warn('MISTRAL_API_KEY not set - Mistral provider unavailable')
  }

  // Ensure at least one provider is available
  if (providers.size === 0) {
    logger.error('No LLM providers available - at least one API key must be configured')
    throw new Error(
      'No LLM providers available. Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or MISTRAL_API_KEY environment variable.'
    )
  }

  logger.info('Provider factory initialized', {
    availableProviders: Array.from(providers.keys()),
  })

  return providers
}
