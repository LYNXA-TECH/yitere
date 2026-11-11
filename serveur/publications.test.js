// Tests de la lecture des publications : node --test serveur/publications.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { lire, lister, CLE_VALIDE } = require('./publications.js');

const ligne = (id, cree_le, extra = {}) => ({
  id: String(id), cible: 'npm', github_login: 'kadi-gn', type: 'contournement',
  contenu: 'Reutiliser le cache local.', commande: 'npm install --prefer-offline',
  pays: 'GN', votes: '7', cree_le, ...extra,
});

test('aucune publication : une liste vide, pas une erreur', () => {
  assert.deepEqual(lister([]), { publications: [] });
});

test('la forme suit le contrat : cle de cible, auteur GitHub, nombres en nombres, date ISO', () => {
  const { publications } = lister([ligne(1, new Date('2026-11-09T14:40:00Z'))]);
  assert.deepEqual(publications[0], {
    id: 1, cible: 'npm', auteur: 'kadi-gn', type: 'contournement',
    contenu: 'Reutiliser le cache local.', commande: 'npm install --prefer-offline',
    pays: 'GN', votes: 7, cree_le: '2026-11-09T14:40:00.000Z',
  });
});

test('tri du plus recent au plus ancien, 50 au plus', () => {
  const lignes = Array.from({ length: 60 }, (_, i) => ligne(i + 1, `2026-11-${String(1 + (i % 9)).padStart(2, '0')}T10:00:00Z`));
  const { publications } = lister(lignes);
  assert.equal(publications.length, 50);
  for (let i = 1; i < publications.length; i++)
    assert.ok(publications[i - 1].cree_le >= publications[i].cree_le);
});

test('commande et pays absents valent null', () => {
  const { publications } = lister([ligne(2, '2026-11-10T00:00:00Z', { commande: undefined, pays: null, type: 'demande' })]);
  assert.equal(publications[0].commande, null);
  assert.equal(publications[0].pays, null);
});

test('une cle mal formee est refusee sans toucher la base', async () => {
  const db = { query: async () => { throw new Error('ne doit pas etre appele'); } };
  for (const cle of ['', 'NPM', "npm'; DROP TABLE posts;--", 'a'.repeat(41), '../x'])
    assert.equal(await lire(db, cle), null);
  assert.ok(CLE_VALIDE.test('jsdelivr-obj'));
});

test('une cible inconnue ou inactive rend null', async () => {
  const db = { query: async () => ({ rows: [] }) };
  assert.equal(await lire(db, 'inconnue'), null);
});

test('la requete exclut les lignes masquees et filtre par cle', async () => {
  const appels = [];
  const db = { query: async (sql, p) => { appels.push({ sql, p }); return { rows: sql.includes('FROM targets') ? [{ id: 1 }] : [] }; } };
  assert.deepEqual(await lire(db, 'npm'), []);
  const q = appels.at(-1);
  assert.match(q.sql, /NOT p\.masque/);
  assert.deepEqual(q.p, ['npm']);
  await lire(db);
  assert.deepEqual(appels.at(-1).p, [null]);
});
