---
name: railway-integration
description: Railway deployment configuration for backend services and databases.
effort: low
---

# CI/CD Railway Integration Skill

**Version:** 1.0.0 | **Category:** CI/CD | **Production-ready:** ✅

## Description

Railway deployment configuration for backend services and databases.

## Features

- 🚂 Auto-deploy from GitHub
- 🔄 Zero-config deployments
- 💾 Database provisioning
- 🔍 Health checks
- ♻️ Auto-restart on failure

## Installation

```bash
cd skills/cicd/railway-integration && bash install.sh
```

## Configuration

Creates `railway.json` with Nixpacks builder and health checks.

**Extracted from:** Best practices + internal production SaaS
