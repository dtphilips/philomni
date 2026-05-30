import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CelebrationCard from './CelebrationCard'

export default function CelebrationsRow() {
  const navigate = useNavigate()
  const [celebrations, setCelebrations] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('celebrations')
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
      setCelebrations(data || [])
    }
    load()
  }, [])

  if (celebrations.length === 0) return null

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <span className="font-semibold text-sm text-foreground">Celebrations</span>
        </div>
        <button
          onClick={() => navigate('/celebrations')}
          className="text-xs text-primary font-medium hover:underline"
        >
          See all
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
        {celebrations.map(c => (
          <CelebrationCard key={c.id} celebration={c} compact />
        ))}
      </div>
    </div>
  )
}
