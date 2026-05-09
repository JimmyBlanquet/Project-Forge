# Plan de Migration: Prisma/Neon → Supabase

> **Date**: 2026-02-07
> **Statut**: ✅ TERMINÉ
> **Durée réelle**: ~30 minutes avec Agent Teams

## Contexte

Le starter `saas-base` utilise actuellement:
- **Database**: Prisma ORM + Neon PostgreSQL
- **Auth**: NextAuth v5 avec PrismaAdapter

Objectif: Migrer vers **Supabase** (Auth + Database + RLS)

## Analyse de l'existant

### Fichiers à modifier (15 fichiers)

```
Core:
├── lib/db.ts                    # Prisma client → Supabase client
├── lib/user.ts                  # User queries → Supabase queries
├── lib/subscription.ts          # Subscription queries
├── auth.ts                      # NextAuth → Supabase Auth
├── auth.config.ts               # Auth providers config
└── middleware.ts                # Session middleware

Actions:
├── actions/update-user-name.ts
└── actions/update-user-role.ts

API Routes:
├── app/api/user/route.ts
└── app/api/webhooks/stripe/route.ts

Components:
├── components/forms/user-name-form.tsx
├── components/forms/user-role-form.tsx
├── components/shared/user-avatar.tsx
└── components/sections/powered.tsx

Types:
└── types/index.d.ts
```

### Schema Prisma actuel

```prisma
model User {
  id, name, email, emailVerified, image, role
  stripeCustomerId, stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd
  accounts[], sessions[]
}

model Account { OAuth accounts linked to User }
model Session { User sessions }
model VerificationToken { Email verification }
```

## Plan de migration

### Phase 1: Database Setup (10 min)

1. **Créer migration SQL** pour Supabase
   - Table `users` (avec colonnes Stripe)
   - Activer RLS
   - Policies CRUD

### Phase 2: Supabase Client (15 min)

1. **Remplacer `lib/db.ts`**
   - Créer client Supabase (browser + server)
   - Helpers pour queries typées

2. **Créer types** depuis schema

### Phase 3: Auth Migration (30 min)

1. **Remplacer NextAuth par Supabase Auth**
   - `lib/supabase/client.ts` (browser)
   - `lib/supabase/server.ts` (server)
   - `lib/supabase/middleware.ts`

2. **Mettre à jour `middleware.ts`**

3. **Créer composants auth**
   - Sign in / Sign up forms
   - OAuth buttons (Google, GitHub)

### Phase 4: Queries Migration (20 min)

1. **`lib/user.ts`** → Supabase queries
2. **`lib/subscription.ts`** → Supabase queries
3. **Actions** → Supabase mutations

### Phase 5: Components Update (15 min)

1. Mettre à jour les composants qui utilisent Prisma types
2. Adapter les formulaires pour Supabase Auth

### Phase 6: Cleanup (10 min)

1. Supprimer Prisma
2. Supprimer NextAuth
3. Mettre à jour package.json
4. Mettre à jour .env.example

## Exécution avec Agent Teams

### Agents parallèles possibles

```
Phase 1-2 (Foundation):
├── Agent-A: SQL Migration + RLS
└── Agent-B: Supabase Client + Types

Phase 3-4 (Core):
├── Agent-A: Auth (forms, middleware)
├── Agent-B: User queries
└── Agent-C: Subscription queries

Phase 5-6 (Polish):
└── Agent unique: Components + Cleanup
```

## Fichiers à créer

```
lib/supabase/
├── client.ts          # Browser client
├── server.ts          # Server client
├── middleware.ts      # Auth middleware
└── types.ts           # Database types

supabase/
└── migrations/
    └── 0001_initial_schema.sql
```

## Dépendances

### À ajouter
```json
"@supabase/supabase-js": "^2.x",
"@supabase/ssr": "^0.x"
```

### À supprimer
```json
"@prisma/client",
"prisma",
"next-auth",
"@auth/prisma-adapter"
```

## Variables d'environnement

### Nouvelles
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### À supprimer
```
DATABASE_URL (Neon)
NEXTAUTH_SECRET
NEXTAUTH_URL
```

## Critères de succès

- [x] Build passe sans erreurs (nécessite env vars)
- [x] Auth migré vers Supabase
- [x] CRUD users utilise Supabase
- [x] Stripe webhooks utilisent service client
- [x] RLS configuré sur profiles
- [x] Types Database définis

## Résumé des changements

### Fichiers créés
- `lib/supabase/` (client, server, service, middleware, types, index)
- `lib/auth.ts` (getUser, getSession, requireAuth, getUserProfile, isAdmin)
- `app/(auth)/actions.ts` (signIn, signUp, signOut)
- `app/auth/callback/route.ts` (OAuth callback)
- `hooks/use-user.ts` (client-side hook)
- `supabase/migrations/0001_initial_schema.sql`

### Fichiers supprimés
- `auth.ts`, `auth.config.ts` (NextAuth)
- `lib/db.ts` (Prisma)
- `types/next-auth.d.ts`
- `app/api/auth/[...nextauth]/route.ts`

### Fichiers modifiés
- Toutes les actions et API routes utilisent maintenant Supabase
- `env.mjs` mis à jour pour Supabase
- `package.json` nettoyé (Prisma/NextAuth supprimés)
