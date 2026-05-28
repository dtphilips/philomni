import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, Loader2, Users } from 'lucide-react'
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

function WinnerCard({ winner, profile }) {
  const displayName = profile?.full_name || profile?.username || 'Creator'
  const isCurrentMonth = winner.month === new Date().toISOString().slice(0, 7)

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-all group ${
      isCurrentMonth ? 'border-amber-500/40 shadow-amber-500/10 shadow' : 'border-border'
    }`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {(winner.banner_image_url || profile?.avatar_url) ? (
          <img
            src={winner.banner_image_url || profile?.avatar_url}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 via-yellow-400 to-teal-500 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{displayName[0]}</span>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Current badge */}
        {isCurrentMonth && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            <Star className="w-3 h-3 fill-white" /> CURRENT
          </div>
        )}

        {/* Month */}
        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">{formatMonth(winner.month)}</p>
          <h3 className="text-base font-bold text-white leading-tight">{displayName}</h3>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{winner.category}</span>
        </div>
        {winner.tagline && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{winner.tagline}</p>
        )}
        <Link
          to={`/spotlight/${winner.month}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-teal-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold hover:from-amber-500/25 hover:to-teal-500/25 transition-colors border border-amber-500/20"
        >
          View Story <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function SpotlightArchive() {
  const [winners, setWinners]   = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: ws } = await supabase
        .from('spotlight_winners')
        .select('*')
        .order('month', { ascending: false })

      if (!ws || ws.length === 0) { setLoading(false); return }
      setWinners(ws)

      // Fetch all profiles
      const userIds = [...new Set(ws.map(w => w.user_id))]
      const { data: ps } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, headline')
        .in('id', userIds)

      const profileMap = {}
      ;(ps || []).forEach(p => { profileMap[p.id] = p })
      setProfiles(profileMap)
      setLoading(false)
    }
    load()
  }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentWinner = winners.find(w => w.month === currentMonth)
  const pastWinners = winners.filter(w => w.month !== currentMonth)

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          <h1 className="text-2xl font-bold text-foreground">Philomni Spotlight</h1>
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Every month we celebrate an outstanding creator, builder, or professional
          who's making an impact on Philomni.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            to="/spotlight/nominate"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow"
          >
            <Star className="w-4 h-4 fill-white" /> Nominate Someone
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-1">No Spotlights Yet</p>
          <p className="text-muted-foreground text-sm mb-4">Be the first to nominate someone deserving!</p>
          <Link to="/spotlight/nominate" className="text-primary text-sm hover:underline">Nominate Now →</Link>
        </div>
      ) : (
        <>
          {/* Current Spotlight */}
          {currentWinner && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">This Month's Spotlight</h2>
              </div>

              {/* Featured card - wider */}
              <div className="relative rounded-2xl overflow-hidden bg-card border border-amber-500/40 shadow-lg">
                <div className="relative h-56 sm:h-72">
                  {(currentWinner.banner_image_url || profiles[currentWinner.user_id]?.avatar_url) ? (
                    <img
                      src={currentWinner.banner_image_url || profiles[currentWinner.user_id]?.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 via-yellow-400 to-teal-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">{currentWinner.category} · {formatMonth(currentWinner.month)}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        {profiles[currentWinner.user_id]?.full_name || profiles[currentWinner.user_id]?.username || 'Creator'}
                      </h2>
                      {currentWinner.tagline && <p className="text-white/80 text-sm mt-1">{currentWinner.tagline}</p>}
                    </div>
                    <Link
                      to={`/spotlight/${currentWinner.month}`}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-amber-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow ml-4"
                    >
                      Read Story <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past Spotlights */}
          {pastWinners.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Past Spotlights</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pastWinners.map(w => (
                  <WinnerCard key={w.id} winner={w} profile={profiles[w.user_id]} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
