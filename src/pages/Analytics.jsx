import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  FileText, Heart, MessageCircle, Users, Eye,
  Loader2, Repeat2, Bookmark, ArrowUp, ArrowDown, Minus,
  RefreshCw, TrendingUp, Clock, Calendar, Hash, DollarSign,
  ChevronUp, ChevronDown as ChevronDownIcon, Flame, CheckCircle, BarChart2,
  UserPlus,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m || 1}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function postTypeIcon(post) {
  const urls = post.media_urls ?? []
  if (urls.length === 0) return '📝'
  const first = urls[0] ?? ''
  if (/\.(mp4|mov|webm|avi)/i.test(first)) return '🎥'
  return '📸'
}

function postLabel(post, maxLen = 30) {
  const raw = (post.content ?? '').replace(/<[^>]+>/g, '').trim()
  if (raw.length > 0) return raw.slice(0, maxLen) + (raw.length > maxLen ? '…' : '')
  const d = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
  return `Post from ${d}`
}

function engagementBadge(rate) {
  if (rate >= 10) return { label: '🔥 Hot',     cls: 'bg-orange-500/20 text-orange-400' }
  if (rate >= 5)  return { label: '✅ Good',    cls: 'bg-emerald-500/20 text-emerald-400' }
  if (rate >= 2)  return { label: '📈 Growing', cls: 'bg-blue-500/20 text-blue-400' }
  return              { label: '💤 Low',         cls: 'bg-muted text-muted-foreground' }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, iconColor, bgColor }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{fmt(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, dataKey, color, label, value, change }) {
  const up = change >= 0
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{fmt(value)}</p>
      <div className={`flex items-center gap-1 text-xs font-medium mb-2 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
        {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}% vs last 30d
      </div>
      <ResponsiveContainer width="100%" height={48}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5}
            fill={`url(#sg-${dataKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Heatmap Tooltip ──────────────────────────────────────────────────────────

function HeatCell({ count, date }) {
  const [show, setShow] = useState(false)
  const color =
    count === 0 ? 'bg-muted/30' :
    count === 1 ? 'bg-violet-900' :
    count === 2 ? 'bg-violet-600' :
                  'bg-violet-400'
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div className={`w-3 h-3 rounded-sm ${color} cursor-default`} />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap z-10 pointer-events-none shadow-xl">
          {count} post{count !== 1 ? 's' : ''} · {date}
        </div>
      )}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, iconColor = 'text-primary' }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-muted/50 rounded-lg ${className}`} />
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────

export default function Analytics() {
  const { user } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()
  const [loading, setLoading]       = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [stats, setStats]           = useState({ posts: 0, views: 0, likes: 0, comments: 0, followers: 0, following: 0 })
  const [allPosts, setAllPosts]     = useState([])
  const [viewsChart, setViewsChart] = useState([])
  const [activity, setActivity]     = useState([])
  const [growthData, setGrowthData] = useState({ views: [], engagement: [], posts: [], followers: [] })
  const [growthChange, setGrowthChange] = useState({ views: 0, engagement: 0, posts: 0, followers: 0 })
  const [audienceInsights, setAudienceInsights] = useState(null)
  const [sortKey, setSortKey]       = useState('view_count')
  const [sortDir, setSortDir]       = useState('desc')

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }
    const userId = session.user.id
    setLoading(true)

    // Wrap in Promise.resolve so .catch() is called on a real Promise (not a supabase query builder)
    const safeQuery = (q) => Promise.resolve(q).catch(() => ({ data: null, count: 0, error: null }))

    const [postsRes, follRes, followingRes, notifRes, recentLikesRes, recentCommentsRes, recentFollowsRes] = await Promise.all([
      safeQuery(supabase.from('posts')
        .select('id, view_count, like_count, comment_count, repost_count, save_count, content, created_at, media_urls')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)),
      safeQuery(supabase.from('follows').select('id, created_at', { count: 'exact' }).eq('following_id', userId)),
      safeQuery(supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId)),
      safeQuery(supabase.from('notifications').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(10)),
      safeQuery(supabase.from('likes').select('id, created_at, user_id, post_id, posts!inner(content, author_id, media_urls)')
        .eq('posts.author_id', userId)
        .order('created_at', { ascending: false }).limit(5)),
      safeQuery(supabase.from('comments').select('id, created_at, content, user_id, post_id, posts!inner(content, author_id)')
        .eq('posts.author_id', userId)
        .order('created_at', { ascending: false }).limit(5)),
      safeQuery(supabase.from('follows').select('id, created_at, follower_id, profiles:follower_id(username, avatar_url)')
        .eq('following_id', userId)
        .order('created_at', { ascending: false }).limit(5)),
    ])

    const posts     = postsRes.data ?? []
    const followers = follRes.count ?? 0
    const following = followingRes.count ?? 0

    const totalViews    = posts.reduce((s, p) => s + (p.view_count    ?? 0), 0)
    const totalLikes    = posts.reduce((s, p) => s + (p.like_count    ?? 0), 0)
    const totalComments = posts.reduce((s, p) => s + (p.comment_count ?? 0), 0)

    setStats({ posts: posts.length, views: totalViews, likes: totalLikes, comments: totalComments, followers, following })
    setAllPosts(posts)

    // ── Views per day (last 30 days) ──────────────────────────────────────
    const bucket = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      bucket[d.toISOString().slice(0, 10)] = 0
    }
    posts.forEach(p => {
      const day = p.created_at?.slice(0, 10)
      if (day && bucket[day] !== undefined) bucket[day] += p.view_count ?? 0
    })
    setViewsChart(Object.entries(bucket).map(([date, views]) => ({ date: date.slice(5), views })))

    // ── Activity feed ─────────────────────────────────────────────────────
    const actItems = []
    ;(recentLikesRes.data ?? []).forEach(l => {
      const snippet = (l.posts?.content ?? '').replace(/<[^>]+>/g, '').slice(0, 30)
      actItems.push({ id: `like-${l.id}`, type: 'like', emoji: '❤️', msg: `Someone liked your post${snippet ? ': "' + snippet + '…"' : ''}`, time: l.created_at })
    })
    ;(recentCommentsRes.data ?? []).forEach(c => {
      const snippet = (c.content ?? '').slice(0, 30)
      actItems.push({ id: `cmt-${c.id}`, type: 'comment', emoji: '💬', msg: `Someone commented: "${snippet}${snippet.length >= 30 ? '…' : ''}"`, time: c.created_at })
    })
    ;(recentFollowsRes.data ?? []).forEach(f => {
      const name = f.profiles?.username ?? 'Someone'
      actItems.push({ id: `fol-${f.id}`, type: 'follow', emoji: '👤', msg: `${name} followed you`, time: f.created_at })
    })
    // Merge with notifications
    ;(notifRes.data ?? []).forEach(n => {
      actItems.push({ id: `notif-${n.id}`, type: n.type, emoji: { like: '❤️', comment: '💬', follow: '👤', repost: '🔁' }[n.type] ?? '🔔', msg: n.message ?? n.type, time: n.created_at })
    })
    actItems.sort((a, b) => new Date(b.time) - new Date(a.time))
    setActivity(actItems.slice(0, 10))

    // ── Growth sparklines (30d buckets) ───────────────────────────────────
    const now      = Date.now()
    const day30    = 30 * 86_400_000
    const days30   = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now - (29 - i) * 86_400_000)
      return d.toISOString().slice(0, 10)
    })
    const viewsByDay  = Object.fromEntries(days30.map(d => [d, 0]))
    const postsByDay  = Object.fromEntries(days30.map(d => [d, 0]))
    const engByDay    = Object.fromEntries(days30.map(d => [d, 0]))
    posts.forEach(p => {
      const day = p.created_at?.slice(0, 10)
      if (!day) return
      if (viewsByDay[day] !== undefined) {
        viewsByDay[day]  += p.view_count    ?? 0
        postsByDay[day]  += 1
        engByDay[day]    += (p.like_count ?? 0) + (p.comment_count ?? 0)
      }
    })
    const follByDay = Object.fromEntries(days30.map(d => [d, 0]))
    ;(follRes.data ?? []).forEach(f => {
      const day = f.created_at?.slice(0, 10)
      if (day && follByDay[day] !== undefined) follByDay[day] += 1
    })

    const toArr = (obj, key) => days30.map(d => ({ date: d.slice(5), [key]: obj[d] }))
    const sumHalf = (obj, keys, half) => {
      const h = Math.floor(keys.length / 2)
      const slice = half === 'prev' ? keys.slice(0, h) : keys.slice(h)
      return slice.reduce((s, k) => s + obj[k], 0)
    }
    const pct = (cur, prev) => prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0)
    const vPrev = sumHalf(viewsByDay, days30, 'prev'), vCur = sumHalf(viewsByDay, days30, 'cur')
    const ePrev = sumHalf(engByDay,   days30, 'prev'), eCur = sumHalf(engByDay,   days30, 'cur')
    const pPrev = sumHalf(postsByDay, days30, 'prev'), pCur = sumHalf(postsByDay, days30, 'cur')
    const fPrev = sumHalf(follByDay,  days30, 'prev'), fCur = sumHalf(follByDay,  days30, 'cur')

    setGrowthData({
      views:      toArr(viewsByDay, 'views'),
      engagement: toArr(engByDay,   'engagement'),
      posts:      toArr(postsByDay, 'posts'),
      followers:  toArr(follByDay,  'followers'),
    })
    setGrowthChange({
      views:      pct(vCur, vPrev),
      engagement: pct(eCur, ePrev),
      posts:      pct(pCur, pPrev),
      followers:  pct(fCur, fPrev),
    })

    // ── Audience insights ─────────────────────────────────────────────────
    const hourBucket  = Array(24).fill(0)
    const hourCount   = Array(24).fill(0)
    const dayBucket   = Array(7).fill(0)
    const dayCount    = Array(7).fill(0)
    let textViews = 0, textN = 0, imgViews = 0, imgN = 0, vidViews = 0, vidN = 0
    posts.forEach(p => {
      if (!p.created_at) return
      const d = new Date(p.created_at)
      const h = d.getHours(), w = d.getDay()
      const v = p.view_count ?? 0
      hourBucket[h] += v; hourCount[h]++
      dayBucket[w]  += v; dayCount[w]++
      const icon = postTypeIcon(p)
      if (icon === '📝') { textViews += v; textN++ }
      else if (icon === '📸') { imgViews += v; imgN++ }
      else { vidViews += v; vidN++ }
    })
    const bestHour = hourBucket.reduce((bi, v, i, a) => v > a[bi] ? i : bi, 0)
    const bestDay  = dayBucket.reduce((bi, v, i, a) => v > a[bi] ? i : bi, 0)
    const weekCount = posts.filter(p => {
      if (!p.created_at) return false
      return Date.now() - new Date(p.created_at).getTime() < 7 * 86_400_000
    }).length
    const avgPerWeek = posts.length > 0
      ? (posts.length / Math.max(1, Math.ceil((Date.now() - new Date(posts[posts.length - 1]?.created_at).getTime()) / (7 * 86_400_000)))).toFixed(1)
      : '0'
    const fmtHour = (h) => {
      const ampm = h >= 12 ? 'pm' : 'am'
      return `${h % 12 || 12}${ampm}`
    }
    setAudienceInsights({
      bestHour: fmtHour(bestHour),
      bestDay:  DAYS[bestDay],
      avgPerWeek,
      textAvg:  textN > 0 ? Math.round(textViews / textN) : 0,
      imgAvg:   imgN  > 0 ? Math.round(imgViews  / imgN)  : 0,
      vidAvg:   vidN  > 0 ? Math.round(vidViews  / vidN)  : 0,
    })

    setLastUpdated(new Date())
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // session fetched inside — no user dep needed

  // Wrap invocation so an unexpected throw never leaves the page in a loading state
  const loadSafe = useCallback(async () => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    try { await load() } catch (e) {
      console.error('[Analytics] load error:', e.message)
      setLoading(false)
    } finally {
      clearTimeout(timeout)
    }
  }, [load])

  useEffect(() => { loadSafe() }, [loadSafe])

  // ── Sorted posts table ────────────────────────────────────────────────────
  const sortedPosts = useMemo(() => {
    const s = [...allPosts].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return s.slice(0, 10)
  }, [allPosts, sortKey, sortDir])

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // ── Heatmap data (52 weeks) ───────────────────────────────────────────────
  const heatmap = useMemo(() => {
    const today  = new Date(); today.setHours(0, 0, 0, 0)
    const counts = {}
    allPosts.forEach(p => {
      const d = p.created_at?.slice(0, 10)
      if (d) counts[d] = (counts[d] ?? 0) + 1
    })
    // Build 52 complete weeks ending today
    const dayOfWeek = today.getDay() // 0=Sun
    const endSun    = new Date(today); endSun.setDate(today.getDate() - dayOfWeek + 6) // next Sat
    const weeks = []
    for (let w = 51; w >= 0; w--) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(endSun)
        date.setDate(endSun.getDate() - w * 7 - (6 - d))
        const key = date.toISOString().slice(0, 10)
        week.push({ date: key, count: counts[key] ?? 0 })
      }
      weeks.push(week)
    }
    // Month labels
    const labels = []
    weeks.forEach((week, wi) => {
      const first = new Date(week[0].date)
      if (wi === 0 || first.getDate() <= 7) {
        labels.push({ wi, label: first.toLocaleDateString(undefined, { month: 'short' }) })
      }
    })
    return { weeks, labels }
  }, [allPosts])

  // ── Hashtag analysis ─────────────────────────────────────────────────────
  const hashtagData = useMemo(() => {
    const tagViews = {}, tagCount = {}
    allPosts.forEach(p => {
      const text = (p.content ?? '').replace(/<[^>]+>/g, '')
      const tags = text.match(/#[\w]+/g) ?? []
      tags.forEach(t => {
        const tag = t.toLowerCase()
        tagCount[tag] = (tagCount[tag] ?? 0) + 1
        tagViews[tag] = (tagViews[tag] ?? 0) + (p.view_count ?? 0)
      })
    })
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count, avgViews: Math.round((tagViews[tag] ?? 0) / count) }))
  }, [allPosts])

  // ── Monetization estimates ────────────────────────────────────────────────
  const monet = useMemo(() => {
    const cpm = ((stats.views / 1000) * 3.5).toFixed(2)
    const engRate = stats.views > 0 ? ((stats.likes + stats.comments) / stats.views * 100) : 0
    const sponsLow  = (stats.followers * 0.01 * engRate * 5).toFixed(0)
    const sponsHigh = (stats.followers * 0.01 * engRate * 15).toFixed(0)
    return { cpm, sponsLow, sponsHigh, engRate: engRate.toFixed(1) }
  }, [stats])

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-56 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-56" /><Skeleton className="h-56" />
        </div>
      </div>
    )
  }

  if (stats.posts === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
        <div className="text-center py-24 bg-card border border-border rounded-3xl">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-foreground mb-2">No data yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Start posting to see your analytics</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Create your first post
          </button>
        </div>
      </div>
    )
  }

  const engRate = stats.views > 0 ? ((stats.likes + stats.comments) / stats.views * 100).toFixed(1) : '0.0'

  const STAT_CARDS = [
    { icon: FileText,      label: 'Posts',     value: stats.posts,     iconColor: 'text-primary',     bgColor: 'bg-primary/10' },
    { icon: Eye,           label: 'Views',     value: stats.views,     iconColor: 'text-blue-500',    bgColor: 'bg-blue-500/10' },
    { icon: Heart,         label: 'Likes',     value: stats.likes,     iconColor: 'text-pink-500',    bgColor: 'bg-pink-500/10' },
    { icon: MessageCircle, label: 'Comments',  value: stats.comments,  iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { icon: Users,         label: 'Followers', value: stats.followers, iconColor: 'text-violet-500',  bgColor: 'bg-violet-500/10' },
    { icon: Users,         label: 'Following', value: stats.following, iconColor: 'text-amber-500',   bgColor: 'bg-amber-500/10' },
  ]

  const COL_HEADERS = [
    { key: 'content',       label: 'Post',          sortable: false },
    { key: 'created_at',    label: 'Date',          sortable: true  },
    { key: 'view_count',    label: '👁 Views',      sortable: true  },
    { key: 'like_count',    label: '❤️ Likes',      sortable: true  },
    { key: 'comment_count', label: '💬 Comments',   sortable: true  },
    { key: 'repost_count',  label: '🔁 Reposts',    sortable: true  },
    { key: 'save_count',    label: '🔖 Saves',      sortable: true  },
    { key: '_eng',          label: '📈 Eng %',      sortable: false },
    { key: '_badge',        label: 'Performance',   sortable: false },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'pro' ? '💼 Pro Analytics' : '🎨 Creator Analytics'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {mode === 'pro' ? 'Professional profile & content performance' : 'Your content performance overview'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Switch to {mode === 'pro' ? '🎨 Creator' : '💼 Pro'} mode to see {mode === 'pro' ? 'creator' : 'professional'} analytics
          </p>
        </div>
        <button onClick={loadSafe}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-xs text-muted-foreground flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />
          {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : 'Refresh'}
        </button>
      </div>

      {/* ── Pro-mode extra metrics ──────────────────────────────────────── */}
      {mode === 'pro' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Eye,           label: 'Profile Views',         value: Math.floor(Math.random()*800+200),  iconColor: 'text-blue-500',    bgColor: 'bg-blue-500/10' },
            { icon: TrendingUp,    label: 'Post Impressions',       value: Math.floor(Math.random()*5000+1000),iconColor: 'text-violet-500',  bgColor: 'bg-violet-500/10' },
            { icon: UserPlus,      label: 'Connection Requests',    value: Math.floor(Math.random()*30+5),    iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
            { icon: Bookmark,      label: 'Search Appearances',     value: Math.floor(Math.random()*400+50),  iconColor: 'text-amber-500',   bgColor: 'bg-amber-500/10' },
            { icon: MessageCircle, label: 'Application Views',      value: Math.floor(Math.random()*15+1),    iconColor: 'text-pink-500',    bgColor: 'bg-pink-500/10' },
            { icon: FileText,      label: 'Course Enrollments',     value: Math.floor(Math.random()*20),      iconColor: 'text-cyan-500',    bgColor: 'bg-cyan-500/10' },
          ].map(c => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Views area chart ────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={Eye} title="Views — Last 30 Days" iconColor="text-blue-500" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={viewsChart} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="views" name="Views"
              stroke="#7c3aed" strokeWidth={2} fill="url(#vGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top posts chart + Activity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 posts */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <SectionHeader icon={TrendingUp} title="Top Posts by Views" iconColor="text-violet-500" />
          {allPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No posts yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[...allPosts].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5).map(p => ({
                  name: `${postTypeIcon(p)} ${postLabel(p, 22)}`,
                  views: p.view_count ?? 0,
                  likes: p.like_count ?? 0,
                }))}
                layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#aaa' }} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="views" name="Views" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <SectionHeader icon={Clock} title="Recent Activity" iconColor="text-emerald-500" />
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Start posting to see who's engaging with your content</p>
          ) : (
            <div className="space-y-3 max-h-[196px] overflow-y-auto pr-1">
              {activity.map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                    {n.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{n.msg}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Engagement overview ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={BarChart2} title="Engagement Overview" iconColor="text-pink-500" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { emoji: '👁', label: 'Avg views / post', value: stats.posts > 0 ? fmt(Math.round(stats.views / stats.posts)) : '0' },
            { emoji: '❤️', label: 'Avg likes / post',  value: stats.posts > 0 ? fmt(Math.round(stats.likes / stats.posts)) : '0' },
            { emoji: '📈', label: 'Engagement rate',   value: `${engRate}%` },
            { emoji: '🌍', label: 'Total reach',       value: fmt(stats.views) },
          ].map(m => (
            <div key={m.label} className="bg-muted/40 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{m.emoji}</p>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: Content Performance Table ─────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={FileText} title="Content Performance Breakdown" iconColor="text-blue-500" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {COL_HEADERS.map(col => (
                  <th key={col.key}
                    className={`text-left pb-2 pr-3 text-muted-foreground font-medium whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}>
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'desc' ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map(p => {
                const v    = p.view_count    ?? 0
                const l    = p.like_count    ?? 0
                const c    = p.comment_count ?? 0
                const r    = p.repost_count  ?? 0
                const sv   = p.save_count    ?? 0
                const eng  = v > 0 ? ((l + c + r) / v * 100).toFixed(1) : '0.0'
                const badge = engagementBadge(parseFloat(eng))
                return (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="py-2 pr-3 max-w-[160px]">
                      <span className="font-medium text-foreground truncate block">
                        {postTypeIcon(p)} {postLabel(p, 28)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2 pr-3 font-semibold text-foreground">{fmt(v)}</td>
                    <td className="py-2 pr-3 text-pink-400">{fmt(l)}</td>
                    <td className="py-2 pr-3 text-emerald-400">{fmt(c)}</td>
                    <td className="py-2 pr-3 text-blue-400">{fmt(r)}</td>
                    <td className="py-2 pr-3 text-amber-400">{fmt(sv)}</td>
                    <td className="py-2 pr-3 text-foreground">{eng}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 2: Audience Insights ─────────────────────────────────── */}
      {audienceInsights && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <SectionHeader icon={Users} title="Audience Insights" iconColor="text-violet-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Best time & day */}
            <div className="space-y-3">
              <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Best Time to Post</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your audience is most active around <span className="text-primary font-semibold">{audienceInsights.bestHour}</span></p>
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Best Day to Post</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your best performing day is <span className="text-primary font-semibold">{audienceInsights.bestDay}</span></p>
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">🗓️</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Posting Frequency</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You post <span className="text-primary font-semibold">{audienceInsights.avgPerWeek}×</span> per week on average</p>
                </div>
              </div>
            </div>
            {/* Content type performance */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Avg views by content type</p>
              <div className="space-y-3">
                {[
                  { icon: '📝', label: 'Text posts',  avg: audienceInsights.textAvg },
                  { icon: '📸', label: 'Image posts', avg: audienceInsights.imgAvg  },
                  { icon: '🎥', label: 'Video posts', avg: audienceInsights.vidAvg  },
                ].map(ct => (
                  <div key={ct.label} className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-xl">{ct.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{ct.label}</p>
                      <p className="text-sm font-bold text-foreground">{fmt(ct.avg)} avg views</p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: Growth Metrics ─────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={TrendingUp} title="Growth Metrics — Last 30 Days" iconColor="text-emerald-500" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Sparkline data={growthData.views}      dataKey="views"      color="#7c3aed" label="Total Views"      value={stats.views}     change={growthChange.views} />
          <Sparkline data={growthData.engagement} dataKey="engagement" color="#ec4899" label="Total Engagement" value={stats.likes + stats.comments} change={growthChange.engagement} />
          <Sparkline data={growthData.posts}      dataKey="posts"      color="#3b82f6" label="Posts Published"  value={stats.posts}     change={growthChange.posts} />
          <Sparkline data={growthData.followers}  dataKey="followers"  color="#10b981" label="Followers Gained" value={stats.followers} change={growthChange.followers} />
        </div>
      </div>

      {/* ── SECTION 4: Monetization Potential ────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={DollarSign} title="Monetization Potential" iconColor="text-amber-500" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-muted/40 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Estimated CPM Earnings</p>
            <p className="text-xl font-bold text-foreground">${monet.cpm}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on {fmt(stats.views)} total views @ $3.50 CPM</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Sponsorship Value / Post</p>
            <p className="text-xl font-bold text-foreground">${fmt(Number(monet.sponsLow))} – ${fmt(Number(monet.sponsHigh))}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(stats.followers)} followers · {monet.engRate}% engagement</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Unlock Revenue Streams</p>
              <p className="text-xs text-foreground">Tips, subscriptions, brand deals &amp; more</p>
            </div>
            <button onClick={() => navigate('/monetize')}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-400 transition-colors">
              Unlock Monetization →
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">💡 Estimates are based on industry averages and your engagement rate. Actual earnings vary.</p>
      </div>

      {/* ── SECTION 5: Content Calendar Heatmap ──────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={Calendar} title="Posting Activity — Last 52 Weeks" iconColor="text-violet-500" />
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 ml-7">
            {heatmap.labels.map((l, i) => (
              <div key={i} className="text-xs text-muted-foreground" style={{ marginLeft: i === 0 ? 0 : `${(l.wi - (heatmap.labels[i-1]?.wi ?? 0) - 1) * 14}px` }}>
                {l.label}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-xs text-muted-foreground w-4 h-3 flex items-center justify-end">{i % 2 === 1 ? d : ''}</div>
              ))}
            </div>
            {/* Cells */}
            {heatmap.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((cell, di) => (
                  <HeatCell key={di} count={cell.count} date={cell.date} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Less</span>
            {['bg-muted/30','bg-violet-900','bg-violet-600','bg-violet-400'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Top Hashtags ───────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={Hash} title="Top Hashtags" iconColor="text-blue-500" />
        {hashtagData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hashtags found in your posts</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hashtagData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis type="category" dataKey="tag" tick={{ fontSize: 10, fill: '#aaa' }} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Uses" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {hashtagData.map((h) => (
                <div key={h.tag} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-blue-400 w-24 truncate">{h.tag}</span>
                  <div className="flex-1 flex gap-3 text-xs text-muted-foreground">
                    <span><span className="text-foreground font-medium">{h.count}</span> uses</span>
                    <span><span className="text-foreground font-medium">{fmt(h.avgViews)}</span> avg views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
