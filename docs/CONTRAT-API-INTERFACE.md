# Contrat entre l'API et l'interface web

Rédigé par Aissatou pour Cellou, le 9 novembre 2026. Proposition à discuter.
Mis à jour le 13 novembre 2026 : toutes les routes servies sont branchées, la fiche d'un service comprise (section 5).

L'interface affiche aujourd'hui des données d'exemple, avec un badge qui le dit. Une seule
lecture est réelle : `GET /api/v1/cibles`. Ce document liste les trois routes de lecture
qui manquent, dans l'ordre où elles débloquent le plus de pages, avec la forme exacte de
la réponse attendue. Dès qu'une route existe, l'interface la branche dans un commit
séparé, avec un test, comme pour les cibles.

## Règles communes

Ce sont celles de `GET /api/v1/cibles`, qui fonctionne déjà :

- lecture publique, sans jeton ;
- JSON en `snake_case` ; l'interface convertit elle-même les noms ;
- en cas d'erreur, un code HTTP et `{ "erreur": "..." }` ;
- jamais d'adresse IP, de jeton ou de `github_login` d'un hôte de sonde dans une réponse ;
- le serveur web appelle l'API sur la même machine (`http://127.0.0.1:8787`), au plus une
  fois par minute et par page, grâce au cache de 60 secondes.

## 1. `GET /api/v1/verdicts`

C'est la priorité : elle remplit l'accueil, la liste des services, chaque fiche et la carte.
La base calcule les verdicts, l'interface les affiche (décision 0001). Selon la méthodologie
(section 7), un verdict est calculé à la lecture et jamais stocké.

```json
{
  "calcule_le": "2026-11-09T15:20:00Z",
  "verdicts": [
    {
      "cle": "npm",
      "nom": "registry.npmjs.org",
      "etat": "degrade",
      "depuis": "2026-11-09T14:10:00Z",
      "hypothese": {
        "cause": "operateur",
        "operateur": "Opérateur A",
        "ville": "Conakry"
      },
      "preuves": {
        "sondes_touchees": 2,
        "sondes_epargnees": 2,
        "sondes_en_rodage": 1,
        "mesures": 24,
        "periode_minutes": 60,
        "repere": "normal",
        "sondes": [
          { "pseudonyme": "lynx-conakry-1", "operateur": "Opérateur A", "ville": "Conakry", "numero": 1,
            "statut": "touchee", "valeur": 1257, "habituel": 330, "unite": "ms" }
        ]
      }
    }
  ]
}
```

| Champ | Valeurs |
|---|---|
| `calcule_le` | heure du calcul ; la page l'affiche, pour qu'un cache ne fasse jamais passer une vieille mesure pour fraîche |
| `etat` | `normal`, `degrade`, `pas-de-donnee` |
| `depuis` | début de la dégradation, `null` sinon |
| `hypothese` | `null` quand les données ne suffisent pas : l'interface écrit alors « Cause indéterminée » |
| `hypothese.cause` | `service`, `operateur`, `connexion-locale` |
| `hypothese.operateur`, `hypothese.ville` | facultatifs, seulement pour la cause `operateur` |
| `preuves.periode_minutes` | fenêtre de calcul, traduite par l'interface (« dernière heure », « last hour ») |
| `preuves.repere` | ce que montre la sonde de Madrid : `normal`, `degrade`, ou `exclu` pour ce service |

Un verdict par cible active hors famille `Reference`. Une cible sans verdict s'affiche
« Pas de donnée ».

À trancher par toi : les seuils (combien de sondes au minimum, ce qu'est une dégradation)
et la durée de rodage d'une nouvelle sonde. Ils iront dans la section 7 de la méthodologie,
que la page Méthodologie affiche telle quelle.

## 2. `GET /api/v1/sondes`

Pour la carte : le nombre de sondes par ville.

```json
{
  "sondes": [
    {
      "pseudonyme": "kadi-gn",
      "pays": "GN",
      "ville": "Conakry",
      "operateur": "Opérateur A",
      "type": "dev",
      "en_rodage": false
    }
  ]
}
```

- Seulement les sondes actives.
- `pays` : code ISO à deux lettres, que l'interface traduit en nom de pays.
- `ville` : un nom parmi ceux de `web/lib/geo/villes.ts` pour apparaître sur la carte.
  Une autre ville reste visible dans la vue Liste.
- `operateur` : la table `probes` n'a que l'ASN. Il faut soit une petite table
  ASN → nom, soit renvoyer `null` (la carte s'en passe).

## 3. `GET /api/v1/publications?cible=npm`

Pour les échanges et la section « Ce qui a marché pour les autres » de chaque fiche.
La table `posts` existe déjà dans `db/schema.sql`.

```json
{
  "publications": [
    {
      "id": 1,
      "cible": "npm",
      "auteur": "kadi-gn",
      "type": "contournement",
      "contenu": "Réutiliser le cache local évite de retélécharger les paquets.",
      "commande": "npm install --prefer-offline",
      "pays": "GN",
      "votes": 7,
      "cree_le": "2026-11-09T14:40:00Z"
    }
  ]
}
```

- `cible` : la clé de la cible, pas `target_id`.
- `auteur` : le `github_login` de la personne qui publie ; c'est public par nature.
- Jamais les lignes `masque = true`.
- Sans paramètre, toutes les publications ; avec `?cible=`, celles d'un service.
  Tri du plus récent au plus ancien, 50 au plus.

## 4. Ce que demandent en plus les pages de la maquette v3

L'interface suit la maquette v3. Pour l'afficher avec de vraies mesures, il lui faut aussi :

| Route | Contenu | Page |
|---|---|---|
| `GET /api/v1/services` | Par cible : valeur de la dernière heure (moyenne des sondes touchées, sinon médiane), moyenne des épargnées, disponibilité et passages sur 24 h, valeur du repère de Madrid, nombre de solutions et de demandes | Services |
| `GET /api/v1/services/{cle}` | Médianes horaires par sonde sur 24 h et sur 7 jours (pas de 6 h), bande des valeurs habituelles, dernier passage décomposé (DNS, connexion, TLS, premier octet) de deux sondes | Fiche d'un service |
| `GET /api/v1/incidents` | Dégradations et absences de donnée des 24 dernières heures : cible (ou toutes), sondes, cause, début, fin | Carte (frise) |
| `GET /api/v1/sondes` | Ajouter, par sonde et par cible, l'état sur les 24 derniers pas : `normal`, `degrade`, `pas-de-donnee`, `absente` | Carte |
| `GET /api/v1/publications` | Ajouter `titre`, `etiquettes`, `contexte` (incident joint), `confirmations` (ville, opérateur, heure), `reponses`, `confirmee` (3 confirmations dans 2 villes), et pour une demande la ville, le nombre de personnes qui suivent et s'il y a une sonde sur place | Échanges, fiches, carte |

Les formes exactes sont les types de `web/lib/donnees/types.ts` (en `snake_case` côté API). Le fichier
`web/lib/donnees/exemple/simulateur.ts` les produit déjà à partir du jeu de la maquette : c'est une
implémentation de référence, règles de la méthodologie comprises, que tu peux comparer à la tienne.

## 5. État au 11 novembre : ce qui est branché

`GET /api/v1/verdicts`, `GET /api/v1/services` et `GET /api/v1/sondes` sont servies
depuis le 11 novembre (main, `2e2a5bb`). L'interface les lit quand `YITERE_SOURCE=api`
(`web/lib/donnees/api.ts`), et prend leurs formes réelles telles quelles :

| Écart à ce document | Ce que fait l'interface |
|---|---|
| `operateur` vaut `null` ou `AS<numéro>`, pas « Opérateur A » | Affiche le numéro d'AS, et « Opérateur non détecté » pour `null` |
| Le repère de Madrid a le type `datacenter` | L'appelle `repere` |
| Chaque sonde des preuves porte en plus `mesures` et `echecs` | Les ignore pour l'instant |
| `depuis` donne l'heure de la dernière mesure quand l'état est `pas-de-donnee` | L'affiche : « Pas de donnée depuis … » |
| `GET /api/v1/sondes` ne donne ni `numero` ni l'historique sur 24 pas | Compte le numéro par opérateur et par ville, dans l'ordre de la réponse, comme `numeroter()` côté serveur ; lit l'état actuel de chaque sonde dans les preuves des verdicts ; les 23 heures précédentes restent vides sur la carte |

`GET /api/v1/services/{cle}` est servie (`serveur/detail.js`) : la fiche d'un service, à la
forme de `DetailService` en `snake_case` (`heures_24`, `heures_7j`, `series_24`, `series_7j`,
`habituel`, `debut_incident_24`, `repere`, `cascades`). Une clé inconnue ou une cible de
référence répond 404. Quatre écarts avec le type de l'interface :

- `habituel` vaut `null` tant qu'aucune sonde n'est jugée (rodage) : pas de bande à tracer,
  et jamais un zéro à la place d'une valeur absente ;
- chaque cascade donne quatre durées qui se suivent, `dns`, `connexion`, `tls` et `attente`,
  dont la somme est `premier_octet`. La barre se trace avec les quatre premières ;
  `premier_octet` est le total, pas un cinquième segment ;
- chaque cascade porte `mesure_le`, l'heure du passage décomposé ;
- les courbes ne couvrent que ce qui a été mesuré : une sonde récente a des `null` au début
  de ses 7 jours, et le repère de Madrid n'a pas de courbe (il est dans `repere`).

`POST /api/v1/publications` est servie depuis le 13 novembre : le dépôt d'une publication
sans compte. Corps JSON (`content-type: application/json` obligatoire, 8 Ko au plus) :

```
{ "cible": "npm", "type": "contournement" | "demande", "pseudonyme": "Kadi",
  "contenu": "20 à 1000 caractères", "commande": "facultatif, 300 au plus",
  "pays": "facultatif, GN", "site": "" }
```

Le pseudonyme s'envoie sous `pseudonyme` ou sous `auteur`, le nom qu'il porte à la lecture.
`site` est un leurre : le formulaire le garde vide et invisible, un robot le remplit.
Réponses : `201 { "statut": "en-attente", "message": … }` ; `400 { "erreur", "champ" }`
avec le champ en cause, pour l'afficher sous le bon champ ; `404` service inconnu ;
`413` trop long ; `415` pas du JSON ; `429` trop de dépôts cette heure-ci ; `503` file de
relecture pleine. **Le dépôt n'apparaît nulle part avant relecture par l'équipe**
(`docs/RELIRE-LES-PUBLICATIONS.md`) : après un `201`, l'interface remercie et dit que la
publication sera visible après relecture, elle ne l'ajoute pas à la liste.

À la lecture, chaque publication porte en plus `verifie` : `false` pour un pseudonyme
déposé sans compte (ne pas l'afficher comme un compte GitHub, pas de « @ », pas de lien),
`true` pour un compte GitHub quand la connexion existera.

`GET /api/v1/publications` (avec ou sans `?cible=`) est servie en lecture seule, à la
forme de la section 3 : liste vide tant que personne ne publie, 404 pour une cible
inconnue. Les champs de la section 4 (titre, confirmations, réponses...) n'existent pas
encore en base : quand la source est l'API, le fil affiche un état vide plutôt que les
exemples. Publier, confirmer et signaler viendront avec la connexion GitHub, après le 23.

`GET /api/v1/publications` (PR #13, lecture seule) est branchée depuis le 12 novembre. Ses
champs absents (ville, titre, confirmations, contexte) restent vides, jamais inventés. Tant
qu'il n'y a pas de connexion GitHub, l'interface n'offre ni publier, ni confirmer, ni
« Se connecter » (remplacé par « Bientôt »), et affiche « Aucune publication pour
l'instant » quand la liste est vide. Les mesures navigateur ne sont pas envoyées au
serveur : avec l'API, l'onglet Navigateur en compte donc zéro. Les compteurs
« Solutions · N » viennent de `solutions` dans `/api/v1/services`. Un service sans donnée
dont des sondes sont en rodage (`sondes_en_rodage > 0`) s'affiche « En rodage ». Avec ces
quatre lectures réelles, le badge « Données d'exemple » disparaît de l'en-tête ; ce qui
reste un exemple le dit sur place.

`GET /api/v1/services/{cle}` (PR #17) est branchée depuis le 13 novembre : les courbes,
la bande habituelle (absente quand `habituel` vaut `null`), le repère et « Où part le
temps ». La barre se trace avec `dns`, `connexion`, `tls` et `attente` ; `premier_octet`,
leur somme, est le total affiché, jamais une cinquième étape. Sous la barre, la phrase est
tirée des chiffres : l'étape qui s'allonge le plus pour la sonde touchée, face à la sonde
épargnée. Une clé inconnue (404) donne la page introuvable. La mention « Données
d'exemple » disparaît des fiches.

La frise des incidents n'a pas de route avant la soumission : avec l'API, elle reste vide.
Plus rien d'exemple ne s'affiche en production.

Si une route répond une erreur ou une forme inattendue, la page échoue au lieu d'afficher
un exemple à la place : avec le cache de 60 secondes, Next.js continue de servir la
dernière version réussie.

## Après : écrire

Publier, confirmer (« a marché pour moi aussi ») et signaler demandent la connexion GitHub.
C'est un chantier à part (OAuth, session, limite anti-abus) qu'on définira ensemble quand
les trois lectures seront en place.
