# LEARNINGS — Auto-amélioration continue

> Learnings validés et promus depuis `.learnings/queue.jsonl` via `/forge-reflect` + `/forge-promote`.
>
> **Ne modifie PAS ce fichier à la main** — il est maintenu par la boucle d'amélioration.
> Pour ajouter une règle, utilise `/forge-promote` qui passera par la curation appropriée.

## Comment ça marche

1. **Capture automatique** : les hooks `SessionEnd` et `PreCompact` capturent les corrections, workarounds, et décisions pendant la session → `.learnings/queue.jsonl`
2. **Capture quotidienne** : le cron `~/scripts/retro-collect.sh` agrège git log + tests + lint → `.learnings/sessions/YYYY-MM-DD-raw.md`
3. **Curation** : `/forge-reflect` classe les items en HIGH/MEDIUM/LOW avec gate LLM
4. **Promotion** : `/forge-promote` écrit les HIGH validés vers CLAUDE.md, `.claude/rules/`, ou skills avec confirmation user
5. **Archive** : les items promus vont dans `.learnings/archive/`

## Structure

```
.learnings/
├── LEARNINGS.md          ← ce fichier (vue curée, committed)
├── gating-policies.md    ← règles hard apprises (committed)
├── queue.jsonl           ← capture brute (.gitignored)
├── proposals/            ← classifié, en attente user (committed)
├── archive/              ← items promus ou rejetés (.gitignored)
└── snapshots/            ← safety net PreCompact (.gitignored)
```

## Learnings validés

*(vide — se remplira au fil de l'usage)*
