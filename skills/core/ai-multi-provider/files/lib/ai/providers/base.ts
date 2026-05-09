import { z } from 'zod'
import { parseClaudeJSON } from '@/lib/ai/helpers/parse-claude-json'

/**
 * Task names for provider selection
 *
 * These are generic task types. Extend this enum in your project
 * to add domain-specific tasks.
 *
 * @example
 * // In your project:
 * export enum TaskName {
 *   ...BaseTaskName,
 *   EmailClassification = 'email_classification',
 *   LeadExtraction = 'lead_extraction',
 * }
 */
/* eslint-disable no-unused-vars */
export enum TaskName {
  /** Fast, cheap task (e.g., classification, simple extraction) */
  FastTask = 'fast_task',
  /** Quality task (e.g., content generation, complex reasoning) */
  QualityTask = 'quality_task',
  /** Extraction task (e.g., structured data extraction) */
  ExtractionTask = 'extraction_task',
  /** Generation task (e.g., long-form content, creative writing) */
  GenerationTask = 'generation_task',
}
/* eslint-enable no-unused-vars */

/**
 * Feature capabilities that LLM providers may support
 */
export type Feature = 'streaming' | 'caching' | 'structured_outputs'

/**
 * Pricing information for a specific model
 */
export interface ModelPricing {
  /** Cost per million input tokens (USD) */
  input: number
  /** Cost per million output tokens (USD) */
  output: number
}

/**
 * Normalized parameters for LLM generation
 *
 * This interface abstracts provider-specific parameters into a common format
 * that works across Anthropic, OpenAI, and Mistral.
 */
export interface GenerateParams {
  /**
   * Model identifier
   * @example "claude-haiku-4-5", "gpt-4o", "mistral-large-latest"
   */
  model: string

  /**
   * User message/prompt
   */
  prompt: string

  /**
   * System instructions (optional)
   */
  systemPrompt?: string

  /**
   * Sampling temperature (optional)
   * @default 0.7
   * @min 0.0
   * @max 1.0
   */
  temperature?: number

  /**
   * Maximum output tokens (optional)
   * @default 4096
   */
  maxTokens?: number

  /**
   * Zod schema for structured output validation (optional)
   */
  schema?: z.ZodSchema

  /**
   * Task type for provider selection (optional)
   */
  task?: TaskName
}

/**
 * Normalized response from LLM providers
 */
export interface GenerateResult {
  /** Generated text content (may be JSON string) */
  content: string
  /** Input tokens consumed */
  tokensInput: number
  /** Output tokens generated */
  tokensOutput: number
  /** Request latency in milliseconds */
  latencyMs: number
  /** Actual model used */
  model: string
  /** Cost in USD for this request */
  cost: number
}

/**
 * Abstract interface for LLM providers
 *
 * All LLM providers (Anthropic, OpenAI, Mistral) must implement this interface
 * to ensure compatibility with the unified LLMClient.
 */
export interface LLMProvider {
  /** Provider identifier (e.g., "anthropic", "openai", "mistral") */
  name: string

  /** List of supported model names */
  models: string[]

  /**
   * Generate LLM completion
   * @param _params - Normalized generation parameters
   * @returns Normalized generation result with cost and latency
   */
  generate(_params: GenerateParams): Promise<GenerateResult>

  /**
   * Get pricing information for a model
   * @param _model - Model name
   * @returns Pricing info with input/output costs per million tokens
   */
  getPricing(_model: string): ModelPricing

  /**
   * Check if provider supports a specific feature
   * @param _feature - Feature to check
   * @returns true if supported, false otherwise
   */
  supports(_feature: Feature): boolean
}

/**
 * Progressive validation utility for LLM responses
 *
 * Validates in 3 steps for clear error messages:
 * 1. Parse JSON (throws SyntaxError if invalid)
 * 2. Check is object (throws Error if not object)
 * 3. Validate Zod schema (throws ZodError with field-level errors)
 *
 * @example
 * ```typescript
 * const content = '{"classification_type":"acheteur","confidence_score":95}'
 * const result = validateResponse(content, EmailClassificationSchema)
 * // Returns: { classification_type: 'acheteur', confidence_score: 95, ... }
 * ```
 */
export function validateResponse<T>(content: string, schema: z.ZodSchema<T>): T {
  // Step 1: Parse JSON (handles markdown fences automatically)
  let parsed: unknown
  try {
    parsed = parseClaudeJSON(content)
  } catch (error) {
    throw new Error(
      `Invalid JSON response from LLM: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Step 2: Check is object
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`LLM response is not an object: ${JSON.stringify(parsed)}`)
  }

  // Step 3: Validate Zod schema
  try {
    return schema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`LLM response validation failed: ${fieldErrors}`)
    }
    throw error
  }
}

/**
 * Zod schema for GenerateParams validation
 */
export const GenerateParamsSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
  schema: z.instanceof(z.ZodSchema).optional(),
  task: z.nativeEnum(TaskName).optional(),
})

/**
 * Zod schema for GenerateResult validation
 */
export const GenerateResultSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  tokensInput: z.number().nonnegative(),
  tokensOutput: z.number().nonnegative(),
  latencyMs: z.number().positive(),
  model: z.string().min(1, 'Model name is required'),
  cost: z.number().nonnegative(),
})
