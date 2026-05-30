-- ─── Celebrations Feature ────────────────────────────────────────────────────

-- Main celebrations table
CREATE TABLE IF NOT EXISTS public.celebrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  creator_name    TEXT,
  creator_avatar  TEXT,
  honoree_name    TEXT NOT NULL,
  honoree_photo_url TEXT,
  celebration_type TEXT NOT NULL DEFAULT 'other',
  relationship    TEXT,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  media_url       TEXT,
  tier            TEXT NOT NULL DEFAULT 'basic',   -- basic | featured | grand | sponsored
  tier_price      NUMERIC DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'free',    -- free | pending | paid
  shareable_code  TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'active',  -- active | expired | removed
  is_pinned       BOOLEAN DEFAULT FALSE,
  view_count      INTEGER DEFAULT 0,
  wish_count      INTEGER DEFAULT 0,
  reaction_count  INTEGER DEFAULT 0,
  -- Sponsor fields (for category sponsors applied to this celebration)
  active_sponsor_id   UUID,
  sponsor_brand_name  TEXT,
  sponsor_logo_url    TEXT,
  sponsor_message     TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions (one per user per celebration, changeable)
CREATE TABLE IF NOT EXISTS public.celebration_reactions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  celebration_id    UUID REFERENCES public.celebrations(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reaction          TEXT NOT NULL,  -- love | celebrate | emotional | fire | clap | blessings
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(celebration_id, user_id)
);

-- Wishes (messages sent to a celebration)
CREATE TABLE IF NOT EXISTS public.celebration_wishes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  celebration_id    UUID REFERENCES public.celebrations(id) ON DELETE CASCADE,
  sender_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name       TEXT,
  sender_avatar     TEXT,
  message           TEXT NOT NULL,
  is_anonymous      BOOLEAN DEFAULT FALSE,
  likes             INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Brand sponsorship inquiries + active sponsors
CREATE TABLE IF NOT EXISTS public.celebration_sponsors (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name      TEXT NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  logo_url        TEXT,
  categories      TEXT[],        -- array of celebration_type strings
  sponsor_message TEXT,
  package         TEXT,          -- category | multi | platinum
  monthly_budget  NUMERIC,
  campaign_goals  TEXT,
  status          TEXT DEFAULT 'inquiry',  -- inquiry | active | expired
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for now (enable + add policies before production)
ALTER TABLE public.celebrations            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_reactions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_wishes      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_sponsors    DISABLE ROW LEVEL SECURITY;
