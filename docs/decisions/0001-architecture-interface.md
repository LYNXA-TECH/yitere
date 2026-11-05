# 0001 · Architecture de l'interface web

Statut : acceptée le 4 novembre 2026, à la fusion de la PR #3 · Auteure : Aissatou · Relecture : Cellou

## Contexte

Le dépôt contient déjà la partie donnée, écrite par Cellou : la sonde
(`sonde/sonde.js`), l'ingestion et la lecture publique (`serveur/api.js`),
le schéma (`db/schema.sql`) et la méthodologie (`docs/methodologie.md`).
La base est un PostgreSQL hébergé chez Supabase. Le serveur tourne en
service systemd sur `yitere.lynxatech.com`.

Il manque l'interface : la carte, les services, la fiche d'un service,
les échanges entre développeurs, la mesure navigateur, l'inscription des
hôtes de sonde et les données ouvertes. La conception est la maquette v3.

## Principe directeur

Chaque règle n'existe qu'à un seul endroit. La base calcule les verdicts,
l'interface les affiche. L'interface ne recalcule jamais un verdict, et
ne contredit jamais la méthodologie.

## Décisions

### D1 · Un seul dépôt, un dossier `web/`

L'interface vit dans `web/`, à côté de `sonde/`, `serveur/` et `db/`.
Raison : le jury voit tout le projet au même endroit, avec un seul
historique et une seule intégration continue.
Écarté : un dépôt séparé pour l'interface, qui couperait l'historique en deux.

### D2 · Next.js 15, en TypeScript strict

Raison : les pages sont rendues sur le serveur, donc légères pour une
connexion lente. Le typage strict détecte les erreurs avant l'exécution.
Écarté : Vite et React seul, où tout le rendu se fait dans le navigateur
et où chaque page envoie plus de JavaScript.

### D3 · Composants serveur par défaut, composants client seulement pour l'interactif

Composants client : la carte, la frise temporelle, la mesure navigateur,
les formulaires. Tout le reste est rendu sur le serveur.
Raison : moins de JavaScript envoyé au visiteur.

### D4 · L'interface passe toujours par l'API, jamais directement par la base

Elle lit `/api/v1/...` et n'a aucun accès à la base.
Raison : une seule porte d'entrée vers les données, avec un seul endroit à sécuriser.
Conséquence : chaque route nouvelle (séries, verdicts, échanges) est
demandée par écrit à Cellou, une route à la fois.

### D5 · Une couche d'accès typée, avec deux sources

`web/lib/donnees/` expose des fonctions typées. Une variable
d'environnement choisit la source : `exemple` (le jeu de la maquette)
ou `api` (le serveur de Cellou).
Raison : l'interface avance sans attendre l'API, et les types tiennent
lieu de contrat écrit entre les deux parties.
Règle : la source `exemple` est toujours signalée à l'écran par un
badge « Données d'exemple ».

### D6 · Carte : MapLibre GL 5 (licence BSD-3), sans serveur de tuiles

Vue globe à l'échelle du continent, contours Natural Earth (domaine
public), positions arrondies à la ville. Chargée seulement dans le
navigateur, avec une vue Liste équivalente pour le clavier et les
lecteurs d'écran.
Règle : aucun trait entre deux villes ne représente un chemin réseau,
puisque le routage n'est pas mesuré (méthodologie, section 1).
Écarté : Mapbox GL, propriétaire depuis la version 2 ; Three.js, trop
lourd pour le besoin.

### D7 · Graphiques en SVG, rendus sur le serveur

Raison : aucune dépendance, aucun JavaScript, accessibles par une
description textuelle.
Écarté pour l'instant : uPlot (MIT), à reprendre si un zoom interactif
devient nécessaire.

### D8 · Styles : CSS Modules et variables CSS

Les couleurs, la typographie et les espacements de la direction
artistique sont définis une seule fois dans `web/styles/variables.css`.
Raison : du CSS standard, sans syntaxe supplémentaire, que chacun peut
lire et expliquer.
Écarté : Tailwind, dont les classes sont plus difficiles à relire.

### D9 · Connexion GitHub par Supabase Auth

Raison : le projet Supabase existe déjà, et la connexion GitHub y est
fournie. Dépendance : `@supabase/ssr` (MIT).
À confirmer avec Cellou : la région du projet Supabase, que la page
Confidentialité doit indiquer exactement.

### D10 · Qualité vérifiée par des tests et une intégration continue

Vitest (MIT) pour la logique, Playwright (Apache-2.0) pour les
parcours, ESLint et Prettier (MIT). La CI GitHub vérifie la
compilation, le lint et les tests à chaque envoi.
Chaque commit porte son test d'acceptation, montré rouge puis vert
(protocole, section 3).
Écarté : axe-core (MPL-2.0) et pa11y (LGPL), dont les licences ne sont
pas autorisées par le règlement.

## Licences

Code sous licence MIT, données sous licence CC BY 4.0. Toute dépendance
ajoutée doit être sous licence MIT, Apache-2.0, BSD ou ISC.

## Questions ouvertes

1. L'objet témoin Datacloud : `db/seed.sql` (ligne 8) et la section 2 de
   la méthodologie le contiennent encore, alors que la section 4 dit
   « un seul objet ».
   **Réglé** : objet Datacloud retiré, PR #5.
2. La référence de contenu : la méthodologie (section 2) indique
   `cloudflare.com/cdn-cgi/trace`, le seed (ligne 13) indique
   `connectivity-check.gstatic.com/generate_204`.
3. Le vocabulaire : « verdict », comme dans la méthodologie, plutôt que
   « diagnostic », comme dans la maquette.
   **Réglé** : « verdict » partout (revue de Cellou, 5 novembre 2026).
4. Le schéma des échanges : il faut ajouter à `posts` un titre, la ville,
   l'opérateur, le contexte de mesure, les réponses et les confirmations.
   La migration est écrite par l'interface et appliquée par Cellou
   (protocole, section 9).
