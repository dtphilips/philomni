-- ============================================================
-- Philomni — AI Tables (Philo AI Chat)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── AI CONVERSATIONS ─────────────────────────────────────────
-- Stores full message history for Philo AI chat sessions.
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  messages   JSONB DEFAULT '[]',
  folder_id  UUID,   -- FK added below after ai_folders exists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

-- ── AI FOLDERS ───────────────────────────────────────────────
-- Lets users organise their Philo AI conversations into named folders.
CREATE TABLE IF NOT EXISTS ai_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_folders DISABLE ROW LEVEL SECURITY;

-- ── LINK ai_conversations.folder_id → ai_folders ─────────────
-- Safe to run multiple times; IF NOT EXISTS guards the column add.
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES ai_folders(id) ON DELETE SET NULL;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
  ON ai_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at
  ON ai_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_folders_user_id
  ON ai_folders(user_id);
