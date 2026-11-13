# Relire les publications

Pour l'équipe. Depuis le 13 novembre, n'importe qui peut proposer un contournement ou
demander une mesure, sans compte (`POST /api/v1/publications`). **Rien de ce qui est
proposé n'apparaît sur le site avant d'avoir été relu** : chaque dépôt est enregistré
masqué. Cette page dit comment relire.

Toute commande `UPDATE` de cette page est une écriture sur la base de production : elle
demande l'accord écrit de Cellou pour l'opération précise (protocole de travail,
section 8). Les `SELECT` ne modifient rien.

## Ce que le serveur a déjà vérifié

- le service existe et il est mesuré (pas une cible de référence) ;
- le type est `contournement` ou `demande` ;
- le texte fait de 20 à 1000 caractères, la commande 300 au plus, le pseudonyme 2 à 30 ;
- les caractères de contrôle et invisibles sont retirés ;
- pas plus de 30 dépôts acceptés par heure, pas plus de 200 en attente de relecture.

Ce que le serveur ne juge pas, et que la relecture doit juger : si le texte est vrai,
utile, poli, et sans danger. Une commande proposée s'exécute sur la machine de celui qui
la copie : **ne jamais approuver une commande qu'on ne comprend pas.**

Aucune adresse IP n'est lue ni enregistrée. Le pseudonyme est rangé avec un « ~ » devant
(`~Kadi`) : il n'est pas un compte GitHub, et l'API le rend avec `verifie: false`.

## Voir ce qui attend

```sql
SELECT p.id, p.cree_le, t.cle AS service, p.type, p.github_login AS pseudonyme, p.pays,
       p.contenu, p.commande
  FROM posts p JOIN targets t ON t.id = p.target_id
 WHERE p.masque AND NOT p.signale
 ORDER BY p.id;
```

## Approuver

La publication devient visible sur le site, dans la minute. Remplacer `N` par
l'identifiant relu, un seul à la fois :

```sql
UPDATE posts SET masque = false WHERE id = N AND masque AND NOT signale;
```

Résultat attendu : `UPDATE 1`. `UPDATE 0` veut dire que l'identifiant n'attend pas.

## Refuser

La ligne reste en base, masquée, et sort de la file d'attente :

```sql
UPDATE posts SET signale = true WHERE id = N AND masque;
```

## Retirer une publication déjà visible

```sql
UPDATE posts SET masque = true, signale = true WHERE id = N;
```

## Les trois états d'une ligne

| `masque` | `signale` | État |
|---|---|---|
| vrai | faux | En attente de relecture |
| faux | faux | Visible sur le site |
| vrai | vrai | Refusée ou retirée |

## Limites connues

- Le plafond de 30 dépôts par heure est commun à tout le monde : quelqu'un qui en abuse
  empêche les autres de proposer pendant une heure. Il ne peut rien afficher.
- Le plafond horaire repart de zéro quand l'API redémarre.
- Voter, confirmer et signaler depuis le site viendront avec la connexion GitHub.
