# SaaS Starter (Project-Forge)

**Source:** [nextjs/saas-starter](https://github.com/nextjs/saas-starter)
**Commit:** 15.6.0-canary (Dec 2025)
**Adapted by Project-Forge:** 2026-03-27

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **ORM** | Drizzle ORM 0.43+ |
| **Auth** | Supabase Auth (email/password, OAuth ready) |
| **Payments** | Stripe (Checkout, webhooks, customer portal) |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS 4 |
| **Validation** | Zod |
| **Database** | PostgreSQL (Supabase, Neon, or any provider) |

## Project-Forge Additions

- **Testing**: vitest + Playwright E2E + architecture fitness tests
- **Quality**: jscpd, knip, eslint-plugin-sonarjs
- **CI/CD**: GitHub Actions (lint, quality, unit, e2e, build)
- **Hooks**: workflow-gate, test-reminder, protect-speckit-tests
- **Maintenance**: renovate.json, commitlint, husky
- **Templates**: ADR scaffold, PR template, RUNBOOK, POST-MORTEM
- **Error handling**: error.tsx, global-error.tsx, not-found.tsx
- **Health**: /api/health endpoint (DB ping)

## Differences from Original

1. **Auth**: Custom JWT replaced by Supabase Auth
2. **Quality tooling**: Added vitest, Playwright, jscpd, knip, eslint-sonarjs
3. **CI/CD**: Added GitHub Actions workflows
4. **Error boundaries**: Added error.tsx, global-error.tsx
5. **Health endpoint**: Added /api/health
6. **Env config**: Expanded for Supabase + Resend + Sentry
