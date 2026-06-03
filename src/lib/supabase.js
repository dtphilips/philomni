import { createClient } from '@supabase/supabase-js'

// ─── In-tab serialized auth lock ──────────────────────────────────────────────
// Supabase serializes auth operations (getSession, token refresh) behind a lock.
// We've now used three lock strategies — here's why this one is correct:
//
//  • DEFAULT (navigator.locks): the lock name "lock:philomni-auth" is shared
//    across ALL same-origin tabs. With multiple Philomni tabs open the lock is
//    contended and getSession() can deadlock, hanging every query. (Original bug.)
//
//  • NO-OP (fn => fn()): fixed the multi-tab deadlock, BUT performs no
//    serialization. Safe only while autoRefreshToken was false. Once auto-refresh
//    is on, the visibilitychange recover + auto-refresh fire concurrent
//    _callRefreshToken calls; the single-use refresh token is consumed by the
//    first, the rest hang/400, and every PostgREST query (which calls getSession
//    to attach the JWT) hangs forever. THIS is why pages stuck on skeletons after
//    leaving and returning to the tab while signed in.
//
//  • IN-TAB CHAIN (below): serializes auth ops within THIS tab via a plain
//    promise chain — so refreshes never race — while using NO navigator.locks,
//    so it cannot deadlock across tabs. Best of both. Each queued op runs only
//    after the previous one settles (resolve OR reject), and the chain always
//    advances, so it never stalls.
let _authLockChain = Promise.resolve()
function inTabLock(_name, _acquireTimeout, fn) {
  const run = _authLockChain.then(fn, fn) // run fn once the previous op settles
  _authLockChain = run.then(() => {}, () => {}) // keep chain alive past failures
  return run
}

// autoRefreshToken: true — keeps the JWT fresh so long-idle sessions don't hit
// expiry and fire SIGNED_OUT on tab return. Requires a real serializing lock
// (the in-tab chain above) so concurrent refreshes don't race. Do NOT pair
// auto-refresh with the no-op lock again.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'philomni-auth',
      detectSessionInUrl: true,
      lock: inTabLock,
    },
  }
)
