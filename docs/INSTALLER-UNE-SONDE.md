# Installer une sonde YITERE

Pour la personne qui héberge une sonde. Dix minutes, aucun droit administrateur.

## Ce que fait la sonde

- Toutes les dix minutes, elle mesure le temps d'accès à neuf adresses (GitHub, npm, PyPI,
  Docker, jsDelivr et deux références), puis envoie les résultats à `yitere.lynxatech.com`.
- Elle n'ouvre aucun port et ne lit aucun de vos fichiers. C'est un seul fichier, lisible,
  sans dépendance.
- Votre adresse IP n'est conservée nulle part. Nous gardons un pseudonyme, un pays, une
  ville et le nom de votre opérateur.
- Elle consomme environ 20 Mo de données par jour.

Le détail est dans [la méthodologie](methodologie.md).

## Ce qu'il vous faut

- Une machine allumée le plus souvent possible, avec Node.js 20 ou plus (`node --version`).
- La clé que l'équipe vous a envoyée. Elle est personnelle : ne la publiez pas.

## 1. Télécharger et essayer

Linux et macOS :

```
mkdir -p ~/yitere && cd ~/yitere
curl -O https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js
echo "VOTRE-CLE" > cle && chmod 600 cle
YITERE_JETON="$(cat cle)" node sonde.js --annonce
YITERE_JETON="$(cat cle)" node sonde.js
```

La première commande `node` affiche ce que la sonde va faire, sans rien mesurer. La
seconde fait un passage et doit se terminer par une ligne de ce genre :

```
passage: 8 mesures, 8 posees, 0 ignorees
```

Windows (PowerShell) :

```
mkdir C:\yitere; cd C:\yitere
curl.exe -O https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js
$env:YITERE_JETON="VOTRE-CLE"; node sonde.js
```

## 2. La lancer toutes les dix minutes

Linux et macOS. Repérez le chemin de Node avec `which node`, puis ouvrez `crontab -e` et
ajoutez cette ligne, en remplaçant `/usr/bin/node` par votre chemin :

```
*/10 * * * * cd $HOME/yitere && YITERE_JETON="$(cat cle)" /usr/bin/node sonde.js >> sonde.log 2>&1
```

Windows, dans une invite de commandes :

```
schtasks /Create /SC MINUTE /MO 10 /TN YitereSonde /TR "cmd /c cd /d C:\yitere && set YITERE_JETON=VOTRE-CLE&& node sonde.js >> sonde.log 2>&1"
```

Après dix minutes, `sonde.log` doit contenir une nouvelle ligne `passage:`.

## 3. Arrêter la sonde

- Linux et macOS : `crontab -e`, supprimez la ligne. Pour tout effacer : `rm -r ~/yitere`.
- Windows : `schtasks /Delete /TN YitereSonde /F`, puis supprimez `C:\yitere`.

Prévenez-nous, nous désactiverons votre clé : contact@lynxatech.com.

## Si quelque chose ne va pas

| Message | Cause |
|---|---|
| `YITERE_JETON manquant` | La clé n'est pas passée à la commande |
| `401 ... jeton inconnu` | Clé mal recopiée, ou pas encore enregistrée par l'équipe |
| `403 ... sonde desactivee` | Votre sonde a été désactivée, écrivez-nous |
| `passage echoue` suivi d'une erreur réseau | Pas de connexion à ce moment-là : le passage suivant reprendra seul |

Une période sans mesure n'est pas un problème : elle apparaît comme un trou daté, jamais
comblé.
