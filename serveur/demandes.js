#!/usr/bin/env node
// YITERE, demandes de sonde et cles, pour les comptes GitHub.
// 1. Une personne connectee demande une sonde (pays, ville, operateur). Aucune adresse e-mail.
// 2. L'equipe accepte la demande sur le serveur (commande ci-dessous) : la sonde est creee, rattachee
//    au login GitHub, sans cle.
// 3. L'hote genere sa cle dans « Mon espace ». Elle s'affiche une seule fois et n'est jamais stockee :
//    seule son empreinte va en base. La regenerer rend l'ancienne inutilisable tout de suite.
//
// Commande de l'equipe, sur le serveur :
//   node serveur/demandes.js lister
//   node serveur/demandes.js accepter <id> --pseudonyme lynx-ville-1 [--asn 37461]
//   node serveur/demandes.js refuser <id>
'use strict';
const crypto = require('node:crypto');
const { valider: validerSonde } = require('./creer-sonde.js');

const PAR_HEURE = 20;          // demandes acceptees par heure, tous comptes confondus
const hache = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const nettoyer = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();

/** Verifie une demande. Rend { ok, valeurs } ou { ok: false, champ, erreur }. */
function valider(corps) {
  const refus = (champ, erreur) => ({ ok: false, champ, erreur });
  if (corps === null || typeof corps !== 'object' || Array.isArray(corps)) return refus('corps', 'corps invalide');
  const pays = nettoyer(corps.pays).toUpperCase();
  if (!/^[A-Z]{2}$/.test(pays)) return refus('pays', 'pays invalide (code a deux lettres)');
  const ville = nettoyer(corps.ville);
  if (!/^[\p{L}][\p{L} '-]{1,59}$/u.test(ville)) return refus('ville', 'ville invalide (lettres, espaces, apostrophes, tirets)');
  const operateur = nettoyer(corps.operateur);
  if (operateur.length < 2 || operateur.length > 60) return refus('operateur', 'operateur manquant (2 a 60 caracteres)');
  return { ok: true, valeurs: { pays, ville, operateur } };
}

/** Le guichet des demandes : un plafond par heure, sans lire aucune adresse IP. */
function guichet(parHeure = PAR_HEURE) {
  let passages = [];
  return {
    ouvert(t = Date.now()) { passages = passages.filter((x) => t - x < 3600e3); return passages.length < parHeure; },
    noter(t = Date.now()) { passages.push(t); },
  };
}

/** Enregistre une demande. Une seule demande en attente par compte. */
async function demander(db, session, v) {
  const deja = await db.query(
    "SELECT id FROM demandes_sonde WHERE github_id = $1 AND statut = 'en-attente'", [session.id]);
  if (deja.rows[0]) return { ok: false, code: 409, erreur: 'une demande est deja en attente' };
  const r = await db.query(
    `INSERT INTO demandes_sonde (github_id, github_login, pays, ville, operateur)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [session.id, session.login, v.pays, v.ville, v.operateur]);
  return { ok: true, id: Number(r.rows[0].id) };
}

/** Les demandes d'un compte, pour Mon espace. */
async function demandesDe(db, session) {
  const r = await db.query(
    `SELECT id, pays, ville, operateur, statut, cree_le FROM demandes_sonde
      WHERE github_id = $1 ORDER BY cree_le DESC LIMIT 10`, [session.id]);
  return r.rows.map((x) => ({
    id: Number(x.id), pays: x.pays, ville: x.ville, operateur: x.operateur, statut: x.statut,
    cree_le: new Date(x.cree_le).toISOString(),
  }));
}

/**
 * Genere (ou regenere) la cle d'une sonde rattachee au compte. Rend { ok, cle } une seule fois ;
 * 404 si la sonde n'existe pas ou n'est pas a ce compte. La cle n'est jamais stockee.
 */
async function genererCle(db, session, pseudonyme, tirer = () => crypto.randomBytes(32).toString('base64url')) {
  if (typeof pseudonyme !== 'string' || !/^[a-z0-9][a-z0-9-]{2,31}$/.test(pseudonyme)) return { ok: false, code: 404 };
  const cle = tirer();
  const r = await db.query(
    `UPDATE probes SET jeton_hache = $1
      WHERE pseudonyme = $2 AND lower(github_login) = lower($3) AND active
      RETURNING pseudonyme`, [hache(cle), pseudonyme, session.login]);
  if (!r.rows[0]) return { ok: false, code: 404 };
  return { ok: true, cle };
}

// ------------------------------------------------------------ Commande de l'equipe

async function lister(db) {
  const r = await db.query(
    `SELECT id, github_login, pays, ville, operateur, statut, cree_le FROM demandes_sonde
      WHERE statut = 'en-attente' ORDER BY cree_le`);
  return r.rows;
}

/** Accepte une demande : cree la sonde, sans cle, rattachee au login. Une transaction. */
async function accepter(db, id, { pseudonyme, asn }) {
  const d = (await db.query("SELECT * FROM demandes_sonde WHERE id = $1 AND statut = 'en-attente'", [id])).rows[0];
  if (!d) throw new Error(`aucune demande en attente avec l'id ${id}`);
  const s = validerSonde({ pseudonyme, pays: d.pays, ville: d.ville, ...(asn ? { asn } : {}) });
  await db.query('BEGIN');
  try {
    const p = await db.query(
      `INSERT INTO probes (pseudonyme, pays, ville, asn, type, github_login)
       VALUES ($1, $2, $3, $4, 'dev', $5) RETURNING id`,
      [s.pseudonyme, s.pays, s.ville, s.asn, d.github_login]);
    await db.query(
      "UPDATE demandes_sonde SET statut = 'acceptee', traitee_le = now(), probe_id = $2 WHERE id = $1",
      [id, p.rows[0].id]);
    await db.query('COMMIT');
    return { pseudonyme: s.pseudonyme, login: d.github_login };
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

async function refuser(db, id) {
  const r = await db.query(
    "UPDATE demandes_sonde SET statut = 'refusee', traitee_le = now() WHERE id = $1 AND statut = 'en-attente' RETURNING id", [id]);
  if (!r.rows[0]) throw new Error(`aucune demande en attente avec l'id ${id}`);
}

if (require.main === module) {
  const { Client } = require('pg');
  const [action, id, ...reste] = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < reste.length; i += 2) opt[String(reste[i]).replace(/^--/, '')] = reste[i + 1];
  const db = new Client({ connectionString: process.env.YITERE_DB_URL });
  (async () => {
    await db.connect();
    if (action === 'lister') {
      const l = await lister(db);
      if (!l.length) console.log('Aucune demande en attente.');
      for (const d of l)
        console.log(`#${d.id}  @${d.github_login}  ${d.pays} ${d.ville}  ${d.operateur}  (${new Date(d.cree_le).toISOString().slice(0, 16).replace('T', ' ')})`);
    } else if (action === 'accepter') {
      const r = await accepter(db, Number(id), { pseudonyme: opt.pseudonyme, asn: opt.asn });
      console.log(`Sonde ${r.pseudonyme} creee pour @${r.login}. L'hote genere sa cle dans Mon espace.`);
    } else if (action === 'refuser') {
      await refuser(db, Number(id));
      console.log(`Demande #${id} refusee.`);
    } else {
      throw new Error('usage : lister | accepter <id> --pseudonyme lynx-ville-1 [--asn N] | refuser <id>');
    }
  })().catch((e) => { console.error('demandes :', e.message); process.exitCode = 1; }).finally(() => db.end());
}

module.exports = { valider, guichet, demander, demandesDe, genererCle, lister, accepter, refuser, PAR_HEURE };
