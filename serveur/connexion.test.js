// Tests de la connexion GitHub : node --test serveur/connexion.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('./connexion.js');

const ENV = { YITERE_GITHUB_CLIENT_ID: 'id-test', YITERE_GITHUB_CLIENT_SECRET: 'secret-test', YITERE_URL_PUBLIQUE: 'https://yitere.lynxatech.com/' };
const CFG = c.configuration(ENV);

test('configuration absente ou incomplete : null (la connexion reste fermee)', () => {
  assert.equal(c.configuration({}), null);
  assert.equal(c.configuration({ ...ENV, YITERE_URL_PUBLIQUE: 'http://yitere.lynxatech.com' }), null);
  assert.equal(CFG.rappel, 'https://yitere.lynxatech.com/api/v1/connexion/github/rappel');
});

test('le retour ne peut viser que ce site', () => {
  assert.equal(c.retourSur('/fr/moi'), '/fr/moi');
  assert.equal(c.retourSur('/fr/publier?cible=npm'), '/fr/publier?cible=npm');
  for (const mauvais of ['//exemple.com', '/\\exemple.com', 'https://exemple.com', '/fr/../../x', '', null, 'fr/moi', '/fr/<script>'])
    assert.equal(c.retourSur(mauvais), c.RETOUR_DEFAUT, String(mauvais));
});

test('debut : adresse GitHub sans permission demandee, etat dans un cookie protege', () => {
  const d = c.debut(CFG, '/fr/echanges');
  const u = new URL(d.url);
  assert.equal(u.origin + u.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(u.searchParams.get('client_id'), 'id-test');
  assert.equal(u.searchParams.get('scope'), null);
  assert.equal(u.searchParams.get('redirect_uri'), CFG.rappel);
  assert.match(d.cookie, /^yitere_etat=[^;]+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600$/);
  assert.ok(!d.url.includes('secret-test'));
  // Le retour fait l'aller-retour dans l'etat.
  const etat = u.searchParams.get('state');
  const cookies = c.lireCookies(d.cookie.split(';')[0]);
  assert.equal(c.verifierEtat(etat, cookies), '/fr/echanges');
});

test('etat absent, different ou sans cookie : refuse', () => {
  const d = c.debut(CFG, '/fr/moi');
  const etat = new URL(d.url).searchParams.get('state');
  assert.equal(c.verifierEtat(etat, {}), null);
  assert.equal(c.verifierEtat(null, c.lireCookies(d.cookie.split(';')[0])), null);
  const autre = new URL(c.debut(CFG, '/fr/moi').url).searchParams.get('state');
  assert.equal(c.verifierEtat(autre, c.lireCookies(d.cookie.split(';')[0])), null);
});

test('lireUtilisateur : echange le code, lit le profil, ne rend que id et login', async () => {
  const appels = [];
  const faux = async (url, opts) => {
    appels.push({ url, opts });
    if (url.includes('access_token')) return { ok: true, json: async () => ({ access_token: 'gho_jeton', token_type: 'bearer' }) };
    return { ok: true, json: async () => ({ id: 42, login: 'Aissatoulamarana', email: 'ne-pas-garder@exemple.com' }) };
  };
  const u = await c.lireUtilisateur(CFG, 'code123', faux);
  assert.deepEqual(u, { id: 42, login: 'Aissatoulamarana' });
  assert.equal(JSON.parse(appels[0].opts.body).client_secret, 'secret-test');
  assert.equal(appels[1].opts.headers.authorization, 'Bearer gho_jeton');
});

test('lireUtilisateur : code refuse ou profil bizarre, erreur', async () => {
  const refus = async () => ({ ok: true, json: async () => ({ error: 'bad_verification_code' }) });
  await assert.rejects(c.lireUtilisateur(CFG, 'code123', refus));
  await assert.rejects(c.lireUtilisateur(CFG, 'mauvais code!', refus));
  const bizarre = async (url) => url.includes('access_token')
    ? { ok: true, json: async () => ({ access_token: 'x' }) }
    : { ok: true, json: async () => ({ id: 1, login: '../admin' }) };
  await assert.rejects(c.lireUtilisateur(CFG, 'code123', bizarre));
});

// Une base en memoire, juste assez pour les sessions et les votes.
function base() {
  const sessions = new Map(); const votes = new Set(); const posts = new Map([[7, { masque: false }], [8, { masque: true }]]);
  return {
    sessions,
    async query(sql, p = []) {
      if (sql.startsWith('DELETE FROM sessions WHERE expire_le')) return { rows: [] };
      if (sql.includes('INSERT INTO sessions')) { sessions.set(p[0], { github_id: p[1], github_login: p[2] }); return { rows: [] }; }
      if (sql.startsWith('DELETE FROM sessions WHERE id_hache')) { sessions.delete(p[0]); return { rows: [] }; }
      if (sql.includes('FROM sessions WHERE id_hache')) return { rows: sessions.has(p[0]) ? [sessions.get(p[0])] : [] };
      if (sql.includes('FROM posts WHERE id = $1 AND NOT masque')) { const x = posts.get(p[0]); return { rows: x && !x.masque ? [{ id: p[0] }] : [] }; }
      if (sql.includes('INSERT INTO post_votes')) { votes.add(`${p[0]}:${p[1]}`); return { rows: [] }; }
      if (sql.includes('UPDATE posts SET votes')) return { rows: [{ votes: [...votes].filter((v) => v.startsWith(`${p[0]}:`)).length }] };
      throw new Error('requete inattendue: ' + sql);
    },
  };
}

test('session : le cookie porte un jeton, la base seulement son empreinte', async () => {
  const db = base();
  const ck = await c.ouvrirSession(db, { id: 42, login: 'kadi-gn' });
  assert.match(ck, /^yitere_session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000$/);
  const jeton = ck.split(';')[0].split('=')[1];
  assert.ok(!db.sessions.has(jeton));
  assert.equal([...db.sessions.keys()][0].length, 64);
  assert.deepEqual(await c.sessionDe(db, `autre=1; yitere_session=${jeton}`), { id: 42, login: 'kadi-gn' });
  assert.equal(await c.sessionDe(db, 'yitere_session=faux-jeton-tres-long-mais-inconnu'), null);
  assert.equal(await c.sessionDe(db, ''), null);
  const efface = await c.fermerSession(db, `yitere_session=${jeton}`);
  assert.match(efface, /Max-Age=0$/);
  assert.equal(await c.sessionDe(db, `yitere_session=${jeton}`), null);
});

test('ecriture avec session : seulement depuis le site', () => {
  assert.equal(c.origineAdmise(CFG, { origin: 'https://yitere.lynxatech.com' }), true);
  assert.equal(c.origineAdmise(CFG, { origin: 'https://exemple.com' }), false);
  assert.equal(c.origineAdmise(CFG, {}), false);
  assert.equal(c.origineAdmise(null, { origin: 'https://yitere.lynxatech.com' }), false);
});

test('vote : un par compte, seulement sur une publication visible', async () => {
  const db = base();
  const s = { id: 1, login: 'Kadi-GN' };
  assert.deepEqual(await c.voter(db, s, 7), { ok: true, votes: 1 });
  assert.deepEqual(await c.voter(db, { id: 1, login: 'kadi-gn' }, 7), { ok: true, votes: 1 });
  assert.deepEqual(await c.voter(db, { id: 2, login: 'autre' }, 7), { ok: true, votes: 2 });
  assert.deepEqual(await c.voter(db, s, 8), { ok: false, code: 404 });
  assert.deepEqual(await c.voter(db, s, -1), { ok: false, code: 404 });
});
