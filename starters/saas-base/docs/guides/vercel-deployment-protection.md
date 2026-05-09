# Vercel Deployment Protection

Guide pour configurer la protection des deployments Vercel (Pro plan requis).

## Activer la protection des previews

1. **Dashboard Vercel** → Project Settings → Deployment Protection
2. Activer **"Standard Protection"** sur les Preview deployments
3. Laisser Production sur **"None"** (publique)

Ceci requiert une authentification Vercel pour accéder aux URLs de preview. Les utilisateurs non-authentifiés voient une page de login Vercel.

## Configurer le bypass pour le CI

Les tests E2E Playwright doivent accéder aux previews en CI. Vercel Pro permet un bypass via query param.

### Étape 1 : Créer un secret de bypass

1. Dashboard Vercel → Project Settings → Deployment Protection
2. Section **"Protection Bypass for Automation"**
3. Cliquer **"Generate Secret"**
4. Copier le secret généré

### Étape 2 : Ajouter le secret dans GitHub

1. GitHub → Repo Settings → Secrets and variables → Actions
2. Ajouter un secret : `VERCEL_BYPASS_SECRET` avec la valeur copiée

### Étape 3 : Utilisation dans les tests

Le workflow `e2e-staging.yml` passe automatiquement le secret en variable d'environnement `VERCEL_BYPASS_SECRET`.

Dans `playwright.config.ts`, si vous utilisez la protection :

```typescript
const bypassSecret = process.env.VERCEL_BYPASS_SECRET;
const baseURL = bypassSecret
  ? `${process.env.BASE_URL}?x-vercel-protection-bypass=${bypassSecret}`
  : process.env.BASE_URL || 'http://localhost:3000';
```

## Rétrocompatibilité

Si `VERCEL_BYPASS_SECRET` n'est pas configuré :
- Les previews restent accessibles publiquement (pas de protection active)
- Le CI fonctionne normalement
- Aucune erreur n'est générée

## Limites

- La protection Standard nécessite un compte Vercel pour accéder aux previews
- Le bypass via query param est disponible sur Vercel **Pro**
- Le bypass via header (`x-vercel-protection-bypass`) nécessite Vercel **Enterprise**
