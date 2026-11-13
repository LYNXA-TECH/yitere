// Verifie la licence de chaque paquet du serveur, a partir de package-lock.json a la racine.
// Meme regle que web/scripts/verifier-licences.mjs : le reglement interdit GPL, LGPL et AGPL ;
// on refuse aussi les licences a reciprocite (MPL, EPL, SSPL) et les paquets sans licence.
// La sonde n'a aucune dependance : elle n'apparait pas ici.
import { readFileSync } from 'node:fs';

const INTERDITES = /\b(A?GPL|LGPL|MPL|EPL|SSPL)\b/i;
const verrou = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const fautifs = [];
let n = 0;

for (const [chemin, paquet] of Object.entries(verrou.packages)) {
  if (chemin === '') continue;
  n++;
  const nom = chemin.replace(/^.*node_modules\//, '');
  if (!paquet.license) fautifs.push(`${nom} : aucune licence declaree`);
  else if (INTERDITES.test(paquet.license)) fautifs.push(`${nom} : ${paquet.license}`);
}

if (fautifs.length > 0) {
  console.error(`${fautifs.length} paquet(s) refuse(s) :`);
  for (const f of fautifs) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`Licences conformes (serveur) : ${n} paquets, aucun GPL, LGPL ou AGPL, chacun declare sa licence.`);
