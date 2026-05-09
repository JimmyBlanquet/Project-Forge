# Guide déploiement — `/pf-cross-review` + `/pf-cross-review-iterate`

> **Objet** : ce document explique comment **utiliser** et **maintenir à jour** les outils de cross-review LLM développés dans Project-Forge, déployés dans ce projet via `tools/install-skill` depuis `~/Projets/Project-Forge`.
>
> **Version au déploiement** : V4.1 (sprint 2026-05-03 — V3.2 → V3.3 → V4 → V4.1 + install-skill helpers).
>
> **Pour Claude Code dans ce projet** : si tu lis ce doc, c'est que Jimmy t'a demandé de te servir des outils ci-dessous. Lis la section "Pour Claude Code" en bas avant tout.

---

## TL;DR

Tu disposes de 2 slash commands :

```
/pf-cross-review [<git-range>] [--n0-only|--no-n2]
/pf-cross-review-iterate [<git-range>] [--max-rounds N] [--stagnation-k N]
```

- **`/pf-cross-review`** : 1 review contradictoire multi-LLM (N0 Anthropic + N1 Codex CLI + N2 local LLM endpoint). Génère un doc consolidé `docs/plans/YYYY-MM-DD-cross-review-*.md`.
- **`/pf-cross-review-iterate`** : boucle V4 qui exécute N rounds de `/pf-cross-review` jusqu'à convergence (no new findings K rounds consécutifs) ou divergence (alarme spec drift).

**Quand l'utiliser** : après un cluster de commits substantiels (5-15 commits) ou après plusieurs fixes successifs sur un module sensible. Détecte les bugs que la self-review same-LLM rate.

**Quand NE PAS l'utiliser** : single small commit, range > 50 commits, diff > 100KB (saturation N2).

---

## Pré-requis

### Indispensables

| Tool | Vérification | Install |
|---|---|---|
| `jq` | `jq --version` | `apt install jq` |
| `bash` ≥ 4 | `bash --version` | normalement OK |
| `git` | `git --version` | normalement OK |
| Skill files | `ls .claude/commands/pf-cross-review*.md` | voir "Mise à jour" plus bas |
| Helper scripts | `ls scripts/cross-review-iterate/*.sh` | voir "Mise à jour" plus bas |

### Optionnels (selon flags)

| Tool | Pourquoi | Si absent |
|---|---|---|
| `codex` (Codex CLI) | École N1 OpenAI | utiliser `--n0-only` |
| Network access to `${LLM_ENDPOINT}` (e.g. `http://localhost:11500`) | École N2 local LLM endpoint | utiliser `--no-n2` |
| `MISTRAL_API_KEY` / `GEMINI_API_KEY` env (futur V3.4) | École N3 cloud | skip silencieux |

---

## Architecture du système

### `/pf-cross-review` — review contradictoire 1-shot

Pipeline :
1. **Pre-flight** : check range, diff size, codex / local LLM availability
2. **N0 Anthropic** (sub-agent `pr-review-toolkit:code-reviewer`) — review en parallèle
3. **N1 Codex CLI** (`codex exec`) — review indépendante en parallèle
4. **N2 local LLM endpoint** (HTTP direct llama-swap) — review CN/EU en parallèle
5. **Filtering Agent (anti-FP)** : filtre faux positifs avec reasoning structuré
6. **Consolidation** : déduplication par convergence d'écoles (1=FP-suspect, 2+=légitime)
7. **Output** : doc markdown structuré dans `docs/plans/`

### `/pf-cross-review-iterate` — auto-stabilization V4

Pipeline :
1. Lance `/pf-cross-review` round 1
2. Compute fingerprints + findings.txt des résultats
3. Lance round 2, diff vs round 1 (V4.1 utilise LLM-as-judge sémantique)
4. Continue jusqu'à `stable` (K rounds sans new finding) ou `diverging` (alarme)
5. Output : `.cross-review-iterate/<ts>/log.jsonl` + final report

---

## Utilisation

### Cas standard : reviewer ta dernière feature

```bash
# Auto-detect range = HEAD vs branche parent
/pf-cross-review

# Range explicite
/pf-cross-review HEAD~5..HEAD

# Mode dégradé (Anthropic seul) si codex / local LLM indispo
/pf-cross-review HEAD~5..HEAD --n0-only

# Sans N2 local LLM (si LLM endpoint indisponible)
/pf-cross-review HEAD~5..HEAD --no-n2
```

Output : `docs/plans/YYYY-MM-DD-cross-review-<slug>.md` avec table BLOCKER/IMPORTANT/NIT + verdict ship / fix-then-ship / no-ship.

### Cas itératif : valider stabilité après plusieurs fixes

```bash
# 5 rounds max, stop après 2 rounds stables
/pf-cross-review-iterate HEAD~10..HEAD

# Custom convergence
/pf-cross-review-iterate --max-rounds 3 --stagnation-k 1
```

Output : session dir `.cross-review-iterate/<ts>/` avec rapports par round + log JSONL + verdict final (`converged` / `diverging` / `budget` / `max_iter`).

---

## Mise à jour (sync depuis Project-Forge)

Quand Project-Forge a une nouvelle version (ex: V4.2), pour récupérer la dernière version dans ce projet :

```bash
# Re-deploy depuis ~/Projets/Project-Forge (skill .md + helpers)
~/Projets/Project-Forge/tools/install-skill pf-cross-review .
~/Projets/Project-Forge/tools/install-skill pf-cross-review-iterate .

# Vérifier
head -5 .claude/commands/pf-cross-review.md
ls scripts/cross-review-iterate/
```

Le tool `install-skill` :
- Inline le contenu de la skill dans `.claude/commands/<name>.md` (auto-pickup par Claude Code)
- Copie récursivement `scripts/<skill-suffix>/*.sh` (préserve `+x`)
- N'écrase pas tes autres fichiers `.claude/commands/*`

---

## Test smoke post-déploiement

Pour vérifier que tout est bien en place :

```bash
# 1. Skills présentes ?
ls -la .claude/commands/pf-cross-review*.md
# attendu : 2 fichiers, ~5-25 KB chacun

# 2. Helpers présents et exécutables ?
ls -la scripts/cross-review-iterate/*.sh
# attendu : 4 fichiers .sh, mode -rwxr-xr-x

# 3. Helpers fonctionnels (test offline) ?
echo "test:1|claim A" > /tmp/r1
echo "test:1|claim A" > /tmp/r2
bash scripts/cross-review-iterate/diff-rounds-semantic.sh /tmp/r1 /tmp/r2
# attendu : '{"new":0,"dropped":0,"stable":1,...,"verdict":"stable","method":"semantic"}'
rm /tmp/r1 /tmp/r2

# 4. Pré-requis externes ?
jq --version          # → jq-X.X
which codex || echo "codex absent — utiliser --n0-only"
curl -s -m 5 -H "Authorization: Bearer $LLM_API_KEY" ${LLM_ENDPOINT:-http://localhost:11500}/v1/models | jq -r '.data[0].id' || echo "local LLM inaccessible — utiliser --no-n2"

# 5. Lancement réel sur petite range
# /pf-cross-review HEAD~1..HEAD --n0-only
# (mode safe : 1 commit, 1 école, ~3 min)
```

---

## Pour Claude Code dans ce projet

Si tu es Claude Code en train de lire ce fichier parce que Jimmy t'a demandé de te servir des outils cross-review :

### 1. Vérifie le déploiement

Lance la séquence "Test smoke" ci-dessus. Si tout est ✅ → tu peux appeler les slash commands.

### 2. Si tu vois des erreurs au déploiement

- **Skills absentes** (`.claude/commands/pf-cross-review*.md` manquants) → relance `~/Projets/Project-Forge/tools/install-skill` (cf section Mise à jour)
- **Helpers absents** ou non `+x` → idem
- **`codex` / `curl` to local LLM indispo** → utilise `--n0-only` (Anthropic seul) — le mode dégradé donne quand même un signal utile

### 3. Quand tu invoques `/pf-cross-review`

C'est une slash command custom : tu **n'as PAS besoin du Skill tool**, ça se déclenche depuis le contenu inliné de `.claude/commands/pf-cross-review.md`. Si Claude Code ne la trouve pas, fais `cat .claude/commands/pf-cross-review.md` et **suis manuellement les étapes**.

### 4. Ne PAS modifier la skill localement

`.claude/commands/pf-cross-review*.md` et `scripts/cross-review-iterate/*.sh` sont **générés par `install-skill`** depuis Project-Forge. Si tu veux modifier le comportement, modifie côté PF (`extensions/pf-cross-review/`) puis re-deploy.

### 5. Si tu trouves un bug dans la skill

Note-le dans `docs/feedback-cross-review.md` du projet courant, pour que Jimmy le remonte à Project-Forge à la prochaine session là-bas.

---

## FAQ

**Q: Pourquoi 2 commands (`/pf-cross-review` et `/pf-cross-review-iterate`) ?**
A: La première fait 1 review (rapide). La seconde boucle pour détecter spec drift après plusieurs fixes. Utilise la première par défaut, la seconde quand tu suspect un cycle de fixes qui s'éternise.

**Q: Combien ça coûte ?**
A: ~$0.50-1.00 par review (N0 Anthropic). N1 Codex = quota ChatGPT (gratuit jusqu'à limite plan). N2 local LLM = $0 (GPU déjà payé). `/pf-cross-review-iterate` multiplie par le nombre de rounds (1-5).

**Q: Combien de temps ?**
A: ~3-5 min pour `/pf-cross-review`. ~10-30 min pour `/pf-cross-review-iterate` selon convergence.

**Q: Puis-je l'utiliser sans local LLM endpoint configuré ?**
A: Oui, avec `--no-n2`. Tu perds 1 école (local LLM endpoint) mais N0+N1 restent.

**Q: Et si je veux utiliser des LLMs cloud (Mistral La Plateforme, Gemini, etc.) ?**
A: Pas encore intégré (V4.1). Prévu pour V3.4/V4.2 — voir Project-Forge roadmap.

---

## Historique versions

| Version | Date | Changements clés |
|---|---|---|
| V2.1 | 2026-05-02 | Initial cross-LLM N0+N1 (sans N2) |
| V3.0-V3.2 | 2026-05-03 | + N2 local LLM, anti-FP filtering, symmetric inverse fix |
| V3.3 | 2026-05-03 | N2 via HTTP direct llama-swap (au lieu du bus), max_tokens généreux + reasoning_content fallback |
| V4 | 2026-05-03 | Wrapper itératif `/pf-cross-review-iterate` (SCAFFOLD-CEGIS pattern) |
| V4.1 | 2026-05-03 | Fingerprint sémantique LLM-as-judge dans `dedupe-judge.sh` (fix faux convergence) |
| V3.4 (à venir) | TBD | + N3 cloud LLM (Mistral La Plateforme ou Gemini) + Magistral remplace Devstral en N2 EU |

---

## Liens utiles (côté Project-Forge)

- Skill source : `~/Projets/Project-Forge/extensions/pf-cross-review/commands/cross-review.md`
- Wrapper itératif source : `~/Projets/Project-Forge/extensions/pf-cross-review-iterate/commands/iterate.md`
- Helpers source : `~/Projets/Project-Forge/scripts/cross-review-iterate/`
- Tool de déploiement : `~/Projets/Project-Forge/tools/install-skill`
- Plan dernière session : `~/Projets/Project-Forge/docs/plans/2026-05-03-cross-review-session-final.md`
