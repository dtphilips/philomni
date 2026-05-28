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
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    supabase
      .from('spotlight_winners')
      .select('*')
      .eq('month', currentMonth)
      .eq('is_active', true)
      .maybeSingle()
      .then(async ({ data: w }) => {
        if (!w) { setLoaded(true); return }
        setWinner(w)
        // Fetch winner's profile
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

  const displayName = profile.full_name || profile.username || 'Creator'
  const monthLabel  = formatMonth(winner.month)

  return (
    <div className="relative mb-4 rounded-2xl overflow-hidden shadow-lg">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-teal-500 opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/40 via-transparent to-teal-600/40" />

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="relative z-10 flex items-center gap-4 p-4 sm:p-5">
        {/* Left: Photo */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={winner.banner_image_url || profile.avatar_url}
              alt={displayName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg border-2 border-white/30"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/30">
              {displayName[0]}
            </div>
          )}
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Star className="w-3.5 h-3.5 text-white fill-white flex-shrink-0" />
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
              Philomni Spotlight — {monthLabel}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{displayName}</h3>
          <p className="text-xs sm:text-sm text-white/80 font-medium truncate">
            {winner.category} · {winner.tagline || profile.headline || 'Featured Creator'}
          </p>
        </div>

        {/* Right: CTA */}
        <div className="flex-shrink-0">
          <Link
            to={`/spotlight/${winner.month}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-amber-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow whitespace-nowrap"
          >
            Meet {displayName.split(' ')[0]}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Animated shimmer stripe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-4 -left-10 w-16 h-[200%] bg-white/10 rotate-12"
          style={{ animation: 'shimmer 3s ease-in-out infinite' }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-200%) rotate(12deg); }
          100% { transform: translateX(800%) rotate(12deg); }
        }
      `}</style>
    </div>
  )
}
