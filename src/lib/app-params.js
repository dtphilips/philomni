/**
 * Simple app params — replaces the Base44 SDK version.
 * No Base44 dependencies.
 */
export const appParams = {
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  devMode: import.meta.env.VITE_DEV_MODE === 'true',
};
