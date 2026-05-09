# Project-Forge — CONTEXT.md (vocabulaire métier)

> **Pourquoi ce fichier ?** CLAUDE.md décrit *comment Claude doit se comporter* dans ce repo. CONTEXT.md décrit *le vocabulaire spécifique* du domaine, partagé entre humains et IA. Pattern emprunté à mattpocock — séparation du comportement et de l'ubiquitous language.
>
> Si un terme apparaît dans une conversation et qu'un nouvel arrivant pourrait le mal interpréter, sa définition doit être ici.

---

## Project-Forge (PF) — la chose elle-même

**Project-Forge** ≠ "un framework". C'est une **usine à projets SaaS** : un harness qui transforme une idée en projet production-ready en quelques heures via templates + skills + automation.

PF a deux couches conceptuelles distinctes (à ne JAMAIS confondre) :
- **Couche méta (SDLC harness)** : stack-agnostique. Skills, hooks, ADR, Quality Gate, spec-kit. Toujours déployée.
- **Couche boilerplate (starter)** : stack-spécifique. Next.js + Drizzle + Supabase + Stripe + Tailwind. Un seul starter cible (`saas`).

Voir `docs/adr/008-starter-consolidation.md` pour le contexte.

## Termes courants

| Terme | Définition précise (dans le contexte PF) |
|---|---|
| **Bootstrap** | L'action de créer un nouveau projet via `tools/bootstrap`. Le verbe est intransitif : "bootstrap un projet", pas "bootstrap-er". |
| **Starter** | Template stack-spécifique copié par bootstrap. Actuellement 1 cible : `saas` (Next.js 15 / Drizzle / Supabase Auth / Stripe / Tailwind 4). Les anciens `saas-base` (Prisma) et `supabase-stripe` (legacy) sont en cours d'archivage (#75). |
| **Child project** | Un projet créé via bootstrap depuis PF. PF est le parent / harness. |
| **Skill (PF)** | Markdown `SKILL.md` avec frontmatter `effort` (low/medium/high) qui définit une compétence Claude invocable. Vit dans `skills/` ou `extensions/`. À ne PAS confondre avec un *spec-kit command* ou une *Ralph++ story*. |
| **Extension Project-Forge** | Une extension du système spec-kit, livrée par PF (`extensions/pf-convert`, `pf-testing`, `pf-security`, `pf-audit`, `pf-implement`). Provides des slash-commands `/speckit.pf-*`. |
| **spec-kit** | Le système GitHub spec-kit (≥ v0.3.2). Fournit `/speckit.constitution`, `/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.checklist`. PF s'appuie dessus, ne le remplace pas. |
| **Ralph++** | Boucle d'implémentation autonome. `tools/ralph` exécute `claude -p` headless en mode batch parallèle sur les sub-stories d'un PRD. Budget par défaut $2/story, modèle sonnet. `--auto-merge` = pipeline 100% hands-free (auto-merge PR quand CI verte). |
| **Sub-story (Ralph++)** | Unité atomique de Ralph++ : 3-5 tasks groupées, 1-2h de boulot, testable indépendamment. Convertie depuis `tasks.md` (spec-kit) via `/speckit.pf-convert`. À structurer en **vertical slice** (cf. CLAUDE.md règle 15). |
| **Forge-eval** | `tests/forge-eval.sh` — test harness PF qui valide la structure (skills, extensions, hooks, settings, etc.). Référence Quality Gate Niveau 1. Doit toujours être 100% PASS avant de dire "c'est fait". |
| **Quality Gate** | 3 niveaux obligatoires avant complétion (CLAUDE.md règle absolue) : N1 vérification statique, N2 fonctionnelle, N3 preuve de complétion. Non négociable. |
| **ADR** | Architecture Decision Record. **Stricte** : pas créer sauf si les 3 critères de `docs/adr/README.md` sont vrais (hard-to-reverse + surprising + real-trade-off). |
| **Hook** | Script bash exécuté par Claude Code à un événement (Stop, PostToolUse, SessionEnd, PreCompact). Configurés dans `.claude/settings.json`. PF utilise actuellement `check-ticket-update.sh` et `test-verification-reminder.sh` sur Stop. |
| **Bus journal** | Optionnel : si ce projet est intégré à un bus inter-agents (ex: file-based message bus), journal append-only des interactions à `<repo>/.claude/bus-journal.md`. Lu en début de session pour récupérer le contexte des décisions inter-projets. |
| **Tracer bullet** | Pattern de décomposition : chaque sub-story traverse toute la stack (test E2E + impl minimale + doc), pas une couche horizontale. Voir CLAUDE.md règle 15. |
| **Feedback loop first** | Pattern de debugging : construire un signal pass/fail rapide AVANT de chercher la cause. CLAUDE.md règle 13. |

## Out-of-scope PF (pour mémoire)

PF **ne fait pas** :
- Code des child projects existants (chaque child project bosse son propre code dans son repo)
- Déploiement production (responsabilité du child project ou de l'infra)
- Gestion infra serveur, gestion GPU/LLM serving (responsabilité de votre infra dédiée)

Quand un sujet tombe dans ces catégories, PF route vers le projet/équipe concerné·e ou attend une session dédiée dans le projet cible.

## Termes à NE PAS utiliser (sources de confusion)

- ❌ "Le PF" tout court sans contexte → préciser "Project-Forge le harness" vs "le starter PF"
- ❌ "Skill" sans préciser → préciser "skill PF" / "spec-kit command" / "subagent Claude" / "skill mattpocock" selon le contexte
- ❌ "Ticket" sans préciser → préciser "ticket interne (TaskCreate)" vs "GH issue #N" — **les numéros sont indépendants**
- ❌ "Le projet" en session multi-agent → préciser le child project visé par son nom, ou "PF lui-même"

## Comment maintenir ce fichier

- À chaque fois qu'un terme nouveau émerge en conversation et qu'il a une définition spécifique au contexte PF → l'ajouter ici avec sa définition précise.
- À chaque fois qu'un terme du tableau évolue (ex: starter consolidé) → le mettre à jour.
- Pas de définitions génériques (ne pas définir "Next.js" — ça vient de la doc Next.js). Ce fichier capture ce qui est **spécifique à PF**.
