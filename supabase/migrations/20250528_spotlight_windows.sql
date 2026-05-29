-- ─── Spotlight Windows Table ───────────────────────────────────────────────────
-- Admin schedules nomination windows in advance.
-- System auto-opens/closes based on timestamps and nomination count.

CREATE TABLE IF NOT EXISTS spotlight_windows (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  month            DATE        NOT NULL,                     -- e.g. 2025-06-01 (first of month)
  category         TEXT        NOT NULL,
  opens_at         TIMESTAMPTZ NOT NULL,
  closes_at        TIMESTAMPTZ NOT NULL,
  max_nominations  INTEGER     NOT NULL DEFAULT 20,
  nomination_count INTEGER     NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'upcoming',  -- upcoming | open | closed | winner_selected
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS — public read so nomination page can show window status without auth
ALTER TABLE spotlight_windows DISABLE ROW LEVEL SECURITY;

-- Index for fast lookups by status and month
CREATE INDEX IF NOT EXISTS idx_spotlight_windows_status  ON spotlight_windows(status);
CREATE INDEX IF NOT EXISTS idx_spotlight_windows_month   ON spotlight_windows(month);

-- ─── spotlight_winners additions ───────────────────────────────────────────────
-- Add window_id FK if not already present (nullable — admin-selected winners have no window)
ALTER TABLE spotlight_winners ADD COLUMN IF NOT EXISTS window_id UUID REFERENCES spotlight_windows(id);

-- ─── users table additions ─────────────────────────────────────────────────────
-- Spotlight winner badge fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotlight_winner  BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotlight_month   TEXT;    -- YYYY-MM format
