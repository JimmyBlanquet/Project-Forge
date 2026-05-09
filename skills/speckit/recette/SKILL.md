---
name: speckit-recette
description: >
  Generate a recette (acceptance testing checklist) from the feature specification to validate that a feature
  meets all acceptance scenarios. Use this skill when the user wants to create a recette, build a UAT checklist,
  generate acceptance test scenarios, prepare for manual or automated feature validation, create a QA checklist,
  or verify a feature against its spec. Also triggers on "speckit recette", "speckit-recette", "create recette",
  "acceptance testing", "QA checklist", "generate test checklist from spec", "validate the feature", "UAT
  scenarios", "recette checklist", or "verification checklist". This skill reads spec.md, extracts all
  acceptance scenarios (AS1.1, AS1.2, etc.), and generates a structured recette.md with pre-conditions, manual
  test steps, expected outcomes, non-functional checks (performance, security, accessibility), and a systematic
  debugging protocol for failures. It can optionally run automated verification using agent-browser if installed.
  This does NOT run full E2E test suites with parallel research agents (use speckit-e2e for that), write the
  feature specification (use speckit-specify), or generate implementation tasks (use speckit-tasks). The recette
  is a validation artifact, not a planning artifact.
effort: medium
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `{SCRIPT}` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.

2. **Load spec.md**: Read `FEATURE_DIR/spec.md`. This file contains user stories with acceptance scenarios (AS1.1, AS1.2, etc.).

3. **Extract acceptance scenarios**: For each user story in spec.md, extract ALL acceptance scenarios. These follow patterns like:
   - `AS1.1`, `AS1.2` (numbered per user story)
   - Or bullet-point criteria under each user story
   - Include any non-functional requirements mentioned

4. **Generate recette.md**: Create a structured checklist in `FEATURE_DIR/recette.md` with this format:

---

### Output Format

```markdown
# Recette: [Feature Name]

**Date**: [ISO date]
**Spec source**: [path to spec.md]
**Status**: EN COURS

---

## User Story 1: [Title]

### Scenarios fonctionnels

- [ ] **AS1.1**: [Acceptance scenario description]
  - Pre-conditions: [what must be true before testing]
  - Steps: [how to test manually]
  - Expected: [what success looks like]

- [ ] **AS1.2**: [Next acceptance scenario]
  - Pre-conditions: ...
  - Steps: ...
  - Expected: ...

### Verdict US1: ⬜ PASS / ⬜ FAIL / ⬜ PARTIAL

---

## User Story 2: [Title]

[Same pattern...]

---

## Non-fonctionnel

### Performance
- [ ] Page load < 2s on 3G connection
- [ ] No visible layout shift (CLS < 0.1)

### Securite
- [ ] No unauthorized access to other users' data
- [ ] Input sanitization on all form fields
- [ ] CSRF protection active

### Accessibilite
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader compatible (ARIA labels present)
- [ ] Color contrast meets WCAG AA

---

## Protocole de correction (Systematic Debugging)

> **IMPORTANT**: Si un item de recette echoue, ne PAS patcher a l'aveugle.
> Suivre le protocole systematic-debugging:

### Phase 1: Root Cause Analysis
1. Reproduire le bug de maniere fiable
2. Identifier le composant exact qui echoue
3. Lire le code source du composant (ne pas deviner)

### Phase 2: Pattern Recognition
1. Le bug est-il un pattern connu? (off-by-one, race condition, state stale, etc.)
2. D'autres endroits du code ont-ils le meme pattern?

### Phase 3: Hypothesis & Verification
1. Formuler UNE hypothese precise
2. Verifier avec un test minimal AVANT de modifier le code
3. Si l'hypothese est fausse, revenir a Phase 1

### Phase 4: Fix & Non-Regression
1. Appliquer le fix minimal
2. Ecrire un test de non-regression qui echoue SANS le fix
3. Verifier que le test passe AVEC le fix
4. Verifier que les tests existants passent toujours

---

## Resume

| User Story | Status | Items Pass | Items Fail | Items Skip |
|-----------|--------|-----------|-----------|-----------|
| US1: [Title] | ⬜ | 0/N | 0/N | 0/N |
| US2: [Title] | ⬜ | 0/N | 0/N | 0/N |
| Non-fonctionnel | ⬜ | 0/N | 0/N | 0/N |
| **TOTAL** | ⬜ | 0/N | 0/N | 0/N |
```

---

5. **Report**: Output the path to the generated recette.md and a summary:
   - Total acceptance scenarios extracted
   - Count per user story
   - Non-functional items added
   - Remind user to run recette manually or with `/speckit-e2e`

6. **Verification automatisee avec agent-browser** (si agent-browser est installe):

   After generating the checklist, optionally execute automated verification:

   ### Prerequisites Check
   ```bash
   # Verify agent-browser is installed
   which agent-browser || echo "agent-browser not installed. Run: npm i -g agent-browser && agent-browser install --with-deps"

   # Verify dev server is running
   curl -s http://localhost:3000 > /dev/null || echo "Dev server not running. Run: pnpm dev"
   ```

   ### Automated Verification Loop

   For each acceptance scenario in recette.md:

   ```bash
   # 1. Open the relevant page
   agent-browser open http://localhost:3000/{path}

   # 2. Take accessibility snapshot (text-based, token-efficient)
   agent-browser snapshot -i          # Returns accessibility tree with refs @e1, @e2...

   # 3. Interact based on the scenario steps
   agent-browser click @e3            # Click elements by ref
   agent-browser fill @e5 "test data" # Fill form fields by ref

   # 4. OBLIGATOIRE: Re-snapshot after EVERY navigation or form submit
   #    (refs @eN are invalidated when DOM changes)
   agent-browser snapshot -i

   # 5. Capture evidence screenshot
   agent-browser screenshot tests/e2e/recette-{US}-{AS}.png

   # 6. Close when done with this scenario
   agent-browser close
   ```

   ### Update recette.md

   After each scenario verification, update the checklist:
   - `[x] **AS1.1**: ...` → PASS (screenshot: `tests/e2e/recette-US1-AS1.1.png`)
   - `[ ] **AS1.2**: ...` → FAIL (reason: expected element not found)

   Update the summary table with PASS/FAIL counts.

   **CRITICAL RULE**: Always re-snapshot after any navigation or form submit. The @eN refs become stale when the DOM changes.

## Important Rules

- Extract ALL acceptance scenarios from spec.md - do not skip any
- If spec.md uses a different naming convention (e.g., "Given/When/Then"), adapt but keep the checklist format
- Non-functional section is ALWAYS included even if spec.md doesn't mention it
- The systematic-debugging protocol is ALWAYS included at the bottom
- Pre-conditions and Steps must be specific enough for someone unfamiliar with the project to execute
- Write the file to `FEATURE_DIR/recette.md`
- When using agent-browser, ALWAYS re-snapshot after navigation (refs invalidate on DOM change)
