# Plan : Pipeline de Developpement Autonome

**Date** : 2026-03-11
**Statut** : Plan valide, a implementer
**Contexte** : Automatiser le cycle complet feature-by-feature pour les projets downstream

---

## Situation actuelle

| Composant | Existe | Niveau |
|-----------|--------|--------|
| `tools/bootstrap` | oui | 80% — manque GitHub/Vercel setup |
| SpecKit (11 skills) | oui | 80% — interactif, pas headless |
| `tools/ralph` | oui | 85% — manque timeout, pas de test TDD inversé |
| Quality gates | oui | Tests unitaires + typecheck + lint |
| Deploy/promotion | non | Documenté mais pas scripté |
| Feature tracking | non | Pas de registre central |
| Smoke tests | non | Rien d'automatisé |
| Tests spec-driven | non | L'agent ecrit ses propres tests (biais) |

---

## Architecture cible

```
features.json (registre central)
    |
    v
Pour chaque feature status=todo :
    |
    +---> /speckit-feature F02
    |         |
    |         +---> /speckit-specify (spec.md)
    |         +---> /speckit-plan (plan.md + tests integration squelettes)
    |         +---> /speckit-tasks (tasks.md + tests unitaires squelettes)
    |         +---> /speckit-convert (prd.json, lie sub-stories aux tests)
    |
    +---> tools/ralph --auto-merge
    |         |
    |         +---> claude -p par sub-story (fait passer les tests, interdit de les modifier)
    |         +---> quality gate par batch
    |         +---> PR + auto-merge
    |
    +---> tools/validate-feature (typecheck + tests + build)
    |
    +---> tools/deploy-staging (push + poll Vercel preview URL)
    |
    +---> tools/smoke-test (curl health + routes features.json)
    |
    +---> [HUMAIN] : review + promote-to-prod
    |
    +---> features.json status=done
```

---

## Phase 1 : Fondation (6 actions)

### 1.1 — features.json schema + lifecycle

**Quoi** : Schema JSON pour le registre central des features.
**Ou** : `.speckit/features.json` dans chaque projet enfant.

```json
{
  "$schema": "features-schema.json",
  "project": "mon-projet",
  "features": [
    {
      "id": "F01",
      "name": "auth",
      "description": "Authentification email + OAuth Google",
      "priority": "P1",
      "status": "done",
      "routes": ["/login", "/register", "/api/auth/callback"],
      "specDir": ".speckit/features/auth/",
      "prdSession": ".ralph++/sessions/20260311-143022/"
    },
    {
      "id": "F02",
      "name": "payments",
      "description": "Abonnements Stripe avec checkout",
      "priority": "P1",
      "status": "todo",
      "routes": ["/pricing", "/checkout", "/api/webhooks/stripe"],
      "specDir": null,
      "prdSession": null
    }
  ]
}
```

**Status lifecycle** : `todo` → `specifying` → `implementing` → `validating` → `staging` → `done`

**Effort** : Petit (schema + validation dans les skills)

### 1.2 — /speckit-feature (commande composite headless)

**Quoi** : Nouvelle skill qui enchaine specify → plan → tasks → convert pour une feature donnee.
**Ou** : `skills/speckit/feature/SKILL.md` + `commands/speckit-feature.md`

**Comportement** :
1. Lit `features.json`, trouve la feature par ID ou nom
2. Met status = `specifying`
3. Execute sequentiellement : specify → plan → tasks → convert
4. A chaque etape, verifie le livrable (fichier existe, non vide, parseable)
5. Met status = `implementing` quand le PRD est pret
6. Ecrit les chemins (specDir, prdSession) dans features.json

**Mode headless** : Doit fonctionner avec `claude -p` sans interaction. Le prompt doit inclure toutes les informations necessaires (constitution, feature description, contraintes).

**Effort** : Moyen (nouvelle skill, orchestration 4 sous-skills)

### 1.3 — Tests spec-driven (TDD inverse, Option B)

**Quoi** : Generer des tests simples mais reels a 2 etapes du cycle SpecKit.

**Etape speckit-tasks** → Tests unitaires :
- Pour chaque sub-story, generer un fichier `tests/speckit/{feature}/{sub-story-id}.test.ts`
- Tests simples : imports existent, fonctions exportees, types corrects, retours basiques
- Utilisent vitest, passent a vide (assertions sur existence/types, pas sur logique)
- Exemple :
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('US-002-1: Checkout session creation', () => {
    it('should export createCheckoutSession function', async () => {
      const mod = await import('@/lib/billing/checkout');
      expect(mod.createCheckoutSession).toBeDefined();
      expect(typeof mod.createCheckoutSession).toBe('function');
    });

    it('should return a session URL for valid input', async () => {
      const { createCheckoutSession } = await import('@/lib/billing/checkout');
      const result = await createCheckoutSession('user-123', 'price_pro_monthly');
      expect(result).toHaveProperty('url');
      expect(typeof result.url).toBe('string');
    });

    it('should reject invalid price ID', async () => {
      const { createCheckoutSession } = await import('@/lib/billing/checkout');
      await expect(createCheckoutSession('user-123', 'invalid')).rejects.toThrow();
    });
  });
  ```

**Etape speckit-plan** → Tests d'integration API :
- Pour chaque user story, generer `tests/speckit/{feature}/integration.test.ts`
- Tests API (fetch sur les routes Next.js), pas Playwright
- Verifient les parcours complets (auth → checkout → webhook → subscription active)
- Exemple :
  ```typescript
  describe('US-002: Stripe checkout flow', () => {
    it('POST /api/checkout should return 401 without auth', async () => {
      const res = await fetch('http://localhost:3000/api/checkout', { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('POST /api/checkout should return checkout URL with valid session', async () => {
      // ... authenticated request
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.url).toContain('checkout.stripe.com');
    });
  });
  ```

**Enforcement dans ralph-loop** :
- Avant execution : calculer le hash SHA256 de chaque fichier `tests/speckit/**/*.test.ts`
- Apres execution : re-calculer, comparer
- Si un hash a change → echec du story, retry avec instruction renforcee
- Ajouter dans le prompt ralph : `"INTERDIT de modifier les fichiers dans tests/speckit/. Tu dois faire passer ces tests en implementant le code, pas en changeant les tests."`

**Effort** : Moyen (modifier speckit-tasks, speckit-plan, ralph-loop)

### 1.4 — bootstrap --github --vercel

**Quoi** : Etendre bootstrap pour creer le repo GitHub et linker Vercel.

**Flags** :
- `--github` : `gh repo create {name} --public --source . --push`
- `--github-private` : idem avec `--private`
- `--vercel` : `vercel link --yes` + `vercel env pull .env.local`
- `--protect` : appelle `tools/protect-main` automatiquement

**Prerequis** : `gh auth status` et `vercel whoami` doivent reussir.

**Effort** : Petit (ajout flags + commandes CLI)

### 1.5 — tools/validate-feature

**Quoi** : Script standalone de validation post-feature.

```bash
#!/usr/bin/env bash
# tools/validate-feature
# Runs full quality validation: typecheck + lint + tests + build
set -euo pipefail

npx tsc --noEmit
npx next lint
npx vitest run
npx next build

echo "Feature validation PASSED"
```

**Note** : Essentiellement extraire le quality gate existant de ralph en script reutilisable.

**Effort** : Petit (extraction)

### 1.6 — Timeout wrapper pour claude -p

**Quoi** : Dans `tools/ralph`, wrapper chaque appel `claude -p` avec un timeout.

```bash
timeout 300 claude -p "$PROMPT" --model "$MODEL" --dangerously-skip-permissions 2>&1 || {
    warn "Agent timed out after 5 minutes on $STORY_ID, retrying..."
    RETRY_COUNT=$((RETRY_COUNT + 1))
}
```

**Effort** : Petit (modifier ralph)

---

## Phase 2 : Pipeline (4 actions)

### 2.1 — tools/deploy-staging

**Quoi** : Push la branche et recuperer l'URL preview Vercel.

```bash
#!/usr/bin/env bash
# tools/deploy-staging
set -euo pipefail
BRANCH=$(git branch --show-current)

git push -u origin "$BRANCH"

# Poll Vercel deployments API
echo "Waiting for Vercel preview deployment..."
for i in $(seq 1 30); do
    DEPLOY_URL=$(vercel inspect --json 2>/dev/null | jq -r '.url // empty')
    if [ -n "$DEPLOY_URL" ]; then
        echo "Preview: https://$DEPLOY_URL"
        echo "$DEPLOY_URL" > .staging-url
        exit 0
    fi
    sleep 10
done
echo "ERROR: No preview deployment after 5 minutes"
exit 1
```

**Effort** : Petit

### 2.2 — tools/smoke-test

**Quoi** : Verifie que les routes de toutes les features `done` + la feature en cours repondent.

```bash
#!/usr/bin/env bash
# tools/smoke-test [URL]
set -euo pipefail
BASE_URL="${1:-$(cat .staging-url 2>/dev/null || echo http://localhost:3000)}"

# Health check
curl -sf "$BASE_URL/api/health" > /dev/null || { echo "FAIL: /api/health"; exit 1; }

# Routes from features.json
ROUTES=$(jq -r '.features[] | select(.status == "done" or .status == "staging") | .routes[]' .speckit/features.json 2>/dev/null)
FAILED=0
for route in $ROUTES; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$STATUS" -ge 500 ]; then
        echo "FAIL: $route → $STATUS"
        FAILED=1
    else
        echo "OK:   $route → $STATUS"
    fi
done

[ $FAILED -eq 0 ] && echo "Smoke test PASSED" || { echo "Smoke test FAILED"; exit 1; }
```

**Effort** : Petit

### 2.3 — tools/promote-to-prod

**Quoi** : Creer une PR vers main et activer l'auto-merge.

```bash
#!/usr/bin/env bash
# tools/promote-to-prod
set -euo pipefail
BRANCH=$(git branch --show-current)
[ "$BRANCH" = "main" ] && { echo "Already on main"; exit 1; }

gh pr create --base main --fill --label "auto-promoted"
gh pr merge "$BRANCH" --auto --squash --delete-branch
echo "PR created with auto-merge enabled"
```

**Effort** : Petit (existe deja partiellement dans ralph)

### 2.4 — Mutation testing (Stryker + vitest)

**Quoi** : Valider que les tests speckit sont suffisamment sensibles.

Ajouter aux starters :
```json
{
  "devDependencies": {
    "@stryker-mutator/core": "^8.0.0",
    "@stryker-mutator/vitest-runner": "^8.0.0",
    "@stryker-mutator/typescript-checker": "^8.0.0"
  },
  "scripts": {
    "test:mutation": "stryker run"
  }
}
```

Config `stryker.config.json` :
```json
{
  "testRunner": "vitest",
  "checkers": ["typescript"],
  "reporters": ["clear-text", "html"],
  "mutate": ["app/**/*.ts", "lib/**/*.ts", "utils/**/*.ts", "!**/*.test.ts", "!**/*.d.ts"],
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

**Usage** : Apres ralph-loop, lancer `pnpm test:mutation` sur les fichiers modifies.
Si le mutation score < 50%, les tests sont trop faibles → escalade.

**Pourquoi** : La recherche montre que 95% de couverture de lignes peut cacher des tests qui ne testent rien. Stryker mute le code (change `>` en `<`, `+` en `-`) et verifie que les tests echouent. Si les mutants survivent, les tests sont insuffisants.

**Effort** : Moyen (config + integration dans le pipeline)

---

## Phase 3 : Orchestration (2 actions)

### 3.1 — Skill dev-pilot (orchestrateur projet downstream)

**Quoi** : Skill qui boucle sur `features.json` et execute le pipeline complet.

**Comportement** :
```
1. Lire features.json
2. Trier par priorite (P1 > P2 > P3)
3. Pour chaque feature status=todo :
   a. /speckit-feature {id}          → status=specifying → implementing
   b. tools/ralph --auto-merge       → implementation
   c. tools/validate-feature         → status=validating
   d. tools/deploy-staging           → status=staging
   e. tools/smoke-test {url}         → verification
   f. Notification (Discord/email)   → "F02 payments ready for review"
   g. [ATTENTE HUMAINE]              → review + promote-to-prod
   h. Update status=done
4. Passer a la feature suivante
```

**Escalade** :
- Ralph-loop echoue 3x sur une sub-story → notification + skip feature
- Smoke test echoue → notification + garde en staging
- Mutation score < 50% → notification "tests insuffisants"

**Effort** : Moyen (orchestration + gestion d'etat)

### 3.2 — tools/setup-stripe (optionnel)

**Quoi** : Creer produits/prix Stripe via API et injecter dans `.env`.

```bash
# Lit la spec produit depuis constitution ou features.json
# stripe products create --name "Pro Plan" --description "..."
# stripe prices create --product prod_xxx --unit-amount 2900 --currency eur --recurring[interval]=month
# Injecte STRIPE_PRICE_PRO=price_xxx dans .env
```

**Effort** : Moyen (Stripe API + parsing spec)

---

## Strategie de fiabilisation des tests

### Le goulot d'etranglement identifie

La recherche montre que les tests generes par IA ont ~21.5% d'erreurs (11.3% assertions, 6.9% syntaxe, 2.4% valeurs). Le risque principal : des tests trop naifs qui passent mais ne detectent rien.

### 4 couches de defense

| Couche | Quoi | Quand | Outil |
|--------|------|-------|-------|
| 1. Tests spec-driven | Tests simples mais reels, compiles, passes a vide | speckit-tasks/plan | vitest |
| 2. Hash enforcement | Interdit a ralph de modifier les tests speckit | ralph-loop | sha256sum |
| 3. Regression | Tous les tests (anciens + nouveaux) a chaque batch | ralph quality gate | vitest run |
| 4. Mutation testing | Verifie que les tests detectent de vraies fautes | post-ralph, validation | Stryker |

### Inspiration : Kiro (AWS) et la recherche

**Kiro** utilise le property-based testing : extraire des proprietes universelles des specs (ex: "toute session de checkout doit avoir une URL"), generer des centaines de cas aleatoires. C'est plus robuste que les assertions ponctuelles mais plus complexe a implementer.

**Approche pragmatique pour Project-Forge** :
- **Court terme** (Phase 1) : Option B — tests simples mais reels, hash enforcement
- **Moyen terme** (Phase 2) : Mutation testing pour valider la sensibilite
- **Long terme** : Property-based testing inspire Kiro (fast-check library) pour les invariants metier

### Lecons de la recherche Martin Fowler (spec-kit comparison)

1. **Pas trop de markdown** : Les specs verbose fatiguent. Garder les tests concis et lisibles.
2. **Les agents ignorent souvent les instructions** : L'enforcement par hash est plus fiable que la convention.
3. **Separar fonctionnel/technique** : Les tests speckit testent le QUOI (comportement), ralph peut ajouter des tests sur le COMMENT (implementation).

---

## Resume des fichiers a creer/modifier

| Action | Fichier | Phase |
|--------|---------|-------|
| Creer | `skills/speckit/feature/SKILL.md` | 1 |
| Creer | `commands/speckit-feature.md` | 1 |
| Modifier | `skills/speckit/tasks/SKILL.md` (generation tests unitaires) | 1 |
| Modifier | `skills/speckit/plan/SKILL.md` (generation tests integration) | 1 |
| Modifier | `tools/ralph` (hash enforcement + timeout wrapper) | 1 |
| Modifier | `tools/bootstrap` (--github --vercel --protect flags) | 1 |
| Creer | `tools/validate-feature` | 1 |
| Creer | `tools/deploy-staging` | 2 |
| Creer | `tools/smoke-test` | 2 |
| Creer | `tools/promote-to-prod` | 2 |
| Modifier | `starters/*/package.json` (stryker deps) | 2 |
| Creer | `starters/*/stryker.config.json` | 2 |
| Creer | `skills/dev-pilot/SKILL.md` | 3 |
| Creer | `commands/dev-pilot.md` | 3 |
| Creer | `tools/setup-stripe` (optionnel) | 3 |

**12 creer, 5 modifier = 17 operations**

---

## Verification du plan

1. `features.json` : schema valide, lifecycle complet, routes incluses
2. `/speckit-feature` : enchaine 4 skills sans interaction, met a jour features.json
3. Tests speckit : compilent, passent a vide, couvrent imports/exports/types
4. Hash enforcement : sha256sum avant/apres ralph, echec si modifie
5. `bootstrap --github` : `gh repo create` + push fonctionnel
6. `tools/validate-feature` : exit code 0 = OK
7. Stryker : mutation score > 50% sur les fichiers modifies
8. Smoke test : toutes les routes features.json repondent < 500
9. Dev-pilot : boucle feature-by-feature avec escalade sur echec

---

## Sources de recherche

- [Test-Driven Development for Code Generation (2024)](https://arxiv.org/abs/2402.13521) — TDD ameliore la fiabilite du code LLM
- [Kiro Property-Based Testing](https://kiro.dev/docs/specs/correctness/) — Extraction de proprietes depuis les specs EARS
- [Martin Fowler: SDD Tools Comparison](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — Kiro vs spec-kit vs Tessl, lecons pratiques
- [Stryker + Vitest Runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/) — Config mutation testing
- [Agentic Property-Based Testing (NeurIPS 2025)](https://arxiv.org/html/2510.09907v1) — 56% de bugs valides trouves par agent PBT
- [Sentry Engineering: JS Mutation Testing](https://sentry.engineering/blog/js-mutation-testing-our-sdks) — Retour d'experience Stryker en production
- [Automated Test Generation Using LLMs (2025)](https://www.mdpi.com/2306-5729/10/10/156) — 21.5% d'erreurs dans les tests generes
- [Parasoft: AI Testing Trends 2026](https://www.parasoft.com/blog/annual-software-testing-trends/) — Self-healing tests, autonomous QA agents
- [PwC: Agentic SDLC 2026](https://www.pwc.com/m1/en/publications/2026/docs/future-of-solutions-dev-and-delivery-in-the-rise-of-gen-ai.pdf) — Vision industrie du SDLC autonome
