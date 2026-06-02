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
      // No-op lock — THE fix for the signed-in-refresh hang. Supabase normally
      // acquires a navigator.locks lock ("lock:philomni-auth") in getSession()
      // to read a STORED session. navigator.locks are shared across all tabs of
      // the same origin, so with multiple tabs open the lock gets contended and
      // getSession() deadlocks — hanging EVERY Supabase call (getSession, profile,
      // feed). Symptom: signed-out loads work, but a signed-in refresh shows only
      // [Auth Boot]+SIGNED_IN, feed stuck on skeletons, sidebar reverts to "Free".
      // Replacing the lock with a pass-through removes the cross-tab deadlock.
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  }
)
