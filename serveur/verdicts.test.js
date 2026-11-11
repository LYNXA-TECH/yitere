// Tests des regles de verdict : node --test serveur/verdicts.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculer, listerSondes, mediane, SEUILS } = require('./verdicts.js');

const MAINTENANT = new Date('2026-11-12T12:00:00Z');
const il_y_a = (min) => new Date(MAINTENANT - min * 60e3).toISOString();
const VIEILLE = '2026-11-01T00:00:00Z';

const NPM = { id: 1, cle: 'npm', nom: 'registry.npmjs.org', famille: 'Registres', methode: 'entete', cadence_minutes: 10, code_attendu: 200 };
const OBJ = { id: 2, cle: 'jsdelivr-obj', nom: 'objet temoin', famille: 'Diffusion', methode: 'objet', cadence_minutes: 180, code_attendu: 200 };
const REF = { id: 3, cle: 'ref-dns', nom: 'dns', famille: 'Reference', methode: 'dns', cadence_minutes: 10, code_attendu: 0 };

const sonde = (id, extra = {}) => ({ id, pseudonyme: `s${id}`, pays: 'GN', ville: 'Conakry', asn: null, type: 'dev', creee_le: VIEILLE, ...extra });
const MADRID = sonde(9, { pseudonyme: 'lynx-madrid-1', pays: 'ES', ville: 'Madrid', type: 'datacenter' });

// Six mesures sur la derniere heure, toutes a la meme valeur.
const heure = (probe_id, cible, ttfb, extra = {}) =>
  [55, 45, 35, 25, 15, 5].map((m) => ({ probe_id, target_id: cible.id, mesure_le: il_y_a(m), ttfb_ms: ttfb, debit_bps: null, duree_ms: ttfb, code_http: cible.code_attendu, erreur: null, ...extra }));
const habitude = (probe_id, cible, ttfb, n = 500) => ({ probe_id, target_id: cible.id, n, ttfb_ms: ttfb, debit_bps: null });
const verdict = (d) => calculer(d, MAINTENANT).verdicts[0];

test('la mediane', () => {
  assert.equal(mediane([3, 1, 2]), 2);
  assert.equal(mediane([4, 1, 2, 3]), 2.5);
  assert.equal(mediane([]), null);
});

test('une sonde dans ses valeurs habituelles : normal, sans hypothese', () => {
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: heure(1, NPM, 320), habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'normal');
  assert.equal(v.depuis, null);
  assert.equal(v.hypothese, null);
  assert.deepEqual([v.preuves.sondes_touchees, v.preuves.sondes_epargnees, v.preuves.mesures], [0, 1, 6]);
  assert.deepEqual(v.preuves.sondes[0], { pseudonyme: 's1', operateur: null, ville: 'Conakry', numero: 1, statut: 'epargnee', valeur: 320, habituel: 300, unite: 'ms', mesures: 6, echecs: 0 });
});

test('au-dela de deux fois l habituel : degrade ; exactement deux fois : normal', () => {
  const d = (ttfb) => verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: heure(1, NPM, ttfb), habitudes: [habitude(1, NPM, 300)] });
  assert.equal(d(601).etat, 'degrade');
  assert.equal(d(600).etat, 'normal');
});

test('plus de la moitie des mesures en echec : degrade, meme si les reussies sont rapides', () => {
  const ms = heure(1, NPM, 300).map((m, i) => (i < 4 ? { ...m, ttfb_ms: null, code_http: null, erreur: 'delai depasse', duree_ms: 15000 } : m));
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: ms, habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'degrade');
  // la valeur affichee est le temps perdu a attendre, pas les 300 ms des deux reussites
  assert.deepEqual([v.preuves.sondes[0].valeur, v.preuves.sondes[0].echecs, v.preuves.sondes[0].mesures], [15000, 4, 6]);
});

test('un code HTTP inattendu compte comme un echec', () => {
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: heure(1, NPM, 300, { code_http: 503 }), habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'degrade');
});

test('deux sondes ne suffisent pas pour proposer une cause', () => {
  const v = verdict({
    cibles: [NPM], sondes: [sonde(1, { asn: 100 }), sonde(2, { asn: 200 })],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 310)],
    habitudes: [habitude(1, NPM, 300), habitude(2, NPM, 300)],
  });
  assert.equal(v.etat, 'degrade');
  assert.equal(v.hypothese, null);
  assert.equal(v.preuves.sondes[0].statut, 'touchee');
  assert.ok(SEUILS.minSondesCause > 2);
});

test('cause operateur : les touchees partagent un operateur, les epargnees sont ailleurs', () => {
  const v = verdict({
    cibles: [NPM], sondes: [sonde(1, { asn: 100 }), sonde(2, { asn: 100 }), sonde(3, { asn: 200 }), MADRID],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 1300), ...heure(3, NPM, 310), ...heure(9, NPM, 40)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)).concat(habitude(9, NPM, 40)),
  });
  assert.deepEqual(v.hypothese, { cause: 'operateur', operateur: 'AS100', ville: 'Conakry' });
  assert.equal(v.preuves.repere, 'normal');
  assert.deepEqual(v.preuves.sondes.map((s) => [s.pseudonyme, s.numero]), [['s1', 1], ['s2', 2], ['s3', 1]]);
});

test('pas de cause operateur si une sonde du meme operateur est epargnee', () => {
  const v = verdict({
    cibles: [NPM], sondes: [sonde(1, { asn: 100 }), sonde(2, { asn: 100 }), sonde(3, { asn: 200 })],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 310), ...heure(3, NPM, 310)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)),
  });
  assert.equal(v.hypothese, null);
});

test('cause service : toutes les sondes touchees et le repere de Madrid aussi', () => {
  const d = (madrid) => verdict({
    cibles: [NPM], sondes: [sonde(1), sonde(2), sonde(3), MADRID],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 1300), ...heure(3, NPM, 1400), ...heure(9, NPM, madrid)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)).concat(habitude(9, NPM, 40)),
  });
  assert.deepEqual(d(400).hypothese, { cause: 'service' });
  assert.equal(d(40).hypothese, null);       // Madrid normal : on ne conclut pas
});

test('cause connexion locale : une sonde touchee sur la plupart des services, les autres non', () => {
  const cibles = [1, 2, 3, 4].map((id) => ({ ...NPM, id, cle: `c${id}` }));
  const mesures = [], habitudes = [];
  for (const c of cibles) {
    mesures.push(...heure(1, c, c.id <= 3 ? 1500 : 310), ...heure(2, c, 310), ...heure(3, c, 310));
    habitudes.push(habitude(1, c, 300), habitude(2, c, 300), habitude(3, c, 300));
  }
  const r = calculer({ cibles, sondes: [sonde(1, { asn: 100 }), sonde(2, { asn: 200 }), sonde(3, { asn: 300 })], mesures, habitudes }, MAINTENANT);
  assert.deepEqual(r.verdicts.map((v) => v.hypothese && v.hypothese.cause), ['connexion-locale', 'connexion-locale', 'connexion-locale', null]);
  assert.equal(r.verdicts[3].etat, 'normal');
});

test('le repere de Madrid est hors calcul : seul, il ne donne pas d etat', () => {
  const v = verdict({ cibles: [NPM], sondes: [MADRID], mesures: heure(9, NPM, 400), habitudes: [habitude(9, NPM, 40)] });
  assert.equal(v.etat, 'pas-de-donnee');
  assert.equal(v.preuves.repere, 'degrade');
  assert.equal(v.preuves.sondes.length, 0);
});

test('une sonde de moins de 24 heures est en rodage et ne compte pas', () => {
  const v = verdict({ cibles: [NPM], sondes: [sonde(1, { creee_le: il_y_a(60 * 23) })], mesures: heure(1, NPM, 1200), habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'pas-de-donnee');
  assert.equal(v.preuves.sondes_en_rodage, 1);
  assert.equal(v.depuis, il_y_a(5));          // heure de la derniere mesure
});

test('sans assez d historique sur la cible, la sonde reste en rodage', () => {
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: heure(1, NPM, 1200), habitudes: [habitude(1, NPM, 300, SEUILS.minHabitude - 1)] });
  assert.equal(v.etat, 'pas-de-donnee');
  assert.equal(v.preuves.sondes_en_rodage, 1);
});

test('aucune mesure sur la periode : pas de donnee, jamais un zero', () => {
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures: [], habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'pas-de-donnee');
  assert.deepEqual([v.preuves.mesures, v.preuves.sondes_en_rodage, v.depuis], [0, 0, null]);
});

test('depuis : debut de la degradation, en remontant jusqu a trois bonnes mesures', () => {
  const m = (min, ttfb) => ({ probe_id: 1, target_id: 1, mesure_le: il_y_a(min), ttfb_ms: ttfb, debit_bps: null, duree_ms: ttfb, code_http: 200, erreur: null });
  const mesures = [m(135, 300), m(125, 300), m(115, 300), m(105, 300), m(95, 1200), m(85, 1200), m(75, 300), m(65, 1200), m(55, 1200), m(45, 1200), m(35, 1200), m(25, 1200), m(15, 1200), m(5, 1200)];
  const v = verdict({ cibles: [NPM], sondes: [sonde(1)], mesures, habitudes: [habitude(1, NPM, 300)] });
  assert.equal(v.etat, 'degrade');
  assert.equal(v.depuis, il_y_a(95));         // une seule bonne mesure a 75 ne ferme pas la degradation
});

test('une cible objet se juge au debit, en Mbit/s, sur une periode plus longue', () => {
  const m = (min, bps) => ({ probe_id: 1, target_id: 2, mesure_le: il_y_a(min), ttfb_ms: 200, debit_bps: bps, duree_ms: 900, code_http: 200, erreur: null });
  const d = (bps) => verdict({ cibles: [OBJ], sondes: [sonde(1)], mesures: [m(170, bps), m(110, bps), m(50, bps)], habitudes: [{ probe_id: 1, target_id: 2, n: 40, ttfb_ms: 200, debit_bps: 8e6 }] });
  const lent = d(3.9e6), bon = d(4.1e6);
  assert.equal(lent.etat, 'degrade');
  assert.equal(bon.etat, 'normal');
  assert.equal(lent.preuves.periode_minutes, 180);
  assert.deepEqual([lent.preuves.sondes[0].valeur, lent.preuves.sondes[0].habituel, lent.preuves.sondes[0].unite], [3.9, 8, 'mbps']);
});

test('les cibles de reference n ont pas de verdict', () => {
  const r = calculer({ cibles: [NPM, REF], sondes: [], mesures: [], habitudes: [] }, MAINTENANT);
  assert.deepEqual(r.verdicts.map((v) => v.cle), ['npm']);
  assert.equal(r.calcule_le, MAINTENANT.toISOString());
});

test('la liste des sondes ne laisse sortir ni jeton, ni identifiant, ni login', () => {
  const s = { ...sonde(1, { asn: 37461 }), jeton_hache: 'abc', github_login: 'x' };
  const r = listerSondes([s, { ...MADRID, creee_le: il_y_a(60) }], MAINTENANT);
  assert.deepEqual(r.sondes[0], { pseudonyme: 's1', pays: 'GN', ville: 'Conakry', operateur: 'AS37461', type: 'dev', en_rodage: false });
  assert.equal(r.sondes[1].en_rodage, true);
  assert.ok(!JSON.stringify(r).match(/jeton|github|"id"/));
});
