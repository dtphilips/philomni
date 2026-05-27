import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  DollarSign, TrendingUp, Eye, Users, Loader2, CheckCircle2,
  XCircle, Clock, AlertCircle, BarChart3, Wallet, Sparkles,
  SlidersHorizontal, Bell,
} from 'lucide-react'

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Requirement row ───────────────────────────────────────────────────────────
function RequirementRow({ label, met, current, target, color = 'bg-primary' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {met
            ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <span className={met ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {current !== undefined
            ? `${current.toLocaleString()} / ${target.toLocaleString()}`
            : met ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 inline" /> : '—'}
        </span>
      </div>
      {current !== undefined && (
        <ProgressBar value={current} max={target} color={met ? 'bg-green-500' : color} />
      )}
    </div>
  )
}

// ── Earnings estimator ────────────────────────────────────────────────────────
function EarningsEstimator({ metrics }) {
  const [views,       setViews]       = useState(metrics?.total_views || 50000)
  const [engagement,  setEngagement]  = useState(5)

  const bonus = 1 + engagement / 100
  const low   = ((views / 1000) * 0.002 * bonus)
  const high  = ((views / 1000) * 0.008 * bonus)

  const fmt = (n) => n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(0)}`

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground mb-0.5">Estimate Your Monthly Earnings</h2>
        <p className="text-xs text-muted-foreground">Based on your current performance</p>
      </div>

      {/* Views slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="text-muted-foreground">Monthly views</label>
          <span className="font-semibold text-foreground tabular-nums">{views.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000000}
          step={5000}
          value={views}
          onChange={e => setViews(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>0</span>
          <span>250k</span>
          <span>500k</span>
          <span>750k</span>
          <span>1M</span>
        </div>
      </div>

      {/* Engagement slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="text-muted-foreground">Engagement rate</label>
          <span className="font-semibold text-foreground tabular-nums">{engagement}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={engagement}
          onChange={e => setEngagement(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>1%</span>
          <span>5%</span>
          <span>10%</span>
          <span>15%</span>
          <span>20%</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Estimated monthly earnings</p>
          <p className="text-2xl font-bold text-primary tabular-nums">
            {fmt(low)} &ndash; {fmt(high)}
          </p>
        </div>
        <Sparkles className="w-8 h-8 text-primary/40" />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Actual earnings depend on platform ad revenue and your relative performance among all monetized creators.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CreatorMonetize() {
  const { user } = useAuth()
  const [metrics,    setMetrics]    = useState(null)
  const [earnings,   setEarnings]   = useState([])
  const [moApp,      setMoApp]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [applying,   setApplying]   = useState(false)
  const [waitlisted, setWaitlisted] = useState(false)

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
      const app = appRes.data?.[0] || null
      setMoApp(app)
      if (app) setWaitlisted(true)
      setLoading(false)
    })
  }, [user?.id])

  // Criteria
  const criteria = {
    followers:    { label: '500 followers minimum',            met: (metrics?.total_followers || 0) >= 500,  current: metrics?.total_followers || 0,  target: 500,  color: 'bg-blue-500'   },
    views:        { label: '1,000 views in last 30 days',      met: (metrics?.total_views     || 0) >= 1000, current: metrics?.total_views     || 0,  target: 1000, color: 'bg-purple-500' },
    accountAge:   { label: `Account at least 30 days old (${accountAgeDays} days)`, met: accountAgeDays >= 30 },
    profile:      { label: 'Profile completion 80%+',          met: (metrics?.profile_score   || 0) >= 80,  current: metrics?.profile_score   || 0,  target: 100,  color: 'bg-amber-500'  },
    noViolations: { label: 'No policy violations',             met: true },
  }
  const allMet = Object.values(criteria).every(c => c.met)

  const handleApply = async () => {
    setApplying(true)
    try {
      await supabase.from('monetization_applications').insert({ user_id: user.id, status: 'pending' })
      toast.success("Application submitted! We'll review it shortly.")
      setMoApp({ status: 'pending', applied_at: new Date().toISOString() })
    } catch (err) {
      toast.error(err.message)
    }
    setApplying(false)
  }

  const handleEarlyAccess = async () => {
    if (!user?.id) return
    setApplying(true)
    try {
      // Upsert so double-clicks don't throw
      await supabase.from('monetization_applications').upsert(
        { user_id: user.id, status: 'waitlist' },
        { onConflict: 'user_id' }
      )
      setWaitlisted(true)
      toast.success("You're on the waitlist! We'll notify you when the Creator Fund launches.")
    } catch {
      toast.error('Could not save your application. Please try again.')
    }
    setApplying(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  const isMonetized = user?.monetization_enabled

  // How Earnings Work cards — no split percentages
  const HOW_CARDS = [
    {
      emoji: '👁',
      title: 'Earn From Your Views',
      desc:  'Every view on your posts and reels contributes to your monthly earnings.',
    },
    {
      emoji: '📊',
      title: 'Performance-based',
      desc:  'Your share is calculated from views, engagement, consistency, followers, and profile strength.',
    },
    {
      emoji: '📅',
      title: 'Monthly Payouts',
      desc:  'Payments processed on the 1st of each month directly to your account.',
    },
    {
      emoji: '🌍',
      title: 'Same for Everyone',
      desc:  'Earnings are purely merit-based — same formula for every creator regardless of country.',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Creator Monetization</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Earn from your content. Get paid based on your views, engagement, and performance.
        </p>
      </div>

      {/* ── Earnings overview (monetized only) ── */}
      {isMonetized && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'This Month',     value: `$${(user.total_earnings   || 0).toFixed(2)}`,                   icon: DollarSign, color: 'text-green-400'  },
            { label: 'Pending Payout', value: `$${(user.pending_payout   || 0).toFixed(2)}`,                   icon: Wallet,     color: 'text-yellow-400' },
            { label: 'Total Views',    value: (metrics?.total_views       || 0).toLocaleString(),              icon: Eye,        color: 'text-blue-400'   },
            { label: 'Perf. Score',    value: `${(metrics?.monetization_score || 0).toFixed(1)}/100`,          icon: BarChart3,  color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <s.icon className={`w-4 h-4 mb-2 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Eligibility checklist ── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-semibold text-foreground">Monetization Requirements</h2>
        <div className="space-y-4">
          {Object.values(criteria).map(c => (
            <RequirementRow
              key={c.label}
              label={c.label}
              met={c.met}
              current={c.current}
              target={c.target}
              color={c.color}
            />
          ))}
        </div>

        {/* Apply CTA */}
        {!isMonetized && (
          <div className="pt-2 border-t border-border">
            {moApp?.status === 'pending' ? (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <Clock className="w-4 h-4 flex-shrink-0" /> Application under review&hellip;
              </div>
            ) : moApp?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">
                    {moApp.rejection_reason || 'Application was rejected. Please ensure you meet all criteria before re-applying.'}
                  </p>
                </div>
                <button onClick={handleApply} disabled={!allMet || applying}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Re-apply to Monetize
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={handleApply} disabled={!allMet || applying}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Apply to Monetize
                </button>
                {!allMet && (
                  <p className="text-xs text-muted-foreground">Complete all requirements above to apply.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── How Earnings Work (no % disclosures) ── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">How Earnings Work</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {HOW_CARDS.map(item => (
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

      {/* ── Earnings Estimator ── */}
      <EarningsEstimator metrics={metrics} />

      {/* ── Payout history (monetized only) ── */}
      {isMonetized && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Payout History</h2>
            <button className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium border border-border hover:bg-muted/80 transition-colors">
              Payment Setup Required
            </button>
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
                        {e.period_start
                          ? new Date(e.period_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{(e.views_count || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground">${(e.amount || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          e.status === 'paid' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
                        }`}>
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

      {/* ── Creator Fund waitlist banner ── */}
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-bold text-foreground">Philomni Creator Fund</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          The Philomni Creator Fund launches when the platform reaches{' '}
          <strong className="text-foreground">10,000 active creators</strong>.
          Apply now to be first in line.
        </p>
        {waitlisted ? (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            You&apos;re on the waitlist!
          </div>
        ) : (
          <button
            onClick={handleEarlyAccess}
            disabled={applying}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Apply for Early Access
          </button>
        )}
      </div>

    </div>
  )
}
