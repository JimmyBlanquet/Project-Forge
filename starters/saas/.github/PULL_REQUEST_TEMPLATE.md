## Description

<!-- What does this PR do? Why? -->

## Checklist

### Code Quality
- [ ] TypeScript: no `any`, proper types
- [ ] No console.log left (use proper logging)
- [ ] Error handling via `withErrorHandler()` on API routes

### Testing
- [ ] Unit tests added/updated
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Quality scan passes (`pnpm quality:scan`)

### Database
- [ ] Drizzle migration generated if schema changed (`pnpm db:generate`)
- [ ] Migration tested locally
- [ ] RLS policies reviewed if new tables

### Security
- [ ] Input validated with Zod on API routes
- [ ] No secrets in code (use env vars)
- [ ] Rate limiting on public endpoints

### Deployment
- [ ] Environment variables documented if new ones added
- [ ] Vercel preview tested
