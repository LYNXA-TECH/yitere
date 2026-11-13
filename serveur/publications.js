// YITERE, publications (contournements et demandes de mesure).
// Lecture : GET /api/v1/publications[?cible=cle]. Jamais les lignes masquees.
// Depot : POST /api/v1/publications, sans compte. Rien de ce qui est depose n'est visible
// avant qu'un membre de l'equipe l'ait relu : la ligne nait masquee. Confirmer, voter et
// signaler viendront avec la connexion GitHub.
// Forme : docs/CONTRAT-API-INTERFACE.md, section 3.
'use strict';

const LIMITE = 50;
const CLE_VALIDE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Une ligne de `posts` (jointe a sa cible) vers la forme publique du contrat. */
function mettreEnForme(ligne) {
  return {
    id: Number(ligne.id),
    cible: ligne.cible,
    // Un pseudonyme depose sans compte est range avec « ~ » devant : ce n'est pas un compte GitHub.
    auteur: String(ligne.github_login).replace(/^~/, ''),
    verifie: !String(ligne.github_login).startsWith('~'),
    type: ligne.type,
    contenu: ligne.contenu,
    commande: ligne.commande ?? null,
    pays: ligne.pays ?? null,
    votes: Number(ligne.votes) || 0,
    cree_le: new Date(ligne.cree_le).toISOString(),
  };
}

/** Rend la reponse a partir des lignes deja lues : tri du plus recent au plus ancien, 50 au plus. */
function lister(lignes) {
  const tri = [...lignes].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le) || Number(b.id) - Number(a.id));
  return { publications: tri.slice(0, LIMITE).map(mettreEnForme) };
}

/**
 * Lit les publications visibles. `cle` absente : toutes. `cle` donnee : celles d'une cible active.
 * Rend null quand la cle est mal formee ou ne designe aucune cible active (la route repond 404).
 */
async function lire(db, cle) {
  if (cle !== undefined && cle !== null) {
    if (!CLE_VALIDE.test(cle)) return null;
    const t = await db.query('SELECT id FROM targets WHERE cle = $1 AND active', [cle]);
    if (!t.rows[0]) return null;
  }
  const r = await db.query(
    `SELECT p.id, t.cle AS cible, p.github_login, p.type, p.contenu, p.commande,
            p.pays, p.votes, p.cree_le
       FROM posts p JOIN targets t ON t.id = p.target_id
      WHERE NOT p.masque AND t.active AND ($1::text IS NULL OR t.cle = $1)
      ORDER BY p.cree_le DESC, p.id DESC
      LIMIT ${LIMITE}`,
    [cle ?? null]);
  return r.rows;
}

// ---------------------------------------------------------------- Depot sans compte

const TYPES = ['contournement', 'demande'];
const TAILLES = { contenu: [20, 1000], commande: [0, 300], pseudonyme: [2, 30] };
const PSEUDONYME = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;
const CORPS_MAX = 8 * 1024;        // octets
const ATTENTE_MAX = 200;           // depots en attente de relecture, au plus
const PAR_HEURE = 30;              // depots acceptes par heure, toutes origines confondues

/** Retire les caracteres de controle (sauf saut de ligne et tabulation) et les espaces de bord. */
function nettoyer(v) {
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\r\n?/g, '\n').trim();
}

/**
 * Verifie un depot. Rend { ok: true, valeurs } ou { ok: false, erreur, champ }.
 * Le champ « site » est un leurre invisible dans le formulaire : rempli, c'est un robot.
 */
function valider(corps) {
  const refus = (champ, erreur) => ({ ok: false, champ, erreur });
  if (corps === null || typeof corps !== 'object' || Array.isArray(corps)) return refus('corps', 'corps invalide');
  if (corps.site !== undefined && corps.site !== null && String(corps.site) !== '') return refus('site', 'depot refuse');
  for (const c of ['cible', 'type', 'contenu'])
    if (typeof corps[c] !== 'string') return refus(c, `${c} manquant`);
  // Le pseudonyme s'envoie sous « pseudonyme » ou sous « auteur », le nom qu'il porte a la lecture.
  const nomDonne = corps.pseudonyme ?? corps.auteur;
  if (typeof nomDonne !== 'string') return refus('pseudonyme', 'pseudonyme manquant');
  for (const c of ['commande', 'pays'])
    if (corps[c] !== undefined && corps[c] !== null && typeof corps[c] !== 'string') return refus(c, `${c} invalide`);

  const cible = corps.cible.trim();
  if (!CLE_VALIDE.test(cible)) return refus('cible', 'cible inconnue');
  if (!TYPES.includes(corps.type)) return refus('type', 'type inconnu');

  const contenu = nettoyer(corps.contenu);
  if (contenu.length < TAILLES.contenu[0]) return refus('contenu', `contenu trop court (${TAILLES.contenu[0]} caracteres au moins)`);
  if (contenu.length > TAILLES.contenu[1]) return refus('contenu', `contenu trop long (${TAILLES.contenu[1]} caracteres au plus)`);

  const commande = corps.commande ? nettoyer(corps.commande) : '';
  if (commande.length > TAILLES.commande[1]) return refus('commande', `commande trop longue (${TAILLES.commande[1]} caracteres au plus)`);

  const pseudonyme = nettoyer(nomDonne).replace(/\s+/g, ' ');
  if (pseudonyme.length < TAILLES.pseudonyme[0] || pseudonyme.length > TAILLES.pseudonyme[1] || !PSEUDONYME.test(pseudonyme))
    return refus('pseudonyme', 'pseudonyme invalide (2 a 30 lettres, chiffres, espaces, points ou tirets)');

  const pays = corps.pays ? corps.pays.trim().toUpperCase() : '';
  if (pays && !/^[A-Z]{2}$/.test(pays)) return refus('pays', 'pays invalide (code a deux lettres)');

  return { ok: true, valeurs: { cible, type: corps.type, contenu, commande: commande || null, pseudonyme, pays: pays || null } };
}

/**
 * Compte les depots acceptes sur une heure glissante, toutes origines confondues : aucune
 * adresse IP n'est lue. Un abus bloque le depot pendant une heure, jamais l'affichage.
 */
function guichet(parHeure = PAR_HEURE) {
  let passages = [];
  return {
    ouvert(maintenant = Date.now()) {
      passages = passages.filter((t) => maintenant - t < 3600e3);
      return passages.length < parHeure;
    },
    noter(maintenant = Date.now()) { passages.push(maintenant); },
  };
}

/**
 * Range un depot valide, masque, en attente de relecture.
 * Rend { ok: true } ou { ok: false, code, erreur } : 404 cible inconnue, 503 file pleine.
 */
async function deposer(db, v) {
  const t = await db.query("SELECT id FROM targets WHERE cle = $1 AND active AND famille <> 'Reference'", [v.cible]);
  if (!t.rows[0]) return { ok: false, code: 404, erreur: 'cible inconnue' };
  const f = await db.query('SELECT count(*)::int AS n FROM posts WHERE masque AND NOT signale');
  if (f.rows[0].n >= ATTENTE_MAX) return { ok: false, code: 503, erreur: 'trop de depots en attente de relecture, reessayez plus tard' };
  await db.query(
    `INSERT INTO posts (target_id, github_login, type, contenu, commande, pays, masque)
     VALUES ($1, $2, $3, $4, $5, $6, true)`,
    [t.rows[0].id, '~' + v.pseudonyme, v.type, v.contenu, v.commande, v.pays]);
  return { ok: true };
}

module.exports = { lire, lister, mettreEnForme, valider, deposer, guichet, nettoyer,
  CLE_VALIDE, LIMITE, CORPS_MAX, ATTENTE_MAX, PAR_HEURE, TAILLES };
