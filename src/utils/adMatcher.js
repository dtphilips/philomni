import { supabase } from '../lib/supabase'

/**
 * Fetch all eligible in-video ad campaigns.
 * Includes 'under_review' so admins can test before final approval.
 * No date filtering — campaigns without dates (CPM-only) always pass,
 * and we don't want start_date off-by-one issues blocking live testing.
 */
export const getInVideoCampaigns = async () => {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*, ad_creatives(*)')
    .in('status', ['active', 'under_review'])
    .in('placement_type', ['in_video', 'both'])

  if (error) console.error('[adMatcher] getInVideoCampaigns error:', error)
  console.log('[adMatcher] in-video campaigns:', data?.length ?? 0, data?.map(c => `${c.name} (${c.status})`))
  return data ?? []
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
export const isCreatorMonetized = (creatorProfile) => {
  const result = creatorProfile?.monetization_enabled === true || creatorProfile?.is_monetized === true
  console.log('[adMatcher] isCreatorMonetized:', result, {
    monetization_enabled: creatorProfile?.monetization_enabled,
    is_monetized: creatorProfile?.is_monetized,
  })
  return result
}
