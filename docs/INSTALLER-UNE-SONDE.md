# Installer une sonde YITERE

Guide pour l'hôte d'une sonde, version du 17 novembre 2026. Le même guide est sur le
site : `/contribuer/sonde`, section « Installer la sonde, pas à pas ».

## Avant de commencer

La sonde s'installe en dix minutes, sans droits administrateur, sous Linux ou sous
Windows : choisissez la partie qui correspond à votre machine.

### Ce qu'elle fait

- Toutes les dix minutes, elle mesure le temps d'accès à GitHub, npm, PyPI, Docker Hub
  et jsDelivr, plus deux adresses de référence, puis envoie les résultats à
  `yitere.lynxatech.com`.
- Elle n'ouvre aucun port et ne lit aucun de vos fichiers. C'est un seul fichier, lisible,
  sans dépendance : [sonde.js](../sonde/sonde.js).
- Votre adresse IP n'est conservée nulle part. YITERE garde un pseudonyme, votre pays,
  votre ville et le nom de votre opérateur.
- Elle consomme environ 20 Mo de données par jour, soit environ 600 Mo par mois en
  continu.

### Ce qu'il vous faut

1. Une machine allumée et connectée le plus souvent possible : une sonde ne mesure que
   quand la machine est éveillée.
2. Node.js 20 ou plus. Vérifiez avec `node --version` ; sinon, installez la version LTS
   depuis [nodejs.org](https://nodejs.org).
3. Votre clé personnelle, envoyée par l'équipe LYNXA. Ne la publiez pas et ne la
   partagez pas : elle identifie votre sonde.

Partout dans ce guide, remplacez `VOTRE-CLE` par cette clé.

Votre sonde apparaît sur la carte dès sa première mesure, « en rodage » pendant 24
heures, le temps de connaître ses valeurs habituelles.

## Installation sous Linux

Trois commandes pour essayer, puis une ligne dans cron pour que la sonde tourne toute
seule toutes les dix minutes. Ces commandes fonctionnent aussi sous macOS.

### 1. Télécharger la sonde et enregistrer la clé

```
mkdir -p ~/yitere && cd ~/yitere
curl -O https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js
echo "VOTRE-CLE" > cle && chmod 600 cle
```

Le fichier `cle` n'est lisible que par vous.

### 2. Essayer

```
YITERE_JETON="$(cat cle)" node sonde.js --annonce
YITERE_JETON="$(cat cle)" node sonde.js
```

La première commande affiche ce que la sonde va faire, sans rien mesurer. La seconde fait
un vrai passage et doit se terminer par une ligne de ce genre :

```
passage: 8 mesures, 8 posees, 0 ignorees
```

Le nombre de mesures varie d'un passage à l'autre : certaines adresses ne sont mesurées
qu'une fois par heure.

### 3. La lancer toutes les dix minutes

Repérez le chemin de Node :

```
which node
```

Ouvrez la liste des tâches programmées avec `crontab -e`, puis ajoutez cette ligne à la
fin, en remplaçant `/usr/bin/node` par le chemin affiché :

```
*/10 * * * * cd $HOME/yitere && YITERE_JETON="$(cat cle)" /usr/bin/node sonde.js >> sonde.log 2>&1
```

Enregistrez et quittez. Dix minutes plus tard, vérifiez avec `tail ~/yitere/sonde.log` :
une nouvelle ligne `passage:` doit apparaître.

## Installation sous Windows

Tout se fait dans PowerShell, sans droits administrateur : ouvrez le menu Démarrer,
tapez « PowerShell » et lancez-le normalement.

### 1. Télécharger la sonde

```
mkdir $HOME\yitere; cd $HOME\yitere
curl.exe -O https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js
```

Le dossier est créé dans votre dossier personnel, par exemple `C:\Users\VotreNom\yitere`.

### 2. Essayer

```
$env:YITERE_JETON="VOTRE-CLE"
node sonde.js --annonce
node sonde.js
```

La première commande `node` affiche ce que la sonde va faire, sans rien mesurer. La
seconde fait un vrai passage et doit se terminer par une ligne de ce genre :

```
passage: 8 mesures, 8 posees, 0 ignorees
```

### 3. Créer le fichier de lancement

Ce petit fichier contient votre clé et lance un passage. Copiez ces lignes telles
quelles, en remplaçant seulement `VOTRE-CLE` :

```
Set-Content -Path "$HOME\yitere\lancer.cmd" -Encoding ascii -Value @"
@echo off
cd /d "%USERPROFILE%\yitere"
set YITERE_JETON=VOTRE-CLE
node sonde.js >> sonde.log 2>&1
"@
```

Testez-le une fois avec `& "$HOME\yitere\lancer.cmd"`, puis
`Get-Content $HOME\yitere\sonde.log -Tail 3` : la dernière ligne doit commencer par
`passage:`.

### 4. Le lancer toutes les dix minutes

```
schtasks /Create /SC MINUTE /MO 10 /TN YitereSonde /TR "$HOME\yitere\lancer.cmd"
```

La tâche tourne tant que votre session Windows est ouverte. Une fenêtre noire peut
apparaître une seconde toutes les dix minutes : c'est la sonde qui passe. Dix minutes
plus tard, relancez `Get-Content $HOME\yitere\sonde.log -Tail 3` pour voir la nouvelle
ligne `passage:`.

Si le journal reste vide alors que le test manuel marchait, Windows ne trouve pas Node
dans la tâche : tapez `where.exe node`, et remplacez `node` par le chemin complet affiché
dans `lancer.cmd`, entre guillemets.

## Vérifier, arrêter, dépanner

Une fois la tâche en place, il n'y a plus rien à faire : votre sonde apparaît sur
[la carte de YITERE](https://yitere.lynxatech.com) après sa première mesure.

### Arrêter la sonde

- Linux : `crontab -e`, supprimez la ligne YITERE, puis `rm -r ~/yitere` pour tout
  effacer.
- Windows : `schtasks /Delete /TN YitereSonde /F`, puis supprimez le dossier `yitere` de
  votre dossier personnel.

Prévenez-nous ensuite à kantecellou70@gmail.com : nous désactiverons votre clé. Vos mesures
passées restent publiées.

### Si un message s'affiche

| Message | Cause | Que faire |
|---|---|---|
| `YITERE_JETON manquant` | La clé n'est pas passée à la commande | Revérifier le fichier `cle` (Linux) ou `lancer.cmd` (Windows) |
| `401 ... jeton inconnu` | Clé mal recopiée, ou pas encore enregistrée par l'équipe | Recopier la clé ; si le message reste, nous écrire |
| `403 ... sonde desactivee` | Votre sonde a été désactivée | Nous écrire |
| `passage echoue` puis une erreur réseau | Pas de connexion à ce moment-là | Rien : le passage suivant reprend seul |

Une période sans mesure n'est pas un problème : elle apparaît sur la carte comme un trou
daté, jamais comblé.

Une question : kantecellou70@gmail.com. Le détail des mesures est dans la
[méthodologie](methodologie.md), et ce qui est publié dans la politique de
confidentialité du site.

Merci d'héberger une sonde : chaque sonde aide un développeur, ailleurs en Afrique, à
savoir d'où vient son problème.
