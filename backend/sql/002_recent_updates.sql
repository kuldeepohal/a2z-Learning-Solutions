CREATE TABLE IF NOT EXISTS recent_updates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic','competitive-exams','neet','jee','olympiad','homi-bhabha','scholarship','results','deadline','board')),
  source_name TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recent_updates_feed ON recent_updates(published, published_at DESC, expires_at);
CREATE INDEX IF NOT EXISTS idx_recent_updates_category ON recent_updates(category, published_at DESC);
