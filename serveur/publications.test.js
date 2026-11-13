// Tests de la lecture des publications : node --test serveur/publications.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { lire, lister, valider, deposer, guichet, CLE_VALIDE, ATTENTE_MAX, PAR_HEURE } = require('./publications.js');

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
    id: 1, cible: 'npm', auteur: 'kadi-gn', verifie: true, type: 'contournement',
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

// ---------------------------------------------------------------- Depot sans compte

const DEPOT = { cible: 'npm', type: 'contournement', pseudonyme: 'Kadi G.',
  contenu: 'Passer par le miroir du registre le temps de la panne.',
  commande: 'npm config set registry https://registry.npmmirror.com', pays: 'gn' };

test('un depot valide : valeurs nettoyees, pays en majuscules, champs vides en null', () => {
  const v = valider({ ...DEPOT, contenu: `  ${DEPOT.contenu}\r\n`, pseudonyme: ' Kadi   G. ' });
  assert.deepEqual(v, { ok: true, valeurs: { cible: 'npm', type: 'contournement', contenu: DEPOT.contenu,
    commande: DEPOT.commande, pseudonyme: 'Kadi G.', pays: 'GN' } });
  const sans = valider({ ...DEPOT, commande: '', pays: undefined, type: 'demande' });
  assert.equal(sans.valeurs.commande, null);
  assert.equal(sans.valeurs.pays, null);
});

test('un depot mal forme est refuse, avec le champ en cause', () => {
  const champ = (c) => valider(c).champ;
  assert.equal(champ(null), 'corps');
  assert.equal(champ([DEPOT]), 'corps');
  assert.equal(champ({ ...DEPOT, cible: 'NPM' }), 'cible');
  assert.equal(champ({ ...DEPOT, cible: "npm'; DROP TABLE posts;--" }), 'cible');
  assert.equal(champ({ ...DEPOT, type: 'publicite' }), 'type');
  assert.equal(champ({ ...DEPOT, contenu: 'trop court' }), 'contenu');
  assert.equal(champ({ ...DEPOT, contenu: 'x'.repeat(1001) }), 'contenu');
  assert.equal(champ({ ...DEPOT, contenu: 42 }), 'contenu');
  assert.equal(champ({ ...DEPOT, commande: 'x'.repeat(301) }), 'commande');
  assert.equal(champ({ ...DEPOT, commande: { $ne: '' } }), 'commande');
  assert.equal(champ({ ...DEPOT, pays: 'Guinee' }), 'pays');
  assert.equal(champ({ ...DEPOT, pseudonyme: 'x' }), 'pseudonyme');
  assert.equal(champ({ ...DEPOT, pseudonyme: '<script>alert(1)</script>' }), 'pseudonyme');
  assert.equal(champ({ ...DEPOT, pseudonyme: '@torvalds' }), 'pseudonyme');
  assert.equal(champ({ ...DEPOT, pseudonyme: '~admin' }), 'pseudonyme');
});

test('le leurre : un champ « site » rempli trahit un robot', () => {
  assert.equal(valider({ ...DEPOT, site: 'https://exemple.test' }).champ, 'site');
  assert.equal(valider({ ...DEPOT, site: '' }).ok, true);
});

test('les caracteres invisibles et de controle sont retires du texte', () => {
  const v = valider({ ...DEPOT, contenu: 'Un texte\u0000 assez long\u202E pour passer la limite\u200B.' });
  assert.equal(v.valeurs.contenu, 'Un texte assez long pour passer la limite.');
});

test('un pseudonyme accentue est accepte', () => {
  assert.equal(valider({ ...DEPOT, pseudonyme: 'Aïssatou D.' }).valeurs.pseudonyme, 'Aïssatou D.');
});

test('le pseudonyme s envoie sous « pseudonyme » ou sous « auteur », son nom a la lecture', () => {
  const { pseudonyme, ...sans } = DEPOT;
  assert.equal(valider({ ...sans, auteur: pseudonyme }).valeurs.pseudonyme, 'Kadi G.');
  assert.equal(valider({ ...sans, auteur: 'x' }).champ, 'pseudonyme');
  assert.equal(valider(sans).champ, 'pseudonyme');
  assert.equal(valider({ ...sans, auteur: 42 }).champ, 'pseudonyme');
  assert.equal(valider({ ...DEPOT, commande: null, pays: null }).ok, true);
});

test('le depot nait masque, sous un pseudonyme marque « ~ », jamais visible sans relecture', async () => {
  const appels = [];
  const db = { query: async (sql, p) => { appels.push({ sql, p });
    if (sql.includes('FROM targets')) return { rows: [{ id: 6 }] };
    if (sql.includes('count(*)')) return { rows: [{ n: 0 }] };
    return { rows: [] }; } };
  assert.deepEqual(await deposer(db, valider(DEPOT).valeurs), { ok: true });
  const ins = appels.at(-1);
  assert.match(ins.sql, /INSERT INTO posts/);
  assert.match(ins.sql, /true\)\s*$/);                 // masque = true, ecrit en dur
  assert.deepEqual(ins.p, [6, '~Kadi G.', 'contournement', DEPOT.contenu, DEPOT.commande, 'GN']);
  assert.match(appels[0].sql, /famille <> 'Reference'/);
});

test('cible inconnue : 404 ; file de relecture pleine : 503 ; dans les deux cas rien n est ecrit', async () => {
  const base = (cible, n) => { const ecrits = []; return { ecrits, query: async (sql) => {
    if (sql.includes('INSERT')) { ecrits.push(sql); return { rows: [] }; }
    if (sql.includes('FROM targets')) return { rows: cible ? [{ id: 1 }] : [] };
    return { rows: [{ n }] }; } }; };
  const v = valider(DEPOT).valeurs;
  let db = base(false, 0);
  assert.equal((await deposer(db, v)).code, 404);
  assert.equal(db.ecrits.length, 0);
  db = base(true, ATTENTE_MAX);
  assert.equal((await deposer(db, v)).code, 503);
  assert.equal(db.ecrits.length, 0);
});

test('le guichet : un plafond par heure glissante, sans adresse IP', () => {
  const g = guichet();
  const t0 = Date.parse('2026-11-13T12:00:00Z');
  for (let i = 0; i < PAR_HEURE; i++) { assert.equal(g.ouvert(t0 + i * 1000), true); g.noter(t0 + i * 1000); }
  assert.equal(g.ouvert(t0 + 60e3), false);
  assert.equal(g.ouvert(t0 + 3600e3 + 1000), true);       // une heure plus tard, la premiere place se libere
});

test('a la lecture, un pseudonyme sans compte perd son « ~ » et porte verifie: false', () => {
  const { publications } = lister([ligne(3, '2026-11-13T10:00:00Z', { github_login: '~Kadi G.' })]);
  assert.equal(publications[0].auteur, 'Kadi G.');
  assert.equal(publications[0].verifie, false);
});
