# Contrat entre l'API et l'interface web

Rédigé par Aissatou pour Cellou, le 9 novembre 2026. Proposition à discuter.

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

## Après : écrire

Publier, confirmer (« a marché pour moi aussi ») et signaler demandent la connexion GitHub.
C'est un chantier à part (OAuth, session, limite anti-abus) qu'on définira ensemble quand
les trois lectures seront en place.
