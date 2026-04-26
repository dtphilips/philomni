import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BarChart2, Heart, MessageCircle, Users, FileText, TrendingUp, Loader2 } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 ${color.replace('text-', 'bg-').replace('500', '500/15')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ posts: 0, totalLikes: 0, totalComments: 0, followers: 0 })
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('posts').select('id, like_count, comment_count, content, created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
    ]).then(([postsRes, followsRes]) => {
      const posts = postsRes.data ?? []
      setRecentPosts(posts)
      setStats({
        posts: posts.length,
        totalLikes: posts.reduce((s, p) => s + (p.like_count ?? 0), 0),
        totalComments: posts.reduce((s, p) => s + (p.comment_count ?? 0), 0),
        followers: followsRes.count ?? 0,
      })
      setLoading(false)
    })
  }, [user?.id])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={FileText} label="Posts" value={stats.posts} />
        <StatCard icon={Heart} label="Total Likes" value={stats.totalLikes} color="text-pink-500" />
        <StatCard icon={MessageCircle} label="Comments" value={stats.totalComments} color="text-blue-500" />
        <StatCard icon={Users} label="Followers" value={stats.followers} color="text-emerald-500" />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">Recent Posts Performance</h2>
      {recentPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No posts yet</div>
      ) : (
        <div className="space-y-2">
          {recentPosts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{p.content?.slice(0, 80) ?? 'Post'}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-500" /> {p.like_count ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-blue-500" /> {p.comment_count ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
