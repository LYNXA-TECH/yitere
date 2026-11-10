# Usage de l'intelligence artificielle

Le règlement de la CADEV 2026 autorise l'IA à condition de la déclarer : outils utilisés et
parties concernées. Cette déclaration couvre tout le dépôt. Elle est tenue à jour à chaque
nouvelle partie.

## Outils

| Outil | Éditeur | Usage |
|---|---|---|
| Claude (application Claude, avec accès au dossier du projet) | Anthropic | Conception, maquette, code de l'interface web, documentation |
| Claude Code | Anthropic | Cité par le protocole de travail (`docs/PROTOCOLE-TRAVAIL-LYNXA.md`) ; usage à préciser par Cellou ci-dessous |

## Parties concernées

### Interface web (`web/`) · Aissatou

| Partie | Rôle de l'IA | Rôle d'Aissatou |
|---|---|---|
| Audit UX, conception et maquette v3 (15 écrans) | Rédaction et dessin des propositions | Choix, arbitrages, retours de Cellou intégrés |
| Décisions d'architecture (`docs/decisions/`) | Rédaction à partir des choix discutés | Décisions, relecture ; revue de Cellou |
| Socle : configuration, CI, styles, tests de contraste | Code écrit pas à pas, chaque ligne expliquée | Compréhension, exécution des tests (rouge puis vert), commits |
| Formatage `Intl`, dictionnaires FR/EN, données, en-tête | Code proposé, tests écrits avant le code | Vérification, commits |
| Pages alignées sur la maquette, simulateur de données d'exemple | Code généré, testé avant livraison | Choix du périmètre (maquette « telle qu'elle est »), relecture, commits |
| Contrat d'API (`docs/CONTRAT-API-INTERFACE.md`) | Rédaction | Validation ; à valider par Cellou |

### Serveur, sonde et base (`serveur/`, `sonde/`, `db/`) · Cellou

À compléter par Cellou : outils utilisés et parties concernées.

## Ce qui reste humain

- Toutes les décisions de produit et d'architecture, et les arbitrages entre options.
- La relecture de chaque pull request par l'autre membre de l'équipe avant fusion.
- Les opérations sur la production (base, secrets, déploiement) : le protocole les interdit à
  l'IA (`docs/PROTOCOLE-TRAVAIL-LYNXA.md`, section 8).
- Les commits et les push.

## Comment le code généré est contrôlé

Aucun code n'entre dans le dépôt sans passer par les mêmes contrôles que le code écrit à la main :

- tests Vitest, exécutés en local et dans la CI ;
- vérification des types (`tsc`, TypeScript strict) ;
- formatage Prettier vérifié ;
- licences des dépendances vérifiées par `web/scripts/verifier-licences.mjs` ;
- `npm audit` sans vulnérabilité ;
- compilation Next.js, avec le budget de poids de la décision 0002 ;
- relecture de la pull request par l'autre membre de l'équipe.
