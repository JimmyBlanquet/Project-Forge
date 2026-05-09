import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["app/**/*.{ts,tsx}"],
  project: ["app/**", "components/**", "lib/**", "utils/**"],
  next: true,
  ignoreDependencies: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
    "@tailwindcss/line-clamp",
    "@tailwindcss/typography",
    "eslint-config-prettier",
    "eslint-plugin-react",
    "eslint-plugin-tailwindcss",
    "eslint-plugin-sonarjs",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "husky",
    "pretty-quick",
    "autoprefixer",
  ],
};

export default config;
