/**
 * Skill Analyzer
 *
 * Analyzes session context to detect missing or improvable skills
 */

import type {
  SessionContext,
  SkillGap,
  SkillEvidence,
  DetectedPattern,
  FileChange
} from './types'

export class SkillAnalyzer {
  /**
   * Analyze session and identify skill gaps
   */
  async analyze(context: SessionContext): Promise<SkillGap[]> {
    const gaps: SkillGap[] = []

    // 1. Detect missing skills from patterns
    gaps.push(...this.detectFromPatterns(context.patterns, context.filesChanged))

    // 2. Detect from repeated code (duplication)
    gaps.push(...this.detectFromDuplication(context))

    // 3. Detect from file categorization
    gaps.push(...this.detectFromCategorization(context))

    // 4. Prioritize by ROI
    gaps.sort((a, b) => this.calculateROI(b) - this.calculateROI(a))

    // 5. Assign priorities
    return this.assignPriorities(gaps)
  }

  private detectFromPatterns(
    patterns: DetectedPattern[],
    files: FileChange[]
  ): SkillGap[] {
    const gaps: SkillGap[] = []

    for (const pattern of patterns) {
      if (pattern.type === 'missing-abstraction' && pattern.severity === 'high') {
        // Large files suggest potential skill extraction
        const skillName = this.suggestSkillName(pattern.files)
        gaps.push({
          name: skillName,
          category: 'core',
          reason: `Detected large file additions (${pattern.files.length} files, 50+ lines each)`,
          evidence: {
            filesAffected: pattern.files,
            patterns: [pattern],
            repetitionCount: pattern.occurrences
          },
          roi: `${pattern.occurrences * 15}-${pattern.occurrences * 30} min`,
          complexity: 'medium',
          priority: 'HIGH',
          estimatedTime: 45
        })
      }

      if (pattern.type === 'repeated-logic') {
        // Repeated modifications suggest reusable pattern
        const skillName = this.suggestSkillName(pattern.files)
        gaps.push({
          name: skillName,
          category: 'core',
          reason: `Files modified repeatedly (${pattern.occurrences}x), potential reusable pattern`,
          evidence: {
            filesAffected: pattern.files,
            patterns: [pattern],
            repetitionCount: pattern.occurrences
          },
          roi: `${pattern.occurrences * 10}-${pattern.occurrences * 20} min`,
          complexity: 'low',
          priority: 'MEDIUM',
          estimatedTime: 30
        })
      }

      if (pattern.type === 'configuration' && pattern.occurrences >= 5) {
        gaps.push({
          name: 'config-centralization',
          category: 'core',
          reason: `Multiple configuration files changed (${pattern.occurrences})`,
          evidence: {
            filesAffected: pattern.files,
            patterns: [pattern],
            repetitionCount: pattern.occurrences
          },
          roi: `${pattern.occurrences * 5}-${pattern.occurrences * 10} min`,
          complexity: 'low',
          priority: 'LOW',
          estimatedTime: 20
        })
      }
    }

    return gaps
  }

  private detectFromDuplication(context: SessionContext): SkillGap[] {
    const gaps: SkillGap[] = []

    // Check for API route duplication
    const apiRoutes = context.filesChanged.filter(f =>
      f.path.includes('app/api/') || f.path.includes('pages/api/')
    )

    if (apiRoutes.length >= 3) {
      gaps.push({
        name: 'api-route-template',
        category: 'core',
        reason: `${apiRoutes.length} API routes created, potential template extraction`,
        evidence: {
          filesAffected: apiRoutes.map(f => f.path),
          patterns: [],
          repetitionCount: apiRoutes.length
        },
        roi: `${apiRoutes.length * 10}-${apiRoutes.length * 20} min`,
        complexity: 'medium',
        priority: 'MEDIUM',
        estimatedTime: 40
      })
    }

    // Check for component duplication
    const components = context.filesChanged.filter(f =>
      (f.path.includes('components/') || f.path.includes('app/')) &&
      f.path.endsWith('.tsx')
    )

    if (components.length >= 3) {
      gaps.push({
        name: 'component-pattern',
        category: 'core',
        reason: `${components.length} components created, potential reusable pattern`,
        evidence: {
          filesAffected: components.map(f => f.path),
          patterns: [],
          repetitionCount: components.length
        },
        roi: `${components.length * 8}-${components.length * 15} min`,
        complexity: 'medium',
        priority: 'MEDIUM',
        estimatedTime: 35
      })
    }

    return gaps
  }

  private detectFromCategorization(context: SessionContext): SkillGap[] {
    const gaps: SkillGap[] = []
    const cat = context.categorization

    // CI/CD improvements
    if (cat.cicd.length >= 2) {
      gaps.push({
        name: 'cicd-optimization',
        category: 'cicd',
        reason: `${cat.cicd.length} CI/CD files modified, potential optimization`,
        evidence: {
          filesAffected: cat.cicd,
          patterns: [],
          repetitionCount: cat.cicd.length
        },
        roi: `${cat.cicd.length * 15}-${cat.cicd.length * 30} min`,
        complexity: 'medium',
        priority: 'MEDIUM',
        estimatedTime: 45
      })
    }

    // Documentation generation
    if (cat.docs.length >= 3 && cat.core.length >= 5) {
      gaps.push({
        name: 'doc-generation',
        category: 'core',
        reason: `Significant code changes (${cat.core.length}) with docs (${cat.docs.length}), potential auto-doc`,
        evidence: {
          filesAffected: [...cat.docs, ...cat.core.slice(0, 3)],
          patterns: [],
          repetitionCount: cat.docs.length
        },
        roi: `${cat.docs.length * 10}-${cat.docs.length * 20} min`,
        complexity: 'high',
        priority: 'LOW',
        estimatedTime: 60
      })
    }

    return gaps
  }

  private suggestSkillName(files: string[]): string {
    // Extract common prefix or pattern from file paths
    if (files.length === 0) return 'generic-pattern'

    // Find common directory
    const parts = files[0].split('/')
    for (let i = parts.length - 1; i >= 0; i--) {
      const prefix = parts.slice(0, i + 1).join('/')
      if (files.every(f => f.startsWith(prefix))) {
        const dir = parts[i]
        return this.sanitizeSkillName(dir)
      }
    }

    // Fallback: use first file's parent directory
    const firstFile = files[0]
    const parentDir = firstFile.split('/').slice(-2, -1)[0] || 'pattern'
    return this.sanitizeSkillName(parentDir)
  }

  private sanitizeSkillName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'generic-pattern'
  }

  private calculateROI(gap: SkillGap): number {
    // ROI = (time_saved * frequency) / implementation_cost
    const timeSaved = gap.evidence.repetitionCount * 10  // minutes per occurrence
    const implementationCost = gap.estimatedTime
    return timeSaved / implementationCost
  }

  private assignPriorities(gaps: SkillGap[]): SkillGap[] {
    // Top 30% = HIGH, middle 40% = MEDIUM, bottom 30% = LOW
    const total = gaps.length
    const highThreshold = Math.ceil(total * 0.3)
    const mediumThreshold = Math.ceil(total * 0.7)

    return gaps.map((gap, index) => ({
      ...gap,
      priority:
        index < highThreshold ? 'HIGH' :
        index < mediumThreshold ? 'MEDIUM' :
        'LOW'
    }))
  }
}
