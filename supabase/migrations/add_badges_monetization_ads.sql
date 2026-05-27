-- ── Feature 1: Verified Badge System ─────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_type        TEXT        DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_status      TEXT        DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_submitted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_document_url TEXT;

CREATE TABLE IF NOT EXISTS badge_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  badge_type       TEXT NOT NULL,
  document_url     TEXT,
  status           TEXT DEFAULT 'pending',
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE badge_applications DISABLE ROW LEVEL SECURITY;

-- ── Feature 2: Creator Monetization ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS monetization_enabled BOOLEAN       DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings        DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_payout        DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS creator_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  total_views         INTEGER       DEFAULT 0,
  total_followers     INTEGER       DEFAULT 0,
  engagement_rate     DECIMAL(5,2)  DEFAULT 0,
  consistency_score   INTEGER       DEFAULT 0,
  profile_score       INTEGER       DEFAULT 0,
  monetization_score  DECIMAL(5,2)  DEFAULT 0,
  last_calculated     TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE creator_metrics DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS earnings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  amount           DECIMAL(10,2),
  period_start     DATE,
  period_end       DATE,
  views_count      INTEGER,
  engagement_score DECIMAL(5,2),
  status           TEXT DEFAULT 'pending',
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE earnings DISABLE ROW LEVEL SECURITY;

-- Monetization applications (admin review queue)
CREATE TABLE IF NOT EXISTS monetization_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  status        TEXT DEFAULT 'pending',
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  rejection_reason TEXT
);
ALTER TABLE monetization_applications DISABLE ROW LEVEL SECURITY;

-- ── Feature 3: Advertising System ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id   UUID REFERENCES users(id),
  title           TEXT,
  content         TEXT,
  image_url       TEXT,
  video_url       TEXT,
  cta_text        TEXT,
  cta_url         TEXT,
  budget          DECIMAL(10,2),
  spent           DECIMAL(10,2)   DEFAULT 0,
  cost_per_view   DECIMAL(6,4)    DEFAULT 0.001,
  target_audience JSONB,
  status          TEXT            DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,
  start_date      DATE,
  end_date        DATE,
  total_views     INTEGER         DEFAULT 0,
  total_clicks    INTEGER         DEFAULT 0,
  created_at      TIMESTAMPTZ     DEFAULT NOW()
);
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ad_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID REFERENCES ads(id),
  viewer_id   UUID REFERENCES users(id),
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  clicked     BOOLEAN DEFAULT FALSE
);
ALTER TABLE ad_views DISABLE ROW LEVEL SECURITY;
