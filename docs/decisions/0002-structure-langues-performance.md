# 0002 · Structure, langues et performance de l'interface

Statut : proposée · Auteure : Aissatou · Relecture : Cellou

## Contexte

Le socle est en place (décision 0001). Avant d'écrire les pages, il faut fixer
les règles que toutes suivront, pour trois raisons :

- YITERE s'adresse aux développeurs de tout le continent : pays francophones,
  anglophones, lusophones, arabophones. L'anglais est aussi la langue de la
  documentation technique et de la recherche.
- Beaucoup de visiteurs auront une connexion lente, des forfaits de données
  limités et des téléphones d'entrée de gamme.
- L'équipe est réduite : chaque page doit coûter le moins de code possible.

## Décisions

### D11 · Tout ce qui est une donnée est lu, jamais recopié

- Une seule route pour toutes les fiches de service : `app/[langue]/services/[cle]/page.tsx`.
  Une cible ajoutée au seed obtient sa fiche sans une ligne de code.
- La liste des services vient de `/api/v1/cibles`, qui existe déjà.
- Les pays viennent des contours Natural Earth, les villes des sondes renvoyées par l'API.
- La navigation est un seul tableau de configuration, lu par l'en-tête et la barre mobile.
- La page Méthodologie affiche `docs/methodologie.md`.

Raison : ce qui n'est écrit qu'une fois ne peut pas se contredire, et n'est corrigé qu'une fois.

### D12 · Une structure en couches, qui ne dépend que vers le bas

```
web/
  app/              routes : chaque page assemble, sans logique propre
  fonctionnalites/  un dossier par domaine : services/, carte/, echanges/, mesure/
  composants/       briques génériques, qui ne connaissent pas le métier
  lib/donnees/      contrat, source « exemple », source « api »
  lib/format/       nombres, dates, pluriels
  lib/i18n/         dictionnaires et choix de la langue
```

`app` utilise `fonctionnalites`, qui utilise `composants` et `lib`. Jamais l'inverse.
Un composant générique reçoit des données ; il ne sait pas ce qu'est npm ou un verdict.

### D13 · Français et anglais dès le lancement

- Les adresses portent la langue : `/fr/services`, `/en/services`.
- La racine `/` choisit la langue d'après l'en-tête `Accept-Language` du navigateur,
  et prend le français à défaut. Un sélecteur de langue reste visible sur chaque page.
- Chaque langue a son dictionnaire : `lib/i18n/fr.ts`, `lib/i18n/en.ts`. Le type de
  l'anglais est celui du français : une clé oubliée empêche la compilation.
- Un dictionnaire contient des phrases entières avec leurs variables, jamais des
  morceaux recollés : l'ordre des mots change d'une langue à l'autre.
- Nombres, dates et pluriels passent par `Intl` (`NumberFormat`, `DateTimeFormat`,
  `PluralRules`), natif dans Node et dans les navigateurs. La fonction maison
  `compter()`, qui ne sait accorder qu'en français, est remplacée.
- Ajouter une langue (portugais, arabe…) revient à ajouter un dictionnaire.
  L'arabe demandera en plus l'écriture de droite à gauche (`dir="rtl"`), prévue
  mais pas réalisée.

Écarté : `next-intl` (MIT). Il apporte du JavaScript côté navigateur et des notions
à apprendre, pour un besoin que quelques dizaines de lignes et `Intl` couvrent.

### D14 · Un budget de performance vérifié par la CI

| Règle | Moyen | Vérification |
|---|---|---|
| Aucune page n'attend l'API pour s'afficher | Pages générées sur le serveur, mises en cache, régénérées toutes les 60 s | La compilation marque chaque page statique (`○` ou `●`) |
| Au plus **10 ko** de JavaScript propre à chaque page, en plus du socle commun de Next.js | Composants serveur par défaut ; composants client pour la carte, la frise, la mesure et les formulaires seulement | Un test de budget dans la CI, qui échoue au-delà |
| La carte ne pèse que sur sa propre page | MapLibre chargé uniquement sur la page Carte, après l'affichage | Budget propre à la page Carte, fixé et mesuré dans le commit qui la crée |
| Rien d'inutile à télécharger | Polices du système, aucune image matricielle, CSS Modules | Déjà en place |
| Les pages lisent leur contenu sans JavaScript | HTML d'abord, liens et formulaires natifs | Un test Playwright, JavaScript désactivé |

Le seuil de 10 ko est un point de départ. S'il bloque un besoin réel, on le relève
par une décision écrite, avec la mesure qui le justifie.

## Conséquences

- Chaque texte visible passe par un dictionnaire, y compris dans les tests.
- Les composants déjà écrits (`PastilleEtat`, `BlocVerdict`) recevront leurs textes
  du dictionnaire au lieu de les contenir.
- La structure actuelle (`components/`) sera renommée en `composants/` dans le
  commit qui introduit la nouvelle arborescence.
