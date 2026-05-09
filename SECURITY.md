# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Project-Forge, **please do NOT open a public issue**.

Use **[GitHub Security Advisories](https://github.com/JimmyBlanquet/project-forge/security/advisories/new)** to report it privately. This lets us coordinate a fix and disclosure timeline before the issue becomes public.

What to include in your report:
- **Affected component** (framework code, starter, skill, generated project)
- **Affected version / commit** (`git rev-parse HEAD` if possible)
- **Reproduction steps** — minimal proof-of-concept
- **Impact assessment** — what an attacker could do
- **Suggested fix** if you have one

## Response timeline

We aim to:
- **Acknowledge** your report within **5 business days**
- **Triage and confirm** within **10 business days**
- **Patch** critical/high-severity issues within **30 days**
- **Publish a security advisory** with credit to the reporter (unless you prefer to remain anonymous)

This is a volunteer project — these timelines are best-effort, not contractual SLAs.

## Scope

### In scope
- The Project-Forge framework code (`tools/`, `skills/`, `extensions/`, `systems/`, `starters/`)
- Generated projects' default configuration (auth defaults, secrets handling, CI/CD configs)
- Documentation that could lead to insecure deployments if followed naively

### Out of scope
- Vulnerabilities in third-party dependencies (report upstream — we'll bump deps once they patch)
- Issues in projects you've heavily customized after bootstrap (that's your codebase now)
- Theoretical attacks without a practical exploit path

## Security best practices for users

If you're using Project-Forge to bootstrap a project:

1. **Rotate all default secrets** in `.env.example` before any deployment
2. **Enable branch protection** on `main` (`./tools/protect-main`)
3. **Run the security audit skill**: `/speckit-threat-model`
4. **Keep dependencies up to date** — use Renovate or Dependabot (the starters bundle Renovate config)
5. **Never commit secrets** — pre-commit hooks help, but they're not bulletproof

## Acknowledgments

We thank all security researchers who responsibly disclose issues. Reporters who wish to be credited will be listed in the advisory and the release notes.
