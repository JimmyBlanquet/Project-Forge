# Plan de migration : SpecKit Project-Forge → GitHub spec-kit wrapper

**Date** : 2026-03-23
**Statut** : Planifié
**Auteur** : jimb + Claude
**Objectif** : Utiliser GitHub spec-kit (v0.3.2) comme fondation et garder les extensions Project-Forge par-dessus.

---

## Contexte

GitHub a lancé `spec-kit` (28K+ stars), un toolkit open-source de Spec-Driven Development qui couvre les mêmes besoins que notre SpecKit interne. Plutôt que de maintenir un fork parallèle, on adopte spec-kit comme fondation et on package nos skills uniques comme extensions.

### Décision architecturale

```
┌─────────────────────────────────────────────────┐
│  Couche 3 : Extensions Project-Forge            │
│  convert, recette, e2e, archi-review,           │
│  threat-model, audit-sdlc, test-bridge          │
│  → Packagées comme extensions spec-kit          │
├─────────────────────────────────────────────────┤
│  Couche 2 : Ralph++ (implémentation)            │
│  ralph-loop, ralph-agent-teams, effort-optimizer │
│  → Remplace /speckit.implement                  │
├─────────────────────────────────────────────────┤
│  Couche 1 : GitHub spec-kit v0.3.2 (fondation)  │
│  constitution, specify, clarify, plan,          │
│  tasks, analyze, checklist, taskstoissues        │
│  → Via `specify init --ai claude`               │
└─────────────────────────────────────────────────┘
```

---

## Phase 1 : Préparation et validation (pré-requis)

### 1.1 — Installer et tester spec-kit en standalone
- [ ] Installer `specify` CLI : `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.3.2`
- [ ] Créer un projet test dans /tmp : `specify init test-project --ai claude`
- [ ] Vérifier la structure générée (`.specify/`, `.claude/commands/`, `specs/`, `memory/`)
- [ ] Tester le workflow complet : `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`
- [ ] Vérifier `specify doctor` et `specify status`
- [ ] Documenter les différences de format constatées vs notre SpecKit

**Critère de validation** : le workflow spec-kit fonctionne de bout en bout dans un projet Claude Code.

### 1.2 — Analyse de compatibilité
- [ ] Comparer le format de `spec.md` (spec-kit) vs notre format actuel
- [ ] Comparer `constitution.md` (Markdown) vs notre `constitution.yml` (YAML)
- [ ] Identifier les champs/sections que nos skills downstream (convert, recette) attendent
- [ ] Lister les adaptations nécessaires dans nos extensions pour consommer le format spec-kit
- [ ] Vérifier que le format `tasks.md` de spec-kit est compatible avec `speckit-convert` (PRD)

**Critère de validation** : matrice de compatibilité documentée, gaps identifiés.

---

## Phase 2 : Adapter le bootstrap (DONE — 2026-03-24)

### 2.1 — Intégrer `specify init` dans `tools/bootstrap`
- [x] Ajouter `specify` comme dépendance (vérifier la présence, proposer l'install si absent)
- [x] Après la copie du starter, exécuter `specify init . --ai claude --force` dans le projet créé
- [x] Gérer la coexistence : `.specify/` (spec-kit) + `.speckit/` (legacy) supportés
- [x] Migrer les références à `.speckit/` dans workflow-gate.sh et verify-test-traceability.sh
- [x] Conserver `specs/` comme répertoire de specs (déjà utilisé par les deux systèmes)
- [x] Option `--no-speckit` pour bypass si nécessaire
- [x] Fix bug pré-existant: variable `DIM` manquante dans les couleurs

### 2.2 — Adapter le CLAUDE.md template
- [x] Remplacer les commandes `/speckit-*` par `/speckit.*` (notation dot de spec-kit) pour le core
- [x] Ajouter les commandes spec-kit nouvelles (`/speckit.checklist`, `/speckit.clarify`)
- [x] Documenter les extensions PF (convert, recette, e2e, test-bridge, archi-review, threat-model, audit-sdlc)
- [x] Mettre à jour le workflow principal (séparation core vs extensions)

### 2.3 — Adapter les settings et hooks
- [x] Mettre à jour `workflow-gate.sh` (x2 starters) : vérifier `.specify/` en priorité, `.speckit/` en fallback
- [x] Mettre à jour `verify-test-traceability.sh` (x2 starters) : auto-detect `.specify/` > `.speckit/` > `specs/`
- [x] Support format spec-kit (SC-\d+, FR-\d+) en plus du legacy (AS\d+\.\d+) dans traceability
- [x] Hooks spec-kit (scripts .specify/scripts/) ne conflictent pas avec hooks Claude Code (.claude/hooks/)

**Critère de validation** : `./tools/bootstrap test-project --starter saas-base` et `--starter supabase-stripe` produisent un projet fonctionnel avec spec-kit + extensions PF. Vérifié le 2026-03-24.

---

## Phase 3 : Retirer les skills core remplacées (DONE — 2026-03-24)

### 3.1 — Skills retirées (remplacées par spec-kit)
- [x] `skills/speckit/constitution/` → remplacé par `/speckit.constitution`
- [x] `skills/speckit/specify/` → remplacé par `/speckit.specify`
- [x] `skills/speckit/clarify/` → remplacé par `/speckit.clarify`
- [x] `skills/speckit/plan/` → remplacé par `/speckit.plan`
- [x] `skills/speckit/tasks/` → remplacé par `/speckit.tasks`
- [x] `skills/speckit/analyze/` → remplacé par `/speckit.analyze`

### 3.2 — Skills évaluées (overlap partiel)
- [x] `skills/speckit/quality/SKILL.md` — **GARDÉE** : quality = code (jscpd/knip), checklist = specs (requirements)
- [x] `skills/speckit/feature/SKILL.md` — **GARDÉE + ADAPTÉE** : orchestrateur mis à jour pour appeler spec-kit commands + .specify/ paths

### 3.3 — Commands stubs retirés/conservés
- [x] Retirés : `speckit-{constitution,specify,clarify,plan,tasks,analyze}.md` (6 stubs)
- [x] spec-kit génère ses propres commands via `specify init` dans `.claude/commands/speckit.*.md`
- [x] Gardés : 10 stubs PF (convert, feature, quality, e2e, test-bridge, archi-review, threat-model, audit-sdlc, dev-pilot, ralph-loop)

### 3.4 — Mise à jour de la documentation
- [x] CLAUDE.md du framework : workflow mis à jour (core spec-kit + extensions PF), .specify/ paths
- [x] README.md et systems/speckit/README.md : **différé** (docs historiques, pas bloquant)
- [x] forge-eval.sh : adapté automatiquement (scan dynamique des skills restantes, 96/96 PASS)

**Critère de validation** : forge-eval 96/96 PASS, bootstrap fonctionnel avec spec-kit commands + PF extensions.

---

## Phase 4 : Packager les extensions Project-Forge (DONE — 2026-03-24)

### 4.1 — Extension `pf-convert` (Ralph++ bridge)
- [x] `extensions/pf-convert/extension.yml` — manifest spec-kit format
- [x] Commande : `/speckit.pf.convert` — convertit tasks.md en prd.json
- [x] Hook : `after_tasks` → propose la conversion (inline dans extension.yml)
- [x] `specify extension add extensions/pf-convert --dev` → OK

### 4.2 — Extension `pf-testing`
- [x] 3 commandes : `/speckit.pf.recette`, `/speckit.pf.e2e`, `/speckit.pf.test-bridge`
- [x] Hook : `after_plan` → propose test-bridge
- [x] Installation OK

### 4.3 — Extension `pf-security`
- [x] 2 commandes : `/speckit.pf.threat-model`, `/speckit.pf.archi-review`
- [x] Installation OK

### 4.4 — Extension `pf-audit`
- [x] Commande : `/speckit.pf.audit-sdlc`
- [x] Standalone, pas de hook
- [x] Installation OK

### 4.5 — Extension `pf-implement`
- [x] Commande : `/speckit.pf.implement` — lance Ralph++ depuis prd.json
- [x] Hook : `after_tasks` → propose convert + implement
- [x] Installation OK

**Apprentissage format** : dans extension.yml, `requires`, `provides`, `tags` sont au **top level** (pas sous `extension:`).

**Critère de validation** : les 5 extensions s'installent via `specify extension add --dev`, génèrent 8 commandes `speckit.pf.*` dans `.claude/commands/`, cohabitent avec les commandes spec-kit core. Vérifié le 2026-03-24.

---

## Phase 5 : Intégration dans le bootstrap et tests (DONE — 2026-03-24)

### 5.1 — Bootstrap avec extensions
- [x] `install_pf_extensions()` ajoutée dans bootstrap : installe les 5 extensions via `specify extension add --dev`
- [x] Ordre : `specify init` → `install_pf_extensions` → `install_commands` (PF stubs par-dessus)
- [x] Bootstrap testé : 5 extensions + 27 commandes dans le projet résultant

### 5.2 — Tests du framework
- [x] `tests/forge-eval.sh` : ajout test_extensions (vérifie les 5 extensions, YAML valide, champs requis, commandes)
- [x] 127/127 PASS (vs 96 avant Phase 5)
- [x] Bootstrap complet testé (starter → spec-kit → extensions → PF commands)
- [ ] Test workflow complet et hooks : différé (nécessite un vrai projet avec feature)

### 5.3 — Script de migration
- [x] `tools/migrate-to-speckit` créé : specify init → migrate .speckit/ → install extensions → cleanup → reinstall PF commands
- [x] Gère constitution.yml → constitution.md conversion
- [ ] Test sur projet enfant : différé (prochaine session, sur un child project)

### 5.4 — Documentation finale
- [ ] ADR : différé (sera fait quand la migration est rodée sur un projet enfant)
- [ ] README.md update : différé
- [x] CLAUDE.md du framework : déjà mis à jour en Phase 3

**Critère de validation** : forge-eval 127/127 PASS, bootstrap produit un projet avec spec-kit + 5 extensions PF + 27 commandes. Migration script prêt à tester.

---

## Résumé des livrables par phase

| Phase | Livrable | Effort estimé |
|-------|----------|---------------|
| **1. Préparation** | Matrice de compatibilité, spec-kit validé | 1h |
| **2. Bootstrap** | `tools/bootstrap` adapté, hooks migrés | 1h30 |
| **3. Nettoyage** | 6 skills retirées, docs mises à jour | 45min |
| **4. Extensions** | 5 extensions PF packagées (convert, testing, security, audit, implement) | 3h |
| **5. Intégration** | Tests, migration, documentation | 1h30 |
| **Total** | | **~8h** |

---

## Risques identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Format spec.md incompatible avec convert | Bloquant | Phase 1.2 — analyser avant de migrer |
| spec-kit breaking change en v0.4 | Moyen | Fixer la version dans bootstrap, tester avant upgrade |
| Extensions PF non maintenues vs spec-kit core | Moyen | Documenter les dépendances, CI sur les extensions |
| Projets enfants cassés par la migration | Élevé | Script de migration + test sur un child project pilote d'abord |
| Perte de fonctionnalités du mode `--conversational` | Faible | spec-kit clarify couvre le besoin autrement |

---

## Décisions à prendre avant de commencer

1. **Adopter `.specify/` ou garder `.speckit/` ?** → Recommandation : adopter `.specify/` pour la compatibilité
2. **Quand migrer les projets enfants ?** → Recommandation : après Phase 5 validée sur un projet test
3. **Publier les extensions sur le catalog communautaire ?** → Décision différée (contribution future)
4. **Garder `speckit-quality` ou adopter `speckit.checklist` ?** → À évaluer en Phase 3.2
