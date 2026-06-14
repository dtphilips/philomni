import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  detectPayoutProvider, getNextPayoutDate, MINIMUM_PAYOUT_USD,
  NIGERIAN_BANKS, FLW_COUNTRY_CURRENCIES,
} from '../utils/payoutProvider'
import { getUserCountry } from '../lib/payments'
import {
  Wallet as WalletIcon, TrendingUp, ArrowDownCircle, Clock,
  DollarSign, Loader2, ChevronLeft, ChevronRight,
  ArrowDownLeft, Gift, BookOpen, ShoppingBag, Megaphone, Briefcase,
  ShieldAlert, CheckCircle2, Building2, ExternalLink, AlertCircle,
  CalendarClock, BanknoteIcon,
} from 'lucide-react'

// ── Tax Compliance Modal ───────────────────────────────────────────────────────
// Philomni never stores SIN, SSN, or any tax ID.
// Tax compliance is handled by Stripe Connect / Paystack / Flutterwave.
function TaxProfileModal({ userId, onComplete, onClose }) {
  const [confirming, setConfirming] = useState(false)

  const handleAcknowledge = async () => {
    setConfirming(true)
    try {
      // Mark tax_verified so the banner goes away — compliance is via payment partner
      await supabase.from('users').update({ tax_verified: true }).eq('id', userId)
      toast.success('Got it! Connect your bank account below to enable payouts.')
      onComplete()
    } catch { toast.error('Something went wrong. Please try again.') }
    setConfirming(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-lg">Tax & Compliance</h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-400 mb-1">🔒 Your tax information is protected</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Philomni <strong>never stores your SIN, SSN, or any tax identification numbers.</strong>
              Tax compliance is handled entirely and securely by our payment partners.
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span><strong>Canada / US / Europe:</strong> Stripe Connect collects your tax info and issues 1099/T4A forms directly.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span><strong>Nigeria:</strong> Paystack handles CBN compliance and any required tax withholding.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span><strong>Other Africa:</strong> Flutterwave manages local regulatory requirements for your country.</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            Philomni provides annual payment summaries for your records. You are responsible for reporting income to your local tax authority.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
            Close
          </button>
          <button onClick={handleAcknowledge} disabled={confirming}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Got it · Connect Bank →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bank Connect UI ───────────────────────────────────────────────────────────
function BankConnectSection({ userId, userEmail, profile, onConnected }) {
  const [provider,       setProvider]       = useState(profile?.payout_provider ?? null)
  const [detecting,      setDetecting]      = useState(!profile?.payout_provider)
  const [connecting,     setConnecting]     = useState(false)
  const [connError,      setConnError]      = useState('')
  // Paystack form
  const [accountNumber,  setAccountNumber]  = useState('')
  const [bankCode,       setBankCode]       = useState('')
  const [accountName,    setAccountName]    = useState('')
  // Flutterwave form
  const [flwCountry,     setFlwCountry]     = useState('')
  const [flwBank,        setFlwBank]        = useState('')
  const [flwAccNum,      setFlwAccNum]      = useState('')
  const [flwAccName,     setFlwAccName]     = useState('')

  const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  useEffect(() => {
    if (profile?.payout_provider) { setProvider(profile.payout_provider); setDetecting(false); return }
    getUserCountry().then(country => {
      setProvider(detectPayoutProvider(country))
      setDetecting(false)
    })
  }, [profile?.payout_provider])

  const callFunction = async (name, body) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  }

  const handleStripeConnect = async () => {
    setConnecting(true); setConnError('')
    try {
      const { url } = await callFunction('create-stripe-connect', { userId, userEmail })
      window.location.href = url
    } catch (err) { setConnError(err.message); setConnecting(false) }
  }

  const handlePaystackConnect = async () => {
    if (!accountNumber || !bankCode || !accountName) { setConnError('All fields required'); return }
    setConnecting(true); setConnError('')
    try {
      await callFunction('create-paystack-recipient', { userId, accountNumber, bankCode, accountName })
      toast.success('Bank account connected!')
      onConnected()
    } catch (err) { setConnError(err.message); setConnecting(false) }
  }

  const handleFlwConnect = async () => {
    const cc = FLW_COUNTRY_CURRENCIES[flwCountry]
    if (!flwCountry || !flwBank || !flwAccNum || !flwAccName || !cc) { setConnError('All fields required'); return }
    setConnecting(true); setConnError('')
    try {
      await callFunction('create-flutterwave-recipient', { userId, accountNumber: flwAccNum, bankCode: flwBank, accountName: flwAccName, country: flwCountry, currency: cc.currency })
      toast.success('Bank account connected!')
      onConnected()
    } catch (err) { setConnError(err.message); setConnecting(false) }
  }

  if (detecting) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Connect Bank Account</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Connect your bank to receive weekly payouts every Friday.
        Minimum payout: <strong>${MINIMUM_PAYOUT_USD.toFixed(2)}</strong>.
      </p>

      {/* Provider selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'stripe',      label: '💳 Stripe (CA / US / Europe)' },
          { id: 'paystack',    label: '🇳🇬 Paystack (Nigeria)' },
          { id: 'flutterwave', label: '🌍 Flutterwave (Africa)' },
        ].map(p => (
          <button key={p.id} onClick={() => { setProvider(p.id); setConnError('') }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${provider === p.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {connError && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{connError}</p>}

      {/* Stripe */}
      {provider === 'stripe' && (
        <button onClick={handleStripeConnect} disabled={connecting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {connecting ? 'Redirecting…' : 'Connect with Stripe →'}
        </button>
      )}

      {/* Paystack */}
      {provider === 'paystack' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Bank</label>
            <select value={bankCode} onChange={e => setBankCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select bank…</option>
              {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Account Number</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit NUBAN" maxLength={10}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Account Name</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
              placeholder="As registered with your bank"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button onClick={handlePaystackConnect} disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BanknoteIcon className="w-4 h-4" />}
            {connecting ? 'Connecting…' : 'Connect Bank Account'}
          </button>
        </div>
      )}

      {/* Flutterwave */}
      {provider === 'flutterwave' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Country</label>
            <select value={flwCountry} onChange={e => { setFlwCountry(e.target.value); setFlwBank('') }}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select country…</option>
              {Object.entries(FLW_COUNTRY_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>{info.name} ({info.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Bank Code</label>
            <input type="text" value={flwBank} onChange={e => setFlwBank(e.target.value)}
              placeholder="e.g. GH130100 (find at flutterwave.com/developers)"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Account Number</label>
            <input type="text" value={flwAccNum} onChange={e => setFlwAccNum(e.target.value)}
              placeholder="Account number"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Account Name</label>
            <input type="text" value={flwAccName} onChange={e => setFlwAccName(e.target.value)}
              placeholder="Full name on account"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button onClick={handleFlwConnect} disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BanknoteIcon className="w-4 h-4" />}
            {connecting ? 'Connecting…' : 'Connect Bank Account'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Transaction type config ───────────────────────────────────────────────────
const TYPE_CFG = {
  earning:        { label: 'Earning',      icon: TrendingUp,    color: 'text-green-400',  bg: 'bg-green-400/10'  },
  course_sale:    { label: 'Course Sale',  icon: BookOpen,      color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  product_sale:   { label: 'Product Sale', icon: ShoppingBag,   color: 'text-purple-400', bg: 'bg-purple-400/10' },
  consulting_fee: { label: 'Consulting',   icon: Briefcase,     color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  ad_revenue:     { label: 'Ad Revenue',   icon: Megaphone,     color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
  bonus:          { label: 'Bonus',        icon: Gift,          color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  withdrawal:     { label: 'Withdrawal',   icon: ArrowDownCircle, color: 'text-red-400',  bg: 'bg-red-400/10'    },
  refund:         { label: 'Refund',       icon: ArrowDownLeft, color: 'text-orange-400', bg: 'bg-orange-400/10' },
}

const PAGE_SIZE = 20

// ── Main Component ────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user }    = useAuth()
  const [searchParams] = useSearchParams()

  const [profile,       setProfile]       = useState(null)
  const [wallet,        setWallet]        = useState(null)
  const [taxVerified,   setTaxVerified]   = useState(null)
  const [txns,          setTxns]          = useState([])
  const [total,         setTotal]         = useState(0)
  const [page,          setPage]          = useState(0)
  const [payouts,       setPayouts]       = useState([])
  const [giftEarnings,  setGiftEarnings]  = useState({ usd: 0, count: 0 })
  const [loading,       setLoading]       = useState(true)
  const [withdrawing,   setWithdrawing]   = useState(false)
  const [showWithdraw,  setShowWithdraw]  = useState(false)
  const [showTaxModal,  setShowTaxModal]  = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  // Handle Stripe Connect return — robust against user not yet loaded
  useEffect(() => {
    const connectStatus = searchParams.get('connect')
    if (!connectStatus) return
    if (connectStatus === 'refresh') { toast.info('Stripe onboarding incomplete. Please try again.'); return }
    if (connectStatus === 'success') {
      const mark = async (uid) => {
        if (!uid) return
        await supabase.from('users').update({ bank_connected: true }).eq('id', uid)
        toast.success('Stripe connected! Payouts enabled.')
        fetchProfile(uid)
      }
      if (user?.id) {
        mark(user.id)
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
          if (session?.user?.id) { mark(session.user.id); subscription.unsubscribe() }
        })
      }
    }
  }, [searchParams, user?.id])

  const fetchProfile = useCallback(async (uid) => {
    const { data } = await supabase.from('users')
      .select('available_balance_usd, total_earned_usd, total_withdrawn_usd, bank_connected, payout_provider, bank_country, tax_verified, stripe_account_id, paystack_recipient_code, flutterwave_account_id')
      .eq('id', uid).single()
    if (data) { setProfile(data); setTaxVerified(data.tax_verified ?? false) }
  }, [])

  const fetchWallet = useCallback(async (uid) => {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', uid).single()
    setWallet(data || { balance: 0, total_earned: 0, total_withdrawn: 0 })
  }, [])

  const fetchTxns = useCallback(async (uid) => {
    const from = page * PAGE_SIZE
    const { data, count } = await supabase
      .from('wallet_transactions').select('*', { count: 'exact' })
      .eq('user_id', uid).order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    setTxns(data || [])
    setTotal(count || 0)
  }, [page])

  const fetchPayouts = useCallback(async (uid) => {
    const { data } = await supabase.from('payouts').select('*')
      .eq('creator_id', uid).order('created_at', { ascending: false }).limit(10)
    setPayouts(data || [])
  }, [])

  const fetchGiftEarnings = useCallback(async (uid) => {
    const { data } = await supabase.from('post_gifts').select('coin_cost, creator_earnings').eq('creator_id', uid)
    if (data?.length) {
      // creator_earnings is already the USD amount (floor(coin_cost * 0.70) / 100)
      const usd = data.reduce((s, g) => s + Number(g.creator_earnings || 0), 0)
      setGiftEarnings({ usd, count: data.length })
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); clearTimeout(timeout); return }
      try {
        await Promise.all([
          fetchProfile(session.user.id), fetchWallet(session.user.id),
          fetchTxns(session.user.id), fetchPayouts(session.user.id),
          fetchGiftEarnings(session.user.id),
        ])
      } finally { setLoading(false); clearTimeout(timeout) }
    }
    init()
    return () => clearTimeout(timeout)
  }, [fetchProfile, fetchWallet, fetchTxns, fetchPayouts, fetchGiftEarnings])

  const handleWithdrawClick = () => {
    if (!taxVerified) { setShowTaxModal(true); return }
    setShowWithdraw(true)
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    const available = Number(profile?.available_balance_usd || wallet?.balance || 0)
    if (amount > available) return toast.error('Insufficient balance')
    setWithdrawing(true)
    try {
      const newBalance = available - amount
      await supabase.from('wallets').update({
        balance:         newBalance,
        total_withdrawn: (wallet?.total_withdrawn || 0) + amount,
      }).eq('user_id', user.id)
      await supabase.from('wallet_transactions').insert({
        user_id: user.id, amount: -amount, type: 'withdrawal',
        description: 'Manual withdrawal request',
      })
      toast.success(`Withdrawal of $${amount.toFixed(2)} submitted!`)
      setWallet(prev => ({ ...prev, balance: newBalance, total_withdrawn: (prev?.total_withdrawn || 0) + amount }))
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

  const availableUSD  = Number(profile?.available_balance_usd  || wallet?.balance         || 0)
  const totalEarnedUSD = Number(profile?.total_earned_usd      || wallet?.total_earned     || 0)
  const withdrawnUSD   = Number(profile?.total_withdrawn_usd   || wallet?.total_withdrawn  || 0)
  const totalPages     = Math.ceil(total / PAGE_SIZE)
  const bankConnected  = (profile?.bank_connected || !!profile?.stripe_account_id || !!profile?.paystack_recipient_code || !!profile?.flutterwave_account_id) ?? false
  const nextFriday     = getNextPayoutDate()

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WalletIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>
        <button onClick={handleWithdrawClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <ArrowDownCircle className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Tax profile banner */}
      {taxVerified === false && (
        <button onClick={() => setShowTaxModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-left hover:bg-yellow-500/20 transition-colors">
          <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-400">Complete your tax profile to enable withdrawals</p>
            <p className="text-xs text-muted-foreground">Tap to set up — takes less than a minute.</p>
          </div>
        </button>
      )}

      {taxVerified === true && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Philomni will provide annual payment summaries for your tax records. You are responsible for reporting income to your local tax authority.
          </p>
        </div>
      )}

      {/* Bank connection status */}
      {bankConnected ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-400">Bank connected · Payouts every Friday</p>
            <p className="text-xs text-muted-foreground">
              Next payout: <strong>{nextFriday}</strong> · Min ${MINIMUM_PAYOUT_USD.toFixed(2)}
            </p>
          </div>
          <CalendarClock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Connect your bank to receive weekly payouts</p>
            <p className="text-xs text-muted-foreground">Next payout: {nextFriday} · Min ${MINIMUM_PAYOUT_USD.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: availableUSD,  color: 'text-green-400',        icon: WalletIcon },
          { label: 'Total Earned',      value: totalEarnedUSD, color: 'text-blue-400',         icon: TrendingUp },
          { label: 'Withdrawn',         value: withdrawnUSD,   color: 'text-muted-foreground', icon: ArrowDownCircle },
          { label: 'Pending Payout',    value: availableUSD,   color: 'text-yellow-400',       icon: Clock },
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
              {giftEarnings.count} gift{giftEarnings.count !== 1 ? 's' : ''} received · 70% creator share · included in Available Balance
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-yellow-400">${giftEarnings.usd.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">earned from gifts</p>
          </div>
        </div>
      )}

      {/* Bank connect section */}
      {!bankConnected && (
        <BankConnectSection
          userId={user?.id}
          userEmail={user?.email}
          profile={profile}
          onConnected={() => fetchProfile(user?.id)}
        />
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Payout History</p>
          </div>
          <div className="divide-y divide-border">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  p.status === 'completed' ? 'bg-green-400/10' : p.status === 'failed' ? 'bg-red-400/10' : 'bg-yellow-400/10'
                }`}>
                  <BanknoteIcon className={`w-4 h-4 ${
                    p.status === 'completed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{p.payout_provider} payout</p>
                  <p className="text-xs text-muted-foreground">
                    {p.processed_at ? new Date(p.processed_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                    {p.local_currency && p.local_currency !== 'USD' && ` · ${p.amount_local?.toFixed(0)} ${p.local_currency}`}
                  </p>
                  {p.failure_reason && <p className="text-xs text-red-400 truncate">{p.failure_reason}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-400">+${Number(p.amount_usd).toFixed(2)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    p.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                    p.status === 'failed'    ? 'bg-red-400/10 text-red-400' :
                    'bg-yellow-400/10 text-yellow-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
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
                      {isCredit ? '+' : ''}${Math.abs(Number(txn.amount)).toFixed(2)}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40">
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

      {/* Manual withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground mb-1">Withdraw Funds</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Available: <span className="text-green-400 font-semibold">${availableUSD.toFixed(2)}</span>
            </p>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-4" />
            <p className="text-xs text-muted-foreground mb-4">
              {bankConnected
                ? 'Your next automatic payout is on ' + nextFriday + '. Or request a manual withdrawal below.'
                : 'Withdrawals are processed within 3–5 business days via your registered payment method.'}
            </p>
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
