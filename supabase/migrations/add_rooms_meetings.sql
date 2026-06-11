-- ── Rooms: add missing columns ───────────────────────────────────────────────
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS host_name       TEXT,
  ADD COLUMN IF NOT EXISTS room_type       TEXT DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS mode            TEXT DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS viewer_count    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rsvp_count      INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recording_url   TEXT;

-- Update status default to match UI expectations
ALTER TABLE rooms ALTER COLUMN status SET DEFAULT 'upcoming';

-- ── Room RSVPs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ── Meetings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  meeting_type      TEXT DEFAULT 'video',
  host_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  meeting_code      TEXT UNIQUE,
  password          TEXT,
  daily_room_url    TEXT,
  daily_room_name   TEXT,
  scheduled_at      TIMESTAMPTZ,
  duration_minutes  INT DEFAULT 60,
  timezone          TEXT DEFAULT 'UTC',
  recurrence        TEXT DEFAULT 'once',
  status            TEXT DEFAULT 'scheduled',
  allow_recording   BOOLEAN DEFAULT true,
  recording_url     TEXT,
  waiting_room      BOOLEAN DEFAULT true,
  mute_on_entry     BOOLEAN DEFAULT false,
  allow_chat        BOOLEAN DEFAULT true,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Meeting Spaces (collaboration workspaces) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  emoji       TEXT DEFAULT '🎙',
  privacy     TEXT DEFAULT 'private',
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Meeting Files ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID,
  file_name   TEXT,
  file_url    TEXT,
  file_size   BIGINT,
  file_type   TEXT,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Meeting Messages (in-meeting chat) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Space Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS space_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id   UUID REFERENCES meeting_spaces(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name  TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS policies ──────────────────────────────────────────────────────────────
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Meetings viewable by all" ON meetings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users manage own meetings" ON meetings FOR ALL USING (auth.uid() = host_id);

ALTER TABLE meeting_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Spaces viewable by all" ON meeting_spaces FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users manage own spaces" ON meeting_spaces FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Meeting files viewable by all" ON meeting_files FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users insert meeting files" ON meeting_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE meeting_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Meeting messages viewable by all" ON meeting_messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users insert meeting messages" ON meeting_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE room_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Room RSVPs viewable by all" ON room_rsvps FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users manage own RSVPs" ON room_rsvps FOR ALL USING (auth.uid() = user_id);

ALTER TABLE space_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Space messages viewable by all" ON space_messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users insert space messages" ON space_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
