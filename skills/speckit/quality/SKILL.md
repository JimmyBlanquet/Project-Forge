---
name: speckit-quality
description: Scan code quality by running jscpd (duplication detection), knip (dead code / unused exports / unused dependencies), and ESLint with sonarjs (cognitive complexity, duplicate strings). Generates a quality-report.md with PASS/WARN/FAIL status. Use this skill whenever the user mentions scanning quality, checking code quality, finding duplicates or copy-paste, detecting dead code or unused exports, running jscpd or knip, checking cognitive complexity, or generating a quality report. Also use when the user asks "is there duplicate code", "are there unused dependencies", "how clean is the codebase", or any variation about code health, code hygiene, or technical debt detection. This is a read-only reporting skill — it does NOT fix issues, only reports them.
effort: medium
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

### 1. Determine Scope

Check if the user provided a scope argument:
- `modified` (default) — scan only files changed since last commit (`git diff --name-only HEAD`)
- `all` — scan the entire project

### 2. Run Code Duplication Scan (jscpd)

```bash
npx jscpd --config .jscpd.json
```

Capture output. Note:
- **PASS**: 0 duplications found
- **WARN**: duplication rate < 10%
- **FAIL**: duplication rate >= 10%

### 3. Run Dead Code Detection (knip)

```bash
npx knip
```

Capture output. Note:
- **PASS**: no unused exports/dependencies
- **WARN**: only unused devDependencies or type exports
- **FAIL**: unused exports in production code

### 4. Run ESLint with SonarJS

```bash
npx next lint
```

If scope is `modified`, run on specific files:
```bash
npx next lint --file path/to/changed/file1.ts --file path/to/changed/file2.tsx
```

Capture output. Note:
- **PASS**: 0 warnings, 0 errors
- **WARN**: warnings only (cognitive complexity, duplicate strings)
- **FAIL**: errors present

### 5. Generate Quality Report

Create `quality-report.md` in the project root with this format:

```markdown
# Quality Report

**Date**: [ISO date]
**Scope**: [modified|all]
**Status**: [PASS|WARN|FAIL]

---

## Summary

| Tool | Status | Issues |
|------|--------|--------|
| jscpd (duplication) | [PASS/WARN/FAIL] | [count] clones, [rate]% duplication |
| knip (dead code) | [PASS/WARN/FAIL] | [count] unused exports, [count] unused deps |
| eslint + sonarjs | [PASS/WARN/FAIL] | [count] errors, [count] warnings |

---

## Details

### Code Duplication (jscpd)

[Full jscpd output or "No duplications found"]

### Dead Code (knip)

[Full knip output or "No unused exports found"]

### Linting & Cognitive Complexity (eslint + sonarjs)

[Full eslint output or "No issues found"]

---

## Recommendations

[Actionable recommendations based on findings]
```

### 6. Determine Global Status

- **PASS**: all 3 tools clean
- **WARN**: cognitive complexity warnings, duplication < 10%, minor knip issues
- **FAIL**: unused exports in production code, duplication >= 10%, eslint errors

### 7. Report to User

Output the path to the generated `quality-report.md` and a summary:
- Global status (PASS/WARN/FAIL)
- Issues count per tool
- Top 3 recommendations if WARN or FAIL

## Important Rules

- Always run the 3 tools in sequence: jscpd → knip → eslint
- If a tool is not installed, report it and skip (don't fail the whole scan)
- The report file is always written even if all tools pass
- For `modified` scope, if no files changed, report "Nothing to scan" and exit early
- Do NOT fix issues automatically — this is a reporting skill only

**NOW**: Run the quality scan and generate the report.
