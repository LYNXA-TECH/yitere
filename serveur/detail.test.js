// Tests de la fiche d'un service : node --test serveur/detail.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { detailler, courbe, decomposer, existe, PAS_24H, PAS_7J } = require('./detail.js');

const MAINTENANT = new Date('2026-11-12T12:00:00Z');
const il_y_a = (min) => new Date(MAINTENANT - min * 60e3).toISOString();
const NPM = { id: 1, cle: 'npm', nom: 'npm', famille: 'Registres', methode: 'entete', cadence_minutes: 10, code_attendu: 200 };
const OBJ = { id: 2, cle: 'jsdelivr-obj', nom: 'objet', famille: 'Diffusion', methode: 'objet', cadence_minutes: 180, code_attendu: 200 };
const REF = { id: 3, cle: 'ref-dns', nom: 'dns', famille: 'Reference', methode: 'dns', cadence_minutes: 10, code_attendu: 0 };
const sonde = (id, extra = {}) => ({ id, pseudonyme: `s${id}`, pays: 'GN', ville: 'Conakry', asn: null, type: 'dev', creee_le: '2026-11-01T00:00:00Z', ...extra });
const MADRID = sonde(9, { type: 'datacenter', ville: 'Madrid', pays: 'ES' });
const m = (probe_id, cible, min, ttfb, extra = {}) => ({ probe_id, target_id: cible.id, mesure_le: il_y_a(min), ttfb_ms: ttfb, debit_bps: null, duree_ms: ttfb, code_http: 200, erreur: null, ...extra });
const heure = (probe_id, cible, ttfb, extra = {}) => [55, 45, 35, 25, 15, 5].map((min) => m(probe_id, cible, min, ttfb, extra));
const habitude = (probe_id, cible, ttfb) => ({ probe_id, target_id: cible.id, n: 500, ttfb_ms: ttfb, debit_bps: null });
const passage = (probe_id, t) => ({ probe_id, mesure_le: il_y_a(5), dns_ms: t[0], tcp_ms: t[1], tls_ms: t[2], ttfb_ms: t[3] });

test('une cle inconnue ou une cible de reference : null, la route repond 404', () => {
  const d = { cibles: [NPM, REF], sondes: [sonde(1)], mesures: [], habitudes: [] };
  assert.equal(detailler(d, 'inconnue', MAINTENANT), null);
  assert.equal(detailler(d, 'ref-dns', MAINTENANT), null);
});

test('la courbe : une mediane par pas, null sans mesure, les echecs ne comptent pas', () => {
  const mesures = [m(1, NPM, 50, 300), m(1, NPM, 30, 500), m(1, NPM, 10, 400),   // dernier pas : mediane 400
    m(1, NPM, 90, 200), m(1, NPM, 80, 9000, { erreur: 'delai' }),               // avant-dernier : l'echec est ignore
    m(1, NPM, 200, 250, { code_http: 503 })];                                     // code inattendu : ignore
  const c = courbe(mesures, NPM, PAS_24H, MAINTENANT);
  assert.equal(c.length, 24);
  assert.equal(c[23], 400);
  assert.equal(c[22], 200);
  assert.equal(c[20], null);
  assert.ok(c.slice(0, 22).every((x) => x === null));
});

test('les bornes des pas : la fin est incluse, le debut exclu, rien hors de la fenetre', () => {
  const c = courbe([m(1, NPM, 0, 100), m(1, NPM, 60, 200), m(1, NPM, 24 * 60, 999), m(1, NPM, -5, 999)], NPM, PAS_24H, MAINTENANT);
  assert.equal(c[23], 100);      // mesuree a l'instant meme : dernier pas
  assert.equal(c[22], 200);      // pile une heure avant : fin du pas precedent
  assert.equal(c[0], null);      // pile 24 h avant : hors fenetre
  assert.equal(c.filter((x) => x !== null).length, 2);
});

test('les heures : 24 pas d une heure et 28 pas de six heures, le dernier finit maintenant', () => {
  const f = detailler({ cibles: [NPM], sondes: [sonde(1)], mesures: heure(1, NPM, 300), habitudes: [habitude(1, NPM, 300)] }, 'npm', MAINTENANT);
  assert.equal(f.heures_24.length, 24);
  assert.equal(f.heures_7j.length, 28);
  assert.equal(f.heures_24[23], MAINTENANT.toISOString());
  assert.equal(f.heures_24[0], '2026-11-11T13:00:00.000Z');
  assert.equal(f.heures_7j[27], MAINTENANT.toISOString());
  assert.equal(f.heures_7j[0], '2026-11-05T18:00:00.000Z');
});

test('une courbe par sonde developpeur, avec le statut du verdict ; Madrid et les muettes n en ont pas', () => {
  const f = detailler({
    cibles: [NPM], sondes: [sonde(1), sonde(2), sonde(3, { creee_le: il_y_a(120) }), sonde(4), MADRID],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 310), ...heure(3, NPM, 320), ...heure(9, NPM, 62)],
    habitudes: [habitude(1, NPM, 300), habitude(2, NPM, 300), habitude(9, NPM, 60)],
    semaine: [m(1, NPM, 5, 1200), m(1, NPM, 3 * 24 * 60, 280)],
  }, 'npm', MAINTENANT);
  assert.deepEqual(f.series_24.map((s) => [s.sonde.pseudonyme, s.statut, s.points[23]]),
    [['s1', 'touchee', 1200], ['s2', 'epargnee', 310], ['s3', 'rodage', 320]]);
  assert.deepEqual(f.series_24[0].sonde, { pseudonyme: 's1', operateur: null, ville: 'Conakry', numero: 1 });
  assert.equal(f.series_24[2].sonde.numero, 3);
  assert.equal(f.series_7j.length, 3);
  assert.equal(f.series_7j[0].points[27], 1200);
  assert.equal(f.series_7j[0].points[15], 280);       // trois jours plus tot : douze pas de six heures avant
  assert.deepEqual(f.repere, { valeur: 62, etat: 'normal' });
});

test('la bande habituelle : le plus petit et le plus grand habituel des sondes jugees', () => {
  const f = detailler({
    cibles: [NPM], sondes: [sonde(1), sonde(2)],
    mesures: [...heure(1, NPM, 300), ...heure(2, NPM, 420)],
    habitudes: [habitude(1, NPM, 290), habitude(2, NPM, 410)],
  }, 'npm', MAINTENANT);
  assert.deepEqual(f.habituel, { min: 290, max: 410 });
  assert.equal(f.debut_incident_24, null);
});

test('aucune sonde jugee : pas de bande, pas de cascade, jamais un zero', () => {
  const f = detailler({
    cibles: [NPM], sondes: [sonde(1, { creee_le: il_y_a(60) })],
    mesures: heure(1, NPM, 300), habitudes: [], passages: [passage(1, [20, 90, 230, 300])],
  }, 'npm', MAINTENANT);
  assert.equal(f.habituel, null);
  assert.deepEqual(f.cascades, []);
  assert.deepEqual(f.repere, { valeur: null, etat: 'exclu' });
  assert.equal(f.series_24[0].statut, 'rodage');
});

test('le debut de l incident : le premier pas qui finit apres le debut de la degradation', () => {
  const bonnes = [175, 165, 155, 145, 135, 125].map((min) => m(1, NPM, min, 300));
  const lentes = [115, 105, 95, 85, 75, 65, 55, 45, 35, 25, 15, 5].map((min) => m(1, NPM, min, 1500));
  const f = detailler({ cibles: [NPM], sondes: [sonde(1)], mesures: [...bonnes, ...lentes], habitudes: [habitude(1, NPM, 300)] }, 'npm', MAINTENANT);
  assert.equal(f.debut_incident_24, 22);                // degrade depuis 115 minutes : l'avant-dernier pas
  assert.equal(f.series_24[0].statut, 'touchee');
});

test('ou part le temps : quatre durees dont la somme est le premier octet, la touchee d abord', () => {
  const f = detailler({
    cibles: [NPM], sondes: [sonde(1), sonde(2), sonde(3)],
    mesures: [...heure(1, NPM, 310), ...heure(2, NPM, 1500), ...heure(3, NPM, 300)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)),
    passages: [passage(1, [23, 99, 243, 310]), passage(2, [38, 224, 576, 1500]), passage(3, [20, 90, 230, 300])],
  }, 'npm', MAINTENANT);
  assert.equal(f.cascades.length, 2);
  assert.deepEqual(f.cascades.map((c) => [c.sonde.pseudonyme, c.statut]), [['s2', 'touchee'], ['s1', 'epargnee']]);
  const c = f.cascades[0];
  assert.deepEqual([c.dns, c.connexion, c.tls, c.attente, c.premier_octet], [38, 186, 352, 924, 1500]);
  assert.equal(c.dns + c.connexion + c.tls + c.attente, c.premier_octet);
  assert.equal(c.mesure_le, il_y_a(5));
});

test('un passage incomplet ou incoherent n est pas decompose', () => {
  assert.equal(decomposer({ dns_ms: null, tcp_ms: 90, tls_ms: 230, ttfb_ms: 300 }), null);
  assert.equal(decomposer({ dns_ms: 20, tcp_ms: 10, tls_ms: 230, ttfb_ms: 300 }), null);
  assert.deepEqual(decomposer({ dns_ms: 0, tcp_ms: 70.4, tls_ms: 200.2, ttfb_ms: 300.6 }),
    { dns: 0, connexion: 70, tls: 130, attente: 100, premier_octet: 301 });
});

test('une cible objet : des Mbit/s a deux decimales, sur ses propres pas, et pas de cascade', () => {
  const debit = (min, bps) => m(1, OBJ, min, null, { debit_bps: bps, duree_ms: 4000 });
  const f = detailler({
    cibles: [OBJ], sondes: [sonde(1)],
    mesures: [debit(170, 3_200_000), debit(110, 3_456_000), debit(50, 3_300_000)],
    habitudes: [{ probe_id: 1, target_id: OBJ.id, n: 40, ttfb_ms: null, debit_bps: 3_250_000 }],
    passages: [passage(1, [20, 90, 230, 300])],
  }, 'jsdelivr-obj', MAINTENANT);
  assert.equal(f.unite, 'mbps');
  assert.deepEqual(f.series_24[0].points.slice(21), [3.2, 3.46, 3.3]);
  assert.deepEqual(f.habituel, { min: 3.25, max: 3.25 });
  assert.deepEqual(f.cascades, []);
});

test('une cle mal formee est refusee sans toucher la base', async () => {
  const db = { query: async () => { throw new Error('ne doit pas etre appele'); } };
  for (const cle of ['', 'NPM', "npm' OR 1=1", 'a'.repeat(41), '..%2Fx', undefined])
    assert.equal(await existe(db, cle), false);
  assert.equal(await existe({ query: async () => ({ rows: [{}] }) }, 'npm'), true);
  assert.equal(await existe({ query: async () => ({ rows: [] }) }, 'ref-dns'), false);
});

test('les pas publies : 24 heures et 7 jours', () => {
  assert.equal(PAS_24H.nombre * PAS_24H.duree, 24 * 3600e3);
  assert.equal(PAS_7J.nombre * PAS_7J.duree, 7 * 24 * 3600e3);
});
