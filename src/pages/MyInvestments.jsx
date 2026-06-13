import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, DollarSign, Clock, ChevronRight, Tag, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'

// ─── List slot for sale modal ─────────────────────────────────────────────────
function ListForSaleModal({ pledge, offering, onClose, onListed }) {
  const { user } = useAuth()
  const [askPrice, setAskPrice] = useState(pledge.amount ?? offering?.price_per_slot ?? 50)
  const [slotsToSell, setSlotsToSell] = useState(pledge.slots ?? 1)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('slot_listings').insert({
      pledge_id:      pledge.id,
      offering_id:    pledge.offering_id,
      seller_id:      user.id,
      slots_for_sale: slotsToSell,
      ask_price:      askPrice,
      currency:       'USD',
      status:         'active',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Slot listed on secondary market!')
    onListed?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-white mb-4">List Slot for Sale</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Slots to sell</label>
            <input
              type="number" min={1} max={pledge.slots}
              value={slotsToSell}
              onChange={e => setSlotsToSell(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Ask price per slot (USD)</label>
            <input
              type="number" min={1}
              value={askPrice}
              onChange={e => setAskPrice(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
          <p className="text-xs text-zinc-500">Philomni takes 5% of the sale price as a platform fee.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Listing…' : 'List for Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Investment card ──────────────────────────────────────────────────────────
function InvestmentCard({ pledge, earnings, onSell }) {
  const offering  = pledge.offering
  const creator   = offering?.creator
  const totalEarned = earnings.reduce((s, e) => s + Number(e.earned_amount), 0)
  const roi = pledge.amount > 0 ? ((totalEarned / pledge.amount) * 100).toFixed(1) : '0.0'
  const sharePct = offering?.total_slots > 0
    ? ((pledge.slots / offering.total_slots) * offering?.percentage_share).toFixed(2)
    : '0'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Creator */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.full_name ?? 'C')}&background=7c3aed&color=fff`}
          className="w-10 h-10 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors truncate block">
            {creator?.full_name}
          </Link>
          <p className="text-xs text-zinc-500">@{creator?.username}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          pledge.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {pledge.status}
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-4 line-clamp-1">{offering?.title}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">You own</p>
          <p className="text-base font-bold text-white">{sharePct}%</p>
          <p className="text-xs text-zinc-600">{pledge.slots} slot{pledge.slots !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Total earned</p>
          <p className="text-base font-bold text-green-400">${totalEarned.toFixed(2)}</p>
          <p className="text-xs text-zinc-600">ROI: {roi}%</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Backed for</p>
          <p className="text-base font-bold text-white">${Number(pledge.amount).toFixed(2)}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Duration</p>
          <p className="text-base font-bold text-white">{offering?.duration_months}mo</p>
        </div>
      </div>

      {/* Earnings history */}
      {earnings.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-400 mb-2">Recent payouts</p>
          <div className="space-y-1">
            {earnings.slice(0, 3).map(e => (
              <div key={e.id} className="flex justify-between text-xs">
                <span className="text-zinc-500">{new Date(e.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>
                <span className="text-green-400 font-medium">+${Number(e.earned_amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-zinc-800/60">
        <Link
          to={`/creator-fund`}
          className="flex-1 text-center text-xs text-zinc-400 hover:text-white py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
        >
          View Offering
        </Link>
        {pledge.status === 'confirmed' && (
          <button
            onClick={() => onSell(pledge, offering)}
            className="flex-1 text-xs text-purple-400 hover:text-white py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Tag className="w-3 h-3" /> Sell Slots
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyInvestments() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [pledges,  setPledges]  = useState([])
  const [earnings, setEarnings] = useState({}) // pledge_id → earnings[]
  const [loading,  setLoading]  = useState(true)
  const [selling,  setSelling]  = useState(null) // { pledge, offering }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  async function load() {
    const { data: pl } = await supabase
      .from('creator_pledges')
      .select(`
        *,
        offering:offering_id (
          id, title, percentage_share, total_slots, duration_months,
          price_per_slot, status,
          creator:creator_id (id, full_name, username, avatar_url)
        )
      `)
      .eq('supporter_id', user.id)
      .order('created_at', { ascending: false })

    setPledges(pl ?? [])

    if (pl?.length) {
      const pledgeIds = pl.map(p => p.id)
      const { data: earn } = await supabase
        .from('creator_backer_earnings')
        .select('*')
        .in('pledge_id', pledgeIds)
        .order('created_at', { ascending: false })

      const map = {}
      ;(earn ?? []).forEach(e => {
        if (!map[e.pledge_id]) map[e.pledge_id] = []
        map[e.pledge_id].push(e)
      })
      setEarnings(map)
    }

    setLoading(false)
  }

  const totalInvested = pledges.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const totalEarned   = Object.values(earnings).flat().reduce((s, e) => s + Number(e.earned_amount), 0)
  const overallROI    = totalInvested > 0 ? ((totalEarned / totalInvested) * 100).toFixed(1) : '0.0'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {selling && (
        <ListForSaleModal
          pledge={selling.pledge}
          offering={selling.offering}
          onClose={() => setSelling(null)}
          onListed={load}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">My Investments</h1>
          <p className="text-sm text-zinc-500">Your Creator Fund portfolio</p>
        </div>
        <button
          onClick={() => navigate('/creator-fund')}
          className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Browse more <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary stats */}
      {!loading && pledges.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Total invested</p>
            <p className="text-xl font-bold text-white">${totalInvested.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Total earned</p>
            <p className="text-xl font-bold text-green-400">${totalEarned.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Overall ROI</p>
            <p className={`text-xl font-bold ${Number(overallROI) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {overallROI}%
            </p>
          </div>
        </div>
      )}

      {/* Portfolio */}
      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-52 animate-pulse" />)}
        </div>
      ) : pledges.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">You haven't backed any creators yet.</p>
          <button
            onClick={() => navigate('/creator-fund')}
            className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Explore Creators
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pledges.map(p => (
            <InvestmentCard
              key={p.id}
              pledge={p}
              earnings={earnings[p.id] ?? []}
              onSell={(pledge, offering) => setSelling({ pledge, offering })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
