/**
 * Ralph Orchestrator - True Fresh Context Implementation
 *
 * Philosophy: "State lives in files, not conversation"
 *
 * This orchestrator spawns fresh Task agents for each iteration.
 * Each agent:
 * 1. Reads state from filesystem (prd.json, progress.txt, git)
 * 2. Implements ONE story
 * 3. Saves state to filesystem
 * 4. Exits
 *
 * The orchestrator:
 * 1. Spawns agent (fresh context)
 * 2. Waits for completion
 * 3. Checks filesystem to see if done
 * 4. Spawns next agent if needed
 *
 * Key: Each agent = NEW context window, no context pollution
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { PRD, LoopResult } from './types'

export interface OrchestrationConfig {
  maxIterations?: number
  delayMs?: number
  projectRoot?: string
}

export class RalphOrchestrator {
  private config: OrchestrationConfig

  constructor(config: OrchestrationConfig = {}) {
    this.config = {
      maxIterations: config.maxIterations || 20,
      delayMs: config.delayMs || 2000,
      projectRoot: config.projectRoot || process.cwd()
    }
  }

  /**
   * Run Ralph loop with fresh context agents
   *
   * Pattern:
   * while (not complete) {
   *   spawn fresh agent
   *   agent reads filesystem
   *   agent implements ONE story
   *   agent saves to filesystem
   *   agent exits
   *   check filesystem for completion
   * }
   */
  async run(prdPath: string, sessionDir: string): Promise<LoopResult> {
    const startTime = Date.now()
    const absolutePrdPath = path.resolve(this.config.projectRoot!, prdPath)
    const absoluteSessionDir = path.resolve(this.config.projectRoot!, sessionDir)
    const progressPath = path.join(absoluteSessionDir, 'progress.txt')

    console.log('[Ralph++ Orchestrator] Starting fresh context loop')
    console.log(`PRD: ${absolutePrdPath}`)
    console.log(`Session: ${absoluteSessionDir}`)
    console.log(`Max iterations: ${this.config.maxIterations}`)
    console.log()

    // Verify files exist
    if (!existsSync(absolutePrdPath)) {
      throw new Error(`PRD not found: ${absolutePrdPath}`)
    }

    let iteration = 0
    const maxIterations = this.config.maxIterations!

    while (iteration < maxIterations) {
      iteration++

      console.log(`\n${'='.repeat(60)}`)
      console.log(`[Ralph++ Orchestrator] Iteration ${iteration}/${maxIterations}`)
      console.log(`${'='.repeat(60)}\n`)

      // Check completion from filesystem (not from agent result)
      const prd = await this.loadPRD(absolutePrdPath)
      const nextStory = prd.stories.find(s => !s.passes)

      if (!nextStory) {
        console.log('[Ralph++ Orchestrator] ✅ All stories complete!')
        return {
          status: 'complete',
          iterations: iteration,
          skillPath: `skills/${prd.metadata.category}/${prd.skillName}`,
          duration: Date.now() - startTime
        }
      }

      console.log(`[Ralph++ Orchestrator] Next story: ${nextStory.title}`)
      console.log(`[Ralph++ Orchestrator] Spawning fresh agent...\n`)

      // Generate prompt for fresh agent
      const agentPrompt = this.generateAgentPrompt(
        absolutePrdPath,
        progressPath,
        nextStory.id,
        prd
      )

      // Spawn fresh agent (NEW context window)
      // This is the KEY - each agent is completely fresh
      console.log('[Ralph++ Orchestrator] 🚀 Spawning Task agent with fresh context...')

      // For now, we'll print the prompt
      // In production, this would be: await Task({ prompt: agentPrompt, ... })
      console.log('\n--- Agent Prompt (Fresh Context) ---')
      console.log(agentPrompt)
      console.log('--- End Prompt ---\n')

      console.log('[Ralph++ Orchestrator] ⚠️  Manual execution required')
      console.log('[Ralph++ Orchestrator] The agent would execute above prompt in fresh context')
      console.log('[Ralph++ Orchestrator] For now, orchestrator pauses here.\n')

      // In real implementation:
      // const result = await this.spawnFreshAgent(agentPrompt)
      // Agent reads filesystem, implements, saves, exits
      // We don't care about agent's result - we check filesystem

      // Delay before next iteration
      if (this.config.delayMs! > 0) {
        console.log(`[Ralph++ Orchestrator] Waiting ${this.config.delayMs}ms before next iteration...`)
        await this.sleep(this.config.delayMs!)
      }

      // For demo, break after first iteration
      // In real implementation, this continues until all stories complete
      console.log('\n[Ralph++ Orchestrator] Demo mode: stopping after first iteration')
      console.log('[Ralph++ Orchestrator] In production, would spawn next fresh agent automatically\n')
      break
    }

    // Max iterations reached
    const prd = await this.loadPRD(absolutePrdPath)
    const incompleteStories = prd.stories.filter(s => !s.passes).length

    return {
      status: 'max_iterations',
      iterations: iteration,
      errors: [`${incompleteStories} stories incomplete after ${iteration} iterations`],
      duration: Date.now() - startTime
    }
  }

  /**
   * Generate prompt for fresh agent
   *
   * Agent must:
   * 1. Read state from filesystem (NOT from context)
   * 2. Implement ONE story
   * 3. Save state to filesystem
   * 4. Exit
   */
  private generateAgentPrompt(
    prdPath: string,
    progressPath: string,
    storyId: number,
    prd: PRD
  ): string {
    const story = prd.stories.find(s => s.id === storyId)!

    return `# Ralph++ Implementation Agent (Single Iteration)

You are a fresh Ralph++ agent. Your context is CLEAN - you have no memory of previous iterations.

## Philosophy: State Lives in Files, Not Conversation

Your ONLY source of truth is the filesystem:
- PRD file: Contains all stories and their status
- Progress file: Contains learnings from previous agents
- Git history: Contains actual code changes

## Your Task (ONE Story Only)

Implement Story ${storyId}: "${story.title}"

### 1. Read State from Filesystem

\`\`\`bash
# Read PRD
cat ${prdPath}

# Read progress (learnings from previous agents)
cat ${progressPath}

# Check git history
git log --oneline --since="4 hours ago"
git diff HEAD~5..HEAD
\`\`\`

### 2. Understand the Story

**Title:** ${story.title}

**Description:** ${story.description}

**Acceptance Criteria:**
${story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

**Files to Create/Modify:**
${story.filesAffected?.map(f => `- ${f}`).join('\n') || '(See implementation steps)'}

### 3. Implement the Story

Follow the implementation plan:

${this.generateImplementationSteps(story, prd)}

### 4. Verify Acceptance Criteria

Check EVERY criteria:
${story.acceptanceCriteria.map((ac, i) => `- [ ] ${ac}`).join('\n')}

### 5. Save State to Filesystem

**Update PRD (${prdPath}):**
\`\`\`json
{
  "stories": [
    {
      "id": ${storyId},
      "passes": true,  // ← Mark complete
      "notes": "Implemented by fresh agent iteration X. [Your notes here]"
    }
  ]
}
\`\`\`

**Append to Progress (${progressPath}):**
\`\`\`
## Iteration X - Story ${storyId}: ${story.title}
Timestamp: [current timestamp]
Agent: Fresh context agent
Status: Complete

What I did:
- [List actual actions taken]

Learnings:
- [What worked well]
- [What was tricky]
- [Notes for next agent]

Files modified:
- [List files]

Verification:
- [All acceptance criteria checked]
\`\`\`

**Git Commit:**
\`\`\`bash
git add .
git commit -m "feat: ${story.title}

Story ${storyId}/5: ${story.description}

Acceptance criteria verified:
${story.acceptanceCriteria.map((ac, i) => `- ${ac}`).join('\n')}

Co-Authored-By: Ralph++ Fresh Agent <noreply@ralph.ai>"
\`\`\`

### 6. Exit

YOU ARE DONE. Do NOT implement the next story.
The orchestrator will spawn a NEW fresh agent for that.

## Important Rules

1. ❌ Do NOT loop yourself
2. ❌ Do NOT try to implement multiple stories
3. ❌ Do NOT rely on conversation context
4. ✅ DO read ALL state from filesystem
5. ✅ DO save ALL state to filesystem
6. ✅ DO exit after ONE story

Your context will be discarded. The next agent will be FRESH.

## Skill Details

**Skill Name:** ${prd.skillName}
**Category:** ${prd.metadata.category}
**Complexity:** ${prd.metadata.complexity}

---

NOW: Implement Story ${storyId}, save state to filesystem, then EXIT.
`
  }

  /**
   * Generate implementation steps based on story type
   */
  private generateImplementationSteps(story: any, prd: PRD): string {
    if (story.title.includes('Create') && story.title.includes('structure')) {
      return `
**Structure Creation Steps:**
1. Create directory: skills/${prd.metadata.category}/${prd.skillName}/
2. Create subdirectories: files/, tests/, docs/
3. Create README.md with skill overview
4. Create SKILL.md with detailed documentation
5. Create install.sh script (make it executable)
`
    } else if (story.title.includes('Extract')) {
      return `
**Code Extraction Steps:**
1. Read source files: ${story.filesAffected?.join(', ')}
2. Identify reusable patterns
3. Extract to generic, portable code
4. Create TypeScript types
5. Write exports that can be imported
`
    } else if (story.title.includes('tests')) {
      return `
**Testing Steps:**
1. Create test file: tests/${prd.skillName}.test.ts
2. Write unit tests for core functionality
3. Run tests: npm test
4. Ensure > 70% coverage
5. Fix any failures
`
    } else if (story.title.includes('Document')) {
      return `
**Documentation Steps:**
1. Update SKILL.md with complete documentation
2. Add usage examples with code snippets
3. Document environment variables if any
4. Add troubleshooting section
5. Update README.md with quick start
`
    } else if (story.title.includes('install')) {
      return `
**Install Script Steps:**
1. Write install.sh that detects project root
2. Copy files to correct locations
3. Show success/error messages
4. Make script executable: chmod +x install.sh
5. Test on fresh project
`
    }

    return '(Follow story description for implementation steps)'
  }

  /**
   * Spawn fresh agent using Task tool
   *
   * CRITICAL: This spawns a FRESH agent with NEW context.
   * The agent will:
   * 1. Read state from filesystem (prd.json, progress.txt, git)
   * 2. Implement ONE story
   * 3. Save state to filesystem
   * 4. Exit
   *
   * We don't care about the agent's return value - we check filesystem instead.
   */
  private async spawnFreshAgent(prompt: string, storyId: number): Promise<void> {
    console.log(`[Ralph++ Orchestrator] 🚀 Spawning Task agent for Story ${storyId}...`)

    // Note: In Claude Code CLI context, we can't directly call Task tool
    // This would need to be called from within Claude Code environment
    // For now, we provide the prompt for manual execution

    // The orchestrator itself runs in Node.js, but Task tool is a Claude Code feature
    // Two options:
    // 1. Run orchestrator FROM Claude Code (preferred)
    // 2. Use Claude API to spawn agents (requires API integration)

    // For Phase 2.4, we'll implement option 2 later
    // For now, return the prompt for the user to execute

    console.log('\n--- Fresh Agent Prompt ---')
    console.log(prompt)
    console.log('--- End Prompt ---\n')

    // TODO: Implement actual Task spawning via:
    // - Claude API integration, OR
    // - MCP server communication, OR
    // - Run orchestrator inside Claude Code context

    throw new Error(
      'Task spawning requires Claude Code environment or API integration.\n' +
      'For now, please run the agent prompt above manually in Claude Code.'
    )
  }

  /**
   * Load PRD from filesystem
   */
  private async loadPRD(path: string): Promise<PRD> {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
