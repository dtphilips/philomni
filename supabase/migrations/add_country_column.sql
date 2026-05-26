-- ============================================================
-- Philomni — Add country column to users table
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
