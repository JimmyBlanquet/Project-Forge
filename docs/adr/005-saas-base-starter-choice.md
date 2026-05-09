# ADR-005: Choix du Starter SaaS Base (mickasmt/next-saas-stripe-starter)

**Date:** 2026-01-18
**Statut:** Accepté
**Décideurs:** jimb, Claude Sonnet 4.5

## Contexte

Project-Forge a besoin d'un starter SaaS foundation pour:
1. Tester le workflow complet SpecKit → ralph-loop
2. Extraire des production skills validés
3. Servir de base pour futurs projets SaaS

Recherche effectuée sur 5 starters Next.js SaaS avec authentication, Stripe payments, et backend.

## Décision

Nous avons choisi **mickasmt/next-saas-stripe-starter** (TOP 3 dans la comparaison) comme starter saas-base.

**Source:** https://github.com/mickasmt/next-saas-stripe-starter

## Alternatives Considérées

### TOP 1: Next.js SaaS Starter (Official Vercel/Next.js)
- ✅ Officiel Next.js team
- ✅ Minimal et clean
- ✅ Drizzle ORM moderne
- ❌ Auth custom (pas OAuth providers)
- ❌ Pas d'email transactionnel intégré
- ❌ Pas de RBAC out-of-box
- ❌ Pas d'admin panel

### TOP 2: Stripe & Supabase SaaS Starter Kit (Vercel)
- ✅ Officiel Vercel
- ✅ Supabase Auth (OAuth providers)
- ✅ Backend complet (PostgreSQL + RLS)
- ✅ Drizzle ORM
- ⚠️ Nécessite compte Supabase
- ⚠️ Plus complexe
- ⚠️ Lock-in Supabase

### TOP 3: mickasmt/next-saas-stripe-starter ✅ CHOISI
- ✅ **Feature set le plus complet** (RBAC, Admin panel, Email templates)
- ✅ **Stack découplé** (Neon + Auth.js + Resend = flexible)
- ✅ **Neon PostgreSQL** (serverless, scale to zero, branching, cheaper)
- ✅ **Auth.js v5** (excellent OAuth support, flexible)
- ✅ **Resend** (emails transactionnels avec React Email)
- ✅ **shadcn/ui** (composants modernes)
- ✅ **Prisma ORM** (très populaire, type-safe)
- ✅ **MDX blog** avec Contentlayer
- ✅ **Production-ready** et bien documenté
- ⚠️ Communautaire (non officiel Vercel)

### TOP 4: Encore.ts SaaS Starter
- ❌ Encore.ts = nouvelle dépendance à apprendre
- ❌ Clerk = service payant
- ❌ Moins standard

### TOP 5: KolbySisk Next Supabase Stripe Starter
- ⚠️ Moins connu
- ⚠️ Maintenance communautaire incertaine

## Raisons du Choix

### 1. Feature Set Complet
- **RBAC** (Role-Based Access Control) out-of-box
- **Admin panel** pour user management
- **Email templates** avec React Email
- **MDX blog** avec Contentlayer
- **Subscription management** complet

Économise des semaines de développement vs starters minimaux.

### 2. Stack Découplé et Flexible
Au lieu du lock-in Supabase (TOP 2), stack découplé:
- **Neon PostgreSQL** (pure database, swappable)
- **Auth.js v5** (supporte 50+ providers, swappable)
- **Resend** (email service, swappable)

Plus de flexibilité pour futurs projets.

### 3. Coût et Performance
**Neon PostgreSQL:**
- Scale to zero (0$ quand inactif)
- Instant branching (dev/staging gratuit)
- Moins cher que Supabase pour petits projets
- Pas de feature overhead (vs Supabase Storage, Realtime, etc.)

**Auth.js v5:**
- Open-source, pas de coût
- Vs Clerk (payant), Supabase Auth (lock-in)

### 4. Prisma vs Drizzle
Prisma choisi car:
- Plus mature et stable
- Plus grande communauté
- Meilleure documentation
- Prisma Studio (GUI database)
- Plus de ressources d'apprentissage

Drizzle est plus récent et moins prouvé en production.

### 5. Extraction de Skills
Ce starter permet d'extraire **7 production skills** immédiatement:

**Tier 1:**
- auth-nextauth (Auth.js v5 + OAuth + RBAC)
- payments-stripe (Stripe Checkout + webhooks)
- email-resend (Resend + React Email)
- database-neon (Neon + Prisma)

**Tier 2:**
- ui-shadcn (shadcn/ui components)
- validation-patterns (Zod schemas)
- contentlayer-blog (MDX blog)

Beaucoup plus de valeur extractible vs starters minimaux.

## Conséquences

### Positives
- ✅ Feature-complete starter pour tester ralph-loop
- ✅ 7 production skills validés immédiatement
- ✅ Stack moderne et flexible
- ✅ Coûts réduits (Neon scale to zero)
- ✅ Patterns éprouvés en production
- ✅ Bonne documentation existante

### Négatives
- ⚠️ Starter communautaire (non officiel Vercel)
- ⚠️ Maintenance dépend de mickasmt
- ⚠️ Peut nécessiter updates manuelles

### Risques Mitigés
- **Risque:** Starter abandonné par maintainer
- **Mitigation:** On fork et maintient nous-mêmes
- **Mitigation:** Skills extraits sont indépendants du starter

- **Risque:** Stack découplé = plus de services à gérer
- **Mitigation:** Tous les services ont free tiers généreux
- **Mitigation:** Documentation complète dans skills

## Validation

Starter validé sur:
- ✅ 306 fichiers clonés avec succès
- ✅ Structure complète analysée
- ✅ 7 skills extraits avec succès
- ✅ Documentation créée (PROJECT_FORGE_README.md + STARTERS_COMPARISON.md)

## Références

- [STARTERS_COMPARISON.md](../../STARTERS_COMPARISON.md) - Comparaison détaillée des 5 starters
- [starters/saas-base/PROJECT_FORGE_README.md](../../starters/saas-base/PROJECT_FORGE_README.md) - Documentation starter
- Commit: f56cf34 - Add SaaS Base Starter
- Commit: 358ab67 - Add Tier 1 production skills
- Commit: 8224288 - Add Tier 2 production skills
