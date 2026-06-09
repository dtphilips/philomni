import { supabase } from '../lib/supabase'

/**
 * Fetch all eligible in-video ad campaigns.
 * Includes 'under_review' so admins can test before approving.
 * Date filters are skipped for campaigns that have no start/end date set
 * (CPM-only in_video campaigns don't require dates).
 */
export const getInVideoCampaigns = async () => {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*, ad_creatives(*)')
    .in('status', ['active', 'under_review'])
    .in('placement_type', ['in_video', 'both'])

  if (error) console.error('[adMatcher] getInVideoCampaigns error:', error)

  // Client-side date filter: pass campaigns with no dates, or whose dates cover today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const filtered = (data ?? []).filter(c => {
    if (!c.start_date && !c.end_date) return true   // CPM-only, no schedule
    const start = c.start_date ? new Date(c.start_date) : null
    const end   = c.end_date   ? new Date(c.end_date)   : null
    if (start && start > today) return false
    if (end   && end   < today) return false
    return true
  })

  console.log('[adMatcher] in-video campaigns available:', filtered.length, filtered.map(c => c.name))
  return filtered
}

/**
 * Pick one campaign to show for a given video post.
 * Filters out over-budget campaigns, then picks randomly.
 * Returns null if no eligible campaign.
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
 * Checks both columns since both exist in the DB.
 */
export const isCreatorMonetized = (creatorProfile) =>
  creatorProfile?.monetization_enabled === true || creatorProfile?.is_monetized === true
