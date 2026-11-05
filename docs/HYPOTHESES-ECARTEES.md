# Hypothèses écartées

Chaque piste éliminée est écrite ici avec la preuve qui l'élimine, pour ne pas
la retester plus tard (protocole, section 6). Les plus récentes en premier.

## Interface web

### 2026-11-05 · La CI a besoin de npm 11 pour installer les dépendances

- **Hypothèse.** L'étape « Installer npm 11 » de la CI est nécessaire, puisque Vitest 4
  ne s'installe pas avec npm 10 (entrée « Installer Vitest 4 avec npm 10 »).
- **Preuve qui l'écarte.** L'échec ne concerne que `npm install`, qui reconstruit l'arbre des
  dépendances. La CI lance `npm ci`, qui lit le verrou sans le reconstruire. Avec npm 10.9.9,
  `npm ci` réussit sur `d2e0e87`, puis licences, `npm audit`, 48 tests et compilation passent.
  Constat de Cellou en revue (npm 10.9.4), reproduit ici avec npm 10.9.9.
- **Retenu.** Étape retirée de la CI. `"engines": { "npm": ">=11" }` reste dans
  `web/package.json` : il vaut pour `npm install`, c'est-à-dire pour quiconque modifie les dépendances.

### 2026-11-03 · Laisser Vitest 4 choisir sa version de Vite

- **Hypothèse.** Déclarer `vitest@4.1.12` suffit : Vitest installe une version de Vite compatible.
- **Preuve qui l'écarte.** Sans `vite` déclaré, npm installe `vite@8.3.5`. Deux échecs :
  - `npm test` : `RolldownError: Parse failure`, car Vite 8 n'analyse plus le JSX
    avec `esbuild: { jsx: "automatic" }` ;
  - `npm run licences` : 12 paquets `lightningcss*` sous licence `MPL-2.0`, apportés par Vite 8.
- **Retenu.** `vite@7.3.7` déclaré explicitement dans `web/package.json` (commit `033fa84`).

### 2026-11-03 · Substituer `postcss` dans tout l'arbre des dépendances

- **Hypothèse.** `"overrides": { "postcss": "8.5.29" }` corrige la faille de `postcss`.
- **Preuve qui l'écarte.** `npm audit` passe à 0, mais `npm ls postcss` répond
  `invalid: postcss@8.5.32 … from node_modules/vite overridden` : Vite exige une autre version.
- **Retenu.** Substitution limitée à Next.js : `"overrides": { "next": { "postcss": "8.5.29" } }`.
  `npm ls` est valide et `npm audit` répond `found 0 vulnerabilities` (commit `033fa84`).

### 2026-11-03 · Corriger les failles de Vitest en restant en 3.x

- **Hypothèse.** `vitest@3.2.7`, dernière version 3.x, corrige `tinypool` et `@vitest/mocker`.
- **Preuve qui l'écarte.** Avec `vitest@3.2.7`, `npm audit` signale toujours
  `5 vulnerabilities (2 moderate, 1 high, 2 critical)` : les correctifs ne sont publiés que dans `vitest@4.1.12`.
- **Retenu.** `vitest@4.1.12`, qui impose npm 11 (voir l'entrée suivante).

### 2026-11-03 · Installer Vitest 4 avec npm 10

- **Hypothèse.** `vitest@4.1.12` s'installe avec la version de npm livrée avec Node 22.
- **Preuve qui l'écarte.** Avec npm 10.9.9, `npm install` échoue trois fois de suite avec
  `npm error Cannot read properties of null (reading 'edgesOut')`, levée dans
  `@npmcli/arborist/lib/arborist/build-ideal-tree.js`, dans `#loadPeerSet`.
  Avec npm 11.6.2, la même installation réussit. L'échec vise `npm install` seulement :
  `npm ci` réussit avec npm 10 (entrée du 5 novembre).
- **Retenu.** `"engines": { "npm": ">=11" }` dans `web/package.json` (commit `033fa84`).

### 2026-11-03 · Remplacer `sharp` directement dans `overrides`

- **Hypothèse.** `"overrides": { "sharp": "file:./stubs/sharp" }` suffit à remplacer `sharp`.
- **Preuve qui l'écarte.** `npm ls sharp` répond `ELSPROBLEMS`,
  `invalid: "file:./stubs/sharp" from node_modules/next overridden`, et le script de
  licences signale deux entrées `sharp` sans licence déclarée.
- **Retenu.** `"sharp": "file:stubs/sharp"` dans `dependencies` et `"overrides": { "sharp": "$sharp" }`.
  `npm ls` est valide (commit `8474c84`).

## Dépôt

### 2026-11-03 · `.editorconfig` absent du commit parce qu'exclu par une règle d'ignore

- **Hypothèse.** `git ls-files` ne trouve pas `.editorconfig` parce qu'une règle d'exclusion le cache.
- **Preuve qui l'écarte.** `git check-ignore -v .editorconfig` ne renvoie rien, et
  `git config --get core.excludesFile` non plus.
- **Cause démontrée.** L'index Git contenait `.editorConfig`, avec un C majuscule.
  Sous Windows (`core.ignorecase = true`), `git status` ne voyait aucune différence ;
  sous Linux, les éditeurs auraient ignoré le fichier.
- **Retenu.** `git mv -f .editorConfig .editorconfig`, puis complément du commit, devenu `662dbb4`.
