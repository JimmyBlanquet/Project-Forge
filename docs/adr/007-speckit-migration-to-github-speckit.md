# ADR-007: Migration de SpecKit custom vers GitHub spec-kit

**Date:** 2026-03-24
**Status:** Accepte
**Decideurs:** jimb, Claude

## Contexte

Project-Forge utilisait un systeme SpecKit custom (12 skills internes) pour la planification spec-driven.
GitHub a lance `spec-kit` (28K+ stars), un toolkit open-source couvrant les memes besoins fondamentaux :
constitution, specify, clarify, plan, tasks, analyze.

Maintenir deux systemes paralleles cree de la dette technique :
- Duplication d'effort (6 skills core a maintenir vs un outil open-source maintenu par GitHub)
- Divergence de format (AS1.1 vs Given/When/Then, YAML vs Markdown constitution)
- Pas d'ecosysteme d'extensions

## Decision

Adopter GitHub spec-kit v0.3.2+ comme fondation et packager les skills uniques de Project-Forge comme extensions spec-kit.

Architecture en 3 couches :
```
Couche 3 : Extensions PF (convert, testing, security, audit, implement)
Couche 2 : Ralph++ (implementation autonome)
Couche 1 : GitHub spec-kit (constitution, specify, clarify, plan, tasks, analyze)
```

## Consequences

### Positives
- 6 skills internes supprimees (-2500 lignes) - moins de maintenance
- Format standard BDD (Given/When/Then) - meilleure interoperabilite
- Ecosysteme d'extensions spec-kit - on peut publier sur le catalog communautaire
- `specify` CLI pour l'init et la gestion - UX amelioree
- Commandes dot-notation (`/speckit.specify`) coherentes avec la convention spec-kit

### Negatives
- Dependance a un outil tiers (GitHub spec-kit) - risque de breaking changes
- Coexistence temporaire dash/dot (`/speckit-convert` et `/speckit.pf.convert`) - confusion possible
- Migration necessaire pour les projets enfants existants

### Risques
- spec-kit v0.4+ pourrait casser la compatibilite → mitigation : pin version, tester avant upgrade
- Format Given/When/Then different de notre AS legacy → mitigation : scripts supportent les deux formats
- Extensions pas encore testees sur un vrai projet enfant → mitigation : script `tools/migrate-to-speckit` pret

## Alternatives Considerees

### Alternative A : Fork spec-kit
- **Description :** Forker spec-kit et customiser directement
- **Pourquoi rejetee :** Cout de maintenance du fork, perte des updates upstream

### Alternative B : Wrapper mince autour de spec-kit
- **Description :** Garder nos skills mais les faire deleguer a spec-kit en interne
- **Pourquoi rejetee :** Complexite d'indirection, duplication partielle

### Alternative C : Statu quo (garder SpecKit custom)
- **Description :** Continuer avec notre systeme custom
- **Pourquoi rejetee :** Duplication d'effort, pas d'ecosysteme, format non-standard

## Implementation

- **Fichiers affectes :**
  - `tools/bootstrap` : integre `specify init` + install extensions
  - `tools/migrate-to-speckit` : migration projets existants
  - `extensions/pf-*` : 5 extensions spec-kit
  - `skills/speckit/` : 6 skills retirees, 10 gardees comme extensions
  - `starters/*/scripts/workflow-gate.sh` : support `.specify/`
  - `starters/*/scripts/verify-test-traceability.sh` : support SC-/FR- formats
  - `CLAUDE.md` : workflow mis a jour
  - `tests/forge-eval.sh` : harness étendu (dont tests pour extensions)

- **Plan detaille :** `docs/plans/2026-03-23-speckit-migration-to-github-speckit.md`
- **Matrice de compatibilite :** `docs/plans/2026-03-23-speckit-compatibility-matrix.md`

## References

- [GitHub spec-kit](https://github.com/github/spec-kit)
- [spec-kit extension format](https://github.com/github/spec-kit/tree/main/extensions)
