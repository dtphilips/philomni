import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LivesRow() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('lives')
        .select('*, users(id, full_name, avatar_url)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(10)
      setLives(data || [])
    }
    fetch()

    // Refresh every 30 seconds
    const interval = setInterval(fetch, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (lives.length === 0) return null

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Now</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {lives.map(live => {
          const host = live.users || {}
          const initials = (host.full_name || live.host_name || '?')[0].toUpperCase()
          return (
            <button
              key={live.id}
              onClick={() => navigate(`/live/${live.id}`)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <div className="relative">
                {/* Pulsing red ring */}
                <div className="absolute -inset-1 rounded-full border-2 border-destructive animate-pulse" />
                <div className="w-14 h-14 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                  {host.avatar_url || live.host_avatar
                    ? <img src={host.avatar_url || live.host_avatar} alt={host.full_name || live.host_name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-lg">{initials}</span>
                  }
                </div>
                {/* LIVE badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  LIVE
                </div>
              </div>
              <p className="text-xs font-medium text-foreground truncate max-w-[64px] mt-1">
                {host.full_name || live.host_name || 'Creator'}
              </p>
              <p className="text-[10px] text-muted-foreground">{live.viewer_count || 0} watching</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
