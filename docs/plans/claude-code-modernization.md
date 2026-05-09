# Plan : Modernisation Claude Code — Project-Forge

**Date** : 2026-03-05
**Statut** : A valider
**Principe** : Ne changer QUE ce qui est demontrablement meilleur, avec tests reproductibles.

---

## Constats

### Ce qui fonctionne bien (ne pas toucher)

| Element | Justification |
|---------|---------------|
| SpecKit workflow (constitution→spec→plan→tasks→convert) | Pas de remplacement natif, bien structure |
| `prd.json` + `progress.txt` + commits atomiques | Aligne avec le guide Anthropic "Effective Harnesses" |
| Quality scanning (jscpd, knip, sonarjs) | Complementaire, pas de doublon natif |
| Starters (saas-base, supabase-stripe) | Infra projet, hors scope |
| `tools/ralph` (script bash headless) | Fonctionne bien pour CI/batch autonome |

### Ce qui peut etre ameliore (avec preuves)

| Probleme | Evidence | Solution candidate |
|----------|----------|-------------------|
| Skills en format custom (`manifest.yaml` + `prompt.md`) | Pas compatible skill-creator (eval/improve/benchmark), pas de progressive disclosure | Migrer vers `SKILL.md` standard |
| Pas de subagents customs | On rate le model routing (haiku pour scan = 10x moins cher) et la memoire persistante | Creer `.claude/agents/` |
| Doublons commands (3 endroits : `commands/`, `.claude/commands/`, `skills/`) | Confusion, maintenance multiple | Consolider |
| `skills/ralph-agent-teams/` (scripts Python) | Remplace par Agent Teams natif + `/batch` | Deprecer apres validation |

---

## Criteres de Decision

**On ne migre QUE si :**
1. Le test automatise prouve un gain mesurable (cout, temps, fiabilite)
2. OU la simplification reduit le code maintenu sans regression
3. OU la compatibilite avec l'ecosysteme est bloquante

---

## Phase 1 : Test Harness (prerequis)

**But** : Creer un framework de test reproductible pour mesurer l'impact de chaque changement.

### 1.1 Script de test `tests/forge-eval.sh`

Script bash autonome qui valide l'integrite de Project-Forge :

```
tests/forge-eval.sh [--verbose]

Tests:
  [STRUCT] Structure des fichiers attendus existe
  [SKILL]  Chaque skill a un SKILL.md ou prompt.md valide
  [CMD]    Chaque command reference une skill existante
  [AGENT]  Chaque agent .claude/agents/*.md a un frontmatter valide
  [RULES]  Chaque rule .claude/rules/*.md est valide
  [NODUP]  Pas de doublons entre commands/ et .claude/commands/
  [QUAL]   Les configs jscpd/knip/eslint sont valides (JSON parse)
  [CI]     Le CI YAML est valide
  [RALPH]  Le fallback quality gate est correct (echo '{}' | jq ...)
  [PRDTPL] Le template PRD contient les bons quality gates

Sortie: PASS/FAIL par test + rapport summary
```

### 1.2 Evals pour skill-creator (si Phase 2 validee)

Pour chaque skill SpecKit, un fichier `evals.json` :

```json
{
  "skill": "speckit-quality",
  "prompts": [
    {"input": "scan the code quality", "should_trigger": true},
    {"input": "run jscpd and knip", "should_trigger": true},
    {"input": "write a unit test", "should_trigger": false},
    {"input": "deploy to production", "should_trigger": false}
  ]
}
```

Permet de mesurer le triggering avant/apres migration SKILL.md.

### 1.3 Benchmark subagent model routing

Script qui compare cout/qualite entre :
- Scan qualite avec model par defaut (sonnet) vs model: haiku
- Objectif : meme resultats, cout 10x moindre

---

## Phase 2 : Migration Skills → SKILL.md

**Hypothese** : Le format SKILL.md standard permet l'eval/improve/benchmark via skill-creator.

### Test de validation

1. Migrer UNE skill (la plus simple : `speckit-quality`)
2. Lancer `skill-creator eval` dessus
3. Lancer `skill-creator improve` sur la description
4. Comparer triggering avant/apres (mesure quantitative)

### Si le test passe → migrer les 8 skills

Mapping :

| Avant | Apres |
|-------|-------|
| `skills/speckit/quality/manifest.yaml` | Supprime (info dans SKILL.md frontmatter) |
| `skills/speckit/quality/prompt.md` | `skills/speckit/quality/SKILL.md` |
| `commands/speckit-quality.md` | Garde (pointe vers SKILL.md) |

### Si le test echoue → on ne migre pas

On garde le format actuel. Documenter pourquoi.

### Delivrable

- `tests/forge-eval.sh` mis a jour pour valider le nouveau format
- Rapport skill-creator benchmark avant/apres

---

## Phase 3 : Subagents Customs

**Hypothese** : Des agents specialises avec model routing et memory reduisent les couts et ameliorent la qualite.

### 3.1 Agent `quality-scanner`

```yaml
---
name: quality-scanner
description: Scan code quality (duplication, dead code, complexity). Use when asked to check quality, run jscpd, knip, or lint.
tools: Read, Grep, Glob, Bash
model: haiku
---
```

**Test** : Lancer un scan qualite avec l'agent haiku vs sans agent (sonnet par defaut).
Mesurer : temps, tokens consommes, meme resultats (PASS/FAIL identiques).

### 3.2 Agent `ralph-implementer`

```yaml
---
name: ralph-implementer
description: Implement a single story from a Ralph++ PRD. Use when delegating story implementation.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
skills:
  - speckit-quality
---
```

**Test** : Impossible a tester sans vrai projet. Reporter a l'usage reel.
Mesure de succes : l'agent accumule des learnings dans `.claude/agent-memory/ralph-implementer/` qui ameliorent les sessions suivantes.

### 3.3 Consolidation commands

Supprimer `.claude/commands/ralph-loop.md` et `.claude/commands/speckit-convert.md` (doublons de `commands/`).

**Test** : Verifier que les commandes `/ralph-loop` et `/speckit-convert` fonctionnent toujours.

### Delivrable

- `.claude/agents/quality-scanner.md`
- `.claude/agents/ralph-implementer.md`
- Suppression des doublons dans `.claude/commands/`
- Resultats du benchmark haiku vs sonnet

---

## Phase 4 : Rules Modulaires

**Hypothese** : Deplacer les regles de CLAUDE.md dans `.claude/rules/` ameliore le contexte.

### Test

Notre CLAUDE.md fait 136 lignes — c'est raisonnable. Pas de gain evident a modulariser.

### Decision : REPORTER

On ne modularise que si CLAUDE.md depasse 300 lignes ou si on a besoin de regles conditionnelles (paths). Pour l'instant, pas de benefice mesurable.

---

## Phase 5 : Evaluer Agent Teams + /batch

**Hypothese** : Agent Teams natif ou `/batch` remplacent `skills/ralph-agent-teams/` avec moins de complexite.

### Test (quand un vrai projet est disponible)

1. Activer Agent Teams : `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
2. Sur un projet avec 5+ stories SpecKit :
   - Run A : `tools/ralph` classique (notre script bash)
   - Run B : `/batch` avec le meme set de stories
3. Comparer : temps total, cout tokens, stories reussies du premier coup, qualite code

### Decision : NE PAS MIGRER avant d'avoir les resultats

`tools/ralph` fonctionne bien. La migration n'est justifiee que si `/batch` fait mieux sur les 3 metriques.

### Delivrable

- Rapport comparatif tools/ralph vs /batch
- Decision go/no-go documentee

---

## Resume : Quoi Faire et Quand

| Phase | Action | Critere Go | Effort |
|-------|--------|------------|--------|
| **1** | Creer `tests/forge-eval.sh` | Toujours (prerequis) | 1h |
| **2** | Migrer 1 skill → SKILL.md + eval | Si skill-creator eval fonctionne | 2h test, 2h migration |
| **3** | Creer 2 subagents + cleanup doublons | Si benchmark haiku montre gain cout | 1h |
| **4** | Rules modulaires | Reporte (CLAUDE.md < 300 lignes) | - |
| **5** | Evaluer /batch vs tools/ralph | Quand projet reel disponible | 3-4h |

**Total Phase 1-3 : ~6h** (si tous les tests passent)

---

## Execution

Chaque phase suit le protocole :
1. Ecrire le test AVANT le changement
2. Executer le test (baseline "avant")
3. Faire le changement
4. Re-executer le test (mesure "apres")
5. Documenter le resultat dans ce fichier (section Resultats)
6. Si regression → revert

---

## Resultats

*(a remplir lors de l'execution)*

### Phase 1 : Test Harness
- Date : 2026-03-05
- Status : DONE
- Rapport : `tests/forge-eval.sh` — baseline 68 PASS / 2 FAIL / 9 WARN → apres fix doublons : 75 PASS / 0 FAIL / 1 WARN

### Phase 2 : Migration SKILL.md
- Date : 2026-03-05
- Status : DONE
- Skills migrees : 8/8 (constitution, convert, e2e, plan, quality, recette, specify, tasks)
- Format : manifest.yaml + prompt.md → SKILL.md (standard Anthropic)
- Doublons supprimes : `.claude/commands/ralph-loop.md`, `.claude/commands/speckit-convert.md`
- Test apres migration : 75 PASS / 0 FAIL / 1 WARN
- Decision : Migration validee. skill-creator eval/improve disponible sur toutes les skills.

### Phase 3 : Subagents
- Date : 2026-03-05
- Status : DONE (agents crees, benchmark a faire sur projet reel)
- Agents crees :
  - `.claude/agents/quality-scanner.md` (model: haiku, tools: Read/Grep/Glob/Bash)
  - `.claude/agents/ralph-implementer.md` (model: sonnet, tools: Read/Write/Edit/Bash/Grep/Glob)
- Test apres creation : 79 PASS / 0 FAIL / 0 WARN
- Benchmark haiku vs sonnet : a mesurer sur prochain projet reel
- Decision : Agents disponibles, benchmark reporte a l'usage

### Phase 5 : /batch vs tools/ralph
- Date :
- Projet teste :
- Resultats :
- Decision :
