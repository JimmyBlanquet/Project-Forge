# Skills Matrix — quand utiliser quel skill

> Matrice de référence "phase de travail → skill recommandé" pour Project-Forge et projets dérivés. Réduit la confusion *"j'ai 40 skills, lequel utiliser ?"*.

## Comment lire cette matrice

- **Phase** = moment du cycle de vie d'un projet
- **Skill** = nom canonique installé (peut être préfixé par plugin: `superpowers:X`, `document-skills:X`)
- **Fonction** = ce que fait ce skill
- **Quand préférer** = critère de choix vs alternatives

## Phase 1 — Discovery / Idéation

| Skill | Fonction | Quand préférer |
|---|---|---|
| `superpowers:brainstorming` | Méthodologie complète : explore contexte, questions guidées, propose 2-3 approches, écrit design doc | **Sujet structurel**, design détaillé attendu, ADR ou plan à produire |
| `grill-me` | Interview relentless, 1 question/fois, walk decision tree | **Sujet léger**, challenger une idée existante, gain rapide |
| `grill-with-docs` (Pocock — *non installé par défaut*) | grill-me + update CONTEXT.md/ADR inline | Symlinker depuis `mattpocock-skills` si on veut tester — sujet domaine où le vocabulaire compte (ubiquitous language) |
| `auto-research` | Recherche structurée multi-sources, transpose au projet, propose POC/intégré/prod | **Évaluer une nouvelle techno/framework/pattern** avant intégration |
| `market-research` | Analyse marché, concurrence, sources, décision-oriented | Sujet business : positionnement, choix outil, comparatif |
| `customer-research` | Comprendre les utilisateurs, segments, jobs-to-be-done | Avant de specifier une feature user-facing |
| `superpowers:dispatching-parallel-agents` | Lance 2+ agents indépendants en parallèle | Plusieurs sujets de research/exploration sans dépendance |
| `find-skills` | Cherche d'autres skills installables dans l'écosystème | *"Y a-t-il un skill pour X ?"* |

## Phase 2 — Planning / Spec

| Skill | Fonction | Quand préférer |
|---|---|---|
| `speckit.constitution` | Définir les principes du projet | Démarrage de projet |
| `speckit.specify` | Définir QUOI construire (user stories, acceptance) | Nouvelle feature significative |
| `speckit.clarify` | Clarifier les ambiguïtés d'une spec | Spec floue à figer |
| `speckit.plan` | Définir COMMENT (architecture, data model) | Après specify |
| `speckit.tasks` | Générer les tâches d'implémentation | Après plan |
| `speckit.checklist` | Valider la qualité des specs | Avant clôture spec |
| `speckit-convert` | Convertir tasks.md → prd.json (Ralph++ bridge) | Pour autonomiser via Ralph++ |
| `superpowers:writing-plans` | Plan d'implémentation détaillé multi-étapes | Plan code > 30 lignes / multi-fichiers |
| `superpowers:executing-plans` | Exécution structurée d'un plan existant avec checkpoints | Quand un plan validé existe et qu'on veut l'exécuter discipliné |

## Phase 3 — Implementation / Dev

| Skill | Fonction | Quand préférer |
|---|---|---|
| `superpowers:subagent-driven-development` | Tâches indépendantes en parallèle dans la même session | 2+ tâches sans état partagé |
| `ralph-loop` (PF) | Implémentation autonome depuis prd.json avec quality gates | Travail bulk autonome, attention différée |
| `nextjs-react-typescript` | Patterns Next.js / React / TS | Auto-activé sur sessions Next.js |
| `tailwind-css` | Patterns Tailwind | Auto-activé sur sessions CSS |
| `vercel-react-best-practices` | Performance Vercel/React | Optimisation perf React/Next |
| `simplify` (plugin code-simplifier) | Simplification code modifié | Après écriture, avant commit |

## Phase 4 — Testing / Quality

| Skill | Fonction | Quand préférer |
|---|---|---|
| `superpowers:test-driven-development` | Méthodologie TDD complète | TDD discipline pour nouvelle feature ou bugfix |
| `tdd` (Pocock — *non installé par défaut*) | TDD vertical slices, tracer bullets, anti-horizontal | Alternative à comparer — symlinker depuis `mattpocock-skills` si on veut tester |
| `superpowers:systematic-debugging` | Debug systématique | Bug peu compris |
| `diagnose` (Pocock — *non installé par défaut*) | 6-phase debug discipline. **Phase 1 = build feedback loop = 90%** | Alternative à comparer — symlinker depuis `mattpocock-skills` |
| `webapp-testing` | Playwright local web app testing | Tests E2E web local |

## Phase 5 — Review / Audit

| Skill | Fonction | Quand préférer |
|---|---|---|
| `superpowers:requesting-code-review` | Code review structuré sur ce qu'on vient de produire | Avant commit important / merge |
| `superpowers:receiving-code-review` | Recevoir feedback avec rigueur, pas de complaisance | Quand on reçoit une review |
| `pr-review-toolkit:review-pr` | Review complète PR multi-agents | Review PR significative |
| `improve-codebase-architecture` (Pocock) | Identifier deep modules, deletion test, deepening opportunities | Refactor architectural — rôle Architecte |
| `speckit-archi-review` (PF) | Revue d'architecture Project-Forge | Audit archi cohérence |
| `speckit-threat-model` (PF) | Analyse sécurité STRIDE | Avant déploiement sensible |
| `speckit-audit-sdlc` (PF) | Audit maturité SDLC | Audit projet existant |
| `claude-md-management:claude-md-improver` | Audit CLAUDE.md, qualité project memory | Maintenance CLAUDE.md |

## Phase 6 — Ops / Deploy / Infra

| Skill | Fonction | Quand préférer |
|---|---|---|
| `infra-change` | Protocol changement infra (snapshot, verify before, rollback ready, staged) | TOUT changement infra (SSH, firewall, Docker, DNS, disques, ports) |
| `deploy-check` | Pre-deployment checklist | Avant push/merge staging/prod |
| `git-guardrails-claude-code` (Pocock) | Hook PreToolUse bloque git push/reset --hard/clean -f/branch -D | Setup défensif sur tout repo |
| `update-config` | Modifier `~/.claude/settings.json` (hooks, permissions, env) | Toute config harness Claude Code |

## Phase 7 — Documentation / Communication

| Skill | Fonction | Quand préférer |
|---|---|---|
| `document-skills:doc-coauthoring` | Co-authoring structuré documentation | Spec/proposal/decision doc |
| `document-skills:internal-comms` | Status reports, updates, FAQs internal | Communication interne formelle |
| `claude-md-management:revise-claude-md` | Mettre à jour CLAUDE.md depuis la session | Fin session, learnings à capturer |
| `caveman` (Pocock) | Mode terse, -75% tokens | Sessions Opus longues, budget tokens serré |
| `zoom-out` (Pocock) | Sortir du détail, vue d'ensemble modules+callers | Codebase non familière, perdu dans le détail |

## Phase 8 — Marketing / Launch

| Skill | Fonction | Quand préférer |
|---|---|---|
| `copywriting` | Copy SaaS/devtool (AIDA, PAS) | Hero / value prop / CTA |
| `page-cro` | Landing page conversion | Optimiser une landing |
| `competitor-alternatives` | Section "vs alternatives" | Comparatif concurrence dans README/article |
| `customer-research` | Personas, segments | Section "Who is this for?" |
| `launch-strategy` | Stratégie de lancement | Préparer un launch HN/PH/Reddit |
| `marketing-psychology` | Persuasion, biais | Polish messages marketing |
| `product-marketing-context` | Foundation context (lu par les autres skills marketing) | À mettre à jour avant tout autre skill marketing |
<!-- Skills retirés du symlinks 2026-04-22 (jamais utilisés sur 60j) :
     pitch-deck-visuals, frontend-slides — sources préservées dans
     ~/.agents/skills/, réinstallables via `ln -s` si besoin futur. -->



## Phase 9 — Assets visuels

| Skill | Fonction | Quand préférer |
|---|---|---|
| `mermaid` | Génération diagrammes Mermaid (23 types) | Diagrammes architecture/flow/séquence |
| `web-asset-generator` | OG images, favicons, app icons | Préparer publication, social previews |
| `document-skills:canvas-design` | PNG/PDF artistic design | Posters, OG complexes |
| `document-skills:frontend-design` | Composants/pages web design | UI custom polished |
| `document-skills:theme-factory` | 10 thèmes pré-réglés | Tester rapidement directions visuelles |
| `document-skills:slack-gif-creator` | GIFs animés Slack | Micro-animations explicatives |
<!-- data-visualizer retiré 2026-04-22 (0 invocations 60j), réinstallable depuis ~/.agents/skills/ -->


## Phase 10 — Project Management / Tickets

| Skill | Fonction | Quand préférer |
|---|---|---|
| `batch-tickets` | Orchestration parallèle de tickets multiples | Backlog 3+ tickets indépendants à traiter |
| `triage` (Pocock — *non installé par défaut*) | State machine tickets GitHub/Linear | Si tu utilises GitHub Issues activement — symlinker depuis `mattpocock-skills` |
| `to-prd` (Pocock — *non installé, conflit avec speckit*) | Conversation → PRD → publish ticket | Préférer `/speckit.specify` + `/speckit-convert` (pipeline complet) |
| `to-issues` (Pocock — *non installé, conflit avec speckit*) | Plan → vertical slices → issues | Préférer `/speckit.tasks` |

## Phase 11 — Cross-cutting / Méta

| Skill | Fonction | Quand préférer |
|---|---|---|
| `agent-hub-peer` | Communiquer avec un autre projet via le bus | Demander un service à un projet voisin |
| `agent-hub-status` | État du bus, peers, conversations | "Quoi de neuf sur le bus ?" |
| `agent-hub-orchestrator` | Orchestration formelle multi-peers | Workflow inter-projets complexe |
| `agent-hub-refresh` | Refresh état du bus | Reset visualisation |
| `auto-research` | Recherche structurée approfondie (cf Phase 1) | — |
| `superpowers:using-git-worktrees` | Worktrees pour features parallèles | Travail isolé sans pollution workspace |
| `superpowers:finishing-a-development-branch` | Décide merge/PR/cleanup en fin de feature | Fin de branche feature |
| `superpowers:verification-before-completion` | Force vérif avant claim "c'est fait" | TOUJOURS avant de dire "complété" |
| `using-superpowers` | Méta-discipline d'invocation des skills | Auto au démarrage session |

## Phase 12 — Skill development

| Skill | Fonction | Quand préférer |
|---|---|---|
| `skill-creator` (plugin) | Créer/améliorer/évaluer un skill | Quand tu inventes un nouveau skill |
| `superpowers:writing-skills` | Écrire un skill nouveau | Idem `skill-creator`, comparer |
| `write-a-skill` (Pocock — *non installé*) | Pattern Pocock pour écrire un nouveau skill | Variante Pocock-style — symlinker depuis `mattpocock-skills` si désiré |

---

## Skills auto-activés par description (pas via tool Skill)

Ces skills s'activent seuls quand le contexte le demande. Pas besoin d'invocation explicite :

- `nextjs-react-typescript`, `tailwind-css`, `vercel-react-best-practices` (sessions TS/CSS/Next)
- `document-skills:pdf` / `xlsx` / `docx` / `pptx` (manipulation documents)
- `mcp-builder`, `document-skills:mcp-builder` (création MCP server)
- `claude-api`, `claude-md-management` (selon contexte)
- `stripe:*`, `sentry:*`, `hookify:*` (selon contexte plugin)
- `document-skills:frontend-design` (auto-activé selon demande UI design web)

**Note** : les `speckit.*` (constitution, specify, plan, tasks, etc.) sont des slash commands installés par `specify init` dans **les projets enfants**, pas dans Project-Forge directement. Pour les utiliser, démarrer un projet via `./tools/bootstrap` puis invoquer dans le projet enfant.

## Conflits identifiés à trancher

Quand 2 skills couvrent ~le même besoin, il faut choisir :

| Conflit | Skills | Reco initiale |
|---|---|---|
| TDD | `superpowers:test-driven-development` (installé) vs `tdd` Pocock (non installé) | Garder superpowers ; symlinker Pocock pour comparaison réelle si volonté |
| Debug | `superpowers:systematic-debugging` (installé) vs `diagnose` Pocock (non installé) | Garder superpowers ; symlinker Pocock si on veut tester pattern "feedback-loop-first" |
| Brainstorm | `superpowers:brainstorming` vs `grill-me` (Pocock, installé) | **Garder les 2** : brainstorming pour structurel, grill-me pour léger |
| PRD | `to-prd` Pocock vs `speckit.specify`+`speckit-convert` | **speckit gagne** (pipeline complet) — Pocock non installé |
| Issues breakdown | `to-issues` Pocock vs `speckit.tasks` | **speckit gagne** — Pocock non installé |
| Frontend design | `document-skills:frontend-design` (Anthropic officiel) | Standalone `frontend-design` plugin désactivé 2026-04-22 |
| Browser | `webapp-testing` Playwright vs `mcp__claude-in-chrome` | Choisir 1 stack par cas (web app testing → Playwright, browser auto → MCP) — `agent-browser` retiré 2026-04-22 |

## Appliquer cette matrice

1. **À chaque début de phase** : se demander *"dans quelle phase suis-je ?"* et invoquer le skill recommandé
2. **À chaque conflit** : noter quel skill a été choisi, pourquoi, et l'efficacité — alimenter cette matrice par retour d'expérience
3. **Sanitarisation périodique** : tous les 60 jours, remesurer l'usage réel et ajuster les recommandations

Cette matrice est un asset vivant. Elle doit évoluer avec :
- Les nouveaux skills installés
- Les skills qui se révèlent inutiles à l'usage
- Les nouveaux conflits identifiés
- Les patterns émergents

---

*Dernière mise à jour : 2026-05-01 — basée sur 60 jours d'usage réel (228 invocations Skill explicites mesurées sur 34 skills uniques).*
