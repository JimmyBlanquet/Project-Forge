/**
 * Ralph++ Core Types
 *
 * Type definitions for the autonomous skill generation system
 */

// ============================================================================
// Session Context Types
// ============================================================================

export interface SessionContext {
  branch: string
  commits: Commit[]
  filesChanged: FileChange[]
  categorization: FileCategorization
  patterns: DetectedPattern[]
  duration: string
  timestamp: number
}

export interface Commit {
  hash: string
  message: string
  author: string
  date: string
  filesChanged: string[]
}

export interface FileChange {
  path: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

export interface FileCategorization {
  skills: string[]
  core: string[]
  tests: string[]
  docs: string[]
  cicd: string[]
  config: string[]
}

export interface DetectedPattern {
  type: 'duplication' | 'missing-abstraction' | 'repeated-logic' | 'configuration'
  files: string[]
  description: string
  severity: 'high' | 'medium' | 'low'
  occurrences: number
}

// ============================================================================
// Skill Gap Types
// ============================================================================

export interface SkillGap {
  name: string
  category: 'core' | 'integration' | 'cicd' | 'custom'
  reason: string
  evidence: SkillEvidence
  roi: string
  complexity: 'low' | 'medium' | 'high'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedTime: number  // minutes
}

export interface SkillEvidence {
  filesAffected: string[]
  patterns: DetectedPattern[]
  repetitionCount: number
  codeSnippets?: CodeSnippet[]
}

export interface CodeSnippet {
  file: string
  startLine: number
  endLine: number
  code: string
}

// ============================================================================
// PRD Types (Ralph format)
// ============================================================================

export interface PRD {
  skillName: string
  stories: Story[]
  metadata: PRDMetadata
}

export interface Story {
  id: number
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: number  // Lower = higher priority
  passes: boolean
  notes?: string
  filesAffected?: string[]
}

export interface PRDMetadata {
  createdAt: string
  category: string
  complexity: string
  estimatedTime: number
  source: 'analyze' | 'manual'
}

// ============================================================================
// Progress Tracking (Ralph format)
// ============================================================================

export interface Progress {
  entries: ProgressEntry[]
}

export interface ProgressEntry {
  iteration: number
  timestamp: string
  storyId: number
  storyTitle: string
  filesModified: string[]
  learnings: string[]
  testsStatus: 'passed' | 'failed' | 'skipped'
  commitHash?: string
}

// ============================================================================
// Validation Types (internal SaaS-inspired)
// ============================================================================

export interface ValidationResult {
  skillGap: SkillGap
  status: 'validated' | 'alternative' | 'obsolete' | 'needs_review'
  confidence: number  // 0-100
  sources: ValidationSource[]
  alternativeSolution?: AlternativeSolution
  reasoning: string
  warnings: string[]
  recommendations: string[]
}

export interface ValidationSource {
  title: string
  url: string
  relevance: 'high' | 'medium' | 'low'
  domain?: string
}

export interface AlternativeSolution {
  title: string
  description: string
  advantages: string[]
  migrationEffort?: 'low' | 'medium' | 'high'
}

// ============================================================================
// Loop Engine Types
// ============================================================================

export interface RalphConfig {
  maxIterations: number
  delayMs: number
  autoValidate: boolean
  autoCommit: boolean
  contextWindow: string  // e.g., "4h"
  minCommits: number
  testCoverageMin: number
}

export interface LoopResult {
  status: 'complete' | 'max_iterations' | 'failed' | 'cancelled'
  iterations: number
  skillPath?: string
  errors?: string[]
  duration: number  // milliseconds
}

export interface IterationContext {
  prd: PRD
  prdPath: string
  progress: Progress
  sessionContext: SessionContext
  iteration: number
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisResult {
  sessionContext: SessionContext
  skillGaps: SkillGap[]
  improvements: Improvement[]
  timestamp: string
}

export interface Improvement {
  id: number
  title: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  gap: string
  dimension: string
  roi: string
  technology?: string
  pattern?: string
  problem?: string
  solution?: string
  skillGap?: SkillGap
}

// ============================================================================
// Skill Generation Types
// ============================================================================

export interface GeneratedSkill {
  name: string
  category: string
  path: string
  files: GeneratedFile[]
  tests: GeneratedFile[]
  docs: GeneratedFile[]
}

export interface GeneratedFile {
  path: string
  content: string
  type: 'source' | 'test' | 'doc' | 'config'
}

// ============================================================================
// Export all types
// ============================================================================

export type RalphMode = 'analyze' | 'improve' | 'auto'

export interface RalphOptions {
  mode: RalphMode
  skillName?: string
  sessionId?: string
  config?: Partial<RalphConfig>
}
