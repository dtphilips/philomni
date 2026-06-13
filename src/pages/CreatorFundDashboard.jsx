import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  TrendingUp, DollarSign, Users, Clock, Edit2, Zap,
  ChevronRight, Award, BarChart2, AlertCircle
} from 'lucide-react'

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CreatorFundDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [offering,   setOffering]   = useState(null)
  const [cycles,     setCycles]     = useState([])
  const [pledges,    setPledges]    = useState([])
  const [valuation,  setValuation]  = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  async function load() {
    // Latest offering
    const { data: off } = await supabase
      .from('creator_offerings')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setOffering(off)

    if (off) {
      const [{ data: cyc }, { data: pl }] = await Promise.all([
        supabase.from('creator_payout_cycles')
          .select('*')
          .eq('offering_id', off.id)
          .order('period_month', { ascending: false })
          .limit(6),
        supabase.from('creator_pledges')
          .select('*, supporter:supporter_id(id, full_name, username, avatar_url)')
          .eq('offering_id', off.id)
          .order('created_at', { ascending: false }),
      ])
      setCycles(cyc ?? [])
      setPledges(pl ?? [])
    }

    // Valuation score
    const { data: val } = await supabase
      .from('creator_valuation_scores')
      .select('*')
      .eq('creator_id', user.id)
      .single()

    setValuation(val)
    setLoading(false)
  }

  async function refreshValuation() {
    toast.loading('Calculating your score…')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-creator-valuation?creator_id=${user.id}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    )
    toast.dismiss()
    if (res.ok) {
      toast.success('Score updated!')
      load()
    } else {
      toast.error('Could not refresh score')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-24 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const totalRaised   = offering?.raised_amount ?? 0
  const totalPaidOut  = cycles.filter(c => c.status === 'completed').reduce((s, c) => s + Number(c.payout_pool), 0)
  const confirmedBacks = pledges.filter(p => p.status === 'confirmed').length
  const slotsLeft     = (offering?.total_slots ?? 0) - (offering?.slots_filled ?? 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Creator Fund Dashboard</h1>
          <p className="text-sm text-zinc-500">Your offering performance & payout history</p>
        </div>
        <button
          onClick={() => navigate('/creator-fund/create')}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl transition-colors"
        >
          {offering ? <Edit2 className="w-3.5 h-3.5" /> : null}
          {offering ? 'New Offering' : 'Create Offering'}
        </button>
      </div>

      {!offering ? (
        <div className="text-center py-20 text-zinc-500">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">You haven't created an offering yet.</p>
          <button
            onClick={() => navigate('/creator-fund/create')}
            className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Create Your First Offering
          </button>
        </div>
      ) : (
        <>
          {/* Offering summary */}
          <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900 border border-purple-800/30 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-semibold text-white">{offering.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                offering.status === 'open' ? 'bg-green-500/20 text-green-400' :
                offering.status === 'funded' ? 'bg-purple-500/20 text-purple-400' :
                'bg-zinc-500/20 text-zinc-400'
              }`}>
                {offering.status}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                style={{ width: `${Math.min(100, Math.round(((offering.slots_filled ?? 0) / offering.total_slots) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {offering.slots_filled ?? 0} / {offering.total_slots} slots filled · {slotsLeft} remaining
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total raised" value={`$${Number(totalRaised).toFixed(0)}`} sub="from backers" color="text-green-400" />
            <StatCard label="Paid out" value={`$${totalPaidOut.toFixed(0)}`} sub="to backers" color="text-purple-400" />
            <StatCard label="Backers" value={confirmedBacks} sub="confirmed" />
            <StatCard label="Revenue share" value={`${offering.percentage_share}%`} sub={`for ${offering.duration_months} months`} />
          </div>

          {/* Valuation score */}
          {valuation ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-semibold text-white">Your Philomni Score</p>
                </div>
                <button
                  onClick={refreshValuation}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="text-5xl font-bold text-white">{valuation.philomni_score}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">out of 1,000</p>
                </div>
                <div className="flex-1 pb-1">
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400"
                      style={{ width: `${(valuation.philomni_score / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{(valuation.follower_count ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">+{valuation.follower_growth_30d?.toFixed(1)}%</p>
                  <p className="text-xs text-zinc-500">30d growth</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">${valuation.avg_monthly_earnings?.toFixed(0)}</p>
                  <p className="text-xs text-zinc-500">Avg monthly</p>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold ${valuation.reliability_score >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {valuation.reliability_score}%
                  </p>
                  <p className="text-xs text-zinc-500">Reliability</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                <span>Suggested slot price: <span className="text-white font-medium">${valuation.suggested_slot_price}</span></span>
                <span>Suggested share: <span className="text-white font-medium">{valuation.suggested_share_pct}%</span></span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Valuation score not calculated yet</p>
                  <p className="text-xs text-zinc-500">Your score will be generated automatically. Click to generate now.</p>
                </div>
                <button
                  onClick={refreshValuation}
                  className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
                >
                  Calculate
                </button>
              </div>
            </div>
          )}

          {/* Payout history */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">Payout History</h3>
            {cycles.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-xs text-zinc-500">
                No payouts yet — first payout runs end of month
              </div>
            ) : (
              <div className="space-y-2">
                {cycles.map(c => (
                  <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">
                        {new Date(c.period_month).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Gross earnings: ${Number(c.gross_earnings).toFixed(2)} · {c.backers_paid} backers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">−${Number(c.payout_pool).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        c.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backers list */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Your Backers</h3>
            {pledges.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-xs text-zinc-500">
                No backers yet — share your offering to get started
              </div>
            ) : (
              <div className="space-y-2">
                {pledges.map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                    <img
                      src={p.supporter?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.supporter?.full_name ?? 'B')}&background=7c3aed&color=fff&size=32`}
                      className="w-8 h-8 rounded-full"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{p.supporter?.full_name ?? 'Anonymous'}</p>
                      <p className="text-xs text-zinc-500">{p.slots} slot{p.slots !== 1 ? 's' : ''} · ${Number(p.amount).toFixed(2)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      p.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
