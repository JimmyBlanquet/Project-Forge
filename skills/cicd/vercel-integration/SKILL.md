---
name: vercel-integration
description: Vercel deployment configuration with preview environments and cron jobs.
effort: low
---

# CI/CD Vercel Integration Skill

**Version:** 1.0.0 | **Category:** CI/CD | **Production-ready:** ✅

## Description

Vercel deployment configuration with preview environments and cron jobs.

## Features

- 🚀 Auto-deploy from GitHub
- 🔀 Preview deployments per PR
- ⏰ Cron jobs support
- 🌍 Regional deployment
- 📊 Build configuration

## Installation

```bash
cd skills/cicd/vercel-integration && bash install.sh
```

## Configuration

Creates `vercel.json` with optimal settings for Next.js.

> **Tip:** Use `/loop 5m` in Claude Code to monitor Vercel deployment progress, checking preview URL availability or build status at regular intervals.

**Extracted from:** Best practices + internal production SaaS
