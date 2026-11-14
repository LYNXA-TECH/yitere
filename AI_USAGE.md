# Usage de l'intelligence artificielle

Le règlement de la CADEV 2026 autorise l'IA à condition de la déclarer : outils utilisés et
parties concernées. Cette déclaration couvre tout le dépôt. Elle est tenue à jour à chaque
nouvelle partie.

## Outils

| Outil | Éditeur | Usage |
|---|---|---|
| Claude (application Claude, avec accès au dossier du projet) | Anthropic | Conception, maquette, code de l'interface web, documentation ; code de la sonde et du serveur, méthodologie, revue des pull requests |
| Claude Code | Anthropic | Moteur des sessions de travail de Cellou dans l'application Claude ; les commits préparés par l'IA portent la mention `Co-Authored-By` |

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

### Serveur, sonde, base et méthode (`serveur/`, `sonde/`, `db/`, `docs/`) · Cellou

| Partie | Rôle de l'IA | Rôle de Cellou |
|---|---|---|
| Sonde (`sonde/sonde.js`) | Code écrit par l'IA, y compris le refus de l'auto-mesure | Choix des cibles et des grandeurs mesurées, arbitrages, validation sur le serveur |
| Serveur d'ingestion et de lecture (`serveur/api.js`) | Code écrit par l'IA | Choix de conception (jeton par sonde, aucune adresse IP), validation |
| Verdicts et fiche de service (`serveur/verdicts.js`, `serveur/detail.js`) | Code et tests écrits par l'IA | Règles de jugement fixées (deux fois l'habituel, plus de la moitié en échec, Madrid hors calcul), validation sur données réelles |
| Dépôt de publications sans compte (`serveur/publications.js`) | Code et tests écrits par l'IA | Choix : aucun compte, aucune adresse IP, chaque dépôt masqué jusqu'à relecture ; relecture faite par Cellou en base |
| Composants et licences (`docs/COMPOSANTS-ET-LICENCES.md`, `scripts/verifier-licences.mjs`) | Inventaire et script écrits par l'IA | Vérification, choix de la licence MIT et du titulaire |
| Schéma et amorçage de la base (`db/`) | Rédaction | Décisions : aucune colonne d'adresse, un seul objet témoin servi par jsDelivr |
| Méthodologie (`docs/methodologie.md`) | Rédaction à partir des décisions prises | Décisions (Madrid assumé comme repère, objet témoin unique), relecture |
| Protocole de travail (`docs/PROTOCOLE-TRAVAIL-LYNXA.md`) | Rédaction | Règles fixées par Cellou, dont les interdits de la section 8 |
| Revue des pull requests | L'IA rejoue la chaîne de contrôle sur le résultat de fusion (tests, types, licences, audit, compilation) et rédige l'avis | Décision de fusion, donnée par écrit en nommant le SHA exact ; fusion faite par Cellou |
| Exploitation du serveur de mesure | Commandes d'installation et de configuration exécutées par l'IA, opération par opération | Accord donné avant chaque opération, contrôle du résultat |

### Vidéo de démonstration · Cellou

| Partie | Rôle de l'IA | Rôle de l'équipe |
|---|---|---|
| Script et sous-titres | Rédaction à partir du site réel | Relecture des faits et des chiffres par Cellou |
| Plan 1 (terminal) et carton final | Animation et mise en page | Validation |
| Plans filmés sur le site en production (plans 2 à 4, 6 et 7) | Captures automatiques du site, montage | Choix des plans et validation |
| Plan 5, « Mesurer depuis chez moi » | Recadrage et sous-titres | Filmé par Cellou depuis Conakry, sur sa connexion |
| Voix off | Voix de synthèse : Piper, voix « siwis » (licence CC BY 4.0, corpus SIWIS) | Choix de la voix |
| Musique de fond | Composée par synthèse, sans aucun extrait externe | Choix de la version avec musique |


## Ce qui reste humain

- Toutes les décisions de produit et d'architecture, et les arbitrages entre options.
- La décision de fusionner chaque pull request, prise par l'autre membre de l'équipe.
- L'accès à la base de production et aux secrets : le protocole l'interdit à l'IA sans accord
  écrit de Cellou pour l'opération précise (`docs/PROTOCOLE-TRAVAIL-LYNXA.md`, section 8).
- Les push et les fusions dans `main`. Les commits sont faits par les membres de l'équipe ;
  ceux que l'IA a préparés portent la mention `Co-Authored-By`.

## Comment le code généré est contrôlé

Aucun code n'entre dans le dépôt sans passer par les mêmes contrôles que le code écrit à la main :

- tests Vitest pour l'interface, exécutés en local et dans la CI ;
- tests `node --test` pour le serveur (`npm test`) ;
- vérification des types (`tsc`, TypeScript strict) ;
- formatage Prettier vérifié ;
- licences des dépendances vérifiées par `web/scripts/verifier-licences.mjs` et `scripts/verifier-licences.mjs` (inventaire : `docs/COMPOSANTS-ET-LICENCES.md`) ;
- `npm audit` sans vulnérabilité ;
- compilation Next.js, avec le budget de poids de la décision 0002 ;
- relecture de la pull request par l'autre membre de l'équipe.
