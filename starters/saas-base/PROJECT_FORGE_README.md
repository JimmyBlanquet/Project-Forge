# SaaS Base Starter (Project-Forge)

**Source:** [mickasmt/next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter)
**Version:** 0.3.1
**Ajouté à Project-Forge:** 2026-01-18

---

## 🎯 Pourquoi ce Starter ?

Ce starter a été choisi comme **foundation de Project-Forge** car il offre:

✅ **Stack Complet:**
- Next.js 14 (App Router)
- Neon PostgreSQL (serverless, scale to zero)
- Auth.js v5 (OAuth Google/GitHub + credentials)
- Stripe (subscriptions + webhooks)
- Resend (emails transactionnels avec React Email)
- Prisma (ORM type-safe)
- shadcn/ui (composants modernes)

✅ **Features Production-Ready:**
- RBAC (Role-Based Access Control)
- Admin panel
- User management
- Subscription management
- Billing portal
- Email templates

✅ **Development Experience:**
- TypeScript strict mode
- ESLint + Prettier
- Husky (git hooks)
- Contentlayer (MDX blog)
- Tailwind CSS

---

## 📦 Stack Technique Détaillé

### Framework & Language
- **Next.js:** 14.2.5 (App Router)
- **React:** 18.3.1
- **TypeScript:** 5.5.3 (strict mode)

### Database & ORM
- **Neon:** Serverless PostgreSQL
- **Prisma:** 5.17.0 (ORM)
- **@prisma/client:** 5.17.0

### Authentication
- **Auth.js (NextAuth):** 5.0.0-beta.19
- **@auth/prisma-adapter:** 2.4.1
- Providers: Google, GitHub, Credentials (email/password)

### Payments
- **Stripe:** 15.12.0
- Subscriptions + webhooks
- Customer portal

### Email
- **Resend:** 3.5.0
- **React Email:** 2.1.5
- **@react-email/components:** 0.0.21

### UI Components
- **shadcn/ui:** Radix UI components
- **Tailwind CSS:** 3.4.6
- **Lucide Icons:** 0.414.0
- **Framer Motion:** (animations)
- **Sonner:** 1.5.0 (toast notifications)

### Forms & Validation
- **react-hook-form:** 7.52.1
- **@hookform/resolvers:** 3.9.0
- **zod:** 3.23.8

### Content & Blog
- **contentlayer2:** 0.5.0 (MDX processing)
- **next-contentlayer2:** 0.5.0
- Syntax highlighting (shiki)
- Table of contents (mdast-util-toc)

### Analytics & Monitoring
- **@vercel/analytics:** 1.3.1
- **@vercel/og:** 0.6.2 (Open Graph images)

### Code Quality
- **ESLint:** 8.57.0
- **Prettier:** 3.3.3
- **Husky:** 9.1.1 (git hooks)
- **Commitlint:** 19.3.0 (conventional commits)

---

## 🗂️ Structure du Projet

```
starters/saas-base/
├── actions/              # Server Actions (Next.js)
├── app/                  # App Router (Next.js 14)
│   ├── (admin)/         # Admin routes (protected)
│   ├── (auth)/          # Auth routes (login, register)
│   ├── (dashboard)/     # Dashboard routes (protected)
│   ├── (marketing)/     # Public marketing pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── assets/              # Static assets
├── components/          # React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   ├── sections/        # Page sections
│   └── ui/              # shadcn/ui components
├── config/              # Configuration files
│   ├── site.ts          # Site config
│   ├── subscriptions.ts # Stripe plans config
│   └── dashboard.ts     # Dashboard config
├── content/             # MDX content (blog, docs)
├── emails/              # React Email templates
├── hooks/               # Custom React hooks
├── lib/                 # Utilities & helpers
│   ├── auth.ts          # Auth helpers
│   ├── db.ts            # Prisma client
│   ├── stripe.ts        # Stripe helpers
│   └── validations/     # Zod schemas
├── prisma/              # Prisma schema & migrations
│   └── schema.prisma    # Database schema
├── public/              # Public static files
├── styles/              # Global styles
├── types/               # TypeScript types
├── auth.ts              # Auth.js configuration
├── auth.config.ts       # Auth.js config
├── middleware.ts        # Next.js middleware (auth guard)
├── .env.example         # Environment variables template
└── package.json         # Dependencies
```

---

## 🚀 Installation & Setup

### Prérequis
- Node.js 20+ (voir `.nvmrc`)
- pnpm 8+
- Compte Neon (PostgreSQL)
- Compte Stripe
- Compte Resend (emails)
- OAuth Apps (Google, GitHub optionnel)

### Setup Rapide

```bash
cd starters/saas-base

# 1. Installer dépendances
pnpm install

# 2. Configurer environnement
cp .env.example .env.local
# Éditer .env.local avec tes credentials

# 3. Setup Prisma
pnpm prisma generate
pnpm prisma db push

# 4. Lancer dev server
pnpm dev
```

### Variables d'Environnement Requises

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (optionnel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID="price_..."
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID="price_..."

# Resend (emails)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

---

## 📋 Scripts Disponibles

```bash
# Development
pnpm dev          # Start dev server (localhost:3000)
pnpm turbo        # Start with Turbo (faster HMR)

# Build
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build + start (preview prod)

# Code Quality
pnpm lint         # Run ESLint
# Prettier runs via git hooks (Husky)

# Email Development
pnpm email        # Preview emails (localhost:3333)

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema to DB
pnpm prisma studio    # Open Prisma Studio
```

---

## 🎨 Features Incluses

### Authentication (Auth.js v5)
- ✅ Email/password (credentials)
- ✅ OAuth (Google, GitHub)
- ✅ Session management (JWT)
- ✅ Protected routes (middleware)
- ✅ Role-based access (RBAC)

### User Management
- ✅ User registration
- ✅ User profile
- ✅ User settings
- ✅ Role assignment (USER, ADMIN)

### Subscriptions (Stripe)
- ✅ Multiple plans (monthly, yearly)
- ✅ Checkout flow
- ✅ Webhook handling
- ✅ Customer portal
- ✅ Subscription management
- ✅ Cancel/upgrade/downgrade

### Admin Panel
- ✅ User management
- ✅ Subscription overview
- ✅ Analytics dashboard
- ✅ Protected admin routes

### Email (Resend + React Email)
- ✅ Welcome email
- ✅ Magic link email
- ✅ Newsletter
- ✅ Subscription confirmations
- ✅ Templates with React components

### Content (Contentlayer)
- ✅ MDX blog
- ✅ Syntax highlighting
- ✅ Table of contents
- ✅ Automatic sitemap

### UI/UX
- ✅ Responsive design
- ✅ Dark mode (next-themes)
- ✅ Toast notifications (Sonner)
- ✅ Loading states
- ✅ Error handling
- ✅ Form validation

---

## 🔄 Intégration avec Project-Forge

### Utilisation avec SpecKit → Ralph++

Ce starter est la **foundation** pour tester le workflow complet:

```bash
# 1. Créer nouvelle feature
cd starters/saas-base
/speckit.specify "Add user profile customization"

# 2. Planifier
/speckit.plan

# 3. Générer tâches
/speckit.tasks

# 4. Convertir en sub-stories
/speckit.convert

# 5. Implémenter avec Ralph++
/ralph-loop --max-iterations 20
```

### Skills à Créer (basés sur ce starter)

- `skills/auth-nextauth/` - Auth.js v5 setup
- `skills/payments-stripe/` - Stripe integration
- `skills/email-resend/` - Resend + React Email
- `skills/database-neon/` - Neon PostgreSQL setup
- `skills/ui-shadcn/` - shadcn/ui components

---

## 📝 Notes de Migration

### Différences vs Supabase

Si tu veux migrer vers Supabase plus tard:
- Remplacer Neon → Supabase PostgreSQL
- Remplacer Auth.js → Supabase Auth
- Remplacer Prisma → Supabase client (optionnel)
- Ajouter Supabase Storage
- Ajouter Supabase Realtime

### Customizations Possibles

- **Database:** Swap Neon pour Supabase, Railway, PlanetScale
- **Auth:** Swap Auth.js pour Clerk, Supabase Auth
- **Email:** Swap Resend pour Postmark, SendGrid
- **Payments:** Ajouter Lemon Squeezy, Paddle

---

## 🔗 Liens Utiles

- **Demo:** https://next-saas-stripe-starter.vercel.app
- **Repo Original:** https://github.com/mickasmt/next-saas-stripe-starter
- **Docs Next.js 14:** https://nextjs.org/docs
- **Docs Auth.js:** https://authjs.dev
- **Docs Prisma:** https://www.prisma.io/docs
- **Docs Stripe:** https://stripe.com/docs
- **Docs Resend:** https://resend.com/docs
- **Docs shadcn/ui:** https://ui.shadcn.com

---

## ✅ Prochaines Étapes

1. **Setup complet:** Configurer .env.local avec tes credentials
2. **Test local:** Lancer pnpm dev et tester auth + stripe
3. **Test SpecKit:** Créer une petite feature avec workflow complet
4. **Test Ralph++:** Valider /ralph-loop sur cette codebase
5. **Créer skills:** Extraire patterns en skills réutilisables

---

**Dernière mise à jour:** 2026-01-18
**Maintenu par:** Project-Forge Team
