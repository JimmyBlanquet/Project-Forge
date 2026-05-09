# Matrice de compatibilité : Project-Forge SpecKit ↔ GitHub spec-kit v0.3.2

**Date** : 2026-03-23
**Résultat de** : Phase 1.1 + 1.2

## Installation validée

- `specify` CLI v0.3.2 installée via `uv tool install`
- `specify init --here --ai claude --force` fonctionne dans un projet existant
- Structure générée : `.specify/`, `.claude/commands/speckit.*.md`, `memory/`

## Comparaison des formats

### Constitution

| Aspect | Project-Forge | spec-kit | Compatibilité |
|--------|---------------|----------|---------------|
| Format | `.speckit/constitution.yml` (YAML) | `.specify/memory/constitution.md` (Markdown) | ⚠️ Migration nécessaire |
| Contenu | Clés structurées (principles, constraints) | Sections libres (Core Principles, Governance) | ✅ Compatible conceptuellement |
| Versioning | Non | Oui (Version, Ratified, Last Amended) | 🔄 spec-kit plus complet |

**Action** : adapter `speckit-convert` pour lire le format Markdown de spec-kit.

### Spec (spec.md)

| Aspect | Project-Forge | spec-kit | Compatibilité |
|--------|---------------|----------|---------------|
| Acceptance Scenarios | `AS1.1`, `AS1.2` (numérotés) | Given/When/Then (BDD) | ⚠️ Format différent |
| User Stories | Numérotées | Prioritisées (P1, P2, P3) avec Independent Test | 🔄 spec-kit plus structuré |
| Requirements | Implicites dans la spec | `FR-001`, `FR-002` (numérotés RFC 2119) | 🔄 spec-kit plus formel |
| Clarification markers | `[NEEDS CLARIFICATION]` | `[NEEDS CLARIFICATION: detail]` | ✅ Compatible |
| Success Criteria | Non | `SC-001`, `SC-002` (mesurables) | 🔄 spec-kit plus complet |

**Impact sur nos extensions :**
- `speckit-convert` : doit parser Given/When/Then au lieu de `AS1.1`
- `speckit-recette` : doit lire les Acceptance Scenarios BDD
- `speckit-test-bridge` : doit convertir Given/When/Then → Playwright specs (plus naturel que AS)
- `verify-test-traceability.sh` : grep `Given.*When.*Then` au lieu de `AS\d+\.\d+`

### Tasks (tasks.md)

| Aspect | Project-Forge | spec-kit | Compatibilité |
|--------|---------------|----------|---------------|
| Format ID | US-001, US-002 | T001, T002 | ⚠️ Convention différente |
| Parallélisme | Marqué dans le PRD | `[P]` marker | ✅ Concept identique |
| Story tracking | Par phase | `[US1]`, `[US2]` labels | ✅ Compatible |
| Checkpoints | Non | Oui (par user story) | 🔄 spec-kit mieux structuré |
| Tests | Obligatoires | Optionnels (flag) | ⚠️ Philosophie différente — on force via extension |
| Phases | Numérotées simples | Setup → Foundational → US1 → US2 → Polish | ✅ Compatible |

**Impact sur `speckit-convert`** : le parser PRD doit mapper T001→sub-story, [P]→parallelizable, [US1]→grouping.

### Plan (plan.md)

| Aspect | Project-Forge | spec-kit | Compatibilité |
|--------|---------------|----------|---------------|
| Constitution Check | Gate dans skill | Gate explicite dans template | ✅ Compatible |
| Complexity Tracking | Non | Table "Violation / Why / Alternative" | 🔄 spec-kit meilleur |
| Outputs additionnels | Non | research.md, data-model.md, quickstart.md, contracts/ | 🔄 spec-kit plus riche |

### Commandes

| Aspect | Project-Forge | spec-kit | Compatibilité |
|--------|---------------|----------|---------------|
| Namespace | `speckit-*` (dash) | `speckit.*` (dot) | ⚠️ Renommage nécessaire |
| Format | SKILL.md files | `.claude/commands/*.md` | ⚠️ Format différent |
| Handoffs | Non | Oui (frontmatter `handoffs`) | 🔄 À adopter |
| Shell scripts | Non | `.specify/scripts/bash/*.sh` | 🔄 À adopter |
| Extension hooks | Non | `before_*/after_*` via extensions.yml | 🔄 À adopter |

## Résumé des adaptations nécessaires

### Extensions PF à adapter

1. **speckit-convert** (CRITIQUE) :
   - Parser Given/When/Then au lieu de AS
   - Mapper T001/[P]/[US1] vers le format PRD
   - Lire constitution.md (Markdown) au lieu de constitution.yml (YAML)

2. **speckit-recette** :
   - Lire Acceptance Scenarios en format BDD
   - Garder la même logique de checklist

3. **speckit-test-bridge** :
   - Convertir Given/When/Then → Playwright specs (plus naturel que AS)
   - Changer le grep de traçabilité

4. **verify-test-traceability.sh** :
   - Adapter le pattern de recherche

5. **workflow-gate.sh** :
   - Vérifier `.specify/` au lieu de `.speckit/`

### Ce qui fonctionne tel quel

- `speckit-quality` (jscpd/knip) — indépendant du format de specs
- `speckit-archi-review` — lit le code, pas les specs
- `speckit-threat-model` — STRIDE analysis, indépendant
- `speckit-audit-sdlc` — audit structurel, indépendant
- `speckit-e2e` — agent-browser, indépendant

## Décision : speckit-quality vs speckit.checklist

**Verdict : garder les deux** — objectifs différents.
- `speckit.checklist` = validation qualité des SPECS (requirements bien écrits ?)
- `speckit-quality` = validation qualité du CODE (duplication, dead code, complexité)
→ Packager quality comme extension `pf-quality`.
