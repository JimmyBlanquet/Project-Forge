# Implementation Tasks: Auth System

**Version:** 1.0.0
**Date:** 2026-01-18
**Based on:**
- Constitution: `constitution.yml`
- Specification: `spec.md`
- Plan: `plan.md`

---

## Phase 1: Setup

- [ ] T001 Initialize Next.js 14 project with App Router in project root
- [ ] T002 [P] Configure TypeScript strict mode in tsconfig.json
- [ ] T003 [P] Install and configure Tailwind CSS in tailwind.config.ts
- [ ] T004 Configure ESLint and Prettier
- [ ] T005 Set up Supabase project and copy credentials to .env.local

## Phase 2: Foundational

- [ ] T006 Create Supabase client utility in src/lib/supabase/client.ts
- [ ] T007 [P] Create types for auth responses in src/types/auth.ts
- [ ] T008 Set up database connection test in src/lib/supabase/test.ts

## Phase 3: User Story 1 - Sign Up with Email/Password (P1)

- [ ] T009 [P] [US1] Create signup page component in app/signup/page.tsx
- [ ] T010 [P] [US1] Add signup form with email/password fields in components/SignupForm.tsx
- [ ] T011 [US1] Implement signup handler using Supabase auth.signUp in actions/auth.ts
- [ ] T012 [US1] Add form validation with zod in lib/validations/auth.ts
- [ ] T013 [US1] Create error handling for signup in components/SignupForm.tsx
- [ ] T014 [US1] Verify signup flow in browser using dev-browser skill

## Phase 4: User Story 2 - Sign In with Email/Password (P1)

- [ ] T015 [P] [US2] Create login page component in app/login/page.tsx
- [ ] T016 [P] [US2] Add login form in components/LoginForm.tsx
- [ ] T017 [US2] Implement login handler using Supabase auth.signInWithPassword in actions/auth.ts
- [ ] T018 [US2] Add session storage handling in lib/session.ts
- [ ] T019 [US2] Verify login flow in browser using dev-browser skill

## Phase 5: User Story 3 - Sign Out (P1)

- [ ] T020 [P] [US3] Create logout button component in components/LogoutButton.tsx
- [ ] T021 [US3] Implement logout handler using Supabase auth.signOut in actions/auth.ts
- [ ] T022 [US3] Add logout to navigation in components/Nav.tsx
- [ ] T023 [US3] Verify logout clears session in browser using dev-browser skill

## Phase 6: Polish

- [ ] T024 [P] Add loading states to auth forms
- [ ] T025 [P] Improve error messages
- [ ] T026 Update README.md with setup instructions
- [ ] T027 Add TESTING.md with manual test scenarios
