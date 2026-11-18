# YITERE

Observatoire des conditions reseau du developpement africain.

Mesure en continu la latence, la disponibilite et le debit vers les services dont
dependent les developpeurs, depuis des sondes situees dans plusieurs pays.

Projet de LYNXA SARL pour le Systalink Challenge 2026.
Donnees publiques sous licence CC BY 4.0.

Statut : en production sur https://yitere.lynxatech.com, sur données réelles.

Code sous licence MIT (fichier LICENSE). Composants et licences :
docs/COMPOSANTS-ET-LICENCES.md. Usage de l'IA : AI_USAGE.md.

## Évaluer YITERE en 5 minutes

Pour le jury et toute personne qui découvre le projet. Rien à installer pour les
cinq premières étapes : un navigateur suffit.

1. **La carte** (1 min). Ouvrir https://yitere.lynxatech.com/fr. Chaque point est
   une ville où une sonde mesure, avec son opérateur (Orange Guinée, Orange
   Sénégal). Une sonde est une petite machine chez un développeur volontaire.
2. **Un service** (1 min). Onglet Services, puis par exemple
   https://yitere.lynxatech.com/fr/services/npm. Le verdict (normal ou dégradé)
   vient avec ses preuves : sondes touchées, sondes épargnées, valeur habituelle,
   et, quand les données le permettent, une hypothèse de cause (service,
   opérateur, ville).
3. **Mesurer depuis chez soi** (1 min). https://yitere.lynxatech.com/fr/mesurer
   chronomètre six services depuis votre navigateur et met le résultat à côté de
   celui des sondes, sans jamais le mélanger. Rien n'est envoyé.
4. **Les échanges** (1 min). https://yitere.lynxatech.com/fr/echanges : les
   contournements publiés par les développeurs (miroir, réglage, autre registre),
   rattachés au service concerné. La mesure dit ce qui ne va pas, l'échange dit
   comment avancer quand même.
5. **Les données et la méthode** (1 min). L'API est publique, sans clé :

       curl https://yitere.lynxatech.com/api/v1/verdicts

   La méthode de calcul, les seuils et leurs limites sont sur
   https://yitere.lynxatech.com/fr/methodologie (source : docs/methodologie.md).

Pour aller plus loin, avec Node.js 20 ou plus :

    npm ci && npm test                 # serveur et verdicts
    cd web && npm ci && npm test       # interface

Autres lectures utiles : docs/INSTALLER-UNE-SONDE.md (installer une sonde sous
Linux ou Windows), docs/HYPOTHESES-ECARTEES.md (les pistes éliminées et leurs
preuves), AI_USAGE.md (ce que l'IA a fait et n'a pas fait).

## Protocole de travail

Les regles de collaboration avec l'agent sont dans docs/PROTOCOLE-TRAVAIL-LYNXA.md.
Le texte commun est identique dans tous les depots LYNXA, seule la section 7 est
propre a YITERE. A lire avant toute intervention sur ce depot.

## Organisation du depot

- `serveur/api.js` : ingestion des mesures et lecture publique des cibles.
- `sonde/sonde.js` : la sonde, sans aucune dependance, trois modes de mesure
  (entete, objet, dns).
- `db/schema.sql` : le schema de la base de mesures.
- `db/seed.sql` : les neuf cibles, sept mesurées et deux de référence.
- `web/` : l'interface publique (Next.js).
- `temoin.bin` : objet temoin de 256 Ko servi pour la mesure de debit.

## Faire tourner

Le serveur lit deux variables d'environnement :

    YITERE_DB_URL   l'URL de la base de mesures
    PORT            8787 par defaut

    node serveur/api.js

La sonde en lit deux aussi :

    YITERE_API      https://yitere.lynxatech.com par defaut
    YITERE_JETON    le jeton de la sonde

    node sonde/sonde.js

Aucun jeton ni URL de base ne figure dans le depot : sur le serveur ils vivent
dans /etc/yitere/*.env, lisibles seulement par le compte de service. En
production le serveur tourne en service systemd et la sonde est declenchee par
un minuteur toutes les dix minutes.
