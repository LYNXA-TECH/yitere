// YITERE, connexion GitHub (OAuth « web application flow »).
// Ce que l'on garde : le login GitHub et son numero, dans une session de 30 jours. Ce que l'on ne
// garde jamais : le jeton d'acces GitHub (il sert une fois, a lire le login, puis il est oublie),
// l'adresse e-mail, l'adresse IP. Aucune permission GitHub n'est demandee (pas de « scope ») :
// seul le profil public est lu.
// Le cookie de session est HttpOnly, Secure, SameSite=Lax ; seule son empreinte SHA-256 est en base.
// Les ecritures avec session verifient en plus l'en-tete Origin.
'use strict';
const crypto = require('node:crypto');

const SESSION_JOURS = 30;
const ETAT_MINUTES = 10;
const COOKIE_SESSION = 'yitere_session';
const COOKIE_ETAT = 'yitere_etat';
const RETOUR_DEFAUT = '/fr/moi';
const LOGIN_GITHUB = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

const hache = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const aleatoire = () => crypto.randomBytes(32).toString('base64url');

/** La configuration vient de l'environnement. Absente : la connexion repond 503, le reste marche. */
function configuration(env = process.env) {
  const clientId = env.YITERE_GITHUB_CLIENT_ID;
  const secret = env.YITERE_GITHUB_CLIENT_SECRET;
  const urlPublique = (env.YITERE_URL_PUBLIQUE || '').replace(/\/+$/, '');
  if (!clientId || !secret || !/^https:\/\/[^/]+$/.test(urlPublique)) return null;
  return { clientId, secret, urlPublique, rappel: `${urlPublique}/api/v1/connexion/github/rappel` };
}

/** Lit l'en-tete Cookie. Les valeurs mal formees sont ignorees. */
function lireCookies(entete = '') {
  const out = {};
  for (const morceau of String(entete).split(';')) {
    const i = morceau.indexOf('=');
    if (i < 1) continue;
    const nom = morceau.slice(0, i).trim();
    const val = morceau.slice(i + 1).trim();
    if (/^[A-Za-z0-9_-]{1,64}$/.test(nom) && /^[A-Za-z0-9_.~-]{0,256}$/.test(val)) out[nom] = val;
  }
  return out;
}

function cookie(nom, valeur, maxAgeSecondes) {
  return `${nom}=${valeur}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSecondes}`;
}

/**
 * Le retour apres connexion : seulement un chemin de ce site, jamais une autre adresse.
 * « //exemple.com » ou « /\exemple.com » seraient compris comme un autre site : refuses.
 */
function retourSur(valeur) {
  if (typeof valeur !== 'string' || valeur.length > 200) return RETOUR_DEFAUT;
  if (!/^\/[A-Za-z0-9/_\-.?=&%]*$/.test(valeur)) return RETOUR_DEFAUT;
  if (valeur.startsWith('//') || valeur.includes('/\\') || valeur.includes('..')) return RETOUR_DEFAUT;
  return valeur;
}

/**
 * Premier pas : l'adresse GitHub ou envoyer la personne, et le cookie qui portera l'etat.
 * L'etat lie l'aller et le retour (protection CSRF de OAuth) et transporte le chemin de retour.
 */
function debut(cfg, retour) {
  const jeton = aleatoire();
  const etat = `${jeton}.${Buffer.from(retourSur(retour)).toString('base64url')}`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.rappel);
  url.searchParams.set('state', etat);
  url.searchParams.set('allow_signup', 'true');
  return { url: url.toString(), cookie: cookie(COOKIE_ETAT, etat, ETAT_MINUTES * 60) };
}

/** Verifie l'etat recu contre le cookie et rend le chemin de retour, ou null. */
function verifierEtat(etatRecu, cookies) {
  const attendu = cookies[COOKIE_ETAT];
  if (!etatRecu || !attendu || etatRecu.length !== attendu.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(etatRecu), Buffer.from(attendu))) return null;
  const partie = etatRecu.split('.')[1] || '';
  let chemin = RETOUR_DEFAUT;
  try { chemin = retourSur(Buffer.from(partie, 'base64url').toString('utf8')); } catch { /* defaut */ }
  return chemin;
}

/**
 * Echange le code contre un jeton, lit le profil public, puis oublie le jeton.
 * Rend { id, login } ou lance une erreur. `requete` est fetch, remplacable dans les tests.
 */
async function lireUtilisateur(cfg, code, requete = fetch) {
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(code)) throw new Error('code invalide');
  const r = await requete('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.secret, code, redirect_uri: cfg.rappel }),
    signal: AbortSignal.timeout(10e3),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('echange refuse');
  const u = await requete('https://api.github.com/user', {
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${j.access_token}`, 'user-agent': 'YITERE' },
    signal: AbortSignal.timeout(10e3),
  });
  const p = await u.json();
  if (!u.ok || !Number.isSafeInteger(p.id) || !LOGIN_GITHUB.test(String(p.login))) throw new Error('profil illisible');
  return { id: p.id, login: p.login };
}

/** Ouvre une session : un jeton aleatoire dans le cookie, son empreinte en base. */
async function ouvrirSession(db, utilisateur) {
  const jeton = aleatoire();
  await db.query('DELETE FROM sessions WHERE expire_le < now()');
  await db.query(
    `INSERT INTO sessions (id_hache, github_id, github_login, expire_le)
     VALUES ($1, $2, $3, now() + interval '${SESSION_JOURS} days')`,
    [hache(jeton), utilisateur.id, utilisateur.login]);
  return cookie(COOKIE_SESSION, jeton, SESSION_JOURS * 86400);
}

/** La session de la requete : { login, id } ou null. */
async function sessionDe(db, enteteCookie) {
  const jeton = lireCookies(enteteCookie)[COOKIE_SESSION];
  if (!jeton || jeton.length < 20) return null;
  const r = await db.query(
    'SELECT github_id, github_login FROM sessions WHERE id_hache = $1 AND expire_le > now()', [hache(jeton)]);
  const s = r.rows[0];
  return s ? { id: Number(s.github_id), login: s.github_login } : null;
}

/** Ferme la session et rend le cookie qui l'efface du navigateur. */
async function fermerSession(db, enteteCookie) {
  const jeton = lireCookies(enteteCookie)[COOKIE_SESSION];
  if (jeton) await db.query('DELETE FROM sessions WHERE id_hache = $1', [hache(jeton)]);
  return cookie(COOKIE_SESSION, '', 0);
}

/** Une ecriture avec session doit venir du site lui-meme (en plus de SameSite=Lax). */
function origineAdmise(cfg, entetes) {
  return Boolean(cfg) && entetes.origin === cfg.urlPublique;
}

/** L'espace d'une personne connectee : ses sondes, ses demandes de sonde et ses publications. */
async function monEspace(db, session) {
  const s = await db.query(
    `SELECT p.pseudonyme, p.pays, p.ville, p.asn, p.active, p.vue_le, (p.jeton_hache IS NOT NULL) AS cle_generee,
            (SELECT count(*)::int FROM measurements m
              WHERE m.probe_id = p.id AND m.mesure_le > now() - interval '24 hours') AS mesures_24h
       FROM probes p WHERE lower(p.github_login) = lower($1) ORDER BY p.pseudonyme`, [session.login]);
  const p = await db.query(
    `SELECT p.id, t.cle AS cible, p.type, p.contenu, p.commande, p.votes, p.masque, p.signale, p.cree_le
       FROM posts p JOIN targets t ON t.id = p.target_id
      WHERE lower(p.github_login) = lower($1) ORDER BY p.cree_le DESC LIMIT 50`, [session.login]);
  const demandes = await require('./demandes.js').demandesDe(db, session);
  return {
    login: session.login,
    demandes,
    sondes: s.rows.map((r) => ({
      pseudonyme: r.pseudonyme, pays: r.pays, ville: r.ville, asn: r.asn, active: r.active,
      vue_le: r.vue_le ? new Date(r.vue_le).toISOString() : null, mesures_24h: r.mesures_24h,
      cle_generee: Boolean(r.cle_generee),
    })),
    publications: p.rows.map((r) => ({
      id: Number(r.id), cible: r.cible, type: r.type, contenu: r.contenu, commande: r.commande ?? null,
      votes: Number(r.votes) || 0,
      statut: r.signale ? 'refusee' : r.masque ? 'en-attente' : 'publiee',
      cree_le: new Date(r.cree_le).toISOString(),
    })),
  };
}

/**
 * « A marche pour moi aussi » : un vote par compte et par publication visible.
 * Rend { ok, votes } ; 404 si la publication n'est pas visible. Voter deux fois ne compte qu'une fois.
 */
async function voter(db, session, postId) {
  if (!Number.isSafeInteger(postId) || postId < 1) return { ok: false, code: 404 };
  const v = await db.query('SELECT id FROM posts WHERE id = $1 AND NOT masque', [postId]);
  if (!v.rows[0]) return { ok: false, code: 404 };
  await db.query(
    'INSERT INTO post_votes (post_id, github_login) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [postId, session.login.toLowerCase()]);
  const r = await db.query(
    `UPDATE posts SET votes = (SELECT count(*) FROM post_votes WHERE post_id = $1)
      WHERE id = $1 RETURNING votes`, [postId]);
  return { ok: true, votes: Number(r.rows[0].votes) };
}

module.exports = {
  configuration, lireCookies, retourSur, debut, verifierEtat, lireUtilisateur,
  ouvrirSession, sessionDe, fermerSession, origineAdmise, monEspace, voter,
  COOKIE_SESSION, COOKIE_ETAT, RETOUR_DEFAUT, SESSION_JOURS,
};
