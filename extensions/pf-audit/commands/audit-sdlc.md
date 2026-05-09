
## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Context

This audit compares the current project against **10 SDLC domains** expected of a production SaaS application. The benchmark is calibrated for:
- **AI-first workflow** (Claude Code / LLM-assisted development)
- **Solo developer** or very small team
- **80/20 rule**: only flag gaps where effort-to-impact ratio is favorable
- **Pragmatic**: skip items that are over-engineering for the project's stage

Scoring: each domain gets a score from 0-100%. The overall score is the average.

## Outline

### Phase 1: Discovery (scan the project)

Run all discovery steps **in parallel** where possible. Do NOT ask the user questions — scan everything automatically.

#### 1.1 Package & Framework Detection

Read `package.json` (or `pyproject.toml`, `go.mod`, etc.) to identify:
- **Framework**: Next.js, Remix, SvelteKit, Express, FastAPI, etc.
- **ORM**: Prisma, Drizzle, TypeORM, SQLAlchemy, etc.
- **Auth**: NextAuth/Auth.js, Supabase Auth, Clerk, Lucia, etc.
- **Test framework**: vitest, jest, pytest, playwright, cypress, etc.
- **Linting**: eslint, biome, prettier, etc.
- **CI tooling**: husky, commitlint, lint-staged, etc.

#### 1.2 Project Structure Scan

Check for the presence of these files/dirs (adapt patterns to the detected framework):

**Requirements & Spec:**
- `specs/` or `.speckit/` or any spec directory
- `docs/adr/` or `docs/decisions/`
- Constitution or project principles file

**Testing:**
- Test config: `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*`
- Test directories: `__tests__/`, `tests/`, `test/`, `*.test.*`, `*.spec.*`
- Coverage config: `coverage` in test config or `c8`/`istanbul`/`coverage-v8`
- E2E tests: `e2e/`, `tests/e2e/`, playwright or cypress config
- Mutation testing: `stryker.config.*`

**Quality:**
- `.jscpd.json` or jscpd in package.json
- `knip.config.*` or knip in package.json
- `eslint-plugin-sonarjs` in dependencies
- `.eslintrc*` or `eslint.config.*`
- `.prettierrc*` or `prettier.config.*`

**Security:**
- Security-related scripts in package.json
- `.github/workflows/` containing `security`, `codeql`, `semgrep`, `snyk`
- Pre-commit hooks checking for secrets
- `npm audit` in CI scripts
- `.env.example` (secrets documentation)
- CSP headers in config

**CI/CD:**
- `.github/workflows/` — list all workflow files
- `vercel.json` or `netlify.toml` or `Dockerfile`
- Deploy scripts
- Branch protection indicators

**Monitoring & Observability:**
- Sentry config: `sentry.*.config.*`, `@sentry/*` in deps
- Analytics: `@vercel/analytics`, `posthog`, `plausible` in deps
- Health endpoint: grep for `/api/health` or `/healthz`
- Logging: structured logging library in deps

**Documentation:**
- `README.md` quality (>100 lines = good)
- `CLAUDE.md` or `.cursorrules` (AI instructions)
- `CHANGELOG.md`
- API documentation
- `docs/` directory depth

**Maintenance:**
- `renovate.json` or `.github/dependabot.yml`
- `commitlint` config
- `.husky/` directory
- Changelog generation script

**Incident Response:**
- `RUNBOOK.md` or `docs/incidents/`
- Post-mortem template
- Rollback script or documentation

**Performance:**
- Bundle analysis config (`@next/bundle-analyzer`, `webpack-bundle-analyzer`)
- Lighthouse CI config
- Performance test scripts (k6, artillery)
- Image optimization (sharp, next/image usage)

#### 1.3 CI Pipeline Analysis

For each workflow file in `.github/workflows/`:
- What triggers it (push, PR, schedule)
- What it runs (lint, test, build, deploy, security scan)
- Whether it blocks merges

#### 1.4 MCP & Tooling Integration Check

Detect which MCP servers are configured and which are missing based on the project's tech stack.

**Detection method:**
```bash
# List configured MCP servers
claude mcp list 2>/dev/null || echo "no-mcp-cli"
```

If the CLI is not available, check for `.mcp.json` in the project root.

**Evaluate based on detected stack:**

| Tech Stack Signal | Recommended MCP | How to detect |
|-------------------|----------------|---------------|
| `@supabase/supabase-js` in deps | Supabase MCP | `grep supabase package.json` |
| `stripe` in deps | Stripe MCP | `grep stripe package.json` |
| `@sentry/*` in deps OR `sentry.*.config.*` files | Sentry MCP | `grep sentry package.json` or glob `sentry.*.config.*` |
| Any project with deployment | Vercel/deployment logs | Check `vercel.json` or deploy scripts |

**Score contribution:** MCP integration is factored into the **Incident Readiness** domain (Sentry) and **Implementation Quality** domain (dev tooling).

For each missing MCP that matches the stack, add a Quick Win to the action plan:
```
Install {name} MCP: claude mcp add --transport http {name} {url}
```

#### 1.5 Git History Quick Check

```bash
git log --oneline -20
```

Check:
- Are commits conventional? (feat:, fix:, chore:, etc.)
- Is there a branching strategy visible? (feat/, fix/ branches)
- How active is the project?

### Phase 2: Scoring

Score each domain based on what was found. Use this rubric:

#### Domain 1: Requirements & Specification (weight: 10%)

| Score | Criteria |
|-------|----------|
| 0% | No specs, no documentation of what to build |
| 25% | README describes features informally |
| 50% | Some spec files or issue templates exist |
| 75% | Structured specs with acceptance criteria |
| 100% | Full spec pipeline (specify → plan → tasks) + constitution |

#### Domain 2: Architecture & Design (weight: 10%)

| Score | Criteria |
|-------|----------|
| 0% | No architecture documentation |
| 25% | README mentions tech stack |
| 50% | Some docs exist (API docs, data model) |
| 75% | ADRs + architecture docs + layer conventions |
| 100% | ADRs + archi review process + fitness functions (ESLint layers) |

#### Domain 3: Implementation Quality (weight: 15%)

| Score | Criteria |
|-------|----------|
| 0% | No linting, no formatting, no conventions |
| 25% | Basic ESLint or Prettier |
| 50% | ESLint + Prettier + some custom rules |
| 75% | ESLint + Prettier + sonarjs + commitlint |
| 100% | + code duplication detection (jscpd) + dead code (knip) + AI instructions (CLAUDE.md) |

#### Domain 4: Testing (weight: 15%)

| Score | Criteria |
|-------|----------|
| 0% | No tests |
| 25% | Some unit tests exist |
| 50% | Unit tests with reasonable coverage + test config |
| 75% | Unit + E2E tests in CI |
| 100% | Unit + E2E + mutation testing + architecture fitness tests |

#### Domain 5: Security (weight: 15%)

| Score | Criteria |
|-------|----------|
| 0% | No security measures beyond framework defaults |
| 25% | Auth implemented + .env for secrets |
| 50% | + npm audit + basic CSP headers |
| 75% | + SAST in CI (CodeQL or Semgrep) + secrets scanning + dependency auto-update |
| 100% | + threat model + security review process + OWASP checklist |

#### Domain 6: CI/CD Pipeline (weight: 10%)

| Score | Criteria |
|-------|----------|
| 0% | No CI, manual deploy |
| 25% | Basic CI (lint or test) |
| 50% | CI runs lint + test + build on PRs |
| 75% | + auto-deploy + branch protection |
| 100% | + smoke tests post-deploy + staging environment + deployment protection |

#### Domain 7: Performance (weight: 5%)

| Score | Criteria |
|-------|----------|
| 0% | No performance consideration |
| 25% | Image optimization |
| 50% | + bundle awareness (analyzer available) |
| 75% | + performance budget or Lighthouse CI |
| 100% | + load testing + Core Web Vitals monitoring |

#### Domain 8: Documentation (weight: 5%)

| Score | Criteria |
|-------|----------|
| 0% | No README or minimal |
| 25% | Basic README with setup instructions |
| 50% | README + some docs/ |
| 75% | README + CLAUDE.md + docs/ + CHANGELOG |
| 100% | + API docs + ADRs + runbook + contributing guide |

#### Domain 9: Maintenance & Dependencies (weight: 10%)

| Score | Criteria |
|-------|----------|
| 0% | No dependency management |
| 25% | Package-lock exists |
| 50% | + conventional commits |
| 75% | + auto-update (Renovate/Dependabot) + commitlint + changelog |
| 100% | + dead dependency detection (knip) + husky hooks + PR template |

#### Domain 10: Incident Readiness (weight: 5%)

| Score | Criteria |
|-------|----------|
| 0% | No incident preparation |
| 25% | Error tracking configured (Sentry) |
| 50% | + health endpoint |
| 75% | + runbook + post-mortem template |
| 100% | + rollback procedure + monitoring alerts |

### Phase 3: Report Generation

Generate a report in this exact format. Save it as `audit-sdlc-report.md` in the project root.

```markdown
# SDLC Maturity Audit Report

**Project:** {project name from package.json or directory name}
**Date:** {today}
**Framework:** {detected framework}
**Overall Score:** {weighted average}% — {verdict}

Verdicts: <40% = "Needs Significant Work", 40-59% = "Below Standard", 60-74% = "Adequate", 75-89% = "Good", 90%+ = "Excellent"

---

## Scorecard

| # | Domain | Score | Status |
|---|--------|-------|--------|
| 1 | Requirements & Spec | {score}% | {PASS/WARN/FAIL} |
| 2 | Architecture & Design | {score}% | {PASS/WARN/FAIL} |
| 3 | Implementation Quality | {score}% | {PASS/WARN/FAIL} |
| 4 | Testing | {score}% | {PASS/WARN/FAIL} |
| 5 | Security | {score}% | {PASS/WARN/FAIL} |
| 6 | CI/CD Pipeline | {score}% | {PASS/WARN/FAIL} |
| 7 | Performance | {score}% | {PASS/WARN/FAIL} |
| 8 | Documentation | {score}% | {PASS/WARN/FAIL} |
| 9 | Maintenance & Deps | {score}% | {PASS/WARN/FAIL} |
| 10 | Incident Readiness | {score}% | {PASS/WARN/FAIL} |

Status: PASS (>=75%), WARN (50-74%), FAIL (<50%)

---

## Detailed Findings

### {Domain Name} — {score}% {status emoji}

**What's in place:**
- {bullet list of what was found}

**What's missing:**
- {bullet list of gaps vs. standard}

**Evidence:**
- {file paths or config snippets that justify the score}

(repeat for each domain)

---

## Action Plan

Priority is based on: impact (how much it improves the score) × inverse effort (how easy it is).
Only include actions where effort/impact ratio is favorable (80/20 rule).

### Quick Wins (< 1 hour each)

| # | Action | Domain | Expected Impact |
|---|--------|--------|----------------|
| 1 | {action description} | {domain} | {score before} → {score after} |

### Medium Effort (1-4 hours each)

| # | Action | Domain | Expected Impact |
|---|--------|--------|----------------|

### Strategic (> 4 hours, evaluate ROI first)

| # | Action | Domain | Expected Impact |
|---|--------|--------|----------------|

---

## MCP Integration

| MCP Server | Status | Recommended | Install Command |
|-----------|--------|-------------|-----------------|
| Sentry | {installed/missing} | {yes/no based on stack} | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Supabase | {installed/missing} | {yes/no based on stack} | `claude mcp add --transport http supabase https://mcp.supabase.com` |
| Stripe | {installed/missing} | {yes/no based on stack} | `claude mcp add --transport http stripe https://mcp.stripe.com` |

{Only show rows where the MCP is recommended based on detected dependencies. Skip irrelevant ones.}

---

## What NOT To Do (Over-engineering for this project stage)

- {list of things that are tempting but disproportionate}

---

## Next Steps

To address the quick wins, run:
{specific commands or skills to invoke}
```

### Phase 4: Present Results

Display a summary to the user:

1. The overall score and verdict
2. The scorecard table
3. Top 3 quick wins with concrete next steps
4. Ask if they want to see the full report or start implementing fixes

## Important Rules

- **Never ask questions** during the scan. Discover everything automatically.
- **Be honest** in scoring. Don't inflate scores to be nice.
- **Be pragmatic** in recommendations. Factor in solo-dev, AI-first context.
- **Skip over-engineering**: no SonarQube, no feature flags, no visual regression unless the project clearly needs it.
- **Adapt to framework**: if it's not Next.js, adjust the tooling expectations accordingly.
- **Check actual files**, don't assume from package.json alone (a dep can be installed but not configured).
- The report must be **actionable** — every finding should have a concrete fix.
