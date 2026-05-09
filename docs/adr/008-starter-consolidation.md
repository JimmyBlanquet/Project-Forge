# ADR-008: Consolidation des starters en un seul starter unifie

**Date:** 2026-03-27
**Status:** Accepte
**Decideurs:** jimb, Claude

## Contexte

Project-Forge maintenait 2 starters basés sur des upstreams morts :
- `saas-base` : mickasmt/next-saas-stripe-starter — dernier commit juillet 2024
- `supabase-stripe` : dzlau/stripe-supabase-saas-template — dernier commit decembre 2025

Analyse du marche (mars 2026) : aucun starter open-source ne combine Next.js 15 + Drizzle + Auth flexible + Stripe + tests. Vercel a publie `nextjs/saas-starter` (15.5K stars) comme reference officielle, mais volontairement minimaliste.

## Decision

Creer un nouveau starter `saas` basé sur l'architecture `nextjs/saas-starter`, enrichi avec le tooling PF. Les anciens starters sont marques comme legacy.

**Stack :** Next.js 15, Drizzle ORM 0.43, Supabase Auth, Stripe 18, Tailwind CSS 4, shadcn/ui

## Consequences

### Positives
- Un seul ORM (Drizzle) dans tout l'ecosysteme PF
- Next.js 15 + Tailwind 4 (versions modernes)
- Maintenance simplifiee (1 starter au lieu de 2)
- Base Vercel officielle (patterns de reference)

### Negatives
- Les projets enfants existants restent sur les anciens stacks
- Le starter `saas` n'est pas encore teste en production

### Risques
- Tailwind 4 breaking changes vs les composants shadcn/ui existants
- Next.js 15 canary dependencies dans l'upstream original (pin sur stable 15.3.3)

## Alternatives Considerees

### Garder 2 starters
- **Pourquoi rejetee :** double maintenance sur des upstreams morts

### Forker ixartz/SaaS-Boilerplate
- **Pourquoi rejetee :** utilise Clerk (payant/vendor lock-in), free tier sur Next.js 14

## References

- https://github.com/nextjs/saas-starter
- Ticket #49
