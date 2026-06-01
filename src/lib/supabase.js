import { createClient } from '@supabase/supabase-js'

// WHY autoRefreshToken: false
// When autoRefreshToken is true, Supabase acquires an internal lock
// (_refreshingDeferred) when it detects a stored session on page load.
// Every PostgREST query waits on this lock until the refresh completes.
// If the Supabase auth service is slow (cold start, network latency) the
// refresh takes > 3-10 seconds and the entire app appears broken — even
// public queries like the feed. Setting false removes the lock entirely:
// queries execute immediately with the current JWT. Token refresh is
// handled manually in AuthContext every ~50 minutes while the tab is open.
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
