-- ── LIVES ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  host_name TEXT,
  host_avatar TEXT,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'live',         -- 'live' | 'ended'
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_gifts_coins INTEGER DEFAULT 0,
  total_earnings_usd DECIMAL(10,4) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lives DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_lives_status ON lives(status, viewer_count DESC);
CREATE INDEX IF NOT EXISTS idx_lives_host ON lives(host_id);

-- ── LIVE_MESSAGES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE live_messages DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_live_messages_live ON live_messages(live_id, created_at DESC);

-- ── LIVE_GIFTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  gift_id UUID,
  gift_name TEXT,
  gift_emoji TEXT,
  coin_cost INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_coins INTEGER NOT NULL,
  usd_value DECIMAL(10,4) DEFAULT 0,
  host_earnings DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE live_gifts DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_live_gifts_live ON live_gifts(live_id, created_at DESC);

-- ── COIN_PURCHASES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coin_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',      -- 'pending' | 'completed' | 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE coin_purchases DISABLE ROW LEVEL SECURITY;

-- ── coin_balance column on users (add if missing) ──────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS coin_balance INTEGER DEFAULT 0;
