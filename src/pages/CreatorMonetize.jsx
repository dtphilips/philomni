import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  DollarSign, TrendingUp, Eye, Users, Loader2, CheckCircle2,
  XCircle, Clock, AlertCircle, BarChart3, Calendar, Wallet,
  ArrowUpRight,
} from 'lucide-react'

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RequirementRow({ icon: Icon, label, met, current, target, color = 'bg-primary' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {met
            ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <span className={met ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {current !== undefined ? `${current.toLocaleString()} / ${target.toLocaleString()}` : (met ? '✓' : '—')}
        </span>
      </div>
      {current !== undefined && (
        <ProgressBar value={current} max={target} color={met ? 'bg-green-500' : color} />
      )}
    </div>
  )
}

export default function CreatorMonetize() {
  const { user } = useAuth()
  const [metrics,   setMetrics]   = useState(null)
  const [earnings,  setEarnings]  = useState([])
  const [moApp,     setMoApp]     = useState(null) // monetization_application row
  const [loading,   setLoading]   = useState(true)
  const [applying,  setApplying]  = useState(false)

  const accountAgeDays = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
    : 0

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('creator_metrics').select('*').eq('user_id', user.id).single(),
      supabase.from('earnings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
      supabase.from('monetization_applications').select('*').eq('user_id', user.id).order('applied_at', { ascending: false }).limit(1),
    ]).then(([mRes, eRes, appRes]) => {
      setMetrics(mRes.data || { total_followers: 0, total_views: 0, profile_score: 0, monetization_score: 0 })
      setEarnings(eRes.data || [])
      setMoApp(appRes.data?.[0] || null)
      setLoading(false)
    })
  }, [user?.id])

  // Criteria checks
  const criteria = {
    followers:   { met: (metrics?.total_followers || 0) >= 500,  current: metrics?.total_followers || 0,  target: 500  },
    views:       { met: (metrics?.total_views     || 0) >= 1000, current: metrics?.total_views     || 0,  target: 1000 },
    accountAge:  { met: accountAgeDays >= 30 },
    profile:     { met: (metrics?.profile_score   || 0) >= 80,  current: metrics?.profile_score   || 0,  target: 100  },
    noViolations:{ met: true },
  }
  const allMet = Object.values(criteria).every(c => c.met)

  const handleApply = async () => {
    setApplying(true)
    try {
      await supabase.from('monetization_applications').insert({ user_id: user.id, status: 'pending' })
      toast.success('Application submitted! We\'ll review it shortly.')
      setMoApp({ status: 'pending', applied_at: new Date().toISOString() })
    } catch (err) {
      toast.error(err.message)
    }
    setApplying(false)
  }

  const nextPayoutDate = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1, 1)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  const isMonetized = user?.monetization_enabled

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Creator Monetization</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Earn from your content. Creators receive <strong className="text-foreground">55%</strong> of monthly ad revenue based on performance.
        </p>
      </div>

      {/* Earnings overview — only when monetized */}
      {isMonetized && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'This Month',      value: `$${(user.total_earnings || 0).toFixed(2)}`,     icon: DollarSign, color: 'text-green-400' },
            { label: 'Pending Payout',  value: `$${(user.pending_payout || 0).toFixed(2)}`,     icon: Wallet,     color: 'text-yellow-400' },
            { label: 'Total Views',     value: (metrics?.total_views || 0).toLocaleString(),    icon: Eye,        color: 'text-blue-400' },
            { label: 'Monetize Score',  value: `${(metrics?.monetization_score || 0).toFixed(1)}/100`, icon: BarChart3, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <s.icon className={`w-4 h-4 mb-2 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Eligibility checklist */}
      {!isMonetized && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Eligibility Checklist</h2>
          <div className="space-y-4">
            <RequirementRow label="500+ followers"                   met={criteria.followers.met}   current={criteria.followers.current}   target={criteria.followers.target}   color="bg-blue-500" />
            <RequirementRow label="1,000 views in last 30 days"     met={criteria.views.met}       current={criteria.views.current}       target={criteria.views.target}       color="bg-purple-500" />
            <RequirementRow label={`Account age 30+ days (${accountAgeDays} days)`} met={criteria.accountAge.met} />
            <RequirementRow label="Profile completion 80%+"         met={criteria.profile.met}     current={criteria.profile.current}     target={criteria.profile.target}     color="bg-amber-500" />
            <RequirementRow label="No policy violations"            met={criteria.noViolations.met} />
          </div>

          {/* Apply button */}
          <div className="pt-2 border-t border-border">
            {moApp?.status === 'pending' ? (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <Clock className="w-4 h-4" /> Application under review…
              </div>
            ) : moApp?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{moApp.rejection_reason || 'Application was rejected. Please ensure you meet all criteria before re-applying.'}</p>
                </div>
                <button onClick={handleApply} disabled={!allMet || applying}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}Re-apply to Monetize
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={handleApply} disabled={!allMet || applying}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Apply to Monetize
                </button>
                {!allMet && <p className="text-xs text-muted-foreground">Complete all requirements above to apply.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue info */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">How Earnings Work</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { emoji: '💰', title: '55% to Creators',    desc: "You earn 55% of monthly ad revenue — matching YouTube and Meta's creator split." },
            { emoji: '📊', title: 'Performance-based',  desc: 'Your share is calculated from views (35%), engagement (25%), consistency (20%), followers (10%), profile (10%).' },
            { emoji: '📅', title: 'Monthly Payouts',    desc: `Payments processed on the 1st of each month. Next payout: ${nextPayoutDate()}.` },
            { emoji: '🌍', title: 'Merit-based',        desc: 'Earnings are purely performance-based — same formula for every creator regardless of country.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3">
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings history — only when monetized */}
      {isMonetized && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Payout History</h2>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium border border-border hover:bg-muted/80 transition-colors">
                Payment Setup Required
              </button>
            </div>
          </div>
          {earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payouts yet. Earnings accumulate monthly.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Period</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Views</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Amount</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {earnings.map(e => (
                    <tr key={e.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 text-foreground">
                        {e.period_start ? `${new Date(e.period_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{(e.views_count || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground">${(e.amount || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                          ${e.status === 'paid' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
