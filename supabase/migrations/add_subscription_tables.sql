-- ============================================================
-- Philomni — Subscription & Usage Tables
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── EXTEND USERS TABLE ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan                  TEXT         DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at       TIMESTAMPTZ;

-- ── AI USAGE TABLE ─────────────────────────────────────────────
-- One row per user; daily/monthly counters reset by the app layer.
-- last_reset tracks when daily counters were last zeroed.
-- Month portion of last_reset is used to detect monthly resets.
CREATE TABLE IF NOT EXISTS ai_usage (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  ai_message_count      INTEGER DEFAULT 0,
  image_gen_count       INTEGER DEFAULT 0,
  job_application_count INTEGER DEFAULT 0,
  pitch_upload_count    INTEGER DEFAULT 0,
  last_reset            DATE    DEFAULT CURRENT_DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- One row per user — allow ON CONFLICT upsert
ALTER TABLE ai_usage ADD CONSTRAINT IF NOT EXISTS ai_usage_user_id_unique UNIQUE (user_id);

ALTER TABLE ai_usage DISABLE ROW LEVEL SECURITY;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_users_plan        ON users(plan);
