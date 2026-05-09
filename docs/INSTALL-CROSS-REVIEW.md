# /pf-cross-review — Auto-installer + guide

> **Pour Claude Code qui lit ce fichier** : tu n'as PAS besoin que cette skill soit déjà installée. Suis la procédure ci-dessous, dans l'ordre. Elle s'auto-installe si nécessaire.
>
> **Pour Jimmy** : tu peux coller ce fichier dans n'importe quel projet (`docs/INSTALL-CROSS-REVIEW.md` recommandé), et demander à ton Claude Code local *"lis docs/INSTALL-CROSS-REVIEW.md et installe la skill cross-review"*.

---

## Étape 1 — Installation (one-shot, idempotent)

Exécute cette commande à la racine du projet courant. Elle installe les 2 slash commands + les helper scripts depuis `~/Projets/Project-Forge`. Re-run safe (idempotent).

```bash
# Installer les 2 slash commands + helpers depuis Project-Forge
bash ~/Projets/Project-Forge/tools/install-skill pf-cross-review .
bash ~/Projets/Project-Forge/tools/install-skill pf-cross-review-iterate .
```

**Si `~/Projets/Project-Forge` n'existe pas** sur cette machine :
```bash
git clone https://github.com/JimmyBlanquet/project-forge.git ~/Projets/Project-Forge
# puis re-run l'installation ci-dessus
```

Output attendu :
```
[install] Installed pf-cross-review → ./.claude/commands/pf-cross-review.md (inlined)
[install] Installed pf-cross-review-iterate → ./.claude/commands/pf-cross-review-iterate.md (inlined)
[install]   └─ Copied 4 helper file(s) → ./scripts/cross-review-iterate/
```

---

## Étape 2 — Vérification (test smoke)

```bash
# Skills installées ?
ls -la .claude/commands/pf-cross-review*.md
# attendu : 2 fichiers, ~5-25 KB

# Helpers présents et exécutables ?
ls -la scripts/cross-review-iterate/*.sh
# attendu : 4 fichiers .sh, mode -rwxr-xr-x

# Helper fonctionnel offline (pas besoin d'internet) ?
echo "test:1|claim A" > /tmp/r1
echo "test:1|claim A" > /tmp/r2
bash scripts/cross-review-iterate/diff-rounds-semantic.sh /tmp/r1 /tmp/r2
rm /tmp/r1 /tmp/r2
# attendu : '{"new":0,"dropped":0,"stable":1,...,"verdict":"stable",...}'

# Pré-requis externes (informatif — pas de fail si absent)
which jq      || echo "MANQUANT: apt install jq"
which codex   || echo "OPTIONNEL absent: utiliser --n0-only"
curl -s -m 5 -H "Authorization: Bearer $LLM_API_KEY" ${LLM_ENDPOINT:-http://localhost:11500}/v1/models > /dev/null \
   && echo "local LLM: OK" || echo "OPTIONNEL absent: utiliser --no-n2"
```

**Si une des 4 premières vérifs échoue** → re-run Étape 1.

---

## Étape 3 — Utilisation

Tu disposes maintenant de 2 slash commands :

### Cas standard : reviewer ta dernière feature

```
/pf-cross-review                        # auto-detect range vs branche parent
/pf-cross-review HEAD~5..HEAD           # range explicite
/pf-cross-review HEAD~5..HEAD --n0-only # mode dégradé (Anthropic seul)
/pf-cross-review HEAD~5..HEAD --no-n2   # sans local LLM endpoint
```

**Output** : `docs/plans/YYYY-MM-DD-cross-review-<slug>.md` avec table BLOCKER / IMPORTANT / NIT + verdict ship / fix-then-ship / no-ship.

### Cas itératif : valider stabilité après plusieurs fixes

```
/pf-cross-review-iterate HEAD~10..HEAD                    # défaut : max 5 rounds, stop à 2 rounds stables
/pf-cross-review-iterate --max-rounds 3 --stagnation-k 1
```

**Output** : session dir `.cross-review-iterate/<ts>/` + verdict (`converged` / `diverging` / `budget` / `max_iter`).

---

## Si Claude Code ne reconnaît pas la slash command après install

C'est probablement parce que la session Claude Code a démarré AVANT l'install. Au choix :

1. **Plus simple** : `cat .claude/commands/pf-cross-review.md` puis suis manuellement les étapes décrites dedans (le contenu de la skill est inliné dans ce fichier — pas besoin du dispatcher slash command)
2. **Redémarrer la session Claude Code** dans ce projet (le scan `.claude/commands/` se fait au boot)

---

## Mise à jour ultérieure (si Project-Forge évolue)

Re-run l'Étape 1. Le tool `install-skill` est idempotent : il écrase la version locale par la dernière version de Project-Forge sans perdre tes autres fichiers `.claude/commands/*` ni tes propres scripts.

```bash
# Re-sync depuis dernière version PF
bash ~/Projets/Project-Forge/tools/install-skill pf-cross-review .
bash ~/Projets/Project-Forge/tools/install-skill pf-cross-review-iterate .
```

---

## Pré-requis détaillés (cocher mentalement avant utilisation)

### Indispensables
- [ ] `jq` installé (`apt install jq` si absent)
- [ ] `bash` ≥ 4 (`bash --version`)
- [ ] `git` (présent par défaut)
- [ ] `~/Projets/Project-Forge` accessible OU clone GitHub possible

### Selon flags utilisés
- [ ] `codex` CLI authentifié (`codex login status`) — **N1**, sinon `--n0-only`
- [ ] Network access to `${LLM_ENDPOINT}` (e.g. `http://localhost:11500`) + `LLM_API_KEY` exportée — **N2 local LLM**, sinon `--no-n2`
  ```bash
  export LLM_API_KEY="your-llm-api-key"  # if your endpoint requires auth
  ```
- [ ] Anthropic API key configurée dans Claude Code — **N0** (toujours requis)

---

## Architecture (pour comprendre quand t'en servir)

| Quoi | Quand l'utiliser | Quand NE PAS |
|---|---|---|
| `/pf-cross-review` | Après 5-15 commits substantiels — détection bugs blind-spot same-LLM | Single commit cosmétique, range > 50 commits, diff > 100KB |
| `/pf-cross-review-iterate` | Après plusieurs fixes successifs — vérifier stabilité (anti-spec-drift) | Single commit, code propre, budget < $5 |

**Coût** : ~$0.50-1.00 par review N0 Anthropic. N1 Codex = quota ChatGPT. N2 local LLM = $0 (GPU déjà payé).
**Durée** : ~3-5 min `/pf-cross-review`. ~10-30 min `/pf-cross-review-iterate` selon convergence.

---

## En cas de problème

- **Helpers absents après install** → vérifie que `~/Projets/Project-Forge/scripts/cross-review-iterate/` existe (commit `0658274` ou ultérieur)
- **`codex` hang sur gros prompt (>80KB)** → connu, utilise `--n0-only`
- **HTTP 502 local LLM** → serveur saturé/indispo, utilise `--no-n2` ou attendre 2 min
- **HTTP 400 exceed_context_size** → diff trop gros pour modèle N2 actuel, découpe le range

---

## Versions

| Version | Date | Highlight |
|---|---|---|
| V3.3 | 2026-05-03 | N2 local LLM via HTTP direct llama-swap, pre-flight ctx-size check |
| V4.1 | 2026-05-03 | Wrapper itératif + fingerprint sémantique LLM-as-judge |

Source canonique : `~/Projets/Project-Forge/extensions/pf-cross-review/` et `extensions/pf-cross-review-iterate/`.
