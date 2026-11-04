# Méthodologie

Cette page décrit exactement ce que YITERE mesure, comment, et ce qu'il ne mesure
pas. Elle est volontairement complète : un observatoire qui ne publie pas sa
méthode n'est qu'un tableau de bord de plus.

## 1. Ce que nous mesurons

YITERE mesure le temps qu'il faut, depuis une connexion donnée, pour atteindre
les services dont dépend le travail quotidien d'un développeur. Pour chaque
tentative, nous enregistrons six grandeurs :

| Grandeur | Ce qu'elle mesure |
|---|---|
| DNS | le temps de résolution du nom |
| TCP | l'établissement de la connexion |
| TLS | la négociation du chiffrement |
| Premier octet | l'attente avant la première donnée utile |
| Débit | les octets par seconde sur l'objet témoin |
| Code HTTP | la réponse du service, ou le type d'erreur |

Ces grandeurs sont séparées parce qu'une lenteur n'a pas la même cause ni le même
remède selon l'étape qui la provoque. Un DNS lent se corrige en changeant de
résolveur. Un TLS lent vient souvent de la distance. Un premier octet lent vient
du service lui-même.

## 2. Les cibles

Neuf cibles, dont sept mesurées et deux de référence. Nous avons préféré un petit
nombre de cibles suivies sérieusement à un grand nombre suivies mal.

| Famille | Cible | Cadence |
|---|---|---|
| Code | `api.github.com` | 10 min |
| Code | `raw.githubusercontent.com` | 10 min |
| Registres | `registry.npmjs.org` | 10 min |
| Registres | `pypi.org/simple` | 10 min |
| Registres | `registry-1.docker.io` | 10 min |
| Diffusion | `cdn.jsdelivr.net`, petite requête | 10 min |
| Diffusion | `cdn.jsdelivr.net`, objet témoin | 3 h |
| Référence | `cloudflare.com/cdn-cgi/trace` | 10 min |
| Référence | résolution DNS via `1.1.1.1` | 10 min |

Les deux références ne sont pas des cibles d'intérêt : elles servent à savoir si
une lenteur vient du service mesuré ou de la connexion de la sonde. Quand les
deux références se dégradent en même temps qu'une cible, le problème est chez
l'hôte, pas chez le service.

Un cas mérite d'être expliqué plutôt que caché : le registre Docker répond
**401** à une requête non authentifiée. C'est sa réponse normale, et c'est elle
que nous attendons. Un 401 sur cette cible est donc un succès, pas une panne.
Nous mesurons le temps d'obtenir cette réponse, ce qui est exactement ce que vit
un `docker pull` avant de s'authentifier.

## 3. Comment une mesure est faite

La sonde utilise trois modes selon la cible :

- **Entête** : elle ouvre la connexion, lit les entêtes, puis interrompt le
  transfert. C'est le mode par défaut, celui qui coûte le moins de données.
- **Objet** : elle télécharge entièrement l'objet témoin pour estimer un débit.
  Réservé aux deux cibles à cadence de trois heures.
- **DNS** : elle interroge un résolveur et mesure le temps de réponse.

Le délai maximal est de quinze secondes. Au delà, la mesure est enregistrée comme
un dépassement de délai, pas comme une absence de mesure : une absence de donnée
et une donnée mauvaise ne disent pas la même chose, et les confondre embellirait
les moyennes.

La sonde s'annonce avec l'identifiant `yitere-sonde/1.0` et un lien vers cette
page. Un administrateur qui voit nos requêtes dans ses journaux peut savoir en un
clic qui nous sommes et pourquoi nous passons.

## 4. L'objet témoin

Un seul objet, le même pour toutes les sondes : un fichier de 256 Ko, 262 144
octets exactement, de somme de contrôle sha256

```
20800d27d3325c6c20db8373df3be656613b94ab73a5d1b6500a034d7b79585b
```

Il est servi par le réseau de diffusion jsDelivr, sur un chemin épinglé au commit
qui le contient. Épinglé signifie que ce chemin ne peut plus changer de contenu :
la comparaison entre deux dates porte sur le même objet, pas sur un fichier qui
aurait été modifié entre temps.

**Une sonde ne mesure jamais une cible servie par elle-même.** Cette règle est
appliquée par le programme, à chaque passage, en comparant les adresses de la
cible à celles de la machine. Elle vient d'une erreur réelle de notre part : notre
première sonde, installée sur notre propre serveur, mesurait un objet témoin servi
par ce même serveur et relevait 349 Mbit/s. Ce chiffre ne décrivait aucun chemin
réseau, seulement la boucle locale de la machine. Il aurait suffi à rendre fausse
toute moyenne où il serait entré.

## 5. D'où viennent les mesures

Trois sources, qui ne mesurent pas la même chose et ne sont jamais mélangées.

**La sonde installée.** Un fichier court et lisible, lancé par une commande, sans
droits administrateur et sans port ouvert. Elle affiche ce qu'elle va mesurer et
ce qu'elle va envoyer avant de démarrer. Son code est public.

**La sonde navigateur.** Un bouton sur la page d'accueil. Le navigateur du
visiteur chronomètre quelques requêtes et publie un point, sans installation. Elle
mesure moins de choses que la sonde installée, et c'est écrit à côté du bouton.

**Notre sonde de centre de données.** Elle tourne sur notre serveur Datacloud, à
Madrid.

Ce dernier point demande une précision que nous préférons donner nous-mêmes. Le
catalogue de notre hébergeur n'offre aucune région africaine. Notre sonde de
centre de données est donc européenne, et elle le restera. Ce n'est pas un point
de vue africain sur le réseau : c'est un repère fixe et stable, utile pour
comparer, rien de plus. Le point de vue africain vient des connexions
personnelles et des hôtes volontaires, qui mesurent depuis les réseaux réellement
utilisés par les développeurs du continent.

## 6. Ce que nous ne conservons pas

**Aucune adresse IP n'est stockée, nulle part.** Ni celle des hôtes de sondes, ni
celle des visiteurs. Ce n'est pas une promesse, c'est une propriété du schéma de
la base : aucune table ne comporte de colonne d'adresse. Le schéma est public.

D'un hôte de sonde, nous conservons un pseudonyme qu'il choisit, un pays, une
ville facultative, et le numéro de système autonome de son opérateur, qui désigne
l'opérateur et non l'abonné. Rien d'autre.

Une sonde consomme environ 20 Mo par jour en mode économe, chiffre affiché avant
l'installation. Elle s'arrête par une seule commande, documentée sur la page
d'inscription.

## 7. Les verdicts

YITERE affiche des verdicts simples, calculés à la lecture et jamais stockés :
le problème vient du service, de l'opérateur, ou de la connexion locale.

Un verdict n'est affiché que si le nombre de sondes le permet. Avec deux sondes,
distinguer un problème d'opérateur d'un problème de service relève de la
devinette, et une devinette présentée comme un verdict est pire qu'un silence.
Le nombre de mesures ayant servi à chaque affichage est toujours indiqué.

## 8. Les interruptions

Les périodes pendant lesquelles une sonde n'a pas mesuré sont visibles et datées.
Nous ne comblons aucun trou par interpolation.

- **1er novembre 2026** : interruption de la sonde de Madrid, serveur arrêté par
  la plateforme d'hébergement à la suite d'un incident de facturation. Les mesures
  de cette période n'existent pas et ne seront pas reconstituées.

## 9. Licence

Les données sont publiées sous licence CC BY 4.0, et accessibles par une API
publique ainsi qu'en export CSV et JSON. Vous pouvez les reprendre, les
republier et les contredire, à condition de citer la source. C'est la différence
entre un observatoire et un tableau de bord : nos chiffres doivent pouvoir être
vérifiés contre les vôtres.

## 10. Limites assumées

- La période d'observation est courte. Le nombre de mesures est affiché partout,
  afin que personne ne prenne une tendance de trois jours pour une loi.
- Le nombre de sondes est faible au lancement. Les verdicts qui demandent
  plusieurs points de vue restent masqués tant qu'ils ne sont pas fondés.
- Une seule sonde de centre de données, en Europe, comme expliqué en section 5.
- Nous mesurons l'accès aux services, pas leur disponibilité interne. Un service
  peut être parfaitement en ligne et nous rester lent : c'est précisément ce que
  nous cherchons à montrer.
