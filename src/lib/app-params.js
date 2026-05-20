/**
 * Simple app params — replaces the Base44 SDK version.
 * No Base44 dependencies.
 */

// Use the configured URL only if it isn't still the placeholder value.
// Falls back to window.location.origin so shared links always work, even
// when VITE_APP_URL hasn't been updated after deployment.
const rawAppUrl = import.meta.env.VITE_APP_URL
const appUrl =
  rawAppUrl && !rawAppUrl.includes('your-domain')
    ? rawAppUrl
    : (typeof window !== 'undefined' ? window.location.origin : '')

// WARNING: VITE_DEV_MODE must be 'false' in production.
// Set to 'true' only for local development — see FIX 5 in audit.
// import.meta.env.DEV is Vite's built-in flag: true during `vite dev`, false after `vite build`.
const devMode = import.meta.env.VITE_DEV_MODE === 'true' && import.meta.env.DEV

export const appParams = {
  appUrl,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  devMode,
}
