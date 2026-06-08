import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * AdCard — a sponsored campaign card for the feed.
 *
 * Records an impression (IntersectionObserver, once) and clicks into
 * ad_impressions, increments the campaign counters, and opens the
 * advertiser's site. Uses the real ad_impressions schema
 * (ad_type / ad_id / viewer_id / clicked).
 */
export default function AdCard({ campaign }) {
  const { user } = useAuth()
  const cardRef = useRef(null)
  const impressionRecorded = useRef(false)

  useEffect(() => {
    if (!cardRef.current) return
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !impressionRecorded.current) {
        impressionRecorded.current = true
        observer.disconnect()
        await supabase.from('ad_impressions').insert({
          ad_type: 'campaign', ad_id: campaign.id, viewer_id: user?.id ?? null, clicked: false,
        }).catch(() => {})
        await supabase.rpc('increment_ad_impressions', { p_campaign_id: campaign.id }).catch(() => {})
        // legacy counter used by MyAds / AdminAds
        await supabase.from('ad_campaigns')
          .update({ impressions_served: (campaign.impressions_served ?? 0) + 1 })
          .eq('id', campaign.id).catch(() => {})
      }
    }, { threshold: 0.5 })
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [campaign.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = async () => {
    await supabase.from('ad_impressions').insert({
      ad_type: 'campaign', ad_id: campaign.id, viewer_id: user?.id ?? null, clicked: true,
    }).catch(() => {})
    await supabase.from('ad_campaigns')
      .update({ clicks: (campaign.clicks ?? 0) + 1, total_clicks: (campaign.total_clicks ?? 0) + 1 })
      .eq('id', campaign.id).catch(() => {})
    const url = campaign.website_url || campaign.cta_url
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const creative = campaign.ad_creatives?.[0]
  const brand    = campaign.brand_name || campaign.title || 'Sponsored'
  const url      = campaign.website_url || campaign.cta_url || ''

  return (
    <div ref={cardRef} onClick={handleClick}
      className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm cursor-pointer hover:border-primary/30 transition-colors mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
            {brand[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{brand}</p>
            <p className="text-[10px] text-muted-foreground">Sponsored</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">Ad</span>
      </div>

      {/* Creative */}
      {creative
        ? creative.file_type === 'video'
          ? <video src={creative.file_url} autoPlay muted loop playsInline className="w-full max-h-[400px] object-cover bg-black" />
          : <img src={creative.file_url} alt={brand} className="w-full max-h-[400px] object-cover" />
        : campaign.image_url
          ? <img src={campaign.image_url} alt={brand} className="w-full max-h-[400px] object-cover" />
          : <div className="h-44 bg-primary/10 flex items-center justify-center text-primary font-semibold">{brand}</div>}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{campaign.name || campaign.title}</p>
          <p className="text-xs text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</p>
        </div>
        <button className="flex-shrink-0 text-xs font-semibold text-primary-foreground bg-primary px-3.5 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          {campaign.cta_text || 'Learn More'} →
        </button>
      </div>
    </div>
  )
}
