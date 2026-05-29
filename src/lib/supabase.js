import { createClient } from '@supabase/supabase-js'

// Single authoritative Supabase client — all files import from here
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
  }
)
