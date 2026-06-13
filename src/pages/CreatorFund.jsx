import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  TrendingUp, DollarSign, Clock, Plus, ChevronRight, Star,
  Search, X, Flame, Tag, ArrowLeftRight, FileText, BarChart2,
  Wallet, Users, Award, AlertCircle
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open:   { label: 'Open',   bg: 'bg-green-500/20',  text: 'text-green-400' },
    funded: { label: 'Funded', bg: 'bg-purple-500/20', text: 'text-purple-400' },
    closed: { label: 'Closed', bg: 'bg-zinc-500/20',   text: 'text-zinc-400' },
  }
  const s = map[status] ?? map.open
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
}

function ProgressBar({ filled, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function Countdown({ endsAt }) {
  const [parts, setParts] = useState({})
  useEffect(() => {
    function tick() {
      const diff = new Date(endsAt) - Date.now()
      if (diff <= 0) { setParts({ expired: true }); return }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
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

// ─── Offering card ────────────────────────────────────────────────────────────
function OfferingCard({ offering, onBack }) {
  const { user } = useAuth()
  const [pledging, setPledging] = useState(false)
  const [slots, setSlots] = useState(1)
  const slotsLeft   = offering.total_slots - (offering.slots_filled ?? 0)
  const isEarlyBird = offering.early_bird_slots > 0 && (offering.slots_filled ?? 0) < offering.early_bird_slots
  const displayPrice = isEarlyBird && offering.early_bird_price > 0 ? offering.early_bird_price : offering.price_per_slot
  const pctFilled = offering.total_slots > 0 ? Math.round(((offering.slots_filled ?? 0) / offering.total_slots) * 100) : 0

  async function pledge() {
    if (!user) { toast.error('Sign in to back this creator'); return }
    setPledging(true)
    const amount = slots * displayPrice
    const { error } = await supabase.from('creator_pledges').insert({
      offering_id: offering.id, supporter_id: user.id, slots, amount,
      status: 'pending', agreement_signed_at: new Date().toISOString(),
    })
    setPledging(false)
    if (error) { toast.error(error.code === '23505' ? 'You already backed this creator' : error.message); return }
    toast.success(`You backed ${offering.creator?.full_name ?? 'this creator'}! 🎉`)
    onBack?.()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-5 pb-4 flex items-center gap-3 border-b border-zinc-800">
        <img src={offering.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(offering.creator?.full_name ?? 'C')}&background=7c3aed&color=fff`} className="w-10 h-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{offering.creator?.full_name}</p>
          <p className="text-xs text-zinc-500 truncate">@{offering.creator?.username}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={offering.status} />
          {offering.status === 'open' && isEarlyBird && (
            <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
              <Flame className="w-3 h-3" /> Early Bird
            </span>
          )}
          {offering.status === 'open' && slotsLeft <= Math.max(1, Math.round(offering.total_slots * 0.10)) && slotsLeft > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium animate-pulse">
              {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left!
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-white mb-1">{offering.title}</h3>
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{offering.description}</p>
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
              <div><p className="text-base font-bold text-orange-400">${offering.early_bird_price}</p><p className="text-xs text-zinc-600 line-through">${offering.price_per_slot}</p></div>
            ) : <p className="text-base font-bold text-white">${offering.price_per_slot}</p>}
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>{offering.slots_filled ?? 0} of {offering.total_slots} slots filled</span>
            <span>{pctFilled}%</span>
          </div>
          <ProgressBar filled={offering.slots_filled ?? 0} total={offering.total_slots} />
        </div>
        {offering.ends_at && offering.status === 'open' && <div className="mb-3"><Countdown endsAt={offering.ends_at} /></div>}
        {(offering.perks ?? []).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-zinc-400 mb-2">Supporter Perks</p>
            <div className="flex flex-wrap gap-1.5">
              {offering.perks.map((p, i) => <span key={i} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">{p}</span>)}
            </div>
          </div>
        )}
        {offering.status === 'open' && slotsLeft > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
              <button onClick={() => setSlots(s => Math.max(1, s - 1))} className="px-3 py-2 text-zinc-400 hover:text-white transition-colors">−</button>
              <span className="px-3 py-2 text-sm font-medium text-white min-w-[2rem] text-center">{slots}</span>
              <button onClick={() => setSlots(s => Math.min(slotsLeft, s + 1))} className="px-3 py-2 text-zinc-400 hover:text-white transition-colors">+</button>
            </div>
            <button onClick={pledge} disabled={pledging} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
              {pledging ? 'Backing…' : `Back for $${slots * displayPrice}${isEarlyBird ? ' 🔥' : ''}`}
            </button>
          </div>
        )}
        {offering.status === 'funded' && <div className="text-center text-sm text-purple-400 font-medium mt-2">Fully funded 🎉</div>}
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
  const sharePct = offering?.total_slots > 0 ? ((listing.slots_for_sale / offering.total_slots) * offering.percentage_share).toFixed(2) : '0'
  const platformFee = listing.ask_price * 0.05
  const youPay = listing.ask_price + platformFee

  async function buy() {
    if (!user) { toast.error('Sign in to buy'); return }
    if (user.id === listing.seller_id) { toast.error("You can't buy your own listing"); return }
    setBuying(true)
    const { error: listErr } = await supabase.from('slot_listings').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', listing.id)
    if (listErr) { toast.error(listErr.message); setBuying(false); return }
    await supabase.from('creator_pledges').insert({
      offering_id: listing.offering_id, supporter_id: user.id, slots: listing.slots_for_sale,
      amount: listing.ask_price, status: 'confirmed', is_secondary: true,
      original_pledge_id: listing.pledge_id, purchase_price: listing.ask_price,
      agreement_signed_at: new Date().toISOString(),
    })
    await supabase.from('slot_purchases').insert({
      listing_id: listing.id, buyer_id: user.id, seller_id: listing.seller_id,
      offering_id: listing.offering_id, slots: listing.slots_for_sale,
      price_paid: listing.ask_price, platform_fee: platformFee,
    })
    setBuying(false)
    toast.success('Slot purchased! Check My Investments tab 🎉')
    onBought?.()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/60">
        <img src={creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.full_name ?? 'C')}&background=7c3aed&color=fff`} className="w-9 h-9 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{creator?.full_name}</p>
          <p className="text-xs text-zinc-500 truncate">{offering?.title}</p>
        </div>
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">Secondary</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500 mb-0.5">You get</p><p className="text-sm font-bold text-purple-400">{sharePct}%</p><p className="text-xs text-zinc-600">{listing.slots_for_sale} slot{listing.slots_for_sale !== 1 ? 's' : ''}</p></div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500 mb-0.5">Duration</p><p className="text-sm font-bold text-white">{offering?.duration_months}mo</p></div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500 mb-0.5">Ask</p><p className="text-sm font-bold text-white">${listing.ask_price}</p></div>
      </div>
      <div className="bg-zinc-800/40 rounded-xl px-3 py-2 mb-4 text-xs space-y-1">
        <div className="flex justify-between text-zinc-500"><span>Slot price</span><span>${listing.ask_price}</span></div>
        <div className="flex justify-between text-zinc-500"><span>Platform fee (5%)</span><span>${platformFee.toFixed(2)}</span></div>
        <div className="flex justify-between text-white font-semibold pt-1 border-t border-zinc-700"><span>You pay</span><span>${youPay.toFixed(2)}</span></div>
      </div>
      <button onClick={buy} disabled={buying || user?.id === listing.seller_id} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
        {buying ? 'Buying…' : user?.id === listing.seller_id ? 'Your listing' : `Buy for $${youPay.toFixed(2)}`}
      </button>
    </div>
  )
}

// ─── List for sale modal ──────────────────────────────────────────────────────
function ListForSaleModal({ pledge, offering, onClose, onListed }) {
  const { user } = useAuth()
  const [askPrice, setAskPrice] = useState(pledge.amount ?? offering?.price_per_slot ?? 50)
  const [saving, setSaving] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('slot_listings').insert({
      pledge_id: pledge.id, offering_id: pledge.offering_id, seller_id: user.id,
      slots_for_sale: pledge.slots, ask_price: askPrice, currency: 'USD', status: 'active',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Slot listed on Secondary Market!')
    onListed?.(); onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-white mb-4">List Slot for Sale</h2>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm text-zinc-400 mb-1.5">Ask price (USD)</label>
            <input type="number" min={1} value={askPrice} onChange={e => setAskPrice(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600" />
          </div>
          <p className="text-xs text-zinc-500">Philomni takes 5% of the sale price.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">{saving ? 'Listing…' : 'List'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── My Investments tab ───────────────────────────────────────────────────────
function MyInvestmentsTab({ onSell }) {
  const { user } = useAuth()
  const [pledges,  setPledges]  = useState([])
  const [earnings, setEarnings] = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data: pl } = await supabase.from('creator_pledges')
      .select(`*, offering:offering_id (id, title, percentage_share, total_slots, duration_months, price_per_slot, status, creator:creator_id (id, full_name, username, avatar_url))`)
      .eq('supporter_id', user.id).order('created_at', { ascending: false })
    setPledges(pl ?? [])
    if (pl?.length) {
      const { data: earn } = await supabase.from('creator_backer_earnings').select('*').in('pledge_id', pl.map(p => p.id)).order('created_at', { ascending: false })
      const map = {}
      ;(earn ?? []).forEach(e => { if (!map[e.pledge_id]) map[e.pledge_id] = []; map[e.pledge_id].push(e) })
      setEarnings(map)
    }
    setLoading(false)
  }

  const totalInvested = pledges.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const totalEarned   = Object.values(earnings).flat().reduce((s, e) => s + Number(e.earned_amount), 0)
  const roi = totalInvested > 0 ? ((totalEarned / totalInvested) * 100).toFixed(1) : '0.0'

  if (!user) return <div className="text-center py-20 text-zinc-500 text-sm">Sign in to see your investments</div>

  if (loading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-44 animate-pulse" />)}</div>

  if (pledges.length === 0) return (
    <div className="text-center py-20 text-zinc-500">
      <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">You haven't backed any creators yet.</p>
      <p className="text-xs mt-1 text-zinc-600">Go to Browse to find creators to back.</p>
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">Invested</p><p className="text-xl font-bold text-white">${totalInvested.toFixed(2)}</p></div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">Earned</p><p className="text-xl font-bold text-green-400">${totalEarned.toFixed(2)}</p></div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">ROI</p><p className={`text-xl font-bold ${Number(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi}%</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pledges.map(p => {
          const offering = p.offering
          const creator  = offering?.creator
          const sharePct = offering?.total_slots > 0 ? ((p.slots / offering.total_slots) * offering.percentage_share).toFixed(2) : '0'
          const earned   = (earnings[p.id] ?? []).reduce((s, e) => s + Number(e.earned_amount), 0)
          const pledgeROI = p.amount > 0 ? ((earned / p.amount) * 100).toFixed(1) : '0.0'
          return (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <img src={creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.full_name ?? 'C')}&background=7c3aed&color=fff`} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors truncate block">{creator?.full_name}</Link>
                  <p className="text-xs text-zinc-500">@{creator?.username}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-zinc-800/60 rounded-xl p-3"><p className="text-xs text-zinc-500 mb-0.5">Your share</p><p className="text-base font-bold text-white">{sharePct}%</p><p className="text-xs text-zinc-600">{p.slots} slot{p.slots !== 1 ? 's' : ''}</p></div>
                <div className="bg-zinc-800/60 rounded-xl p-3"><p className="text-xs text-zinc-500 mb-0.5">Total earned</p><p className="text-base font-bold text-green-400">${earned.toFixed(2)}</p><p className="text-xs text-zinc-600">ROI: {pledgeROI}%</p></div>
                <div className="bg-zinc-800/60 rounded-xl p-3"><p className="text-xs text-zinc-500 mb-0.5">Backed</p><p className="text-base font-bold text-white">${Number(p.amount).toFixed(2)}</p></div>
                <div className="bg-zinc-800/60 rounded-xl p-3"><p className="text-xs text-zinc-500 mb-0.5">Duration</p><p className="text-base font-bold text-white">{offering?.duration_months}mo</p></div>
              </div>
              {(earnings[p.id] ?? []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-zinc-400 mb-2">Recent payouts</p>
                  {(earnings[p.id] ?? []).slice(0, 3).map(e => (
                    <div key={e.id} className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">{new Date(e.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>
                      <span className="text-green-400 font-medium">+${Number(e.earned_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-zinc-800/60">
                {p.agreement_signed_at && (
                  <a href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-agreement?pledge_id=${p.id}`} target="_blank" rel="noreferrer"
                    className="flex-1 text-xs text-zinc-400 hover:text-white py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3" /> Agreement
                  </a>
                )}
                {p.status === 'confirmed' && (
                  <button onClick={() => onSell(p, offering)} className="flex-1 text-xs text-purple-400 hover:text-white py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1">
                    <Tag className="w-3 h-3" /> Sell Slots
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── My Offering tab ──────────────────────────────────────────────────────────
function MyOfferingTab() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [offering,  setOffering]  = useState(null)
  const [cycles,    setCycles]    = useState([])
  const [pledges,   setPledges]   = useState([])
  const [valuation, setValuation] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data: off } = await supabase.from('creator_offerings').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).single()
    setOffering(off)
    if (off) {
      const [{ data: cyc }, { data: pl }] = await Promise.all([
        supabase.from('creator_payout_cycles').select('*').eq('offering_id', off.id).order('period_month', { ascending: false }).limit(6),
        supabase.from('creator_pledges').select('*, supporter:supporter_id(id, full_name, username, avatar_url)').eq('offering_id', off.id).order('created_at', { ascending: false }),
      ])
      setCycles(cyc ?? [])
      setPledges(pl ?? [])
    }
    const { data: val } = await supabase.from('creator_valuation_scores').select('*').eq('creator_id', user.id).single()
    setValuation(val)
    setLoading(false)
  }

  async function refreshValuation() {
    toast.loading('Calculating your score…')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-creator-valuation?creator_id=${user.id}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } })
    toast.dismiss()
    res.ok ? (toast.success('Score updated!'), load()) : toast.error('Could not refresh score')
  }

  if (!user) return <div className="text-center py-20 text-zinc-500 text-sm">Sign in to manage your offering</div>
  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-24 animate-pulse" />)}</div>

  if (!offering) return (
    <div className="text-center py-20 text-zinc-500">
      <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium text-zinc-400">You haven't created an offering yet</p>
      <p className="text-xs mt-1 mb-4">Let your community back your creator journey</p>
      <button onClick={() => navigate('/creator-fund/create')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">Create Offering</button>
    </div>
  )

  const totalPaidOut     = cycles.filter(c => c.status === 'completed').reduce((s, c) => s + Number(c.payout_pool), 0)
  const confirmedBackers = pledges.filter(p => p.status === 'confirmed').length
  const slotsLeft        = offering.total_slots - (offering.slots_filled ?? 0)

  return (
    <div className="space-y-6">
      {/* Offering banner */}
      <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900 border border-purple-800/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-semibold text-white">{offering.title}</h2>
          <StatusBadge status={offering.status} />
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${Math.min(100, Math.round(((offering.slots_filled ?? 0) / offering.total_slots) * 100))}%` }} />
        </div>
        <p className="text-xs text-zinc-500">{offering.slots_filled ?? 0}/{offering.total_slots} slots filled · {slotsLeft} remaining</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total raised', value: `$${Number(offering.raised_amount ?? 0).toFixed(0)}`, color: 'text-green-400' },
          { label: 'Paid out', value: `$${totalPaidOut.toFixed(0)}`, color: 'text-purple-400' },
          { label: 'Backers', value: confirmedBackers },
          { label: 'Revenue share', value: `${offering.percentage_share}%`, sub: `${offering.duration_months}mo` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</p>
            {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Valuation score */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /><p className="text-sm font-semibold text-white">Your Philomni Score</p></div>
          <button onClick={refreshValuation} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Refresh</button>
        </div>
        {valuation ? (
          <>
            <div className="flex items-end gap-4 mb-4">
              <div><p className="text-5xl font-bold text-white">{valuation.philomni_score}</p><p className="text-xs text-zinc-500 mt-0.5">out of 1,000</p></div>
              <div className="flex-1 pb-1"><div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400" style={{ width: `${(valuation.philomni_score / 1000) * 100}%` }} /></div></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Followers', value: (valuation.follower_count ?? 0).toLocaleString() },
                { label: '30d growth', value: `+${valuation.follower_growth_30d?.toFixed(1)}%` },
                { label: 'Avg monthly', value: `$${valuation.avg_monthly_earnings?.toFixed(0)}` },
                { label: 'Reliability', value: `${valuation.reliability_score}%`, color: valuation.reliability_score >= 90 ? 'text-green-400' : 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label}><p className={`text-sm font-bold ${color ?? 'text-white'}`}>{value}</p><p className="text-xs text-zinc-500">{label}</p></div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
              <span>Suggested slot price: <span className="text-white font-medium">${valuation.suggested_slot_price}</span></span>
              <span>Suggested share: <span className="text-white font-medium">{valuation.suggested_share_pct}%</span></span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div className="flex-1"><p className="text-sm text-white">Score not calculated yet</p><p className="text-xs text-zinc-500">Click Refresh to generate your score</p></div>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Payout History</h3>
        {cycles.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-xs text-zinc-500">No payouts yet — first payout runs end of month</div>
        ) : cycles.map(c => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-white font-medium">{new Date(c.period_month).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-zinc-500">Gross: ${Number(c.gross_earnings).toFixed(2)} · {c.backers_paid} backers</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-400">−${Number(c.payout_pool).toFixed(2)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Backers */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Your Backers</h3>
        {pledges.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-xs text-zinc-500">No backers yet — share your offering</div>
        ) : pledges.map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 mb-2">
            <img src={p.supporter?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.supporter?.full_name ?? 'B')}&background=7c3aed&color=fff&size=32`} className="w-8 h-8 rounded-full" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{p.supporter?.full_name ?? 'Anonymous'}</p>
              <p className="text-xs text-zinc-500">{p.slots} slot{p.slots !== 1 ? 's' : ''} · ${Number(p.amount).toFixed(2)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreatorFund() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Allow deep-linking: /creator-fund?tab=investments
  const initialTab = searchParams.get('tab') ?? 'browse'
  const [tab,      setTab]      = useState(initialTab)
  const [subTab,   setSubTab]   = useState('offerings') // offerings | secondary
  const [offerings, setOfferings] = useState([])
  const [listings,  setListings]  = useState([])
  const [loading,  setLoading]   = useState(true)
  const [search,   setSearch]    = useState('')
  const [filter,   setFilter]    = useState('open')
  const [myOffering, setMyOffering] = useState(null)
  const [selling, setSelling]    = useState(null)

  useEffect(() => {
    loadOfferings(); loadListings()
    if (user) loadMyOffering()
  }, [user])

  async function loadOfferings() {
    const { data } = await supabase.from('creator_offerings')
      .select(`*, creator:creator_id (id, full_name, username, avatar_url, headline)`)
      .order('created_at', { ascending: false })
    setOfferings(data ?? [])
    setLoading(false)
  }

  async function loadListings() {
    const { data } = await supabase.from('slot_listings')
      .select(`*, offering:offering_id (id, title, percentage_share, total_slots, duration_months, status, creator:creator_id (id, full_name, username, avatar_url))`)
      .eq('status', 'active').order('listed_at', { ascending: false })
    setListings(data ?? [])
  }

  async function loadMyOffering() {
    const { data } = await supabase.from('creator_offerings').select('id, title, status, slots_filled, total_slots, raised_amount').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).single()
    if (data) setMyOffering(data)
  }

  const filtered = offerings.filter(o => {
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.creator?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'all' || o.status === filter)
  })
  const filteredListings = listings.filter(l => !search || l.offering?.title?.toLowerCase().includes(search.toLowerCase()) || l.offering?.creator?.full_name?.toLowerCase().includes(search.toLowerCase()))

  const TABS = [
    { id: 'browse',      label: 'Browse',          icon: TrendingUp },
    { id: 'investments', label: 'My Investments',   icon: Wallet },
    { id: 'offering',    label: 'Fund Dashboard',   icon: BarChart2 },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {selling && (
        <ListForSaleModal pledge={selling.pledge} offering={selling.offering}
          onClose={() => setSelling(null)} onListed={loadListings} />
      )}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-purple-900/60 via-violet-900/40 to-zinc-900 border border-purple-800/30 p-8">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 text-sm font-medium">Revenue Share Agreements</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Back a Creator</h1>
        <p className="text-zinc-400 max-w-lg mb-5">Support creators you believe in and earn a share of their Philomni revenue. Not equity, not loans — revenue share agreements.</p>
        <button onClick={() => navigate('/creator-fund/create')} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Create Offering
        </button>
      </div>

      {/* My offering quick banner */}
      {myOffering && tab !== 'offering' && (
        <button onClick={() => setTab('offering')} className="w-full mb-4 bg-zinc-900 border border-zinc-800 hover:border-purple-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors text-left">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Your offering</p>
            <p className="text-sm font-semibold text-white">{myOffering.title}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{myOffering.slots_filled ?? 0}/{myOffering.total_slots} slots · ${myOffering.raised_amount ?? 0} raised</p>
          </div>
          <div className="flex items-center gap-2"><StatusBadge status={myOffering.status} /><ChevronRight className="w-4 h-4 text-zinc-600" /></div>
        </button>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === id ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}>
            <Icon className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setSubTab('offerings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${subTab === 'offerings' ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
              <TrendingUp className="w-4 h-4" /> Offerings
            </button>
            <button onClick={() => setSubTab('secondary')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${subTab === 'secondary' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
              <ArrowLeftRight className="w-4 h-4" /> Secondary Market
              {listings.length > 0 && <span className="bg-blue-500/30 text-blue-300 text-xs px-1.5 py-0.5 rounded-full">{listings.length}</span>}
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators or offerings…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            {subTab === 'offerings' && (
              <div className="flex gap-2">
                {['open','funded','all'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {subTab === 'offerings' && (
            loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{offerings.length === 0 ? 'No offerings yet — be the first!' : 'No offerings match your search.'}</p>
                {offerings.length === 0 && <button onClick={() => navigate('/creator-fund/create')} className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">Create Offering</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(o => <OfferingCard key={o.id} offering={o} onBack={loadOfferings} />)}
              </div>
            )
          )}

          {subTab === 'secondary' && (
            filteredListings.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-zinc-400">No slots listed for sale yet</p>
                <p className="text-xs mt-1">Go to <button onClick={() => setTab('investments')} className="text-purple-400 hover:underline">My Investments</button> to list your slots</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map(l => <SecondaryListingCard key={l.id} listing={l} onBought={loadListings} />)}
              </div>
            )
          )}

          {/* Legal disclaimer */}
          <div className="mt-10 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Important:</strong> Backing a creator constitutes a Revenue Share Agreement — a contractual right to a percentage of their Philomni earnings for a specified period. This is not equity, securities, or a regulated financial product.
          </div>
        </>
      )}

      {tab === 'investments' && <MyInvestmentsTab onSell={(pledge, offering) => setSelling({ pledge, offering })} />}
      {tab === 'offering'    && <MyOfferingTab />}
    </div>
  )
}
