#!/usr/bin/env node
// YITERE, creation d'une sonde. Ce script ne se connecte a aucune base.
// Il tire une cle au hasard, en calcule l'empreinte, et affiche :
//   1. la cle, a transmettre une seule fois a l'hote, jamais stockee ailleurs ;
//   2. la commande SQL a executer sur la base, qui ne contient que l'empreinte.
// L'empreinte est celle que verifie serveur/api.js : sha256 de la cle, en hexadecimal.
'use strict';
const crypto = require('node:crypto');

const TYPES = ['dev', 'datacenter', 'navigateur'];

function lireArguments(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 2) {
    const nom = argv[i];
    if (!nom || !nom.startsWith('--')) throw new Error(`argument inattendu : ${nom}`);
    if (argv[i + 1] === undefined) throw new Error(`valeur manquante pour ${nom}`);
    a[nom.slice(2)] = argv[i + 1];
  }
  return a;
}

// Chaque champ est valide avant d'entrer dans la commande SQL : rien n'y est recopie tel quel.
function valider(a) {
  const pseudonyme = String(a.pseudonyme || '');
  if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(pseudonyme))
    throw new Error('--pseudonyme : 3 a 32 caracteres, minuscules, chiffres et tirets (ex. lynx-conakry-1)');
  const pays = String(a.pays || '');
  if (!/^[A-Z]{2}$/.test(pays))
    throw new Error('--pays : code ISO a deux lettres majuscules (ex. GN, SN)');
  const ville = a.ville === undefined ? null : String(a.ville);
  if (ville !== null && !/^[\p{L}][\p{L} '-]{1,59}$/u.test(ville))
    throw new Error("--ville : lettres, espaces, apostrophes et tirets, 60 caracteres au plus");
  const asn = a.asn === undefined ? null : Number(a.asn);
  if (asn !== null && !(Number.isInteger(asn) && asn > 0 && asn < 4294967296))
    throw new Error("--asn : numero de systeme autonome de l'operateur, entier positif");
  const type = a.type === undefined ? 'dev' : String(a.type);
  if (!TYPES.includes(type)) throw new Error(`--type : ${TYPES.join(', ')}`);
  return { pseudonyme, pays, ville, asn, type };
}

const empreinte = (cle) => crypto.createHash('sha256').update(cle, 'utf8').digest('hex');
const texteSql = (s) => (s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`);

function commandeSql(sonde, hache) {
  return `INSERT INTO probes (pseudonyme, pays, ville, asn, type, jeton_hache)
VALUES (${texteSql(sonde.pseudonyme)}, ${texteSql(sonde.pays)}, ${texteSql(sonde.ville)}, ${sonde.asn === null ? 'NULL' : sonde.asn}, ${texteSql(sonde.type)}, '${hache}')
RETURNING id, pseudonyme, creee_le;`;
}

function creer(argv, tirer = () => crypto.randomBytes(32).toString('base64url')) {
  const sonde = valider(lireArguments(argv));
  const cle = tirer();
  return { sonde, cle, sql: commandeSql(sonde, empreinte(cle)) };
}

if (require.main === module) {
  try {
    const { sonde, cle, sql } = creer(process.argv.slice(2));
    console.log(`Sonde « ${sonde.pseudonyme} » (${sonde.pays}${sonde.ville ? ', ' + sonde.ville : ''})

1. Cle a transmettre a l'hote, une seule fois, par un canal prive.
   Elle n'est enregistree nulle part : si elle est perdue, on en cree une autre.

   ${cle}

2. Commande a executer sur la base. Elle ne contient que l'empreinte de la cle.

${sql}
`);
  } catch (e) {
    console.error(`creer-sonde : ${e.message}

Usage :
  node serveur/creer-sonde.js --pseudonyme lynx-conakry-1 --pays GN --ville Conakry [--asn 37461] [--type dev]`);
    process.exit(1);
  }
}

module.exports = { creer, valider, empreinte, commandeSql };
