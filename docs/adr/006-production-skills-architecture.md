# ADR-006: Architecture des Production Skills

**Date:** 2026-01-19
**Statut:** Accepté
**Décideurs:** jimb, Claude Sonnet 4.5

## Contexte

Project-Forge a besoin d'un système de skills réutilisables pour:
1. Accélérer le développement de nouveaux projets SaaS
2. Garantir la qualité et les best practices
3. Faciliter la maintenance et les mises à jour
4. Permettre l'utilisation par Ralph++ en mode autonome

Besoin d'une architecture claire qui supporte à la fois l'utilisation manuelle (développeur) et l'utilisation autonome (Ralph++).

## Décision

Architecture skills avec **3 fichiers par skill**:
1. `manifest.yaml` - Métadonnées et configuration
2. `prompt.md` - Guide d'implémentation complet
3. `templates/` - Fichiers de référence

**Structure:**
```
production-skills/
├── skill-name/
│   ├── manifest.yaml          # Metadata + dependencies
│   ├── prompt.md              # Step-by-step guide
│   └── templates/             # Reference files
│       ├── file1.ts
│       └── file2.tsx
└── README.md                  # Index + documentation
```

## Alternatives Considérées

### Alternative 1: Monolithic Skill Files
Un seul fichier Markdown avec tout:
```
skills/
└── auth-nextauth.md  # Tout dans un fichier
```

**Rejeté car:**
- ❌ Difficile à parser pour Ralph++
- ❌ Metadata non structurée
- ❌ Pas de templates séparés
- ❌ Difficile à maintenir

### Alternative 2: NPM Packages
Publier chaque skill comme package npm:
```
@project-forge/skill-auth-nextauth
```

**Rejeté car:**
- ❌ Overhead de publication
- ❌ Versioning complexe
- ❌ Dépendances externes
- ❌ Moins flexible pour customization

### Alternative 3: Git Submodules
Chaque skill dans son propre repo:
```
production-skills/
└── auth-nextauth/  # Git submodule
```

**Rejeté car:**
- ❌ Complexité de gestion
- ❌ Fragmentation
- ❌ Overhead Git
- ❌ Difficile pour Ralph++

### Alternative 4: JSON Schema
Utiliser JSON au lieu de YAML:
```
manifest.json  # Au lieu de manifest.yaml
```

**Rejeté car:**
- ❌ Moins lisible pour humains
- ❌ Pas de commentaires natifs
- ❌ Plus verbeux
- ✅ YAML préféré dans l'écosystème

## Architecture Détaillée

### manifest.yaml

**Rôle:** Métadonnées structurées pour parsing automatique

**Contenu:**
```yaml
name: skill-name
version: 1.0.0
description: One-line description
tier: 1 | 2 | 3
tags: [list, of, tags]

source_project: starters/saas-base
validated: true
production_ready: true

tech_stack:
  - package@version

features:
  - Feature 1
  - Feature 2

dependencies:
  required: [skill-a]
  optional: [skill-b]

prerequisites:
  - Prerequisite 1

usage_example: |
  Code example

quality_gates:
  - Gate 1
  - Gate 2
```

**Utilisé par:**
- Ralph++ pour comprendre dependencies
- CLI tools pour lister skills
- Validation automatique

### prompt.md

**Rôle:** Guide d'implémentation pour humains et Ralph++

**Structure:**
```markdown
# Skill Name

## Objective
What this skill accomplishes

## Prerequisites
What must exist before using

## Implementation Steps

### Step 1: Install Dependencies
bash commands

### Step 2: Configure X
Code examples

[... more steps ...]

## Usage Patterns
Common use cases

## Quality Gates
Verification checklist

## Common Issues
Troubleshooting

## References
External docs
```

**Caractéristiques:**
- ✅ Step-by-step executable
- ✅ Code examples complets
- ✅ Quality gates clairs
- ✅ Troubleshooting intégré
- ✅ Autonome (Ralph++ peut suivre)

### templates/

**Rôle:** Fichiers de référence du starter source

**Contenu:**
- Fichiers configuration (`.config.ts`, `.json`)
- Fichiers helpers (`lib/`, `utils/`)
- Composants exemple
- Schemas/types

**Utilisés pour:**
- Référence rapide
- Copy-paste partiel
- Comparaison avec starter
- Validation patterns

## Tiers de Skills

### Tier 1: Production-Ready
**Critères:**
- ✅ Extrait de starter validé
- ✅ Utilisé en production
- ✅ Documentation complète
- ✅ Quality gates définis
- ✅ Templates inclus

**Exemples:** auth-nextauth, payments-stripe, database-neon

### Tier 2: Frequently Used
**Critères:**
- ✅ Pattern fréquent
- ✅ Bien testé
- ✅ Bonne documentation
- ⚠️ Peut nécessiter customization

**Exemples:** ui-shadcn, validation-patterns, contentlayer-blog

### Tier 3: Experimental
**Critères:**
- ⚠️ Nouveau pattern
- ⚠️ En validation
- ⚠️ Peut changer

**Exemples:** (aucun pour l'instant)

## Dependency Management

**Approche:** Explicit dependencies dans manifest.yaml

```yaml
dependencies:
  required:
    - database-neon  # Must be installed first
  optional:
    - auth-nextauth  # Enhances but not required
```

**Résolution:**
- Ralph++ check dependencies avant installation
- Ordre d'installation automatique
- Erreur si dependency manquante

## Raisons du Choix

### 1. Séparation des Préoccupations
- **Metadata** (YAML) → Machine-readable
- **Documentation** (Markdown) → Human-readable
- **Templates** (Code) → Executable

### 2. Extensibilité
Facile d'ajouter:
- Nouveaux champs dans manifest.yaml
- Nouvelles sections dans prompt.md
- Nouveaux templates/

### 3. Parsing Facile
- YAML parsing standard
- Markdown parsing standard
- File system simple

### 4. Ralph++ Compatible
Ralph++ peut:
- Parse manifest.yaml pour dependencies
- Read prompt.md step-by-step
- Copy templates/ as needed

### 5. Git-Friendly
- Texte pur (diffable)
- Pas de binaires
- History claire
- Easy merge

## Conséquences

### Positives
- ✅ Structure claire et cohérente
- ✅ Facile à maintenir
- ✅ Extensible
- ✅ Ralph++ compatible
- ✅ Human-friendly
- ✅ Git-friendly
- ✅ Testable (quality gates)

### Négatives
- ⚠️ 3 fichiers par skill (vs 1)
- ⚠️ Duplication possible (manifest vs prompt)
- ⚠️ Maintenance de templates/

### Risques Mitigés
- **Risque:** Manifest.yaml et prompt.md se désynchronisent
- **Mitigation:** Validation automatique
- **Mitigation:** Templates dans prompt.md reprennent manifest

- **Risque:** Templates deviennent obsolètes
- **Mitigation:** Version tracking dans manifest
- **Mitigation:** Test régulier des skills

## Validation

Architecture validée avec **7 skills créés**:

**Tier 1:**
- auth-nextauth (68 KB prompt.md)
- payments-stripe (72 KB prompt.md)
- email-resend (40 KB prompt.md)
- database-neon (51 KB prompt.md)

**Tier 2:**
- ui-shadcn (63 KB prompt.md)
- validation-patterns (69 KB prompt.md)
- contentlayer-blog (57 KB prompt.md)

**Résultat:** Architecture prouvée et extensible.

## Exemples de Flux

### Développeur Manuel
1. Lit manifest.yaml pour comprendre skill
2. Lit prompt.md step-by-step
3. Copie code depuis prompt.md
4. Référence templates/ si besoin
5. Vérifie quality gates

### Ralph++ Autonome
1. Parse manifest.yaml pour dependencies
2. Check prerequisites
3. Execute prompt.md step-by-step
4. Copy templates/ as instructed
5. Verify quality gates
6. Report success/failure

## Évolution Future

### Phase 2: CLI Tools
```bash
pf skill install auth-nextauth
pf skill list --tier=1
pf skill validate database-neon
```

### Phase 3: Validation Automatique
- CI/CD tests des skills
- Version compatibility checks
- Quality gate automation

### Phase 4: Skill Marketplace
- Community skills
- Rating/reviews
- Auto-updates

## Références

- Commit: 358ab67 - Add Tier 1 production skills
- Commit: 8224288 - Add Tier 2 production skills
- [production-skills/README.md](../../production-skills/README.md)
- ADR-005: Saas Base Starter Choice
