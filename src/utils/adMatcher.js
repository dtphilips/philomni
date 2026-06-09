import { supabase } from '../lib/supabase'

/**
 * Fetch in-video campaigns — no status/date filters for testing.
 * Filters only by placement_type client-side.
 */
export const getInVideoCampaigns = async () => {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*, ad_creatives(*)')

  if (error) console.error('[adMatcher] error:', error)

  console.log('[adMatcher] ALL campaigns from DB:', data?.length,
    data?.map(c => ({ name: c.name, status: c.status, placement: c.placement_type, creatives: c.ad_creatives?.length })))

  const invideo = (data ?? []).filter(c =>
    c.placement_type === 'in_video' || c.placement_type === 'both'
  )
  console.log('[adMatcher] in-video campaigns:', invideo.length)
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
  const result = creatorProfile?.monetization_enabled === true || creatorProfile?.is_monetized === true
  console.log('[adMatcher] isCreatorMonetized:', result, {
    monetization_enabled: creatorProfile?.monetization_enabled,
    is_monetized: creatorProfile?.is_monetized,
  })
  return result
}
