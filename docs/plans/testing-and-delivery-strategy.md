# Project-Forge - Strategie Tests & Livraison

**Date:** 2026-02-13
**Statut:** Plan valide, a implementer
**Source:** Recherche bonnes pratiques + feedback projets enfants

---

## Constat

Le pipeline actuel s'arrete apres le build :

```
SpecKit -> Ralph++ -> tsc + lint + build -> (fin)
```

Il manque : tests unitaires, tests d'integration, tests E2E, recette, CI/CD.

---

## 1. Pyramide de Tests

```
        /   E2E   \          ~10%  |  3-5 parcours critiques max
       /------------\
      / Integration  \        ~20%  |  API + DB + services externes
     /----------------\
    / Tests Unitaires  \      ~70%  |  Fonctions, hooks, composants
   /____________________\
```

### Stack d'outils

| Niveau | Outil | Justification |
|--------|-------|---------------|
| Unitaire | **Vitest** + React Testing Library | Recommande par Next.js, 10-20x plus rapide que Jest, natif TypeScript/ESM |
| Integration | **Vitest** + DB locale (Supabase local / SQLite) | Meme runner, config `--project integration` |
| E2E | **Playwright** | Recommande par Next.js, multi-navigateur, parallelisation native |
| Coverage | **Vitest v8** | Depuis v3.2, rapports identiques a Istanbul mais plus rapide |
| Linting | **ESLint** (deja en place) | Ecosysteme mature pour Next.js |
| Formatting | **Prettier** (deja en place) | Standard |

### Seuils de coverage

| Metrique | Seuil initial | Cible a terme |
|----------|---------------|---------------|
| Lines | 70% | 80% |
| Branches | 65% | 75% |
| Functions | 75% | 85% |
| Statements | 70% | 80% |

Vitest supporte `thresholdAutoUpdate` : les seuils montent automatiquement quand la coverage s'ameliore (cliquet anti-regression).

### Quoi tester a chaque niveau

**Unitaires (Vitest + RTL) :**
- Fonctions utilitaires, helpers, validation (Zod schemas)
- Hooks custom
- Composants UI isoles (rendu, interactions)
- Server actions (logique metier mockee)

**Integration (Vitest) :**
- API routes avec vraie DB (Supabase local ou SQLite in-memory)
- Chaines completes : validation -> service -> DB -> reponse
- Middleware (auth, rate limiting)
- Webhooks (Stripe avec fixtures)
- RLS / isolation securite
- Services externes (S3/MinIO, email)

**E2E (Playwright) :**
- Inscription / Connexion / Deconnexion
- Parcours CRUD principal de l'app
- Parcours de paiement (Stripe test mode)
- 3-5 parcours critiques max (pas plus)

---

## 2. Quality Gates - 4 Niveaux

### Gate 1 : Pre-commit (local, instantane)

```
lint-staged + husky
  ├── ESLint sur fichiers modifies
  ├── Prettier check
  └── tsc --noEmit (typecheck)
```

**But :** Attraper les erreurs evidentes avant le push.

### Gate 2 : CI - Pull Request (automatique, ~2-5 min)

```
PR ouverte / mise a jour
  ├── Job 1: Lint + Typecheck + Format           (~30s)
  ├── Job 2: Tests unitaires + Coverage           (~1-2 min, parallele)
  ├── Job 3: Tests d'integration                  (~1-2 min, parallele)
  └── Job 4: Build production                     (~1-2 min, parallele)
```

**Bloque le merge si :**
- Un test echoue
- Coverage globale < 70% (seuil initial)
- Coverage nouveau code < 80%
- Vulnerabilite critique (`npm audit`)
- Build echoue

### Gate 3 : CI - Merge sur staging/main (~5-10 min)

```
Merge sur staging
  ├── Tous les jobs Gate 2 (re-run)
  ├── Job 5: Tests E2E Playwright                 (~3-5 min)
  └── Job 6: Deploy preview/staging (Vercel)
```

Les E2E ne tournent qu'ici pour ne pas ralentir le feedback loop des PR.

### Gate 4 : Deploy production (semi-automatique)

```
Staging valide
  ├── Recette (checklist generee par SpecKit)
  ├── Approval manuelle (GitHub environment protection)
  ├── Deploy production (Vercel)
  └── Smoke tests post-deploy
```

### Cout

GitHub Actions plan Free : 2 000 min/mois (Linux).
Estimation usage typique : ~900-1200 min/mois. **Cout = 0$.**

---

## 3. Integration SpecKit

### Taches de test dans tasks.md

SpecKit doit generer une phase "Tests" systematique :

```markdown
## Phase N : Tests

### Tests unitaires
- T-xx: Tests unitaires pour actions/<feature>.ts (validation, auth mock, CRUD)
- T-xx: Tests unitaires pour lib/<service>.ts (config, edge cases)
- T-xx: Tests pour schemas Zod (validation input, error messages)

### Tests d'integration
- T-xx: Test CRUD complet (create -> read -> update -> delete) avec DB reelle
- T-xx: Test isolation RLS (2 users)
- T-xx: Test cascade delete (entite -> sous-entites -> stockage)
- T-xx: Test services externes (S3, email, webhooks)

### Tests E2E
- T-xx: Parcours utilisateur principal (happy path)
- T-xx: Parcours d'erreur critique (auth expiree, permission refusee)
```

### Stories de type `test` dans prd.json

Le PRD Ralph++ doit inclure des stories de type `test` en plus des stories `implement` :

```json
{
  "id": "T-01",
  "type": "test",
  "title": "Tests unitaires pour project actions",
  "depends_on": ["S-03"],
  "acceptance_criteria": [
    "Tests couvrent validation Zod (inputs valides + invalides)",
    "Tests couvrent auth check (user connecte, non connecte)",
    "Tests couvrent CRUD (create, read, update, delete)",
    "Coverage > 80% sur le fichier cible"
  ]
}
```

### Nouveau skill : `/speckit-recette`

Genere une checklist de recette a partir des acceptance criteria du `spec.md` :

```markdown
## Recette Feature: <feature-name>

### US1 - <titre>
- [ ] <acceptance scenario 1>
- [ ] <acceptance scenario 2>

### US2 - <titre>
- [ ] ...
```

Cette checklist est le support de la validation humaine (Gate 4).

---

## 4. Integration Ralph++

### Quality gate enrichi

**Avant :**
```bash
QUALITY_GATE="npx tsc --noEmit && npx next lint && npm run build"
```

**Apres :**
```bash
QUALITY_GATE="npx tsc --noEmit && npx next lint && npx vitest run && npm run build"
```

Chaque story implementee est validee par ses tests avant commit.

### Constitution : section Quality Gates

Ajouter dans `.speckit/constitution.yml` :

```yaml
quality_gates:
  static:
    - typecheck: npx tsc --noEmit
    - lint: npx next lint
  tests:
    - unit: npx vitest run
    - integration: npx vitest run --project integration
    - e2e: npx playwright test  # pre-merge seulement
  build:
    - build: npm run build
  coverage:
    min_global: 70
    min_new_code: 80
```

---

## 5. Recette + Systematic Debugging

### Workflow de recette

```
Checklist recette (generee par /speckit-recette)
    |
    ├── Item PASS -> valide, passer au suivant
    |
    └── Item FAIL -> ouvrir un ticket/story
                       |
                  Systematic Debugging
                  Phase 1: Root Cause Investigation
                    - Reproduire le bug exactement
                    - Lire les erreurs (logs, console, network)
                    - Verifier les changements recents (git diff)
                    - Tracer le flux de donnees entre composants
                  Phase 2: Pattern Analysis
                    - Trouver du code similaire qui fonctionne
                    - Comparer les differences
                  Phase 3: Hypothesis + Test
                    - Hypothese unique et specifique
                    - Test minimal (une seule variable)
                    - Si 3+ tentatives echouent -> probleme d'architecture
                  Phase 4: Implementation
                    - Test de non-regression AVANT le fix
                    - Fix unique sur la root cause
                    - Verification complete
                       |
                  Re-run item de recette
```

### Convention projet

Quand un item de recette echoue :
1. **Ne jamais patcher a l'aveugle** - toujours identifier la root cause
2. **Utiliser le skill `systematic-debugging`** pour investiguer
3. **Ecrire un test de non-regression** qui prouve le bug avant de le fixer
4. **Re-run la recette** sur l'item corrige + items adjacents

Cela garantit que chaque bug trouve en recette renforce la suite de tests.

---

## 6. CI/CD Template (GitHub Actions)

Template a inclure dans les starters :

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm next lint
      - run: pnpm vitest run --coverage
      - run: pnpm build

  e2e:
    if: github.event_name == 'push'  # seulement sur merge, pas sur PR
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
```

---

## 7. Pipeline complet cible

```
SpecKit                    Ralph++                    CI/CD                     Recette
┌──────────┐              ┌──────────────┐           ┌──────────────┐         ┌──────────────┐
│ Spec     │              │ Implemente   │           │ Gate 1: pre  │         │ Checklist    │
│ Plan     │──────────────│ + ecrit les  │──push────>│ Gate 2: PR   │────────>│ generee par  │
│ Tasks    │   genere     │   tests      │           │ Gate 3: merge│         │ /speckit-    │
│ + Phase  │   taches de  │              │           │ Gate 4: prod │         │  recette     │
│  Tests   │   test       │ Quality gate │           └──────────────┘         │              │
│          │              │ = tsc+lint   │                                    │ Si FAIL:     │
│ Recette  │              │  +test+build │                                    │ systematic-  │
│ criteria │              │              │                                    │ debugging    │
└──────────┘              └──────────────┘                                    └──────────────┘
```

---

## 8. Plan d'implementation

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Enrichir quality gate Ralph++ : `tsc + lint + vitest run + build` | Chaque story testee, tous projets | 0.5 jour |
| 2 | SpecKit genere des taches de test dans tasks.md | Tests = partie integrante du spec | 1 jour |
| 3 | CI/CD template GitHub Actions dans les starters | Chaque projet bootstrappe a sa CI | 0.5 jour |
| 4 | `/speckit-recette` + integration systematic-debugging | Validation humaine guidee | 1 jour |
| 5 | Setup Vitest + Playwright dans les starters | Testing ready out-of-the-box | 1 jour |
| 6 | Agent `test-writer` Ralph++ (optionnel, plus tard) | Generation auto de tests | 2 jours |

**Total Phase 1 (items 1-5) : ~4 jours**
**Phase 2 (item 6) : quand le reste est stabilise**

---

## 9. Quality Scanning Tools

Ajout de 3 outils de qualite code dans les starters, integres au pipeline :

### jscpd (Code Duplication)

Detecte le copier-coller dans le code TypeScript/TSX.

| Parametre | Valeur |
|-----------|--------|
| Seuil | 5% |
| Min lignes | 10 |
| Min tokens | 50 |
| Ignore | node_modules, .next, tests |

```bash
npm run quality:jscpd    # Scan duplication
```

### knip (Dead Code)

Detecte les exports inutilises, les dependances mortes, les fichiers orphelins.

```bash
npm run quality:knip     # Scan dead code
```

Config dans `knip.config.ts` — chaque starter a sa propre liste `ignoreDependencies` adaptee a ses devDeps.

### eslint-plugin-sonarjs (Cognitive Complexity)

Regles ajoutees a ESLint (format legacy `.eslintrc.json`) :

| Regle | Seuil |
|-------|-------|
| `sonarjs/cognitive-complexity` | warn a 15 |
| `sonarjs/no-duplicate-string` | warn a 5 occurrences |

Utilise `plugin:sonarjs/recommended-legacy` (compatible ESLint 8 / format `.eslintrc`).

### Scan combine

```bash
npm run quality:scan     # jscpd + knip + next lint (sonarjs inclus)
```

### Integration pipeline

- **Quality gate Ralph++** : `npx tsc --noEmit && npx next lint && npx vitest run && npm run quality:jscpd && npm run quality:knip`
- **CI/CD** : job `quality-scan` parallele a `lint-typecheck` et `unit-tests`
- **Skill** : `/speckit-quality` genere un `quality-report.md` avec status PASS/WARN/FAIL

---

## 10. E2E Testing Shift: Playwright → agent-browser

### Motivation

Playwright fonctionne bien pour les devs humains, mais consomme trop de tokens quand utilise par des agents IA (Ralph++, recette) :
- Screenshots = images = tokens eleves
- DOM queries complexes en code
- Pas d'arbre d'accessibilite textuel

### agent-browser (Vercel Labs)

`agent-browser` produit des **snapshots textuels** (arbres d'accessibilite) = ~90% moins de tokens :

```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i          # Arbre d'accessibilite avec refs @e1, @e2...
agent-browser click @e3            # Interagir par ref
agent-browser fill @e5 "data"      # Remplir un champ
agent-browser snapshot -i          # OBLIGATOIRE apres chaque navigation
agent-browser screenshot file.png  # Evidence visuelle
agent-browser close
```

**Regle critique** : toujours re-snapshot apres navigation/form submit (les refs @eN s'invalident au changement DOM).

### Changements

| Avant | Apres |
|-------|-------|
| `@playwright/test` dans devDeps | Retire |
| `playwright.config.ts` | Supprime |
| `test:e2e` lance Playwright | Redirige vers `/speckit-e2e` |
| CI: job `e2e` avec Playwright | CI: job `e2e-smoke` avec agent-browser |

### Nouvelles skills

- **`/speckit-e2e`** : E2E complet avec 3 sub-agents paralleles (structure, data, bugs) + fix-as-you-go
- **`/speckit-recette`** : enrichi avec section agent-browser pour verification automatisee

### Pattern 3 Sub-Agents (inspire de coleam00)

| Phase | Description |
|-------|-------------|
| 1 | 3 sub-agents paralleles : (1) Structure + routes, (2) Schema + data flows, (3) Bug hunting |
| 2 | Demarrer l'app + wait-on |
| 3 | Combiner recherches → plan de test |
| 4 | Executer tests (snapshot → interact → re-snapshot → screenshot) |
| 5 | Fix-as-you-go (bug → fix → re-test) |
| 6 | Rapport `tests/e2e/e2e-report.md` |
| 7 | Cleanup |

Les dossiers `tests/e2e/` restent pour stocker screenshots agent-browser.

---

## Sources

- [Next.js - Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js - Testing with Playwright](https://nextjs.org/docs/pages/guides/testing/playwright)
- [Vitest - Coverage Configuration](https://vitest.dev/guide/coverage.html)
- [Playwright - Best Practices](https://playwright.dev/docs/best-practices)
- [InfoQ - Pipeline Quality Gates](https://www.infoq.com/articles/pipeline-quality-gates/)
- [Modern Test Pyramid Guide 2025](https://fullscale.io/blog/modern-test-pyramid-guide/)
- [Testing in 2026: Full Stack Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [GitHub Actions Billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- Feedback projets enfants (retours internes)
