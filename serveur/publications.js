// YITERE, lecture des publications (contournements et demandes) : GET /api/v1/publications[?cible=cle].
// Lecture seule. Publier, confirmer et signaler viendront avec la connexion GitHub.
// Forme : docs/CONTRAT-API-INTERFACE.md, section 3. Jamais les lignes masquees.
'use strict';

const LIMITE = 50;
const CLE_VALIDE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Une ligne de `posts` (jointe a sa cible) vers la forme publique du contrat. */
function mettreEnForme(ligne) {
  return {
    id: Number(ligne.id),
    cible: ligne.cible,
    auteur: ligne.github_login,
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

module.exports = { lire, lister, mettreEnForme, CLE_VALIDE, LIMITE };
