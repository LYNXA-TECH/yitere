-- YITERE, migration 0002 : sessions de la connexion GitHub. Idempotente, sans effet sur les donnees existantes.
BEGIN;
CREATE TABLE IF NOT EXISTS sessions (
  id_hache     text PRIMARY KEY,
  github_id    bigint NOT NULL,
  github_login text NOT NULL,
  cree_le      timestamptz NOT NULL DEFAULT now(),
  expire_le    timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire ON sessions (expire_le);
COMMIT;
