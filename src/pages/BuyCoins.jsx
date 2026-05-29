import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Loader2, Coins } from 'lucide-react'

const PACKAGES = [
  { id: 'starter', label: 'Starter',   coins: 100,  price: 1.00,  savings: null },
  { id: 'popular', label: 'Popular',   coins: 500,  price: 4.50,  savings: 10,  badge: '⭐ Most Popular' },
  { id: 'value',   label: 'Value',     coins: 1000, price: 8.00,  savings: 20 },
  { id: 'super',   label: 'Super',     coins: 5000, price: 35.00, savings: 30,  badge: '🔥 Best Value' },
]

function formatCoins(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n
}

export default function BuyCoins() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [coinBalance, setCoinBalance] = useState(user?.coin_balance || 0)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('coin_balance').eq('id', user.id).single()
      .then(({ data }) => { if (data) setCoinBalance(data.coin_balance || 0) })
  }, [user?.id])

  const handleBuy = async (pkg) => {
    setSelected(pkg)
    setShowModal(true)
  }

  const confirmIntent = async () => {
    if (!selected || !user) return
    setSaving(true)
    await supabase.from('coin_purchases').insert({
      user_id: user.id,
      coins: selected.coins,
      price_usd: selected.price,
      status: 'pending',
    })
    setSaving(false)
    setDone(true)
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🪙</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Buy Coins</h1>
        <p className="text-muted-foreground text-sm">Coins are used to send gifts during lives</p>

        {/* Current balance */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{coinBalance.toLocaleString()} coins</span>
          <span className="text-xs text-muted-foreground">your balance</span>
        </div>
      </div>

      {/* Package grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PACKAGES.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => handleBuy(pkg)}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all hover:border-primary hover:shadow-lg hover:-translate-y-0.5 ${
              pkg.id === 'popular'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            {/* Badge */}
            {pkg.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full leading-none">
                {pkg.badge}
              </span>
            )}

            {/* Coin amount */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🪙</span>
              <span className="text-3xl font-black text-foreground">{formatCoins(pkg.coins)}</span>
              <span className="text-sm text-muted-foreground font-medium">coins</span>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-primary mt-2">${pkg.price.toFixed(2)}</p>

            {/* Savings */}
            {pkg.savings && (
              <span className="inline-block mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Save {pkg.savings}%
              </span>
            )}

            {/* Buy button */}
            <div className="mt-4 w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold text-center">
              Buy Now
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-muted/50 rounded-2xl text-sm text-muted-foreground text-center">
        <p className="mb-1 font-medium text-foreground">Coin conversion rate</p>
        <p>100 coins = $1.00 USD • Gift creators during live streams</p>
        <p className="mt-1">Creators keep 70% of gift value in their wallet</p>
      </div>

      {/* Payment intent modal */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" onClick={e => e.target === e.currentTarget && !saving && setShowModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <button onClick={() => { setShowModal(false); setDone(false) }} className="absolute top-4 right-4">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {!done ? (
              <>
                <div className="text-5xl mb-4">🪙</div>
                <h3 className="font-bold text-lg mb-1">{selected?.coins.toLocaleString()} Coins — ${selected?.price.toFixed(2)}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Payment processing is coming soon. Your coins will be added once payment is set up. Join the waitlist and we'll notify you!
                </p>
                <button
                  onClick={confirmIntent}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving…' : 'Join Waitlist'}
                </button>
                <button onClick={() => setShowModal(false)} className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-bold text-lg mb-2">You're on the waitlist!</h3>
                <p className="text-sm text-muted-foreground mb-6">We'll notify you when coin purchases are live. Thank you for your interest!</p>
                <button onClick={() => { setShowModal(false); setDone(false) }} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
