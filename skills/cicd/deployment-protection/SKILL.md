---
name: deployment-protection
description: 3-layer deployment protection with local hooks, CI validation, and deployment gatekeeper.
effort: low
---

# CI/CD Deployment Protection Skill

**Version:** 1.0.0 | **Category:** CI/CD | **Production-ready:** ✅

## Description

3-layer deployment protection: Local hooks + CI validation + Deployment gatekeeper.

## Features

- 🔒 Pre-push hooks (husky)
- ✅ CI validation gates
- 🛡️ Deployment gatekeeper
- 🚫 Blocks untested deployments
- 📝 Commit marker validation

## Installation

```bash
cd skills/cicd/deployment-protection && bash install.sh
```

## Protection Layers

1. **Local (.husky/pre-push)** - Blocks invalid branches
2. **CI (GitHub Actions)** - Validates tests pass
3. **Deploy (Vercel/Railway)** - Blocks if CI failed

> **Tip:** Use `/loop 5m` in Claude Code to poll deployment status at regular intervals, e.g. to monitor CI gates or deployment health after a push.

**Extracted from:** internal production SaaS
