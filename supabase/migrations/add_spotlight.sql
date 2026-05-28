-- Philomni Spotlight System

-- Spotlight winners (one active per month)
CREATE TABLE IF NOT EXISTS spotlight_winners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month            TEXT NOT NULL,          -- 'YYYY-MM' format e.g. '2026-05'
  category         TEXT NOT NULL,          -- e.g. 'Rising Artist'
  tagline          TEXT,                   -- short one-liner
  story            TEXT,                   -- long-form story (admin-written)
  banner_image_url TEXT,                   -- hero image for spotlight page
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month)
);

-- Spotlight nominations
CREATE TABLE IF NOT EXISTS spotlight_nominations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominated_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nominator_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category           TEXT NOT NULL,
  reason             TEXT NOT NULL,
  month              TEXT NOT NULL,        -- 'YYYY-MM' — auto-set to current month
  vote_count         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nominated_user_id, nominator_id, month)  -- one nomination per nominator per month
);

-- Spotlight votes (one vote per user per month)
CREATE TABLE IF NOT EXISTS spotlight_votes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id  UUID NOT NULL REFERENCES spotlight_nominations(id) ON DELETE CASCADE,
  voter_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month          TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(voter_id, month)   -- one vote per user per month
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spotlight_winners_month    ON spotlight_winners(month);
CREATE INDEX IF NOT EXISTS idx_spotlight_winners_active   ON spotlight_winners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_spotlight_nominations_month ON spotlight_nominations(month);
CREATE INDEX IF NOT EXISTS idx_spotlight_votes_nom        ON spotlight_votes(nomination_id);
