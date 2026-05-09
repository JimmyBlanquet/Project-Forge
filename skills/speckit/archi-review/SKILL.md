---
name: speckit-archi-review
description: >
  Run an architecture audit on the current project to detect drift, layer violations, ADR non-compliance,
  and technical debt. Inspired by ATAM (utility tree, scenarios), DCAR (decision-centric), and ISO 25010
  (quality attributes). Use this skill when the user wants to audit architecture, check architectural
  coherence, review ADR compliance, detect layer violations, find architecture drift, verify the project
  still respects its constitution and design decisions, or assess technical health. Also use when the user
  says "is the architecture still coherent", "check architecture", "audit the project", "are we drifting",
  "review architecture", "check ADR compliance", or "architecture health check". This is a read-only
  reporting skill — it does NOT fix issues, only reports them.
effort: high
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Methodology

This audit is a lightweight hybrid of established architecture evaluation methods:
- **ATAM** (CMU/SEI): Utility tree concept — hierarchize quality attributes into verifiable scenarios
- **DCAR**: Decision-centric — focus on ADRs and their rationale
- **ISO 25010**: 8 quality characteristics as evaluation checklist

Adapted for: 1 developer + Claude Code, executable in ~30 minutes, read-only.

Reference: `docs/plans/2026-03-06-architecture-audit-methodologies.md`

## Outline

### 1. Locate Architecture Artifacts

Search for these files (all optional — adapt to what exists):

| Artifact | Locations to check |
|---|---|
| Constitution | `.speckit/constitution.md`, `.speckit/constitution.yml` |
| ADRs | `docs/adr/*.md` (exclude TEMPLATE.md and README.md) |
| CLAUDE.md | `CLAUDE.md` (root) |
| Tech plan | `.speckit/features/*/plan.md` |
| Schema | `utils/db/schema.ts`, `prisma/schema.prisma`, or similar |

If no constitution AND no ADRs AND no CLAUDE.md exist, report:
> "No architecture reference documents found. Cannot audit against undefined rules. Consider running /speckit-constitution first."

### 2. Seven Evaluation Axes

Launch **4 parallel sub-agents** to scan the codebase. Each agent covers specific axes:

#### Agent 1: Constitution & ADR Compliance

**Axes covered:** Constitution conformity + ADR respect

- Read the constitution and all ADRs
- For each principle/decision, verify it is still respected in the code
- Flag violations with file + line reference
- Detect **dead ADRs**: decisions referencing files, patterns, or tools that no longer exist
- Detect **undocumented decisions**: major patterns in the code that have no corresponding ADR

#### Agent 2: Layer Integrity & Modularity

**Axes covered:** Layer boundaries + import structure

Scan for these common violations:
- `components/` or `app/(pages)/` importing from `utils/db/`, `drizzle-orm`, `prisma`
- `app/api/` importing from `components/`
- Circular dependencies between modules
- Files importing from deeply nested paths (> 3 levels of `../`)
- Direct `process.env` access outside `utils/`, `lib/`, or config files

Method: Use `grep` on import statements across the codebase, categorize by source/target layer.

#### Agent 3: Maintainability

**Axes covered:** Code health metrics

Scan for:
- Files exceeding 300 lines (warn) or 500 lines (error)
- Functions with high cognitive complexity (nested ifs > 3 levels deep)
- Code duplication (identical blocks > 10 lines)
- `TODO`, `FIXME`, `HACK`, `XXX` comments — count and categorize
- Unused exports (if `knip` is available, run it; otherwise grep for unexported patterns)
- Dependencies with known issues (`npm audit --json` if available)

#### Agent 4: Security & Testability

**Axes covered:** Security patterns + test coverage

Security checks:
- API routes without auth verification at the top
- User input used without Zod/validation
- Secrets or API keys hardcoded in source (not .env)
- SQL/NoSQL injection patterns (string concatenation in queries)
- Missing rate limiting on public endpoints

Testability checks:
- Ratio of test files to source files
- API routes without corresponding test files
- Complex functions (> 50 lines) without tests
- Missing test directory structure

### 3. Severity Classification

| Severity | Criteria | Example |
|---|---|---|
| **CRITICAL** | Constitution violation, security hole, broken layer boundary | Component imports DB directly |
| **HIGH** | ADR not respected, missing auth on API route, dead ADR | Route without auth check |
| **MEDIUM** | Maintainability issue, missing tests, TODO accumulation | File > 300 lines |
| **LOW** | Style, minor inconsistency, nice-to-have | Deep relative import |

### 4. Generate Audit Report

Create the report at `docs/audits/YYYY-MM-DD-architecture-audit.md`:

```markdown
# Architecture Audit Report

**Project**: [project name]
**Date**: [ISO date]
**Methodology**: ATAM/DCAR/ISO-25010 hybrid (Project-Forge)
**Status**: [PASS | WARN | FAIL]

---

## Executive Summary

[2-3 sentences: overall health, biggest risk, recommended action]

---

## Scores by Axis

| # | Axis | Score | Findings |
|---|------|-------|----------|
| 1 | Constitution Conformity | [1-5 stars] | [count] issues |
| 2 | ADR Compliance | [1-5 stars] | [count] issues |
| 3 | Layer Integrity | [1-5 stars] | [count] violations |
| 4 | Maintainability | [1-5 stars] | [count] issues |
| 5 | Security | [1-5 stars] | [count] issues |
| 6 | Testability | [1-5 stars] | [count] gaps |
| 7 | Technical Debt | [1-5 stars] | [count] items |

**Overall: [average] / 5**

---

## Critical & High Findings

| # | Severity | Axis | Description | File | Recommendation |
|---|----------|------|-------------|------|----------------|
| 1 | CRITICAL | ... | ... | ... | ... |

---

## Medium & Low Findings

[Grouped summary, not individual table rows — keep concise]

---

## ADR Health

| ADR | Status | Notes |
|-----|--------|-------|
| ADR-001: ... | Respected / Violated / Dead | [detail] |

---

## Risk Scenarios

### Growth Scenario
[What happens when the project grows? Which architectural decisions will break first?]

### Security Scenario
[What is the most likely attack vector given the current architecture?]

---

## Metrics

- Source files scanned: X
- Test files found: Y
- Test/source ratio: Z%
- TODO/FIXME count: N
- Files > 300 lines: N
- Dependency vulnerabilities: N (high), N (moderate)

---

## Priority Actions

1. [Most critical action]
2. [Second priority]
3. [Third priority]

**Suggested next step**: [specific skill or action]
```

### 5. Determine Overall Status

- **PASS**: 0 critical, 0 high, average score >= 4/5
- **WARN**: 0 critical, some high or medium, average score >= 3/5
- **FAIL**: any critical finding, or average score < 3/5

### 6. Report to User

Output:
- Overall status (PASS/WARN/FAIL)
- Average score with breakdown
- Top 3 priority actions
- Path to the full report

## Important Rules

- This is strictly **read-only** — never modify source files
- Constitution is authoritative — violations are always CRITICAL
- ADR violations are HIGH by default, CRITICAL if the ADR was marked as non-negotiable
- Use 4 parallel sub-agents (Agent tool) for the scan phase — do NOT run sequentially
- If a tool (knip, npm audit) is not available, skip gracefully and note it in the report
- Create the `docs/audits/` directory if it doesn't exist
- Max 30 findings in the critical/high table — summarize overflow
- Score each axis honestly: 5 = excellent, 4 = good, 3 = acceptable, 2 = concerning, 1 = critical
- Include concrete file:line references for every finding, not vague descriptions
- The growth and security scenarios are the most valuable part — think like an architect, not a linter

**NOW**: Run the architecture audit and generate the report.
