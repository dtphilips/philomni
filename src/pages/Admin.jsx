import React from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Users, FileText, Briefcase, Lightbulb, Shield, Loader2,
  BadgeCheck, DollarSign, Megaphone, ArrowRight,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/categories'

export default function Admin() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  // Guard — require is_admin
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const { data: users   = [], isLoading: usersLoading }  = useQuery({ queryKey: ['admin-users'],   queryFn: () => supabase.from('users').select('*').then(r => r.data || []) })
  const { data: posts   = [] } = useQuery({ queryKey: ['admin-posts'],   queryFn: () => supabase.from('posts').select('*').then(r => r.data || []) })
  const { data: jobs    = [] } = useQuery({ queryKey: ['admin-jobs'],    queryFn: () => supabase.from('jobs').select('*').then(r => r.data || []) })
  const { data: pitches = [] } = useQuery({ queryKey: ['admin-pitches'], queryFn: () => supabase.from('pitches').select('*').then(r => r.data || []) })

  // Pending counts for the new modules
  const { data: pendingBadges     = [] } = useQuery({ queryKey: ['admin-pending-badges'],  queryFn: () => supabase.from('badge_applications').select('id').eq('status','pending').then(r => r.data || []) })
  const { data: pendingMonetize   = [] } = useQuery({ queryKey: ['admin-pending-mono'],    queryFn: () => supabase.from('monetization_applications').select('id').eq('status','pending').then(r => r.data || []) })
  const { data: pendingAds        = [] } = useQuery({ queryKey: ['admin-pending-ads'],     queryFn: () => supabase.from('ads').select('id').eq('status','pending').then(r => r.data || []) })
  const { data: activeAdStats     = [] } = useQuery({ queryKey: ['admin-ad-stats'],        queryFn: () => supabase.from('ads').select('spent,total_views').eq('status','active').then(r => r.data || []) })
  const { data: creatorPayouts    = [] } = useQuery({ queryKey: ['admin-payouts'],         queryFn: () => supabase.from('earnings').select('amount').eq('status','pending').then(r => r.data || []) })

  const totalAdRevenue   = activeAdStats.reduce((s, a) => s + (a.spent || 0), 0)
  const totalPayoutsDue  = creatorPayouts.reduce((s, e) => s + (e.amount || 0), 0)

  // Top-level platform stats
  const platformStats = [
    { icon: Users,     label: 'Total Users',   value: users.length,                              color: 'text-blue-400'   },
    { icon: FileText,  label: 'Total Posts',   value: posts.length,                              color: 'text-green-400'  },
    { icon: Briefcase, label: 'Active Jobs',   value: jobs.filter(j => j.status === 'open').length, color: 'text-amber-400' },
    { icon: Lightbulb, label: 'Pitches',       value: pitches.length,                            color: 'text-purple-400' },
  ]

  // Module shortcut cards
  const moduleCards = [
    {
      icon: BadgeCheck, title: 'Badge Applications', color: 'text-blue-400', bg: 'bg-blue-400/10',
      count: pendingBadges.length, label: 'pending', href: '/admin/badges',
    },
    {
      icon: DollarSign, title: 'Monetization', color: 'text-green-400', bg: 'bg-green-400/10',
      count: pendingMonetize.length, label: 'pending', href: '/admin/monetize',
    },
    {
      icon: Megaphone, title: 'Ad Review', color: 'text-yellow-400', bg: 'bg-yellow-400/10',
      count: pendingAds.length, label: 'pending', href: '/admin/ads',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      </div>

      {/* Platform overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & payout summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">${totalAdRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Ad revenue this month (active campaigns)</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">${totalPayoutsDue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Creator payouts pending</p>
          </div>
        </div>
      </div>

      {/* Module quick-access cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Review Queues</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {moduleCards.map(m => (
            <button key={m.href} onClick={() => navigate(m.href)}
              className="bg-card rounded-xl border border-border p-5 text-left hover:border-primary/40 hover:bg-muted/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-0.5">{m.title}</p>
              <p className={`text-2xl font-bold ${m.count > 0 ? m.color : 'text-foreground'}`}>{m.count}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Users / Posts / Jobs tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {usersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-sm font-medium text-muted-foreground">{u.full_name?.[0]}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.is_admin && <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">Admin</Badge>}
                    <Badge variant="secondary" className="text-xs capitalize">{ROLE_LABELS[u.role] || u.role || 'none'}</Badge>
                    <Badge variant={u.plan === 'pro' || u.plan === 'promax' ? 'default' : 'outline'} className="text-xs">{u.plan || 'free'}</Badge>
                    {u.badge_type && u.badge_status === 'approved' && (
                      <Badge className={`text-xs capitalize ${u.badge_type === 'blue' ? 'bg-blue-500/20 text-blue-300' : u.badge_type === 'gold' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {u.badge_type} ✓
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{post.content?.slice(0, 80)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.like_count || 0} likes</span>
                  <Button variant="ghost" size="sm" className="text-destructive h-7">Flag</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.poster_name}</p>
                </div>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs capitalize">{job.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
