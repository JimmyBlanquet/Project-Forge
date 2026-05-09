/**
 * Skill Generator
 *
 * Generates PRD (prd.json) for new skills based on detected gaps
 * Follows Ralph format: stories with acceptance criteria
 */

import type { SkillGap, PRD, Story, PRDMetadata } from './types'

export class SkillGenerator {
  /**
   * Generate PRD from skill gap
   */
  generatePRD(skillGap: SkillGap): PRD {
    const stories = this.generateStories(skillGap)
    const metadata = this.generateMetadata(skillGap)

    return {
      skillName: skillGap.name,
      stories,
      metadata
    }
  }

  private generateStories(skillGap: SkillGap): Story[] {
    const stories: Story[] = []

    // Story 1: Create skill structure
    stories.push({
      id: 1,
      title: `Create ${skillGap.name} skill structure`,
      description: `Create directory structure and boilerplate files for ${skillGap.name} skill in skills/${skillGap.category}/${skillGap.name}/`,
      acceptanceCriteria: [
        `Directory created: skills/${skillGap.category}/${skillGap.name}/`,
        'Subdirectories created: files/, tests/, docs/',
        'Files created: README.md, SKILL.md, install.sh',
        'All files have basic content (not empty)',
        'install.sh is executable (chmod +x)'
      ],
      priority: 1,
      passes: false,
      filesAffected: [
        `skills/${skillGap.category}/${skillGap.name}/README.md`,
        `skills/${skillGap.category}/${skillGap.name}/SKILL.md`,
        `skills/${skillGap.category}/${skillGap.name}/install.sh`
      ]
    })

    // Story 2: Extract code
    stories.push({
      id: 2,
      title: `Extract reusable code for ${skillGap.name}`,
      description: `Extract code from existing files: ${skillGap.evidence.filesAffected.slice(0, 3).join(', ')}`,
      acceptanceCriteria: [
        'Code extracted to files/ directory',
        'Generic implementation (no hardcoded project-specific values)',
        'TypeScript types properly defined',
        'Exports working (can be imported)',
        'No external dependencies on non-portable code'
      ],
      priority: 2,
      passes: false,
      filesAffected: skillGap.evidence.filesAffected.slice(0, 5)
    })

    // Story 3: Write tests
    stories.push({
      id: 3,
      title: `Write tests for ${skillGap.name}`,
      description: 'Create comprehensive test suite to validate skill functionality',
      acceptanceCriteria: [
        'Test file created in tests/ directory',
        'Unit tests for core functionality',
        'Integration tests if applicable',
        'All tests passing (npm test)',
        'Test coverage > 70%'
      ],
      priority: 3,
      passes: false,
      filesAffected: [
        `skills/${skillGap.category}/${skillGap.name}/tests/${skillGap.name}.test.ts`
      ]
    })

    // Story 4: Write documentation
    stories.push({
      id: 4,
      title: `Document ${skillGap.name} skill`,
      description: 'Write complete documentation with usage examples',
      acceptanceCriteria: [
        'SKILL.md complete with: description, features, installation, usage',
        'README.md with quick start guide',
        'Usage examples provided (code snippets)',
        'Environment variables documented if any',
        'Troubleshooting section if applicable'
      ],
      priority: 4,
      passes: false,
      filesAffected: [
        `skills/${skillGap.category}/${skillGap.name}/SKILL.md`,
        `skills/${skillGap.category}/${skillGap.name}/README.md`
      ]
    })

    // Story 5: Create install script
    stories.push({
      id: 5,
      title: `Create install script for ${skillGap.name}`,
      description: 'Write automated installation script that copies files and sets up dependencies',
      acceptanceCriteria: [
        'install.sh script functional',
        'Detects project root (package.json)',
        'Copies files to correct locations',
        'Shows success/error messages',
        'Works on fresh project installation'
      ],
      priority: 5,
      passes: false,
      filesAffected: [
        `skills/${skillGap.category}/${skillGap.name}/install.sh`
      ]
    })

    return stories
  }

  private generateMetadata(skillGap: SkillGap): PRDMetadata {
    return {
      createdAt: new Date().toISOString(),
      category: skillGap.category,
      complexity: skillGap.complexity,
      estimatedTime: skillGap.estimatedTime,
      source: 'analyze'
    }
  }

  /**
   * Save PRD to file
   */
  async savePRD(prd: PRD, outputPath: string): Promise<void> {
    const { writeFile } = await import('fs/promises')
    await writeFile(outputPath, JSON.stringify(prd, null, 2), 'utf-8')
  }

  /**
   * Load PRD from file
   */
  async loadPRD(path: string): Promise<PRD> {
    const { readFile } = await import('fs/promises')
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }
}
