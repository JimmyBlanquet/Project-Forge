/**
 * Ralph++ Loop Engine
 *
 * Core autonomous loop that implements skills based on PRD
 * Inspired by Ralph: fresh context each iteration, prd.json, progress.txt, Git commits
 */

import { execSync } from 'child_process'
import { mkdir, writeFile, appendFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type {
  PRD,
  Story,
  Progress,
  ProgressEntry,
  RalphConfig,
  LoopResult,
  IterationContext,
  SessionContext
} from './types'
import { ContextBuilder } from './context-builder'
import { AutonomousImplementer } from './autonomous-implementer'

export class RalphLoopEngine {
  private contextBuilder: ContextBuilder
  private autonomousImplementer: AutonomousImplementer

  constructor(private config: RalphConfig) {
    this.contextBuilder = new ContextBuilder(config.contextWindow)
    this.autonomousImplementer = new AutonomousImplementer()
  }

  /**
   * Run Ralph loop for skill implementation
   */
  async run(prdPath: string, sessionDir: string): Promise<LoopResult> {
    const startTime = Date.now()
    const maxIterations = this.config.maxIterations || 10

    try {
      // Load PRD
      const prd = await this.loadPRD(prdPath)

      // Initialize progress
      const progressPath = path.join(sessionDir, 'progress.txt')
      if (!existsSync(progressPath)) {
        await writeFile(progressPath, `# Progress Log for ${prd.skillName}\n\n`, 'utf-8')
      }

      // Run loop
      for (let i = 0; i < maxIterations; i++) {
        console.log(`\n[Ralph++] Iteration ${i + 1}/${maxIterations}`)

        // Build fresh context (Ralph pattern)
        const sessionContext = await this.contextBuilder.build()

        // Load current PRD state
        const currentPRD = await this.loadPRD(prdPath)

        // Select next story
        const story = this.selectNextStory(currentPRD)
        if (!story) {
          console.log('[Ralph++] All stories complete!')
          return {
            status: 'complete',
            iterations: i + 1,
            skillPath: `skills/${currentPRD.metadata.category}/${currentPRD.skillName}`,
            duration: Date.now() - startTime
          }
        }

        console.log(`[Ralph++] Working on: ${story.title}`)

        // Implement story (delegated to external agent or manual for MVP)
        const result = await this.implementStory(story, {
          prd: currentPRD,
          prdPath,
          progress: await this.loadProgress(progressPath),
          sessionContext,
          iteration: i + 1
        })

        if (!result.success) {
          console.error(`[Ralph++] Story ${story.id} failed: ${result.error}`)
          await this.appendProgress(progressPath, {
            iteration: i + 1,
            timestamp: new Date().toISOString(),
            storyId: story.id,
            storyTitle: story.title,
            filesModified: [],
            learnings: [result.error || 'Implementation failed'],
            testsStatus: 'failed'
          })
          continue
        }

        // Update PRD
        currentPRD.stories[story.id - 1].passes = true
        if (result.notes) {
          currentPRD.stories[story.id - 1].notes = result.notes
        }
        await this.savePRD(currentPRD, prdPath)

        // Append to progress
        await this.appendProgress(progressPath, {
          iteration: i + 1,
          timestamp: new Date().toISOString(),
          storyId: story.id,
          storyTitle: story.title,
          filesModified: result.filesModified || [],
          learnings: result.learnings || [],
          testsStatus: result.testsStatus || 'passed',
          commitHash: result.commitHash
        })

        // Delay between iterations (Ralph pattern)
        if (this.config.delayMs > 0) {
          await this.sleep(this.config.delayMs)
        }
      }

      return {
        status: 'max_iterations',
        iterations: maxIterations,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'failed',
        iterations: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Select highest-priority incomplete story
   */
  private selectNextStory(prd: PRD): Story | null {
    const incomplete = prd.stories.filter(s => !s.passes)
    if (incomplete.length === 0) return null

    // Sort by priority (lower number = higher priority)
    incomplete.sort((a, b) => a.priority - b.priority)
    return incomplete[0]
  }

  /**
   * Implement story
   * - Phase 2.1 MVP: Provides guidance for manual implementation
   * - Phase 2.2: Autonomous implementation with Claude Code integration
   */
  private async implementStory(
    story: Story,
    context: IterationContext
  ): Promise<StoryResult> {
    // Use PRD from context (already loaded in loop)
    const prd = context.prd

    // Generate implementation plan
    const plan = this.autonomousImplementer.generatePlan(story, prd)

    // Generate implementation prompt for Claude Code
    const prompt = this.autonomousImplementer.generateImplementationPrompt(plan, prd)

    console.log('\n[Ralph++] Story Implementation:')
    console.log(`Title: ${story.title}`)
    console.log(`Estimated Duration: ${plan.estimatedDuration}`)
    console.log('\n--- Implementation Prompt ---')
    console.log(prompt)
    console.log('--- End Prompt ---\n')

    // Phase 2.2: Autonomous implementation
    // This is where we would integrate with Claude Code Task tool
    // For now, we provide the prompt and return placeholder

    console.log('[Phase 2.2] Autonomous implementation available.')
    console.log('Use the implementation prompt above with Claude Code.\n')

    // Placeholder for autonomous implementation
    // Future: Invoke Claude Code Task tool with the prompt
    // Future: Wait for implementation completion
    // Future: Verify implementation
    // Future: Return actual result

    return {
      success: false,
      error: 'Phase 2.2: Autonomous implementation prompt generated. Manual execution required until full automation.'
    }
  }

  /**
   * Implement story autonomously (Phase 2.2 - Full Automation)
   *
   * This method would be called by Claude Code to autonomously implement a story
   * based on the generated implementation plan.
   */
  async implementStoryAutonomous(
    story: Story,
    prd: PRD
  ): Promise<StoryResult> {
    try {
      // Generate implementation plan
      const plan = this.autonomousImplementer.generatePlan(story, prd)

      console.log(`\n[Ralph++] Autonomous Implementation: ${story.title}`)
      console.log(`Estimated Duration: ${plan.estimatedDuration}`)
      console.log(`\nSteps: ${plan.steps.length}`)

      // Execute implementation steps
      // This is where Claude Code would execute each step
      // For Phase 2.2, this would be integrated with Task tool

      // Verify implementation
      const verification = await this.autonomousImplementer.verifyImplementation(story, prd)

      return verification
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async loadPRD(path: string): Promise<PRD> {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }

  private async savePRD(prd: PRD, path: string): Promise<void> {
    await writeFile(path, JSON.stringify(prd, null, 2), 'utf-8')
  }

  private async loadProgress(path: string): Promise<Progress> {
    if (!existsSync(path)) {
      return { entries: [] }
    }

    // For MVP, return empty progress
    // Full implementation would parse progress.txt
    return { entries: [] }
  }

  private async appendProgress(path: string, entry: ProgressEntry): Promise<void> {
    const text = `
## Iteration ${entry.iteration} - ${entry.timestamp}

**Story:** ${entry.storyTitle} (ID: ${entry.storyId})
**Files Modified:** ${entry.filesModified.join(', ') || 'None'}
**Tests:** ${entry.testsStatus}
**Commit:** ${entry.commitHash || 'N/A'}

**Learnings:**
${entry.learnings.map(l => `- ${l}`).join('\n') || '- None'}

---
`
    await appendFile(path, text, 'utf-8')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

interface StoryResult {
  success: boolean
  error?: string
  notes?: string
  filesModified?: string[]
  learnings?: string[]
  testsStatus?: 'passed' | 'failed' | 'skipped'
  commitHash?: string
}
