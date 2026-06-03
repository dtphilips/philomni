import { createClient } from '@supabase/supabase-js'

// autoRefreshToken: true — safe now that the no-op lock eliminates the
// Navigator Lock deadlock. Previously false to avoid that deadlock, but the
// lock fix is the real solution. Keeping true ensures the JWT is refreshed
// before expiry so long-idle sessions don't trigger SIGNED_OUT on tab return.
//
// No-op lock — KEEP THIS. Supabase acquires a navigator.locks lock in
// getSession() to read the stored session. With multiple tabs the lock gets
// contended and getSession() deadlocks, hanging every Supabase call.
// The pass-through lock removes the cross-tab deadlock entirely.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'philomni-auth',
      detectSessionInUrl: true,
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  }
)
