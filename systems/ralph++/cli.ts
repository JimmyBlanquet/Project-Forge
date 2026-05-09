#!/usr/bin/env node
/**
 * Ralph++ CLI (MVP)
 *
 * Basic CLI for testing Ralph++ functionality
 * Full CLI will be in Phase 3 (CLI Forge)
 */

import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { ContextBuilder, SkillAnalyzer, SkillGenerator, RalphLoopEngine, RalphOrchestrator } from './core'
import type { RalphConfig } from './core/types'

const DEFAULT_CONFIG: RalphConfig = {
  maxIterations: 10,
  delayMs: 2000,
  autoValidate: false,
  autoCommit: false,
  contextWindow: '4h',
  minCommits: 3,
  testCoverageMin: 70
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'analyze':
      await analyze()
      break
    case 'improve':
      const skillName = args[1]
      if (!skillName) {
        console.error('Usage: ralph++ improve <skill-name>')
        process.exit(1)
      }
      await improve(skillName)
      break
    case 'ralph-loop':
      const skillNameRalph = args[1]
      if (!skillNameRalph) {
        console.error('Usage: ralph++ ralph-loop <skill-name>')
        process.exit(1)
      }
      await ralphLoop(skillNameRalph)
      break
    case 'help':
    default:
      showHelp()
  }
}

async function analyze() {
  console.log('[Ralph++] Analyzing session...\n')

  // 1. Build context
  const contextBuilder = new ContextBuilder(DEFAULT_CONFIG.contextWindow)
  const context = await contextBuilder.build()

  console.log(`Branch: ${context.branch}`)
  console.log(`Commits: ${context.commits.length}`)
  console.log(`Files changed: ${context.filesChanged.length}`)
  console.log(`Duration: ${context.duration}\n`)

  // 2. Analyze for skill gaps
  const analyzer = new SkillAnalyzer()
  const skillGaps = await analyzer.analyze(context)

  console.log(`\nSkill Gaps Detected: ${skillGaps.length}\n`)

  skillGaps.forEach((gap, i) => {
    console.log(`${i + 1}. ${gap.name} (${gap.priority})`)
    console.log(`   Category: ${gap.category}`)
    console.log(`   Reason: ${gap.reason}`)
    console.log(`   ROI: ${gap.roi}`)
    console.log(`   Complexity: ${gap.complexity}`)
    console.log(`   Files affected: ${gap.evidence.filesAffected.length}`)
    console.log()
  })

  // 3. Generate PRDs for HIGH priority skills
  const highPriority = skillGaps.filter(g => g.priority === 'HIGH')
  if (highPriority.length > 0) {
    console.log(`\nGenerating PRDs for ${highPriority.length} HIGH priority skills...\n`)

    const sessionDir = path.join('.ralph++', 'sessions', Date.now().toString())
    await mkdir(sessionDir, { recursive: true })

    const generator = new SkillGenerator()
    for (const gap of highPriority) {
      const prd = generator.generatePRD(gap)
      const prdPath = path.join(sessionDir, `${gap.name}-prd.json`)
      await generator.savePRD(prd, prdPath)
      console.log(`✓ Generated PRD: ${prdPath}`)
    }
  }

  console.log('\n[Ralph++] Analysis complete!')
}

async function improve(skillName: string) {
  console.log(`[Ralph++] Improving skill: ${skillName}\n`)

  // Find most recent PRD for this skill
  const sessionsDir = path.join('.ralph++', 'sessions')
  if (!existsSync(sessionsDir)) {
    console.error('Error: No sessions found. Run "ralph++ analyze" first.')
    process.exit(1)
  }

  // Search all session directories for the PRD
  const sessions = require('fs').readdirSync(sessionsDir)
  let prdPath: string | null = null
  let sessionDir: string | null = null

  // Sort sessions by timestamp (newest first)
  sessions.sort().reverse()

  for (const session of sessions) {
    const candidatePath = path.join(sessionsDir, session, `${skillName}-prd.json`)
    if (existsSync(candidatePath)) {
      prdPath = candidatePath
      sessionDir = path.join(sessionsDir, session)
      break
    }
  }

  if (!prdPath || !sessionDir) {
    console.error(`Error: PRD not found for skill "${skillName}"`)
    console.error('Run "ralph++ analyze" first to generate PRDs')
    process.exit(1)
  }

  console.log(`Using PRD: ${prdPath}\n`)

  // Run Ralph loop
  const engine = new RalphLoopEngine(DEFAULT_CONFIG)
  const result = await engine.run(prdPath, sessionDir)

  console.log('\n[Ralph++] Loop complete!')
  console.log(`Status: ${result.status}`)
  console.log(`Iterations: ${result.iterations}`)
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`)
  if (result.skillPath) {
    console.log(`Skill path: ${result.skillPath}`)
  }
  if (result.errors && result.errors.length > 0) {
    console.log(`Errors: ${result.errors.join(', ')}`)
  }
}

async function ralphLoop(skillName: string) {
  console.log(`[Ralph++ TRUE RALPH] Fresh context loop for: ${skillName}\n`)

  // Find most recent PRD for this skill
  const sessionsDir = path.join('.ralph++', 'sessions')
  if (!existsSync(sessionsDir)) {
    console.error('Error: No sessions found. Run "ralph++ analyze" first.')
    process.exit(1)
  }

  // Search all session directories for the PRD
  const sessions = require('fs').readdirSync(sessionsDir)
  let prdPath: string | null = null
  let sessionDir: string | null = null

  // Sort sessions by timestamp (newest first)
  sessions.sort().reverse()

  for (const session of sessions) {
    const candidatePath = path.join(sessionsDir, session, `${skillName}-prd.json`)
    if (existsSync(candidatePath)) {
      prdPath = candidatePath
      sessionDir = path.join(sessionsDir, session)
      break
    }
  }

  if (!prdPath || !sessionDir) {
    console.error(`Error: PRD not found for skill "${skillName}"`)
    console.error('Run "ralph++ analyze" first to generate PRDs')
    process.exit(1)
  }

  console.log(`Using PRD: ${prdPath}`)
  console.log(`Session: ${sessionDir}\n`)

  // Run TRUE Ralph loop with fresh context agents
  const orchestrator = new RalphOrchestrator({
    maxIterations: DEFAULT_CONFIG.maxIterations,
    delayMs: DEFAULT_CONFIG.delayMs,
    projectRoot: process.cwd()
  })

  const result = await orchestrator.run(prdPath, sessionDir)

  console.log('\n[Ralph++ Orchestrator] Loop complete!')
  console.log(`Status: ${result.status}`)
  console.log(`Iterations: ${result.iterations}`)
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`)
  if (result.skillPath) {
    console.log(`Skill path: ${result.skillPath}`)
  }
  if (result.errors && result.errors.length > 0) {
    console.log(`Errors:\n${result.errors.map(e => `  - ${e}`).join('\n')}`)
  }
}

function showHelp() {
  console.log(`
Ralph++ CLI (MVP)

Usage:
  ralph++ analyze                  Analyze session and detect skill gaps
  ralph++ improve <skill-name>     Implement skill (Phase 2.2 - prompts only)
  ralph++ ralph-loop <skill-name>  TRUE RALPH: Fresh context loop (Phase 2.3)
  ralph++ help                     Show this help

Examples:
  ralph++ analyze
  ralph++ improve config-centralization      # Old way: prompts only
  ralph++ ralph-loop config-centralization   # New way: fresh context agents

Philosophy:
  - State lives in files (prd.json, progress.txt, git), not conversation
  - Fresh context: Each iteration = new agent with clean context
  - Re-anchoring: Agent reads filesystem to reconstruct reality

Note: This is MVP CLI. Full CLI coming in Phase 3.
  `)
}

main().catch(error => {
  console.error('[Ralph++] Error:', error.message)
  process.exit(1)
})
