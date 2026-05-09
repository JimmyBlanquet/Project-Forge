# Plan : Couverture complete du cycle de vie projet

**Date:** 2026-03-06
**Ref:** Analyse SDLC `2026-03-06-sdlc-coverage-analysis.md`
**Objectif:** Passer de ~50% a ~85% de couverture SDLC en 4 phases incrementales.

---

## Principes directeurs

1. **Starters first** : chaque amelioration doit se materialiser dans les starters (code, config, ou placeholder)
2. **Skills for guidance** : les skills guident l'execution, pas de magie -- des templates et des process
3. **Opt-in, pas force** : les projets fils activent ce dont ils ont besoin
4. **Effort minimal, impact maximal** : commencer par ce qui evite des incidents en prod

---

## Phase 1 : Fondations securite + monitoring (Quick wins)

**Objectif :** Aucun projet fils ne part en prod sans le minimum vital.
**Effort estime :** 1-2 sessions

### 1.1 Health check endpoint

Ajouter dans chaque starter `app/api/health/route.ts` :
```typescript
// Verifie : app up, DB connectee, timestamp
export async function GET() {
  try {
    // ping DB
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: 'error' }, { status: 503 });
  }
}
```

### 1.2 Dependency audit dans CI

Ajouter dans le workflow CI :
```yaml
security-audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm audit --audit-level=high
    - run: npx licensee --errors-only  # optionnel: check licences
```

### 1.3 Template incident response + post-mortem

Creer dans les starters : `docs/incident-response/`
- `RUNBOOK.md` : Checklist quand ca casse (qui contacter, comment rollback, logs a consulter)
- `POST-MORTEM-TEMPLATE.md` : Structure blameless (timeline, impact, root cause, action items, lessons learned)
- `ESCALATION.md` : Matrice de severite (S1-S4) et temps de reaction attendus

### 1.4 Conventional commits + changelog

Ajouter dans les starters :
- `commitlint.config.js` avec convention `@commitlint/config-conventional`
- Script `changelog` dans package.json : `npx conventional-changelog -p angular -i CHANGELOG.md -s`
- Husky hook `commit-msg` pour valider le format

### 1.5 Renovate config

Creer `renovate.json` dans les starters :
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["every weekend"],
  "automerge": true,
  "automergeType": "pr",
  "packageRules": [
    { "matchUpdateTypes": ["minor", "patch"], "automerge": true },
    { "matchUpdateTypes": ["major"], "automerge": false }
  ]
}
```

---

## Phase 2 : Observabilite (le projet voit ce qui se passe en prod)

**Objectif :** Chaque projet fils a de la visibilite sur ses erreurs et son usage.
**Effort estime :** 2-3 sessions

### 2.1 Production skill : `error-tracking-sentry`

Setup Sentry pour Next.js :
- `@sentry/nextjs` dans les starters (optionnel, active par env var)
- `sentry.client.config.ts`, `sentry.server.config.ts`
- `app/global-error.tsx` pour capturer les erreurs App Router
- Source maps upload dans le build
- Env vars : `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Conditionnel : si `NEXT_PUBLIC_SENTRY_DSN` n'est pas set, Sentry ne s'active pas

### 2.2 Production skill : `analytics-posthog`

Setup PostHog pour Next.js :
- `posthog-js` + `PostHogProvider` dans le layout
- Server-side : `posthog-node` pour events backend
- Feature flags inclus (resout aussi le trou "feature flags")
- Self-hosted ou cloud, configure par env var
- Env vars : `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

### 2.3 Uptime monitoring config

Template `docs/monitoring/uptime.md` :
- Liste des endpoints a monitorer (`/api/health`, `/`, pages critiques)
- Configuration recommandee UptimeRobot / Checkly / Better Stack
- Alerting : webhook Slack/Discord + email

---

## Phase 3 : Securite continue (DevSecOps)

**Objectif :** Securite integree dans le process, pas en afterthought.
**Effort estime :** 2-3 sessions

### 3.1 Skill : `/speckit-threat-model`

A partir de `spec.md`, generer un threat model leger :
- **Assets** : quelles donnees sensibles ? (auth tokens, PII, paiements)
- **Attack surface** : API publiques, inputs utilisateur, integrations tierces
- **Threats** : STRIDE simplifie (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation)
- **Mitigations** : mapping vers les production skills existantes (auth, rate-limiting, validation)
- **Output** : `docs/security/threat-model.md` + checklist pour le code review

### 3.2 Security scan dans CI

Enrichir le workflow CI :
```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Dependency audit
      run: npm audit --audit-level=high
    - name: Secrets scan
      uses: trufflesecurity/trufflehog@main
      with:
        path: .
        base: ${{ github.event.repository.default_branch }}
    - name: SAST (Semgrep)
      uses: semgrep/semgrep-action@v1
      with:
        config: p/nextjs p/typescript p/owasp-top-ten
```

### 3.3 OWASP checklist dans code review

Enrichir le skill `code-review` avec une section securite :
- Injection (SQL, XSS, command) : inputs valides avec Zod ?
- Auth : routes protegees ? ownership verifie ?
- CSRF : actions sensibles protegees ?
- Secrets : rien en dur dans le code ?
- Rate limiting : endpoints publics proteges ?

### 3.4 Secrets management guide

Template `docs/security/secrets-management.md` :
- Env vars locales : `.env.local` (jamais commit)
- CI/CD : GitHub Secrets ou Vercel env vars
- Production : Vercel env vars (encrypted at rest)
- Rotation : quand et comment changer les cles
- Checklist pre-deploy : aucun secret en clair

---

## Phase 4 : Gouvernance d'architecture dans le temps

**Objectif :** L'architecture ne derive pas apres le sprint 1.
**Effort estime :** 3-4 sessions

### 4.1 Skill : `/speckit-archi-review`

Revue periodique automatisee :
1. Charger la constitution + tous les ADR + le plan technique
2. Scanner la codebase avec des regles de coherence :
   - **Layer violations** : un composant UI importe directement la DB ?
   - **Dependency direction** : les imports respectent-ils les couches ?
   - **ADR compliance** : les decisions documentees sont-elles encore respectees ?
   - **Dead ADRs** : des ADR mentionnent des fichiers/patterns qui n'existent plus ?
3. Output : `docs/architecture/review-YYYY-MM-DD.md`
   - Score de conformite
   - Violations detectees
   - ADR a mettre a jour
   - Recommandations

### 4.2 Architecture fitness functions

Regles automatisees dans ESLint ou un script custom :
```
# Exemples de regles
- app/api/** ne doit PAS importer depuis components/
- components/** ne doit PAS importer depuis utils/db/
- Aucun fichier ne doit depasser 300 lignes
- Aucune fonction ne doit depasser une complexite cyclomatique de 15
- Les routes API doivent toujours verifier l'auth en premier
```

Implementable via :
- `eslint-plugin-import` (restrictions d'import)
- `eslint-plugin-sonarjs` (deja en place pour complexite)
- Script custom `tools/fitness-check` pour les regles metier

### 4.3 Tech debt register

Skill `/speckit-tech-debt` :
- Scan : `speckit-quality` + analyse des TODO/FIXME/HACK dans le code
- Classification : dette deliberee vs accidentelle
- Priorisation : impact x effort
- Output : `docs/tech-debt/register.md` avec tableau a jour
- Lien avec speckit-specify : transformer la dette critique en user stories

### 4.4 Tests non-fonctionnels

#### Performance (k6)
- Script k6 basique dans `tests/perf/` : smoke test des routes critiques
- Seuils : response time p95 < 500ms, error rate < 1%
- Integrable dans CI (smoke seulement, pas load test)

#### Accessibilite (axe-core)
- `@axe-core/cli` ou integration agent-browser avec audit a11y
- Regles WCAG 2.1 AA minimum
- Scanner les pages principales dans le pipeline E2E

---

## Resume des livrables par phase

| Phase | Livrables | Impact couverture |
|---|---|---|
| **1. Fondations** | health check, npm audit CI, incident templates, conventional commits, renovate | +15% (50% -> 65%) |
| **2. Observabilite** | Sentry skill, PostHog skill, uptime guide | +10% (65% -> 75%) |
| **3. DevSecOps** | threat model skill, security scan CI, OWASP review, secrets guide | +8% (75% -> 83%) |
| **4. Gouvernance** | archi review skill, fitness functions, tech debt, perf/a11y tests | +7% (83% -> 90%) |

---

## Ce qu'on choisit de NE PAS couvrir

| Domaine | Raison |
|---|---|
| User research / personas | Hors scope technique -- releve du product management |
| UI/UX design / wireframes | Trop specifique au projet -- Figma etc. restent externes |
| Blue-green / canary deployments | Complexite infra disproportionnee pour les projets cibles |
| Full SBOM | Overhead excessif pour des SaaS MVP -- `npm audit` suffit |
| APM complet (Datadog, New Relic) | Sentry + PostHog couvrent 80% du besoin a cout zero |

---

## Ordre d'execution recommande

```
Phase 1.1-1.5  ─── Quick wins starters ──────────────> Commit "lifecycle foundations"
Phase 2.1      ─── Sentry production skill ──────────> Commit "error-tracking-sentry"
Phase 2.2      ─── PostHog production skill ─────────> Commit "analytics-posthog"
Phase 3.1      ─── /speckit-threat-model skill ──────> Commit "threat-model skill"
Phase 3.2-3.4  ─── Security CI + review + guide ────> Commit "devsecops pipeline"
Phase 4.1      ─── /speckit-archi-review skill ──────> Commit "archi-review skill"
Phase 4.2-4.4  ─── Fitness + debt + tests NF ───────> Commit "architecture governance"
```

Chaque phase est autonome et deployable independamment.
