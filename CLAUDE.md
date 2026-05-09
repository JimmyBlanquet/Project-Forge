# Project-Forge - Instructions Claude

## Qu'est-ce que Project-Forge?

**Usine à Projets SaaS** - Framework pour créer des projets production-ready en 48h.

## Structure du Projet

```
Project-Forge/
├── starters/              # Templates de base
│   └── saas-base/         # Next.js 14 + Prisma + Stripe + Auth
├── skills/                # Skills de développement
│   ├── ralph-agent-teams/ # Orchestration agents parallèles (Opus 4.6)
│   ├── effort-optimizer/  # Optimisation coûts API
│   ├── context-maximizer/ # Exploitation contexte 1M tokens
│   ├── speckit/           # Extensions PF (convert, recette, e2e, security...)
│   └── ralph-loop/        # Implémentation autonome
├── production-skills/     # Skills production-ready
│   ├── auth-nextauth/
│   ├── payments-stripe/
│   ├── database-neon/
│   ├── email-resend/
│   └── ui-shadcn/
├── systems/               # Systèmes core
│   ├── ralph++/           # Implémentation autonome
│   └── speckit/           # Planification
├── tools/                 # Outils CLI
│   └── bootstrap          # Créer un nouveau projet
├── examples/              # Exemples de projets
└── docs/                  # Documentation
```

## Workflow Principal

### 1. Créer un nouveau projet

```bash
./tools/bootstrap mon-projet --starter saas-base
```

### 2. Planifier avec spec-kit + extensions PF

Core (GitHub spec-kit v0.3.2+):
```
/speckit.constitution   → Définir les principes
/speckit.specify        → Définir QUOI construire
/speckit.clarify        → Clarifier les ambiguïtés
/speckit.plan           → Définir COMMENT construire
/speckit.tasks          → Générer les tâches
/speckit.checklist      → Valider la qualité des specs
```

Extensions Project-Forge:
```
/speckit-convert        → Convertir en PRD pour Ralph++
/speckit-feature        → Pipeline complet (specify→plan→tasks→convert)
/speckit-e2e            → Tests E2E avec browser agent
/speckit-test-bridge    → Pipeline spec → Playwright
/speckit-archi-review   → Revue d'architecture
/speckit-threat-model   → Analyse STRIDE
/speckit-audit-sdlc     → Auditer la maturité SDLC du projet
```

### 3. Implémenter avec Ralph++

```
/ralph-loop             → Implémentation autonome
```

Avec Agent Teams (Opus 4.6):
```bash
python3 skills/ralph-agent-teams/scripts/analyze_dependencies.py prd.json
# Lance les agents en parallèle selon les phases identifiées
```

## Skills Clés

### ralph-agent-teams
Orchestration d'agents parallèles pour Ralph++.
- `analyze_dependencies.py` - Analyse le graphe de dépendances du PRD
- `check_conflicts.py` - Détecte les conflits de fichiers
- `sync_progress.py` - Synchronise progress.txt entre agents

### effort-optimizer
Optimise les coûts API en ajustant l'effort par type de tâche.
- `analyze_effort.py` - Mappe les tâches vers high/medium/low effort

### context-maximizer
Exploite le contexte 1M tokens pour SpecKit.
- `analyze_context.py` - Calcule le budget tokens et charge intelligemment

## Conventions

### Fichiers de configuration
- `.specify/` - Configuration spec-kit (constitution, memory, scripts)
- `.ralph/` - Configuration Ralph++ (session, progress)
- `.project-forge/` - Métadonnées projet

### Structure des specs
```
specs/<feature>/
├── spec.md          # Spécification
├── plan.md          # Plan technique
├── tasks.md         # Tâches détaillées
└── prd.json         # PRD pour Ralph++
```

### Structure du starter saas-base
- **ORM**: Prisma avec Neon PostgreSQL
- **Auth**: NextAuth v5 (Google, GitHub, credentials)
- **Payments**: Stripe (subscriptions, webhooks)
- **Email**: Resend avec React Email
- **UI**: shadcn/ui + Tailwind CSS
- **Content**: Contentlayer pour le blog

## Commandes Utiles

```bash
# Lister les starters disponibles
./tools/bootstrap --list-starters

# Lister les skills disponibles
./tools/bootstrap --list-skills

# Créer un projet avec skills spécifiques
./tools/bootstrap mon-projet --skills "auth,payments,email"

# Analyser les dépendances d'un PRD
python3 skills/ralph-agent-teams/scripts/analyze_dependencies.py prd.json

# Analyser le contexte d'un projet
python3 skills/context-maximizer/scripts/analyze_context.py . --feature "posts"
```

### Claude Code (v2.1.80+)
- `/effort low|medium|high` — Ajuster le niveau d'effort du modèle
- `/loop 5m /ralph-loop` — Exécution récurrente d'une commande
- `/branch` — Forker la conversation
- `/voice` — Mode vocal push-to-talk

## Règles pour Claude

1. **Toujours utiliser SpecKit** pour planifier avant d'implémenter
2. **Respecter la constitution** du projet (`.specify/memory/constitution.md`)
3. **Suivre les patterns** du starter choisi (Prisma pour saas-base)
4. **Documenter les décisions** dans `docs/adr/`
5. **Tracker le progress** dans `progress.txt` pendant Ralph++
6. **Utiliser le frontmatter `effort`** dans les skills (low/medium/high) pour optimiser les coûts
7. **1M tokens GA** — Opus 4.6 et Sonnet 4.6 supportent 1M tokens (output max 128k)
8. **JAMAIS contourner le workflow** sans les 3 conditions suivantes réunies :
   a. Analyse coût/risque/bénéfice documentée (quels tests ne seront pas faits ? quels risques ?)
   b. Validation EXPLICITE de l'utilisateur (pas d'auto-décision, pas d'auto-justification)
   c. Le fait d'être "pressé" ou "c'est simple" n'est PAS une justification — seul l'utilisateur décide
9. **Tests obligatoires** : toute feature touchant l'UI DOIT inclure la mise à jour des tests E2E. Le volume de tests ne fait pas la qualité — chaque test doit avoir ≥2 assertions significatives.
10. **Playwright Agents** : utiliser le Planner pour les specs de test, le Generator pour créer les tests, le Healer pour réparer les sélecteurs cassés. Ne jamais écrire de tests E2E manuellement sans d'abord vérifier si le Generator peut les produire.
11. **Tickets GitHub à jour** : à chaque commit qui référence un ticket (`#N` dans le message), s'assurer que le ticket est dans le bon état (close si commit "Closes #N", commenter si "Refs #N"). Le hook Stop `scripts/check-ticket-update.sh` rappelle automatiquement les tickets référencés encore OPEN. Ne pas ignorer ce rappel — la mise à jour des tickets est non négociable : c'est ce qui rend la trace de décision réutilisable plusieurs mois plus tard.
12. **Sensitive file edits — anti-stall** : pour modifier `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, `~/.gitconfig`, `/etc/*`, ou tout fichier de configuration globale/système hors du projet courant : (a) **tente l'edit direct** (Read puis Edit) — Jimmy reçoit une demande d'autorisation ; (b) si autorisé → fait ; (c) **uniquement en cas de refus explicite** → fallback : output le contenu/diff dans un code block + *"applique manuellement à `<file>`"* + tracker via TodoWrite comme `pending manual application — <file>`. **Anti-pattern** : ne PAS afficher d'office un diff "à appliquer manuellement" sans tenter l'edit — le copier-coller humain introduit des erreurs, l'edit machine est plus fiable. **Source** : 8+ sessions stallées (rapport Claude Code Insights 2026-05-01) + correction 2026-05-02 (le pattern initial "ne jamais tenter" était trop restrictif).
13. **Debugging — feedback loop first** : 90% du debug efficace = construire un signal pass/fail rapide AVANT de chercher la cause. Pattern emprunté à mattpocock (`diagnose` Phase 1). Sur n'importe quel bug : (a) écris d'abord un test qui reproduit (même grossier — un curl, une commande, un script), (b) confirme qu'il fail rouge, (c) PUIS itère sur la cause en re-runnant le signal après chaque hypothèse. Ne JAMAIS spéculer sur la cause sans un signal qui dit "encore cassé / réparé". Anti-pattern : lire le code et "raisonner" sur le bug pendant 20 minutes sans avoir un repro automatique.
14. **ADR sparingly** : un ADR n'est justifié QUE si les 3 critères sont vrais simultanément — (a) hard to reverse, (b) surprising without context, (c) result of a real trade-off. Si UN seul manque → pas d'ADR, un commit message ou un commentaire suffit. Voir `docs/adr/README.md` pour exemples. Évite l'ADR-spam qui rend le dossier illisible.
15. **Vertical slices via tracer bullets** : quand tu décomposes une feature en sub-stories (Ralph++, tasks, tickets), groupe par **comportement utilisateur final** (mini-feature E2E traversant toute la stack), JAMAIS par couche (tests / API / UI / doc séparés). Anti-pattern : "tous les tests d'abord puis toute l'implé" — ça donne un faux progrès et rien n'est testable indépendamment. Voir `extensions/pf-convert/commands/convert.md` pour l'application Ralph++.

## Skills à utiliser — matrice phase ↔ skill

Pour ne pas se perdre dans les ~40 skills installés, consulter la **[Skills Matrix](docs/references/skills-matrix.md)** qui mappe chaque phase de travail (discovery/planning/dev/test/review/ops/doc/marketing/etc.) au skill recommandé. Les conflits identifiés (ex: TDD Pocock vs superpowers) sont documentés.

**Règle d'invocation** : à chaque début de phase, se demander *"dans quelle phase suis-je ?"* puis invoquer le skill recommandé. Ne pas invoquer aveuglément `superpowers:brainstorming` (lourd) quand `grill-me` (léger) suffit.

## Quality Gate — Vérification obligatoire avant complétion

**Règle absolue** : tu ne peux JAMAIS dire "c'est fait", "c'est corrigé", "c'est livré" ou toute
variante sans avoir COMPLÉTÉ ET DOCUMENTÉ les 3 niveaux ci-dessous.
Chaque niveau est un prérequis du suivant. Si un niveau échoue, corriger et recommencer
CE niveau (max 3 tentatives par niveau).

### Niveau 1 — Vérification statique
- [ ] `bash tests/forge-eval.sh` → 0 test en échec, 0 test supprimé vs baseline
- [ ] Vérifier que les SKILL.md modifiés ont un frontmatter valide (name, description, effort)
- [ ] Si nouvelle skill : tests ajoutés dans forge-eval.sh (cas nominal + 1 edge case)
- [ ] Si bugfix : test de non-régression écrit AVANT le fix
→ Si un check échoue : corriger, recommencer. Ne PAS passer au Niveau 2.

### Niveau 2 — Vérification fonctionnelle
- [ ] Si modification de `tools/bootstrap` : tester un bootstrap complet dans /tmp
- [ ] Si modification de starters : vérifier que les configs sont cohérentes entre saas-base et supabase-stripe
- [ ] Si modification de skills : vérifier que la commande stub dans `commands/` référence correctement la skill
- [ ] Smoke test : les commandes documentées dans CLAUDE.md fonctionnent
→ Si un check échoue : corriger, recommencer Niveau 2. Ne PAS passer au Niveau 3.

### Niveau 3 — Preuve de complétion
- [ ] Commit avec message conventionnel : `type(scope): description`
- [ ] `Co-Authored-By: Claude` ajouté
- [ ] Résumé de complétion fourni avec :
  - Ce qui a été fait (1-2 lignes)
  - Tests ajoutés/modifiés (noms des fichiers)
  - Vérification effectuée : commande exécutée + résultat
- [ ] Push sur feature branch (JAMAIS sur main sans accord explicite)

### Ce que tu ne peux PAS faire
- Dire "c'est corrigé" sans avoir exécuté les tests
- Dire "j'ai vérifié" sans preuve (log de test ou output de commande)
- Supprimer un test qui échoue au lieu de corriger le code
- Skipper la vérification en disant "changement mineur"
- Push sur main sans confirmation explicite de l'utilisateur
- Considérer que "ça compile" = "ça marche"

### Escalade
Si après 3 tentatives un niveau ne passe toujours pas :
1. **STOP** — ne pas continuer
2. Documenter précisément ce qui échoue et pourquoi
3. Signaler le blocage à l'utilisateur avec les logs
4. Ne PAS proposer de contournement silencieux

## Liens Utiles

- [README principal](README.md)
- [Ralph++ Documentation](systems/ralph++/README.md)
- [SpecKit Documentation](systems/speckit/README.md)
- [Architecture Decisions](docs/adr/)
