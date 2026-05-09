# ADR-003: Approche Dogfooding - Utiliser Project-Forge pour Construire Project-Forge

**Date:** 2026-01-16
**Status:** Accepté
**Décideurs:** jimb, Claude
**Contexte Session:** Session initiale - Meta-tooling

## Contexte

Project-Forge vise à créer une infrastructure pour développer des projets avec SpecKit + Ralph + Skills. Question : Comment construire Project-Forge lui-même ?

Options :
1. Développement traditionnel manuel
2. Utiliser les outils qu'on construit (dogfooding)

## Décision

**Utiliser SpecKit + Ralph + Documentation structurée pour construire Project-Forge.**

Approche méta :
- **.speckit/** : Planification des features de Project-Forge
- **.ralph/** : Implémentation avec Ralph Orchestrator
- **.project-forge-skills/** : Skills spécifiques à la construction de Project-Forge
- **docs/** : Documentation structurée (ADR, sessions, progress, knowledge)

## Conséquences

### Positives
- **Validation réelle** : On teste nos outils sur cas réel
- **Feedback immédiat** : Découverte des problèmes tôt
- **Amélioration continue** : Les outils s'améliorent en les utilisant
- **Crédibilité** : "We use what we build"
- **Documentation par l'exemple** : Le repo est un exemple d'usage

### Négatives
- **Complexité initiale** : Setup des outils avant qu'ils soient finis
- **Paradoxe bootstrap** : Comment init SpecKit/Ralph sans eux ?
- **Overhead** : Possible sur-engineering au début

### Risques
- Bloquer si outils pas encore prêts
- Passer plus de temps sur tooling que sur features
- Confusion entre "Project-Forge" et "projet utilisant Project-Forge"

## Alternatives Considérées

### Alternative A : Développement manuel classique
- **Description :** Code manuellement Project-Forge, utiliser ensuite
- **Rejeté :** Pas de validation réelle, risque d'inadéquation besoin/outil

### Alternative B : Hybrid approach
- **Description :** Phase 1 manuel, Phase 2+ dogfooding
- **Considéré mais non retenu :** Possible, mais perd avantage early feedback

## Implémentation

**Structure dogfooding :**
```
project-forge/
├── .speckit/
│   ├── constitution.md      # Constitution Project-Forge
│   └── specs/               # Specs des features
├── .ralph/
│   ├── prompt.md            # Instructions Ralph
│   ├── prd.json             # Tasks Project-Forge
│   └── progress.txt         # Progress Ralph
├── .project-forge-skills/   # Skills construction
│   ├── skill-extraction/
│   ├── starter-creation/
│   └── documentation-generation/
└── docs/                    # Structured docs
```

**Workflow :**
1. `/speckit.specify "Feature X for Project-Forge"`
2. `/speckit.plan`
3. Ralph implémente avec skills disponibles
4. Documentation auto-capturée
5. Learnings enrichissent Project-Forge

**Résolution paradoxe bootstrap :**
- Phase 1 : Setup manuel minimal (.speckit, .ralph dirs)
- Phase 2+ : Utilisation complète des outils

## Références

- Concept "eating your own dog food"
- Rust compilé par Rust
- LLVM compilé par LLVM
