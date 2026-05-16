import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Globe, Search, Loader2, UserPlus, UserCheck, MessageSquare, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Directory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState(new Set()) // set of user ids we follow
  const [actionLoading, setActionLoading] = useState({}) // {userId: 'follow'|'message'}

  useEffect(() => {
    supabase.from('users').select('id, full_name, avatar_url, headline, role, location')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setCreators(data ?? []); setLoading(false) })
  }, [])

  // Load who the current user already follows
  useEffect(() => {
    if (!user?.id) return
    supabase.from('follows').select('following_id').eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowing(new Set(data.map(f => f.following_id)))
      })
  }, [user?.id])

  const handleFollow = async (creatorId) => {
    if (creatorId === user?.id) return
    setActionLoading(prev => ({ ...prev, [creatorId]: 'follow' }))
    if (following.has(creatorId)) {
      // Unfollow
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId)
      setFollowing(prev => { const s = new Set(prev); s.delete(creatorId); return s })
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId })
      setFollowing(prev => new Set([...prev, creatorId]))
    }
    setActionLoading(prev => { const s = { ...prev }; delete s[creatorId]; return s })
  }

  const handleMessage = async (creator) => {
    if (creator.id === user?.id) return
    setActionLoading(prev => ({ ...prev, [creator.id + '_msg']: true }))
    // Find or create conversation
    const { data: existing } = await supabase.from('conversations').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${creator.id}),and(participant_1.eq.${creator.id},participant_2.eq.${user.id})`)
      .maybeSingle()
    if (existing) {
      navigate('/messages')
    } else {
      await supabase.from('conversations').insert({
        participant_1: user.id,
        participant_2: creator.id,
        title: creator.full_name,
        last_message_at: new Date().toISOString(),
      })
      navigate('/messages')
    }
    setActionLoading(prev => { const s = { ...prev }; delete s[creator.id + '_msg']; return s })
  }

  const filtered = creators.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.headline?.toLowerCase().includes(search.toLowerCase()) ||
    c.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Creator Directory</h1>
      <p className="text-muted-foreground text-sm mb-6">Discover and connect with creators on Philomni</p>

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
          {filtered.map(c => {
            const isFollowing = following.has(c.id)
            const isMe = c.id === user?.id
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
                {/* Top: avatar + info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden text-lg">
                    {c.avatar_url
                      ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                      : c.full_name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.full_name}</p>
                    {c.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.headline}</p>}
                    {c.location && <p className="text-xs text-muted-foreground mt-0.5">📍 {c.location}</p>}
                    {c.role && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">{c.role}</span>}
                  </div>
                </div>

                {/* Actions */}
                {!isMe && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFollow(c.id)}
                      disabled={!!actionLoading[c.id]}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                        isFollowing
                          ? 'bg-primary/15 text-primary hover:bg-primary/25'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}>
                      {actionLoading[c.id] === 'follow'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isFollowing
                          ? <><UserCheck className="w-3.5 h-3.5" /> Following</>
                          : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                    </button>
                    <button
                      onClick={() => handleMessage(c)}
                      disabled={!!actionLoading[c.id + '_msg']}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-all disabled:opacity-60">
                      {actionLoading[c.id + '_msg']
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <MessageSquare className="w-3.5 h-3.5" />}
                      Message
                    </button>
                    <button
                      onClick={() => navigate(`/profile?id=${c.id}`)}
                      className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all">
                      <User className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {isMe && (
                  <button onClick={() => navigate('/profile')}
                    className="w-full py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                    My Profile
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
