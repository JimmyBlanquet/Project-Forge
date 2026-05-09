# Ralph++ - Autonomous Skill Generation System

**Version:** 1.0.0-alpha.1 (Phase 2.1)
**Status:** Core Implementation Complete (75%)

## What is Ralph++?

Ralph++ is an autonomous skill generation system that **learns from your coding sessions** and **creates reusable skills** automatically. Unlike generic code improvement tools, Ralph++ produces installable skills that can be shared across projects.

**Innovation:** Creates skills, not just code.

### The Problem

You spend hours implementing authentication, rate limiting, or CI/CD - then repeat it in the next project. Generic AI tools help with code, but don't create portable, reusable solutions.

### The Solution

Ralph++ analyzes your Git commits, detects patterns, and autonomously creates **reusable skills** with:
- Extracted, generic code
- Complete test suites
- Documentation
- Installation scripts

## Architecture

Ralph++ combines three proven approaches:

1. **Ralph's Loop** - Fresh context, PRD-driven implementation, Git-based state
2. **Multi-layer Validation** - Pattern from a previous internal SaaS: verification + confidence scoring
3. **Project-Forge's Skills** - Installable, portable, marketplace-ready

```
Your Session → Analyze → Detect Gaps → Generate PRD → Ralph Loop → Skill
```

## Quick Start

### Installation

```bash
# From Project-Forge root
cd systems/ralph++
npm install

# Test installation
npm run cli help
```

### Basic Workflow

```bash
# 1. Work on your project (normal development)
git commit -m "feat: add authentication"
git commit -m "feat: add session management"

# 2. Analyze your session
npm run cli analyze

# Output:
# Skill Gaps Detected: 1
# 1. auth-session-manager (HIGH)
#    ROI: 160-320 min
#    PRD generated: .ralph++/sessions/*/auth-session-manager-prd.json

# 3. Implement skill (Phase 2.2 - coming soon)
npm run cli improve auth-session-manager
```

## Commands

### `ralph++ analyze`

Analyzes your recent Git session and detects skill gaps.

**What it does:**
- Collects commits from last 4 hours (configurable)
- Analyzes file changes and patterns
- Detects skill gaps (missing abstractions, duplication, patterns)
- Calculates ROI for each gap
- Generates PRDs for HIGH priority skills

**Example:**

```bash
$ npm run cli analyze

[Ralph++] Analyzing session...

Branch: main
Commits: 22
Files changed: 325
Duration: 8h 44m

Skill Gaps Detected: 2

1. config-centralization (HIGH)
   Category: core
   Reason: Multiple configuration files changed (32)
   ROI: 160-320 min
   Complexity: low
   Files affected: 32

2. pattern (MEDIUM)
   Category: core
   Reason: Files modified repeatedly (3x), potential reusable pattern
   ROI: 30-60 min
   Complexity: low
   Files affected: 3

Generating PRDs for 1 HIGH priority skills...
✓ Generated PRD: .ralph++/sessions/1768686103333/config-centralization-prd.json

[Ralph++] Analysis complete!
```

### `ralph++ improve <skill-name>`

Runs the Ralph loop to implement a skill (MVP - manual guidance).

**What it does:**
- Loads PRD from `.ralph++/sessions/`
- Selects highest-priority incomplete story
- Provides implementation guidance (MVP)
- Updates PRD as stories complete
- Tracks progress in `progress.txt`

**Phase 2.2 (coming soon):** Fully autonomous implementation using Claude Code Task tool.

**Example:**

```bash
$ npm run cli improve config-centralization

[Ralph++] Improving skill: config-centralization

Iteration 1/10
Story: Create config-centralization skill structure
[Manual implementation guidance provided...]
```

### `ralph++ help`

Shows help and available commands.

## Configuration

Edit `config/ralph.config.json`:

```json
{
  "ralph++": {
    "modes": {
      "analyze": {
        "enabled": true,
        "autoStart": false,
        "contextWindow": "4h",     // Git lookback window
        "minCommits": 3             // Minimum commits to analyze
      },
      "improve": {
        "maxIterations": 10,        // Max Ralph loop iterations
        "delayMs": 2000,            // Delay between iterations
        "autoValidate": true,       // External validation (Phase 2.3)
        "autoCommit": false         // Auto-commit (Phase 2.2)
      }
    },
    "skills": {
      "categories": ["core", "integration", "cicd", "custom"],
      "testCoverageMin": 70,        // Minimum test coverage
      "docRequired": true,          // Require documentation
      "installScriptRequired": true // Require install script
    },
    "validation": {
      "external": true,             // WebSearch validation (Phase 2.3)
      "maxQueries": 3,              // Max validation queries
      "confidenceMin": 60           // Minimum confidence score
    }
  }
}
```

## How It Works

### 1. Context Collection

Ralph++ analyzes your Git history to understand what you built:

```typescript
// From last 4 hours (configurable)
- Commits: 22
- Files changed: 325
- Patterns detected:
  * Multiple config files (32)
  * Repeated modifications (3 files, 3x each)
  * Large file additions (5 files, 100+ lines)
```

### 2. Skill Gap Detection

Detects opportunities for skill creation using multiple strategies:

**Pattern-Based Detection:**
- Large file additions (50+ lines) → potential extraction
- Multiple bug fixes → reliability skill
- Repeated modifications → reusable pattern

**Duplication-Based Detection:**
- 3+ similar API routes → API template skill
- 3+ similar components → component generator skill
- 3+ similar tests → test framework skill

**Category-Based Detection:**
- 2+ CI/CD files → CI/CD optimization skill
- 3+ config files → config centralization skill
- 5+ docs → documentation generator skill

### 3. ROI Calculation

Prioritizes skills by ROI:

```typescript
ROI = (time_saved_per_use * repetition_count) / implementation_time

Example:
- Time saved: 10 min per use
- Repetitions: 32 files
- Implementation: 20 min
- ROI = (10 * 32) / 20 = 16x (HIGH priority)
```

### 4. PRD Generation

Creates a 5-story PRD for each skill:

```json
{
  "skillName": "config-centralization",
  "stories": [
    {
      "id": 1,
      "title": "Create config-centralization skill structure",
      "acceptanceCriteria": [
        "Directory created: skills/core/config-centralization/",
        "Subdirectories: files/, tests/, docs/",
        "Files: README.md, SKILL.md, install.sh"
      ],
      "passes": false
    },
    // ... 4 more stories
  ],
  "metadata": {
    "category": "core",
    "complexity": "low",
    "estimatedTime": 20,
    "source": "analyze"
  }
}
```

### 5. Ralph Loop (Phase 2.2 - Coming Soon)

Implements skill autonomously:

```
Loop iteration:
1. Load PRD → 2. Select story → 3. Implement → 4. Test → 5. Commit
                                       ↓
                                  Update PRD
                                  Append progress.txt
                                       ↓
                                  Delay 2s
                                       ↓
                                  Next iteration
```

**Exit Conditions:**
- All stories pass: `SUCCESS`
- Max iterations reached: `INCOMPLETE`
- Critical error: `FAILED`

## Real-World Example

From our testing on Project-Forge:

```bash
# Session: Phase 1 skills extraction (8h 44m)
# Commits: 22
# Files: 325 changes

$ npm run cli analyze

# Detected:
# 1. config-centralization (HIGH)
#    - 32 config files changed (package.json, tsconfig.json, etc.)
#    - ROI: 160-320 min (16x)
#    - Estimated implementation: 20 min
#
# 2. pattern (MEDIUM)
#    - 3 files modified repeatedly
#    - ROI: 30-60 min (3x)
#    - Estimated implementation: 15 min

# Generated PRD: config-centralization-prd.json
# - 5 stories with acceptance criteria
# - Ready for Ralph loop implementation
```

## Generated PRD Structure

Each PRD follows this structure:

```json
{
  "skillName": "skill-name",
  "stories": [
    {
      "id": 1,
      "title": "Create skill-name skill structure",
      "description": "Create directory structure and boilerplate...",
      "acceptanceCriteria": ["...", "..."],
      "priority": 1,
      "passes": false,
      "filesAffected": ["..."]
    }
  ],
  "metadata": {
    "createdAt": "2026-01-17T...",
    "category": "core",
    "complexity": "low|medium|high",
    "estimatedTime": 20,
    "source": "analyze"
  }
}
```

## Directory Structure

```
systems/ralph++/
├── README.md                    # This file
├── package.json                 # Package config
├── cli.ts                       # MVP CLI (executable)
├── core/
│   ├── types.ts                 # Type definitions (150+ lines)
│   ├── context-builder.ts       # Git context collection (200+ lines)
│   ├── skill-analyzer.ts        # Skill gap detection (200+ lines)
│   ├── skill-generator.ts       # PRD generation (120+ lines)
│   ├── loop-engine.ts           # Ralph loop engine (200+ lines)
│   └── index.ts                 # Exports
├── config/
│   └── ralph.config.json        # Configuration
├── tests/
│   └── core.test.ts             # Unit tests (6 tests, all passing)
├── .ralph++/                    # Generated sessions and PRDs
│   └── sessions/
│       └── <timestamp>/
│           └── <skill>-prd.json
├── skills/                      # Built-in skills (future)
├── templates/                   # PRD templates (future)
└── docs/                        # Documentation (future)
```

## Development Status

**Phase 2.1: Core Implementation (75% complete) ✅**

| Component | Status |
|-----------|--------|
| Context Builder | ✅ Complete |
| Skill Analyzer | ✅ Complete |
| Skill Generator | ✅ Complete |
| Loop Engine | ✅ MVP (manual) |
| CLI | ✅ MVP |
| Tests | ✅ 6/6 passing |
| Documentation | 🟡 In Progress |

**Phase 2.2: Autonomous Implementation (Next)**
- Integrate Claude Code Task tool
- Autonomous file creation
- Autonomous code extraction
- Autonomous testing
- Autonomous committing
- End-to-end skill creation

**Phase 2.3: External Validation**
- WebSearch integration
- Confidence scoring
- Validation reports

**Phase 2.4: Auto Mode**
- Parallel skill creation
- PR creation
- Marketplace integration

## Testing

```bash
# Run unit tests
npm test

# Run specific test
npm test -- core.test.ts

# Watch mode
npm run test:watch

# Test CLI
npm run cli analyze
npm run cli help
```

**Current Test Results:**
- ✅ 6/6 tests passing
- ✅ Runtime: 41ms
- ✅ Coverage: types, components, PRD generation

## Troubleshooting

### Git errors during analysis

If you see `fatal: bad revision` errors, this is normal for shallow clones or orphaned commits. Ralph++ handles these gracefully and continues analysis.

### No skill gaps detected

This can happen if:
- Not enough commits (< 3)
- Session too short (< 1 hour)
- No clear patterns detected

Try working longer and committing more frequently.

### PRD not found

Ensure you run `ralph++ analyze` first to generate PRDs. PRDs are stored in `.ralph++/sessions/<timestamp>/`.

### Tests failing

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test
```

## Architecture Details

Ralph++ uses a modular architecture:

```
ContextBuilder → SessionContext → SkillAnalyzer → SkillGap[]
                                                       ↓
                                               SkillGenerator → PRD
                                                       ↓
                                               RalphLoopEngine → Skill
```

**Key Patterns:**
- **Fresh Context:** Each loop iteration starts with clean context (Ralph pattern)
- **Append-Only Progress:** progress.txt never rewritten (Ralph pattern)
- **Multi-Layer Verification:** Internal analysis + external validation (internal SaaS pattern)
- **Skill-Based Output:** Creates installable skills (Project-Forge pattern)

## Contributing

Ralph++ is part of Project-Forge. See main project README for contribution guidelines.

## References

- **Ralph Original:** github.com/snarktank/ralph
- **Multi-layer verification pattern:** inspired by an internal production SaaS

## License

MIT

## What's Next?

**Immediate (Phase 2.1 completion):**
- ✅ Core implementation complete
- ✅ Testing complete
- 🟡 Documentation (this file)

**Phase 2.2 (1-2 weeks):**
- Autonomous skill creation end-to-end
- Integration with Claude Code Task tool
- Full Ralph loop automation

**Phase 2.3 (3-5 days):**
- External validation with WebSearch
- Confidence scoring
- Validation reports

**Phase 2.4 (1 week):**
- Auto mode (hands-free skill generation)
- PR creation and marketplace publishing
- Production-ready

---

**Last Updated:** 2026-01-17
**Version:** 1.0.0-alpha.1
**Status:** Phase 2.1 - Core Implementation (75%)
