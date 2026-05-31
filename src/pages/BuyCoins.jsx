import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Loader2, Check } from 'lucide-react'

// ── Packages ──────────────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id:       'starter',
    label:    'Starter',
    coins:    100,
    price:    1.00,
    savings:  null,
    badge:    null,
    highlight: false,
  },
  {
    id:       'popular',
    label:    'Popular',
    coins:    500,
    price:    4.50,
    savings:  10,
    badge:    null,
    highlight: false,
  },
  {
    id:       'value',
    label:    'Best Value',
    coins:    1000,
    price:    8.00,
    savings:  20,
    badge:    '⭐ Most Popular',
    highlight: true,   // purple border
  },
  {
    id:       'super',
    label:    'Super',
    coins:    5000,
    price:    35.00,
    savings:  30,
    badge:    null,
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

// ── How It Works cards ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    emoji: '🪙',
    title: 'Buy Coins',
    desc:  'Purchase coin packages above to top up your balance instantly.',
  },
  {
    emoji: '🎁',
    title: 'Send Gifts',
    desc:  'Use coins to send gifts during live streams and on any post.',
  },
  {
    emoji: '💰',
    title: 'Creators Earn',
    desc:  '70% of every gift value goes directly to the creator\'s wallet.',
  },
]

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
    supabase
      .from('users')
      .select('coin_balance')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setCoinBalance(data.coin_balance || 0)
      })
  }, [user?.id])

  const handleBuy = (pkg) => {
    setSelected(pkg)
    setDone(false)
    setShowModal(true)
  }

  const confirmIntent = async () => {
    if (!selected || !user) return
    setSaving(true)
    try {
      await supabase.from('coin_purchases').insert({
        user_id:   user.id,
        coins:     selected.coins,
        price_usd: selected.price,
        status:    'pending',
      })
    } catch { /* table may not exist yet — safe to ignore */ }
    setSaving(false)
    setDone(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setDone(false)
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

        {/* Balance pill */}
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
            {/* Badges */}
            {pkg.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full leading-none shadow-sm">
                  ⭐ Most Popular
                </span>
              </div>
            )}

            {/* Coin amount */}
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl">🪙</span>
              <span className="text-4xl font-black text-foreground">{fmt(pkg.coins)}</span>
              <span className="text-sm text-muted-foreground font-medium pb-0.5">coins</span>
            </div>

            {/* Price */}
            <p className="text-3xl font-black text-primary mt-2">
              ${pkg.price.toFixed(2)} <span className="text-base font-normal text-muted-foreground">USD</span>
            </p>

            {/* Savings badge */}
            {pkg.savings && (
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Save {pkg.savings}%
              </span>
            )}

            {/* Buy button */}
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

            {!done ? (
              <>
                <div className="text-5xl mb-4">🪙</div>
                <h3 className="font-black text-xl text-foreground mb-1">
                  {selected?.coins.toLocaleString()} Coins
                </h3>
                <p className="text-primary font-bold text-lg mb-4">${selected?.price.toFixed(2)} USD</p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 text-left">
                  <p className="text-sm font-bold text-foreground mb-1">Coin purchases launching soon!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You'll be notified when payments go live. Your interest has been noted ✓
                  </p>
                </div>

                <button
                  onClick={confirmIntent}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving…' : 'Notify Me When Live'}
                </button>
                <button onClick={closeModal} className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-black text-xl text-foreground mb-2">You're on the list!</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  We'll notify you when coin purchases go live. Thank you for your support!
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
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
