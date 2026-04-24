import { createClient } from '@supabase/supabase-js';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

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
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
