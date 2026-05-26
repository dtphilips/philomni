import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { PLAN_META } from '@/lib/plans'
import {
  Crown, Sparkles, Zap, ArrowRight, RefreshCw,
  MessageSquare, Image, Briefcase, Rocket, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

const stripeReady =
  !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
  !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('your-')

function UsageBar({ label, icon: Icon, used, limit, color = 'bg-primary' }) {
  const isUnlimited = limit === '∞'
  const pct  = isUnlimited ? 0 : Math.min(100, Math.round((used / Number(limit)) * 100))
  const near = pct >= 80
  const full = pct >= 100

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          {label}
        </div>
        <span className={`text-xs font-mono ${full ? 'text-destructive' : near ? 'text-amber-400' : 'text-muted-foreground'}`}>
          {isUnlimited ? '∞ unlimited' : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${full ? 'bg-destructive' : near ? 'bg-amber-400' : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function PlanIcon({ plan }) {
  if (plan === 'promax') return <Sparkles className="w-6 h-6 text-purple-400" />
  if (plan === 'pro')    return <Crown    className="w-6 h-6 text-primary"     />
  return                        <Zap      className="w-6 h-6 text-muted-foreground" />
}

export default function Billing() {
  const { user }                                       = useAuth()
  const { plan, usageDisplay, loadingUsage, refreshUsage } = useSubscription()
  const navigate                                       = useNavigate()
  const [portalLoading, setPortalLoading]              = useState(false)

  const meta    = PLAN_META[plan] || PLAN_META.free
  const isPaid  = plan === 'pro' || plan === 'promax'

  // ── Open Stripe billing portal ───────────────────────────────────────────
  const openPortal = async () => {
    if (!user?.stripe_customer_id) {
      toast.error('No billing account found. Please contact support.')
      return
    }
    if (!stripeReady) {
      toast.info('Billing portal is not configured yet.')
      return
    }
    setPortalLoading(true)
    try {
      const res  = await fetch('/api/stripe-portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ customerId: user.stripe_customer_id }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      toast.error(`Could not open billing portal: ${err.message}`)
    }
    setPortalLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your plan and track your usage</p>
      </div>

      {/* ── Current plan card ──────────────────────────────────────────────── */}
      <div className={[
        'rounded-2xl border p-6',
        plan === 'promax' ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-card'
          : plan === 'pro' ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-card'
          : 'border-border bg-card',
      ].join(' ')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              plan === 'promax' ? 'bg-purple-500/10' : plan === 'pro' ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <PlanIcon plan={plan} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current Plan</p>
              <p className="text-xl font-bold text-foreground">{meta.name}</p>
              {meta.price_monthly > 0 && (
                <p className="text-sm text-muted-foreground">
                  ${meta.price_monthly}/month
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {isPaid ? (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-60"
              >
                {portalLoading ? 'Opening…' : 'Manage Subscription'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {user?.plan_expires_at && (
              <p className="text-[11px] text-muted-foreground text-right">
                Renews {new Date(user.plan_expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Usage this period ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Usage this period</h2>
          <button
            onClick={refreshUsage}
            disabled={loadingUsage}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            title="Refresh usage"
          >
            <RefreshCw className={`w-4 h-4 ${loadingUsage ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingUsage || !usageDisplay ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <UsageBar
              label="AI Messages (daily)"
              icon={MessageSquare}
              used={usageDisplay.aiMessages.used}
              limit={usageDisplay.aiMessages.limit}
            />
            <UsageBar
              label="Image Generations (daily)"
              icon={Image}
              used={usageDisplay.imageGen.used}
              limit={usageDisplay.imageGen.limit}
              color="bg-purple-500"
            />
            <UsageBar
              label="Job Applications (monthly)"
              icon={Briefcase}
              used={usageDisplay.jobApplications.used}
              limit={usageDisplay.jobApplications.limit}
              color="bg-blue-500"
            />
            <UsageBar
              label="Pitch Vault Uploads (monthly)"
              icon={Rocket}
              used={usageDisplay.pitchUploads.used}
              limit={usageDisplay.pitchUploads.limit}
              color="bg-amber-500"
            />
          </div>
        )}

        {usageDisplay?.resetDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
            <Calendar className="w-3.5 h-3.5" />
            Daily limits reset each day · Monthly limits reset on the 1st
          </div>
        )}
      </div>

      {/* ── Upgrade nudge for free users ──────────────────────────────────── */}
      {plan === 'free' && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <Crown className="w-8 h-8 text-primary mx-auto" />
          <h3 className="font-semibold text-foreground">Unlock more with Pro</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            200 AI messages/day, 10 image generations, unlimited job applications, Rooms access, and more.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            View Plans
          </button>
        </div>
      )}

      {/* ── Pro Max nudge for Pro users ────────────────────────────────────── */}
      {plan === 'pro' && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground text-sm">Upgrade to Pro Max</p>
            <p className="text-xs text-muted-foreground mt-0.5">Unlimited AI, video generation, voice AI & Business API</p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/25 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explore
          </button>
        </div>
      )}
    </div>
  )
}
