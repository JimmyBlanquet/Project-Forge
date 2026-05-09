# ADR-002: Stratégie de Documentation Multi-Sessions

**Date:** 2026-01-16
**Status:** Accepté
**Décideurs:** jimb, Claude
**Contexte Session:** Session initiale - Prévention perte d'information

## Contexte

Project-Forge est un projet multi-sessions s'étalant sur plusieurs semaines. Sans structure de documentation, risque de :
- Perdre le contexte entre sessions
- Oublier des décisions importantes
- Répéter les mêmes erreurs
- Manquer de traçabilité

Citation jimb : *"Ma crainte est de perdre des informations ou des choses que nous aurions réalisé durant les sessions. Ca peut devenir rapidement le bazarre"*

## Décision

Implémenter une **documentation structurée en 4 piliers** :

### 1. ADR (Architecture Decision Records)
- **Quoi :** Décisions architecturales importantes
- **Quand :** Choix technologiques, patterns, trade-offs majeurs
- **Format :** Template standard (Contexte → Décision → Conséquences)

### 2. Session Logs
- **Quoi :** Historique chronologique de chaque session
- **Quand :** À la fin de chaque session de travail
- **Format :** Date, durée, objectifs, réalisations, blocages, prochaines étapes

### 3. Progress Tracking
- **Quoi :** État d'avancement global
- **Quand :** Mis à jour continuellement
- **Format :** STATUS.md avec phases, milestones, métriques

### 4. Knowledge Base
- **Quoi :** Learnings, patterns découverts, best practices
- **Quand :** Quand on découvre quelque chose de réutilisable
- **Format :** Articles thématiques

## Conséquences

### Positives
- **Continuité** : Reprendre facilement après pause
- **Mémoire** : Comprendre pourquoi certaines décisions
- **Traçabilité** : Historique complet
- **Amélioration** : Capitaliser sur learnings
- **Collaboration** : Onboarding facilité

### Négatives
- **Overhead** : Temps de documentation (estimé 10-15%)
- **Discipline** : Nécessite rigueur constante
- **Maintenance** : Docs peuvent devenir obsolètes

### Risques
- Documentation abandonnée si trop lourde
- Over-documentation (paralysis by analysis)
- Duplication entre les 4 piliers

## Alternatives Considérées

### Alternative A : Documentation minimaliste (README seul)
- **Description :** Juste un README.md mis à jour
- **Rejeté :** Insuffisant pour projet multi-semaines, perte contexte garantie

### Alternative B : Wiki externe (Notion, Confluence)
- **Description :** Documentation dans outil externe
- **Rejeté :** Séparé du code, risque désynchronisation, pas versionné avec code

### Alternative C : Comments dans code uniquement
- **Description :** Tout documenter via comments
- **Rejeté :** Pas de vue d'ensemble, difficile de retrouver décisions

## Implémentation

**Structure créée :**
```
docs/
├── adr/              # Architecture Decision Records
│   ├── README.md
│   ├── TEMPLATE.md
│   └── 001-*.md
├── sessions/         # Session logs
│   ├── README.md
│   ├── TEMPLATE.md
│   └── 2026-01-16-session-1.md
├── progress/         # Progress tracking
│   └── STATUS.md
└── knowledge/        # Knowledge base
    ├── README.md
    └── patterns/
```

**Workflow :**
1. **Début session :** Lire STATUS.md + dernier session log
2. **Pendant :** Capturer décisions importantes (ADR si majeur)
3. **Fin session :** Écrire session log + mettre à jour STATUS.md
4. **Si learning :** Ajouter à knowledge base

## Références

- ADR pattern : https://adr.github.io/
- Documentation as Code principles
- Projet similaire : Kubernetes decision records
