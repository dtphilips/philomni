import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  TrendingUp, Users, DollarSign, Clock, Plus, ChevronRight,
  Star, Zap, Award, Search, Filter, X, Flame, Tag, ArrowLeftRight
} from 'lucide-react'

// ─── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ endsAt }) {
  const [parts, setParts] = useState({})

  useEffect(() => {
    function tick() {
      const diff = new Date(endsAt) - Date.now()
      if (diff <= 0) { setParts({ expired: true }); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (parts.expired) return <span className="text-xs text-red-400 font-medium">Offer closed</span>
  if (!parts.d && parts.d !== 0) return null

  return (
    <div className="flex items-center gap-1 text-xs">
      <Clock className="w-3 h-3 text-orange-400" />
      <span className="text-orange-400 font-medium tabular-nums">
        {parts.d > 0 && `${parts.d}d `}{String(parts.h).padStart(2,'0')}:{String(parts.m).padStart(2,'0')}:{String(parts.s).padStart(2,'0')}
      </span>
      <span className="text-zinc-500">left</span>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open:   { label: 'Open',    bg: 'bg-green-500/20',  text: 'text-green-400' },
    funded: { label: 'Funded',  bg: 'bg-purple-500/20', text: 'text-purple-400' },
    closed: { label: 'Closed',  bg: 'bg-zinc-500/20',   text: 'text-zinc-400' },
  }
  const s = map[status] ?? map.open
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ filled, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Offering card ────────────────────────────────────────────────────────────
function OfferingCard({ offering, onBack }) {
  const { user } = useAuth()
  const [pledging, setPledging] = useState(false)
  const [slots, setSlots] = useState(1)
  const slotsLeft  = offering.total_slots - (offering.slots_filled ?? 0)
  const isEarlyBird = offering.early_bird_slots > 0 &&
    (offering.slots_filled ?? 0) < offering.early_bird_slots
  const displayPrice = isEarlyBird && offering.early_bird_price > 0
    ? offering.early_bird_price
    : offering.price_per_slot
  const pctFilled = offering.total_slots > 0
    ? Math.round(((offering.slots_filled ?? 0) / offering.total_slots) * 100)
    : 0

  async function pledge() {
    if (!user) { toast.error('Sign in to back this creator'); return }
    setPledging(true)
    const amount = slots * displayPrice
    const { error } = await supabase.from('creator_pledges').insert({
      offering_id:         offering.id,
      supporter_id:        user.id,
      slots,
      amount,
      status:              'pending',
      agreement_signed_at: new Date().toISOString(),
    })
    setPledging(false)
    if (error) {
      if (error.code === '23505') toast.error('You already backed this creator')
      else toast.error(error.message)
      return
    }
    toast.success(`You backed ${offering.creator?.full_name ?? 'this creator'}! 🎉`)
    onBack?.()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Creator header */}
      <div className="p-5 pb-4 flex items-center gap-3 border-b border-zinc-800">
        <img
          src={offering.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(offering.creator?.full_name ?? 'C')}&background=7c3aed&color=fff`}
          className="w-10 h-10 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{offering.creator?.full_name}</p>
          <p className="text-xs text-zinc-500 truncate">@{offering.creator?.username}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={offering.status} />
          {/* Early-bird badge: first 20% of slots */}
          {offering.status === 'open' && offering.early_bird_slots > 0 &&
           (offering.slots_filled ?? 0) < offering.early_bird_slots && (
            <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
              <Flame className="w-3 h-3" /> Early Bird
            </span>
          )}
          {/* Scarcity: under 10% left */}
          {offering.status === 'open' && slotsLeft <= Math.max(1, Math.round(offering.total_slots * 0.10)) && slotsLeft > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium animate-pulse">
              {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left!
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-white mb-1">{offering.title}</h3>
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{offering.description}</p>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Revenue Share</p>
            <p className="text-base font-bold text-purple-400">{offering.percentage_share}%</p>
          </div>
          <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Duration</p>
            <p className="text-base font-bold text-white">{offering.duration_months}mo</p>
          </div>
          <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Per Slot</p>
            {isEarlyBird && offering.early_bird_price > 0 ? (
              <div>
                <p className="text-base font-bold text-orange-400">${offering.early_bird_price}</p>
                <p className="text-xs text-zinc-600 line-through">${offering.price_per_slot}</p>
              </div>
            ) : (
              <p className="text-base font-bold text-white">${offering.price_per_slot}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>{offering.slots_filled ?? 0} of {offering.total_slots} slots filled</span>
            <span>{pctFilled}%</span>
          </div>
          <ProgressBar filled={offering.slots_filled ?? 0} total={offering.total_slots} />
        </div>

        {/* Countdown */}
        {offering.ends_at && offering.status === 'open' && (
          <div className="mb-3">
            <Countdown endsAt={offering.ends_at} />
          </div>
        )}

        {/* Perks */}
        {offering.perks?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-zinc-400 mb-2">Supporter Perks</p>
            <div className="flex flex-wrap gap-1.5">
              {offering.perks.map((perk, i) => (
                <span key={i} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                  {perk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back action */}
        {offering.status === 'open' && slotsLeft > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
              <button
                onClick={() => setSlots(s => Math.max(1, s - 1))}
                className="px-3 py-2 text-zinc-400 hover:text-white transition-colors"
              >−</button>
              <span className="px-3 py-2 text-sm font-medium text-white min-w-[2rem] text-center">{slots}</span>
              <button
                onClick={() => setSlots(s => Math.min(slotsLeft, s + 1))}
                className="px-3 py-2 text-zinc-400 hover:text-white transition-colors"
              >+</button>
            </div>
            <button
              onClick={pledge}
              disabled={pledging}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {pledging ? 'Backing…' : `Back for $${slots * displayPrice}${isEarlyBird ? ' 🔥' : ''}`}
            </button>
          </div>
        )}
        {offering.status === 'funded' && (
          <div className="text-center text-sm text-purple-400 font-medium mt-2">
            Fully funded 🎉
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Secondary listing card ───────────────────────────────────────────────────
function SecondaryListingCard({ listing, onBought }) {
  const { user } = useAuth()
  const [buying, setBuying] = useState(false)
  const offering = listing.offering
  const creator  = offering?.creator
  const sharePct = offering?.total_slots > 0
    ? ((listing.slots_for_sale / offering.total_slots) * offering.percentage_share).toFixed(2)
    : '0'
  const platformFee  = listing.ask_price * 0.05
  const youPay       = listing.ask_price + platformFee

  async function buy() {
    if (!user) { toast.error('Sign in to buy'); return }
    if (user.id === listing.seller_id) { toast.error("You can't buy your own listing"); return }
    setBuying(true)

    // 1. Mark listing sold
    const { error: listErr } = await supabase
      .from('slot_listings')
      .update({ status: 'sold', sold_at: new Date().toISOString() })
      .eq('id', listing.id)

    if (listErr) { toast.error(listErr.message); setBuying(false); return }

    // 2. Create new pledge for buyer (secondary)
    const { error: pledgeErr } = await supabase
      .from('creator_pledges')
      .insert({
        offering_id:         listing.offering_id,
        supporter_id:        user.id,
        slots:               listing.slots_for_sale,
        amount:              listing.ask_price,
        status:              'confirmed',
        is_secondary:        true,
        original_pledge_id:  listing.pledge_id,
        purchase_price:      listing.ask_price,
        agreement_signed_at: new Date().toISOString(),
      })

    if (pledgeErr) { toast.error(pledgeErr.message); setBuying(false); return }

    // 3. Record purchase
    await supabase.from('slot_purchases').insert({
      listing_id:  listing.id,
      buyer_id:    user.id,
      seller_id:   listing.seller_id,
      offering_id: listing.offering_id,
      slots:       listing.slots_for_sale,
      price_paid:  listing.ask_price,
      platform_fee: platformFee,
    })

    setBuying(false)
    toast.success('Slot purchased! Check My Investments 🎉')
    onBought?.()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Creator */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/60">
        <img
          src={creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.full_name ?? 'C')}&background=7c3aed&color=fff`}
          className="w-9 h-9 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{creator?.full_name}</p>
          <p className="text-xs text-zinc-500 truncate">{offering?.title}</p>
        </div>
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
          Secondary
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">You get</p>
          <p className="text-sm font-bold text-purple-400">{sharePct}%</p>
          <p className="text-xs text-zinc-600">{listing.slots_for_sale} slot{listing.slots_for_sale !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">Duration</p>
          <p className="text-sm font-bold text-white">{offering?.duration_months}mo</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">Ask price</p>
          <p className="text-sm font-bold text-white">${listing.ask_price}</p>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="bg-zinc-800/40 rounded-xl px-3 py-2 mb-4 text-xs space-y-1">
        <div className="flex justify-between text-zinc-500">
          <span>Slot price</span><span>${listing.ask_price}</span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Platform fee (5%)</span><span>${platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-semibold pt-1 border-t border-zinc-700">
          <span>You pay</span><span>${youPay.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={buy}
        disabled={buying || user?.id === listing.seller_id}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {buying ? 'Buying…' : user?.id === listing.seller_id ? 'Your listing' : `Buy for $${youPay.toFixed(2)}`}
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreatorFund() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab,      setTab]      = useState('offerings') // 'offerings' | 'secondary'
  const [offerings, setOfferings] = useState([])
  const [listings,  setListings]  = useState([])
  const [loading,  setLoading]   = useState(true)
  const [search,   setSearch]    = useState('')
  const [filter,   setFilter]    = useState('open')
  const [myOffering, setMyOffering] = useState(null)

  useEffect(() => {
    loadOfferings()
    loadListings()
    if (user) loadMyOffering()
  }, [user])

  async function loadOfferings() {
    const { data } = await supabase
      .from('creator_offerings')
      .select(`*, creator:creator_id (id, full_name, username, avatar_url, headline)`)
      .order('created_at', { ascending: false })
    setOfferings(data ?? [])
    setLoading(false)
  }

  async function loadListings() {
    const { data } = await supabase
      .from('slot_listings')
      .select(`
        *,
        offering:offering_id (
          id, title, percentage_share, total_slots, duration_months, status,
          creator:creator_id (id, full_name, username, avatar_url)
        )
      `)
      .eq('status', 'active')
      .order('listed_at', { ascending: false })
    setListings(data ?? [])
  }

  async function loadMyOffering() {
    const { data } = await supabase
      .from('creator_offerings')
      .select('id, title, status, slots_filled, total_slots, raised_amount')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) setMyOffering(data)
  }

  const filtered = offerings.filter(o => {
    const matchSearch = !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.creator?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.creator?.username?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  const filteredListings = listings.filter(l =>
    !search ||
    l.offering?.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.offering?.creator?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-purple-900/60 via-violet-900/40 to-zinc-900 border border-purple-800/30 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">Revenue Share Agreements</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Back a Creator</h1>
          <p className="text-zinc-400 max-w-lg mb-6">
            Support creators you believe in and earn a share of their future Philomni revenue.
            These are revenue share agreements — not equity, not loans.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/creator-fund/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Offering
            </button>
            {myOffering && (
              <button
                onClick={() => navigate('/creator-fund/manage')}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors border border-zinc-700"
              >
                Manage My Offering
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* My offering banner */}
      {myOffering && (
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Your offering</p>
            <p className="text-sm font-semibold text-white">{myOffering.title}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {myOffering.slots_filled ?? 0}/{myOffering.total_slots} slots · ${myOffering.raised_amount ?? 0} raised
            </p>
          </div>
          <StatusBadge status={myOffering.status} />
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Star,   title: 'Pick a Creator', desc: 'Choose someone whose content you already love and believe in.' },
          { icon: DollarSign, title: 'Buy Slots',  desc: 'Each slot = a fixed price for a % share of their monthly Philomni earnings.' },
          { icon: TrendingUp, title: 'Earn Together', desc: 'As they grow on Philomni, you earn proportional revenue for the agreed duration.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <p className="text-xs text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('offerings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'offerings'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Offerings
        </button>
        <button
          onClick={() => setTab('secondary')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'secondary'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Secondary Market
          {listings.length > 0 && (
            <span className="bg-blue-500/30 text-blue-300 text-xs px-1.5 py-0.5 rounded-full">
              {listings.length}
            </span>
          )}
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators or offerings…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {['open', 'funded', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — Offerings tab */}
      {tab === 'offerings' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {offerings.length === 0
                ? 'No offerings yet — be the first creator to launch one!'
                : 'No offerings match your search.'}
            </p>
            {offerings.length === 0 && (
              <button
                onClick={() => navigate('/creator-fund/create')}
                className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Create Offering
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(o => (
              <OfferingCard key={o.id} offering={o} onBack={loadOfferings} />
            ))}
          </div>
        )
      )}

      {/* Grid — Secondary Market tab */}
      {tab === 'secondary' && (
        filteredListings.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-zinc-400">No slots listed for sale yet</p>
            <p className="text-xs mt-1">
              Backers can list their slots here from{' '}
              <button onClick={() => navigate('/my-investments')} className="text-purple-400 hover:underline">
                My Investments
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredListings.map(l => (
              <SecondaryListingCard
                key={l.id}
                listing={l}
                onBought={() => { loadListings(); }}
              />
            ))}
          </div>
        )
      )}

      {/* Legal disclaimer */}
      <div className="mt-10 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-xs text-zinc-500 leading-relaxed">
        <strong className="text-zinc-400">Important:</strong> Backing a creator through Philomni constitutes a
        Revenue Share Agreement — a contractual right to a percentage of that creator's Philomni earnings
        for a specified period. This is not an investment in equity, securities, or any regulated financial product.
        Philomni acts as the agreement facilitator and payment processor only. Past performance does not guarantee
        future earnings. Only back creators whose work you genuinely support.
      </div>
    </div>
  )
}
