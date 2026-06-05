import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Loader2, Check, ExternalLink } from 'lucide-react'
import {
  PAYMENT_CONFIG,
  loadPaystackScript,
  openPaystackPopup,
  createPaymentIntent,
  recordPayment,
} from '../lib/payments'

// ── Packages ──────────────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id:        'starter',
    label:     'Starter',
    coins:     100,
    price:     1.00,
    savings:   null,
    highlight: false,
  },
  {
    id:        'popular',
    label:     'Popular',
    coins:     500,
    price:     4.50,
    savings:   10,
    highlight: false,
  },
  {
    id:        'value',
    label:     'Best Value',
    coins:     1000,
    price:     8.00,
    savings:   20,
    badge:     '⭐ Most Popular',
    highlight: true,
  },
  {
    id:        'super',
    label:     'Super',
    coins:     5000,
    price:     35.00,
    savings:   30,
    highlight: false,
  },
]

// ── Gifts catalog ─────────────────────────────────────────────────────────────
const GIFTS = [
  { emoji: '🌹', name: 'Rose',     cost: 1     },
  { emoji: '❤️', name: 'Heart',    cost: 5     },
  { emoji: '⭐', name: 'Star',     cost: 10    },
  { emoji: '🔥', name: 'Fire',     cost: 20    },
  { emoji: '👑', name: 'Crown',    cost: 50    },
  { emoji: '💎', name: 'Diamond',  cost: 100   },
  { emoji: '🚀', name: 'Rocket',   cost: 200   },
  { emoji: '🌌', name: 'Galaxy',   cost: 500   },
  { emoji: '✨', name: 'Philomni', cost: 1000  },
  { emoji: '🏆', name: 'Legend',   cost: 5000  },
]

function fmt(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n
}

const HOW_IT_WORKS = [
  { emoji: '🪙', title: 'Buy Coins',      desc: 'Purchase coin packages above to top up your balance instantly.' },
  { emoji: '🎁', title: 'Send Gifts',     desc: 'Use coins to send gifts during live streams and on any post.' },
  { emoji: '💰', title: 'Creators Earn',  desc: '70% of every gift value goes directly to the creator\'s wallet.' },
]

// ── Determine payment mode ────────────────────────────────────────────────────
const PAYSTACK_ACTIVE  = PAYMENT_CONFIG.paystack.active
const STRIPE_ACTIVE    = PAYMENT_CONFIG.stripe.active
// $1 USD ≈ 1 500 NGN; multiply by 100 for kobo
const USD_TO_KOBO = (usd) => Math.round(usd * 1500 * 100)

export default function BuyCoins() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [coinBalance, setCoinBalance]   = useState(0)
  const [selected,    setSelected]      = useState(null)
  const [showModal,   setShowModal]     = useState(false)
  const [saving,      setSaving]        = useState(false)
  const [done,        setDone]          = useState(false)
  const [error,       setError]         = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('coin_balance').eq('id', user.id).single()
      .then(({ data }) => { if (data) setCoinBalance(data.coin_balance || 0) })
  }, [user?.id])

  const handleBuy = (pkg) => {
    setSelected(pkg)
    setDone(false)
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setDone(false)
    setError('')
  }

  // ── Add coins to DB after successful payment ──────────────────────────────
  const creditCoins = async (intentId, providerRef) => {
    // Record completed payment
    if (intentId) {
      await recordPayment(supabase, {
        paymentIntentId:   intentId,
        providerPaymentId: providerRef,
        status:            'completed',
      })
    }
    // Increment coin_balance
    const { data: fresh } = await supabase
      .from('users').select('coin_balance').eq('id', user.id).single()
    const newBalance = (fresh?.coin_balance || 0) + selected.coins
    await supabase.from('users').update({ coin_balance: newBalance }).eq('id', user.id)
    setCoinBalance(newBalance)
  }

  // ── Paystack flow ─────────────────────────────────────────────────────────
  const handlePaystack = async () => {
    if (!selected || !user) return
    setSaving(true)
    setError('')
    let intentId = null
    try {
      await loadPaystackScript()
      const intent = await createPaymentIntent(supabase, {
        userId:   user.id,
        amount:   USD_TO_KOBO(selected.price),
        currency: 'ngn',
        type:     'coins',
        metadata: { coins: selected.coins, package: selected.id },
      })
      intentId = intent.id

      openPaystackPopup({
        email:      user.email,
        amountKobo: USD_TO_KOBO(selected.price),
        currency:   'NGN',
        metadata:   { coins: selected.coins, user_id: user.id, payment_intent_id: intentId },
        onSuccess:  async (reference) => {
          try {
            await creditCoins(intentId, reference)
            setSaving(false)
            setDone(true)
          } catch (err) {
            console.error('[BuyCoins] creditCoins error:', err)
            // Payment succeeded even if DB write fails — show success and log
            setSaving(false)
            setDone(true)
          }
        },
        onClose: () => setSaving(false),
      })
    } catch (err) {
      console.error('[BuyCoins] Paystack error:', err)
      setError('Payment could not be initialized. Please try again.')
      setSaving(false)
    }
  }

  // ── Stripe flow (requires backend — show contact info for now) ────────────
  const handleStripe = async () => {
    if (!selected || !user) return
    setSaving(true)
    setError('')
    try {
      await createPaymentIntent(supabase, {
        userId:   user.id,
        amount:   Math.round(selected.price * 100),
        currency: 'usd',
        type:     'coins',
        metadata: { coins: selected.coins, package: selected.id },
      })
    } catch { /* non-fatal */ }
    setSaving(false)
    setError('stripe_contact')   // special sentinel to show contact UI
  }

  // ── Coming-soon fallback ──────────────────────────────────────────────────
  const handleComingSoon = async () => {
    if (!selected || !user) return
    setSaving(true)
    try {
      await supabase.from('coin_purchases').insert({
        user_id:   user.id,
        coins:     selected.coins,
        price_usd: selected.price,
        status:    'pending',
      })
    } catch { /* table may not exist — safe to ignore */ }
    setSaving(false)
    setDone(true)
  }

  const handleConfirm = () => {
    if (PAYSTACK_ACTIVE)  return handlePaystack()
    if (STRIPE_ACTIVE)    return handleStripe()
    return handleComingSoon()
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="text-center mb-8 pt-2">
        <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <span className="text-4xl">🪙</span>
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Philomni Coins</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          Use coins to send gifts and show appreciation to creators
        </p>
        <div className="inline-flex items-center gap-2.5 mt-5 px-5 py-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
          <span className="text-2xl">🪙</span>
          <div className="text-left">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">
              {coinBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">your balance</p>
          </div>
        </div>
      </div>

      {/* ── Package grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {PACKAGES.map(pkg => (
          <div
            key={pkg.id}
            className={`relative rounded-2xl border-2 p-6 bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              pkg.highlight
                ? 'border-primary shadow-primary/20 shadow-md'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {pkg.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full leading-none shadow-sm">
                  ⭐ Most Popular
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl">🪙</span>
              <span className="text-4xl font-black text-foreground">{fmt(pkg.coins)}</span>
              <span className="text-sm text-muted-foreground font-medium pb-0.5">coins</span>
            </div>
            <p className="text-3xl font-black text-primary mt-2">
              ${pkg.price.toFixed(2)} <span className="text-base font-normal text-muted-foreground">USD</span>
            </p>
            {pkg.savings && (
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Save {pkg.savings}%
              </span>
            )}
            <button
              onClick={() => handleBuy(pkg)}
              className={`mt-5 w-full py-3 rounded-xl text-sm font-bold transition-all ${
                pkg.highlight
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
              }`}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {/* ── How Coins Work ─────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-foreground mb-4 text-center">How Coins Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW_IT_WORKS.map(item => (
            <div key={item.title} className="bg-card border border-border/60 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <p className="text-sm font-bold text-foreground mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gift Catalog ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4 text-center">Gift Catalog</h2>
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GIFTS.map(g => (
              <div key={g.name}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-default">
                <span className="text-2xl">{g.emoji}</span>
                <p className="text-xs font-semibold text-foreground text-center">{g.name}</p>
                <span className="text-[11px] text-amber-500 font-bold">🪙 {g.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          100 coins = $1.00 USD · Creators keep 70% of gift value
        </p>
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Success state ── */}
            {done ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-black text-xl text-foreground mb-2">
                  {selected?.coins.toLocaleString()} Coins Added!
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  New balance:{' '}
                  <span className="font-bold text-amber-500">🪙 {coinBalance.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Your coins are ready to use on gifts and live streams.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  Start Gifting 🎁
                </button>
              </>

            ) : error === 'stripe_contact' ? (
              /* ── Stripe contact-support state ── */
              <>
                <div className="text-4xl mb-4">💳</div>
                <h3 className="font-black text-xl text-foreground mb-2">
                  {selected?.coins.toLocaleString()} Coins
                </h3>
                <p className="text-primary font-bold text-lg mb-4">${selected?.price.toFixed(2)} USD</p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-5 text-left">
                  <p className="text-sm font-bold text-foreground mb-1">Complete your purchase</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Email us to receive your secure Stripe payment link. Coins will be added within minutes of payment confirmation.
                  </p>
                </div>
                <a
                  href={`mailto:support@philomni.com?subject=Coin Purchase - ${selected?.coins} Coins ($${selected?.price})&body=Hi Philomni Team,%0D%0A%0D%0AI'd like to purchase ${selected?.coins} coins for $${selected?.price} USD.%0D%0A%0D%0AMy account email: ${user?.email}%0D%0A`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors mb-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Email support@philomni.com
                </a>
                <button onClick={closeModal} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </>

            ) : (
              /* ── Default checkout state ── */
              <>
                <div className="text-5xl mb-4">🪙</div>
                <h3 className="font-black text-xl text-foreground mb-1">
                  {selected?.coins.toLocaleString()} Coins
                </h3>
                <p className="text-primary font-bold text-lg mb-4">${selected?.price.toFixed(2)} USD</p>

                {/* Provider badge */}
                {PAYSTACK_ACTIVE && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Secured by Paystack · NGN equivalent charged
                  </div>
                )}
                {STRIPE_ACTIVE && !PAYSTACK_ACTIVE && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Secured by Stripe
                  </div>
                )}
                {!PAYSTACK_ACTIVE && !STRIPE_ACTIVE && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-left">
                    <p className="text-sm font-bold text-foreground mb-1">Coin purchases launching soon!</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You'll be notified when payments go live. Your interest has been noted ✓
                    </p>
                  </div>
                )}

                {error && error !== 'stripe_contact' && (
                  <p className="text-xs text-destructive mb-3 bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Processing…' : PAYSTACK_ACTIVE ? `Pay $${selected?.price.toFixed(2)}` : STRIPE_ACTIVE ? `Pay with Stripe` : 'Notify Me When Live'}
                </button>
                <button onClick={closeModal} className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
