import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

// Single authoritative Supabase client — all files import from here.
// This log should appear ONCE in the browser console. If you see it more
// than once, there is still a second createClient() call somewhere.
console.log('Supabase client created - this should only appear ONCE')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'philomni-auth',
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
})
