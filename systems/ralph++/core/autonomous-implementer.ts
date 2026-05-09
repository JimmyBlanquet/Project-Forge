/**
 * Autonomous Implementer (Phase 2.2)
 *
 * Integrates with Claude Code to autonomously implement skills.
 * This module provides the bridge between Ralph++ and Claude Code's capabilities.
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { Story, PRD, StoryResult } from './types'

export interface ImplementationPlan {
  story: Story
  steps: ImplementationStep[]
  estimatedDuration: string
}

export interface ImplementationStep {
  action: 'create_dir' | 'create_file' | 'extract_code' | 'write_test' | 'run_test' | 'commit'
  description: string
  target?: string
  source?: string
  content?: string
}

/**
 * Autonomous Story Implementer
 *
 * Converts stories into actionable implementation plans for Claude Code
 */
export class AutonomousImplementer {
  /**
   * Generate implementation plan from story
   */
  generatePlan(story: Story, prd: PRD): ImplementationPlan {
    const steps: ImplementationStep[] = []

    // Determine implementation strategy based on story title/id
    if (story.title.includes('Create') && story.title.includes('structure')) {
      // Story 1: Create skill structure
      steps.push(...this.generateStructureSteps(prd.skillName, prd.metadata.category))
    } else if (story.title.includes('Extract')) {
      // Story 2: Extract reusable code
      steps.push(...this.generateExtractionSteps(story, prd.skillName))
    } else if (story.title.includes('Write tests')) {
      // Story 3: Write tests
      steps.push(...this.generateTestSteps(prd.skillName))
    } else if (story.title.includes('Document')) {
      // Story 4: Document skill
      steps.push(...this.generateDocumentationSteps(prd.skillName, prd.metadata))
    } else if (story.title.includes('install script')) {
      // Story 5: Create install script
      steps.push(...this.generateInstallScriptSteps(prd.skillName, prd.metadata.category))
    }

    return {
      story,
      steps,
      estimatedDuration: this.estimateDuration(steps)
    }
  }

  /**
   * Generate prompt for Claude Code to implement the story
   */
  generateImplementationPrompt(plan: ImplementationPlan, prd: PRD): string {
    const { story, steps } = plan

    let prompt = `# Implementation Task: ${story.title}\n\n`
    prompt += `**Description:** ${story.description}\n\n`
    prompt += `**Skill:** ${prd.skillName}\n`
    prompt += `**Category:** ${prd.metadata.category}\n\n`

    prompt += `## Acceptance Criteria\n\n`
    story.acceptanceCriteria.forEach((ac, i) => {
      prompt += `${i + 1}. ${ac}\n`
    })

    prompt += `\n## Implementation Steps\n\n`
    steps.forEach((step, i) => {
      prompt += `${i + 1}. **${this.getActionLabel(step.action)}**: ${step.description}\n`
      if (step.target) prompt += `   - Target: \`${step.target}\`\n`
      if (step.source) prompt += `   - Source: \`${step.source}\`\n`
    })

    prompt += `\n## Files to Create/Modify\n\n`
    if (story.filesAffected && story.filesAffected.length > 0) {
      story.filesAffected.forEach(f => {
        prompt += `- \`${f}\`\n`
      })
    } else {
      prompt += `(See implementation steps for file details)\n`
    }

    prompt += `\n## Verification\n\n`
    prompt += `After implementation, verify that:\n`
    story.acceptanceCriteria.forEach((ac, i) => {
      prompt += `- [ ] ${ac}\n`
    })

    return prompt
  }

  /**
   * Verify story implementation
   */
  async verifyImplementation(story: Story, prd: PRD): Promise<StoryResult> {
    // Check acceptance criteria
    const checks: string[] = []

    for (const criteria of story.acceptanceCriteria) {
      // Extract file paths from criteria
      const dirMatch = criteria.match(/Directory created: (.+)/)
      const fileMatch = criteria.match(/Files? created: (.+)/)

      if (dirMatch) {
        const dirPath = dirMatch[1]
        if (!existsSync(dirPath)) {
          checks.push(`Directory missing: ${dirPath}`)
        }
      }

      if (fileMatch) {
        const files = fileMatch[1].split(',').map(f => f.trim())
        for (const file of files) {
          const fullPath = path.join('skills', prd.metadata.category, prd.skillName, file)
          if (!existsSync(fullPath)) {
            checks.push(`File missing: ${fullPath}`)
          }
        }
      }
    }

    if (checks.length > 0) {
      return {
        success: false,
        error: `Verification failed:\n${checks.join('\n')}`
      }
    }

    return {
      success: true
    }
  }

  /**
   * Generate steps for creating skill structure (Story 1)
   */
  private generateStructureSteps(skillName: string, category: string): ImplementationStep[] {
    const basePath = `skills/${category}/${skillName}`

    return [
      {
        action: 'create_dir',
        description: `Create skill directory structure`,
        target: basePath
      },
      {
        action: 'create_dir',
        description: `Create files/ subdirectory`,
        target: `${basePath}/files`
      },
      {
        action: 'create_dir',
        description: `Create tests/ subdirectory`,
        target: `${basePath}/tests`
      },
      {
        action: 'create_dir',
        description: `Create docs/ subdirectory`,
        target: `${basePath}/docs`
      },
      {
        action: 'create_file',
        description: `Create README.md with skill overview`,
        target: `${basePath}/README.md`
      },
      {
        action: 'create_file',
        description: `Create SKILL.md with detailed documentation`,
        target: `${basePath}/SKILL.md`
      },
      {
        action: 'create_file',
        description: `Create install.sh script`,
        target: `${basePath}/install.sh`
      }
    ]
  }

  /**
   * Generate steps for extracting code (Story 2)
   */
  private generateExtractionSteps(story: Story, skillName: string): ImplementationStep[] {
    const steps: ImplementationStep[] = []

    // Extract source files from filesAffected
    const sourceFiles = story.filesAffected?.filter(f => !f.includes('skills/')) || []

    steps.push({
      action: 'extract_code',
      description: `Analyze source files and extract reusable patterns`,
      source: sourceFiles.join(', ')
    })

    steps.push({
      action: 'create_file',
      description: `Create extracted code files in files/ directory`,
      target: `skills/*/files/`
    })

    return steps
  }

  /**
   * Generate steps for writing tests (Story 3)
   */
  private generateTestSteps(skillName: string): ImplementationStep[] {
    return [
      {
        action: 'create_file',
        description: `Create test file with unit tests`,
        target: `skills/*/${skillName}/tests/${skillName}.test.ts`
      },
      {
        action: 'run_test',
        description: `Run tests and ensure they pass`
      }
    ]
  }

  /**
   * Generate steps for documentation (Story 4)
   */
  private generateDocumentationSteps(skillName: string, metadata: any): ImplementationStep[] {
    return [
      {
        action: 'create_file',
        description: `Write comprehensive SKILL.md with usage examples`,
        target: `skills/*/${skillName}/SKILL.md`
      },
      {
        action: 'create_file',
        description: `Write README.md with quick start guide`,
        target: `skills/*/${skillName}/README.md`
      }
    ]
  }

  /**
   * Generate steps for install script (Story 5)
   */
  private generateInstallScriptSteps(skillName: string, category: string): ImplementationStep[] {
    return [
      {
        action: 'create_file',
        description: `Write install.sh script with file copying logic`,
        target: `skills/${category}/${skillName}/install.sh`
      },
      {
        action: 'commit',
        description: `Commit skill implementation`
      }
    ]
  }

  /**
   * Get human-readable action label
   */
  private getActionLabel(action: ImplementationStep['action']): string {
    const labels: Record<string, string> = {
      create_dir: 'Create Directory',
      create_file: 'Create File',
      extract_code: 'Extract Code',
      write_test: 'Write Test',
      run_test: 'Run Tests',
      commit: 'Commit Changes'
    }
    return labels[action] || action
  }

  /**
   * Estimate implementation duration
   */
  private estimateDuration(steps: ImplementationStep[]): string {
    // Rough estimates based on action types
    const times: Record<string, number> = {
      create_dir: 1,
      create_file: 3,
      extract_code: 10,
      write_test: 8,
      run_test: 2,
      commit: 1
    }

    const totalMinutes = steps.reduce((sum, step) => {
      return sum + (times[step.action] || 5)
    }, 0)

    if (totalMinutes < 60) {
      return `${totalMinutes} min`
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }
}
