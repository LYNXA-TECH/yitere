# Composants et licences

Le règlement de la CADEV 2026 interdit les composants sous licence GPL, LGPL ou AGPL.
YITERE n'en contient aucun. Deux scripts le vérifient à partir des fichiers de verrouillage,
et échouent dès qu'un paquet porte une licence interdite ou n'en déclare aucune :

    npm run licences              # serveur (package-lock.json à la racine)
    cd web && npm run licences    # interface (web/package-lock.json)

Ils refusent aussi les licences à réciprocité (MPL, EPL, SSPL).

## Le code de YITERE

| Partie | Licence | Titulaire |
|---|---|---|
| Code du dépôt (`serveur/`, `sonde/`, `db/`, `web/`, `scripts/`) | MIT (fichier `LICENSE`) | LYNXA SARL |
| Données de mesure publiées | CC BY 4.0 | LYNXA SARL |

## Serveur (`package.json`)

Une seule dépendance directe, le client PostgreSQL, et ses 13 dépendances indirectes.

| Paquet | Version | Licence |
|---|---|---|
| pg | 8.23.1 | MIT |
| pg-pool, pg-protocol, pg-types, pg-connection-string, pg-cloudflare, pgpass | | MIT |
| postgres-array, postgres-bytea, postgres-date, postgres-interval, xtend | | MIT |
| pg-int8, split2 | | ISC |

## Sonde (`sonde/sonde.js`)

Aucune dépendance : seulement les modules intégrés de Node.js.

## Interface web (`web/package.json`)

123 paquets installés. Les dépendances directes :

| Paquet | Version | Licence | Rôle |
|---|---|---|---|
| next | 15.5.28 | MIT | Cadre de l'interface |
| react, react-dom | 19.2.9 | MIT | Rendu |
| marked | 18.1.2 | MIT | Mise en forme des textes de méthode |
| geist | 1.8.2 | SIL OFL 1.1 | Polices Geist et Geist Mono, servies par le site |
| typescript | 5.9.3 | Apache-2.0 | Vérification des types (développement) |
| vitest, vite | 4.1.12, 7.3.7 | MIT | Tests (développement) |
| prettier | 3.9.10 | MIT | Formatage (développement) |
| @types/node, @types/react, @types/react-dom | | MIT | Types (développement) |

Licences présentes parmi les paquets indirects, en plus de MIT : Apache-2.0
(`@swc/helpers`, `expect-type`), ISC (`picocolors`, `siginfo`), BSD-3-Clause
(`source-map-js`), 0BSD (`tslib`), CC BY 4.0 (`caniuse-lite`, données de compatibilité
des navigateurs).

`sharp` est remplacé par un module vide (`web/stubs/sharp`, MIT) : le paquet d'origine
embarque libvips, sous LGPL, et YITERE n'optimise aucune image côté serveur.

## Données et ressources tierces

| Ressource | Licence | Usage |
|---|---|---|
| Natural Earth 1:110 m | Domaine public | Contours des pays de la carte (`web/lib/geo/afrique.ts`) |
| Objet témoin (`temoin.bin`) servi par jsDelivr | Fichier du dépôt (MIT) | Mesure de débit |
| Voix « siwis » pour Piper (corpus SIWIS) | CC BY 4.0 | Voix off de la vidéo de démonstration (hors dépôt) |

## Logiciels d'exploitation

Utilisés pour faire tourner YITERE sur le serveur de mesure. Ils ne font pas partie du
dépôt : ils ne sont ni modifiés, ni distribués avec YITERE, et aucun code de YITERE n'en
dérive.

| Logiciel | Version | Licence | Rôle |
|---|---|---|---|
| Node.js | 20 ou plus | MIT | Exécute le serveur, la sonde et l'interface |
| PostgreSQL | 16 | PostgreSQL License (permissive) | Base de mesures |
| nginx | 1.24.0 | BSD-2-Clause | Frontal HTTPS, renvoie vers l'interface et l'API |
| Ubuntu | 24.04.4 LTS | Système hôte, licences de la distribution | Système du serveur |
