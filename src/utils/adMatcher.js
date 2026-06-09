import { supabase } from '../lib/supabase'

/**
 * Fetch active in-video campaigns only.
 * Filters client-side by placement_type.
 */
export const getInVideoCampaigns = async () => {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*, ad_creatives(*)')
    .eq('status', 'active')

  if (error) console.error('[adMatcher] error:', error)

  const invideo = (data ?? []).filter(c =>
    c.placement_type === 'in_video' || c.placement_type === 'both'
  )
  console.log('[adMatcher] active in-video campaigns:', invideo.length)
  return invideo
}

/**
 * Pick one campaign for a given video post.
 * Filters out over-budget campaigns, then picks randomly.
 */
export const selectAdForVideo = (campaigns, _post) => {
  if (!campaigns?.length) return null
  const available = campaigns.filter(c => {
    const spent = c.amount_spent ?? 0
    return spent < (c.cpm_budget ?? c.total_budget ?? 999_999)
  })
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)]
}

/**
 * Returns true if the creator has monetization enabled.
 */
export const isCreatorMonetized = (creatorProfile) => {
  return creatorProfile?.monetization_enabled === true ||
         creatorProfile?.is_monetized === true
}
