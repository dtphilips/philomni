-- Music tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Philomni Originals',
  album TEXT,
  genre TEXT,
  mood TEXT,
  duration_seconds INTEGER,
  audio_url TEXT NOT NULL,
  cover_art_url TEXT,
  bpm INTEGER,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  is_philomni_original BOOLEAN DEFAULT TRUE,
  license_type TEXT DEFAULT 'philomni_exclusive',
  isrc_code TEXT,
  copyright_year INTEGER DEFAULT 2026,
  label TEXT DEFAULT 'Philomni Technologies Inc.',
  socan_registered BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE music_tracks DISABLE ROW LEVEL SECURITY;

-- Music plays (analytics)
CREATE TABLE IF NOT EXISTS music_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES music_tracks(id),
  user_id UUID REFERENCES users(id),
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_played INTEGER,
  context TEXT
);
ALTER TABLE music_plays DISABLE ROW LEVEL SECURITY;

-- Music usage in posts/reels
CREATE TABLE IF NOT EXISTS music_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES music_tracks(id),
  user_id UUID REFERENCES users(id),
  post_id UUID,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  platform TEXT DEFAULT 'philomni'
);
ALTER TABLE music_usage DISABLE ROW LEVEL SECURITY;

-- Add music metadata columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_track_id UUID;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_track_meta JSONB;
