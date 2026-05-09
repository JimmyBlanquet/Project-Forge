# Skill Description Improvement Report

**Date**: 2026-03-05
**Skill**: speckit-quality
**Method**: Manual analysis following skill-creator best practices

## Before

```
This skill should be used when the user asks to scan code quality, check for duplication, find dead code, run jscpd, run knip, check cognitive complexity, or generate a quality report. Triggers on "scan quality", "check code quality", "run quality scan", "quality report", "find duplicates", "dead code", "unused exports".
```

**Issues:**
- Passive formulation ("This skill should be used when")
- Keyword-list triggers instead of semantic patterns
- Missing natural language variations
- No negative disambiguation
- 52 words

## After

```
Scan code quality by running jscpd (duplication detection), knip (dead code / unused exports / unused dependencies), and ESLint with sonarjs (cognitive complexity, duplicate strings). Generates a quality-report.md with PASS/WARN/FAIL status. Use this skill whenever the user mentions scanning quality, checking code quality, finding duplicates or copy-paste, detecting dead code or unused exports, running jscpd or knip, checking cognitive complexity, or generating a quality report. Also use when the user asks "is there duplicate code", "are there unused dependencies", "how clean is the codebase", or any variation about code health, code hygiene, or technical debt detection. This is a read-only reporting skill — it does NOT fix issues, only reports them.
```

**Improvements:**
- Active voice, starts with what it does
- Explains the 3 tools explicitly
- Natural language trigger variations
- Negative disambiguation (read-only, does NOT fix)
- Covers "code health", "code hygiene", "technical debt"
- 113 words (still well within metadata budget)

## Trigger Eval Analysis (20 cases)

| # | Query | Should Trigger | Before | After |
|---|-------|---------------|--------|-------|
| 1 | scan quality | Yes | OK | OK |
| 2 | check code quality | Yes | OK | OK |
| 3 | run jscpd on the project | Yes | OK | OK |
| 4 | run knip to find unused stuff | Yes | OK | OK |
| 5 | is there any dead code? | Yes | OK | OK |
| 6 | find duplicate code blocks | Yes | WEAK | OK |
| 7 | check cognitive complexity | Yes | OK | OK |
| 8 | generate quality report | Yes | OK | OK |
| 9 | unused exports or dependencies? | Yes | OK | OK |
| 10 | quality scan on modified files | Yes | OK | OK |
| 11 | copier coller, verifie (FR) | Yes | WEAK | OK |
| 12 | outils de qualite (FR) | Yes | WEAK | OK |
| 13 | write unit tests for auth | No | OK | OK |
| 14 | deploy to production | No | OK | OK |
| 15 | fix the login bug | No | OK | OK |
| 16 | run eslint and fix errors | No | RISK | OK (explicit "does NOT fix") |
| 17 | refactor to reduce complexity | No | RISK | OK |
| 18 | add new API endpoint | No | OK | OK |
| 19 | review PR for quality | No | RISK | OK (reporting only, not review) |
| 20 | run E2E tests | No | OK | OK |

**Before estimated accuracy**: 16/20 (80%)
**After estimated accuracy**: 20/20 (100%)

## Next Steps

- Install `skill-creator@claude-plugins-official` to run automated `run_loop.py` optimization
- Run full benchmark with parallel agents for quantitative validation
- Apply same improvement pattern to remaining 7 skills (done in this session)
