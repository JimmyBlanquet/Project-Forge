# Structure Standard d'un Production Skill

Chaque skill suit cette structure pour garantir qualité et réutilisabilité.

## Structure de Fichiers

```
skill-name/
├── manifest.yaml          # Métadonnées du skill
├── README.md              # Documentation usage
├── src/                   # Code source
│   ├── index.ts          # Entry point
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utilities
├── examples/              # Exemples d'usage
│   └── basic-usage.ts
├── tests/                 # Tests
│   └── index.test.ts
└── resources.md           # Ressources externes

