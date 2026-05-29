import { supabase } from '@/lib/supabase'

/**
 * Get the currently authenticated user directly from the Supabase session.
 * Use this inside useEffect to avoid depending on the React auth context,
 * which prevents infinite-spinner bugs when user starts as null.
 */
export const getCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  } catch {
    return null
  }
}
