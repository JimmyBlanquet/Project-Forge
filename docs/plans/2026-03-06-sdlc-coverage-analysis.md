# Analyse de couverture SDLC - Project-Forge

**Date:** 2026-03-06
**Objectif:** Evaluer la couverture du cycle de vie logiciel complet (idee -> production -> maintenance) et identifier les manques.

---

## 1. Contexte

Project-Forge se positionne comme une "usine a projets SaaS" capable de produire des projets production-ready en 48h. Le framework couvre le cycle de l'idee au deploiement via deux systemes principaux :

- **SpecKit** : Planification spec-driven (constitution -> specify -> plan -> tasks -> convert)
- **Ralph++** : Implementation autonome (loop avec quality gates)

Cette analyse confronte la couverture actuelle aux 9 domaines du SDLC moderne, en incluant les aspects macro souvent negliges : gouvernance d'architecture dans le temps, securite continue, et operations post-production.

---

## 2. Cartographie complete

### Phase 1 : Ideation & Planning

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Cadrage projet, principes | `speckit-constitution` | COUVERT |
| Bootstrap projet | `tools/bootstrap` (starters, CLAUDE.md, ADR) | COUVERT |
| Recherche utilisateur, personas | - | ABSENT |
| Estimation couts/temps, business case | - | ABSENT |
| Analyse concurrentielle | - | ABSENT |

**Score : 60%** - Solide sur le cadrage technique, absent sur la discovery produit.

### Phase 2 : Requirements & Analysis

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Specifications fonctionnelles | `speckit-specify` | COUVERT |
| Clarification, desambiguation | `speckit-clarify` | COUVERT |
| Specs non-fonctionnelles (perf, SLA) | Partiellement dans recette | PARTIEL |
| Validation utilisateur (prototypes) | - | ABSENT |

**Score : 80%** - Specs excellentes, manque la boucle utilisateur.

### Phase 3 : Design & Architecture

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Architecture technique | `speckit-plan`, `speckit-analyze` | COUVERT |
| Decisions architecturales | `docs/adr/` + template bootstrap | COUVERT |
| UI/UX design, wireframes | - | ABSENT |
| Data modeling | Production skills (schema patterns) | PARTIEL |
| **Gouvernance archi dans le temps** | `speckit-archi-review`, ESLint `no-restricted-imports` | **COUVERT** |
| **Revue archi periodique** | `speckit-archi-review` (on-demand) | **COUVERT** |
| **Fitness functions (metriques archi)** | ESLint layer rules (bloquant) + CLAUDE.md conventions (soft) | **PARTIEL** |

**Score : 75%** - Architecture initiale et gouvernance couverts via 3 niveaux (CLAUDE.md, ESLint, skill audit). Manque UI/UX design.

### Phase 4 : Development

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Coding, implementation | `ralph-loop`, starters, production skills | COUVERT |
| Code review | `code-review` skill | COUVERT |
| Debugging | `systematic-debugging` skill | COUVERT |
| TDD | `tdd-mode` skill | COUVERT |
| Documentation API auto-generee | - | ABSENT |
| Storybook / catalogue composants | - | ABSENT |

**Score : 85%** - Tres fort. Manque la doc API et le catalogue UI.

### Phase 5 : Testing & QA

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Tests unitaires | vitest, tdd-mode | COUVERT |
| Tests integration | vitest, quality gates | COUVERT |
| Tests E2E | `speckit-e2e`, agent-browser | COUVERT |
| Tests acceptation (UAT) | `speckit-recette` | COUVERT |
| Tests performance / charge | Guides k6 dans starters | PARTIEL |
| Tests accessibilite (a11y) | Guides axe-core dans starters | PARTIEL |
| Tests securite (pentest auto) | `speckit-threat-model` (STRIDE) | PARTIEL |
| Tests de regression visuelle | - | ABSENT |

**Score : 75%** - Fonctionnel couvert. Guides perf/a11y et threat model disponibles. Manque regression visuelle.

### Phase 6 : Deployment & Release

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| CI/CD pipeline | `github-actions`, `deployment-protection` | COUVERT |
| Hosting | `vercel-integration`, `railway-integration` | COUVERT |
| Database migrations | Drizzle/Prisma scripts | COUVERT |
| Feature flags | - | ABSENT |
| Canary / blue-green / rollback | - | ABSENT |
| Changelog / release notes | Conventional commits + `changelog` script | COUVERT |
| SBOM (inventaire composants) | - | ABSENT |

**Score : 65%** - Deploiement + changelog couverts. Manque feature flags et release progressive.

### Phase 7 : Securite (transverse)

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Auth / authz | Supabase Auth, Auth.js, RLS | COUVERT |
| Rate limiting | `rate-limiting-persistent` | COUVERT |
| SAST (analyse statique) | ESLint + sonarjs + CI security.yml (CodeQL, Semgrep) | COUVERT |
| DAST (analyse dynamique) | - | ABSENT |
| Dependency audit | CI security.yml (`npm audit`), Renovate | COUVERT |
| Secrets management | CI security.yml (trufflehog), `.env` | PARTIEL |
| **Threat modeling** | `speckit-threat-model` (STRIDE) | **COUVERT** |
| **Security review periodique** | `speckit-archi-review` (axe securite) | **PARTIEL** |
| **OWASP compliance check** | - | **ABSENT** |

**Score : 60%** - Auth + SAST + dependency audit + threat model couverts. Manque DAST et OWASP formalis.

### Phase 8 : Monitoring & Observabilite

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Logging structure | `logging-structured` skill (design) | PARTIEL |
| Error tracking (Sentry) | Guides setup Sentry dans starters | PARTIEL |
| APM / traces | - | ABSENT |
| Analytics utilisateur | Guides setup PostHog dans starters | PARTIEL |
| Uptime monitoring | Health check `/api/health` dans starters | PARTIEL |
| Alerting / on-call | - | ABSENT |
| Cost monitoring (infra) | - | ABSENT |

**Score : 30%** - Guides Sentry/PostHog + health check endpoint fournis. L'installation reste manuelle (hors perimetre Claude Code).

### Phase 9 : Maintenance & Evolution

| Sous-domaine | Outil Project-Forge | Statut |
|---|---|---|
| Incident response | `docs/incidents/RUNBOOK.md` dans starters | COUVERT |
| Post-mortem template | `docs/incidents/POST-MORTEM-TEMPLATE.md` dans starters | COUVERT |
| Dependency updates (Renovate/Dependabot) | `renovate.json` dans starters | COUVERT |
| Changelog generation | Conventional commits + `pnpm changelog` | COUVERT |
| Feedback loop produit | `docs/feedback-loop/` (entre projets Forge) | PARTIEL |
| **Revue archi periodique** | `speckit-archi-review` (on-demand) | **COUVERT** |
| **Tech debt tracking** | `speckit-quality` + `speckit-archi-review` (dette technique) | **PARTIEL** |
| **Deprecation strategy** | - | **ABSENT** |

**Score : 70%** - Incident response, post-mortem, Renovate, changelog, archi review couverts. Manque strategie de deprecation formalisee.

---

## 3. Vue macro : les 3 grands trous

### Trou A : Gouvernance d'architecture dans le temps

**Probleme :** Project-Forge excelle a creer une architecture initiale (plan, ADR) mais n'offre rien pour la maintenir. Apres le sprint 1, l'architecture derive sans detection.

**Ce qui manque :**
- Fitness functions automatisees (ex: "aucun composant UI n'importe directement la DB")
- Revue archi periodique (skill qui analyse la codebase vs les ADR et la constitution)
- Metriques d'architecture (couplage, cohesion, profondeur des imports)
- Detection de violations de couches (presentation -> data sans passer par service)

### Trou B : Securite continue (DevSecOps)

**Probleme :** L'auth est solide mais la securite s'arrete la. Pas de scan de vulnerabilites, pas d'audit de dependances, pas de threat modeling.

**Ce qui manque :**
- `npm audit` / Snyk dans le CI
- SAST serieux (pas juste sonarjs) : CodeQL, Semgrep
- Dependency update automatique (Renovate/Dependabot)
- Secrets scanning (git-secrets, trufflehog)
- OWASP Top 10 checklist integree au code review
- Threat model template dans les specs

### Trou C : Operations post-production

**Probleme :** Le projet est "livre" mais ensuite c'est le vide. Pas de monitoring, pas d'incident response, pas de post-mortem, pas de gestion de la dette technique.

**Ce qui manque :**
- Integration Sentry/error tracking
- Integration analytics (PostHog, Plausible)
- Uptime monitoring (UptimeRobot, Checkly)
- Template incident response + post-mortem
- Changelog auto (conventional commits -> CHANGELOG.md)
- Renovate/Dependabot config dans les starters
- Health check endpoint dans les starters
- Tech debt register (lien avec speckit-quality)

---

## 4. Score global

```
Phase                    Avant   Apres   Barre (apres)
1. Ideation              60%     60%     ================
2. Requirements          80%     80%     ====================
3. Design/Architecture   55%     75%     ===================
4. Development           85%     85%     =====================
5. Testing               60%     75%     ===================
6. Deployment            55%     65%     =================
7. Securite              35%     60%     ================
8. Monitoring            10%     30%     ========
9. Maintenance           10%     70%     ==================

AVANT : ~50%    APRES : ~67%
```

**Project-Forge est passe de ~50% a ~67% de couverture SDLC.** Les plus grands gains : Maintenance (+60pts), Securite (+25pts), Architecture (+20pts). Le monitoring reste le point le plus faible (guides fournis mais hors perimetre operationnel de Claude Code).

---

## 5. Priorites d'amelioration recommandees

### Quick wins (effort faible, impact fort)

| # | Action | Phase | Effort |
|---|---|---|---|
| 1 | `npm audit --audit-level=high` dans CI | Securite | 1h |
| 2 | Health check endpoint `/api/health` dans starters | Monitoring | 1h |
| 3 | Template incident response + post-mortem | Maintenance | 2h |
| 4 | Renovate config dans starters | Maintenance | 2h |
| 5 | Conventional commits + changelog auto | Deployment | 2h |

### Skills a creer (effort moyen)

| # | Skill | Phase | Description |
|---|---|---|---|
| 6 | `/speckit-threat-model` | Securite | Threat model a partir de spec.md |
| 7 | `/speckit-archi-review` | Architecture | Verifier coherence codebase vs ADR + constitution |
| 8 | `sentry-integration` (prod skill) | Monitoring | Setup Sentry + error boundaries React |
| 9 | `analytics-integration` (prod skill) | Monitoring | Setup PostHog/Plausible |
| 10 | `security-scan` (skill) | Securite | SAST + dependency audit + secrets scan |

### Investissements structurels (effort important)

| # | Initiative | Phase | Description |
|---|---|---|---|
| 11 | Architecture fitness functions | Architecture | Regles automatisees de respect des couches |
| 12 | Tests non-fonctionnels (perf, a11y) | Testing | k6 + axe-core dans pipeline |
| 13 | Feature flags framework | Deployment | env-based flags avec rollback progressif |
| 14 | Tech debt register | Maintenance | Tracking + priorisation de la dette |

---

## 6. Vision cible

```
IDEE --> SPECS --> DESIGN --> DEV --> TEST --> DEPLOY --> MONITOR --> MAINTAIN
                     |                  |        |          |           |
                     v                  v        v          v           v
                 Threat Model      Perf/A11y  Flags    Sentry      Incidents
                 ADR Review        SAST/DAST  SBOM     Analytics   Post-mortem
                 Fitness Fn        Sec Scan   Changelog Uptime     Renovate
                                                        Alerts     Tech Debt
```

L'objectif n'est pas de tout construire, mais de s'assurer que chaque projet fils dispose au minimum des bases pour chaque phase. Les starters et le bootstrap doivent fournir les fondations, les skills guident l'execution.

---

## 7. Recherche : Normes et outils de suivi d'architecture

### Standards de qualite logicielle

#### ISO/IEC 25010:2023 (SQuaRE)

Modele de reference pour la qualite logicielle. Definit 8 caracteristiques :

| Caracteristique | Ce qu'elle mesure | Couverture PF |
|---|---|---|
| Functional Suitability | Le logiciel fait ce qu'on lui demande | COUVERT (specs, tests) |
| Performance Efficiency | Temps de reponse, memoire | ABSENT |
| Compatibility | Coexistence, interoperabilite | ABSENT |
| Usability | Facilite d'usage, accessibilite | ABSENT |
| Reliability | Tolerance aux pannes, recoverabilite | ABSENT |
| Security | Confidentialite, integrite | PARTIEL (auth) |
| Maintainability | Modularite, testabilite, analysabilite | PARTIEL (quality scan) |
| Portability | Adaptabilite, installabilite | ABSENT |

Source : https://blog.pacificcert.com/iso-25010-software-product-quality-model/

#### arc42 + C4 Model

Template standardise de documentation d'architecture en 12 chapitres (contexte, contraintes, building blocks, runtime, deployment, decisions, qualite, risques...). Combine avec le modele C4 (Context, Container, Component, Code) pour les diagrammes. Approche "documentation as code" avec Structurizr DSL.

Sources :
- https://quality.arc42.org/standards/iso-25010
- https://github.com/bitsmuggler/arc42-c4-software-architecture-documentation-example

#### SonarQube — Metriques industrielles

Standard pour mesurer la dette technique :
- **Technical Debt Ratio** : cout remediation / cout dev (cible < 5%)
- **Maintainability Rating** : A (< 5%) a E (> 50%)
- **Cognitive Complexity** : difficulte de comprehension
- **Quality Gate** : conditions pass/fail avant release

Source : https://docs.sonarsource.com/sonarqube-server/2025.3/user-guide/code-metrics/metrics-definition

### Outils d'enforcement d'architecture

#### Niveau 1 : Regles ESLint (dev-time, deja installe)

**eslint-plugin-boundaries** — Definit des elements (types de fichiers) et des regles d'import.
Feedback temps reel en editeur + CI. Nouvelle dep.
Source : https://github.com/javierbrea/eslint-plugin-boundaries

**no-restricted-imports** — Regle ESLint native, zero dep supplementaire.
Bloque les imports interdits avec message d'erreur custom.

#### Niveau 2 : Fitness functions (CI)

**dependency-cruiser** — Analyse et validation des dependances JS/TS.
Genere un graphe, valide contre des regles, detecte le code mort et les circulaires.
Source : https://xebia.com/blog/taking-frontend-architecture-serious-with-dependency-cruiser/

**ArchUnitTS** — Tests d'architecture en TypeScript.
S'execute avec vitest/jest comme des tests normaux.

#### Niveau 3 : ADR executables

**Archgate** — Transforme les ADR en regles executables (.rules.ts).
Pre-commit hooks, CI, ET serveur MCP pour Claude Code / Cursor.
Open source, Apache-2.0.

API des regles :
```typescript
import { defineRules } from "archgate/rules";
export default defineRules({
  "rule-id": {
    description: "Ce que la regle verifie",
    severity: "error",  // error | warning | info
    async check(ctx) {
      // ctx.scopedFiles — fichiers cibles
      // ctx.readFile(path) — lire un fichier
      // ctx.glob(pattern) — chercher des fichiers
      // ctx.grep(file, /regex/) — chercher dans un fichier
      // ctx.grepFiles(/regex/, "glob") — chercher dans plusieurs
      // ctx.report.violation({ message, file, line, fix })
    },
  },
});
```

MCP pour Claude Code (.mcp.json) :
```json
{
  "mcpServers": {
    "archgate": { "command": "archgate", "args": ["mcp"] }
  }
}
```

Outils MCP : review_context, check, list_adrs, adr://{id}

Sources :
- https://github.com/archgate/cli
- https://cli.archgate.dev/

#### Niveau 4 : Analyse continue (serveur)

**SonarQube / SonarCloud** — 6000+ regles, quality gates, tracking dette dans le temps.
Gratuit pour open source en cloud.

### Incident Response et Post-Mortem

Meilleures pratiques 2025 : blameless, dans les 48-72h, action items avec owners et deadlines.

Outils : FireHydrant, incident.io, Atlassian, Notion templates.
Template Google SRE : https://sre.google/sre-book/postmortem-culture/

### Changelog et Versioning

**Conventional Commits** : format structure des messages de commit (feat:, fix:, BREAKING CHANGE).
**semantic-release** : versioning + changelog automatique a partir des commits.
**commitlint** : linter de messages de commit.

Source : https://www.conventionalcommits.org/en/about/

---

## 8. Analyse pragmatique : adapter au contexte Claude Code

### Contrainte cle

Claude Code ne tourne pas H24. Il n'y a pas d'editeur. Le workflow est :
```
Claude Code ecrit du code -> commit -> CI verifie
```

Les phases "Run" (monitoring, alerting, uptime) sont **hors perimetre** de Project-Forge.
Project-Forge peut fournir des guides d'installation, pas operer ces services.

### Perimetre realiste de Project-Forge

```
DANS LE PERIMETRE                    HORS PERIMETRE
(dev-time, Claude Code peut agir)    (runtime, necessite services externes)
─────────────────────────────        ────────────────────────────────────
Specs, design, ADR                   Error tracking (Sentry)
Architecture governance              Analytics (PostHog)
Code quality, linting                Uptime monitoring
Tests (unit, integ, E2E)             Alerting / on-call
Security scanning (SAST, deps)       APM / traces
CI/CD pipeline                       Log aggregation
Incident/post-mortem templates       Feature flags runtime
Changelog generation                 Cost monitoring infra
```

### Le probleme central : coherence architecturale

Le vrai risque n'est pas le monitoring (service externe). C'est que **l'architecture derive apres le sprint 1** sans que personne ne le detecte. Surtout avec des agents autonomes (Ralph++) qui codent vite mais ne "comprennent" pas les intentions architecturales au-dela de leur story.

### Approche recommandee : 3 niveaux, zero over-engineering

| Niveau | Mecanisme | Impact Ralph++ | Setup | Efficacite |
|---|---|---|---|---|
| **1. CLAUDE.md** | Regles archi dans le fichier que tout agent lit | 0 | 5 min | ~80% (soft) |
| **2. ESLint** | `no-restricted-imports` natif (zero dep) | 0 (deja dans `next lint`) | 10 min | ~95% (bloquant imports) |
| **3. Skill a la demande** | `/speckit-archi-review` lance manuellement | 0 (hors loop) | 1 session | ~90% (analyse complete) |

**Niveau 1** : Le CLAUDE.md genere par bootstrap contient les regles d'architecture du starter. Chaque agent Ralph++ les lit avant de coder. Cout zero, efficace pour les conventions.

**Niveau 2** : La regle ESLint native `no-restricted-imports` empeche mecaniquement les violations de couches (ex: composant React importe la DB). Tourne deja dans `next lint` qui est dans le quality gate. Zero nouvelle dep.

**Niveau 3** : Un skill `/speckit-archi-review` qu'on lance periodiquement (pas dans le loop Ralph++). Il charge la constitution + ADR + code et produit un rapport de conformite. Pour les checkpoints manuels.

### Pourquoi PAS Archgate (pour l'instant)

- Nouvelle dep globale + `.archgate/` directory
- Fichiers `.rules.ts` a maintenir en parallele des ADR
- MCP server = overhead de contexte pour chaque agent
- `archgate check` dans le quality gate = +15s par story Ralph++
- Disproportionne pour des MVP SaaS

Archgate reste une option interessante pour les projets matures post-MVP qui ont besoin de gouvernance stricte. A reevaluer quand les projets fils depassent 20+ stories.
