import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  DollarSign, TrendingUp, Gift, Users, ShoppingBag, Mic2,
  ArrowRight, Check, Globe, Zap, Star, ChevronDown, ChevronUp,
  CreditCard, Building2, Smartphone, ExternalLink,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Static data ──────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'fund',
    icon: '💰',
    label: 'Creator Fund',
    tagline: 'Get paid for your content directly',
    desc: 'Earn based on views, engagement, and time on platform. No minimum follower count. Every creator qualifies.',
    color: 'from-yellow-500/20 to-amber-500/5',
    border: 'border-yellow-500/30',
    tag: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    badge: 'Open to all',
    features: ['Paid per 1,000 views', 'Monthly payouts', 'No minimum followers', 'Bonus for trending content'],
    cta: 'Enable Creator Fund',
    enabled: false,
  },
  {
    id: 'tips',
    icon: '🎁',
    label: 'Gifts & Tips',
    tagline: 'Let your fans support you directly',
    desc: 'Viewers send digital gifts during live streams and on posts. You receive 80% — we keep 20% to keep the platform running.',
    color: 'from-pink-500/20 to-rose-500/5',
    border: 'border-pink-500/30',
    tag: 'border-pink-500/40 bg-pink-500/10 text-pink-400',
    badge: '80% to you',
    features: ['Live stream gifting', 'Post tips', 'Instant notifications', 'Gift leaderboard for top fans'],
    cta: 'Enable Gifts & Tips',
    enabled: false,
  },
  {
    id: 'brands',
    icon: '🏢',
    label: 'Brand Marketplace',
    tagline: 'Get discovered by brands worldwide',
    desc: 'Create a media kit, set your rates, and let brands come to you. We surface your profile to matching campaign managers.',
    color: 'from-blue-500/20 to-indigo-500/5',
    border: 'border-blue-500/30',
    tag: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    badge: 'High earning potential',
    features: ['Auto-generated media kit', 'Brand campaign matching', 'Negotiation tools', 'Contract templates'],
    cta: 'Create Media Kit',
    enabled: false,
  },
  {
    id: 'subs',
    icon: '⭐',
    label: 'Fan Subscriptions',
    tagline: 'Build recurring monthly income',
    desc: 'Offer exclusive content, early access, and perks to paid subscribers. Set your own price — starting from $1/month.',
    color: 'from-purple-500/20 to-violet-500/5',
    border: 'border-purple-500/30',
    tag: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    badge: 'Recurring revenue',
    features: ['Unlimited subscriber tiers', 'Exclusive content gates', 'Subscriber-only live streams', 'Badges and perks'],
    cta: 'Launch Subscriptions',
    enabled: false,
  },
  {
    id: 'store',
    icon: '🛍️',
    label: 'Store & Courses',
    tagline: 'Sell digital products and knowledge',
    desc: 'List presets, templates, e-books, courses, and merch. Sell once or set up automated delivery for digital files.',
    color: 'from-emerald-500/20 to-teal-500/5',
    border: 'border-emerald-500/30',
    tag: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    badge: 'Keep 90%',
    features: ['Digital file delivery', 'Course builder', 'Coupon codes', 'Affiliate commissions'],
    cta: 'Open My Store',
    enabled: false,
  },
]

const PAYOUT_METHODS = [
  { id: 'flutterwave', label: 'Flutterwave',    icon: '🦋', desc: 'Africa-first · NGN, GHS, KES, ZAR + 30 more', regions: ['Africa', 'Global'] },
  { id: 'paystack',    label: 'Paystack',        icon: '⚡', desc: 'Instant payouts · Nigeria, Ghana, Kenya, SA',  regions: ['Africa'] },
  { id: 'stripe',      label: 'Stripe',          icon: '🔵', desc: 'Global standard · 135+ currencies',            regions: ['Global'] },
  { id: 'paypal',      label: 'PayPal',           icon: '🅿️', desc: 'Worldwide · Available in 200+ countries',     regions: ['Global'] },
  { id: 'bank',        label: 'Bank Transfer',   icon: '🏦', desc: 'Direct to your local bank account',           regions: ['Africa', 'Global'] },
  { id: 'crypto',      label: 'USDC / Stablecoin',icon: '₿', desc: 'Instant, borderless, low fees',              regions: ['Global'] },
]

const EARNINGS_DATA = [
  { name: 'Creator Fund',    value: 820,  color: '#f59e0b' },
  { name: 'Brand Deals',     value: 3200, color: '#3b82f6' },
  { name: 'Subscriptions',   value: 1450, color: '#8b5cf6' },
  { name: 'Store Sales',     value: 640,  color: '#10b981' },
  { name: 'Gifts & Tips',    value: 310,  color: '#ec4899' },
]

const TOTAL_EARNINGS = EARNINGS_DATA.reduce((s, d) => s + d.value, 0)

const STAT_CARDS = [
  { label: 'This Month',  value: `$${TOTAL_EARNINGS.toLocaleString()}`, sub: '+18% vs last month', color: 'text-emerald-400' },
  { label: 'Subscribers', value: '124',   sub: '12 new this week',  color: 'text-purple-400' },
  { label: 'Brand Deals', value: '3',     sub: '$3,200 secured',    color: 'text-blue-400' },
  { label: 'Store Sales', value: '47',    sub: '↑ from 31 last mo', color: 'text-amber-400' },
]

// ─── Components ───────────────────────────────────────────────────────────────

function TierCard({ tier, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [enabled, setEnabled] = useState(tier.enabled)

  const handleEnable = () => {
    setEnabled(e => !e)
    onToggle?.(tier.id, !enabled)
  }

  return (
    <div className={`bg-gradient-to-br ${tier.color} border ${tier.border} rounded-2xl p-5 space-y-4 transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tier.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">{tier.label}</h3>
              <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${tier.tag}`}>{tier.badge}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{tier.tagline}</p>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={handleEnable}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-primary' : 'bg-muted border border-border'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{tier.desc}</p>

      {/* Expand features */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? 'Hide features' : "See what's included"}
      </button>

      {expanded && (
        <div className="space-y-1.5 pt-1">
          {tier.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      )}

      {enabled ? (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-semibold">Active — you're earning from this stream</span>
        </div>
      ) : (
        <button
          onClick={handleEnable}
          className="w-full bg-foreground/5 border border-border text-sm font-semibold py-2.5 rounded-xl hover:bg-foreground/10 transition flex items-center justify-center gap-2"
        >
          {tier.cta} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">${value.toLocaleString()}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Monetization() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activePayoutTab, setActivePayoutTab] = useState('Africa')
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2800)
  }

  const handlePayoutSelect = (method) => {
    setSelectedPayout(method.id)
    showToast(`${method.label} selected as payout method`)
  }

  const filteredPayouts = PAYOUT_METHODS.filter(m => m.regions.includes(activePayoutTab))

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none whitespace-nowrap">
          ✅ {toastMsg}
        </div>
      )}

      {/* Hero */}
      <div className="text-center py-8 px-4 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-background border border-emerald-500/20 rounded-3xl">
        <div className="text-5xl mb-4">💰</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Get Paid. Fairly. Everywhere.</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          Five ways to earn from your content and creativity — with payouts built for creators in Africa and beyond.
          No gatekeeping. No minimum follower count. Just results.
        </p>
        <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">$0</p>
            <p className="text-xs text-muted-foreground">to get started</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">80–90%</p>
            <p className="text-xs text-muted-foreground">revenue to you</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">30+</p>
            <p className="text-xs text-muted-foreground">payout currencies</p>
          </div>
        </div>
      </div>

      {/* Earnings Dashboard */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Earnings Dashboard
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sample projection based on typical creator performance</p>
          </div>
          <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-semibold">May 2026</span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="bg-muted rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EARNINGS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {EARNINGS_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {EARNINGS_DATA.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-sm text-muted-foreground flex-1">{d.name}</span>
                <span className="text-sm font-semibold text-foreground">${d.value.toLocaleString()}</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d.value / TOTAL_EARNINGS) * 100}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-emerald-400">${TOTAL_EARNINGS.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Streams */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Revenue Streams</h2>
          <p className="text-sm text-muted-foreground mt-1">Enable the streams that fit your creator style. Each one is independent.</p>
        </div>
        <div className="space-y-4">
          {TIERS.map(tier => (
            <TierCard key={tier.id} tier={tier} onToggle={() => {}} />
          ))}
        </div>
      </div>

      {/* Payout Methods */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Payout Methods
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Built for creators everywhere — starting with Africa.
          </p>
        </div>

        {/* Region tabs */}
        <div className="flex gap-2">
          {['Africa', 'Global'].map(tab => (
            <button
              key={tab}
              onClick={() => setActivePayoutTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activePayoutTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'Africa' ? '🌍' : '🌐'} {tab}
            </button>
          ))}
        </div>

        {/* Payout grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          {filteredPayouts.map(method => (
            <button
              key={method.id}
              onClick={() => handlePayoutSelect(method)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                selectedPayout === method.id
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                  : 'bg-muted border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{method.label}</p>
                    {selectedPayout === method.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{method.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedPayout && (
          <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">
                {PAYOUT_METHODS.find(m => m.id === selectedPayout)?.label} selected
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your account in Settings → Payouts to start receiving earnings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Equal-pay manifesto */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 text-center space-y-3">
        <div className="text-3xl">⚖️</div>
        <h3 className="font-bold text-foreground text-lg">Fair Pay for Every Creator</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          A creator in Lagos deserves the same earning opportunity as one in London.
          That's why Philomni built payout rails for Naira, Cedi, Shilling, and Rand —
          not just Dollars and Euros. Your audience, your earnings, your currency.
        </p>
        <button
          onClick={() => navigate('/upgrade')}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition mt-2"
        >
          Upgrade to Pro for higher revenue share <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
