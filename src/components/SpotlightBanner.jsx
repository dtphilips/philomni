import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatMonth(yyyyMM) {
  if (!yyyyMM) return ''
  const [y, m] = yyyyMM.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
}

export default function SpotlightBanner() {
  const [winner, setWinner]       = useState(null)
  const [profile, setProfile]     = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    // Fetch the currently-active winner. NOTE: `month` is a Postgres `date`
    // column, so filtering it with a "YYYY-MM" string (e.g. "2026-06") throws
    // 400 "invalid input syntax for type date". Filter by is_active instead.
    supabase
      .from('spotlight_winners')
      .select('*')
      .eq('is_active', true)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data: w }) => {
        if (!w) { setLoaded(true); return }
        setWinner(w)
        const { data: p } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, headline')
          .eq('id', w.user_id)
          .maybeSingle()
        setProfile(p)
        setLoaded(true)
      })
  }, [])

  if (!loaded || !winner || !profile || dismissed) return null

  const displayName  = profile.full_name || profile.username || 'Creator'
  const firstName    = displayName.split(' ')[0]
  const monthLabel   = formatMonth(winner.month)
  const storyExcerpt = winner.story
    ? winner.story.slice(0, 100) + (winner.story.length > 100 ? '…' : '')
    : winner.tagline || profile.headline || null

  return (
    <>
      <style>{`
        @keyframes gold-shimmer {
          0%   { transform: translateX(-200%) rotate(12deg); }
          100% { transform: translateX(800%) rotate(12deg); }
        }
        @keyframes gold-glow {
          0%, 100% { box-shadow: 0 0 0 2px #f59e0b80, 0 0 18px #f59e0b50; }
          50%       { box-shadow: 0 0 0 2px #14b8a680, 0 0 24px #14b8a660; }
        }
      `}</style>

      <div
        className="relative mb-4 rounded-2xl overflow-hidden shadow-xl cursor-pointer"
        style={{ animation: 'gold-glow 2.5s ease-in-out infinite' }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-500 to-teal-500 opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-700/40 via-transparent to-teal-700/30" />

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative z-10 flex items-center gap-4 p-4 sm:p-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {(winner.banner_image_url || profile.avatar_url) ? (
              <img
                src={winner.banner_image_url || profile.avatar_url}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg border-2 border-white/40"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/30">
                {displayName[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Star className="w-3.5 h-3.5 text-white fill-white flex-shrink-0" />
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                Philomni Spotlight — {monthLabel}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{displayName}</h3>
            <p className="text-xs text-white/85 font-medium">
              {winner.category}
            </p>
            {storyExcerpt && (
              <p className="text-xs text-white/70 mt-1 line-clamp-1 hidden sm:block">
                {storyExcerpt}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <Link
              to={`/spotlight/${winner.month}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-amber-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow whitespace-nowrap"
            >
              Meet {firstName}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Animated shimmer stripe */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-4 -left-10 w-16 h-[200%] bg-white/10 rotate-12"
            style={{ animation: 'gold-shimmer 3s ease-in-out infinite' }}
          />
        </div>
      </div>
    </>
  )
}
