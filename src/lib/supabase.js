import { createClient } from '@supabase/supabase-js'

// autoRefreshToken: true — Supabase refreshes the access token automatically
// and reliably (replaces the previous manual setTimeout refresh in AuthContext).
//
// NOTE: an earlier query-lock hang was attributed to a global.fetch override
// (an AbortController timeout) that has since been removed — so auto-refresh is
// safe again. If signed-in queries ever hang on load again, the mitigation is to
// add a no-op lock so the Navigator Lock can't serialize queries:
//   lock: (_name, _acquireTimeout, fn) => fn()
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'philomni-auth',
      detectSessionInUrl: true,
    },
  }
)
