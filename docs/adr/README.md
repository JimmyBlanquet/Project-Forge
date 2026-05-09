# Architecture Decision Records (ADR)

Ce dossier contient toutes les décisions architecturales prises durant le développement de Project-Forge.

## Pourquoi des ADR ?

- **Mémoire institutionnelle** : Comprendre pourquoi certaines décisions ont été prises
- **Éviter les régressions** : Ne pas refaire les mêmes erreurs
- **Onboarding** : Nouveaux contributeurs comprennent le contexte
- **Traçabilité** : Historique des décisions importantes

## Format Standard

Chaque ADR suit le format :

```markdown
# ADR-XXX: Titre de la Décision

**Date:** YYYY-MM-DD
**Status:** Proposé | Accepté | Déprécié | Remplacé par ADR-YYY
**Décideurs:** Qui a pris la décision
**Contexte Session:** Session ID/Date

## Contexte

Quel est le problème ? Quel contexte mène à cette décision ?

## Décision

Quelle solution avons-nous choisie et pourquoi ?

## Conséquences

### Positives
- Avantage 1
- Avantage 2

### Négatives
- Inconvénient 1
- Inconvénient 2

### Risques
- Risque 1
- Risque 2

## Alternatives Considérées

### Alternative A
- Description
- Pourquoi rejetée

### Alternative B
- Description
- Pourquoi rejetée

## Implémentation

- Fichiers affectés
- PRs/commits
- Timeline

## Références

- Liens externes
- Discussions
- Documentation
```

## Index des ADR

| ID | Titre | Date | Status |
|----|-------|------|--------|
| [001](001-project-structure.md) | Structure du Projet | 2026-01-16 | Accepté |
| [002](002-documentation-strategy.md) | Stratégie de Documentation | 2026-01-16 | Accepté |
| [003](003-dogfooding-approach.md) | Approche Dogfooding | 2026-01-16 | Accepté |
| [005](005-saas-base-starter-choice.md) | Choix du starter saas-base | — | Accepté |
| [006](006-production-skills-architecture.md) | Architecture des production-skills | — | Accepté |
| [007](007-speckit-migration-to-github-speckit.md) | Migration vers GitHub spec-kit | — | Accepté |
| [008](008-starter-consolidation.md) | Consolidation des starters | — | Accepté |

> Note : ADR-004 manquant intentionnellement (numéro réservé/abandonné).

## Quand Créer un ADR ? — règle stricte (anti-spam)

Pattern emprunté à mattpocock : un ADR n'est justifié **que si les 3 critères sont vrais simultanément** :

1. **Hard to reverse** — coût élevé pour revenir en arrière (ex: choix de DB, schéma de bus, format de stockage)
2. **Surprising without context** — un nouvel arrivant ne devinerait pas ce choix juste en lisant le code
3. **Result of a real trade-off** — il y avait une vraie alternative qu'on a écartée pour de bonnes raisons

Si **un seul** des 3 manque → **pas d'ADR**. Le commit message ou un commentaire ciblé suffit.

Exemples typiques :
- ✅ ADR justifié : choisir Drizzle vs Prisma (tous 3 critères vrais)
- ✅ ADR justifié : passer de file-based bus à NATS (tous 3)
- ❌ Pas d'ADR : ajouter un endpoint REST (réversible, attendu, pas un trade-off)
- ❌ Pas d'ADR : refactor d'un composant React (réversible, attendu)
- ❌ Pas d'ADR : choix d'un linter (réversible)

**Pourquoi cette règle stricte** : un dossier d'ADR rempli à 80 % de "décisions" triviales devient illisible. On veut que chaque ADR soit lourd de sens pour qu'on le relise vraiment quand on touche au sujet.
