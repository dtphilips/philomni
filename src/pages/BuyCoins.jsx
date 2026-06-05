import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { X, Loader2, Check, CreditCard } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  PAYMENT_CONFIG,
  PROVIDER_BADGES,
  getUserCountry,
  getPaymentProvider,
  loadPaystackScript,
  openPaystackPopup,
  loadFlutterwaveScript,
  openFlutterwaveCheckout,
  createPaymentIntent,
  recordPayment,
} from '../lib/payments'

// ── Stripe singleton (only when key present) ──────────────────────────────────
const stripePromise = PAYMENT_CONFIG.stripe.active
  ? loadStripe(PAYMENT_CONFIG.stripe.publishableKey)
  : null

// ── Packages ──────────────────────────────────────────────────────────────────
const PACKAGES = [
  { id: 'starter', label: 'Starter',    coins: 100,  price: 1.00,  savings: null, highlight: false },
  { id: 'popular', label: 'Popular',    coins: 500,  price: 4.50,  savings: 10,   highlight: false },
  { id: 'value',   label: 'Best Value', coins: 1000, price: 8.00,  savings: 20,   highlight: true  },
  { id: 'super',   label: 'Super',      coins: 5000, price: 35.00, savings: 30,   highlight: false },
]

const GIFTS = [
  { emoji: '🌹', name: 'Rose',     cost: 1    },
  { emoji: '❤️', name: 'Heart',    cost: 5    },
  { emoji: '⭐', name: 'Star',     cost: 10   },
  { emoji: '🔥', name: 'Fire',     cost: 20   },
  { emoji: '👑', name: 'Crown',    cost: 50   },
  { emoji: '💎', name: 'Diamond',  cost: 100  },
  { emoji: '🚀', name: 'Rocket',   cost: 200  },
  { emoji: '🌌', name: 'Galaxy',   cost: 500  },
  { emoji: '✨', name: 'Philomni', cost: 1000 },
  { emoji: '🏆', name: 'Legend',   cost: 5000 },
]

function fmt(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n
}

const HOW_IT_WORKS = [
  { emoji: '🪙', title: 'Buy Coins',     desc: 'Purchase coin packages above to top up your balance instantly.' },
  { emoji: '🎁', title: 'Send Gifts',    desc: 'Use coins to send gifts during live streams and on any post.' },
  { emoji: '💰', title: 'Creators Earn', desc: "70% of every gift value goes directly to the creator's wallet." },
]

// ── Stripe Embedded Checkout Form ─────────────────────────────────────────────
function StripeCheckoutForm({ pkg, user, onSuccess, onCancel }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-payment`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount:   pkg.price,
            currency: 'usd',
            coins:    pkg.coins,
            userId:   user.id,
            email:    user.email,
          }),
        },
      )
      const { clientSecret, error: fnError } = await res.json()
      if (fnError) throw new Error(fnError)

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card:            elements.getElement(CardElement),
          billing_details: { email: user.email, name: user.full_name ?? user.email },
        },
      })
      if (stripeError) throw new Error(stripeError.message)
      if (paymentIntent.status === 'succeeded') {
        onSuccess({ provider: 'stripe', reference: paymentIntent.id })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Card details</label>
        <div className="p-3.5 bg-white rounded-xl border border-border/40 shadow-sm">
          <CardElement options={{
            style: {
              base:    { fontSize: '15px', color: '#1a1a1a', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#9ca3af' } },
              invalid: { color: '#ef4444' },
            },
          }} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={!stripe || loading}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          : <><CreditCard className="w-4 h-4" /> Pay ${pkg.price.toFixed(2)} USD</>}
      </button>
      <button type="button" onClick={onCancel}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        Cancel
      </button>
      <p className="text-[10px] text-muted-foreground text-center">
        🔒 Secured by Stripe · Your card is never stored on Philomni
      </p>
    </form>
  )
}

// ── Provider Badge ─────────────────────────────────────────────────────────────
function ProviderBadge({ provider }) {
  if (!provider) return null
  const badge = PROVIDER_BADGES[provider]
  if (!badge) return null
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-4">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${badge.dot}`} />
      {badge.text}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BuyCoins() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [coinBalance,       setCoinBalance]       = useState(0)
  const [selected,          setSelected]          = useState(null)
  const [detectedProvider,  setDetectedProvider]  = useState(null)   // 'paystack'|'flutterwave'|'stripe'|null
  const [detecting,         setDetecting]         = useState(false)  // spinner on "Buy Now" card
  const [detectingId,       setDetectingId]       = useState(null)   // which card is spinning
  const [showModal,         setShowModal]         = useState(false)
  const [paying,            setPaying]            = useState(false)  // popup launched, waiting
  const [done,              setDone]              = useState(false)
  const [newCoins,          setNewCoins]          = useState(0)      // coins just purchased

  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('coin_balance, coins_balance').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setCoinBalance(data.coins_balance ?? data.coin_balance ?? 0)
      })
  }, [user?.id])

  const closeModal = () => {
    if (paying) return
    setShowModal(false)
    setDone(false)
    setDetectedProvider(null)
    setSelected(null)
  }

  // ── Shared payment success handler ──────────────────────────────────────────
  const handlePaymentSuccess = async ({ provider, reference, coins, amount, intentId }) => {
    console.log('[BuyCoins] handlePaymentSuccess called', { provider, reference, coins, amount })
    try {
      // 1. Record in payment_intents ─────────────────────────────────────────
      if (intentId) {
        const { error: recErr } = await supabase
          .from('payment_intents')
          .update({
            status:              'completed',
            provider_payment_id: String(reference),
            completed_at:        new Date().toISOString(),
          })
          .eq('id', intentId)
        if (recErr) console.error('[BuyCoins] recordPayment error:', recErr)
      } else {
        const { error: insErr } = await supabase.from('payment_intents').insert({
          user_id:             user.id,
          amount:              Math.round((amount ?? 0) * 100),
          currency:            provider === 'paystack' ? 'ngn' : 'usd',
          type:                'coins',
          provider,
          status:              'completed',
          provider_payment_id: String(reference),
          metadata:            { coins },
          created_at:          new Date().toISOString(),
          completed_at:        new Date().toISOString(),
        })
        if (insErr) console.error('[BuyCoins] payment_intents insert error:', insErr)
      }

      // 2. Credit coins via SECURITY DEFINER RPC (bypasses RLS) ──────────────
      const { error: rpcErr } = await supabase.rpc('add_coins', {
        p_user_id: user.id,
        p_coins:   coins,
      })

      if (rpcErr) {
        // RPC not available yet — fall back to direct update
        console.error('[BuyCoins] add_coins RPC error, using fallback:', rpcErr)
        const { data: fresh, error: selErr } = await supabase
          .from('users')
          .select('coin_balance, coins_balance')
          .eq('id', user.id)
          .single()
        if (selErr) console.error('[BuyCoins] balance select error:', selErr)

        const { error: updErr } = await supabase
          .from('users')
          .update({
            coin_balance:  (fresh?.coin_balance  ?? 0) + coins,
            coins_balance: (fresh?.coins_balance ?? 0) + coins,
          })
          .eq('id', user.id)
        if (updErr) {
          console.error('[BuyCoins] balance update error:', updErr)
          toast.error('Payment received! Coins will be credited shortly. Contact support@philomni.com if not received within 1 hour.')
          return
        }
      }

      // 3. Refresh displayed balance from DB ────────────────────────────────
      const { data: refreshed } = await supabase
        .from('users').select('coin_balance, coins_balance').eq('id', user.id).single()
      const finalBalance = refreshed?.coins_balance ?? refreshed?.coin_balance ?? coinBalance + coins
      setCoinBalance(finalBalance)
      setNewCoins(coins)
      setDone(true)
      toast.success(`🪙 ${coins.toLocaleString()} coins added to your balance!`)
    } catch (err) {
      console.error('[BuyCoins] handlePaymentSuccess unexpected error:', err)
      toast.error('Payment received! Coins will be credited shortly. Contact support@philomni.com if not received within 1 hour.')
    } finally {
      setPaying(false)
    }
  }

  // ── Buy Now — detect country → open modal ───────────────────────────────────
  const handleBuyNow = async (pkg) => {
    if (!user) { navigate('/login'); return }
    setDetecting(true)
    setDetectingId(pkg.id)
    try {
      const country  = await getUserCountry()
      const provider = getPaymentProvider(country)
      setSelected(pkg)
      setDetectedProvider(provider)
      setDone(false)
      setShowModal(true)
    } finally {
      setDetecting(false)
      setDetectingId(null)
    }
  }

  // ── Paystack ────────────────────────────────────────────────────────────────
  const launchPaystack = async () => {
    if (!selected || !user) return
    setPaying(true)
    try {
      await loadPaystackScript()
      const amountKobo = Math.round(selected.price * 1500 * 100)
      const intent = await createPaymentIntent(supabase, {
        userId:   user.id,
        amount:   amountKobo,
        currency: 'ngn',
        type:     'coins',
        metadata: { coins: selected.coins, package: selected.id },
      })
      openPaystackPopup({
        email:      user.email,
        amountKobo,
        currency:   'NGN',
        metadata:   { coins: selected.coins, user_id: user.id, payment_intent_id: intent.id },
        onSuccess:  async (reference) => {
          await handlePaymentSuccess({
            provider: 'paystack', reference,
            coins: selected.coins, amount: selected.price,
            intentId: intent.id,
          })
        },
        onClose: () => setPaying(false),
      })
    } catch (err) {
      console.error('[BuyCoins] Paystack error:', err)
      toast.error('Payment could not be initialized. Please try again.')
      setPaying(false)
    }
  }

  // ── Flutterwave ─────────────────────────────────────────────────────────────
  const launchFlutterwave = async () => {
    if (!selected || !user) return
    setPaying(true)
    try {
      await loadFlutterwaveScript()
      openFlutterwaveCheckout({
        email:    user.email,
        name:     user.full_name ?? user.email,
        amount:   selected.price,
        currency: 'USD',
        txRef:    `phi-coins-${user.id}-${Date.now()}`,
        metadata: { coins: selected.coins, user_id: user.id, description: `${selected.coins} Philomni Coins` },
        onSuccess: async (reference) => {
          await handlePaymentSuccess({
            provider: 'flutterwave', reference,
            coins: selected.coins, amount: selected.price,
          })
        },
        onClose: () => setPaying(false),
      })
    } catch (err) {
      console.error('[BuyCoins] Flutterwave error:', err)
      toast.error('Payment could not be initialized. Please try again.')
      setPaying(false)
    }
  }

  // ── Stripe success callback (from StripeCheckoutForm) ───────────────────────
  const handleStripeSuccess = async ({ reference }) => {
    await handlePaymentSuccess({
      provider: 'stripe', reference,
      coins: selected.coins, amount: selected.price,
    })
  }

  // ── Which modal body to render ───────────────────────────────────────────────
  const renderModalBody = () => {
    // SUCCESS
    if (done) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-black text-xl text-foreground mb-2">
            {newCoins.toLocaleString()} Coins Added!
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            New balance:{' '}
            <span className="font-bold text-amber-500">🪙 {coinBalance.toLocaleString()}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Your coins are ready to use on gifts and live streams.
          </p>
          <button onClick={closeModal}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
            Start Gifting 🎁
          </button>
        </div>
      )
    }

    // Package header (shared across all non-done states)
    const pkgHeader = (
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🪙</div>
        <div>
          <h3 className="font-black text-lg text-foreground leading-tight">
            {selected?.coins.toLocaleString()} Coins
          </h3>
          <p className="text-primary font-bold">${selected?.price.toFixed(2)} USD</p>
        </div>
      </div>
    )

    // STRIPE — embedded card form
    if (detectedProvider === 'stripe' && stripePromise) {
      return (
        <div>
          {pkgHeader}
          <ProviderBadge provider="stripe" />
          <Elements stripe={stripePromise}>
            <StripeCheckoutForm
              pkg={selected}
              user={user}
              onSuccess={handleStripeSuccess}
              onCancel={closeModal}
            />
          </Elements>
        </div>
      )
    }

    // PAYSTACK or FLUTTERWAVE — popup button
    if (detectedProvider === 'paystack' || detectedProvider === 'flutterwave') {
      const launch = detectedProvider === 'paystack' ? launchPaystack : launchFlutterwave
      return (
        <div className="text-center">
          <div className="text-5xl mb-3">🪙</div>
          <h3 className="font-black text-xl text-foreground mb-1">
            {selected?.coins.toLocaleString()} Coins
          </h3>
          <p className="text-primary font-bold text-lg mb-3">${selected?.price.toFixed(2)} USD</p>
          <ProviderBadge provider={detectedProvider} />
          <button onClick={launch} disabled={paying}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            {paying
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              : `Pay $${selected?.price.toFixed(2)}`}
          </button>
          <button onClick={closeModal}
            className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      )
    }

    // NO PROVIDER ACTIVE — coming soon
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h3 className="font-black text-xl text-foreground mb-1">
          {selected?.coins.toLocaleString()} Coins
        </h3>
        <p className="text-primary font-bold text-lg mb-4">${selected?.price.toFixed(2)} USD</p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 text-left">
          <p className="text-sm font-bold text-foreground mb-1">Coin purchases launching soon!</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You'll be notified when payments go live in your region.
          </p>
        </div>
        <button onClick={closeModal}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
          Got it
        </button>
      </div>
    )
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
          <div key={pkg.id}
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
              ${pkg.price.toFixed(2)}{' '}
              <span className="text-base font-normal text-muted-foreground">USD</span>
            </p>
            {pkg.savings && (
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Save {pkg.savings}%
              </span>
            )}
            <button
              onClick={() => handleBuyNow(pkg)}
              disabled={detecting && detectingId === pkg.id}
              className={`mt-5 w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
                pkg.highlight
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
              }`}
            >
              {detecting && detectingId === pkg.id
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                : 'Buy Now'}
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
      {showModal && selected && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
          onClick={e => { if (e.target === e.currentTarget && !paying) closeModal() }}
        >
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
            {!paying && !done && (
              <button onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            {renderModalBody()}
          </div>
        </div>
      )}
    </div>
  )
}
