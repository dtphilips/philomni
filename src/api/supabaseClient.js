import { createClient } from '@supabase/supabase-js';

// WARNING: VITE_DEV_MODE must be 'false' in production.
// Set to 'true' only for local development.
// import.meta.env.DEV is Vite's built-in flag: true during `vite dev`, false after `vite build`.
// This double-gate ensures DEV_MODE is NEVER active on Vercel even if the env var is accidentally set.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true' && import.meta.env.DEV;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // In dev mode there is no real Supabase project, so disable session
    // persistence and token auto-refresh to prevent network calls that
    // generate large cookie headers (causing HTTP 431 on the Vite server).
    autoRefreshToken: !DEV_MODE,
    persistSession: !DEV_MODE,
    detectSessionInUrl: !DEV_MODE,
    // Single storage key prevents multiple GoTrueClient instances conflicting
    storageKey: 'philomni-auth',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
