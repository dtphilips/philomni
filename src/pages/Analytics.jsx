import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  FileText, Heart, MessageCircle, Users, Eye,
  Loader2, Repeat2, Bookmark, ArrowUp, ArrowDown, Minus,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, prev = 0, iconColor, bgColor }) {
  const diff = value - prev
  const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : null
  const up   = diff > 0
  const down = diff < 0

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{fmt(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {pct !== null && (
        <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-500' : down ? 'text-red-500' : 'text-muted-foreground'}`}>
          {up ? <ArrowUp className="w-3 h-3" /> : down ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(Number(pct))}% vs last 7d
        </div>
      )}
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

// ─── Main Analytics Page ──────────────────────────────────────────────────────

export default function Analytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ posts: 0, views: 0, likes: 0, comments: 0, followers: 0, following: 0 })
  const [viewsChart, setViewsChart] = useState([])   // [{date, views}]
  const [topPosts, setTopPosts]     = useState([])   // [{name, views, likes}]
  const [activity, setActivity]     = useState([])   // notifications

  useEffect(() => {
    if (!user?.id) return

    Promise.all([
      supabase.from('posts')
        .select('id, view_count, like_count, comment_count, repost_count, content, created_at, media_urls')
        .eq('author_id', user.id)
        .order('view_count', { ascending: false }),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
      supabase.from('notifications').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([postsRes, follRes, followingRes, notifRes]) => {
      const posts = postsRes.data ?? []

      const totalViews    = posts.reduce((s, p) => s + (p.view_count ?? 0), 0)
      const totalLikes    = posts.reduce((s, p) => s + (p.like_count ?? 0), 0)
      const totalComments = posts.reduce((s, p) => s + (p.comment_count ?? 0), 0)

      setStats({
        posts:     posts.length,
        views:     totalViews,
        likes:     totalLikes,
        comments:  totalComments,
        followers: follRes.count ?? 0,
        following: followingRes.count ?? 0,
      })

      // Views per day for last 30 days (bucketed by post created_at)
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

      // Top 5 posts by views
      setTopPosts(
        posts.slice(0, 5).map(p => ({
          name:  (p.content?.replace(/<[^>]+>/g, '') ?? '').slice(0, 22) || 'Post',
          views: p.view_count ?? 0,
          likes: p.like_count ?? 0,
        }))
      )

      setActivity(notifRes.data ?? [])
      setLoading(false)
    })
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  // Empty state
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

  const engRate = stats.views > 0
    ? ((stats.likes + stats.comments) / stats.views * 100).toFixed(1)
    : '0.0'

  const STAT_CARDS = [
    { icon: FileText,      label: 'Posts',     value: stats.posts,     iconColor: 'text-primary',     bgColor: 'bg-primary/10' },
    { icon: Eye,           label: 'Views',     value: stats.views,     iconColor: 'text-blue-500',    bgColor: 'bg-blue-500/10' },
    { icon: Heart,         label: 'Likes',     value: stats.likes,     iconColor: 'text-pink-500',    bgColor: 'bg-pink-500/10' },
    { icon: MessageCircle, label: 'Comments',  value: stats.comments,  iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { icon: Users,         label: 'Followers', value: stats.followers, iconColor: 'text-violet-500',  bgColor: 'bg-violet-500/10' },
    { icon: Users,         label: 'Following', value: stats.following, iconColor: 'text-amber-500',   bgColor: 'bg-amber-500/10' },
  ]

  const NOTIF_ICONS = { like: '❤️', comment: '💬', follow: '👤', repost: '🔁' }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your content performance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Views area chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">Views — Last 30 Days</h2>
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

      {/* Top posts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 posts */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Top Posts by Views</h2>
          {topPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No posts yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topPosts} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#888' }} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="views" name="Views" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-[196px] overflow-y-auto pr-1">
              {activity.map((n, i) => (
                <div key={n.id ?? i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                    {NOTIF_ICONS[n.type] ?? '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{n.message ?? n.type ?? 'Notification'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engagement summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">Engagement Overview</h2>
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
    </div>
  )
}
