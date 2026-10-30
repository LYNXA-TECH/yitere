# YITERE

Observatoire des conditions reseau du developpement africain.

Mesure en continu la latence, la disponibilite et le debit vers les services dont
dependent les developpeurs, depuis des sondes situees dans plusieurs pays.

Projet de LYNXA SARL pour le Systalink Challenge 2026.
Donnees publiques sous licence CC BY 4.0.

Statut : en construction.

## Protocole de travail

Les regles de collaboration avec l'agent sont dans docs/PROTOCOLE-TRAVAIL-LYNXA.md.
Le texte commun est identique dans tous les depots LYNXA, seule la section 7 est
propre a YITERE. A lire avant toute intervention sur ce depot.

## Organisation du depot

- `serveur/api.js` : ingestion des mesures et lecture publique des cibles.
- `sonde/sonde.js` : la sonde, sans aucune dependance, trois modes de mesure
  (entete, objet, dns).
- `db/schema.sql` : le schema de la base de mesures.
- `db/seed.sql` : les dix cibles, huit mesurees et deux de reference.
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
