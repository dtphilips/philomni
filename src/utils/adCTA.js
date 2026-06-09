/**
 * adCTA.js — goal-specific call-to-action for ads.
 *
 * Used by AdCard (feed) and AdOverlay (in-video) to show
 * the right CTA text + destination URL based on campaign_goal.
 *
 * For App Downloads we also do device detection so iOS users
 * see the App Store link and Android users see Google Play.
 */

export const getAdCTA = (campaign) => {
  const goal      = campaign?.campaign_goal
  const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)

  switch (goal) {
    case 'App Downloads':
      if (isIOS && campaign.ios_url) {
        return {
          text:          'Download on App Store',
          icon:          '🍎',
          url:           campaign.ios_url,
          secondaryText: campaign.android_url ? 'Also on Android' : null,
          secondaryUrl:  campaign.android_url ?? null,
        }
      }
      if (isAndroid && campaign.android_url) {
        return {
          text:          'Get it on Google Play',
          icon:          '🤖',
          url:           campaign.android_url,
          secondaryText: campaign.ios_url ? 'Also on iOS' : null,
          secondaryUrl:  campaign.ios_url ?? null,
        }
      }
      // Fallback when device unclear or wrong device
      return {
        text:          'Download App',
        icon:          '📱',
        url:           campaign.ios_url ?? campaign.android_url ?? campaign.website_url,
        secondaryText: null,
        secondaryUrl:  null,
      }

    case 'Event Promotion':
      return {
        text:          'Get Tickets →',
        icon:          '🎟️',
        url:           campaign.ticket_url ?? campaign.website_url,
        secondaryText: campaign.website_url ? 'Event Info' : null,
        secondaryUrl:  campaign.website_url ?? null,
      }

    case 'Product Sales':
      return {
        text:          'Shop Now →',
        icon:          '🛍️',
        url:           campaign.website_url,
        secondaryText: null,
        secondaryUrl:  null,
      }

    case 'Drive Website Traffic':
      return {
        text:          'Visit Site →',
        icon:          '🌐',
        url:           campaign.website_url,
        secondaryText: null,
        secondaryUrl:  null,
      }

    case 'Brand Awareness':
    default:
      return {
        text:          'Learn More →',
        icon:          '✨',
        url:           campaign.website_url ?? campaign.cta_url,
        secondaryText: null,
        secondaryUrl:  null,
      }
  }
}

/**
 * Mark an impression as clicked.
 * Safe to call even if impressionId is null (e.g. feed card before impression fires).
 */
export const recordAdClick = async (supabase, impressionId) => {
  if (!impressionId) return
  await supabase
    .from('ad_impressions')
    .update({ clicked: true })
    .eq('id', impressionId)
    .catch(console.error)
}
