// Tests de creer-sonde : node --test serveur/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { creer, valider, empreinte } = require('./creer-sonde.js');

const BASE = ['--pseudonyme', 'lynx-conakry-1', '--pays', 'GN', '--ville', 'Conakry'];

test("l'empreinte est celle que verifie le serveur : sha256 hexadecimal de la cle", () => {
  const attendu = crypto.createHash('sha256').update('abc', 'utf8').digest('hex');
  assert.equal(empreinte('abc'), attendu);
});

test('la commande SQL contient l empreinte, jamais la cle', () => {
  const { cle, sql } = creer(BASE, () => 'cle-de-test-0123456789');
  assert.ok(sql.includes(empreinte(cle)));
  assert.ok(!sql.includes(cle));
});

test('deux creations donnent deux cles differentes, de 32 octets', () => {
  const a = creer(BASE).cle, b = creer(BASE).cle;
  assert.notEqual(a, b);
  assert.equal(Buffer.from(a, 'base64url').length, 32);
});

test('une apostrophe dans la ville est doublee, pas recopiee telle quelle', () => {
  const { sql } = creer(['--pseudonyme', 'kadi-ci', '--pays', 'CI', '--ville', "N'Zérékoré"]);
  assert.ok(sql.includes("'N''Zérékoré'"));
});

test('une tentative d injection est refusee avant toute commande SQL', () => {
  assert.throws(() => valider({ pseudonyme: "x'); DROP TABLE probes;--", pays: 'GN' }), /pseudonyme/);
  assert.throws(() => valider({ pseudonyme: 'ok-sonde', pays: 'GN', ville: "a'); DROP TABLE probes;--" }), /ville/);
  assert.throws(() => valider({ pseudonyme: 'ok-sonde', pays: 'gn' }), /pays/);
  assert.throws(() => valider({ pseudonyme: 'ok-sonde', pays: 'GN', asn: '12; DROP' }), /asn/);
  assert.throws(() => valider({ pseudonyme: 'ok-sonde', pays: 'GN', type: 'admin' }), /type/);
});

test('ville et asn sont facultatifs et deviennent NULL', () => {
  const { sql } = creer(['--pseudonyme', 'lynx-dakar-1', '--pays', 'SN']);
  assert.match(sql, /'SN', NULL, NULL, 'dev'/);
});
