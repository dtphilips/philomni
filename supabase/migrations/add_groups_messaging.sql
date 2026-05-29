-- Philomni Groups & Channels System

-- ── GROUPS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  created_by UUID REFERENCES users(id),
  group_type TEXT DEFAULT 'group',   -- 'group' | 'channel'
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  invite_code TEXT UNIQUE,
  only_admin_can_post BOOLEAN DEFAULT FALSE,
  allow_reactions BOOLEAN DEFAULT TRUE,
  allow_files BOOLEAN DEFAULT TRUE,
  allow_voice BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- ── GROUP_MEMBERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',   -- 'owner' | 'admin' | 'member'
  can_post BOOLEAN DEFAULT TRUE,
  can_invite BOOLEAN DEFAULT FALSE,
  muted BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- ── GROUP_MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT,
  message_type TEXT DEFAULT 'text',   -- text|image|video|audio|voice|file|gif
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  reply_to UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  reply_preview TEXT,
  reply_sender TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE group_messages DISABLE ROW LEVEL SECURITY;

-- ── GROUP_REACTIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
ALTER TABLE group_reactions DISABLE ROW LEVEL SECURITY;

-- ── GROUP_INVITES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_user UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted' | 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE group_invites DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_reactions_message ON group_reactions(message_id);
