#!/usr/bin/env node
// YITERE, sonde. Un seul fichier, aucune dependance, aucun droit administrateur,
// aucun port ouvert. Elle mesure, elle envoie, elle s'arrete.
'use strict';
const https = require('node:https');
const dns = require('node:dns');
const { performance } = require('node:perf_hooks');

const API = process.env.YITERE_API || 'https://yitere.lynxatech.com';
const JETON = process.env.YITERE_JETON || '';
const DELAI = 15000;                     // delai depasse, section 5 de la methodologie
const UA = 'yitere-sonde/1.0 (+https://yitere.lynxatech.com/methodologie)';

function annonce(cibles) {
  const dix = cibles.filter(c => c.cadence_minutes <= 10).length;
  console.log(`YITERE-sonde 1.0
Ce que cette sonde va faire :
 . mesurer ${dix} adresses a chaque passage, et ${cibles.length - dix} objets temoins plus rarement
 . n'ouvrir aucun port, ne lire aucun de vos fichiers
 . envoyer les resultats a ${API} (votre adresse IP n'est pas conservee)`);
}

function typeErreur(e) {
  const c = e && e.code ? e.code : '';
  if (c === 'ENOTFOUND' || c === 'EAI_AGAIN') return 'dns';
  if (c === 'ECONNREFUSED') return 'refus';
  if (c === 'ECONNRESET') return 'coupure';
  if (c.startsWith('ERR_TLS') || c.startsWith('CERT_') || c === 'EPROTO') return 'tls';
  if (c === 'ETIMEDOUT' || c === 'delai') return 'delai depasse';
  return c ? c.toLowerCase() : 'inconnue';
}

// Mesure HTTPS. mode 'objet' telecharge tout, mode 'entete' s'arrete aux en-tetes.
function mesurerHttp(cible) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const m = { cible: cible.cle };
    let fini = false;
    const rendre = (extra) => {
      if (fini) return; fini = true;
      resolve(Object.assign(m, { duree_ms: performance.now() - t0 }, extra));
    };
    let req;
    try {
      req = https.request(cible.url, { method: 'GET', headers: { 'user-agent': UA } });
    } catch (e) { return rendre({ erreur: typeErreur(e) }); }

    req.setTimeout(DELAI, () => { req.destroy(Object.assign(new Error('delai'), { code: 'delai' })); });
    req.on('socket', (s) => {
      s.on('lookup', () => { m.dns_ms = performance.now() - t0; });
      s.on('connect', () => { m.tcp_ms = performance.now() - t0; });
      s.on('secureConnect', () => { m.tls_ms = performance.now() - t0; });
    });
    req.on('response', (res) => {
      m.ttfb_ms = performance.now() - t0;
      m.code_http = res.statusCode;
      if (cible.methode === 'entete') { res.destroy(); req.destroy(); return rendre({ octets: 0 }); }
      let octets = 0;
      res.on('data', (c) => { octets += c.length; });
      res.on('end', () => {
        const duree = performance.now() - t0;
        rendre({ octets, debit_bps: duree > 0 ? Math.round((octets * 8) / (duree / 1000)) : null });
      });
      res.on('error', (e) => rendre({ octets, erreur: typeErreur(e) }));
    });
    req.on('error', (e) => rendre({ erreur: typeErreur(e) }));
    req.end();
  });
}

// Mesure DNS pure : on interroge un resolveur donne et on chronometre.
function mesurerDns(cible) {
  return new Promise((resolve) => {
    const u = new URL(cible.url.replace(/^dns:/, 'http:'));
    const serveur = u.hostname;
    const nom = u.pathname.replace(/^\//, '') || 'example.com';
    const r = new dns.Resolver({ timeout: DELAI, tries: 1 });
    try { r.setServers([serveur]); } catch (e) { return resolve({ cible: cible.cle, erreur: 'resolveur invalide' }); }
    const t0 = performance.now();
    r.resolve4(nom, (e) => {
      const d = performance.now() - t0;
      resolve(e ? { cible: cible.cle, duree_ms: d, erreur: typeErreur(e) }
                : { cible: cible.cle, dns_ms: d, duree_ms: d });
    });
  });
}

function lire(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'user-agent': UA } }, (res) => {
      let b = ''; res.on('data', (c) => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function envoyer(mesures) {
  return new Promise((resolve, reject) => {
    const corps = JSON.stringify({ mesures });
    const u = new URL('/api/v1/mesures', API);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(corps),
        'authorization': 'Bearer ' + JETON,
        'user-agent': UA,
      },
    }, (res) => {
      let b = ''; res.on('data', (c) => b += c);
      res.on('end', () => res.statusCode === 201 ? resolve(JSON.parse(b || '{}'))
                                                 : reject(new Error(res.statusCode + ' ' + b)));
    });
    req.on('error', reject);
    req.end(corps);
  });
}

(async () => {
  if (!JETON) { console.error('YITERE_JETON manquant'); process.exit(1); }
  const minute = new Date().getUTCMinutes();
  const { cibles } = await lire(new URL('/api/v1/cibles', API).toString());
  if (process.argv.includes('--annonce')) { annonce(cibles); return; }

  // Mode econome : une cible n'est mesuree que si son tour est venu.
  const duTour = cibles.filter(c => minute % c.cadence_minutes < 10);
  const mesures = [];
  for (const c of duTour) {
    mesures.push(c.methode === 'dns' ? await mesurerDns(c) : await mesurerHttp(c));
  }
  const bilan = await envoyer(mesures);
  console.log(`passage: ${mesures.length} mesures, ${bilan.poses} posees, ${bilan.ignorees} ignorees`);
})().catch((e) => { console.error('passage echoue:', e.message); process.exit(1); });
