# GATING POLICIES — Règles hard apprises des erreurs

> Règles qui **bloquent** (exit 2 dans les hooks) ou **alertent** (exit 1) quand violées.
>
> Maintenues par `/forge-promote` depuis les learnings de catégorie `marker` avec mots-clés "always/never".

| ID | Trigger | Action requise | Origine |
|----|---------|---------------|---------|
| GP-001 | Avant tout push staging/main | Confirmation explicite utilisateur | Quality Gate v1 |
| GP-002 | Avant toute modification auth/login | Test E2E auth obligatoire | — |
| GP-003 | Avant toute modification paiement | Test en mode sandbox/test obligatoire | — |

## Comment ajouter une règle

Via `/forge-reflect` :
- Si un learning de catégorie `marker` avec pattern "never do X" est détecté ≥2 fois
- Et que `/forge-promote` décide que c'est une règle hard
- Il ajoute une ligne dans ce tableau avec un nouveau `GP-NNN`

## Comment ces règles sont appliquées

- Les règles `GP-xxx` sont lisibles par les hooks PreToolUse (à venir, P1c)
- Match sur le contexte → blocage ou warning
- Les règles ne sont pas auto-générées — elles passent par `/forge-promote` avec validation user
