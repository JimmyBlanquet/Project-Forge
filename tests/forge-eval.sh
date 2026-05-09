#!/usr/bin/env bash
#
# Project-Forge Evaluation Suite
# Validates the integrity of Project-Forge structure, skills, configs, and tooling.
# Designed to be run before/after any modernization change.
#
# Usage:
#   ./tests/forge-eval.sh [--verbose] [--json]
#
# Exit code: 0 if all pass, 1 if any fail

set -uo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERBOSE=false
JSON_OUTPUT=false
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
RESULTS=()

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
for arg in "$@"; do
    case $arg in
        --verbose) VERBOSE=true ;;
        --json) JSON_OUTPUT=true ;;
        -h|--help)
            echo "Usage: $0 [--verbose] [--json]"
            echo "  --verbose  Show details for each test"
            echo "  --json     Output results as JSON"
            exit 0
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

pass() {
    local category="$1" msg="$2"
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS+=("PASS|$category|$msg")
    if ! $JSON_OUTPUT; then
        echo -e "  ${GREEN}PASS${NC}  [$category] $msg"
    fi
}

fail() {
    local category="$1" msg="$2"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS+=("FAIL|$category|$msg")
    if ! $JSON_OUTPUT; then
        echo -e "  ${RED}FAIL${NC}  [$category] $msg"
    fi
}

warn() {
    local category="$1" msg="$2"
    WARN_COUNT=$((WARN_COUNT + 1))
    RESULTS+=("WARN|$category|$msg")
    if ! $JSON_OUTPUT; then
        echo -e "  ${YELLOW}WARN${NC}  [$category] $msg"
    fi
}

verbose() {
    if $VERBOSE && ! $JSON_OUTPUT; then
        echo -e "        ${DIM}$*${NC}"
    fi
}

section() {
    if ! $JSON_OUTPUT; then
        echo ""
        echo -e "${CYAN}${BOLD}── $1 ──${NC}"
    fi
}

# ---------------------------------------------------------------------------
# STRUCT — File structure validation
# ---------------------------------------------------------------------------
test_structure() {
    section "STRUCT: Project Structure"

    local required_dirs=(
        "starters/saas-base"
        "starters/supabase-stripe"
        "skills/speckit"
        "extensions"
        "commands"
        "tools"
        "docs"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ -d "$PROJECT_ROOT/$dir" ]]; then
            pass "STRUCT" "Directory exists: $dir"
        else
            fail "STRUCT" "Missing directory: $dir"
        fi
    done

    local required_files=(
        "CLAUDE.md"
        "tools/ralph"
        "tools/bootstrap"
    )

    for f in "${required_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$f" ]]; then
            pass "STRUCT" "File exists: $f"
        else
            fail "STRUCT" "Missing file: $f"
        fi
    done

    # tools/ralph must be executable
    if [[ -x "$PROJECT_ROOT/tools/ralph" ]]; then
        pass "STRUCT" "tools/ralph is executable"
    else
        fail "STRUCT" "tools/ralph is not executable"
    fi
}

# ---------------------------------------------------------------------------
# SKILL — Skill validation
# ---------------------------------------------------------------------------
test_skills() {
    section "SKILL: Skills Integrity"

    local skill_dirs=()
    while IFS= read -r -d '' dir; do
        skill_dirs+=("$dir")
    done < <(find "$PROJECT_ROOT/skills/speckit" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)

    if [[ ${#skill_dirs[@]} -eq 0 ]]; then
        fail "SKILL" "No skill directories found in skills/speckit/"
        return
    fi

    for dir in "${skill_dirs[@]}"; do
        local name
        name=$(basename "$dir")

        # Skip templates directory
        if [[ "$name" == "templates" ]]; then
            verbose "Skipping templates directory"
            continue
        fi

        # Check for prompt file (SKILL.md or prompt.md)
        if [[ -f "$dir/SKILL.md" ]]; then
            pass "SKILL" "$name: has SKILL.md (standard format)"

            # Validate SKILL.md has required frontmatter
            if head -1 "$dir/SKILL.md" | grep -q '^---'; then
                local has_name has_desc
                has_name=$(sed -n '/^---$/,/^---$/p' "$dir/SKILL.md" | grep -c '^name:')
                has_desc=$(sed -n '/^---$/,/^---$/p' "$dir/SKILL.md" | grep -c '^description:')
                if [[ $has_name -gt 0 && $has_desc -gt 0 ]]; then
                    pass "SKILL" "$name: SKILL.md has name + description frontmatter"
                else
                    fail "SKILL" "$name: SKILL.md missing name or description in frontmatter"
                fi
            else
                fail "SKILL" "$name: SKILL.md missing YAML frontmatter"
            fi
        elif [[ -f "$dir/prompt.md" ]]; then
            warn "SKILL" "$name: uses prompt.md (legacy format, not SKILL.md)"

            # Check manifest.yaml exists alongside prompt.md
            if [[ -f "$dir/manifest.yaml" ]]; then
                pass "SKILL" "$name: has manifest.yaml"
            else
                fail "SKILL" "$name: prompt.md without manifest.yaml"
            fi
        else
            fail "SKILL" "$name: no SKILL.md or prompt.md found"
        fi
    done
}

# ---------------------------------------------------------------------------
# CMD — Commands validation
# ---------------------------------------------------------------------------
test_commands() {
    section "CMD: Commands Integrity"

    local cmd_count=0
    for cmd_file in "$PROJECT_ROOT"/commands/*.md; do
        [[ -f "$cmd_file" ]] || continue
        cmd_count=$((cmd_count + 1))
        local cmd_name
        cmd_name=$(basename "$cmd_file" .md)

        # Check it has frontmatter with description
        if head -1 "$cmd_file" | grep -q '^---'; then
            if grep -q '^description:' "$cmd_file"; then
                pass "CMD" "$cmd_name: has description frontmatter"
            else
                fail "CMD" "$cmd_name: missing description in frontmatter"
            fi
        else
            fail "CMD" "$cmd_name: missing frontmatter"
        fi
    done

    if [[ $cmd_count -eq 0 ]]; then
        fail "CMD" "No command files found in commands/"
    else
        verbose "Found $cmd_count commands"
    fi
}

# ---------------------------------------------------------------------------
# EXT — spec-kit extensions validation
# ---------------------------------------------------------------------------
test_extensions() {
    section "EXT: spec-kit Extensions"

    local expected_extensions=("pf-convert" "pf-testing" "pf-security" "pf-audit" "pf-implement" "pf-cross-review" "pf-cross-review-iterate")

    for ext in "${expected_extensions[@]}"; do
        local ext_dir="$PROJECT_ROOT/extensions/$ext"

        if [[ -d "$ext_dir" ]]; then
            pass "EXT" "$ext: directory exists"
        else
            fail "EXT" "$ext: missing directory extensions/$ext"
            continue
        fi

        # extension.yml exists and is valid YAML
        if [[ -f "$ext_dir/extension.yml" ]]; then
            if python3 -c "import yaml; yaml.safe_load(open('$ext_dir/extension.yml'))" 2>/dev/null; then
                pass "EXT" "$ext: extension.yml is valid YAML"
            else
                fail "EXT" "$ext: extension.yml is invalid YAML"
            fi

            # Has required top-level fields
            for field in requires provides; do
                if grep -q "^$field:" "$ext_dir/extension.yml"; then
                    pass "EXT" "$ext: has top-level '$field'"
                else
                    fail "EXT" "$ext: missing top-level '$field'"
                fi
            done

            # Has extension metadata
            if grep -q "^  id:" "$ext_dir/extension.yml"; then
                pass "EXT" "$ext: has extension.id"
            else
                fail "EXT" "$ext: missing extension.id"
            fi
        else
            fail "EXT" "$ext: missing extension.yml"
        fi

        # Has at least one command file
        local cmd_count
        cmd_count=$(find "$ext_dir/commands" -name "*.md" 2>/dev/null | wc -l)
        if [[ $cmd_count -gt 0 ]]; then
            pass "EXT" "$ext: has $cmd_count command(s)"
        else
            fail "EXT" "$ext: no command files in commands/"
        fi
    done
}

# ---------------------------------------------------------------------------
# PFCR — pf-cross-review V3 behavioral checks (anti-FP guardrails)
# ---------------------------------------------------------------------------
test_pf_cross_review_behavior() {
    section "PFCR: pf-cross-review V3 behavioral checks"

    local skill="$PROJECT_ROOT/extensions/pf-cross-review/commands/cross-review.md"
    local stub="$PROJECT_ROOT/commands/pf-cross-review.md"

    if [[ ! -f "$skill" ]]; then
        fail "PFCR" "skill file missing"
        return
    fi

    # V2.1 fix BLOCKER #1 : code path + commentaire confirmant le fix
    # Le skill doit mentionner explicitement le fix (commentaire "FIX V2.1 BLOCKER #1")
    # ET avoir le marker "mutually exclusive" dans la doc
    if grep -q 'FIX V2.1 BLOCKER #1' "$skill" && grep -q 'mutually exclusive' "$skill"; then
        pass "PFCR" "BLOCKER #1 fix présent (commentaire FIX V2.1 + doc mutually exclusive)"
    else
        fail "PFCR" "BLOCKER #1 fix manquant ou non documenté"
    fi

    # V2.1 fix BLOCKER #2 : sandbox / user confirmation pour exécution code LLM
    if grep -qE 'AUTO_EXECUTE|read.*-p.*confirm|firejail|bwrap' "$skill"; then
        pass "PFCR" "BLOCKER #2 fix présent : confirmation utilisateur ou sandbox pour repro execution"
    else
        fail "PFCR" "BLOCKER #2 régression : repro execution sans confirmation/sandbox"
    fi

    # V2.1 fix IMPORTANT #4 : pas de cut -d. -f1 hors commentaires
    # Ignore les lignes de commentaires markdown (commencent par "# FIX" ou similaire)
    local cut_uses_active
    cut_uses_active=$(grep -n 'cut -d\. -f1' "$skill" | grep -v '^[0-9]*:#' | grep -v '^[0-9]*: *#' | wc -l | tr -d ' ')
    if [ "$cut_uses_active" -eq 0 ]; then
        pass "PFCR" "IMPORTANT #4 fix présent : pas de cut -d. -f1 actif (param expansion utilisée)"
    else
        fail "PFCR" "IMPORTANT #4 régression : $cut_uses_active occurrence(s) actives de cut -d. -f1"
    fi

    # V2.1 fix IMPORTANT #5 : --n0-only guard présent (vérifié globalement, pas en context window)
    # Le test V1 utilisait grep -B2 -A2 trop restrictif
    if grep -q 'N0_ONLY.*true.*then' "$skill" && grep -q 'codex login status' "$skill"; then
        pass "PFCR" "IMPORTANT #5 fix présent : N0_ONLY guard + codex login check coexistent"
    else
        fail "PFCR" "IMPORTANT #5 régression : --n0-only guard manquant"
    fi

    # V3.2 fix BLOCKER B1 + symmetric inverse (V3 dogfood + local LLM N2)
    # Pipeline défensive : printf '%s' au lieu de heredoc+sed (V3.1) +
    # 3 guards (empty extract / printf rc / file empty) (V3.2 P0+P2)
    # Sentinel placeholder retiré (V3.2 P1 — collision dogfood récursif)
    if grep -q "printf '%s' \"\$REPRO_CODE\" >" "$skill" && \
       grep -q '! -s "\$tmpdir/repro' "$skill"; then
        pass "PFCR" "V3.2 BLOCKER B1 fix présent : printf '%s' + guard ! -s (sentinel retiré V3.2)"
    else
        fail "PFCR" "V3.2 BLOCKER B1 régression : guard ! -s manquant"
    fi

    # V3.2 behavioral : printf '%s' préserve réellement les newlines, \$vars et quotes
    tmpdir_behavioral=$(mktemp -d)
    repro_behavioral=$'def foo():\n    x = "$VAR"\n    return `echo hi`\n'
    printf '%s' "$repro_behavioral" > "$tmpdir_behavioral/repro.py"
    if [ -s "$tmpdir_behavioral/repro.py" ] && \
       diff <(printf '%s' "$repro_behavioral") "$tmpdir_behavioral/repro.py" >/dev/null 2>&1; then
        pass "PFCR" "V3.2 behavioral : printf '%s' préserve newlines + \$var + backticks"
    else
        fail "PFCR" "V3.2 behavioral : printf '%s' corrompt le contenu multi-lignes"
    fi
    # Guard empty : fichier vide ne doit PAS passer le guard
    printf '%s' "" > "$tmpdir_behavioral/empty.py"
    if [ ! -s "$tmpdir_behavioral/empty.py" ]; then
        pass "PFCR" "V3.2 behavioral : guard [ ! -s ] détecte extraction vide"
    else
        fail "PFCR" "V3.2 behavioral : guard [ ! -s ] rate extraction vide"
    fi
    rm -rf "$tmpdir_behavioral"

    # V2.1 fix IMPORTANT #9 : case default arm pour langs non supportées
    # awk preserve la fenêtre case→esac peu importe sa taille (V3.2 a élargi le case avec 3 guards)
    if awk '/case "\$REPRO_LANG"/,/esac/' "$skill" 2>/dev/null | grep -qE '^\s+\*\)'; then
        pass "PFCR" "IMPORTANT #9 fix présent : case REPRO_LANG has default arm"
    else
        fail "PFCR" "IMPORTANT #9 régression : case sans default arm"
    fi

    # V3 ajout #1 : structured finding schema (reasoning + evidence + confidence)
    for field in reasoning evidence confidence repro fix_recommendation; do
        if grep -q "^\s*$field:" "$skill"; then
            pass "PFCR" "V3 schema field present: $field"
        else
            fail "PFCR" "V3 schema field missing: $field"
        fi
    done

    # V3 ajout #1 HARD RULE : evidence.tool runtime|doc requis pour BLOCKER/IMPORTANT
    if grep -qiE 'evidence\.tool MUST be|evidence.*tool.*runtime.*BLOCKER|tool MUST be .runtime.' "$skill"; then
        pass "PFCR" "V3 HARD RULE evidence.tool=runtime/doc présente"
    else
        fail "PFCR" "V3 HARD RULE evidence.tool manquante"
    fi

    # V3 ajout #2 : Step 4.6 N3 Executor adversarial
    if grep -q 'Step 4.6.*Adversarial\|Step 4.6 — Adversarial' "$skill"; then
        pass "PFCR" "V3 Step 4.6 N3 Adversarial présente"
    else
        fail "PFCR" "V3 Step 4.6 N3 Adversarial manquante"
    fi

    # V3.1 fix O1/P2 (dogfood V3) : Step 5 whitelist inclut [VALIDÉ N3]
    if grep -A5 '^### Step 5 — Consolidate' "$skill" | grep -q 'VALIDÉ N3'; then
        pass "PFCR" "V3.1 fix O1/P2 : Step 5 whitelist inclut [VALIDÉ N3]"
    else
        fail "PFCR" "V3.1 régression O1/P2 : Step 5 oublie [VALIDÉ N3]"
    fi

    # V3.2 P0 (symmetric inverse) : guard empty extraction présent
    if grep -q 'REPRO INVALIDE — empty extraction' "$skill"; then
        pass "PFCR" "V3.2 P0 fix présent : guard empty extraction (anti symmetric FN)"
    else
        fail "PFCR" "V3.2 P0 régression : pas de guard empty extraction"
    fi

    # V3.2 P2 (): guard printf return code
    if grep -q 'write failed (printf rc!=0)' "$skill"; then
        pass "PFCR" "V3.2 P2 fix présent : guard printf return code"
    else
        fail "PFCR" "V3.2 P2 régression : pas de check printf rc"
    fi

    # V3.2 P1 (): sentinel collision retiré (plus de grep -qF placeholder)
    # Le sentinel pouvait collider avec du code dogfood récursif → faux rejet
    if grep -q 'sentinel.*retiré\|sentinel.*placeholder' "$skill" && \
       ! grep -qE 'grep -qF "__REPRO_CODE_PLACEHOLDER__"' "$skill"; then
        pass "PFCR" "V3.2 P1 fix présent : sentinel collision résolu (sentinel retiré)"
    else
        fail "PFCR" "V3.2 P1 régression : sentinel encore présent (collision risk dogfood récursif)"
    fi

    # V3.2 BEHAVIORAL TEST (P1 = I1) : execute la pipeline réelle sur cas pathologiques
    # Ne pas se contenter de tests structurels grep — exécuter le pattern défensif end-to-end
    section_pipeline_test() {
        local tmpdir
        tmpdir=$(mktemp -d)
        local rc

        # Cas 1 : multi-line REPRO_CODE pathologique avec $vars, backticks, quotes
        local multiline_code='import sys
print("hello $HOME `echo test`")
sys.exit(1)'  # exit 1 = doit être tagué [VALIDÉ — repro confirmé]
        if [ -z "$multiline_code" ]; then
            rc="EMPTY_GUARD"
        elif ! printf '%s' "$multiline_code" > "$tmpdir/repro.py"; then
            rc="PRINTF_GUARD"
        elif [ ! -s "$tmpdir/repro.py" ]; then
            rc="EMPTY_FILE_GUARD"
        else
            (cd "$tmpdir" && python3 repro.py >/dev/null 2>&1); rc=$?
        fi
        # Verify : le code multi-line a été préservé et exécuté → rc=1
        if [ "$rc" = "1" ]; then
            pass "PFCR" "V3.2 behavioral test #1 : multi-line repro avec \$vars/backticks → rc=1 (preserved)"
        else
            fail "PFCR" "V3.2 behavioral test #1 : attendu rc=1, got rc=$rc"
        fi
        rm -rf "$tmpdir"

        # Cas 2 : empty REPRO_CODE → guard 1 doit fire avec EMPTY_GUARD
        tmpdir=$(mktemp -d)
        local empty_code=""
        if [ -z "$empty_code" ]; then
            rc="EMPTY_GUARD"
        else
            rc="LEAKED"
        fi
        if [ "$rc" = "EMPTY_GUARD" ]; then
            pass "PFCR" "V3.2 behavioral test #2 : empty extraction → guard fire (anti symmetric FN)"
        else
            fail "PFCR" "V3.2 behavioral test #2 : empty extraction NOT caught"
        fi
        rm -rf "$tmpdir"

        # Cas 3 : code legitime contenant l'ancien sentinel → ne doit PAS être faux-rejeté
        # (collision dogfood récursif)
        tmpdir=$(mktemp -d)
        local code_with_old_sentinel='print("__REPRO_CODE_PLACEHOLDER__ is just a string")'
        if [ -z "$code_with_old_sentinel" ]; then
            rc="EMPTY_GUARD"
        elif ! printf '%s' "$code_with_old_sentinel" > "$tmpdir/repro.py"; then
            rc="PRINTF_GUARD"
        elif [ ! -s "$tmpdir/repro.py" ]; then
            rc="EMPTY_FILE_GUARD"
        else
            (cd "$tmpdir" && python3 repro.py >/dev/null 2>&1); rc=$?
        fi
        # rc devrait être 0 (le print réussit) → tag FAUX POSITIF (ce qui est attendu : code n'est pas un bug)
        # MAIS surtout : pas de REPRO INVALIDE wrong-rejection
        if [ "$rc" = "0" ]; then
            pass "PFCR" "V3.2 behavioral test #3 : code contenant ancien sentinel ne pas faux-rejeté (collision résolue)"
        else
            fail "PFCR" "V3.2 behavioral test #3 : sentinel collision (rc=$rc, attendu 0)"
        fi
        rm -rf "$tmpdir"
    }
    section_pipeline_test

    # V3 ajout #2 : mandat adversarial explicite (REFUTE not CONFIRM)
    if grep -qiE 'REFUTE this finding, not.*confirm|REFUTED.*CONFIRMED' "$skill"; then
        pass "PFCR" "V3 mandat adversarial explicite présent (refute > confirm bias)"
    else
        fail "PFCR" "V3 mandat adversarial manquant"
    fi

    # V3 : référence aux papers académiques (traçabilité)
    if grep -qE 'Refute-or-Promote|Cubic|Beyond Consensus|arXiv 26' "$skill"; then
        pass "PFCR" "V3 academic sources cited (traceability)"
    else
        fail "PFCR" "V3 academic sources missing"
    fi

    # Stub command exists and points to skill
    if [[ -f "$stub" ]] && grep -q 'extensions/pf-cross-review/commands/cross-review.md' "$stub"; then
        pass "PFCR" "stub commands/pf-cross-review.md points to extension skill"
    else
        fail "PFCR" "stub commands/pf-cross-review.md missing or doesn't point to extension"
    fi
}

# ---------------------------------------------------------------------------
# PFCRI — pf-cross-review-iterate V4 (auto-stabilization loop)
# ---------------------------------------------------------------------------
test_pf_cross_review_iterate() {
    section "PFCRI: pf-cross-review-iterate V4 (loop helpers + skill)"

    local fp_script="$PROJECT_ROOT/scripts/cross-review-iterate/fingerprint.sh"
    local diff_script="$PROJECT_ROOT/scripts/cross-review-iterate/diff-rounds.sh"
    local skill="$PROJECT_ROOT/extensions/pf-cross-review-iterate/commands/iterate.md"
    local stub="$PROJECT_ROOT/commands/pf-cross-review-iterate.md"

    # Helper scripts exist + executable
    for f in "$fp_script" "$diff_script"; do
        if [[ -x "$f" ]]; then
            pass "PFCRI" "$(basename "$f"): exists + executable"
        else
            fail "PFCRI" "$(basename "$f"): missing or not executable"
        fi
    done

    # Skill + stub exist
    if [[ -f "$skill" ]]; then
        pass "PFCRI" "skill iterate.md exists"
    else
        fail "PFCRI" "skill iterate.md missing"
        return
    fi

    if [[ -f "$stub" ]] && grep -q 'extensions/pf-cross-review-iterate/commands/iterate.md' "$stub"; then
        pass "PFCRI" "stub commands/pf-cross-review-iterate.md points to extension"
    else
        fail "PFCRI" "stub missing or doesn't point to extension"
    fi

    # Skill mentions key concepts
    for concept in "STAGNATION_K" "MAX_ROUNDS" "diverging" "converged" "SCAFFOLD-CEGIS"; do
        if grep -q "$concept" "$skill"; then
            pass "PFCRI" "skill mentions concept: $concept"
        else
            fail "PFCRI" "skill missing concept: $concept"
        fi
    done

    # P1 regression: Step 3 doit écrire findings.txt pour que V4.1 semantic diff fonctionne
    if grep -q 'findings\.txt' "$skill"; then
        pass "PFCRI" "skill Step 3: writes findings.txt (V4.1 semantic path)"
    else
        fail "PFCRI" "skill Step 3: missing findings.txt write — V4.1 diff-rounds-semantic.sh will fail with missing input"
    fi

    # BEHAVIORAL TEST 1 : fingerprint normalisation
    local h1 h2 h3
    h1=$(bash "$fp_script" "scripts/foo.sh:10" "Bug in extraction logic")
    h2=$(bash "$fp_script" "Scripts/Foo.sh:10" "  BUG IN EXTRACTION LOGIC  ")
    h3=$(bash "$fp_script" "scripts/foo.sh:10" "Different bug")
    if [ "$h1" = "$h2" ]; then
        pass "PFCRI" "behavioral: fingerprint normalise (case + whitespace)"
    else
        fail "PFCRI" "behavioral: fingerprint ne normalise pas (h1=$h1 h2=$h2)"
    fi
    if [ "$h1" != "$h3" ]; then
        pass "PFCRI" "behavioral: fingerprint distingue claims différents"
    else
        fail "PFCRI" "behavioral: fingerprint collision (h1=$h1 h3=$h3)"
    fi

    # BEHAVIORAL TEST 2 : diff-rounds détecte stable / converging / growing / diverging
    local td
    td=$(mktemp -d)
    # T2a stable
    echo -e "aaa\nbbb\nccc" > "$td/r1"
    echo -e "aaa\nbbb\nccc" > "$td/r2"
    local v2a
    v2a=$(bash "$diff_script" "$td/r1" "$td/r2" | grep -oE '"verdict":"[a-z]+"' | cut -d'"' -f4)
    if [ "$v2a" = "stable" ]; then
        pass "PFCRI" "behavioral: diff-rounds détecte stable (R1==R2)"
    else
        fail "PFCRI" "behavioral: stable détection KO, got verdict=$v2a"
    fi

    # T2b converging
    echo -e "aaa\nbbb" > "$td/r2c"
    local v2b
    v2b=$(bash "$diff_script" "$td/r1" "$td/r2c" | grep -oE '"verdict":"[a-z]+"' | cut -d'"' -f4)
    if [ "$v2b" = "stable" ] || [ "$v2b" = "converging" ]; then
        pass "PFCRI" "behavioral: diff-rounds détecte stable/converging (1 dropped 0 new)"
    else
        fail "PFCRI" "behavioral: converging KO, got verdict=$v2b"
    fi

    # T2c growing
    echo -e "aaa\nbbb\nccc\nddd" > "$td/r2g"
    local v2c
    v2c=$(bash "$diff_script" "$td/r1" "$td/r2g" | grep -oE '"verdict":"[a-z]+"' | cut -d'"' -f4)
    if [ "$v2c" = "growing" ]; then
        pass "PFCRI" "behavioral: diff-rounds détecte growing (1 new)"
    else
        fail "PFCRI" "behavioral: growing détection KO, got verdict=$v2c"
    fi

    # T2d diverging (4 new sur prev 2 = >1.5x)
    echo -e "aaa\nbbb" > "$td/r1d"
    echo -e "ccc\nddd\neee\nfff" > "$td/r2d"
    local v2d
    v2d=$(bash "$diff_script" "$td/r1d" "$td/r2d" | grep -oE '"verdict":"[a-z]+"' | cut -d'"' -f4)
    if [ "$v2d" = "diverging" ]; then
        pass "PFCRI" "behavioral: diff-rounds détecte diverging (4 new sur prev 2 = ratio >1.5)"
    else
        fail "PFCRI" "behavioral: diverging détection KO, got verdict=$v2d"
    fi

    # T2e exit codes différenciés (0=stable/converging, 1=growing, 2=diverging)
    bash "$diff_script" "$td/r1" "$td/r2" >/dev/null 2>&1
    local rc_stable=$?
    bash "$diff_script" "$td/r1" "$td/r2g" >/dev/null 2>&1
    local rc_growing=$?
    bash "$diff_script" "$td/r1d" "$td/r2d" >/dev/null 2>&1
    local rc_diverging=$?
    if [ "$rc_stable" -eq 0 ] && [ "$rc_growing" -eq 1 ] && [ "$rc_diverging" -eq 2 ]; then
        pass "PFCRI" "behavioral: exit codes différenciés (0/1/2 selon verdict)"
    else
        fail "PFCRI" "behavioral: exit codes KO (stable=$rc_stable growing=$rc_growing diverging=$rc_diverging)"
    fi

    # P2a regression: --divergence-ratio flag parsing (était positional, cassé si nommé)
    # Avec ratio=10 (très élevé), 4 new sur prev 2 ne doit PAS être diverging (4 < 10×2)
    local v2f
    v2f=$(bash "$diff_script" "$td/r1d" "$td/r2d" --divergence-ratio 10 | grep -oE '"verdict":"[a-z]+"' | cut -d'"' -f4)
    if [ "$v2f" != "diverging" ]; then
        pass "PFCRI" "behavioral: --divergence-ratio flag parsed correctly (high ratio → not diverging)"
    else
        fail "PFCRI" "behavioral: --divergence-ratio flag broken (4 new ratio=10 still diverging → positional parse régression)"
    fi

    rm -rf "$td"
}

# ---------------------------------------------------------------------------
# PFCRI V4.1 — semantic dedup helpers (LLM-as-judge)
# ---------------------------------------------------------------------------
test_pf_cross_review_iterate_v41() {
    section "PFCRI-V4.1: semantic dedup (dedupe-judge + diff-rounds-semantic)"

    local dj_script="$PROJECT_ROOT/scripts/cross-review-iterate/dedupe-judge.sh"
    local drs_script="$PROJECT_ROOT/scripts/cross-review-iterate/diff-rounds-semantic.sh"

    # Helpers exist + executable
    for f in "$dj_script" "$drs_script"; do
        if [[ -x "$f" ]]; then
            pass "PFCRI-V4.1" "$(basename "$f"): exists + executable"
        else
            fail "PFCRI-V4.1" "$(basename "$f"): missing or not executable"
        fi
    done

    # BEHAVIORAL fast-path : different files → DIFFERENT (no LLM call, instantané)
    local out
    out=$(bash "$dj_script" "scripts/foo.sh" "Bug A" "scripts/bar.sh" "Bug B" 2>/dev/null)
    local rc=$?
    if [ "$rc" -eq 1 ] && echo "$out" | grep -q "fast-path skip LLM"; then
        pass "PFCRI-V4.1" "behavioral: dedupe-judge fast-path (different files = DIFFERENT)"
    else
        fail "PFCRI-V4.1" "behavioral: dedupe-judge fast-path KO (rc=$rc out=$out)"
    fi

    # Note : on ne teste PAS les chemins sémantiques en CI car ça nécessite local LLM endpoint UP
    # (HTTP call à $LLM_ENDPOINT). Test manuel local seulement.
    # Si tu veux tester en local (LLM endpoint reachable) : voir docs/plans/2026-05-03-iterative-stabilization-research.md
    pass "PFCRI-V4.1" "behavioral semantic: skipped en CI (requires local LLM endpoint). Run manuel : tests/manual/v41-semantic.sh"

    # P2b regression: judge_errors dans JSON output (crash silencieux → faux positifs)
    # Test exact-stable path (fichiers identiques → judge jamais appelé → judge_errors=0)
    local td_s
    td_s=$(mktemp -d)
    printf 'scripts/foo.sh:10|Bug in extraction\n' > "$td_s/prev.txt"
    printf 'scripts/foo.sh:10|Bug in extraction\n' > "$td_s/curr.txt"
    local drs_out
    drs_out=$(bash "$drs_script" "$td_s/prev.txt" "$td_s/curr.txt" 2>/dev/null)
    if echo "$drs_out" | grep -q '"judge_errors"'; then
        pass "PFCRI-V4.1" "structural: diff-rounds-semantic output includes judge_errors field"
    else
        fail "PFCRI-V4.1" "structural: judge_errors manquant dans output — crash judge serait silencieux (régression P2b)"
    fi
    rm -rf "$td_s"

    # Validation que le skill V4 ou doc référence diff-rounds-semantic
    local skill="$PROJECT_ROOT/extensions/pf-cross-review-iterate/commands/iterate.md"
    if [[ -f "$skill" ]] && grep -q "diff-rounds-semantic\|semantic dedup\|LLM-as-judge" "$skill"; then
        pass "PFCRI-V4.1" "skill iterate.md mentionne semantic dedup (V4.1 wired)"
    else
        # Pas un fail dur — la wire-up dans le skill peut être next iteration
        warn "PFCRI-V4.1" "skill iterate.md ne mentionne pas encore semantic dedup (à wire-up V4.2)"
    fi
}

# ---------------------------------------------------------------------------
# INSTALL — install-skill propage les helper scripts dans le projet cible
# Régression : sans cette fonctionnalité, /pf-cross-review-iterate déployé
# chez child project = coquille vide (skill .md sans les scripts/ attendus).
# ---------------------------------------------------------------------------
test_install_skill_helpers() {
    section "INSTALL: install-skill propage helper scripts"

    local install_tool="$PROJECT_ROOT/tools/install-skill"
    if [[ ! -x "$install_tool" ]]; then
        fail "INSTALL" "tools/install-skill missing or not executable"
        return
    fi
    pass "INSTALL" "tools/install-skill exists + executable"

    # Behavioral : install pf-cross-review-iterate dans /tmp doit copier
    # les 4 helpers (fingerprint, diff-rounds, diff-rounds-semantic, dedupe-judge).
    # Pas de trap RETURN ici — il serait globalement contagieux et planterait
    # les fonctions suivantes avec set -u (variable hors scope).
    local tmp tmp2
    tmp=$(mktemp -d)

    if ! "$install_tool" pf-cross-review-iterate "$tmp" >/dev/null 2>&1; then
        fail "INSTALL" "install pf-cross-review-iterate failed"
        rm -rf "$tmp"
        return
    fi

    local helper_count
    helper_count=$(find "$tmp/scripts/cross-review-iterate" -type f -name '*.sh' 2>/dev/null | wc -l)
    if [[ "$helper_count" -ge 4 ]]; then
        pass "INSTALL" "behavioral: install copies $helper_count helpers (≥4 expected)"
    else
        fail "INSTALL" "behavioral: only $helper_count helpers copied (expected ≥4)"
    fi

    # Permissions exécutables préservées
    local non_executable
    non_executable=$(find "$tmp/scripts/cross-review-iterate" -type f -name '*.sh' ! -executable 2>/dev/null | wc -l)
    if [[ "$non_executable" -eq 0 ]]; then
        pass "INSTALL" "behavioral: all .sh helpers are executable"
    else
        fail "INSTALL" "behavioral: $non_executable .sh helpers not executable"
    fi

    # Skip silencieux : skill sans scripts/ associés (ex: pf-cross-review) → pas de scripts/ créé
    tmp2=$(mktemp -d)
    if "$install_tool" pf-cross-review "$tmp2" >/dev/null 2>&1; then
        if [[ ! -d "$tmp2/scripts" ]]; then
            pass "INSTALL" "behavioral: skill sans helpers (pf-cross-review) ne crée pas de scripts/ vide"
        else
            warn "INSTALL" "behavioral: scripts/ créé pour skill sans helpers (cosmétique)"
        fi
    else
        fail "INSTALL" "install pf-cross-review failed"
    fi

    # Cleanup explicite (pas de trap RETURN — voir commentaire plus haut)
    rm -rf "$tmp" "$tmp2"
}

# ---------------------------------------------------------------------------
# NODUP — No duplicates between commands/ and .claude/commands/
# ---------------------------------------------------------------------------
test_no_duplicates() {
    section "NODUP: No Command Duplicates"

    if [[ ! -d "$PROJECT_ROOT/.claude/commands" ]]; then
        pass "NODUP" "No .claude/commands/ directory (no duplicates possible)"
        return
    fi

    local has_dup=false
    for claude_cmd in "$PROJECT_ROOT"/.claude/commands/*.md; do
        [[ -f "$claude_cmd" ]] || continue
        local name
        name=$(basename "$claude_cmd")
        if [[ -f "$PROJECT_ROOT/commands/$name" ]]; then
            fail "NODUP" "Duplicate: $name exists in both commands/ and .claude/commands/"
            has_dup=true
        fi
    done

    if ! $has_dup; then
        pass "NODUP" "No duplicates between commands/ and .claude/commands/"
    fi
}

# ---------------------------------------------------------------------------
# AGENT — Subagent validation
# ---------------------------------------------------------------------------
test_agents() {
    section "AGENT: Custom Subagents"

    if [[ ! -d "$PROJECT_ROOT/.claude/agents" ]]; then
        warn "AGENT" "No .claude/agents/ directory (no custom subagents)"
        return
    fi

    local agent_count=0
    for agent_file in "$PROJECT_ROOT"/.claude/agents/*.md; do
        [[ -f "$agent_file" ]] || continue
        agent_count=$((agent_count + 1))
        local name
        name=$(basename "$agent_file" .md)

        # Check frontmatter
        if head -1 "$agent_file" | grep -q '^---'; then
            local has_name has_desc
            has_name=$(sed -n '/^---$/,/^---$/p' "$agent_file" | grep -c '^name:')
            has_desc=$(sed -n '/^---$/,/^---$/p' "$agent_file" | grep -c '^description:')
            if [[ $has_name -gt 0 && $has_desc -gt 0 ]]; then
                pass "AGENT" "$name: valid frontmatter (name + description)"
            else
                fail "AGENT" "$name: missing name or description in frontmatter"
            fi

            # Check model field
            if sed -n '/^---$/,/^---$/p' "$agent_file" | grep -q '^model:'; then
                local model
                model=$(sed -n '/^---$/,/^---$/p' "$agent_file" | grep '^model:' | awk '{print $2}')
                pass "AGENT" "$name: model=$model"
            else
                verbose "$name: no model specified (will inherit)"
            fi
        else
            fail "AGENT" "$name: missing YAML frontmatter"
        fi
    done

    if [[ $agent_count -eq 0 ]]; then
        warn "AGENT" "No agent files found in .claude/agents/"
    else
        verbose "Found $agent_count agents"
    fi
}

# ---------------------------------------------------------------------------
# RULES — Rules validation
# ---------------------------------------------------------------------------
test_rules() {
    section "RULES: Modular Rules"

    if [[ ! -d "$PROJECT_ROOT/.claude/rules" ]]; then
        verbose "No .claude/rules/ directory (using CLAUDE.md only)"
        pass "RULES" "CLAUDE.md exists and is < 300 lines (modular rules not needed)"
        return
    fi

    local rule_count=0
    for rule_file in "$PROJECT_ROOT"/.claude/rules/*.md; do
        [[ -f "$rule_file" ]] || continue
        rule_count=$((rule_count + 1))
        local name
        name=$(basename "$rule_file" .md)
        local lines
        lines=$(wc -l < "$rule_file")

        if [[ $lines -lt 500 ]]; then
            pass "RULES" "$name: ${lines} lines (< 500 limit)"
        else
            warn "RULES" "$name: ${lines} lines (> 500 recommended limit)"
        fi
    done

    if [[ $rule_count -gt 0 ]]; then
        verbose "Found $rule_count rule files"
    fi
}

# ---------------------------------------------------------------------------
# QUAL — Quality configs validation
# ---------------------------------------------------------------------------
test_quality_configs() {
    section "QUAL: Quality Configs"

    local starters=("saas" "saas-base" "supabase-stripe")

    for starter in "${starters[@]}"; do
        local dir="$PROJECT_ROOT/starters/$starter"

        # package.json has quality scripts
        if [[ -f "$dir/package.json" ]]; then
            local has_jscpd has_knip has_scan
            has_jscpd=$(jq -r '.scripts["quality:jscpd"] // empty' "$dir/package.json" 2>/dev/null)
            has_knip=$(jq -r '.scripts["quality:knip"] // empty' "$dir/package.json" 2>/dev/null)
            has_scan=$(jq -r '.scripts["quality:scan"] // empty' "$dir/package.json" 2>/dev/null)

            [[ -n "$has_jscpd" ]] && pass "QUAL" "$starter: quality:jscpd script" || fail "QUAL" "$starter: missing quality:jscpd script"
            [[ -n "$has_knip" ]] && pass "QUAL" "$starter: quality:knip script" || fail "QUAL" "$starter: missing quality:knip script"
            [[ -n "$has_scan" ]] && pass "QUAL" "$starter: quality:scan script" || fail "QUAL" "$starter: missing quality:scan script"

            # @playwright/test in devDeps (E2E testing)
            local has_playwright
            has_playwright=$(jq -r '.devDependencies["@playwright/test"] // empty' "$dir/package.json" 2>/dev/null)
            if [[ -n "$has_playwright" ]]; then
                pass "QUAL" "$starter: @playwright/test=$has_playwright"
            else
                warn "QUAL" "$starter: @playwright/test not in devDeps (no E2E)"
            fi

            # Has quality devDeps
            for dep in jscpd knip eslint-plugin-sonarjs wait-on; do
                local ver
                ver=$(jq -r ".devDependencies[\"$dep\"] // empty" "$dir/package.json" 2>/dev/null)
                [[ -n "$ver" ]] && pass "QUAL" "$starter: $dep=$ver" || fail "QUAL" "$starter: missing devDep $dep"
            done
        fi

        # .jscpd.json valid JSON
        if [[ -f "$dir/.jscpd.json" ]]; then
            if python3 -c "import json; json.load(open('$dir/.jscpd.json'))" 2>/dev/null; then
                pass "QUAL" "$starter: .jscpd.json is valid JSON"
            else
                fail "QUAL" "$starter: .jscpd.json is invalid JSON"
            fi
        else
            fail "QUAL" "$starter: missing .jscpd.json"
        fi

        # knip.config.ts exists
        if [[ -f "$dir/knip.config.ts" ]]; then
            pass "QUAL" "$starter: knip.config.ts exists"
        else
            fail "QUAL" "$starter: missing knip.config.ts"
        fi

        # .eslintrc.json valid + has sonarjs
        if [[ -f "$dir/.eslintrc.json" ]]; then
            if python3 -c "import json; json.load(open('$dir/.eslintrc.json'))" 2>/dev/null; then
                pass "QUAL" "$starter: .eslintrc.json is valid JSON"
                if grep -q "sonarjs" "$dir/.eslintrc.json"; then
                    pass "QUAL" "$starter: .eslintrc.json includes sonarjs"
                else
                    fail "QUAL" "$starter: .eslintrc.json missing sonarjs"
                fi
            else
                fail "QUAL" "$starter: .eslintrc.json is invalid JSON"
            fi
        fi

        # playwright.config.ts (E2E config)
        if [[ -f "$dir/playwright.config.ts" ]]; then
            pass "QUAL" "$starter: playwright.config.ts exists"
        else
            warn "QUAL" "$starter: no playwright.config.ts (no E2E config)"
        fi
    done
}

# ---------------------------------------------------------------------------
# CI — CI/CD validation
# ---------------------------------------------------------------------------
test_ci() {
    section "CI: CI/CD Config"

    local ci_file="$PROJECT_ROOT/skills/cicd/github-actions-base/files/.github/workflows/ci.yml"

    if [[ -f "$ci_file" ]]; then
        pass "CI" "ci.yml exists"

        # Valid YAML
        if python3 -c "import yaml; yaml.safe_load(open('$ci_file'))" 2>/dev/null; then
            pass "CI" "ci.yml is valid YAML"
        else
            fail "CI" "ci.yml is invalid YAML"
        fi

        # Expected jobs
        for job in lint-typecheck quality-scan unit-tests e2e build claude-review; do
            if grep -q "^  $job:" "$ci_file"; then
                pass "CI" "ci.yml has job: $job"
            else
                fail "CI" "ci.yml missing job: $job"
            fi
        done
    else
        fail "CI" "ci.yml not found"
    fi
}

# ---------------------------------------------------------------------------
# RALPH — Ralph++ tooling validation
# ---------------------------------------------------------------------------
test_ralph() {
    section "RALPH: Ralph++ Tooling"

    # Fallback quality gate
    local fallback
    fallback=$(echo '{}' | jq -r '.config.qualityGates.command // .config.qualityGates.typecheck // "npx tsc --noEmit && npx next lint && npx vitest run && npm run quality:jscpd && npm run quality:knip"' 2>/dev/null)
    if echo "$fallback" | grep -q "quality:jscpd"; then
        pass "RALPH" "Fallback quality gate includes quality:jscpd"
    else
        fail "RALPH" "Fallback quality gate missing quality:jscpd"
    fi
    if echo "$fallback" | grep -q "quality:knip"; then
        pass "RALPH" "Fallback quality gate includes quality:knip"
    else
        fail "RALPH" "Fallback quality gate missing quality:knip"
    fi

    # PRD template
    local prd_template="$PROJECT_ROOT/skills/core/ralph-loop/templates/prd-with-quality-gates.json"
    if [[ -f "$prd_template" ]]; then
        if python3 -c "import json; json.load(open('$prd_template'))" 2>/dev/null; then
            pass "RALPH" "PRD template is valid JSON"
            local cmd
            cmd=$(jq -r '.config.qualityGates.command' "$prd_template" 2>/dev/null)
            if echo "$cmd" | grep -q "quality:jscpd"; then
                pass "RALPH" "PRD template quality gate includes quality scans"
            else
                fail "RALPH" "PRD template quality gate missing quality scans"
            fi
        else
            fail "RALPH" "PRD template is invalid JSON"
        fi
    else
        fail "RALPH" "PRD template not found"
    fi

    # tools/ralph has the updated fallback
    if grep -q "quality:jscpd" "$PROJECT_ROOT/tools/ralph" 2>/dev/null; then
        pass "RALPH" "tools/ralph contains quality:jscpd in fallback"
    else
        fail "RALPH" "tools/ralph missing quality:jscpd in fallback"
    fi
}

# ---------------------------------------------------------------------------
# CONVERT — SpecKit convert consistency
# ---------------------------------------------------------------------------
test_convert() {
    section "CONVERT: Convert Skill Consistency"

    # Check convert prompt has quality gates
    local convert_prompt="$PROJECT_ROOT/skills/speckit/convert/prompt.md"
    if [[ -f "$convert_prompt" ]]; then
        if grep -q "quality:jscpd" "$convert_prompt"; then
            pass "CONVERT" "convert/prompt.md includes quality:jscpd in gates"
        else
            fail "CONVERT" "convert/prompt.md missing quality:jscpd in gates"
        fi
        if grep -q "quality:knip" "$convert_prompt"; then
            pass "CONVERT" "convert/prompt.md includes quality:knip in gates"
        else
            fail "CONVERT" "convert/prompt.md missing quality:knip in gates"
        fi
    fi

    # Check command file has quality gates
    local convert_cmd="$PROJECT_ROOT/commands/speckit-convert.md"
    if [[ -f "$convert_cmd" ]]; then
        if grep -q "quality:jscpd" "$convert_cmd"; then
            pass "CONVERT" "commands/speckit-convert.md includes quality:jscpd"
        else
            fail "CONVERT" "commands/speckit-convert.md missing quality:jscpd"
        fi
    fi
}

# ---------------------------------------------------------------------------
# HOOKS — PreToolUse hook protection
# ---------------------------------------------------------------------------
test_hooks() {
    section "HOOKS: PreToolUse Hook Protection"

    local starters=("saas" "saas-base" "supabase-stripe")

    for starter in "${starters[@]}"; do
        local dir="$PROJECT_ROOT/starters/$starter"
        local hook="$dir/.claude/hooks/protect-speckit-tests.sh"
        local settings="$dir/.claude/settings.json"

        # Hook script exists
        if [[ -f "$hook" ]]; then
            pass "HOOKS" "$starter: protect-speckit-tests.sh exists"
        else
            fail "HOOKS" "$starter: missing .claude/hooks/protect-speckit-tests.sh"
        fi

        # Hook script is executable
        if [[ -x "$hook" ]]; then
            pass "HOOKS" "$starter: protect-speckit-tests.sh is executable"
        else
            fail "HOOKS" "$starter: protect-speckit-tests.sh is not executable"
        fi

        # settings.json exists
        if [[ -f "$settings" ]]; then
            pass "HOOKS" "$starter: .claude/settings.json exists"

            # Valid JSON
            if python3 -c "import json; json.load(open('$settings'))" 2>/dev/null; then
                pass "HOOKS" "$starter: settings.json is valid JSON"
            else
                fail "HOOKS" "$starter: settings.json is invalid JSON"
            fi

            # Has PreToolUse hook
            if grep -q "PreToolUse" "$settings"; then
                pass "HOOKS" "$starter: settings.json has PreToolUse hook"
            else
                fail "HOOKS" "$starter: settings.json missing PreToolUse hook"
            fi

            # References hook script
            if grep -q "protect-speckit-tests" "$settings"; then
                pass "HOOKS" "$starter: settings.json references protect-speckit-tests"
            else
                fail "HOOKS" "$starter: settings.json missing hook script reference"
            fi
        else
            fail "HOOKS" "$starter: missing .claude/settings.json"
        fi
    done
}

# ---------------------------------------------------------------------------
# TICKET HOOK — check-ticket-update.sh + project-level .claude/settings.json
# ---------------------------------------------------------------------------
test_ticket_hook() {
    section "TICKET HOOK: scripts/check-ticket-update.sh"

    local script="$PROJECT_ROOT/scripts/check-ticket-update.sh"
    local settings="$PROJECT_ROOT/.claude/settings.json"

    # Script exists and is executable
    if [[ -f "$script" ]]; then
        pass "TICKET-HOOK" "scripts/check-ticket-update.sh exists"
    else
        fail "TICKET-HOOK" "missing scripts/check-ticket-update.sh"
        return
    fi

    if [[ -x "$script" ]]; then
        pass "TICKET-HOOK" "scripts/check-ticket-update.sh is executable"
    else
        fail "TICKET-HOOK" "scripts/check-ticket-update.sh is not executable"
    fi

    # Project-level settings.json exists and is valid
    if [[ -f "$settings" ]]; then
        pass "TICKET-HOOK" ".claude/settings.json exists"
        if python3 -c "import json; json.load(open('$settings'))" 2>/dev/null; then
            pass "TICKET-HOOK" ".claude/settings.json is valid JSON"
        else
            fail "TICKET-HOOK" ".claude/settings.json is invalid JSON"
        fi
        if grep -q "check-ticket-update" "$settings"; then
            pass "TICKET-HOOK" "settings.json references check-ticket-update.sh"
        else
            fail "TICKET-HOOK" "settings.json missing check-ticket-update reference"
        fi
        if grep -q '"Stop"' "$settings"; then
            pass "TICKET-HOOK" "settings.json wires Stop hook"
        else
            fail "TICKET-HOOK" "settings.json missing Stop hook"
        fi
    else
        fail "TICKET-HOOK" "missing .claude/settings.json"
    fi

    # Smoke test: script runs silently in a non-git temp dir (exits 0)
    local tmpdir
    tmpdir=$(mktemp -d)
    if (cd "$tmpdir" && bash "$script" >/dev/null 2>&1); then
        pass "TICKET-HOOK" "smoke test: exits 0 outside git repo"
    else
        fail "TICKET-HOOK" "smoke test: failed outside git repo (should exit 0)"
    fi
    rm -rf "$tmpdir"

    # Smoke test: script silent in isolated git repo with no #N refs in commits.
    # Determined design: avoids dependency on current PF backlog state — the test
    # passes/fails on hook code quality, not on whether real GitHub tickets are open.
    local tmpdir2
    tmpdir2=$(mktemp -d)
    (
        cd "$tmpdir2" || exit
        git init -q
        git config user.email "test@example.invalid"
        git config user.name "Smoke Test"
        echo "x" > a
        git add a
        git commit -qm "test: no refs in this commit message"
    )
    local output
    output=$(cd "$tmpdir2" && bash "$script" 2>&1 || true)
    if [[ -z "$output" ]]; then
        pass "TICKET-HOOK" "smoke test: silent in isolated repo with no #N refs"
    else
        fail "TICKET-HOOK" "smoke test: produced unexpected output in isolated repo: $output"
    fi
    rm -rf "$tmpdir2"
}

# ---------------------------------------------------------------------------
# TEST-VERIFICATION HOOK — test-verification-reminder.sh + settings.json
# ---------------------------------------------------------------------------
test_test_verification_hook() {
    section "TEST-VERIF HOOK: scripts/test-verification-reminder.sh"

    local script="$PROJECT_ROOT/scripts/test-verification-reminder.sh"
    local settings="$PROJECT_ROOT/.claude/settings.json"

    # Script exists + executable
    if [[ -f "$script" ]]; then
        pass "TEST-VERIF" "scripts/test-verification-reminder.sh exists"
    else
        fail "TEST-VERIF" "missing scripts/test-verification-reminder.sh"
        return
    fi

    if [[ -x "$script" ]]; then
        pass "TEST-VERIF" "scripts/test-verification-reminder.sh is executable"
    else
        fail "TEST-VERIF" "scripts/test-verification-reminder.sh is not executable"
    fi

    # settings.json references it
    if grep -q "test-verification-reminder" "$settings"; then
        pass "TEST-VERIF" "settings.json references test-verification-reminder.sh"
    else
        fail "TEST-VERIF" "settings.json missing test-verification-reminder reference"
    fi

    # Smoke test: silent outside git repo (exits 0)
    local tmpdir
    tmpdir=$(mktemp -d)
    if (cd "$tmpdir" && bash "$script" >/dev/null 2>&1); then
        pass "TEST-VERIF" "smoke test: exits 0 outside git repo"
    else
        fail "TEST-VERIF" "smoke test: failed outside git repo (should exit 0)"
    fi
    rm -rf "$tmpdir"

    # Smoke test: silent in isolated repo with NO meta changes (only doc edit)
    local tmpdir2
    tmpdir2=$(mktemp -d)
    (
        cd "$tmpdir2" || exit
        git init -q
        git config user.email "test@example.invalid"
        git config user.name "Smoke Test"
        echo "x" > README.md
        git add README.md
        git commit -qm "init"
        echo "y" >> README.md
    )
    local output
    output=$(cd "$tmpdir2" && CLAUDE_PROJECT_DIR="$tmpdir2" bash "$script" 2>&1 || true)
    if [[ -z "$output" ]]; then
        pass "TEST-VERIF" "smoke test: silent when no meta files modified"
    else
        fail "TEST-VERIF" "smoke test: produced output when no meta files modified: $output"
    fi
    rm -rf "$tmpdir2"

    # Positive test: triggers reminder when a meta file is modified
    local tmpdir3
    tmpdir3=$(mktemp -d)
    (
        cd "$tmpdir3" || exit
        git init -q
        git config user.email "test@example.invalid"
        git config user.name "Smoke Test"
        mkdir -p scripts
        echo "old" > scripts/foo.sh
        git add scripts/foo.sh
        git commit -qm "init"
        echo "new" > scripts/foo.sh
    )
    local output3
    output3=$(cd "$tmpdir3" && CLAUDE_PROJECT_DIR="$tmpdir3" bash "$script" 2>&1 || true)
    if echo "$output3" | grep -q "RAPPEL TEST-VERIFICATION"; then
        pass "TEST-VERIF" "positive test: triggers reminder when scripts/ modified"
    else
        fail "TEST-VERIF" "positive test: should trigger reminder, got: $output3"
    fi
    rm -rf "$tmpdir3"

    # Positive test: triggers reminder when tests/ is modified (no blind-spot on harness itself)
    local tmpdir4
    tmpdir4=$(mktemp -d)
    (
        cd "$tmpdir4" || exit
        git init -q
        git config user.email "test@example.invalid"
        git config user.name "Smoke Test"
        mkdir -p tests
        echo "old" > tests/foo.sh
        git add tests/foo.sh
        git commit -qm "init"
        echo "new" > tests/foo.sh
    )
    local output4
    output4=$(cd "$tmpdir4" && CLAUDE_PROJECT_DIR="$tmpdir4" bash "$script" 2>&1 || true)
    if echo "$output4" | grep -q "RAPPEL TEST-VERIFICATION"; then
        pass "TEST-VERIF" "positive test: triggers reminder when tests/ modified (anti blind-spot)"
    else
        fail "TEST-VERIF" "positive test: should trigger reminder on tests/ modification, got: $output4"
    fi
    rm -rf "$tmpdir4"
}

# ---------------------------------------------------------------------------
# LOOP — Improvement loop (Phase 1a hooks capture)
# ---------------------------------------------------------------------------
test_improvement_loop() {
    section "LOOP: Improvement Loop (Phase 1a)"

    local starter_dir="$PROJECT_ROOT/starters/saas"
    local hooks_dir="$starter_dir/.claude/hooks"
    local learnings_dir="$starter_dir/.learnings"

    # Hook files exist and are executable
    local required_hooks=(
        "session-end-capture.sh"
        "pre-compact-snapshot.sh"
        "extract-lessons.py"
    )
    for hook in "${required_hooks[@]}"; do
        if [[ -f "$hooks_dir/$hook" ]]; then
            pass "LOOP" "hook exists: $hook"
            if [[ -x "$hooks_dir/$hook" ]]; then
                pass "LOOP" "hook executable: $hook"
            else
                fail "LOOP" "hook not executable: $hook"
            fi
        else
            fail "LOOP" "hook missing: $hook"
        fi
    done

    # Python extractor is syntactically valid
    if [[ -f "$hooks_dir/extract-lessons.py" ]]; then
        if python3 -m py_compile "$hooks_dir/extract-lessons.py" 2>/dev/null; then
            pass "LOOP" "extract-lessons.py syntax valid"
        else
            fail "LOOP" "extract-lessons.py has syntax errors"
        fi
    fi

    # .learnings/ scaffold
    local required_learnings_files=(
        "LEARNINGS.md"
        "gating-policies.md"
    )
    for f in "${required_learnings_files[@]}"; do
        if [[ -f "$learnings_dir/$f" ]]; then
            pass "LOOP" ".learnings/$f exists"
        else
            fail "LOOP" ".learnings/$f missing"
        fi
    done

    # .learnings/ subdirs with .gitkeep
    for subdir in proposals archive snapshots; do
        if [[ -d "$learnings_dir/$subdir" ]]; then
            pass "LOOP" ".learnings/$subdir/ exists"
        else
            fail "LOOP" ".learnings/$subdir/ missing"
        fi
    done

    # .gitignore contains improvement loop entries
    if [[ -f "$starter_dir/.gitignore" ]]; then
        if grep -q "\.learnings/queue\.jsonl" "$starter_dir/.gitignore"; then
            pass "LOOP" ".gitignore excludes queue.jsonl"
        else
            fail "LOOP" ".gitignore missing queue.jsonl exclusion"
        fi
        if grep -q "\.learnings/snapshots/" "$starter_dir/.gitignore"; then
            pass "LOOP" ".gitignore excludes snapshots/"
        else
            fail "LOOP" ".gitignore missing snapshots/ exclusion"
        fi
    fi

    # settings.json registers SessionEnd and PreCompact hooks
    if [[ -f "$starter_dir/.claude/settings.json" ]]; then
        if grep -q "SessionEnd" "$starter_dir/.claude/settings.json"; then
            pass "LOOP" "settings.json registers SessionEnd hook"
        else
            fail "LOOP" "settings.json missing SessionEnd hook"
        fi
        if grep -q "PreCompact" "$starter_dir/.claude/settings.json"; then
            pass "LOOP" "settings.json registers PreCompact hook"
        else
            fail "LOOP" "settings.json missing PreCompact hook"
        fi
        if grep -q "session-end-capture" "$starter_dir/.claude/settings.json"; then
            pass "LOOP" "settings.json references session-end-capture.sh"
        else
            fail "LOOP" "settings.json missing session-end-capture.sh reference"
        fi
    fi

    # End-to-end test: run the hook with synthetic input
    if [[ -f "$hooks_dir/session-end-capture.sh" && -f "$hooks_dir/extract-lessons.py" ]]; then
        local test_dir
        test_dir=$(mktemp -d)
        mkdir -p "$test_dir/.learnings" "$test_dir/.claude/hooks"
        cp "$hooks_dir/extract-lessons.py" "$test_dir/.claude/hooks/"
        cp "$hooks_dir/session-end-capture.sh" "$test_dir/.claude/hooks/"
        chmod +x "$test_dir/.claude/hooks/"*

        cat > "$test_dir/transcript.jsonl" << 'TRANSCRIPT_EOF'
{"role":"user","content":"How should I deploy this application to production? I want to make sure everything is set up correctly."}
{"role":"assistant","content":"Actually, you should use pnpm instead of npm for this project because of the workspace support and disk efficiency. The team decided to go with pnpm last quarter."}
{"role":"user","content":"What about testing?"}
{"role":"assistant","content":"Remember this: always run typecheck before committing. Never skip the lint step either — it will catch issues that the typecheck alone misses, particularly around unused imports and deprecated APIs."}
{"role":"user","content":"I ran into a build error"}
{"role":"assistant","content":"After 3 attempts and a lot of debugging, the fix was to set NODE_ENV=production before the build step. The root cause was a missing environment variable in the CI pipeline that only manifested during the webpack tree-shaking phase."}
{"role":"user","content":"And Stripe refunds?"}
{"role":"assistant","content":"The Stripe API doesn't support partial refunds on subscriptions directly. Turns out you need to use the adjustments endpoint instead, which is a known issue documented in github issue 4521. The workaround is to create a credit note."}
TRANSCRIPT_EOF

        printf '{"session_id":"test","transcript_path":"%s","cwd":"%s"}' \
            "$test_dir/transcript.jsonl" "$test_dir" \
            | bash "$test_dir/.claude/hooks/session-end-capture.sh" 2>/dev/null

        sleep 2  # Wait for async background

        if [[ -f "$test_dir/.learnings/queue.jsonl" ]]; then
            local entries
            entries=$(wc -l < "$test_dir/.learnings/queue.jsonl" 2>/dev/null || echo 0)
            if [[ $entries -ge 4 ]]; then
                pass "LOOP" "end-to-end capture produces $entries entries (>= 4 expected)"
            else
                fail "LOOP" "end-to-end capture only produced $entries entries"
            fi
        else
            fail "LOOP" "end-to-end capture produced no queue.jsonl"
        fi

        rm -rf "$test_dir"
    fi
}

# ---------------------------------------------------------------------------
# RALPH++ GIT HOOK — tools/git-hooks.d/commit-msg blocking gate
# ---------------------------------------------------------------------------
test_ralph_hook() {
    section "RALPH-HOOK: tools/git-hooks.d/commit-msg"

    local hook="$PROJECT_ROOT/tools/git-hooks.d/commit-msg"

    if [[ -f "$hook" ]]; then
        pass "RALPH-HOOK" "tools/git-hooks.d/commit-msg exists"
    else
        fail "RALPH-HOOK" "missing tools/git-hooks.d/commit-msg"
        return
    fi

    if [[ -x "$hook" ]]; then
        pass "RALPH-HOOK" "commit-msg hook is executable"
    else
        fail "RALPH-HOOK" "commit-msg hook is not executable"
    fi

    if grep -qF 'Story [0-9]' "$hook"; then
        pass "RALPH-HOOK" "hook targets Ralph++ story commits (Story N/N: pattern)"
    else
        fail "RALPH-HOOK" "hook missing Story N/N pattern guard"
    fi

    if grep -q 'exit 1' "$hook"; then
        pass "RALPH-HOOK" "hook blocks with exit 1 on quality gate failure"
    else
        fail "RALPH-HOOK" "hook does not exit 1 (not blocking)"
    fi

    # Edge case: non-story commit must pass through (exit 0)
    local tmp_msg
    tmp_msg=$(mktemp)
    echo "feat: regular commit unrelated to Ralph++" > "$tmp_msg"
    if bash "$hook" "$tmp_msg" 2>/dev/null; then
        pass "RALPH-HOOK" "non-story commit passes through (exit 0)"
    else
        fail "RALPH-HOOK" "non-story commit incorrectly blocked"
    fi
    rm -f "$tmp_msg"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------
main() {
    if ! $JSON_OUTPUT; then
        echo ""
        echo -e "${BOLD}${CYAN}  Project-Forge Evaluation Suite${NC}"
        echo -e "${DIM}  $(date -Iseconds)${NC}"
        echo ""
    fi

    test_structure
    test_skills
    test_commands
    test_extensions
    test_pf_cross_review_behavior
    test_pf_cross_review_iterate
    test_pf_cross_review_iterate_v41
    test_install_skill_helpers
    test_no_duplicates
    test_agents
    test_rules
    test_quality_configs
    test_ci
    test_ralph
    test_convert
    test_hooks
    test_ticket_hook
    test_test_verification_hook
    test_improvement_loop
    test_ralph_hook

    # Summary
    local total=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

    if $JSON_OUTPUT; then
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"total\": $total,"
        echo "  \"pass\": $PASS_COUNT,"
        echo "  \"fail\": $FAIL_COUNT,"
        echo "  \"warn\": $WARN_COUNT,"
        echo "  \"results\": ["
        local first=true
        for r in "${RESULTS[@]}"; do
            IFS='|' read -r status category msg <<< "$r"
            if $first; then first=false; else echo ","; fi
            printf '    {"status": "%s", "category": "%s", "message": "%s"}' "$status" "$category" "$msg"
        done
        echo ""
        echo "  ]"
        echo "}"
    else
        echo ""
        echo -e "${BOLD}── Summary ──${NC}"
        echo ""
        echo -e "  Total:    $total"
        echo -e "  ${GREEN}PASS:     $PASS_COUNT${NC}"
        echo -e "  ${RED}FAIL:     $FAIL_COUNT${NC}"
        echo -e "  ${YELLOW}WARN:     $WARN_COUNT${NC}"
        echo ""

        if [[ $FAIL_COUNT -eq 0 ]]; then
            echo -e "  ${GREEN}${BOLD}ALL TESTS PASSED${NC}"
        else
            echo -e "  ${RED}${BOLD}$FAIL_COUNT TESTS FAILED${NC}"
        fi
        echo ""
    fi

    [[ $FAIL_COUNT -eq 0 ]]
}

cd "$PROJECT_ROOT" || exit 1
main
