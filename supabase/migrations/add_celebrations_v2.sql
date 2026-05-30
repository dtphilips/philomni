-- ─── Celebrations v2: add honoree linking + safer column names ─────────────────

-- Add honoree user link
ALTER TABLE public.celebrations
  ADD COLUMN IF NOT EXISTS honoree_user_id UUID REFERENCES public.users(id);

-- Add optional honoree email for notification
ALTER TABLE public.celebrations
  ADD COLUMN IF NOT EXISTS honoree_email TEXT;

-- Rename ambiguous columns (add safe aliases if originals don't exist)
ALTER TABLE public.celebrations
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

ALTER TABLE public.celebrations
  ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE;

-- Fill amount_paid from tier_price if exists
-- (safe no-op if tier_price column doesn't exist — handled by app)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrations' AND column_name = 'tier_price'
  ) THEN
    UPDATE public.celebrations SET amount_paid = tier_price WHERE amount_paid = 0;
  END IF;
END $$;
