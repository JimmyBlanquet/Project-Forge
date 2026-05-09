/**
 * Context Builder
 *
 * Builds fresh context for each Ralph++ iteration
 * Inspired by an internal SaaS's session-context.ts
 */

import { execSync } from 'child_process'
import type {
  SessionContext,
  Commit,
  FileChange,
  FileCategorization,
  DetectedPattern
} from './types'

export class ContextBuilder {
  constructor(private contextWindow: string = '4h') {}

  /**
   * Build session context from Git history
   */
  async build(): Promise<SessionContext> {
    const branch = this.getCurrentBranch()
    const commits = this.getRecentCommits()
    const filesChanged = this.getFilesChanged(commits)
    const categorization = this.categorizeFiles(filesChanged)
    const patterns = this.detectPatterns(filesChanged, commits)
    const duration = this.estimateDuration(commits)

    return {
      branch,
      commits,
      filesChanged,
      categorization,
      patterns,
      duration,
      timestamp: Date.now()
    }
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', {
        encoding: 'utf-8'
      }).trim()
    } catch {
      return 'unknown'
    }
  }

  private getRecentCommits(): Commit[] {
    try {
      // Get commits from last N hours
      const since = this.contextWindow
      const format = '%H%n%s%n%an%n%ai%n--END--'
      const output = execSync(
        `git log --since="${since}" --pretty=format:"${format}"`,
        { encoding: 'utf-8' }
      )

      if (!output.trim()) return []

      const commits: Commit[] = []
      const blocks = output.split('--END--').filter(b => b.trim())

      for (const block of blocks) {
        const lines = block.trim().split('\n')
        if (lines.length < 4) continue

        const [hash, message, author, date] = lines
        const filesChanged = this.getFilesForCommit(hash)

        commits.push({
          hash: hash.slice(0, 7),
          message,
          author,
          date,
          filesChanged
        })
      }

      return commits
    } catch {
      return []
    }
  }

  private getFilesForCommit(hash: string): string[] {
    try {
      const output = execSync(`git show --name-only --pretty=format: ${hash}`, {
        encoding: 'utf-8'
      })
      return output.split('\n').filter(f => f.trim())
    } catch {
      return []
    }
  }

  private getFilesChanged(commits: Commit[]): FileChange[] {
    const fileStats = new Map<string, FileChange>()

    for (const commit of commits) {
      for (const file of commit.filesChanged) {
        try {
          const stats = execSync(
            `git diff ${commit.hash}~1 ${commit.hash} --numstat -- "${file}" 2>/dev/null`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
          ).trim()

          if (!stats) continue

          const [additions, deletions] = stats.split('\t')
          const existing = fileStats.get(file)

          fileStats.set(file, {
            path: file,
            additions: (existing?.additions || 0) + parseInt(additions || '0'),
            deletions: (existing?.deletions || 0) + parseInt(deletions || '0'),
            status: this.getFileStatus(file, commit.hash)
          })
        } catch {
          // File might have been deleted or renamed
          if (!fileStats.has(file)) {
            fileStats.set(file, {
              path: file,
              additions: 0,
              deletions: 0,
              status: 'modified'
            })
          }
        }
      }
    }

    return Array.from(fileStats.values())
  }

  private getFileStatus(
    file: string,
    hash: string
  ): 'added' | 'modified' | 'deleted' | 'renamed' {
    try {
      const status = execSync(
        `git diff ${hash}~1 ${hash} --name-status -- "${file}" 2>/dev/null`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim()

      if (status.startsWith('A')) return 'added'
      if (status.startsWith('D')) return 'deleted'
      if (status.startsWith('R')) return 'renamed'
      return 'modified'
    } catch {
      return 'modified'
    }
  }

  private categorizeFiles(files: FileChange[]): FileCategorization {
    const categorization: FileCategorization = {
      skills: [],
      core: [],
      tests: [],
      docs: [],
      cicd: [],
      config: []
    }

    for (const file of files) {
      const path = file.path

      if (path.includes('skills/')) {
        categorization.skills.push(path)
      } else if (path.includes('test') || path.endsWith('.test.ts')) {
        categorization.tests.push(path)
      } else if (
        path.endsWith('.md') ||
        path.includes('docs/') ||
        path.includes('README')
      ) {
        categorization.docs.push(path)
      } else if (
        path.includes('.github/') ||
        path.includes('ci') ||
        path.includes('cd')
      ) {
        categorization.cicd.push(path)
      } else if (
        path.endsWith('.json') ||
        path.endsWith('.yml') ||
        path.endsWith('.yaml') ||
        path.includes('config')
      ) {
        categorization.config.push(path)
      } else if (path.includes('src/') || path.includes('lib/')) {
        categorization.core.push(path)
      }
    }

    return categorization
  }

  private detectPatterns(
    files: FileChange[],
    commits: Commit[]
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = []

    // Pattern 1: Multiple bug fixes
    const fixCommits = commits.filter(c =>
      /^fix[:(]/i.test(c.message)
    )
    if (fixCommits.length >= 2) {
      patterns.push({
        type: 'duplication',
        files: fixCommits.flatMap(c => c.filesChanged).slice(0, 5),
        description: `${fixCommits.length} bug fix commits detected`,
        severity: 'medium',
        occurrences: fixCommits.length
      })
    }

    // Pattern 2: Large file additions (potential skill extraction)
    const largeFiles = files.filter(f => f.additions > 50)
    if (largeFiles.length > 0) {
      patterns.push({
        type: 'missing-abstraction',
        files: largeFiles.map(f => f.path),
        description: `${largeFiles.length} files with 50+ additions (potential extraction)`,
        severity: 'high',
        occurrences: largeFiles.length
      })
    }

    // Pattern 3: Repeated file modifications
    const fileModificationCount = new Map<string, number>()
    for (const commit of commits) {
      for (const file of commit.filesChanged) {
        fileModificationCount.set(file, (fileModificationCount.get(file) || 0) + 1)
      }
    }
    const repeatedFiles = Array.from(fileModificationCount.entries())
      .filter(([_, count]) => count >= 3)
      .map(([file]) => file)

    if (repeatedFiles.length > 0) {
      patterns.push({
        type: 'repeated-logic',
        files: repeatedFiles,
        description: `${repeatedFiles.length} files modified 3+ times`,
        severity: 'medium',
        occurrences: repeatedFiles.length
      })
    }

    // Pattern 4: Configuration changes
    const configChanges = files.filter(f =>
      f.path.endsWith('.json') ||
      f.path.endsWith('.yml') ||
      f.path.endsWith('.yaml') ||
      f.path.includes('config')
    )
    if (configChanges.length >= 3) {
      patterns.push({
        type: 'configuration',
        files: configChanges.map(f => f.path),
        description: `${configChanges.length} configuration files changed`,
        severity: 'low',
        occurrences: configChanges.length
      })
    }

    return patterns
  }

  private estimateDuration(commits: Commit[]): string {
    if (commits.length === 0) return '0h'

    try {
      const firstDate = new Date(commits[commits.length - 1].date)
      const lastDate = new Date(commits[0].date)
      const diffMs = lastDate.getTime() - firstDate.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`
      }
      return `${diffMinutes}m`
    } catch {
      return 'unknown'
    }
  }
}
