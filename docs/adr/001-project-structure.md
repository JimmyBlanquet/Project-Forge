# ADR-001: Structure du Projet Project-Forge

**Date:** 2026-01-16
**Status:** Accepté
**Décideurs:** jimb, Claude
**Contexte Session:** Session initiale - Conception Project-Forge

## Contexte

Besoin de lancer 12-24 projets SaaS par an avec qualité production. Le bottleneck est la capacité de production et maintenance. Sans infrastructure réutilisable, chaque projet part de zéro.

## Décision

Créer **Project-Forge** : une infrastructure modulaire avec :

1. **Starters** : Templates complets production-ready
2. **Production Skills** : Patterns validés et réutilisables (3 tiers)
3. **Ralph Workflows** : Configurations Ralph optimisées
4. **Tools** : Scripts d'automation (bootstrap, extraction)
5. **Documentation** : Structure (ADR, sessions, progress, knowledge)

Structure organisée par **réutilisabilité** et **fréquence d'usage** :
- Tier 1 : Essentiels (100% projets)
- Tier 2 : Fréquents (60-80% projets)
- Tier 3 : Situationnels (30-50% projets)

## Conséquences

### Positives
- Time to market réduit de 70% (3 semaines → 3 jours)
- Qualité garantie par patterns éprouvés
- Maintenance simplifiée (cohérence entre projets)
- Amélioration continue (chaque projet enrichit la base)
- ROI break-even au projet 2-3

### Négatives
- Investissement initial 2 semaines
- Nécessite discipline pour maintenir la structure
- Risque de sur-abstraction si mal utilisé

### Risques
- Coupling entre projets si skills mal conçus
- Obsolescence si pas maintenu régulièrement
- Over-engineering si trop générique

## Alternatives Considérées

### Alternative A : Boilerplate monolithique
- **Description :** Un seul template énorme avec tout
- **Rejeté :** Rigide, chaque projet n'a pas besoin de tout, maintenance cauchemar

### Alternative B : Copier-coller ad-hoc
- **Description :** Copier du code entre projets manuellement
- **Rejeté :** Incohérence, bugs dupliqués, pas d'amélioration continue

### Alternative C : Micro-packages npm
- **Description :** Publier chaque pattern en package npm
- **Rejeté :** Overhead versioning, trop granulaire, complexité dépendances

## Implémentation

**Fichiers créés :**
- `/project-forge/` - Structure racine
- `/starters/` - Templates
- `/production-skills/` - Skills organisés par catégorie
- `/tools/` - Scripts automation
- `/docs/` - Documentation structurée

**Timeline :**
- Phase 1 (Semaine 1) : Extraction 4 skills Tier 1
- Phase 2 (Semaine 2) : Starter saas-base + bootstrap script
- Phase 3 (Validation) : Test sur un projet pilote

## Références

- Discussion initiale : Ralph Wiggum technique
- Inspiration : Projets SaaS en production (source skills)
- Tools : Ralph Orchestrator, SpecKit
