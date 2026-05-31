-- ── Post Gifts (Facebook Stars equivalent) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_gifts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES public.users(id),
  creator_id       UUID REFERENCES public.users(id),
  gift_id          TEXT,
  gift_name        TEXT,
  gift_emoji       TEXT,
  coin_cost        INTEGER DEFAULT 0,
  usd_value        DECIMAL(10,4) DEFAULT 0,
  creator_earnings DECIMAL(10,4) DEFAULT 0,
  message          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.post_gifts DISABLE ROW LEVEL SECURITY;

-- ── Coin purchases (waitlist tracking) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id),
  coins      INTEGER,
  price_usd  DECIMAL(10,2),
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.coin_purchases DISABLE ROW LEVEL SECURITY;

-- ── User wallet columns ───────────────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coin_balance   INTEGER     DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,4) DEFAULT 0;

-- ── Feed type column & reel tagging ──────────────────────────────────────────
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS feed_type TEXT DEFAULT 'post';
UPDATE public.posts
SET    feed_type = 'reel'
WHERE  media_type = 'video'
AND    (feed_type IS NULL OR feed_type NOT IN ('reel'));
