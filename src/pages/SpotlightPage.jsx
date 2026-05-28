import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star, ArrowLeft, UserPlus, UserMinus, Share2, Loader2,
  Heart, Eye, MessageCircle, Users, TrendingUp, Award,
  Copy, Check, ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatMonth(yyyyMM) {
  if (!yyyyMM) return ''
  const [y, m] = yyyyMM.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
}

function formatCount(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function ShareModal({ winner, profile, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/spotlight/${winner.month}`
  const text = `Check out ${profile?.full_name || 'this creator'} — Philomni's ${winner.category} Spotlight for ${formatMonth(winner.month)}!`

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const PLATFORMS = [
    { name: 'Twitter/X', emoji: '🐦', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { name: 'WhatsApp',  emoji: '💬', url: `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}` },
    { name: 'Facebook',  emoji: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'LinkedIn',  emoji: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-foreground mb-4 text-center">Share Spotlight</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {PLATFORMS.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{p.name.split('/')[0]}</span>
            </a>
          ))}
        </div>
        <button onClick={copy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
      </div>
    </div>
  )
}

export default function SpotlightPage() {
  const { month }    = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [winner, setWinner]       = useState(null)
  const [profile, setProfile]     = useState(null)
  const [posts, setPosts]         = useState([])
  const [tracks, setTracks]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [stats, setStats]         = useState({ followers: 0, posts: 0, plays: 0 })
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: w } = await supabase
        .from('spotlight_winners')
        .select('*')
        .eq('month', month)
        .maybeSingle()

      if (!w || cancelled) { setLoading(false); return }
      setWinner(w)

      const [{ data: p }, { data: postsData }, { data: tracksData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', w.user_id).maybeSingle(),
        supabase.from('posts').select('*').or(`author_id.eq.${w.user_id},created_by.eq.${w.user_id}`).order('like_count', { ascending: false }).limit(4),
        supabase.from('music_tracks').select('*').eq('user_id', w.user_id).eq('status', 'active').order('play_count', { ascending: false }).limit(4),
      ])

      if (cancelled) return
      setProfile(p)
      setPosts(postsData || [])
      setTracks(tracksData || [])

      // Stats
      const [{ count: fCount }, { count: pCount }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', w.user_id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).or(`author_id.eq.${w.user_id},created_by.eq.${w.user_id}`),
      ])
      const totalPlays = (tracksData || []).reduce((s, t) => s + (t.play_count || 0), 0)
      setStats({ followers: fCount || 0, posts: pCount || 0, plays: totalPlays })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [month])

  // Check follow status
  useEffect(() => {
    if (!user || !winner) return
    supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', winner.user_id).maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [user?.id, winner?.user_id])

  const handleFollow = async () => {
    if (!user) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', winner.user_id)
      setIsFollowing(false)
      setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }))
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: winner.user_id, created_at: new Date().toISOString() })
      setIsFollowing(true)
      setStats(s => ({ ...s, followers: s.followers + 1 }))
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  if (!winner) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-foreground font-semibold mb-1">No Spotlight for {formatMonth(month)}</p>
      <p className="text-muted-foreground text-sm mb-4">Check back later or browse past spotlights.</p>
      <Link to="/spotlight" className="text-primary text-sm hover:underline">View All Spotlights →</Link>
    </div>
  )

  const displayName = profile?.full_name || profile?.username || 'Creator'
  const monthLabel  = formatMonth(winner.month)

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Back */}
      <button onClick={() => navigate('/spotlight')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Spotlights
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {(winner.banner_image_url || profile?.avatar_url) ? (
          <img
            src={winner.banner_image_url || profile?.avatar_url}
            alt={displayName}
            className="w-full h-64 sm:h-80 object-cover object-top"
          />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-amber-500 via-yellow-400 to-teal-500" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow">
            <Star className="w-3.5 h-3.5 fill-white" />
            Philomni Spotlight
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            {winner.category} of the Month · {monthLabel}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{displayName}</h1>
            {profile?.badge_status === 'approved' && (
              <Award className="w-5 h-5 text-blue-400 flex-shrink-0" title="Verified" />
            )}
          </div>
          {winner.tagline && (
            <p className="text-white/80 text-sm mt-1">{winner.tagline}</p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 mb-6">
        {user && user.id !== winner.user_id && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isFollowing
                ? 'border border-border bg-card text-foreground hover:bg-muted'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        <Link
          to={`/profile/${winner.user_id}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          View Profile <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Users className="w-4 h-4 text-primary" />, label: 'Followers',   value: formatCount(stats.followers) },
          { icon: <Eye className="w-4 h-4 text-blue-400" />,  label: 'Total Posts',  value: formatCount(stats.posts) },
          { icon: <TrendingUp className="w-4 h-4 text-green-400" />, label: 'Music Plays', value: formatCount(stats.plays) },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      {winner.story && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-base font-bold text-foreground">Their Story</h2>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{winner.story}</p>
        </div>
      )}

      {/* Featured content */}
      {posts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-foreground mb-3">Featured Content</h2>
          <div className="grid grid-cols-2 gap-3">
            {posts.map(post => {
              const media = post.media_urls?.[0] || post.image_url
              const isVideo = post.post_type === 'video' || /\.(mp4|mov|webm)/i.test(media || '')
              const text = (post.content || '').replace(/<[^>]+>/g, '').trim()
              return (
                <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors">
                  {media ? (
                    <div className="relative aspect-square">
                      {isVideo ? (
                        <video src={media} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={media} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white text-xs font-semibold">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comment_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-900/20 p-3 flex items-center justify-center">
                      <p className="text-xs text-foreground/70 text-center line-clamp-5">{text || '📝'}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Featured tracks */}
      {tracks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-foreground mb-3">Featured Music</h2>
          <div className="space-y-2">
            {tracks.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                {t.cover_art_url ? (
                  <img src={t.cover_art_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0">
                    🎵
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.genre} · {formatCount(t.play_count)} plays</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Nominate */}
      <div className="border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Know someone deserving of the Spotlight?</p>
        <Link
          to="/spotlight/nominate"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
        >
          <Star className="w-4 h-4" /> Nominate Someone
        </Link>
      </div>

      {showShare && <ShareModal winner={winner} profile={profile} onClose={() => setShowShare(false)} />}
    </div>
  )
}
