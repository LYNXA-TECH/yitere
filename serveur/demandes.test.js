// Tests des demandes de sonde : node --test serveur/demandes.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const d = require('./demandes.js');

test('demande valide : pays, ville, operateur ; pas d\'e-mail', () => {
  assert.deepEqual(d.valider({ pays: 'gn', ville: ' Labé ', operateur: 'Orange Guinée' }),
    { ok: true, valeurs: { pays: 'GN', ville: 'Labé', operateur: 'Orange Guinée' } });
  assert.equal(d.valider({ pays: 'Guinée', ville: 'Labé', operateur: 'Orange' }).champ, 'pays');
  assert.equal(d.valider({ pays: 'GN', ville: '<b>', operateur: 'Orange' }).champ, 'ville');
  assert.equal(d.valider({ pays: 'GN', ville: 'Labé', operateur: '' }).champ, 'operateur');
  assert.equal(d.valider(null).champ, 'corps');
});

test('une seule demande en attente par compte', async () => {
  const db = { async query(sql) { if (sql.includes("statut = 'en-attente'")) return { rows: [{ id: 3 }] }; throw new Error('pas d\'insertion'); } };
  assert.deepEqual(await d.demander(db, { id: 1, login: 'x' }, {}), { ok: false, code: 409, erreur: 'une demande est deja en attente' });
});

test('la cle : rendue une fois, seule son empreinte va en base, seulement pour le titulaire', async () => {
  const appels = [];
  const db = { async query(sql, p) { appels.push(p); return { rows: p[2] === 'Kadi-GN' ? [{ pseudonyme: p[1] }] : [] }; } };
  const r = await d.genererCle(db, { login: 'Kadi-GN' }, 'lynx-labe-1', () => 'cle-secrete');
  assert.deepEqual(r, { ok: true, cle: 'cle-secrete' });
  assert.equal(appels[0][0], crypto.createHash('sha256').update('cle-secrete').digest('hex'));
  assert.ok(!JSON.stringify(appels).includes('cle-secrete'));
  assert.deepEqual(await d.genererCle(db, { login: 'autre' }, 'lynx-labe-1'), { ok: false, code: 404 });
  assert.deepEqual(await d.genererCle(db, { login: 'Kadi-GN' }, "x'; drop"), { ok: false, code: 404 });
});

test('le guichet des demandes plafonne par heure', () => {
  const g = d.guichet(2);
  g.noter(0); g.noter(1);
  assert.equal(g.ouvert(2), false);
  assert.equal(g.ouvert(3600e3 + 2), true);
});
