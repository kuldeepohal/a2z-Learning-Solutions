BEGIN;

ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

DO $$ BEGIN
  ALTER TABLE students ADD CONSTRAINT students_role_check CHECK (role IN ('student','admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS recent_updates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic','competitive-exams','neet','jee','olympiad','homi-bhabha','scholarship','results','deadline','board')),
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at IS NULL OR expires_at > published_at)
);

CREATE INDEX IF NOT EXISTS idx_recent_updates_feed ON recent_updates(published, published_at DESC, expires_at);
CREATE INDEX IF NOT EXISTS idx_recent_updates_category ON recent_updates(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_updates_expiry ON recent_updates(expires_at);

COMMIT;
