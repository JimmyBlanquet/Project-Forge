# Comparaison Starters Next.js SaaS

**Date:** 2026-01-18
**Recherche:** Starters avec Authentication + Stripe + Backend

---

## 🥇 TOP 1: Next.js SaaS Starter (Official Vercel/Next.js)

**Repository:** https://github.com/nextjs/saas-starter
**Demo:** https://next-saas-start.vercel.app/
**Template Vercel:** https://vercel.com/templates/next.js/next-js-saas-starter

### Stack Technique
- **Framework:** Next.js 14 (App Router)
- **Database:** Postgres
- **ORM:** Drizzle
- **Auth:** Email/password avec JWT (cookies)
- **Payments:** Stripe Checkout + Customer Portal
- **UI:** shadcn/ui
- **Déploiement:** Vercel

### Fonctionnalités
✅ Landing page marketing
✅ Pricing page → Stripe Checkout
✅ Dashboard avec CRUD users/teams
✅ RBAC basique (Owner, Member roles)
✅ Subscription management (Stripe Customer Portal)
✅ Email/password authentication

### Avantages
- ✅ **Officiel** (maintenu par l'équipe Next.js)
- ✅ **Minimal mais complet** (pas de bloat)
- ✅ **shadcn/ui** (composants modernes)
- ✅ **Drizzle ORM** (type-safe, moderne)
- ✅ **Un seul click deploy** sur Vercel

### Inconvénients
- ⚠️ Auth custom (pas Supabase/Clerk)
- ⚠️ Pas d'OAuth providers (Google, GitHub)
- ⚠️ Pas de email transactionnel intégré

### Recommandation
🎯 **MEILLEUR CHOIX** si tu veux partir de l'officiel Vercel avec le minimum de dépendances.

---

## 🥈 TOP 2: Stripe & Supabase SaaS Starter Kit (Vercel)

**Template Vercel:** https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit
**Repository:** https://github.com/vercel/nextjs-subscription-payments

### Stack Technique
- **Framework:** Next.js 14
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle
- **Auth:** Supabase Auth (OAuth, magic links, password reset)
- **Payments:** Stripe (subscriptions + webhooks)
- **UI:** Tailwind CSS
- **Déploiement:** Vercel

### Fonctionnalités
✅ Landing page
✅ Supabase Auth complet (OAuth Google/GitHub, magic links, reset password)
✅ PostgreSQL avec DrizzleORM
✅ Stripe subscriptions + webhooks
✅ Customer portal pour gérer subscriptions
✅ Email transactionnel

### Avantages
- ✅ **Supabase Auth** (OAuth providers inclus)
- ✅ **Backend Supabase** (PostgreSQL + Row Level Security)
- ✅ **Auth flows complets** (reset password, magic links)
- ✅ **Officiel Vercel**
- ✅ **Drizzle ORM** (moderne)

### Inconvénients
- ⚠️ Nécessite compte Supabase
- ⚠️ Un peu plus complexe que TOP 1

### Recommandation
🎯 **MEILLEUR CHOIX** si tu veux **Supabase comme backend** (PostgreSQL + Auth + RLS).

---

## 🥉 TOP 3: Next SaaS Stripe Starter (mickasmt)

**Repository:** https://github.com/mickasmt/next-saas-stripe-starter
**Demo:** https://www.shadcn.io/template/mickasmt-next-saas-stripe-starter

### Stack Technique
- **Framework:** Next.js 14
- **Database:** Neon (PostgreSQL serverless)
- **ORM:** Prisma
- **Auth:** Auth.js v5 (NextAuth)
- **Payments:** Stripe + webhooks
- **Email:** Resend + React Email
- **UI:** shadcn/ui
- **Déploiement:** Vercel

### Fonctionnalités
✅ Auth avec multiple providers (Google, GitHub, etc.)
✅ Role-based access control (RBAC)
✅ Subscription management
✅ Stripe webhooks
✅ Customer billing portal
✅ Transactional emails (Resend)
✅ Admin panel

### Avantages
- ✅ **Très complet** (RBAC, admin panel)
- ✅ **Auth.js v5** (multiple OAuth providers)
- ✅ **Resend** intégré (emails transactionnels)
- ✅ **shadcn/ui**
- ✅ **Open-source** et bien documenté

### Inconvénients
- ⚠️ Plus de dépendances (Prisma, Neon, Resend)
- ⚠️ Moins "officiel" que Vercel
- ⚠️ Auth.js au lieu de Supabase

### Recommandation
🎯 **BON CHOIX** si tu veux un starter **très complet** avec RBAC et admin panel.

---

## 🏅 TOP 4: Encore.ts SaaS Starter

**Template:** https://encore.dev/templates/saas-starter

### Stack Technique
- **Framework:** Next.js
- **Backend:** Encore.ts (backend framework TypeScript)
- **Auth:** Clerk
- **Payments:** Stripe
- **UI:** Tailwind + shadcn/ui

### Fonctionnalités
✅ Backend TypeScript avec Encore.ts
✅ Clerk pour auth (moderne, UI components)
✅ Stripe integration
✅ API type-safe

### Avantages
- ✅ **Encore.ts** (backend framework moderne)
- ✅ **Clerk** (auth moderne avec UI components)
- ✅ **Type-safe** end-to-end

### Inconvénients
- ⚠️ Encore.ts = nouvelle dépendance à apprendre
- ⚠️ Clerk = service payant
- ⚠️ Moins standard que Next.js pur

### Recommandation
🤔 **À considérer** si tu veux découvrir Encore.ts, sinon passe ton chemin.

---

## 🏅 TOP 5: KolbySisk Next Supabase Stripe Starter

**Repository:** https://github.com/KolbySisk/next-supabase-stripe-starter

### Stack Technique
- **Framework:** Next.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **UI:** shadcn/ui

### Fonctionnalités
✅ Supabase Auth + Database
✅ Stripe subscriptions
✅ shadcn/ui
✅ Quality focus ("highest quality SaaS starter")

### Avantages
- ✅ **Supabase + Stripe** (stack populaire)
- ✅ **shadcn/ui**
- ✅ **Focus qualité**

### Inconvénients
- ⚠️ Moins connu que les officiels Vercel
- ⚠️ Maintenance communautaire

### Recommandation
🤔 **Alternative** au TOP 2 si tu préfères un starter communautaire.

---

## 📊 Tableau Comparatif

| Critère | TOP 1 (Official) | TOP 2 (Supabase) | TOP 3 (mickasmt) |
|---------|------------------|------------------|------------------|
| **Officiel** | ✅ Next.js team | ✅ Vercel | ❌ Communauté |
| **Auth** | Email/password | Supabase (OAuth) | Auth.js v5 |
| **Database** | Postgres + Drizzle | Supabase + Drizzle | Neon + Prisma |
| **Backend** | Minimal | Supabase (complet) | Minimal |
| **OAuth Providers** | ❌ | ✅ Google, GitHub | ✅ Multiple |
| **Email** | ❌ | ⚠️ Basique | ✅ Resend |
| **RBAC** | ✅ Basique | ⚠️ À implémenter | ✅ Complet |
| **Complexité** | 🟢 Simple | 🟡 Moyenne | 🟡 Moyenne |
| **Dépendances** | 🟢 Minimal | 🟡 Supabase | 🟡 Neon+Resend |
| **Deploy** | ✅ 1-click Vercel | ✅ 1-click Vercel | ✅ 1-click Vercel |

---

## 🎯 MA RECOMMANDATION FINALE

### Pour Project-Forge, je recommande: **TOP 2 - Stripe & Supabase SaaS Starter Kit**

**Pourquoi ?**

1. ✅ **Backend complet** (Supabase = PostgreSQL + Auth + RLS + Storage)
2. ✅ **Auth production-ready** (OAuth Google/GitHub + magic links + reset password)
3. ✅ **Stack moderne** (Next.js 14 + Drizzle + Stripe)
4. ✅ **Officiel Vercel** (maintenu, à jour)
5. ✅ **Foundation solide** pour tester Ralph++ loop
6. ✅ **Extensible** avec skills (auth-supabase, payments-stripe)

**Plan d'action:**

```bash
# 1. Deploy le starter Vercel
# Via: https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit

# 2. Clone dans starters/saas-base/
git clone <url> starters/saas-base

# 3. Test workflow SpecKit → Ralph++
cd starters/saas-base
/speckit.specify "Add user profile page"
/speckit.plan
/speckit.tasks
/speckit.convert
/ralph-loop --max-iterations 5
```

**Alternative si tu veux plus simple:**

- **TOP 1** si tu veux le **minimum** (pas de Supabase, auth custom)
- **TOP 3** si tu veux **RBAC + Admin panel** out-of-the-box

---

## Sources

- [Next.js SaaS Starter (Official)](https://github.com/nextjs/saas-starter)
- [Stripe & Supabase SaaS Starter Kit](https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit)
- [Next SaaS Stripe Starter (mickasmt)](https://github.com/mickasmt/next-saas-stripe-starter)
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments)
- [Encore.ts SaaS Starter](https://encore.dev/templates/saas-starter)
- [KolbySisk Next Supabase Stripe Starter](https://github.com/KolbySisk/next-supabase-stripe-starter)
- [Vercel Templates Collection](https://vercel.com/templates/authentication/next-js-saas-starter)
- [StarterIndex - Next.js Supabase Boilerplates](https://starterindex.com/nextjs+supabase-boilerplates)
