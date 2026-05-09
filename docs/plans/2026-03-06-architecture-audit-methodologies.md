# Recherche : Methodologies d'audit d'architecture logicielle

**Date:** 2026-03-06
**Objectif:** Identifier les methodologies existantes pour auditer l'architecture d'un projet et choisir l'approche adaptee a Project-Forge (petites equipes, SaaS MVP, workflow Claude Code).

---

## 1. Methodologies academiques et industrielles

### 1.1 ATAM (Architecture Tradeoff Analysis Method)

**Origine:** Software Engineering Institute, Carnegie Mellon University.
**Objectif:** Reveler comment une architecture satisfait ses attributs de qualite et identifier les trade-offs entre eux.

**Les 9 etapes :**

| # | Etape | Description |
|---|---|---|
| 1 | Presenter ATAM | Introduire la methode aux parties prenantes |
| 2 | Presenter les drivers business | Objectifs et motivations |
| 3 | Presenter l'architecture | Design actuel vs objectifs business |
| 4 | Identifier les approches archi | Patterns et strategies de design utilises |
| 5 | Generer l'arbre d'utilite (Utility Tree) | Hierarchiser les attributs de qualite en scenarios concrets |
| 6 | Analyser les approches | Evaluer les patterns vs scenarios prioritaires |
| 7 | Brainstorm scenarios | Collecter et prioriser les scenarios stakeholders |
| 8 | Analyser avec scenarios | Tester les designs contre les scenarios |
| 9 | Presenter les resultats | Risques, sensitivity points, trade-offs |

**Concepts cles :**

- **Utility Tree** : Decomposition hierarchique des attributs de qualite en scenarios concrets, priorises par importance et risque.
- **Sensitivity Points** : Decisions archi qui ont un effet significatif sur un attribut de qualite.
- **Tradeoff Points** : Cas ou ameliorer un attribut degrade un autre (ex: perf vs maintenabilite).
- **Risques** : Decisions qui pourraient avoir des consequences negatives.

**3 types de scenarios :**
- **Use Case** : Patterns operationnels typiques
- **Growth** : Modifications futures anticipees
- **Exploratory** : Stress tests revelant les faiblesses

**Poids :** Lourd. Necessite plusieurs jours, 10+ participants. Inadapte pour un solo dev + Claude Code.

Source : https://anarchitectto.be/atam-a-comprehensive-guide-to-architecture-evaluation/

### 1.2 SAAM (Software Architecture Analysis Method)

**Objectif:** Evaluer la modifiabilite d'une architecture via des scenarios.
**Approche:** Plus simple qu'ATAM, focus sur un seul attribut (modifiabilite).
**Poids :** Moyen. 1-2 jours.

### 1.3 DCAR (Decision-Centric Architecture Review)

**Objectif :** Analyser la rationale derriere chaque decision architecturale.
**Approche :** Lightweight, concu pour l'agile. Se concentre sur les "forces" (influences non-triviales) qui ont guide les decisions.
**Poids :** Leger. Une demi-journee, 3-5 participants, 15-20 person-hours.
**Pertinence :** Forte pour Project-Forge car centre sur les ADR (decisions + rationale).

### 1.4 ARID (Active Reviews for Intermediate Designs)

**Objectif :** Evaluer des designs intermediaires (pas encore finalises).
**Approche :** Combine ATAM (scenarios stakeholders) + revue active de specs de design.
**Poids :** Leger. Focus sur la suitability, ne necessite pas de doc archi complete.
**Pertinence :** Utile pour evaluer l'archi en cours de dev (pas seulement post-mortem).

Source : https://pmc.ncbi.nlm.nih.gov/articles/PMC8838159/

### 1.5 Comparaison des methodes

| Methode | Focus | Duree | Participants | Adapte solo+IA ? |
|---|---|---|---|---|
| **ATAM** | Multi-attributs, trade-offs | 3-5 jours | 10+ | Non (trop lourd) |
| **SAAM** | Modifiabilite | 1-2 jours | 5+ | Non |
| **DCAR** | Decisions + rationale | 0.5 jour | 3-5 | Partiellement (ADR-centric) |
| **ARID** | Design intermediaire | 0.5 jour | 3-5 | Partiellement |
| **Lightweight/custom** | Adapte au contexte | 1-2h | 1 + IA | Oui |

---

## 2. Standards de qualite

### 2.1 ISO/IEC 25010:2023 (SQuaRE)

Modele de reference pour la qualite logicielle. 8 caracteristiques :

| # | Caracteristique | Sous-caracteristiques |
|---|---|---|
| 1 | **Functional Suitability** | Completeness, correctness, appropriateness |
| 2 | **Performance Efficiency** | Time behaviour, resource utilization, capacity |
| 3 | **Compatibility** | Co-existence, interoperability |
| 4 | **Usability** | Learnability, operability, accessibility, error protection |
| 5 | **Reliability** | Maturity, availability, fault tolerance, recoverability |
| 6 | **Security** | Confidentiality, integrity, non-repudiation, accountability, authenticity |
| 7 | **Maintainability** | Modularity, reusability, analysability, modifiability, testability |
| 8 | **Portability** | Adaptability, installability, replaceability |

Source : https://blog.pacificcert.com/iso-25010-software-product-quality-model/

### 2.2 SonarQube — Metriques industrielles de dette technique

| Metrique | Description | Cible |
|---|---|---|
| Technical Debt Ratio | Cout remediation / cout dev | < 5% |
| Maintainability Rating | A (< 5%) a E (> 50%) | A ou B |
| Cognitive Complexity | Difficulte de comprehension | < 15 par fonction |
| Code Coverage | % code couvert par tests | > 80% |
| Duplications | % code duplique | < 3% |
| Security Hotspots | Points necessitant revue securite | 0 non-reviewed |

Source : https://docs.sonarsource.com/sonarqube-server/2025.3/user-guide/code-metrics/metrics-definition

---

## 3. Outils d'enforcement automatise

### 3.1 Niveau editeur/CLI (dev-time)

| Outil | Ce qu'il fait | Nouvelle dep ? |
|---|---|---|
| **ESLint `no-restricted-imports`** | Bloque les imports interdits | Non (natif ESLint) |
| **eslint-plugin-boundaries** | Definit des zones et regles d'import | Oui (1 plugin) |
| **TypeScript Project References** | Split en sous-modules, imports explicites | Non |

### 3.2 Niveau CI (fitness functions)

| Outil | Ce qu'il fait | Nouvelle dep ? |
|---|---|---|
| **dependency-cruiser** | Graphe + validation des dependances JS/TS | Oui |
| **ArchUnitTS** | Tests d'architecture en TS (vitest/jest) | Oui |
| **Archgate** | ADR → regles executables + MCP pour Claude | Oui |

### 3.3 Niveau serveur (analyse continue)

| Outil | Ce qu'il fait | Self-hosted ? |
|---|---|---|
| **SonarQube** | 6000+ regles, quality gates, tracking dette | Oui ou SonarCloud |
| **Qodo (ex-CodiumAI)** | Review IA context-aware, drift detection | Cloud |
| **CodeRabbit** | Review IA automatique sur PR | Cloud |

---

## 4. Approche recommandee pour Project-Forge

### 4.1 Pourquoi les methodes classiques ne marchent pas directement

- **ATAM** : Concu pour 10+ personnes sur 3-5 jours. On est 1 dev + Claude Code.
- **SAAM** : Focus modifiabilite uniquement. Trop restreint.
- **DCAR** : Le plus proche (centre ADR) mais suppose 3-5 humains.

### 4.2 Ce qu'on peut emprunter

| De ATAM | Ce qu'on garde |
|---|---|
| Utility Tree | Hierarchiser les attributs de qualite en scenarios verifiables |
| Sensitivity/Tradeoff points | Identifier les decisions a fort impact |
| 3 types de scenarios | Use case, growth, exploratory |

| De DCAR | Ce qu'on garde |
|---|---|
| Focus decisions | Revue centree sur les ADR et leur rationale |
| Forces | Documenter les influences qui ont guide les choix |
| Lightweight | Executable en < 1h |

| De ISO 25010 | Ce qu'on garde |
|---|---|
| 8 attributs | Grille d'evaluation standardisee |
| Sous-caracteristiques | Checklist pour ne rien oublier |

### 4.3 Methodologie hybride "Project-Forge Architecture Review"

**Inspiree de :** ATAM (utility tree, scenarios) + DCAR (decisions-centric, lightweight) + ISO 25010 (grille d'attributs)

**Adaptee pour :** 1 dev + Claude Code, execution en 1 session (~30 min)

**7 axes d'evaluation :**

| # | Axe | Inspire de | Ce qu'on verifie |
|---|---|---|---|
| 1 | **Conformite Constitution** | DCAR (forces) | Le code respecte-t-il les principes fondateurs ? |
| 2 | **Respect des ADR** | DCAR (decisions) | Les decisions documentees sont-elles encore appliquees ? |
| 3 | **Integrite des couches** | ATAM (modularity) | Les boundaries d'import sont-elles respectees ? |
| 4 | **Maintenabilite** | ISO 25010 | Complexite, duplication, taille des fichiers, dead code |
| 5 | **Securite** | ISO 25010 | Auth, validation, secrets, injections |
| 6 | **Testabilite** | ISO 25010 | Coverage, qualite des tests, scenarios manquants |
| 7 | **Dette technique** | SonarQube | TODO/FIXME, patterns obsoletes, deps outdated |

**3 niveaux d'enforcement (du plus automatique au plus intelligent) :**

| Niveau | Mecanisme | Quand | Bloquant ? |
|---|---|---|---|
| 1. CLAUDE.md | Regles lues par tout agent avant de coder | Chaque action | Soft (confiance agent) |
| 2. ESLint rules | `no-restricted-imports` + sonarjs | Chaque lint (quality gate) | Oui |
| 3. Skill audit | `/speckit-archi-review` a la demande | Checkpoint periodique | Non (rapport) |

**Deroulement d'un audit (skill niveau 3) :**

```
1. CHARGER le contexte
   - Constitution (.speckit/constitution.md ou .yml)
   - Tous les ADR (docs/adr/*.md)
   - CLAUDE.md (regles d'architecture)

2. SCANNER le code (4 analyses paralleles)
   Agent 1 : Conformite constitution + ADR
   Agent 2 : Integrite des couches (imports, boundaries)
   Agent 3 : Maintenabilite (complexite, duplication, taille)
   Agent 4 : Securite + testabilite

3. SYNTHETISER
   - Score par axe (1-5 etoiles)
   - Violations critiques (bloquantes)
   - Warnings (a corriger)
   - Recommandations (nice to have)
   - ADR obsoletes a mettre a jour

4. PRODUIRE le rapport
   - docs/audits/YYYY-MM-DD-architecture-audit.md
   - Resume executif + detail par axe
   - Scenarios de risque (growth, exploratory)
   - Actions prioritaires
```

**Quand lancer un audit :**
- Apres une serie de stories Ralph++ (ex: fin de batch)
- Avant un deploiement majeur
- Quand on suspecte une derive (trop de hacks, complexite qui monte)
- Periodiquement (1x par mois si projet actif)

---

## 5. Sources

### Methodologies
- ATAM : https://anarchitectto.be/atam-a-comprehensive-guide-to-architecture-evaluation/
- ATAM original (SEI) : https://www.sei.cmu.edu/documents/629/2000_005_001_13706.pdf
- DCAR + lightweight methods : https://pmc.ncbi.nlm.nih.gov/articles/PMC8838159/
- ARID (SEI) : https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=513472
- ATAM + LLMs : https://arxiv.org/html/2506.00150v1

### Standards
- ISO 25010 : https://blog.pacificcert.com/iso-25010-software-product-quality-model/
- ISO 25010 + arc42 : https://quality.arc42.org/standards/iso-25010
- SonarQube metriques : https://docs.sonarsource.com/sonarqube-server/2025.3/user-guide/code-metrics/metrics-definition

### Outils
- eslint-plugin-boundaries : https://github.com/javierbrea/eslint-plugin-boundaries
- dependency-cruiser : https://xebia.com/blog/taking-frontend-architecture-serious-with-dependency-cruiser/
- Archgate : https://github.com/archgate/cli
- Fitness functions : https://www.infoq.com/articles/fitness-functions-architecture/
- Agentic AI governance : https://www.oreilly.com/radar/how-agentic-ai-empowers-architecture-governance/

### Architecture review pratique
- Harvard checklist : https://enterprisearchitecture.harvard.edu/application-architecture-checklist
- SaaS architecture 2025 : https://synmek.com/saas-architecture-for-startups-2025-guide
- AI code review 2026 : https://www.qodo.ai/blog/best-ai-code-review-tools-2026/
