# Project-Forge Bootstrap

Creates a new project from a starter template in one command.

## Usage

```bash
./tools/bootstrap <project-name> [--starter <name>] [--dir <target-directory>]
```

## Options

| Option | Description | Default |
|---|---|---|
| `--starter <name>` | Starter template to use | `supabase-stripe` |
| `--dir <path>` | Parent directory for the new project | Current directory |
| `--list-starters` | List available starters and exit | |
| `-h, --help` | Show help and exit | |

## Examples

```bash
# Create a project with the default starter (supabase-stripe)
./tools/bootstrap my-app

# Use a specific starter
./tools/bootstrap my-app --starter saas-base

# Create in a specific directory
./tools/bootstrap my-app --dir ~/Projets

# List all available starters
./tools/bootstrap --list-starters
```

## What It Does

1. Copies the starter template to the target directory (excluding `node_modules`, `.next`, `.git`)
2. Updates `package.json` with the project name
3. Creates `.env` from `.env.example` if available
4. Creates `.project-forge/config.json` with project metadata
5. Initializes a git repository with an initial commit
6. Prints starter-specific next steps

## Available Starters

| Starter | Stack | Use Case |
|---|---|---|
| `supabase-stripe` | Next.js + Drizzle + Supabase + Stripe | Lightweight MVP, Supabase-first |
| `saas-base` | Next.js + Prisma + Auth.js + Stripe + Resend | Full-featured SaaS |

## Project Metadata

The `.project-forge/config.json` file records where the project came from:

```json
{
  "name": "my-app",
  "starter": "supabase-stripe",
  "source_repo": "dzlau/stripe-supabase-saas-template",
  "source_commit": "7efcba2",
  "created_at": "2026-02-07T15:30:00Z"
}
```

Source information is automatically extracted from the starter's `PROJECT_FORGE_README.md`.
