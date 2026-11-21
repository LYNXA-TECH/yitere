-- YITERE, migration 0002 : sessions de la connexion GitHub et demandes de sonde.
-- Idempotente : ne cree que deux tables neuves, ne touche a aucune donnee existante.
BEGIN;
CREATE TABLE IF NOT EXISTS sessions (
  id_hache     text PRIMARY KEY,
  github_id    bigint NOT NULL,
  github_login text NOT NULL,
  cree_le      timestamptz NOT NULL DEFAULT now(),
  expire_le    timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire ON sessions (expire_le);
-- Demandes de sonde des comptes GitHub. Aucune adresse e-mail.
CREATE TABLE IF NOT EXISTS demandes_sonde (
  id           bigserial PRIMARY KEY,
  github_id    bigint NOT NULL,
  github_login text NOT NULL,
  pays         text NOT NULL,
  ville        text NOT NULL,
  operateur    text NOT NULL,
  statut       text NOT NULL DEFAULT 'en-attente' CHECK (statut IN ('en-attente','acceptee','refusee')),
  probe_id     bigint REFERENCES probes(id) ON DELETE SET NULL,
  cree_le      timestamptz NOT NULL DEFAULT now(),
  traitee_le   timestamptz
);
CREATE INDEX IF NOT EXISTS demandes_sonde_attente ON demandes_sonde (statut, cree_le);
COMMIT;
