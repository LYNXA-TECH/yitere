-- YITERE, cibles v1. Sept cibles plus deux references.
INSERT INTO targets (cle, nom, famille, url, methode, cadence_minutes, taille_attendue, code_attendu) VALUES
 ('github-api',    'api.github.com',              'Code',      'https://api.github.com/',                                      'entete', 10, NULL,   200),
 ('github-raw',    'raw.githubusercontent.com',   'Code',      'https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/README.md', 'entete', 10, NULL, 200),
 ('npm',           'registry.npmjs.org',          'Registres', 'https://registry.npmjs.org/',                                  'entete', 10, NULL,   200),
 ('pypi',          'pypi.org',                    'Registres', 'https://pypi.org/simple/',                                     'entete', 10, NULL,   200),
 ('docker',        'registry-1.docker.io',        'Registres', 'https://registry-1.docker.io/v2/',                             'entete', 10, NULL,   401),
 ('jsdelivr-obj',  'cdn.jsdelivr.net, objet témoin','Diffusion','https://cdn.jsdelivr.net/gh/LYNXA-TECH/yitere@10cb9d1/temoin.bin','objet', 180, 262144, 200),
 ('jsdelivr-min',  'cdn.jsdelivr.net, petite requête','Diffusion','https://cdn.jsdelivr.net/npm/jquery@3.7.1/package.json',     'entete', 10, NULL,   200),
 ('ref-dns',       'Résolveur DNS public',        'Reference', 'dns://1.1.1.1/example.com',                                     'dns',    10, NULL,   0),
 ('ref-contenu',   'Point de contenu très disponible','Reference','https://connectivity-check.gstatic.com/generate_204',        'entete', 10, NULL,   204)
ON CONFLICT (cle) DO NOTHING;
