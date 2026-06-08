import { supabase } from '../lib/supabase'

/**
 * Fetch all active in-video ad campaigns that are live today.
 * Returns [] if none found.
 */
export const getInVideoCampaigns = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('ad_campaigns')
    .select('*, ad_creatives(*)')
    .eq('status', 'active')
    .in('placement_type', ['in_video', 'both'])
    .lte('start_date', today)
    .gte('end_date', today)
  return data ?? []
}

/**
 * Pick one campaign to show for a given video post.
 * Filters out over-budget campaigns, then picks randomly.
 * Returns null if no eligible campaign.
 */
export const selectAdForVideo = (campaigns, _post) => {
  if (!campaigns.length) return null
  const available = campaigns.filter(c => {
    const spent = c.amount_spent ?? 0
    return spent < (c.total_budget ?? 999999)
  })
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)]
}

/**
 * Returns true if the creator has monetization enabled.
 */
export const isCreatorMonetized = (creatorProfile) =>
  creatorProfile?.monetization_enabled === true || creatorProfile?.is_monetized === true
