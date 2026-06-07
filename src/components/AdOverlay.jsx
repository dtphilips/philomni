import React, { useState, useEffect } from 'react'

/**
 * AdOverlay — in-video ad player (FOUNDATION / NOT YET ACTIVATED).
 *
 * Renders a full-bleed ad creative over a video with a skip countdown.
 * Currently unused — the video players have ad-slot hooks (see Reels.jsx)
 * that are intentionally inert until in-video ads are switched on.
 *
 * Props:
 *   campaign    { creative: { file_url }, website_url, advertiser_name }
 *   onComplete  fn — ad finished playing
 *   onSkip      fn — user skipped after the skip window
 *   skipAfter   number — seconds before skip is allowed (default 5)
 */
export default function AdOverlay({ campaign, onComplete, onSkip, skipAfter = 5 }) {
  const [countdown, setCountdown] = useState(skipAfter)
  const [canSkip,   setCanSkip]   = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!campaign) return null

  return (
    <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
      <video
        src={campaign.creative?.file_url}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onEnded={onComplete}
      />

      {/* Ad UI */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/90 bg-yellow-500/90 px-2 py-0.5 rounded">
          Ad{campaign.advertiser_name ? ` · ${campaign.advertiser_name}` : ''}
        </span>

        {campaign.website_url && (
          <a
            href={campaign.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            Visit Site →
          </a>
        )}

        {canSkip ? (
          <button
            onClick={onSkip}
            className="text-xs font-semibold text-white bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
          >
            Skip Ad →
          </button>
        ) : (
          <span className="text-xs text-white/70">Skip in {countdown}s</span>
        )}
      </div>
    </div>
  )
}
