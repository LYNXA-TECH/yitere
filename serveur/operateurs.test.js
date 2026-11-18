// Tests des noms d'operateurs : node --test serveur/operateurs.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nomOperateur } = require('./operateurs.js');

test('un ASN connu rend le nom de l operateur', () => {
  assert.equal(nomOperateur(8346), 'Orange Sénégal');
  assert.equal(nomOperateur('37461'), 'Orange Guinée');   // pg peut rendre un texte
});

test('un ASN inconnu reste lisible sous la forme AS<numero>', () => {
  assert.equal(nomOperateur(100), 'AS100');
});

test('sans ASN : null, jamais « ASnull » ni une chaine vide', () => {
  assert.equal(nomOperateur(null), null);
  assert.equal(nomOperateur(undefined), null);
});
