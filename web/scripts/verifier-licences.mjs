// Verifie la licence de chaque paquet installe, a partir de package-lock.json.
// Le reglement du concours interdit les licences GPL, LGPL et AGPL. On refuse
// aussi les licences a reciprocite (MPL, EPL, SSPL), absentes de la liste autorisee.
// Le script echoue (code 1) des qu'un paquet en porte une, ou n'en declare aucune.
import { readFileSync } from "node:fs";

const INTERDITES = /\b(A?GPL|LGPL|MPL|EPL|SSPL)\b/i;

const verrou = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const fautifs = [];

for (const [chemin, paquet] of Object.entries(verrou.packages)) {
  if (chemin === "") continue; // la racine, c'est notre propre projet
  if (paquet.link) continue; // lien vers un dossier local : sa propre entree est verifiee
  const nom = chemin.replace(/^.*node_modules\//, "");
  const licence = paquet.license;
  if (!licence) fautifs.push(`${nom} : aucune licence declaree`);
  else if (INTERDITES.test(licence)) fautifs.push(`${nom} : ${licence}`);
}

if (fautifs.length > 0) {
  console.error(`${fautifs.length} paquet(s) refuse(s) :`);
  for (const f of fautifs) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "Licences conformes : aucun paquet GPL, LGPL ou AGPL, et chacun declare sa licence.",
);
