# Vercel Preview + Production Workflow

## Principe

```
feature branch → PR → Vercel Preview → CI + E2E sur Preview → Merge main
                                                                    ↓
                                                          Vercel Production Build
                                                                    ↓
                                                          Deployment Checks (CI Gate)
                                                                    ↓
                                                          Promotion sur domaine prod
```

- **main** = production. Chaque merge declenche un build prod.
- **PR** = preview. Vercel cree automatiquement une URL de preview par PR.
- **Deployment Checks** = Vercel ne promeut PAS en prod tant que le CI Gate n'a pas passe.

## Setup

### 1. Connecter le repo a Vercel

```bash
# Via Vercel Dashboard
# 1. Import Git Repository → selectionner le repo
# 2. Framework Preset: Next.js
# 3. Root Directory: ./ (ou le sous-dossier si monorepo)
```

### 2. Configurer les variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables.

Chaque variable a un **scope** (Production, Preview, Development) :

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Neon prod branch | Neon dev branch | Neon dev branch |
| `NEXTAUTH_SECRET` | Secret prod | Secret test | Secret local |
| `NEXTAUTH_URL` | `https://monapp.com` | (auto par Vercel) | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | `pk_test_...` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_...` | `whsec_test_...` | `whsec_test_...` |
| `RESEND_API_KEY` | Cle prod | Cle test | Cle test |

**Regles :**
- `NEXT_PUBLIC_` = expose cote client. Ne JAMAIS prefixer un secret avec ca.
- Les vars Preview utilisent des cles de **test** (Stripe test mode, DB de staging).
- Les vars Production utilisent les cles **live**.
- Les vars ne s'appliquent qu'aux **nouveaux deploys** (pas retroactif).

Pour recuperer les vars Development en local :
```bash
vercel link          # Lier le projet
vercel env pull      # Telecharge dans .env.local
```

### 3. Configurer la branch de production

Dans Vercel Dashboard > Settings > Git :
- **Production Branch**: `main`
- **Preview Branches**: toutes les autres (par defaut)

### 4. Activer les Deployment Checks (Vercel Pro)

Les Deployment Checks bloquent la promotion en production tant que le CI n'a pas passe.

1. Vercel Dashboard > Project > Settings > Deployment Checks
2. Cliquer **Add Checks**
3. Selectionner le check **"CI Gate"** (notre job GitHub Actions qui agregre tous les checks)
4. Sauvegarder

Resultat : apres un merge sur `main`, Vercel build le deploy mais ne le promeut sur les domaines prod que quand CI Gate est vert.

### 5. Proteger la branche main (GitHub)

```bash
# Script automatise (necessite gh CLI + droits admin)
# Ou utiliser: ./tools/protect-main
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Gate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":0,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

Cela force :
- PR obligatoire (pas de push direct sur main)
- CI Gate doit passer avant merge
- Branch a jour avec main (`strict: true`)

## Pipeline CI complet

```
PR creee
  ├─ Vercel: deploy Preview (URL unique)
  ├─ GitHub Actions (en parallele):
  │   ├─ Lint & TypeCheck
  │   ├─ Quality Scan (jscpd, knip)
  │   ├─ Unit Tests (vitest)
  │   ├─ E2E Tests (Playwright contre le Preview Vercel)
  │   └─ Build
  └─ CI Gate: tous verts → merge autorise

Merge sur main
  ├─ Vercel: build Production (pas encore promu)
  ├─ GitHub Actions: CI tourne a nouveau sur main
  └─ Deployment Checks: CI Gate vert → promotion sur domaine prod
```

Les E2E tournent contre l'URL du preview Vercel (pas localhost), ce qui teste l'app dans des conditions reelles (serverless, env vars Preview, edge functions).

## Workflow quotidien

### Developper une feature

```bash
# 1. Creer une feature branch
git checkout -b feat/ma-feature

# 2. Developper + committer
git add .
git commit -m "feat: description"

# 3. Pusher et creer la PR
git push -u origin feat/ma-feature
gh pr create --base main --fill

# 4. Vercel deploie automatiquement un preview
#    → URL visible dans le commentaire de la PR
#    → E2E tournent automatiquement contre cette URL

# 5. Attendre que CI Gate passe
#    → vert = mergeable

# 6. Merger la PR
gh pr merge --squash --delete-branch
# → Vercel build prod + Deployment Checks + promotion
```

### Avec Ralph++ (workflow autonome)

Ralph++ cree des feature branches et des PRs automatiquement.
Avec `--auto-merge`, le pipeline est 100% autonome :

```bash
# Pipeline semi-autonome (review manuelle avant merge)
./tools/ralph

# Pipeline 100% autonome (merge automatique quand CI passe)
./tools/ralph --auto-merge
```

```
ralph → feat/{slug} → PR → CI Gate vert → auto-merge main → Deployment Checks → prod
```

L'auto-merge utilise `gh pr merge --auto --squash --delete-branch`. La PR se merge automatiquement des que CI Gate est vert. Necessite que l'auto-merge soit active dans les settings GitHub du repo.

## Rollback

Si un deploy prod casse :

```bash
# Option 1: Revert via Vercel Dashboard (instantane)
# Deployments > cliquer sur le deploy precedent > Promote to Production

# Option 2: Revert via git
git revert HEAD
git push origin main
# Vercel rebuild + Deployment Checks + promotion
```

## Environnement de staging (optionnel, Vercel Pro)

Vercel Pro permet de creer un **Custom Environment** nomme `staging` :

1. Vercel Dashboard > Project > Settings > Environments > Create Environment
2. Nom: `staging`, Branch Tracking: `staging`
3. Attacher un domaine: `staging.monprojet.com`
4. Importer les vars Preview et ajuster si necessaire

Flow avec staging :
```
feat/* → PR → main (preview)
main → staging (tests manuels, QA)
staging → production (promotion manuelle ou automatique)
```

Pour la plupart des projets MVP, le flow sans staging (PR → main → prod avec Deployment Checks) est suffisant.
