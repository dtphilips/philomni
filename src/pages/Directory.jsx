import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Globe, Search, Loader2, UserPlus } from 'lucide-react'

export default function Directory() {
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('users').select('id, full_name, avatar_url, headline, role, location').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setCreators(data ?? []); setLoading(false) })
  }, [])

  const filtered = creators.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.headline?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Creator Directory</h1>
      <p className="text-muted-foreground text-sm mb-6">Discover creators on Philomni</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No creators found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                  : c.full_name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{c.full_name}</p>
                {c.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.headline}</p>}
                {c.location && <p className="text-xs text-muted-foreground mt-0.5">📍 {c.location}</p>}
              </div>
              <button className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 flex-shrink-0">
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
