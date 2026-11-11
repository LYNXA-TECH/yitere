// Tests du tableau des services : node --test serveur/services.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { resumer } = require('./services.js');

const MAINTENANT = new Date('2026-11-12T12:00:00Z');
const il_y_a = (min) => new Date(MAINTENANT - min * 60e3).toISOString();
const NPM = { id: 1, cle: 'npm', nom: 'npm', famille: 'Registres', methode: 'entete', cadence_minutes: 10, code_attendu: 200 };
const OBJ = { id: 2, cle: 'jsdelivr-obj', nom: 'objet', famille: 'Diffusion', methode: 'objet', cadence_minutes: 180, code_attendu: 200 };
const REF = { id: 3, cle: 'ref-dns', nom: 'dns', famille: 'Reference', methode: 'dns', cadence_minutes: 10, code_attendu: 0 };
const sonde = (id, extra = {}) => ({ id, pseudonyme: `s${id}`, pays: 'GN', ville: 'Conakry', asn: null, type: 'dev', creee_le: '2026-11-01T00:00:00Z', ...extra });
const MADRID = sonde(9, { type: 'datacenter', ville: 'Madrid', pays: 'ES' });
const heure = (probe_id, cible, ttfb, extra = {}) =>
  [55, 45, 35, 25, 15, 5].map((m) => ({ probe_id, target_id: cible.id, mesure_le: il_y_a(m), ttfb_ms: ttfb, debit_bps: null, duree_ms: ttfb, code_http: 200, erreur: null, ...extra }));
const habitude = (probe_id, cible, ttfb) => ({ probe_id, target_id: cible.id, n: 500, ttfb_ms: ttfb, debit_bps: null });
const ligne = (d) => resumer(d, MAINTENANT).services[0];

test('des sondes touchees : leur moyenne, et la moyenne des epargnees a cote', () => {
  const l = ligne({
    cibles: [NPM], sondes: [sonde(1), sonde(2), sonde(3), MADRID],
    mesures: [...heure(1, NPM, 1200), ...heure(2, NPM, 1400), ...heure(3, NPM, 310), ...heure(9, NPM, 62)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)).concat(habitude(9, NPM, 60)),
  });
  assert.deepEqual(l, { cle: 'npm', unite: 'ms', valeur: 1300, valeur_autres: 310, sondes_mesurees: 3, disponibilite: 1, passages: 18, solutions: 0, demandes: 0, repere: 62 });
});

test('aucune sonde touchee : la mediane, sans valeur des autres', () => {
  const l = ligne({
    cibles: [NPM], sondes: [sonde(1), sonde(2), sonde(3)],
    mesures: [...heure(1, NPM, 300), ...heure(2, NPM, 320), ...heure(3, NPM, 410)],
    habitudes: [1, 2, 3].map((i) => habitude(i, NPM, 300)),
  });
  assert.deepEqual([l.valeur, l.valeur_autres, l.repere], [320, null, null]);
});

test('une sonde en rodage ne donne pas de valeur, mais ses passages comptent dans la disponibilite', () => {
  const ms = heure(1, NPM, 300).map((m, i) => (i === 0 ? { ...m, code_http: null, erreur: 'delai depasse' } : m));
  const l = ligne({ cibles: [NPM], sondes: [sonde(1, { creee_le: il_y_a(120) })], mesures: ms, habitudes: [] });
  assert.deepEqual([l.valeur, l.sondes_mesurees, l.passages, l.disponibilite], [null, 0, 6, 0.8333]);
});

test('sans aucune mesure : des null, jamais des zeros', () => {
  const l = ligne({ cibles: [NPM], sondes: [sonde(1)], mesures: [], habitudes: [] });
  assert.deepEqual([l.valeur, l.disponibilite, l.passages, l.repere], [null, null, 0, null]);
});

test('le repere de Madrid est a part : il ne compte ni dans la valeur ni dans la disponibilite', () => {
  const l = ligne({ cibles: [NPM], sondes: [MADRID], mesures: heure(9, NPM, 61), habitudes: [habitude(9, NPM, 60)] });
  assert.deepEqual([l.valeur, l.passages, l.disponibilite, l.repere], [null, 0, null, 61]);
});

test('les publications visibles sont comptees par type ; les references n ont pas de ligne', () => {
  const r = resumer({
    cibles: [NPM, OBJ, REF], sondes: [], mesures: [], habitudes: [],
    publications: [{ target_id: '1', type: 'contournement', n: '3' }, { target_id: '1', type: 'demande', n: '1' }, { target_id: '2', type: 'demande', n: '2' }],
  }, MAINTENANT);
  assert.deepEqual(r.services.map((s) => [s.cle, s.unite, s.solutions, s.demandes]), [['npm', 'ms', 3, 1], ['jsdelivr-obj', 'mbps', 0, 2]]);
});
