import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

/**
 * Tests for AI Multi-Provider Skill
 *
 * These tests verify the core functionality of the LLM client
 * without requiring actual API keys.
 */

describe('AI Multi-Provider Skill', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules()
  })

  describe('Configuration', () => {
    it('should load default configuration', async () => {
      // Set minimal env vars
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

      const { AI_CONFIG } = await import('../files/lib/ai/config')

      expect(AI_CONFIG.defaultProvider).toBe('anthropic')
      expect(AI_CONFIG.fallbackChain).toEqual(['anthropic', 'openai', 'mistral'])
      expect(AI_CONFIG.retryConfig.maxRetriesPerProvider).toBe(3)
      expect(AI_CONFIG.retryConfig.timeoutMs).toBe(30000)
    })

    it('should allow environment variable overrides', async () => {
      process.env.LLM_PROVIDER = 'openai'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

      const { AI_CONFIG } = await import('../files/lib/ai/config')

      expect(AI_CONFIG.defaultProvider).toBe('openai')
    })

    it('should parse provider overrides correctly', async () => {
      process.env.LLM_FAST_PROVIDER = 'openai/gpt-4o-mini'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

      const { AI_CONFIG } = await import('../files/lib/ai/config')
      const { TaskName } = await import('../files/lib/ai/providers/base')

      expect(AI_CONFIG.providerForTask[TaskName.FastTask]).toEqual({
        provider: 'openai',
        model: 'gpt-4o-mini'
      })
    })
  })

  describe('Task Names', () => {
    it('should export generic task types', async () => {
      const { TaskName } = await import('../files/lib/ai/providers/base')

      expect(TaskName.FastTask).toBe('fast_task')
      expect(TaskName.QualityTask).toBe('quality_task')
      expect(TaskName.ExtractionTask).toBe('extraction_task')
      expect(TaskName.GenerationTask).toBe('generation_task')
    })
  })

  describe('Provider Factory', () => {
    it('should create providers based on available API keys', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
      process.env.OPENAI_API_KEY = 'sk-test'

      const { createProviders } = await import('../files/lib/ai/providers/factory')

      const providers = createProviders()

      expect(providers.has('anthropic')).toBe(true)
      expect(providers.has('openai')).toBe(true)
      expect(providers.size).toBeGreaterThanOrEqual(2)
    })

    it('should throw error when no providers available', async () => {
      // Clear all API keys
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.OPENAI_API_KEY
      delete process.env.MISTRAL_API_KEY

      const { createProviders } = await import('../files/lib/ai/providers/factory')

      expect(() => createProviders()).toThrow('No LLM providers available')
    })
  })

  describe('JSON Parsing', () => {
    it('should parse clean JSON', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      const result = parseClaudeJSON('{"hello": "world"}')

      expect(result).toEqual({ hello: 'world' })
    })

    it('should strip markdown code fences', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      const result = parseClaudeJSON('```json\n{"hello": "world"}\n```')

      expect(result).toEqual({ hello: 'world' })
    })

    it('should extract JSON with trailing text', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      const result = parseClaudeJSON('{"hello": "world"}\n\nThis is a valid response.')

      expect(result).toEqual({ hello: 'world' })
    })

    it('should handle nested objects', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      const json = '{"outer": {"inner": {"nested": "value"}}}'
      const result = parseClaudeJSON(json)

      expect(result).toEqual({
        outer: {
          inner: {
            nested: 'value'
          }
        }
      })
    })

    it('should handle arrays', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      const result = parseClaudeJSON('[1, 2, 3]')

      expect(result).toEqual([1, 2, 3])
    })

    it('should throw on invalid JSON', async () => {
      const { parseClaudeJSON } = await import('../files/lib/ai/helpers/parse-claude-json')

      expect(() => parseClaudeJSON('not json')).toThrow()
    })
  })

  describe('Provider Interfaces', () => {
    it('should validate GenerateParams schema', async () => {
      const { GenerateParamsSchema } = await import('../files/lib/ai/providers/base')

      const validParams = {
        model: 'claude-sonnet-4-5',
        prompt: 'Hello',
        systemPrompt: 'You are helpful',
        temperature: 0.7,
        maxTokens: 100
      }

      expect(() => GenerateParamsSchema.parse(validParams)).not.toThrow()
    })

    it('should validate GenerateResult schema', async () => {
      const { GenerateResultSchema } = await import('../files/lib/ai/providers/base')

      const validResult = {
        content: 'Hello, world!',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 500,
        model: 'claude-sonnet-4-5',
        cost: 0.0001
      }

      expect(() => GenerateResultSchema.parse(validResult)).not.toThrow()
    })
  })

  describe('Integration', () => {
    it('should provide working example', async () => {
      // This is a documentation test - ensures example code compiles
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

      const { getLLMClient } = await import('../files/lib/ai/client')
      const { TaskName } = await import('../files/lib/ai/providers/base')

      const client = getLLMClient()

      expect(client).toBeDefined()
      expect(client.getAvailableProviders).toBeDefined()
      expect(client.generate).toBeDefined()
      expect(client.generateWithProvider).toBeDefined()

      // Verify task name usage
      expect(TaskName.FastTask).toBeDefined()
      expect(TaskName.QualityTask).toBeDefined()
    })
  })
})

describe('Utilities', () => {
  describe('validateResponse', () => {
    it('should validate response with Zod schema', async () => {
      const { validateResponse } = await import('../files/lib/ai/providers/base')

      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const content = JSON.stringify({ name: 'Alice', age: 30 })

      const result = await validateResponse(content, schema)

      expect(result).toEqual({ name: 'Alice', age: 30 })
    })

    it('should throw on schema validation failure', async () => {
      const { validateResponse } = await import('../files/lib/ai/providers/base')

      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const content = JSON.stringify({ name: 'Alice', age: 'thirty' })

      await expect(validateResponse(content, schema)).rejects.toThrow()
    })
  })
})
