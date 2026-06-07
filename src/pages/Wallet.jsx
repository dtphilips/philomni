import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { COINS_PER_DOLLAR, coinsToUSDString } from '../lib/constants'
import {
  Wallet as WalletIcon, TrendingUp, ArrowDownCircle, Clock,
  DollarSign, Loader2, ChevronLeft, ChevronRight, ArrowUpRight,
  ArrowDownLeft, Gift, BookOpen, ShoppingBag, Megaphone, Briefcase,
  ShieldAlert, CheckCircle2,
} from 'lucide-react'

const TAX_ID_TYPES = ['SSN', 'SIN', 'TIN', 'BVN', 'Other']

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'Other', name: 'Other' },
]

function TaxProfileModal({ userId, onComplete, onClose }) {
  const [form, setForm] = useState({
    country: '',
    tax_id_type: '',
    tax_id_number: '',
    legal_name: '',
    confirmed: false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async () => {
    if (!form.country) return toast.error('Select your country of tax residence')
    if (!form.tax_id_type) return toast.error('Select your tax ID type')
    if (!form.tax_id_number || form.tax_id_number.length < 4) return toast.error('Tax ID must be at least 4 characters')
    if (!form.legal_name.trim()) return toast.error('Enter your legal full name')
    if (!form.confirmed) return toast.error('You must confirm the declaration')

    setSaving(true)
    try {
      const tax_info = {
        country: form.country,
        tax_id_type: form.tax_id_type,
        tax_id_last4: form.tax_id_number.slice(-4),
        legal_name: form.legal_name.trim(),
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('users')
        .update({ tax_info, tax_verified: true })
        .eq('id', userId)
      if (error) throw error
      toast.success('Tax profile saved')
      onComplete()
    } catch {
      toast.error('Failed to save tax profile')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-lg">Tax Profile</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Required before your first withdrawal. Your full tax ID is never stored — only the last 4 digits.</p>

        <div className="space-y-4">
          {/* Country */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Country of Tax Residence</label>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select country…</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          {/* Tax ID type */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tax ID Type</label>
            <select
              value={form.tax_id_type}
              onChange={e => set('tax_id_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select type…</option>
              {TAX_ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Tax ID number */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tax ID Number</label>
            <input
              type="password"
              value={form.tax_id_number}
              onChange={e => set('tax_id_number', e.target.value)}
              placeholder="Enter your tax ID"
              autoComplete="off"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Only the last 4 digits will be stored for reference.</p>
          </div>

          {/* Legal name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Legal Full Name</label>
            <input
              type="text"
              value={form.legal_name}
              onChange={e => set('legal_name', e.target.value)}
              placeholder="As it appears on your bank account"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirmed}
              onChange={e => set('confirmed', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I confirm this information is accurate and I am responsible for reporting my income to my local tax authority.
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Tax Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TYPE_CFG = {
  earning:        { label: 'Earning',        icon: TrendingUp,    color: 'text-green-400',  bg: 'bg-green-400/10'  },
  course_sale:    { label: 'Course Sale',    icon: BookOpen,      color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  product_sale:   { label: 'Product Sale',   icon: ShoppingBag,   color: 'text-purple-400', bg: 'bg-purple-400/10' },
  consulting_fee: { label: 'Consulting',     icon: Briefcase,     color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  ad_revenue:     { label: 'Ad Revenue',     icon: Megaphone,     color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
  bonus:          { label: 'Bonus',          icon: Gift,          color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  withdrawal:     { label: 'Withdrawal',     icon: ArrowDownCircle, color: 'text-red-400',  bg: 'bg-red-400/10'    },
  refund:         { label: 'Refund',         icon: ArrowDownLeft, color: 'text-orange-400', bg: 'bg-orange-400/10' },
}

const PIE_COLORS = ['#3b82f6','#a855f7','#f59e0b','#ec4899','#22c55e','#f97316']

function SimplePie({ data }) {
  if (!data || data.length === 0) return null
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  let cumulative = 0
  const segments = data.map((item, i) => {
    const pct = item.value / total
    const startAngle = cumulative * 360
    const endAngle = (cumulative + pct) * 360
    cumulative += pct
    const start = polarToCartesian(50, 50, 40, startAngle)
    const end = polarToCartesian(50, 50, 40, endAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return {
      ...item,
      d: `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity="0.85" />
        ))}
        <circle cx="50" cy="50" r="24" fill="hsl(var(--card))" />
      </svg>
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground font-medium ml-auto pl-2">${s.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const PAGE_SIZE = 20

export default function Wallet() {
  const { user } = useAuth()
  const [wallet,        setWallet]        = useState(null)
  const [taxVerified,   setTaxVerified]   = useState(null)
  const [txns,          setTxns]          = useState([])
  const [total,         setTotal]         = useState(0)
  const [page,          setPage]          = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [withdrawing,   setWithdrawing]   = useState(false)
  const [showWithdraw,  setShowWithdraw]  = useState(false)
  const [showTaxModal,  setShowTaxModal]  = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [giftEarnings,  setGiftEarnings]  = useState({ coins: 0, usd: 0, count: 0 })

  const fetchWallet = useCallback(async (uid) => {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', uid).single()
    setWallet(data || { balance: 0, total_earned: 0, total_withdrawn: 0, pending_payout: 0 })
  }, [])

  const fetchTaxStatus = useCallback(async (uid) => {
    const { data } = await supabase.from('users').select('tax_verified').eq('id', uid).single()
    setTaxVerified(data?.tax_verified ?? false)
  }, [])

  const fetchTxns = useCallback(async (uid) => {
    const from = page * PAGE_SIZE
    const { data, count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    setTxns(data || [])
    setTotal(count || 0)
  }, [page])

  const fetchGiftEarnings = useCallback(async (uid) => {
    const { data } = await supabase
      .from('post_gifts')
      .select('coin_cost, creator_earnings')
      .eq('creator_id', uid)
    if (data?.length) {
      const coins = data.reduce((s, g) => s + Math.floor((g.coin_cost || 0) * 0.70), 0)
      const usd   = data.reduce((s, g) => s + Number(g.creator_earnings || 0), 0)
      setGiftEarnings({ coins, usd, count: data.length })
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); clearTimeout(timeout); return }
      try {
        await Promise.all([
          fetchWallet(session.user.id),
          fetchTxns(session.user.id),
          fetchTaxStatus(session.user.id),
          fetchGiftEarnings(session.user.id),
        ])
      } finally {
        setLoading(false)
        clearTimeout(timeout)
      }
    }
    init()
    return () => clearTimeout(timeout)
  }, [fetchWallet, fetchTxns, fetchTaxStatus, fetchGiftEarnings])

  const handleWithdrawClick = () => {
    if (!taxVerified) { setShowTaxModal(true); return }
    setShowWithdraw(true)
  }

  // Pie chart data from transactions
  const pieData = React.useMemo(() => {
    const buckets = {}
    txns.filter(t => t.amount > 0).forEach(t => {
      const cfg = TYPE_CFG[t.type] || TYPE_CFG.earning
      buckets[cfg.label] = (buckets[cfg.label] || 0) + Number(t.amount)
    })
    return Object.entries(buckets).map(([label, value]) => ({ label, value })).filter(d => d.value > 0)
  }, [txns])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    if (amount > (wallet?.balance || 0)) return toast.error('Insufficient balance')
    setWithdrawing(true)
    try {
      const newBalance = (wallet.balance || 0) - amount
      await supabase.from('wallet').update({
        balance: newBalance,
        total_withdrawn: (wallet.total_withdrawn || 0) + amount,
      }).eq('user_id', user.id)
      await supabase.from('wallet_transactions').insert({
        user_id: user.id, amount: -amount, type: 'withdrawal',
        description: 'Manual withdrawal request',
      })
      toast.success(`Withdrawal of $${amount.toFixed(2)} submitted!`)
      setWallet(prev => ({ ...prev, balance: newBalance, total_withdrawn: (prev.total_withdrawn || 0) + amount }))
      setShowWithdraw(false)
      setWithdrawAmount('')
      if (user?.id) fetchTxns(user.id)
    } catch { toast.error('Withdrawal failed') }
    setWithdrawing(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WalletIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>
        <button
          onClick={handleWithdrawClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowDownCircle className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Tax profile banner */}
      {taxVerified === false && (
        <button
          onClick={() => setShowTaxModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-left hover:bg-yellow-500/20 transition-colors"
        >
          <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-400">Complete your tax profile to enable withdrawals</p>
            <p className="text-xs text-muted-foreground">Tap to set up — takes less than a minute.</p>
          </div>
        </button>
      )}

      {/* Tax verified note */}
      {taxVerified === true && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Philomni will provide annual payment summaries for your tax records. You are responsible for reporting income to your local tax authority.
          </p>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: wallet?.balance || 0,          color: 'text-green-400',        icon: WalletIcon },
          { label: 'Total Earned',      value: wallet?.total_earned || 0,     color: 'text-blue-400',         icon: TrendingUp },
          { label: 'Withdrawn',         value: wallet?.total_withdrawn || 0,  color: 'text-muted-foreground', icon: ArrowDownCircle },
          { label: 'Pending Payout',    value: wallet?.pending_payout || 0,   color: 'text-yellow-400',       icon: Clock },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <card.icon className={`w-4 h-4 mb-2 ${card.color}`} />
            <p className={`text-xl font-bold ${card.color}`}>${Number(card.value).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Gift earnings summary */}
      {giftEarnings.count > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Gift Earnings</p>
            <p className="text-xs text-muted-foreground">
              {giftEarnings.count} gift{giftEarnings.count !== 1 ? 's' : ''} received ·{' '}
              {giftEarnings.coins.toLocaleString()} coins ({coinsToUSDString(giftEarnings.coins)}) · 70% creator share
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-yellow-400">${giftEarnings.usd.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">= {giftEarnings.coins} coins</p>
          </div>
        </div>
      )}

      {/* Earnings breakdown pie */}
      {pieData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Earnings Breakdown</p>
          <SimplePie data={pieData} />
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Transaction History</p>
          <p className="text-xs text-muted-foreground">{total} transactions</p>
        </div>

        {txns.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {txns.map(txn => {
              const cfg = TYPE_CFG[txn.type] || TYPE_CFG.earning
              const isCredit = txn.amount > 0
              return (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{txn.description || cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : ''}{Number(txn.amount).toFixed(2)}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tax profile modal */}
      {showTaxModal && (
        <TaxProfileModal
          userId={user?.id}
          onComplete={() => { setTaxVerified(true); setShowTaxModal(false); setShowWithdraw(true) }}
          onClose={() => setShowTaxModal(false)}
        />
      )}

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground mb-1">Withdraw Funds</h3>
            <p className="text-xs text-muted-foreground mb-4">Available: <span className="text-green-400 font-semibold">${(wallet?.balance || 0).toFixed(2)}</span></p>
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />
            <p className="text-xs text-muted-foreground mb-4">Withdrawals are processed within 3–5 business days via your registered payment method.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowWithdraw(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
