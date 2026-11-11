# 0002 · Structure, langues et performance de l'interface

Statut : proposée, révisée après la revue de Cellou · Auteure : Aissatou · Relecture : Cellou

## Contexte

Le socle est en place (décision 0001). Avant d'écrire les pages, il faut fixer
les règles que toutes suivront, pour trois raisons :

- YITERE s'adresse aux développeurs de tout le continent : pays francophones,
  anglophones, lusophones, arabophones. L'anglais est aussi la langue de la
  documentation technique et de la recherche.
- Beaucoup de visiteurs auront une connexion lente, des forfaits de données
  limités et des téléphones d'entrée de gamme.
- L'équipe est réduite, et la clôture tombe le 15 novembre à 17 h GMT : chaque
  page doit coûter le moins de code possible.

## Décisions

### D11 · Tout ce qui est une donnée est lu, jamais recopié

- Une seule route pour toutes les fiches de service : `app/[langue]/services/[cle]/page.tsx`.
  Une cible ajoutée au seed obtient sa fiche sans une ligne de code.
- La liste des services vient de `/api/v1/cibles`, qui existe déjà.
- Les pays viennent des contours Natural Earth, les villes des sondes renvoyées par l'API.
- La navigation est un seul tableau de configuration, lu par l'en-tête et la barre mobile.
- La page Méthodologie affiche `docs/methodologie.md`, en français (voir D13).

Raison : ce qui n'est écrit qu'une fois ne peut pas se contredire, et n'est corrigé qu'une fois.

### D12 · Une structure en couches, qui ne dépend que vers le bas

```
web/
  app/              routes : chaque page assemble, sans logique propre
  components/       briques d'affichage, qui reçoivent leurs données et leurs textes
  lib/donnees/      contrat, source « exemple », source « api »
  lib/format/       nombres, dates, pluriels
  lib/i18n/         dictionnaires et choix de la langue
```

`app` utilise `components` et `lib`. Jamais l'inverse. Un composant reçoit ses
données et ses textes ; il ne lit ni l'API ni la langue de la page.

Le dossier reste `components/` : `app/` est imposé par Next.js et `lib/` est en
anglais de toute façon, le renommer déplacerait la frontière sans la rendre plus
cohérente. À rediscuter après le 23 novembre.

### D13 · Français et anglais, le français d'abord

- Les adresses portent la langue : `/fr/services`, `/en/services`.
- La racine `/`, et toute adresse sans langue, renvoie vers la langue de l'en-tête
  `Accept-Language` du navigateur, et vers le français à défaut. Un sélecteur de
  langue reste visible sur chaque page et garde la même page.
- Chaque langue a son dictionnaire : `lib/i18n/fr.ts`, `lib/i18n/en.ts`. Le français
  est la référence : son type définit les clés.
- **Jusqu'au 23 novembre, une clé anglaise manquante n'empêche pas la compilation.**
  Le site affiche alors le texte français précédé de la marque visible `[FR]`.
  Sinon personne ne pourrait livrer une phrase française sans écrire l'anglaise dans
  le même commit. La règle stricte (clé manquante = compilation refusée) revient
  après le concours.
- **Pages traduites pour le 15 novembre** : l'accueil, la liste des services, la fiche
  d'un service et la carte, celles que verront le vote des pairs et le vote du public.
  Un test vérifie qu'aucun texte de ces pages ne porte la marque `[FR]`.
- **Pages en français seulement** : Méthodologie (1 600 mots de prose technique),
  Échanges, Contribuer, et plus tard « Mon espace » et « Publier ». Sur `/en`, elles
  commencent par une phrase en anglais qui le dit. On ne cache pas que la version
  anglaise n'existe pas encore.
- Un dictionnaire contient des phrases entières avec leurs variables, jamais des
  morceaux recollés : l'ordre des mots change d'une langue à l'autre.
- Nombres, dates, noms de pays et pluriels passent par `Intl` (`NumberFormat`,
  `DateTimeFormat`, `DisplayNames`, `PluralRules`), natif dans Node et dans les
  navigateurs.
- Ajouter une langue revient à ajouter un dictionnaire. L'arabe demandera en plus
  l'écriture de droite à gauche (`dir="rtl"`), prévue mais pas réalisée.

Écarté : `next-intl` (MIT). Il apporte du JavaScript côté navigateur et des notions
à apprendre, pour un besoin que quelques dizaines de lignes et `Intl` couvrent.

### D14 · Un budget de performance chiffré

Les chiffres sont ceux de la colonne « First Load JS » et de la colonne « Size » que
`next build` affiche à la fin de la compilation, en ko compressés (gzip).

| Partie | Mesure actuelle | Budget |
|---|---|---|
| Socle commun de Next.js et React (« First Load JS shared by all ») | 103 ko, mesuré sur `main` et sur la branche des pages | **110 ko** |
| JavaScript propre à une page (« Size ») | de 0,7 à 2,5 ko selon la page | **10 ko** |
| Page Carte (accueil) | 4 ko : le fond est un SVG dessiné sur le serveur, seuls les marqueurs, la frise et les calques sont en JavaScript | **10 ko**, comme les autres |
| Polices Geist et Geist Mono | 70 ko chacune, servies par le site et mises en cache ; seule Geist est préchargée | Hors budget JavaScript ; à réduire par un sous-ensemble de caractères après le concours |

Le socle est sous budget lui aussi : c'est lui que télécharge un visiteur sur une
connexion lente, bien plus que les quelques ko de chaque page. Une dépendance qui
l'alourdit doit le justifier.

| Règle | Moyen |
|---|---|
| Aucune page n'attend l'API pour s'afficher | Pages générées à la compilation, régénérées au plus tôt toutes les 60 s |
| Peu de JavaScript dans le navigateur | Composants serveur par défaut ; un seul composant client dans l'en-tête (rubrique active et langue) |
| Rien d'inutile à télécharger | Aucune image matricielle, CSS Modules, carte en SVG sans bibliothèque, polices servies par le site |
| Les pages lisent leur contenu sans JavaScript | HTML d'abord, liens natifs |

Le test automatique du budget attendra la fin du concours. D'ici là, chaque fusion
compare la sortie de `next build` à ce tableau. Un seuil se relève par une décision
écrite, avec la mesure qui le justifie.

### D15 · La maquette v3 telle qu'elle est, et sa police

- L'interface reprend la maquette v3 écran par écran, avec son jeu de données d'exemple. Ce jeu passe par
  `web/lib/donnees/exemple/simulateur.ts`, qui joue le rôle de l'API et applique les règles de la méthodologie :
  les pages n'interprètent rien, elles affichent des objets du contrat.
- La maquette utilise Geist et Geist Mono (Vercel). Leur licence, SIL OFL 1.1, est une licence libre propre aux
  polices : elle n'entre pas dans la liste MIT, Apache-2.0, BSD, ISC, qui vise le code. Elles sont acceptées pour
  la fidélité à la maquette, servies par le site (paquet `geist`), sans requête vers un service tiers.

## Conséquences

- Chaque texte visible des pages traduites passe par un dictionnaire, y compris dans
  les tests.
- `PastilleEtat` et `BlocVerdict` reçoivent leurs textes du dictionnaire de la page.
- Choisir la langue d'après `Accept-Language` impose du code au moment de la requête
  (le middleware de Next.js) : le site ne peut plus être servi comme de simples
  fichiers statiques. Les pages sous `/fr` et `/en`, elles, restent pré-générées.
- Une page mise en cache 60 secondes affiche l'origine de ses chiffres : le badge
  « Données d'exemple », ou l'heure à laquelle ses données ont été lues. Le cache ne
  peut pas faire passer une vieille mesure pour fraîche.
