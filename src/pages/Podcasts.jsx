import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Mic2, Play, Pause, Loader2, Search, Bell, BellOff,
  Headphones, Clock, DollarSign, Users, ChevronDown,
  ChevronUp, Radio, FileText, ExternalLink, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_CHIPS = [
  { emoji: '🔥', label: 'All' },
  { emoji: '💼', label: 'Business' },
  { emoji: '💻', label: 'Technology' },
  { emoji: '😂', label: 'Comedy' },
  { emoji: '🎓', label: 'Education' },
  { emoji: '💪', label: 'Health & Fitness' },
  { emoji: '🔍', label: 'True Crime' },
  { emoji: '🚀', label: 'Entrepreneurship' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '⚽', label: 'Sports' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '📰', label: 'News' },
]

function fmtDuration(secs) {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ── Episode row ───────────────────────────────────────────────────────────────
function EpisodeRow({ episode, podcast, onTip }) {
  const { play, pause, episode: current, isPlaying } = usePodcastPlayer()
  const active = current?.id === episode.id && isPlaying
  const [showNotes, setShowNotes] = useState(false)

  const handlePlay = () => {
    if (!episode.audio_url) return
    if (active) { pause(); return }
    play({ ...episode, podcast_name: podcast.title, cover_image_url: podcast.cover_url })
    // increment play count
    supabase.from('podcast_episodes')
      .update({ play_count: (episode.play_count || 0) + 1 })
      .eq('id', episode.id)
  }

  return (
    <div className={`transition-colors ${active ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={!episode.audio_url}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            active ? 'bg-primary' : 'bg-primary/10 hover:bg-primary/20'
          } disabled:opacity-30`}>
          {active
            ? <Pause className="w-3.5 h-3.5 text-white" />
            : <Play className="w-3.5 h-3.5 text-primary ml-0.5" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>
              {episode.episode_number ? `${episode.episode_number}. ` : ''}{episode.title}
            </p>
            {episode.is_premium && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-200 flex-shrink-0 font-medium">
                Bonus
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            {episode.duration > 0 && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(episode.duration)}</span>
            )}
            {(episode.play_count || 0) > 0 && (
              <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{episode.play_count?.toLocaleString()} plays</span>
            )}
            {episode.published_at && (
              <span>{formatDistanceToNow(new Date(episode.published_at), { addSuffix: true })}</span>
            )}
            {episode.show_notes && (
              <button
                onClick={() => setShowNotes(v => !v)}
                className="flex items-center gap-1 hover:text-primary transition-colors">
                <FileText className="w-3 h-3" />
                {showNotes ? 'Hide notes' : 'Show notes'}
              </button>
            )}
          </div>
        </div>

        {/* Tip button — only when creator enabled monetization */}
        {episode.audio_url && podcast.monetization_enabled && (
          <button
            onClick={() => onTip(episode)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
            <DollarSign className="w-3 h-3" /> Tip
          </button>
        )}
      </div>

      {/* Show notes */}
      {showNotes && episode.show_notes && (
        <div className="mx-4 mb-3 px-3 py-3 bg-muted/50 rounded-xl text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {episode.show_notes}
        </div>
      )}
    </div>
  )
}

// ── Podcast card ──────────────────────────────────────────────────────────────
function PodcastCard({ podcast, following, onToggleFollow, currentUserId }) {
  const [expanded, setExpanded] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [tipEpisode, setTipEpisode] = useState(null)
  const [tipAmount, setTipAmount] = useState('2')
  const [tipping, setTipping] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [supportAmount, setSupportAmount] = useState('5')
  const qc = useQueryClient()
  const { user } = useAuth()

  const isOwn = podcast.created_by === currentUserId
  const isFollowing = following.has(podcast.id)

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', podcast.id],
    queryFn: async () => {
      const { data } = await supabase.from('podcast_episodes').select('*')
        .eq('podcast_id', podcast.id)
        .eq('status', 'published')
        .order('episode_number', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })

  const sendTip = async () => {
    if (!user || !tipEpisode) return
    setTipping(true)
    try {
      const amount = parseFloat(tipAmount)
      if (!amount || amount < 0.5) { toast.error('Minimum tip is $0.50'); return }
      const { addToWallet } = await import('@/lib/wallet')
      await supabase.from('podcast_episodes')
        .update({ tips_total: (tipEpisode.tips_total || 0) + amount })
        .eq('id', tipEpisode.id)
      await addToWallet(podcast.created_by, amount * 0.80, 'podcast_tip', `Tip: "${tipEpisode.title}"`, tipEpisode.id)
      toast.success(`$${amount.toFixed(2)} tip sent to ${podcast.creator_name || 'creator'}!`)
      setShowTip(false)
      qc.invalidateQueries({ queryKey: ['episodes', podcast.id] })
    } catch { toast.error('Tip failed') }
    finally { setTipping(false) }
  }

  const sendSupport = async () => {
    if (!user) return
    setTipping(true)
    try {
      const amount = parseFloat(supportAmount)
      if (!amount || amount < 1) { toast.error('Minimum support is $1'); return }
      const { addToWallet } = await import('@/lib/wallet')
      await addToWallet(podcast.created_by, amount * 0.80, 'podcast_support', `Listener support: "${podcast.title}"`, podcast.id)
      toast.success(`You're now supporting ${podcast.title}! Thank you 🎙️`)
      setShowSupport(false)
    } catch { toast.error('Support failed') }
    finally { setTipping(false) }
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${expanded ? 'border-primary/30' : 'border-border hover:border-primary/20'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Cover */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
            {podcast.cover_url
              ? <img src={podcast.cover_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Mic2 className="w-7 h-7 text-primary/50" />
                </div>}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-snug">{podcast.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{podcast.creator_name || 'Creator'}</p>
            {podcast.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{podcast.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {podcast.category && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{podcast.category}</span>
              )}
              <span className="text-xs text-muted-foreground">{podcast.total_episodes || 0} eps</span>
              {(podcast.subscriber_count || 0) > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />{podcast.subscriber_count?.toLocaleString()} followers
                </span>
              )}
              {(podcast.total_plays || 0) > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Headphones className="w-3 h-3" />{podcast.total_plays?.toLocaleString()} plays
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {!isOwn && (
              <button
                onClick={() => onToggleFollow(podcast)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}>
                {isFollowing ? <><BellOff className="w-3 h-3" /> Following</> : <><Bell className="w-3 h-3" /> Follow</>}
              </button>
            )}
            {!isOwn && podcast.monetization_enabled && (
              <button
                onClick={() => setShowSupport(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                <DollarSign className="w-3 h-3" /> Support
              </button>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Episodes</>}
            </button>
          </div>
        </div>
      </div>

      {/* Listener support panel */}
      {showSupport && (
        <div className="border-t border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Support this show</p>
              <p className="text-xs text-muted-foreground">80% goes directly to the creator</p>
            </div>
            <button onClick={() => setShowSupport(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['2', '5', '10', '20'].map(v => (
              <button key={v} onClick={() => setSupportAmount(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${supportAmount === v ? 'bg-amber-500 text-white border-amber-500' : 'border-border hover:border-amber-400'}`}>
                ${v}
              </button>
            ))}
            <input type="number" min="1" step="1" value={supportAmount} onChange={e => setSupportAmount(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-background" placeholder="Other" />
            <button onClick={sendSupport} disabled={tipping}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1">
              {tipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
              Send ${supportAmount}
            </button>
          </div>
        </div>
      )}

      {/* Episode list */}
      {expanded && (
        <div className="border-t border-border">
          {episodes.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No episodes published yet</div>
          ) : (
            <div className="divide-y divide-border">
              {episodes.map(ep => (
                <EpisodeRow
                  key={ep.id}
                  episode={ep}
                  podcast={podcast}
                  onTip={(ep) => { setTipEpisode(ep); setTipAmount('2'); setShowTip(true) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tip modal */}
      {showTip && tipEpisode && (
        <div className="border-t border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Tip the creator</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">"{tipEpisode.title}"</p>
            </div>
            <button onClick={() => setShowTip(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['1', '2', '5', '10'].map(v => (
              <button key={v} onClick={() => setTipAmount(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${tipAmount === v ? 'bg-amber-500 text-white border-amber-500' : 'border-border hover:border-amber-400'}`}>
                ${v}
              </button>
            ))}
            <input type="number" min="0.5" step="0.5" value={tipAmount} onChange={e => setTipAmount(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-background" placeholder="Other" />
            <button onClick={sendTip} disabled={tipping}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1">
              {tipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
              Send Tip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Podcasts page ────────────────────────────────────────────────────────
export default function Podcasts() {
  const { user } = useAuth()
  const { mode } = useMode()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [following, setFollowing] = useState(new Set())

  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ['all-podcasts'],
    queryFn: async () => {
      const { data } = await supabase.from('podcasts').select('*')
        .order('total_plays', { ascending: false }).limit(60)
      return data ?? []
    },
  })

  useEffect(() => {
    if (!user?.id) return
    supabase.from('podcast_subscriptions').select('podcast_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setFollowing(new Set(data.map(s => s.podcast_id))) })
  }, [user?.id])

  const handleToggleFollow = async (podcast) => {
    if (!user?.id) { toast.error('Sign in to follow podcasts'); return }
    const isNow = following.has(podcast.id)
    if (isNow) {
      await supabase.from('podcast_subscriptions').delete()
        .eq('user_id', user.id).eq('podcast_id', podcast.id)
      await supabase.from('podcasts').update({ subscriber_count: Math.max(0, (podcast.subscriber_count || 1) - 1) }).eq('id', podcast.id)
      setFollowing(prev => { const s = new Set(prev); s.delete(podcast.id); return s })
      toast.success('Unfollowed')
    } else {
      await supabase.from('podcast_subscriptions').insert({ user_id: user.id, podcast_id: podcast.id })
      await supabase.from('podcasts').update({ subscriber_count: (podcast.subscriber_count || 0) + 1 }).eq('id', podcast.id)
      setFollowing(prev => new Set([...prev, podcast.id]))
      toast.success('Following!')
    }
    qc.invalidateQueries({ queryKey: ['all-podcasts'] })
  }

  const filtered = podcasts.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q || p.title?.toLowerCase().includes(q) || p.creator_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    const matchesCat = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCat
  })

  const totalEpisodes = podcasts.reduce((s, p) => s + (p.total_episodes || 0), 0)

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Podcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {podcasts.length > 0
              ? `${podcasts.length} shows · ${totalEpisodes} episodes`
              : mode === 'pro' ? 'Business, tech and professional development' : 'Discover and listen to shows'}
          </p>
        </div>
        <Link
          to="/podcast-studio"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Start a Show
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search podcasts, creators…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        {CATEGORY_CHIPS.map(cat => (
          <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Following row */}
      {following.size > 0 && !search && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" /> Following</p>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {podcasts.filter(p => following.has(p.id)).map(p => (
              <div key={p.id} className="flex-shrink-0 w-20 text-center">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden mx-auto mb-1 ring-2 ring-primary/30">
                  {p.cover_url
                    ? <img src={p.cover_url} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center"><Mic2 className="w-5 h-5 text-muted-foreground" /></div>}
                </div>
                <p className="text-xs font-medium truncate">{p.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!search && activeCategory === 'All' && podcasts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Radio, label: 'Shows', value: podcasts.length },
            { icon: Headphones, label: 'Episodes', value: totalEpisodes },
            { icon: Users, label: 'Creators', value: new Set(podcasts.map(p => p.created_by)).size },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monetization info banner (for creators) */}
      {user && !search && activeCategory === 'All' && (
        <div className="mb-5 bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Ready to start your podcast?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload episodes, earn tips from listeners, get distributed to Spotify & Apple Podcasts via RSS.</p>
          </div>
          <Link to="/podcast-studio" className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
            <ExternalLink className="w-3 h-3" /> Studio
          </Link>
        </div>
      )}

      {/* Podcast list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? `No podcasts matching "${search}"` : `No ${activeCategory !== 'All' ? activeCategory : ''} podcasts yet`}
          </p>
          <p className="text-sm mt-1 mb-4">Be the first to create one!</p>
          <Link to="/podcast-studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Start a Podcast
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <PodcastCard
              key={p.id}
              podcast={p}
              following={following}
              onToggleFollow={handleToggleFollow}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
