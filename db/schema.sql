-- YITERE, schema v1. Aucune adresse IP n'est stockee, nulle part.
CREATE TABLE IF NOT EXISTS probes (
  id            bigserial PRIMARY KEY,
  pseudonyme    text NOT NULL UNIQUE,
  pays          text NOT NULL,
  ville         text,
  asn           integer,
  type          text NOT NULL CHECK (type IN ('dev','datacenter','navigateur')),
  jeton_hache   text UNIQUE,
  github_login  text,
  active        boolean NOT NULL DEFAULT true,
  creee_le      timestamptz NOT NULL DEFAULT now(),
  vue_le        timestamptz
);
CREATE TABLE IF NOT EXISTS targets (
  id              bigserial PRIMARY KEY,
  cle             text NOT NULL UNIQUE,
  nom             text NOT NULL,
  famille         text NOT NULL,
  url             text NOT NULL,
  methode         text NOT NULL DEFAULT 'GET',
  cadence_minutes integer NOT NULL,
  taille_attendue bigint,
  code_attendu    integer NOT NULL DEFAULT 200,
  active          boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS measurements (
  id         bigserial PRIMARY KEY,
  probe_id   bigint NOT NULL REFERENCES probes(id) ON DELETE CASCADE,
  target_id  bigint NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  mesure_le  timestamptz NOT NULL DEFAULT now(),
  dns_ms     integer, tcp_ms integer, tls_ms integer, ttfb_ms integer,
  octets     bigint, duree_ms integer, debit_bps bigint,
  code_http  integer, erreur text
);
CREATE INDEX IF NOT EXISTS measurements_cible_temps ON measurements (target_id, mesure_le DESC);
CREATE INDEX IF NOT EXISTS measurements_sonde_temps ON measurements (probe_id, mesure_le DESC);
CREATE TABLE IF NOT EXISTS posts (
  id           bigserial PRIMARY KEY,
  target_id    bigint REFERENCES targets(id) ON DELETE CASCADE,
  github_login text NOT NULL,
  type         text NOT NULL CHECK (type IN ('contournement','demande')),
  contenu      text NOT NULL,
  commande     text,
  pays         text,
  votes        integer NOT NULL DEFAULT 0,
  signale      boolean NOT NULL DEFAULT false,
  masque       boolean NOT NULL DEFAULT false,
  cree_le      timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS post_votes (
  post_id      bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  github_login text NOT NULL,
  PRIMARY KEY (post_id, github_login)
);
