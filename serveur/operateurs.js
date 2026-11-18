// YITERE, noms des operateurs.
// La base ne garde que le numero de systeme autonome (ASN) de chaque sonde. Pour l'affichage,
// on rend le nom de l'operateur quand il est connu ici, sinon « AS<numero> ».
// Les regles de cause comparent toujours les numeros, jamais les noms.
// Ajouter un operateur : une ligne, avec la source qui atteste le numero.
'use strict';

const OPERATEURS = new Map([
  [8346, 'Orange Sénégal'],   // Sonatel, https://bgp.he.net/AS8346
  [37461, 'Orange Guinée'],   // https://db-ip.com/as37461-orange-guinee
]);

/** Le nom a afficher pour un ASN : le nom connu, sinon « AS<numero> », sinon null. */
function nomOperateur(asn) {
  if (!asn) return null;
  return OPERATEURS.get(Number(asn)) ?? `AS${asn}`;
}

module.exports = { nomOperateur, OPERATEURS };
