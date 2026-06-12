import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Mic2, Play, Pause, Plus, Loader2, Search, Bell, BellOff,
  Star, Headphones, Clock, Lock, DollarSign, Users, ChevronDown,
  ChevronUp, TrendingUp, Radio, Heart, MoreHorizontal, Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_CHIPS = [
  { emoji: '🔥', label: 'Trending' },
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
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ── Episode row inside a podcast card ────────────────────────────────────────
function EpisodeRow({ episode, podcast, onTip, purchases }) {
  const { play, pause, episode: current, isPlaying } = usePodcastPlayer()
  const { user } = useAuth()
  const active = current?.id === episode.id && isPlaying
  const hasPurchased = purchases?.has(episode.id)
  const canPlay = !episode.is_premium || hasPurchased

  const handlePlay = () => {
    if (!episode.audio_url) return
    if (!canPlay) { onTip && onTip(episode, 'buy'); return }
    if (active) { pause(); return }
    play({ ...episode, podcast_name: podcast.title, cover_image_url: podcast.cover_url })
    // Increment play count
    supabase.from('podcast_episodes').update({ play_count: (episode.play_count || 0) + 1 }).eq('id', episode.id)
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors ${active ? 'bg-primary/5' : ''}`}>
      <button
        onClick={handlePlay}
        disabled={!episode.audio_url}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          active ? 'bg-primary' : canPlay ? 'bg-primary/10 hover:bg-primary/20' : 'bg-amber-500/10 hover:bg-amber-500/20'
        } disabled:opacity-30`}>
        {active ? <Pause className="w-3.5 h-3.5 text-white" /> : canPlay ? <Play className="w-3.5 h-3.5 text-primary ml-0.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{episode.title}</p>
          {episode.is_premium && !hasPurchased && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium border border-amber-200 flex-shrink-0">
              <Lock className="w-2.5 h-2.5" /> ${episode.premium_price || '—'}
            </span>
          )}
          {episode.is_premium && hasPurchased && (
            <span className="text-[10px] text-green-500 font-medium flex-shrink-0">✓ Purchased</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {episode.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(episode.duration)}</span>}
          {(episode.play_count || 0) > 0 && <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{episode.play_count?.toLocaleString()}</span>}
          {episode.published_at && <span>{formatDistanceToNow(new Date(episode.published_at), { addSuffix: true })}</span>}
        </div>
      </div>
      {episode.audio_url && !episode.is_premium && (
        <button
          onClick={() => onTip && onTip(episode, 'tip')}
          className="flex-shrink-0 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors gap-1 flex items-center">
          <DollarSign className="w-3 h-3" /> Tip
        </button>
      )}
      {episode.is_premium && !hasPurchased && (
        <button
          onClick={() => onTip && onTip(episode, 'buy')}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors">
          Buy ${episode.premium_price}
        </button>
      )}
    </div>
  )
}

// ── Podcast card (listener view) ──────────────────────────────────────────────
function PodcastCard({ podcast, subscribed, onToggleSubscribe, currentUserId }) {
  const [expanded, setExpanded] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [tipEpisode, setTipEpisode] = useState(null)
  const [tipMode, setTipMode] = useState('tip') // 'tip' | 'buy'
  const [tipAmount, setTipAmount] = useState('2')
  const [tipping, setTipping] = useState(false)
  const { user } = useAuth()
  const qc = useQueryClient()

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
    enabled: expanded || !!podcast.id,
  })

  // Which premium episodes the current user has purchased
  const { data: purchaseSet = new Set() } = useQuery({
    queryKey: ['ep-purchases', podcast.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('podcast_episode_purchases')
        .select('episode_id').eq('user_id', user.id).eq('podcast_id', podcast.id)
      return new Set((data ?? []).map(r => r.episode_id))
    },
    enabled: !!user?.id,
  })

  const isSub = subscribed.has(podcast.id)
  const isOwn = podcast.created_by === currentUserId

  const handleAction = async () => {
    if (!user || !tipEpisode) return
    setTipping(true)
    try {
      const { addToWallet } = await import('@/lib/wallet')

      if (tipMode === 'buy') {
        const price = parseFloat(tipEpisode.premium_price || 0)
        if (!price) { toast.error('No price set for this episode'); return }
        // Record purchase
        const { error } = await supabase.from('podcast_episode_purchases').insert({
          user_id: user.id,
          episode_id: tipEpisode.id,
          podcast_id: podcast.id,
          amount_paid: price,
        })
        if (error) { toast.error('Purchase failed — you may already own this episode'); return }
        // 80% to creator
        await addToWallet(podcast.created_by, price * 0.80, 'podcast_sale', `Episode purchase: "${tipEpisode.title}"`, tipEpisode.id)
        await supabase.from('podcast_episodes').update({ tips_total: (tipEpisode.tips_total || 0) + price }).eq('id', tipEpisode.id)
        qc.invalidateQueries({ queryKey: ['ep-purchases', podcast.id, user.id] })
        toast.success(`Unlocked! You can now play "${tipEpisode.title}"`)
      } else {
        const amount = parseFloat(tipAmount)
        if (!amount || amount < 0.5) { toast.error('Minimum tip is $0.50'); return }
        await supabase.from('podcast_episodes').update({ tips_total: (tipEpisode.tips_total || 0) + amount }).eq('id', tipEpisode.id)
        await addToWallet(podcast.created_by, amount * 0.80, 'podcast_tip', `Tip for "${tipEpisode.title}"`, tipEpisode.id)
        toast.success(`$${amount.toFixed(2)} tip sent!`)
      }
      setShowTip(false)
    } catch {
      toast.error('Action failed')
    } finally {
      setTipping(false)
    }
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${expanded ? 'border-primary/30' : 'border-border hover:border-primary/20'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
            {podcast.cover_url
              ? <img src={podcast.cover_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Mic2 className="w-7 h-7 text-primary/50" />
                </div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-snug">{podcast.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{podcast.creator_name || 'Creator'}</p>
            {podcast.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{podcast.description}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {podcast.category && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{podcast.category}</span>
              )}
              {podcast.explicit && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full border border-red-200 dark:border-red-900">E</span>
              )}
              <span className="text-xs text-muted-foreground">{podcast.total_episodes || 0} eps</span>
              {(podcast.subscriber_count || 0) > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />{podcast.subscriber_count?.toLocaleString()}
                </span>
              )}
              {(podcast.total_plays || 0) > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Headphones className="w-3 h-3" />{podcast.total_plays?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {!isOwn && (
              <button
                onClick={() => onToggleSubscribe(podcast)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSub
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}>
                {isSub ? <><BellOff className="w-3 h-3" /> Following</> : <><Bell className="w-3 h-3" /> Follow</>}
              </button>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Episodes</>}
            </button>
          </div>
        </div>
      </div>

      {/* Episodes */}
      {expanded && (
        <div className="border-t border-border">
          {episodes.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No episodes published yet</div>
          ) : (
            <div className="divide-y divide-border">
              {episodes.map(ep => (
                <EpisodeRow key={ep.id} episode={ep} podcast={podcast} purchases={purchaseSet}
                  onTip={(ep, mode) => { setTipEpisode(ep); setTipMode(mode); setTipAmount(mode === 'buy' ? String(ep.premium_price || '') : '2'); setShowTip(true) }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tip / Buy modal */}
      {showTip && tipEpisode && (
        <div className="border-t border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">
                {tipMode === 'buy' ? `Unlock episode — $${tipEpisode.premium_price}` : 'Support the creator'}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">"{tipEpisode.title}"</p>
            </div>
            <button onClick={() => setShowTip(false)} className="text-muted-foreground hover:text-foreground text-xs">Cancel</button>
          </div>
          {tipMode === 'buy' ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground flex-1">Pay <strong>${tipEpisode.premium_price}</strong> to unlock full episode. 80% goes to the creator.</p>
              <button onClick={handleAction} disabled={tipping}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0">
                {tipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Unlock
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {['1', '2', '5', '10'].map(v => (
                <button key={v} onClick={() => setTipAmount(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${tipAmount === v ? 'bg-amber-500 text-white border-amber-500' : 'border-border hover:border-amber-400'}`}>
                  ${v}
                </button>
              ))}
              <input type="number" min="0.5" step="0.5" value={tipAmount} onChange={e => setTipAmount(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-background" placeholder="Other" />
              <button onClick={handleAction} disabled={tipping}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1">
                {tipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                Send Tip
              </button>
            </div>
          )}
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
  const [activeCategory, setActiveCategory] = useState('Trending')
  const [subscribed, setSubscribed] = useState(new Set())

  // Load all podcasts
  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ['all-podcasts'],
    queryFn: async () => {
      const { data } = await supabase.from('podcasts')
        .select('*')
        .order('total_plays', { ascending: false })
        .limit(60)
      return data ?? []
    },
  })

  // Load subscriptions
  useEffect(() => {
    if (!user?.id) return
    supabase.from('podcast_subscriptions').select('podcast_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setSubscribed(new Set(data.map(s => s.podcast_id))) })
  }, [user?.id])

  const handleToggleSubscribe = async (podcast) => {
    if (!user?.id) { toast.error('Sign in to follow podcasts'); return }
    const isSub = subscribed.has(podcast.id)
    if (isSub) {
      await supabase.from('podcast_subscriptions').delete()
        .eq('user_id', user.id).eq('podcast_id', podcast.id)
      // Decrement count
      await supabase.from('podcasts').update({ subscriber_count: Math.max(0, (podcast.subscriber_count || 1) - 1) }).eq('id', podcast.id)
      setSubscribed(prev => { const s = new Set(prev); s.delete(podcast.id); return s })
      toast.success('Unfollowed')
    } else {
      await supabase.from('podcast_subscriptions').insert({ user_id: user.id, podcast_id: podcast.id })
      await supabase.from('podcasts').update({ subscriber_count: (podcast.subscriber_count || 0) + 1 }).eq('id', podcast.id)
      setSubscribed(prev => new Set([...prev, podcast.id]))
      toast.success('Following!')
    }
    qc.invalidateQueries({ queryKey: ['all-podcasts'] })
  }

  const filtered = podcasts.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q || p.title?.toLowerCase().includes(q) || p.creator_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    const matchesCat = activeCategory === 'Trending' || p.category === activeCategory
    return matchesSearch && matchesCat
  })

  // Stats for header
  const totalEpisodes = podcasts.reduce((s, p) => s + (p.total_episodes || 0), 0)

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Podcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {mode === 'pro'
              ? 'Business, tech and professional development'
              : `${podcasts.length} shows · ${totalEpisodes} episodes`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search podcasts, creators…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        {CATEGORY_CHIPS.map(cat => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Subscribed shows row */}
      {subscribed.size > 0 && !search && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Following</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {podcasts.filter(p => subscribed.has(p.id)).map(p => (
              <div key={p.id} className="flex-shrink-0 w-20 text-center">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden mx-auto mb-1 border-2 border-primary/30">
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
      {!search && activeCategory === 'Trending' && podcasts.length > 0 && (
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

      {/* Podcast list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? `No podcasts matching "${search}"` : `No ${activeCategory !== 'Trending' ? activeCategory : ''} podcasts yet`}
          </p>
          <p className="text-sm mt-1">Be the first to upload one in Podcast Studio!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <PodcastCard
              key={p.id}
              podcast={p}
              subscribed={subscribed}
              onToggleSubscribe={handleToggleSubscribe}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
