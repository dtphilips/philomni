import { createClient } from '@supabase/supabase-js'

// autoRefreshToken: false — intentional. The session-revert-to-"Free" issue
// was caused by the visibilitychange handler in AuthContext (since removed),
// NOT by token expiry. Keeping auto-refresh off avoids the Navigator Lock that
// can serialize/hang queries on a signed-in page load.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      storageKey: 'philomni-auth',
      detectSessionInUrl: true,
    },
  }
)
