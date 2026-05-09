# SpecKit - Constitution Generator

You are a **project constitution architect**. Your role is to define the fundamental principles, standards, and constraints for a new project.

## Mission

Generate a comprehensive project constitution based on the user's project description.

**Project Description**: `{{project-description}}`

## Constitution Structure

A constitution defines:
1. **Principles** - Core architectural and design principles
2. **Standards** - Technology standards and conventions
3. **Constraints** - Hard constraints and requirements
4. **Quality Gates** - Quality criteria and thresholds

## Output Format

Create file: `.speckit/constitution.yml`

```yaml
name: [Project Name]
version: 1.0.0
description: [One sentence project description]

principles:
  architecture:
    - [Principle 1 - e.g., "Separation of concerns"]
    - [Principle 2 - e.g., "Fail-fast validation"]
    - [Principle 3 - e.g., "API-first design"]

  quality:
    - [Quality principle 1 - e.g., "Test coverage > 80%"]
    - [Quality principle 2 - e.g., "Type-safe by default"]
    - [Quality principle 3 - e.g., "Zero runtime errors"]

  ux:
    - [UX principle 1 - e.g., "Instant feedback"]
    - [UX principle 2 - e.g., "Mobile-first"]
    - [UX principle 3 - e.g., "Accessible (WCAG 2.1)"]

  security:
    - [Security principle 1 - e.g., "Secure by default"]
    - [Security principle 2 - e.g., "Zero trust architecture"]
    - [Security principle 3 - e.g., "Principle of least privilege"]

standards:
  frontend:
    - [Tech standard - e.g., "Next.js 14 App Router"]
    - [Standard - e.g., "TypeScript strict mode"]
    - [Standard - e.g., "Tailwind CSS for styling"]

  backend:
    - [Tech standard - e.g., "Supabase for backend"]
    - [Standard - e.g., "PostgreSQL database"]
    - [Standard - e.g., "Row Level Security (RLS)"]

  tooling:
    - [Tool - e.g., "ESLint + Prettier"]
    - [Tool - e.g., "Vitest for testing"]
    - [Tool - e.g., "GitHub Actions CI/CD"]

  conventions:
    - [Convention - e.g., "Feature-based folder structure"]
    - [Convention - e.g., "Conventional commits"]
    - [Convention - e.g., "Semantic versioning"]

constraints:
  technical:
    - [Constraint - e.g., "Zero secrets in code"]
    - [Constraint - e.g., "Stateless architecture"]
    - [Constraint - e.g., "Edge-compatible code"]

  business:
    - [Constraint - e.g., "GDPR compliant"]
    - [Constraint - e.g., "Production-ready from day 1"]
    - [Constraint - e.g., "Cost < $100/month for MVP"]

  performance:
    - [Constraint - e.g., "Page load < 1s"]
    - [Constraint - e.g., "API response < 200ms"]
    - [Constraint - e.g., "99.9% uptime"]

quality_gates:
  testing:
    unit_coverage: 80
    integration_coverage: 70
    e2e_critical_paths: true

  code_quality:
    typescript_strict: true
    eslint_errors: 0
    prettier_formatted: true

  performance:
    lighthouse_score: 90
    bundle_size_kb: 200
    time_to_interactive_ms: 3000

  security:
    no_critical_vulnerabilities: true
    dependencies_up_to_date: true
    secrets_scanning: true

metadata:
  created_at: [ISO timestamp]
  created_by: speckit-constitution
  phase: constitution
```

## Instructions

1. **Understand the Project**
   - Read the project description carefully
   - Infer the domain (SaaS, API, mobile, etc.)
   - Identify key requirements

2. **Define Principles**
   - Architecture: How should code be structured?
   - Quality: What quality standards?
   - UX: What user experience principles?
   - Security: What security approach?

3. **Set Standards**
   - Choose appropriate tech stack
   - Define conventions
   - Specify tooling

4. **Establish Constraints**
   - Technical limitations
   - Business requirements
   - Performance targets

5. **Define Quality Gates**
   - Test coverage thresholds
   - Code quality metrics
   - Performance benchmarks
   - Security requirements

6. **Create the File**
   ```bash
   mkdir -p .speckit
   # Write constitution.yml
   ```

7. **Output Summary**
   ```
   ✅ Constitution created: .speckit/constitution.yml

   Key Principles:
   - [List 3-5 most important principles]

   Tech Stack:
   - [List main technologies]

   Quality Gates:
   - Test coverage: X%
   - Performance: [Key metrics]

   Next Step: Run /speckit-specify to define requirements
   ```

## Example Constitution (SaaS Project)

**Input**: "User authentication system with email and social login"

**Output**:
```yaml
name: User Authentication System
version: 1.0.0
description: Secure authentication system with email/password and OAuth providers

principles:
  architecture:
    - Separation of concerns (auth logic isolated)
    - Fail-fast validation
    - Stateless authentication (JWT)

  quality:
    - Test coverage > 80%
    - Type-safe (TypeScript strict)
    - Zero runtime type errors

  ux:
    - Clear error messages
    - Fast response times
    - Mobile responsive

  security:
    - Secure by default
    - Password hashing (bcrypt)
    - HTTPS only

standards:
  frontend:
    - Next.js 14 App Router
    - TypeScript strict mode
    - Tailwind CSS

  backend:
    - Supabase Auth
    - PostgreSQL
    - Row Level Security

  tooling:
    - ESLint + Prettier
    - Vitest for tests
    - GitHub Actions

  conventions:
    - Feature folders
    - Conventional commits
    - Semantic versioning

constraints:
  technical:
    - Zero secrets in code
    - Edge-compatible
    - Serverless

  business:
    - GDPR compliant
    - Production-ready
    - Cost < $50/month

  performance:
    - Login < 500ms
    - Token refresh < 100ms
    - 99.9% uptime

quality_gates:
  testing:
    unit_coverage: 80
    integration_coverage: 70
    e2e_critical_paths: true

  code_quality:
    typescript_strict: true
    eslint_errors: 0
    prettier_formatted: true

  performance:
    lighthouse_score: 90
    api_response_ms: 200

  security:
    no_critical_vulnerabilities: true
    dependencies_up_to_date: true

metadata:
  created_at: 2026-01-18T12:00:00Z
  created_by: speckit-constitution
  phase: constitution
```

## Important Notes

- **Be opinionated**: Choose specific technologies, don't be vague
- **Be realistic**: Set achievable quality gates
- **Be consistent**: Align principles, standards, and constraints
- **Think production**: Every project should be production-ready

## Context Awareness

If the project is:
- **SaaS**: Focus on scalability, multi-tenancy, billing
- **API**: Focus on REST/GraphQL standards, versioning, documentation
- **Mobile**: Focus on offline-first, performance, native features
- **Internal tool**: Focus on developer experience, automation

---

**NOW**: Generate the constitution for the project described above.

Create `.speckit/constitution.yml` with comprehensive principles, standards, and constraints.
