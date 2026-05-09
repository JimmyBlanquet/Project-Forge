---
name: pf-cross-review
description: Run a contradictory code review on a git range using N0 (Claude/Anthropic sub-agent) + N1 (Codex/OpenAI CLI) + N2 (local LLM endpoint (e.g. llama-swap, vLLM, Ollama): qwen36-27b CN + devstral-small-2 EU). V3.3 — activates N2 via llama-swap HTTP direct (was bus placeholder in V2.1). V3.2 shipped anti-symmetric-inverse repro guards. Use after commits to catch blind spots same-LLM self-review misses.
effort: medium
---

# /pf-cross-review — Cross-LLM contradictory code review (V3.3)

## Mission

Run two independent code reviews on the same git range using **two different LLM schools** (Anthropic + OpenAI), then consolidate findings into a structured doc. Goal : catch the **blind spots that same-LLM self-review misses** (validated 2026-05-02 when codex/gpt-5.4 detected an Anthropic blind spot Claude had positively validated).

**3-level strategy** :
- **N0** : sub-agent `pr-review-toolkit:code-reviewer` (Claude Sonnet/Opus) — exhaustive, sourced
- **N1** : `codex review` CLI (OpenAI gpt-5.4) — cross-school, detects Anthropic blind spots
- **N2** : local LLM endpoint (e.g. llama-swap, vLLM, Ollama) — `qwen36-27b` (CN dense 77.2% SWE-Bench) + `devstral-small-2` (EU function-calling), appels parallèles à `${LLM_ENDPOINT:-http://localhost:11500}/v1`. Architecture llama-swap (migration 2026-05-02). Activé en V3.3. Graceful degradation si local LLM unreachable.

## Prerequisites

1. **Codex CLI installed** (`codex --version` should work)
2. **Codex authenticated** : `codex login status` must show "Logged in using ChatGPT" or API key
3. **Sub-agent dispatch capability** : Claude Code Task tool with `subagent_type: "pr-review-toolkit:code-reviewer"` (validated working 2026-05-03 dogfood — namespaced subagent_type IS valid despite N0 false positive #3 claiming otherwise)
4. **Git repo with at least 1 commit** in the range to review
5. **curl + jq** : requis pour N2 local LLM HTTP calls (`curl --version` + `jq --version`). Si absent → N2 skipped avec warning.

If codex is missing or unauthenticated, fall back to **N0 + N2** with explicit warning. If local LLM unreachable, fall back to **N0 + N1**.

## Arguments

```
/speckit.pf-cross-review.cross-review [<git-range>] [--n0-only] [--auto-execute]
```

- **`<git-range>`** (optional) — git range to review. Examples: `main..HEAD`, `7b1971e..HEAD`, `HEAD~10..HEAD`. **Default behavior** (auto-detection):
  - If on a feature branch (different from `main`/`master`) → divergence depuis `origin/main`
  - If on `main`/`master` → `@{u}..HEAD` (commits since last push)
  - If neither resolves → ask user explicitly
- **`--n0-only`** (optional flag) — skip N1 codex AND N2 local LLM (e.g. when quota exhausted or offline). Just run N0 sub-agent.
- **`--no-n2`** (optional flag) — skip N2 local LLM specifically (e.g. server unavailable). Run N0 + N1 only.
- **`--auto-execute`** (optional flag) — auto-execute repro tests without per-test user confirmation. **Dangerous** : LLM-supplied code runs with full user UID. Use only when you trust the source AND have a sandbox layer (firejail/bwrap/podman). Default = ask confirmation.

## Workflow

### Step 1 — Determine git range

```bash
# Detect current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Resolve default base if no range provided
if [ -z "$RANGE_ARG" ]; then
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    BASE=$(git rev-parse "@{u}" 2>/dev/null || echo "")
  else
    BASE=$(git merge-base origin/main HEAD 2>/dev/null || git merge-base origin/master HEAD 2>/dev/null || echo "")
  fi
  if [ -z "$BASE" ]; then
    echo "ERROR: cannot auto-detect git range. Provide one explicitly: /pf-cross-review <base>..HEAD"
    exit 1
  fi
  RANGE="$BASE..HEAD"
else
  RANGE="$RANGE_ARG"
fi

# Extract base ref using POSIX param expansion (preserves dotted refs like release/v1.2.3)
# FIX V2.1 IMPORTANT #4 : `cut -d. -f1` truncated dotted branches like release/v2.0.1
BASE_REF="${RANGE%%..*}"

COMMIT_COUNT=$(git log "$RANGE" --oneline | wc -l | tr -d ' ')
[ "$COMMIT_COUNT" -eq 0 ] && { echo "ERROR: empty range $RANGE — nothing to review"; exit 1; }

# Pre-flight: diff size vs N2 ctx-size limits (qwen36-27b: 16K tokens, devstral-small-2: 32K tokens)
# ~4 chars/token → seuil warning 100 KB ≈ 25K tokens (saturant pour qwen, limite basse pour devstral)
DIFF_SIZE=$(git diff "$RANGE" 2>/dev/null | wc -c | tr -d ' ')
if [ "$DIFF_SIZE" -gt 100000 ]; then
  echo "⚠️  Diff size: ${DIFF_SIZE} bytes (~$((DIFF_SIZE / 4)) tokens estimés)."
  echo "   Dépasse le ctx-size N2 (qwen36-27b: 16K, devstral-small-2: 32K) → HTTP 400/422 probable."
  echo "   Options: utiliser --no-n2, ou découper le range (ex: HEAD~10..HEAD)."
fi
```

Tell the user: **"Reviewing $COMMIT_COUNT commits ($((DIFF_SIZE / 1024)) KB diff) in range $RANGE — running N0 (Anthropic) + N1 (Codex) in parallel."**

### Step 2 — Verify codex + local LLM availability (skip if `--n0-only`)

```bash
# FIX V2.1 IMPORTANT #5 : --n0-only guard MUST be checked first
if [ "$N0_ONLY" = "true" ]; then
  CODEX_OK=false
  N2_OK=false
  echo "ℹ️  --n0-only flag set, skipping N1 codex + N2 local LLM"
else
  if codex login status >/dev/null 2>&1; then
    CODEX_OK=true
  else
    CODEX_OK=false
    echo "⚠️  Codex unavailable (not installed or not authenticated) — falling back N1 skipped"
  fi

  if [ "$NO_N2" = "true" ]; then
    N2_OK=false
    echo "ℹ️  --no-n2 flag set, skipping N2 local LLM"
  elif ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
    N2_OK=false
    echo "⚠️  curl ou jq manquant — N2 local LLM skipped"
  elif curl -s -m 5 -H "Authorization: Bearer ${LLM_API_KEY:-}" ${LLM_ENDPOINT:-http://localhost:11500}/v1/models >/dev/null 2>&1; then
    N2_OK=true
  else
    N2_OK=false
    echo "⚠️  local LLM unreachable (${LLM_ENDPOINT}) — N2 skipped"
  fi
fi
```

### Step 3 — Launch reviews in PARALLEL

**Anti-hallucination instructions (V3 structured evidence schema)** : pour chaque claim P0 BLOCKER ou P1 IMPORTANT, le reviewer DOIT produire un finding au format structuré complet avec **reasoning chain explicit** + **evidence runtime** + **confidence calibrée**. Sans evidence runtime, le finding est auto-downgrade à observation. Ce schéma est inspiré de :

- **Cubic** (51% FP reduction par filtering agent + reasoning logs) : forcer le raisonnement avant le verdict
- **Refute-or-Promote** (arXiv 2604.19049, 79-83% kill rate) : empirical execution kills false positives — *"unanimous reviewer endorsement does not equal correctness"*
- **Beyond Consensus / NUS** : LLM-judges convergent par politesse → mandat adversarial explicite requis

**Cas limite documenté (V2.1)** : un repro test peut être structurellement valide mais mesurer mal le bug — par exemple comparer la syntaxe à d'autres parties du codebase plutôt que reproduire l'effet runtime. C'est un faux positif que la Step 4.5 valide à tort. La Phase N3 Executor (Step 4.6) chasse ces cas.

**N0 (Anthropic sub-agent)** — dispatch as background sub-agent:

```
Use Agent tool with:
  description: "N0 Anthropic code review"
  subagent_type: "pr-review-toolkit:code-reviewer"
  run_in_background: true
  prompt: "Review the git range <RANGE> in this repo.
    Focus on real risks: bugs, silent failures, security, tests, completeness, cross-file consistency.
    No nitpick. Format: 🔴 BLOCKER / 🟠 IMPORTANT / 🟡 OBSERVATION with file:line + concrete fix recos.
    Limit to ~10-15 most credible findings.
    Also signal positive durable patterns observed (not just problems).

    MANDATORY for each 🔴 BLOCKER and 🟠 IMPORTANT claim : provide a STRUCTURED FINDING
    in this exact format (V3 schema, anti-hallucination guardrail) :

    ```finding
    id: <B1, B2, I1, ...>
    severity: BLOCKER | IMPORTANT | OBSERVATION
    file: <path:line>
    claim: <one-line bug description>
    reasoning: |
      Step-by-step reasoning leading to the bug claim.
      MUST consider at least one alternative explanation that would mean it's NOT a bug,
      and explain why that explanation is rejected. (Anti-bias: forces consideration of
      negative evidence, not just positive.)
    confidence: high | medium | low
    evidence:
      tool: runtime | structural | doc | none
      output: |
        <if tool=runtime: stdout/stderr from running the code that demonstrates the bug>
        <if tool=doc: URL or quote from authoritative source>
        <if tool=structural: grep/AST analysis output - WARNING this is weaker, only valid
         when claim is itself structural like "unused variable", NEVER for runtime bugs>
        <if tool=none: leave empty - claim will be auto-downgraded>
    repro:
      lang: python | bash | shell
      description: <one-line what this test validates>
      code: |
        <executable code that runs as-is, ≤30 lines, reproduces the RUNTIME effect>
      expected_current: fail
      expected_after_fix: pass
    fix_recommendation: |
      Concrete fix in 1-3 sentences.
    ```

    HARD RULE : if severity=BLOCKER or IMPORTANT, evidence.tool MUST be `runtime` or `doc`.
    Structural evidence is NOT sufficient for runtime bugs (it measures cohérence with
    other code, not the bug's actual effect). If you only have structural evidence,
    DOWNGRADE to OBSERVATION.

    HARD RULE : the repro code must reproduce the RUNTIME EFFECT of the bug, not measure
    structural differences. Counter-example to avoid : a repro that does
    `grep_count_X > 0 && grep_count_Y == 0 && exit 1` is structural, not runtime.
    Correct repro : actually invoke the buggy operation and observe wrong output.

    If you cannot reliably write such a finding (style/refactor claims, no runtime effect),
    TAG IT 🟡 OBSERVATION. Better to under-claim than to over-claim without proof."
```

**N1 (Codex CLI)** — run in foreground (codex is fast, 2-5 min):

```bash
# FIX V2.1 BLOCKER #1 : codex review --base + [PROMPT] are mutually exclusive.
# We use --base alone with the default review prompt (which already produces structured findings).
# The repro test instruction is therefore enforceable only on N0 sub-agent for now.
# V3 will work around via stdin or codex config file.
if [ "$CODEX_OK" = "true" ]; then
  CODEX_REPORT=$(codex review --base "$BASE_REF" \
    --title "PF cross-review $RANGE" 2>&1)
  CODEX_RC=$?
  if [ "$CODEX_RC" -ne 0 ]; then
    echo "⚠️  Codex review failed (rc=$CODEX_RC) — falling back to N0 only for consolidation"
    CODEX_OK=false
  fi
fi
```

**N2 (local LLM endpoint (e.g. llama-swap, vLLM, Ollama))** — qwen36-27b (CN) + devstral-small-2 (EU) en parallèle :

```bash
# Architecture llama-swap : pas d'activation de profil, model chargé à la demande
# Timeout ≥ 120s : cold start qwen~14s / devstral~6s + swap pénalité possible ~15-60s
if [ "$N2_OK" = "true" ]; then
  LLM_URL="${LLM_ENDPOINT:-http://localhost:11500}/v1/chat/completions"
  LLM_TIMEOUT=120
  N2_QWEN_FILE=$(mktemp /tmp/pf-n2-qwen-XXXXX.json)
  N2_DEVSTRAL_FILE=$(mktemp /tmp/pf-n2-devstral-XXXXX.json)

  # Prompt identique pour CN et EU — mandat adversarial explicite (anti-agréabilité)
  N2_PROMPT=$(cat <<PROMPT
You are a code reviewer with an ADVERSARIAL mandate: find real bugs, not validate.
Review this git diff for: bugs, security issues, logic errors, missing error handling, cross-file consistency.
No style nitpicks. In English.
For each finding: severity (BLOCKER/IMPORTANT/OBSERVATION), file:line, claim, one-line reasoning.
Limit to 10-15 most credible findings.

GIT DIFF:
$(git diff "$BASE_REF" HEAD)
PROMPT
)

  # Parallel HTTP calls — results to temp files to avoid subshell variable scoping
  # max_tokens GÉNÉREUX (LLMs locaux = GPU déjà payé, 0 € marginal). Le réflexe pingre
  # des APIs payantes fait perdre des reviews entières sur les thinking models.
  # qwen36-27b est un thinking model → 12000 minimum (3000-8000 tokens en reasoning_content
  # avant le content final). devstral-small-2 non-thinking → 6000 confortable.
  curl -s -m "$LLM_TIMEOUT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${LLM_API_KEY}" \
    "$LLM_URL" \
    -d "$(jq -nc --arg p "$N2_PROMPT" '{model:"qwen36-27b",messages:[{role:"user",content:$p}],max_tokens:12000,temperature:0.7}')" \
    > "$N2_QWEN_FILE" 2>&1 &
  PID_QWEN=$!

  curl -s -m "$LLM_TIMEOUT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${LLM_API_KEY}" \
    "$LLM_URL" \
    -d "$(jq -nc --arg p "$N2_PROMPT" '{model:"devstral-small-2",messages:[{role:"user",content:$p}],max_tokens:6000,temperature:0.7}')" \
    > "$N2_DEVSTRAL_FILE" 2>&1 &
  PID_DEVSTRAL=$!

  wait "$PID_QWEN"; N2_QWEN_RC=$?
  wait "$PID_DEVSTRAL"; N2_DEVSTRAL_RC=$?

  # Fallback sur reasoning_content si content vide (thinking models comme qwen36-27b)
  N2_QWEN_REPORT=$(jq -r '.choices[0].message.content // .choices[0].message.reasoning_content // empty' "$N2_QWEN_FILE" 2>/dev/null)
  N2_DEVSTRAL_REPORT=$(jq -r '.choices[0].message.content // .choices[0].message.reasoning_content // empty' "$N2_DEVSTRAL_FILE" 2>/dev/null)
  rm -f "$N2_QWEN_FILE" "$N2_DEVSTRAL_FILE"

  [ -z "$N2_QWEN_REPORT" ]    && { N2_QWEN_OK=false;    echo "⚠️  N2 qwen36-27b failed or timed out (rc=$N2_QWEN_RC)"; }    || N2_QWEN_OK=true
  [ -z "$N2_DEVSTRAL_REPORT" ] && { N2_DEVSTRAL_OK=false; echo "⚠️  N2 devstral-small-2 failed or timed out (rc=$N2_DEVSTRAL_RC)"; } || N2_DEVSTRAL_OK=true
fi
```

### Step 4 — Wait for N0 (background sub-agent)

Continue with other tasks, OR explicitly wait for the sub-agent completion notification. Runtime auto-notifies on completion.

### Step 4.5 — Validate repro tests + structured findings (auto FP filter, V3)

**Pre-check structural** (V3) — pour chaque finding, AVANT d'exécuter le repro :

1. **Schema check** : le finding contient-il les champs obligatoires `severity`, `claim`, `reasoning`, `confidence`, `evidence.tool`, `evidence.output`, `repro` ? Si non → tag `[FORMAT INVALIDE — schéma V3 incomplet]`, downgrade observation, escalade humain.

2. **Evidence type check** : si `severity` ∈ {BLOCKER, IMPORTANT}, alors `evidence.tool` DOIT être `runtime` ou `doc`. Si `structural` ou `none` → AUTO-DOWNGRADE à OBSERVATION + tag `[FAUX POSITIF STRUCTUREL — evidence.tool=$tool insuffisant pour severity=$severity]`. Le finding va en appendix. C'est exactement ce qui aurait évité le FP #3 du dogfood V2.

3. **Reasoning sanity check** : le `reasoning` mentionne-t-il une "alternative explanation" ? (Mots-clés : "alternatively", "could also be", "however", "but if", "unless"). Si NON → flag `[REASONING UNILATÉRAL — biais possible]` (warning, pas blocker — juste un signal pour l'humain).

**Sécurité (V2.1 BLOCKER #2)** : par défaut, AVANT d'exécuter chaque repro test fourni par les reviewers LLM, AFFICHER le code à l'utilisateur et demander confirmation explicite (y/N). Le code LLM peut contenir un payload malveillant. Bypass via flag `--auto-execute`.

```bash
for finding in $FINDINGS_WITH_REPRO; do
  REPRO_CODE="$(extract_repro_block "$finding")"
  REPRO_LANG="$(extract_lang "$finding")"

  echo ""
  echo "=== Repro test pour finding: $(short_desc "$finding") ==="
  echo "$REPRO_CODE"
  echo "==="

  if [ "$AUTO_EXECUTE" != "true" ]; then
    read -r -p "Exécuter ce repro test ? (y/N) " confirm
    [ "$confirm" != "y" ] && { tag_finding "$finding" "[REPRO SKIPPED — user declined]"; continue; }
  fi

  tmpdir=$(mktemp -d)
  # V3.2 — defensive write pipeline (anti symmetric inverse bug détecté par N2 local LLM 2026-05-03)
  # Historique :
  #  - V2 : heredoc+sed → mangle multi-line repros → tag VALIDÉ alors que repro cassé (FP)
  #  - V3.1 : printf '%s' → fix B1 mais introduit erreur miroir (extraction vide → fichier 0-byte
  #    → python rc=0 → tag FAUX POSITIF alors que bug réel = FN)
  #  - V3.2 : 3 guards défensifs successifs pour fermer les 2 inverses
  # Cf. internal dogfood "symmetric inverse bug" confidence 87/100.
  case "$REPRO_LANG" in
    python)
      # GUARD #1 (V3.2 P0) : empty extraction → REPRO INVALIDE (pas FAUX POSITIF)
      if [ -z "$REPRO_CODE" ]; then
        tag_finding "$finding" "[REPRO INVALIDE — empty extraction]"
        rm -rf "$tmpdir"
        continue
      fi
      # GUARD #2 (V3.2 P2) : printf return code (silent failure : disk full, perm)
      if ! printf '%s' "$REPRO_CODE" > "$tmpdir/repro.py"; then
        tag_finding "$finding" "[REPRO INVALIDE — write failed (printf rc!=0)]"
        rm -rf "$tmpdir"
        continue
      fi
      # GUARD #3 (belt-and-braces) : verify file non-empty post-write
      if [ ! -s "$tmpdir/repro.py" ]; then
        tag_finding "$finding" "[REPRO INVALIDE — file empty after write]"
        rm -rf "$tmpdir"
        continue
      fi
      # NOTE V3.2 P1 : sentinel `__REPRO_CODE_PLACEHOLDER__` retiré.
      # Risque collision sur dogfood récursif (le code reviewer pourrait légitimement
      # contenir cette chaîne). Les 3 guards ci-dessus suffisent sans risque de faux rejet.
      (cd "$tmpdir" && python3 repro.py >/tmp/repro-out 2>&1); rc=$?
      ;;
    bash|shell)
      if [ -z "$REPRO_CODE" ]; then
        tag_finding "$finding" "[REPRO INVALIDE — empty extraction]"
        rm -rf "$tmpdir"
        continue
      fi
      if ! printf '%s' "$REPRO_CODE" > "$tmpdir/repro.sh"; then
        tag_finding "$finding" "[REPRO INVALIDE — write failed (printf rc!=0)]"
        rm -rf "$tmpdir"
        continue
      fi
      if [ ! -s "$tmpdir/repro.sh" ]; then
        tag_finding "$finding" "[REPRO INVALIDE — file empty after write]"
        rm -rf "$tmpdir"
        continue
      fi
      (cd "$tmpdir" && bash repro.sh >/tmp/repro-out 2>&1); rc=$?
      ;;
    # FIX V2.1 IMPORTANT #9 : default arm pour langues non supportées
    *)
      echo "⚠️  Repro lang '$REPRO_LANG' non supporté (python/bash/shell uniquement)"
      tag_finding "$finding" "[REPRO INDÉCIDABLE — lang $REPRO_LANG non supporté]"
      rm -rf "$tmpdir"
      continue
      ;;
  esac

  if [ "$rc" -ne 0 ]; then
    tag_finding "$finding" "[VALIDÉ — repro confirmé]"
  else
    tag_finding "$finding" "[FAUX POSITIF — test passe déjà]"
  fi
  rm -rf "$tmpdir"
done
```

**Interpretation** :
- rc != 0 (test currently fails as predicted) → `[VALIDÉ — repro confirmé]`. Real bug.
- rc == 0 (test currently passes — bug is hallucinated) → `[FAUX POSITIF — test passe déjà]`. Move to "Rejected claims" appendix.
- pas de repro fourni → `[NON VALIDÉ — pas de test repro]`, downgrade observation.
- repro lang non supporté → `[REPRO INDÉCIDABLE — lang X]`, escalade.
- repro cassé (typo, import missing) → `[REPRO INVALIDE — vérifier manuellement]`, escalade. **Ne PAS auto-fixer** le test.
- user a décliné l'exécution → `[REPRO SKIPPED — user declined]`.

### Step 4.6 — Adversarial refute pass (Agent N3 Executor, V3)

**Cible** : uniquement les findings BLOCKER survivants après Step 4.5 (validés `[VALIDÉ]` ou tagués `[FORMAT INVALIDE]`/`[REPRO INVALIDE]` qui restent ambigus). On ne re-juge PAS les findings IMPORTANT/OBSERVATION (overhead inutile pour leur impact).

**Pattern** : Refute-or-Promote (arXiv 2604.19049, 79-83% kill rate). Mandat **asymétrique** : N3 doit prouver que le finding est FAUX, pas le confirmer. Casse le biais d'agréabilité (Beyond Consensus / NUS).

**Mécanique** :

```
For each finding F where F.severity == BLOCKER and (F.tag == VALIDÉ or F.tag in {FORMAT INVALIDE, REPRO INVALIDE}):

  Use Agent tool with:
    description: "N3 adversarial refute of finding {F.id}"
    subagent_type: "pr-review-toolkit:code-reviewer"
    run_in_background: false  # synchronous, we need result before consolidation
    prompt: "ADVERSARIAL ROLE — your task is to REFUTE this finding, not to confirm it.

      Finding to refute:
      - id: {F.id}
      - severity: {F.severity}
      - file: {F.file}
      - claim: {F.claim}
      - reasoning by previous reviewer: {F.reasoning}
      - evidence: {F.evidence}
      - repro test: {F.repro}

      Your task in 3 steps :

      1. Generate AT LEAST 3 hypotheses for why this finding could be FALSE :
         (a) The reviewer misread the code (find the misread)
         (b) The reviewer's mental model of the runtime is wrong (find the runtime contradiction)
         (c) The reviewer's repro doesn't actually measure the claimed bug (find the proxy)
         (d) The behavior is intentional and documented (find the doc/test/comment)
         (e) The bug exists but only under conditions not present in this codebase (find the gating)

      2. For each hypothesis, attempt to PROVE it empirically using available tools :
         - Read the actual code at {F.file}:{F.line} and adjacent lines
         - Run the relevant operation directly (NOT the reviewer's repro — your own minimal test)
         - Check git blame, commit message, related tests
         - Look for explicit doc/comment justifying the behavior

      3. Verdict :
         - If you found AT LEAST ONE empirically demonstrated reason the finding is false → output 'REFUTED' + the proof.
         - If you tried 3 hypotheses and could not refute any → output 'CONFIRMED — could not refute' + brief summary of what you tried.
         - Do NOT output 'CONFIRMED' lightly. The bar to refute is empirical proof; the bar to confirm is exhaustion of refutation attempts."

  Capture N3 verdict.
  If N3 == REFUTED → tag finding [FAUX POSITIF — N3 refuted: <reason>], move to appendix
  If N3 == CONFIRMED → tag finding [VALIDÉ N3 — empirically robust], promote to top of consolidation
  If N3 dispatch fails → keep finding as-is with tag [N3 SKIPPED — error]
```

**Coût** : +1 round LLM par BLOCKER. Si 0 BLOCKER → 0 overhead. Si 5 BLOCKERS → ~5-10 min.

**Bénéfice attendu** : 60-70% reduction des FP "consensus social" résiduels (basé chiffres Cubic + Refute-or-Promote).

**Limitation connue** : N3 utilise le même modèle famille (Claude Sonnet/Opus) que N0. Idéalement, N3 serait d'une école différente pour diversité maximale. Candidat V3.5 : utiliser `qwen36-27b` ou `devstral-small-2` (N2 local LLM endpoint (e.g. llama-swap, vLLM, Ollama), actif depuis V3.3) comme adversarial executor.

### Step 5 — Consolidate findings into doc

Use ONLY findings tagged with one of ces statuts validés dans la consolidation principale :
- `[VALIDÉ — repro confirmé]` (Step 4.5 OK)
- `[VALIDÉ N3 — empirically robust]` (Step 4.6 N3 Executor a confirmé après refute pass)
- `[NON VALIDÉ — pas de test repro]` (downgrade observation, contexte humain)

Findings tagged `[FAUX POSITIF — test passe déjà]`, `[FAUX POSITIF — N3 refuted: ...]`, ou `[FAUX POSITIF STRUCTUREL — evidence.tool insuffisant]` vont en **appendix** uniquement (traçabilité, pas dans consolidation principale).

Findings tagged `[REPRO INVALIDE]`, `[REPRO INDÉCIDABLE — env]`, `[REPRO INDÉCIDABLE — lang X]`, `[REPRO SKIPPED — user declined]`, `[N3 SKIPPED — error]`, ou `[FORMAT INVALIDE]` → section dédiée "Findings non validés (action humaine requise)" entre la consolidation et l'appendix.

Generate `docs/plans/YYYY-MM-DD-cross-review-<slug>.md` :

```markdown
# Cross-LLM review — <range> (<N> commits)

> Statut : ✅ N0 + N1 + N2 reçus, validation repro tests faite, consolidé. Plan d'exécution à valider par l'utilisateur avant fix.

**Range** : <range>
**Date** : <YYYY-MM-DD>
**Validation repro** : <X validated / Y rejected as false positive / Z without repro test>

## L1 — Reviewer Anthropic (sub-agent code-reviewer)
<N0 report verbatim>

## L2 — Reviewer cross-école (Codex CLI / OpenAI gpt-5.4)
<N1 report verbatim, or "Skipped (codex unavailable)" / "Skipped (--n0-only flag)" / "Skipped (codex error rc=X)">

## L3 — Reviewer N2 local LLM (e.g. qwen + devstral)

### L3a — qwen36-27b (CN dense)
<N2 qwen36-27b report verbatim, or "Skipped (local LLM unreachable)" / "Skipped (--no-n2 flag)" / "Failed (timeout)">

### L3b — devstral-small-2 (EU function-calling)
<N2 devstral-small-2 report verbatim, or "Skipped (local LLM unreachable)" / "Failed (timeout)">

## Consolidation N0 + N1 (claims VALIDÉS uniquement)

### Tableau de croisement
| Finding | N0 (Anthropic) | N1 (Codex/OAI) | N2-Qwen (CN) | N2-Devstral (EU) | Repro | Verdict consolidé |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ✅/⚠️/⏭️ | ... |

### Vraies blockers (validés par 2+ reviewers AVEC repro tests passants)
...

### Findings N0-only validés
...

### Findings N1-only validés (signal cross-école — précieux)
...

### Findings sans repro test (à juger manuellement)
...

## Plan d'exécution global
| Rang | Finding | Effort | Source | Repro test à intégrer |
|---|---|---|---|---|
| 1 | ... | ... | ... | tests/<path>/test_<name>.py |

## Tickets à ouvrir pour les non-immédiats
...

---

## Appendix — Faux positifs rejetés (Step 4.5 validation)

Pour traçabilité et calibration de la fiabilité par modèle (lien #46 / future bench KB).

| Reviewer | Finding claimé | Repro fourni | Pourquoi rejeté |
|---|---|---|---|
| <N0/N1> | <claim> | <yes/no> | Test repro passe déjà → bug n'existe pas |
| ... | ... | ... | ... |
```

### Step 6 — Print summary to console + path to doc

```
✅ Cross-review done (V3.3 anti-FP — N0+N1+N2).
   N0 (Anthropic)        : <claims count> claims, <validated> validated, <fp> structural FP, <no_repro> sans repro
   N1 (Codex/OpenAI)     : <claims count> claims, <validated> validated, <fp> FP, <no_repro> sans repro | Skipped
   N2 (qwen36-27b CN)    : <claims count> claims, <validated> validated | Skipped (local LLM unreachable)
   N2 (devstral EU)      : <claims count> claims, <validated> validated | Skipped
   N3 Executor           : <blockers reviewed> blockers refute pass, <refuted> refuted, <confirmed_n3> confirmed
   Consolidated          : <X N3-confirmed blockers> / <Y validated importants> / <Z observations>
   ⚠️  Rejected total : <fp_v2 + n3_refuted> — voir appendix du doc

   📄 Full report : docs/plans/<date>-cross-review-<slug>.md
   ⏭️  Next : review la consolidation, puis valider le plan d'exécution avec l'utilisateur.
```

## Anti-patterns à éviter

- **Ne PAS exécuter de fix immédiatement** sur la base d'un seul rapport. Discipline : collecter → consolider → planifier → valider → exécuter (cf. `feedback_review_consolidation_before_action` memory).
- **Ne PAS skipper Step 4.5 (validation repro tests)** — c'est le garde-fou anti-hallucination. Sans cette étape, un faux positif peut conduire à un fix qui INTRODUIT un vrai bug en remplaçant du code correct (cf. internal issue #106 from dogfood 2026-05-03 sur canonical_fingerprint).
- **Ne PAS auto-fixer un repro_test cassé** — escalade humain. Le reviewer doit fournir un test correct.
- **Ne PAS faire confiance aveugle au tag `[VALIDÉ]`** — un repro structurellement valide peut mesurer mal le bug (cas dogfood V2 #3 subagent_type). La V3 Step 4.6 (N3 Executor adversarial refute) chasse ces cas mais n'est PAS infaillible. Validation humaine reste nécessaire au bout.
- **Ne PAS skipper Step 4.6 (N3 adversarial)** sur les BLOCKERs — c'est le 2e garde-fou anti-FP après les pre-checks Step 4.5. Casse spécifiquement le biais d'agréabilité (LLM-judges qui plussoient par politesse, cf paper Beyond Consensus NUS).
- **Ne PAS interpréter "N3 == CONFIRMED" comme certitude absolue** — c'est "n'a pas pu réfuter après 3 hypothèses". Si l'humain trouve une 4e hypothèse plus tard, le finding peut toujours être un FP. Itérer.
- **Ne PAS écraser `docs/plans/` files existants** — la date dans le nom de fichier doit garantir l'unicité.
- **Ne PAS inclure le contenu complet des fichiers reviewés dans le doc** — référencer par `file:line` uniquement.
- **Ne PAS exécuter un repro sans confirmation** sauf flag `--auto-execute` explicite (LLM-supplied code = potential RCE).

## Cas limites

| Cas | Comportement |
|---|---|
| Codex unavailable (not installed) | Warn user + fallback N0 + N2 |
| Codex unauthenticated | Warn user + fallback N0 + N2 |
| Codex quota exhausted (HTTP 429 ou similar) | Capture l'erreur + fallback N0 + N2 |
| `--n0-only` flag set | Skip N1 + N2 entièrement, pas de check codex / local LLM |
| `--no-n2` flag set | Skip N2 local LLM, run N0 + N1 seulement |
| local LLM unreachable (réseau, serveur down) | Warn user + fallback N0 + N1 (curl timeout 5s check) |
| N2 cold start lent (qwen ~14s, devstral ~6s) | Timeout 120s absorbe les cold starts — pas d'action requise |
| N2 swap pénalité (modèles conflictuels GPU) | Timeout 120s absorbe jusqu'à ~60s de swap — pas d'action requise |
| Range vide (0 commits) | Erreur claire, exit 1 |
| Range non valide | Erreur git claire, exit 1 |
| Branch name contient des dots (release/v1.2.3) | `${RANGE%%..*}` extrait correctement (pas de truncation) |
| Reviewer ne fournit aucun repro_test | Tag `[NON VALIDÉ — pas de test repro]`, downgrade observation |
| repro_test fourni est cassé (typo, import) | Tag `[REPRO INVALIDE — vérifier manuellement]`, escalade |
| repro_test fourni passe déjà (= bug n'existe pas) | Tag `[FAUX POSITIF — test passe déjà]`, appendix |
| repro_test échoue pour autre raison (env manquant) | Tag `[REPRO INDÉCIDABLE — env]`, downgrade observation |
| repro_test lang non supporté (Ruby/Go/JS/TS) | Tag `[REPRO INDÉCIDABLE — lang X]`, downgrade observation |
| User décline l'exécution d'un repro | Tag `[REPRO SKIPPED — user declined]`, downgrade observation |
| Repro structurel mal calibré (mesure consensus social vs runtime) | Step 4.5 le validera à tort. Validation humaine reste nécessaire. V3 introduira N3 Executor. |

## Output expected

- 1 fichier `docs/plans/YYYY-MM-DD-cross-review-<slug>.md` créé
- Console summary (5-10 lignes)
- 0 modification de code (review = lecture seule)
- 0 commit auto (l'exécution des fix reste à la décision humaine après revue du doc)

## Quand utiliser

- **Standard** : à la fin d'un cluster de commits (≥3) avant push/PR
- **Important** : avant un release ou un merge sensible
- **Critique** : avant déploiement infra ou changements sécurité

## Quand NE PAS utiliser

- Sur un seul commit cosmétique (overhead inutile, > review value)
- Sur un range > 50 commits (trop large pour findings actionnables — découper)
- Sur un diff > ~100 KB chars (~25K tokens) : N2 (qwen36-27b ctx 16K, devstral-small-2 ctx 32K) saturera et retournera HTTP 400/422. Step 1 émet un warning automatique ; utiliser `--no-n2` ou découper par PR/sous-range
- Sans avoir testé localement (`pnpm test`, `forge-eval.sh`, etc.) — la review n'est pas un substitut au test
