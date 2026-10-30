# Protocole de travail LYNXA

Ce document s'applique à Cellou, à Claude et à l'agent Claude Code.
Il est lu par l'agent au début de chaque session.

Il est **versionné**, donc opposable : il survit aux sessions, aux machines et
aux agents. Une mémoire de session n'est pas une règle, ce n'est qu'une note
privée, invisible en revue et perdue au prochain poste. Ce qui doit tenir est
écrit ici.

Le texte est **identique dans tous les dépôts**. Seule la section 7 est propre
à chaque projet.

---

## 1. Aucun diagnostic sans preuve

Une hypothèse n'est pas une cause. Avant toute correction, la cause doit être
montrée : une ligne de code citée, une ligne de base de données réelle, une
requête réseau, une sortie de commande.

Interdit : « c'est probablement », « sans doute », « cela vient sûrement de ».
Attendu : « ligne 47 de `src/x.jsx`, la requête n'applique aucun filtre sur
`visible`, et voici les 4 lignes de la table qui le confirment ».

Si on ne peut pas montrer la cause, on ne l'a pas trouvée. On continue à
chercher, on ne corrige pas.

## 2. Reproduire avant de corriger

Un bug qu'on ne sait pas reproduire à volonté ne peut pas être déclaré résolu.

L'agent écrit d'abord la procédure de reproduction :
1. les étapes numérotées, exactes, cliquables ;
2. le résultat observé ;
3. le résultat attendu.

Si la reproduction échoue, le bug est mal compris. On s'arrête là.

## 3. Le test d'acceptation s'écrit avant la correction, et se prouve rouge

Avant d'écrire une ligne de code, on écrit la phrase qui dira si c'est réglé.
Elle doit être observable et binaire, sans interprétation possible.

Exemple : « sur lynxatech.com/partnership, la section Engagements légaux
n'affiche aucune carte ».
Contre-exemple : « les éléments désactivés sont correctement gérés ».

Ce test est ensuite exécuté **avant** le correctif, et son échec est montré :
la commande, sa sortie, le message d'erreur. Un test qui passe avant la
correction ne teste pas le bug, il teste autre chose. Le rapport cite les deux
exécutions, l'échec puis la réussite.

Pour un test qui vérifie une absence (« plus aucune carte », « la chaîne X
n'apparaît plus »), un contrôle positif est obligatoire : montrer que le même
test détecte bien la présence quand on la réintroduit. Sinon on ne distingue
pas un test qui passe d'un test qui ne regarde rien.

## 4. Une cause, une correction, un commit, un test

Jamais deux corrections dans le même mouvement.

Si deux choses changent et que le résultat est bon, on ne sait pas laquelle a
agi. Si le résultat est mauvais, on ne sait pas laquelle a cassé. Dans les deux
cas, on a perdu l'information.

Chaque commit porte donc son propre test d'acceptation, prouvé rouge avant le
correctif et vert après, sur ce commit et pas sur l'ensemble du lot. Un lot de
cinq corrections produit cinq couples rouge puis vert, pas une suite verte à la
fin.

Chaque commit est aussi prouvé réversible : la correction retirée, le test
redevient rouge.

## 5. Le bug est clos par Cellou, pas par l'agent

« Corrigé en local » ne clôt rien. « Les tests passent » ne clôt rien.
Un bug est clos quand Cellou observe lui-même le résultat attendu en
production, après publication.

## 6. Les hypothèses écartées sont écrites

Quand une piste est éliminée, on note laquelle et par quelle preuve.
On ne la retestera pas dans trois semaines.

Tenir cette liste dans `docs/HYPOTHESES-ECARTEES.md`.

## 7. Contrôle de non-régression après chaque mise en production

**[SECTION SPÉCIFIQUE AU PROJET]**

C'est la seule section qui change d'un dépôt à l'autre. Chaque projet y inscrit
sa propre liste, et remplace intégralement le bloc ci-dessous par la sienne.

La liste obéit aux mêmes règles partout : fixe, courte, rejouée intégralement à
chaque mise en production, même pour une correction d'une ligne. Elle couvre ce
qui rapporte de l'argent ou de la crédibilité, pas ce qui vient d'être touché.
Chaque point est observable et binaire. Tout point en échec bloque la clôture,
même s'il n'a rien à voir avec le travail en cours.

### Instance : YITERE

1. `https://yitere.lynxatech.com/api/v1/cibles` répond 200 et liste les dix cibles.
2. `https://yitere.lynxatech.com/temoin.bin` répond 200, 262 144 octets, somme de
   contrôle inchangée.
3. Le service `yitere-api` est actif et `/sante` répond `{"ok":true}`.
4. Le minuteur `yitere-sonde.timer` est actif et le dernier passage date de moins
   de quinze minutes.
5. Le dernier passage a posé au moins huit mesures en base.
6. L'ingestion refuse un jeton inconnu avec un code 401.
7. Le certificat TLS est valide pour plus de quinze jours.
8. Aucune table ne porte de colonne d'adresse IP.

## 8. Ce que l'agent ne fait jamais

- Toucher à la production, base, stockage ou Edge Functions, sans accord écrit
  de Cellou pour cette opération précise. **La lecture est incluse** :
  `SELECT`, introspection de catalogue, `pg_dump`, listage de bucket. Une
  session forcée en lecture seule ne dispense pas de l'accord.
- Exécuter du SQL sur la base de production. Il écrit la migration, Cellou
  l'applique lui-même et confirme par écrit.
- Poser ou lire un secret.
- Pousser en force, `--force` comme `--force-with-lease`, sur quelque branche
  que ce soit. Pour défaire un commit publié : `git revert`, qui ajoute et ne
  retire rien.
- Supprimer un fichier ou une branche sans accord écrit.
- Fusionner dans `main` sans accord écrit **nommant le SHA exact**, une fusion
  à la fois, avec `--match-head-commit`. Si la tête a bougé depuis ce SHA, la
  fusion n'a pas lieu et l'accord est redemandé.
- Activer un accès en écriture à la base de production.

## 9. Sauvegarde vérifiée avant toute migration

Le projet Supabase n'a aucune sauvegarde automatique. Une migration sans
sauvegarde restaurable est donc une opération sans retour arrière.

La sauvegarde est faite **par Cellou**, jamais par l'agent, qui n'a aucun accès
à la production. L'agent peut écrire le script, il ne le lance pas.

La chaîne de connexion d'abord, puis cinq étapes, dans cet ordre : les dumps,
le comptage, la restauration, le stockage, le rangement.

### 9.1 La chaîne de connexion

Elle vit dans un fichier dédié, `~/secrets/<projet>/db.env`, en droits `600`,
contenant une seule ligne :

```
SUPABASE_DB_URL=...
```

Ce fichier est chargé seul, jamais avec les autres fichiers de secrets :

```sh
set -a; . ~/secrets/<projet>/db.env; set +a
```

Cellou écrit lui-même la chaîne dans ce fichier dédié. Aucun autre fichier de
secrets ne sert à cette opération.

Aucun `echo` de la variable, aucun `curl -v`, aucun `set -x` pendant toute
l'opération. La chaîne n'apparaît ni dans un rapport, ni dans un commentaire de
PR, ni dans un historique de shell.

### 9.2 Les trois dumps

Une seule commande ne suffit pas : `supabase db dump` sans option ne sort que
le schéma. Il en faut trois, dans cet ordre.

```sh
D=~/Sauvegardes-Lynxa/<projet>/$(date +%Y-%m-%d)
mkdir -p "$D"
chmod 700 ~/Sauvegardes-Lynxa ~/Sauvegardes-Lynxa/<projet> "$D"
cd "$D"

supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

chmod 600 roles.sql schema.sql data.sql
sha256sum roles.sql schema.sql data.sql | tee sommes.txt
```

Les trois sommes de contrôle sont reportées dans le rapport.

### 9.3 Le comptage de référence

Il se fait **juste après les dumps**, sur la production, pour que les deux
mesures portent sur le même état. La requête exclut `buckets_vectors` et
`vector_indexes`, que le dump exclut également.

```sql
SELECT table_schema || '.' || table_name AS "table",
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I',
                                  table_schema, table_name),
                           false, true, '')))[1]::text::bigint AS lignes
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth', 'storage')
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN ('buckets_vectors', 'vector_indexes')
ORDER BY 1;
```

Le résultat est enregistré à côté des dumps, sous `comptage-production.txt`.

### 9.4 La preuve de restauration

Un fichier non restauré n'est pas une sauvegarde, c'est un espoir.

La restauration ne se fait **pas** dans une base Postgres nue créée par
`createdb` : les rôles, les extensions et les schémas propres à Supabase y
manquent, et l'opération échouerait pour des raisons sans rapport avec la
qualité de la sauvegarde. Elle se fait dans une pile Supabase locale vierge.

```sh
mkdir -p ~/restauration-test && cd ~/restauration-test
supabase init
```

Aligner `major_version` dans `supabase/config.toml` sur la version PostgreSQL
de la production, relevée dans le tableau de bord.

```sh
supabase start
supabase status          # relever la chaîne de connexion locale affichée
```

Puis la restauration, vers la chaîne locale relevée :

```sh
cd "$D"
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "<chaîne locale relevée ci-dessus>"
```

`ON_ERROR_STOP=1` et `--single-transaction` font que la moindre erreur annule
tout : une restauration qui se termine sans message est une restauration
complète, pas une restauration partielle silencieuse.

La même requête de comptage est rejouée sur la base restaurée, et les deux
tableaux sont comparés ligne à ligne. Un écart expliqué par une écriture
survenue entre le dump et le comptage est admis, et l'explication est écrite.
Un écart non expliqué invalide la sauvegarde, et la migration n'a pas lieu.

Le tableau de comparaison est joint au rapport. La pile jetable est ensuite
détruite :

```sh
cd ~/restauration-test && supabase stop --no-backup
cd ~ && rm -rf ~/restauration-test
```

Le dossier `~/restauration-test` est créé hors de tout dépôt.

### 9.5 Les fichiers du stockage

Les dumps ne contiennent **pas** les fichiers des buckets : justificatifs,
logos, cachets, CV. Ils ne sont que référencés dans les tables.

Si la migration touche un bucket, de près ou de loin, ces fichiers sont
téléchargés à part avant toute opération, rangés sous
`~/Sauvegardes-Lynxa/<projet>/<date>/stockage/`, et leur nombre est comparé au
nombre d'objets annoncé par la console. Une migration qui ne touche aucun
bucket s'en dispense, et le rapport le dit explicitement.

### 9.6 Rangement

Les dumps restent dans `~/Sauvegardes-Lynxa/<projet>/`, hors de tout dépôt, en
droits `700` sur `~/Sauvegardes-Lynxa`, `700` sur le dossier du projet, `700`
sur le dossier daté et `600` sur les fichiers. Un dump contient toutes les
données clients en clair : il n'entre jamais dans un dépôt, même privé, même
ignoré par `.gitignore`.

Une migration appliquée sans ces cinq étapes est une infraction au protocole,
même si elle réussit.

## 10. Format du rapport attendu de l'agent

1. Ce qui a été constaté, avec les preuves.
2. La cause, démontrée.
3. Ce qui a été changé, fichier par fichier, avec les hash de commit.
4. Le test d'acceptation, son échec avant le correctif et sa réussite après.
5. Les points de non-régression de la section 7 et leur résultat, un par un.
6. Ce qui reste ouvert.

Pas de conclusion sans preuve. Une incertitude se dit, elle ne se maquille pas.

Chaque run de CI, de déploiement ou de contrôle cité est identifié par son
numéro, sa date et le SHA de sa tête, copiés d'une sortie brute de `git` ou
`gh`, jamais d'un résumé. Une action annoncée est exécutée dans le même
message : sinon elle n'est pas annoncée.
