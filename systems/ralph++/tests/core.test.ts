import { describe, it, expect } from 'vitest'

describe('Ralph++ Core', () => {
  describe('Types', () => {
    it('should export all core types', async () => {
      const types = await import('../core/types')
      expect(types).toBeDefined()
    })
  })

  describe('ContextBuilder', () => {
    it('should create ContextBuilder instance', async () => {
      const { ContextBuilder } = await import('../core/context-builder')
      const builder = new ContextBuilder('4h')
      expect(builder).toBeDefined()
    })
  })

  describe('SkillAnalyzer', () => {
    it('should create SkillAnalyzer instance', async () => {
      const { SkillAnalyzer } = await import('../core/skill-analyzer')
      const analyzer = new SkillAnalyzer()
      expect(analyzer).toBeDefined()
    })
  })

  describe('SkillGenerator', () => {
    it('should create SkillGenerator instance', async () => {
      const { SkillGenerator } = await import('../core/skill-generator')
      const generator = new SkillGenerator()
      expect(generator).toBeDefined()
    })

    it('should generate PRD from skill gap', async () => {
      const { SkillGenerator } = await import('../core/skill-generator')
      const generator = new SkillGenerator()

      const skillGap = {
        name: 'test-skill',
        category: 'core' as const,
        reason: 'Test reason',
        evidence: {
          filesAffected: ['test.ts'],
          patterns: [],
          repetitionCount: 1
        },
        roi: '10-20 min',
        complexity: 'low' as const,
        priority: 'MEDIUM' as const,
        estimatedTime: 30
      }

      const prd = generator.generatePRD(skillGap)

      expect(prd.skillName).toBe('test-skill')
      expect(prd.stories.length).toBeGreaterThan(0)
      expect(prd.metadata.category).toBe('core')
    })
  })

  describe('RalphLoopEngine', () => {
    it('should create RalphLoopEngine instance', async () => {
      const { RalphLoopEngine } = await import('../core/loop-engine')
      const config = {
        maxIterations: 10,
        delayMs: 0,
        autoValidate: false,
        autoCommit: false,
        contextWindow: '4h',
        minCommits: 3,
        testCoverageMin: 70
      }
      const engine = new RalphLoopEngine(config)
      expect(engine).toBeDefined()
    })
  })
})
