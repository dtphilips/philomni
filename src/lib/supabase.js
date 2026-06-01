import { createClient } from '@supabase/supabase-js'

// 8-second timeout on every fetch — prevents JWT token refresh from blocking
// all queries indefinitely when the Supabase auth service is slow to respond.
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 8000)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id))
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'philomni-auth',
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  }
)
