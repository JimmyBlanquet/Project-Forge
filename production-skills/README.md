# Production Skills

Production-ready, validated skills extracted from real SaaS starters.

## Overview

This directory contains **Tier 1** production skills that have been:
- ✅ **Validated** - Extracted from working SaaS starter projects
- ✅ **Production-tested** - Used in real production environments
- ✅ **Well-documented** - Complete implementation guides
- ✅ **Quality-gated** - Clear acceptance criteria

## Available Skills

### Tier 1: Core SaaS Infrastructure

| Skill | Description | Dependencies |
|-------|-------------|--------------|
| **auth-nextauth** | Auth.js v5 with OAuth, magic links, RBAC | database-neon |
| **payments-stripe** | Stripe subscriptions, webhooks, customer portal | database-neon, (auth-nextauth) |
| **email-resend** | Resend + React Email for transactional emails | (auth-nextauth) |
| **database-neon** | Neon PostgreSQL + Prisma ORM | - |

### Tier 2: Frequently Used Patterns

| Skill | Description | Dependencies |
|-------|-------------|--------------|
| **ui-shadcn** | shadcn/ui components with Tailwind + dark mode | - |
| **validation-patterns** | Zod schemas for forms and API validation | - |
| **contentlayer-blog** | MDX blog with syntax highlighting + ToC | - |

## Skill Structure

Each skill follows this structure:

```
skill-name/
├── manifest.yaml          # Metadata, dependencies, usage example
├── prompt.md              # Complete implementation guide
└── templates/             # Reference implementation files
    ├── file1.ts
    └── file2.tsx
```

### manifest.yaml

Contains:
- Name, version, description
- Tier (1 = production-ready)
- Tags for searchability
- Tech stack versions
- Features list
- Dependencies (required/optional)
- Prerequisites
- Usage example
- Quality gates

### prompt.md

Complete implementation guide with:
- Objective and prerequisites
- Step-by-step implementation
- Code examples
- Configuration guides
- Usage patterns
- Quality gates
- Common issues and solutions
- Testing checklist
- References

### templates/

Reference implementation files from source project (starters/saas-base).

## Source Projects

All Tier 1 skills are extracted from validated starters:

| Skill | Source | Validation |
|-------|--------|------------|
| auth-nextauth | starters/saas-base | mickasmt/next-saas-stripe-starter |
| payments-stripe | starters/saas-base | mickasmt/next-saas-stripe-starter |
| email-resend | starters/saas-base | mickasmt/next-saas-stripe-starter |
| database-neon | starters/saas-base | mickasmt/next-saas-stripe-starter |

## Usage with Project-Forge

### SpecKit Integration

Skills can be referenced in `/speckit.plan`:

```markdown
## Tech Stack

- Database: **database-neon** skill (Neon + Prisma)
- Authentication: **auth-nextauth** skill (Auth.js v5)
- Payments: **payments-stripe** skill (Stripe subscriptions)
- Email: **email-resend** skill (Resend + React Email)
```

### Ralph++ Implementation

When Ralph++ sees a skill reference, it:
1. Reads the skill's `prompt.md`
2. Follows step-by-step instructions
3. Adapts templates to project context
4. Verifies quality gates

## Dependency Graph

```
database-neon (base)
    ↓
auth-nextauth (depends on database-neon)
    ↓
payments-stripe (depends on database-neon, optional: auth-nextauth)

email-resend (standalone, optional: auth-nextauth for magic links)
```

## Quality Tiers

### Tier 1: Production-Ready
- Extracted from validated starters
- Used in production environments
- Complete documentation
- Clear quality gates

### Tier 2: Frequently Used (Coming Soon)
- Common patterns
- Well-tested
- Good documentation
- May require customization

### Tier 3: Experimental (Coming Soon)
- New patterns
- Under validation
- May change

## Development Workflow

### Creating New Skills

1. **Extract from Starter**
   ```bash
   # Work from a validated starter in starters/
   cd starters/saas-base
   # Identify pattern to extract
   ```

2. **Create Skill Structure**
   ```bash
   mkdir -p production-skills/skill-name/templates
   ```

3. **Write manifest.yaml**
   - Define metadata, dependencies, features
   - Add usage example and quality gates

4. **Write prompt.md**
   - Complete step-by-step guide
   - Code examples from starter
   - Configuration and troubleshooting

5. **Copy Templates**
   ```bash
   cp starters/saas-base/path/to/file.ts production-skills/skill-name/templates/
   ```

6. **Validate**
   - Test in fresh Next.js project
   - Verify quality gates pass
   - Update documentation

### Validation Checklist

Before marking a skill as Tier 1:

- [ ] Extracted from working starter
- [ ] manifest.yaml complete
- [ ] prompt.md with step-by-step guide
- [ ] Templates copied from source
- [ ] Tested in fresh project
- [ ] Quality gates verified
- [ ] Dependencies documented
- [ ] Common issues documented

## Roadmap

### Tier 1 (Complete)
- ✅ auth-nextauth
- ✅ payments-stripe
- ✅ email-resend
- ✅ database-neon

### Tier 2 (Complete)
- ✅ ui-shadcn (shadcn/ui components)
- ✅ validation-patterns (Zod schemas)
- ✅ contentlayer-blog (MDX blog)

### Tier 2 (Planned - Future Starters)
- [ ] ai-classification (AI/ML patterns) - requires saas-ai starter
- [ ] email-oauth-flows (OAuth Gmail/Outlook) - requires saas-communication starter
- [ ] queue-processing (Background jobs) - TBD
- [ ] rate-limiting-persistent (Rate limiting) - TBD

### Additional Starters (Planned)
- [ ] saas-ai (+ Anthropic + classification)
- [ ] saas-communication (+ Email OAuth + messaging)

## Contributing

To propose a new skill:

1. Validate pattern in a real project
2. Create skill following structure above
3. Test in fresh project
4. Submit with validation results

## References

- SpecKit: skills/speckit/
- Ralph++: skills/ralph-loop/
- Starters: starters/
- Main README: ../README.md
