import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAdCTA } from '../utils/adCTA'

/**
 * AdOverlay — full in-video ad player.
 *
 * Props:
 *   campaign    — ad_campaigns row (with ad_creatives[] joined)
 *   slot        — 'pre_roll' | 'mid_roll' | 'end_roll'
 *   postId      — UUID of the host reel
 *   creatorId   — UUID of the reel's author (earns 55% CPM)
 *   onComplete  — called when ad finishes playing naturally
 *   onSkip      — called when user skips (also calls onComplete)
 */
const AdOverlay = ({ campaign, slot, postId, creatorId, onComplete, onSkip }) => {
  const { user } = useAuth()
  const [countdown, setCountdown]     = useState(5)
  const [canSkip, setCanSkip]         = useState(false)
  const [watchSeconds, setWatchSeconds] = useState(0)
  const [impressionId, setImpressionId] = useState(null)
  const watchTimerRef   = useRef(null)
  const countdownRef    = useRef(null)

  const creative   = campaign?.ad_creatives?.[0]
  const adDuration = creative?.duration_seconds ?? 30
  const cpmBid     = campaign?.cpm_bid ?? 5.00

  // Record impression + start timers on mount
  useEffect(() => {
    const recordImpression = async () => {
      const { data } = await supabase
        .from('ad_impressions')
        .insert({
          campaign_id:  campaign.id,
          ad_type:      'in_video',
          ad_id:        campaign.id,
          viewer_id:    user?.id ?? null,
          post_id:      postId,
          placement:    slot,
          ad_slot:      slot,
          skipped:      false,
          earned:       false,
          watch_seconds: 0,
          clicked:      false,
        })
        .select()
        .single()
      if (data) setImpressionId(data.id)
    }

    recordImpression()

    // Watch-time counter
    watchTimerRef.current = setInterval(() => {
      setWatchSeconds(prev => prev + 1)
    }, 1000)

    // Skip countdown (5 s)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true)
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(watchTimerRef.current)
      clearInterval(countdownRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recordEarning = async (watched) => {
    if (!impressionId || !creatorId) return
    await supabase
      .rpc('record_invideo_ad_earning', {
        p_campaign_id:   campaign.id,
        p_creator_id:    creatorId,
        p_post_id:       postId,
        p_impression_id: impressionId,
        p_watch_seconds: watched,
        p_ad_duration:   adDuration,
        p_cpm_bid:       cpmBid,
      })
      .catch(console.error)
  }

  const handleSkip = async () => {
    clearInterval(watchTimerRef.current)
    clearInterval(countdownRef.current)
    await recordEarning(watchSeconds)
    if (impressionId) {
      await supabase
        .from('ad_impressions')
        .update({ skipped: true, watch_seconds: watchSeconds })
        .eq('id', impressionId)
        .catch(console.error)
    }
    onSkip?.()
    onComplete?.()
  }

  const handleAdEnded = async () => {
    clearInterval(watchTimerRef.current)
    clearInterval(countdownRef.current)
    await recordEarning(adDuration)
    onComplete?.()
  }

  const handleVisitClick = () => {
    if (!impressionId) return
    supabase
      .from('ad_impressions')
      .update({ clicked: true })
      .eq('id', impressionId)
      .catch(console.error)
  }

  if (!campaign) return null

  const cta = getAdCTA(campaign)

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#000', zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Creative */}
      {(() => {
        const isVideoUrl = (url) => /\.(mp4|mov|avi|webm)(\?|$)/i.test(url ?? '')
        const isVideo = creative?.file_type === 'video' || (!creative?.file_type && isVideoUrl(creative?.file_url))
        if (isVideo && creative?.file_url) return (
          <video
            src={creative.file_url}
            poster={creative.thumbnail_url ?? undefined}
            autoPlay
            playsInline
            onEnded={handleAdEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )
        if (creative?.file_url) return (
          <img
            src={creative.file_url}
            alt="Ad"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )
        return (
        <div style={{
          flex: 1,
          background: 'rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 24, fontWeight: 700,
        }}>
          {campaign?.brand_name}
        </div>
        )
      })()}

      {/* Top bar — Ad label + brand */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12,
        display: 'flex', gap: 8,
      }}>
        <span style={{
          background: 'rgba(0,0,0,0.7)', color: '#FFD700',
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
        }}>
          Ad
        </span>
        {campaign?.brand_name && (
          <span style={{
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            fontSize: 12, padding: '3px 10px', borderRadius: 4,
          }}>
            {campaign.brand_name}
          </span>
        )}
      </div>

      {/* Bottom bar — Visit Site + Skip */}
      <div style={{
        position: 'absolute', bottom: 20, left: 12, right: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {cta.url ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <a
              href={cta.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleVisitClick}
              style={{
                background: '#fff', color: '#000',
                padding: '8px 16px', borderRadius: 6,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {cta.icon} {cta.text}
            </a>
            {cta.secondaryText && cta.secondaryUrl && (
              <a
                href={cta.secondaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 11, textDecoration: 'underline',
                }}
              >
                {cta.secondaryText}
              </a>
            )}
          </div>
        ) : <div />}

        {canSkip ? (
          <button
            onClick={handleSkip}
            style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff', padding: '8px 16px',
              borderRadius: 6, fontSize: 13, cursor: 'pointer',
            }}
          >
            Skip Ad ›
          </button>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'rgba(255,255,255,0.7)',
            padding: '8px 16px', borderRadius: 6, fontSize: 13,
          }}>
            Skip in {countdown}s
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, background: 'rgba(255,255,255,0.2)',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (watchSeconds / adDuration) * 100)}%`,
          background: '#FFD700',
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  )
}

export default AdOverlay
