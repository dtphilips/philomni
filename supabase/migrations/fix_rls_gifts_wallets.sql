-- Disable RLS on post_gifts (404 if RLS blocks anon/authenticated reads)
ALTER TABLE IF EXISTS public.post_gifts          DISABLE ROW LEVEL SECURITY;

-- Disable RLS on wallets and wallet_transactions if they exist
ALTER TABLE IF EXISTS public.wallets             DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on coin_purchases
ALTER TABLE IF EXISTS public.coin_purchases      DISABLE ROW LEVEL SECURITY;

-- Ensure coin_balance and wallet_balance exist on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coin_balance   INTEGER       DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,4) DEFAULT 0;
