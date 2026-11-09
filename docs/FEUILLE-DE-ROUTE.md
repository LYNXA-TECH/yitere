# Feuille de route de l'interface web

Une case n'est cochée que lorsque son commit est sur GitHub et que son test a été
montré rouge, puis vert (protocole, section 3). Le SHA du commit suit la case.

## 0. Socle · PR #3, fusionnée

- [x] Fins de ligne LF dans tout le dépôt · `845df93`
- [x] Décision d'architecture de l'interface · `924301b`
- [x] Réglages communs des éditeurs · `662dbb4`
- [x] Squelette Next.js et premier test · `cade6e7`
- [x] Retrait de `sharp` (LGPL) et vérification des licences · `8474c84`
- [x] Zéro faille signalée par `npm audit` · `033fa84`
- [x] Intégration continue · `bae870f`, `7cce9b9`
- [x] Hypothèses écartées consignées · `9fa3b5a`
- [ ] Réversibilité du test d'accueil montrée

## 1. Système visuel · branche `interface-styles`

- [x] Variables de la direction artistique et tests de contraste · `46e1bfa`
- [x] Formatage Prettier vérifié par la CI · `b58746c`, `4944116`
- [x] Variables appliquées à toutes les pages · `5ecb7e3`
- [x] Pastille d'état · `663fe16`
- [x] Bloc verdict · `4808586`
- [x] Contrôles positifs de la pastille et du verdict montrés · rejoués par Cellou, revue de la PR #4
- [ ] ESLint
- [x] En-tête, navigation et barre d'onglets mobile, avec le badge « Données d'exemple » · branche `interface-pages`
- [ ] Chiffre de mesure : valeur, nombre de mesures, période
- [x] Carte de publication · branche `interface-pages`
- [ ] États vides et états d'erreur

## 2. Données

- [x] Couche d'accès typée, avec la source « exemple » · `d2e0e87`
- [ ] Routes demandées à Cellou : verdicts, séries, sondes, échanges
- [x] Source « api » pour les cibles (`GET /api/v1/cibles`) · branche `interface-pages`
- [ ] Source « api » pour les verdicts, les sondes et les publications, dès que les routes existent

## 3. Pages de la maquette v3

- [x] Services · branche `interface-pages`
- [x] Fiche service, cas npm (cause probable : opérateur) · branche `interface-pages`
- [x] Fiche service, cas Docker (cause indéterminée) · branche `interface-pages`
- [x] Méthodologie, lue directement dans `docs/methodologie.md` · branche `interface-pages`
- [x] Carte : SVG serveur, marqueurs par ville, vue Liste · branche `interface-pages`
- [ ] Carte : zoom par pays et frise temporelle (après le concours)
- [x] Échanges, en lecture · branche `interface-pages`
- [ ] Détail d'une publication
- [ ] Publier
- [ ] Mesurer depuis chez moi (sonde navigateur)
- [x] Contribuer · branche `interface-pages`
- [ ] Héberger une sonde
- [ ] Mon espace : sondes, contributions, notifications
- [ ] Données ouvertes et API
- [ ] Confidentialité

## 3 bis. Langues et performance (décision 0002)

- [x] Formatage `Intl` : nombres, heures, dates, pluriels, noms de pays · branche `format-intl`
- [x] Dictionnaires français et anglais, repli visible `[FR]` · branche `interface-pages`
- [x] Adresses `/fr` et `/en`, langue du navigateur à la racine · branche `interface-pages`
- [x] Accueil, services, fiche et carte entièrement traduits, vérifiés par un test · branche `interface-pages`
- [x] Budget : socle 103 ko, moins de 1 ko par page (sortie de `next build`)
- [ ] Test automatique du budget (après le concours)
- [ ] Clé anglaise manquante refusée à la compilation (après le 23 novembre)

## 4. Connexion et échanges

- [ ] Connexion GitHub
- [ ] Migration du schéma des échanges, écrite ici, appliquée par Cellou (protocole, section 9)
- [ ] Votes, confirmations « a marché pour moi aussi », réponses, signalement

## 5. Qualité et mise en ligne

- [ ] Tests Playwright des parcours A à D de la conception
- [ ] En-têtes de sécurité HTTP
- [ ] Vérification à 390 px, au clavier et en mouvement réduit
- [ ] Service `yitere-web` en production, avec Cellou
- [ ] Non-régression de la section 7 rejouée après la mise en ligne

## Questions ouvertes pour Cellou

- [x] `datacloud-obj` retiré du seed et de la méthodologie · PR #5
- [ ] Référence de contenu : `cloudflare.com/cdn-cgi/trace` ou `connectivity-check.gstatic.com/generate_204` ?
- [ ] Région du projet Supabase, pour la page Confidentialité
- [x] Un seul terme pour tout le projet : « verdict »
- [ ] Avertissement `install-scripts` sur `esbuild` avec npm 11
