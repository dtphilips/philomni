import { createClient } from '@supabase/supabase-js'

// ⚠️ CONFIRMED-WORKING CONFIG — do not change without runtime testing.
//
// autoRefreshToken: false + no-op lock. This pair is the only combination that
// never hangs queries on tab return. Why each setting:
//
//  • no-op lock (fn => fn()): Supabase's default uses navigator.locks
//    "lock:philomni-auth". A token refresh runs INSIDE that lock; if the refresh
//    network call stalls (or a refresh token is stale), the lock is held and
//    EVERY getSession()/query (each acquires the same lock to read/attach the
//    JWT) hangs behind it forever — pages stuck on skeletons after tab return.
//    The no-op lock never holds a lock, so this deadlock cannot happen. (Also
//    fixes the original cross-tab contention with multiple Philomni tabs open.)
//    Verified hanging with BOTH the default lock and a custom in-tab promise
//    chain; only the no-op lock stays responsive.
//
//  • autoRefreshToken: false: with the no-op lock there is nothing to serialize
//    concurrent refreshes, so auto-refresh on tab return raced the single-use
//    refresh token and hung. With auto-refresh OFF, tab return just re-reads the
//    stored session (no refresh, no hang). Long-idle sessions that outlive the
//    JWT fire SIGNED_OUT — handled gracefully by the deferred-clear logic in
//    AuthContext (a brief blip recovers; only a genuine expiry signs out).
//
// Tried and rejected: autoRefreshToken:true + no-op lock (refresh races → hang),
// autoRefreshToken:true + in-tab chain lock (one stalled op poisons all later
// ops), autoRefreshToken:true + default lock (stalled refresh holds the lock).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      storageKey: 'philomni-auth',
      detectSessionInUrl: true,
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  }
)
