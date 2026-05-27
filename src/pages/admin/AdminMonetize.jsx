import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle,
  TrendingUp, Users, Eye,
} from 'lucide-react'

export default function AdminMonetize() {
  const { user } = useAuth()
  const [apps,        setApps]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [actionId,    setActionId]    = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason,      setReason]      = useState('')
  const [filter,      setFilter]      = useState('pending')
  const [adRevenue,   setAdRevenue]   = useState('')
  const [calcLoading, setCalcLoading] = useState(false)

  if (user && !user.is_admin) return <Navigate to="/" replace />

  const fetchApps = async () => {
    setLoading(true)
    const q = supabase
      .from('monetization_applications')
      .select('*, users!monetization_applications_user_id_fkey(id,full_name,email,avatar_url,plan,monetization_enabled), creator_metrics!creator_metrics_user_id_fkey(total_followers,total_views,monetization_score)')
      .order('applied_at', { ascending: false })
    if (filter !== 'all') q.eq('status', filter)
    const { data } = await q
    setApps(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApps() }, [filter])

  const approve = async (app) => {
    setActionId(app.id)
    try {
      await supabase.from('monetization_applications').update({
        status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString(),
      }).eq('id', app.id)
      await supabase.from('users').update({ monetization_enabled: true }).eq('id', app.user_id)
      toast.success(`✅ ${app.users?.full_name} approved for monetization`)
      fetchApps()
    } catch { toast.error('Failed') }
    setActionId(null)
  }

  const reject = async () => {
    if (!rejectModal) return
    setActionId(rejectModal.app.id)
    try {
      await supabase.from('monetization_applications').update({
        status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      }).eq('id', rejectModal.app.id)
      toast.success('Application rejected.')
      setRejectModal(null); setReason(''); fetchApps()
    } catch { toast.error('Failed') }
    setActionId(null)
  }

  const triggerEarningsCalc = async () => {
    if (!adRevenue || isNaN(parseFloat(adRevenue))) {
      toast.error('Enter a valid ad revenue amount.')
      return
    }
    setCalcLoading(true)
    const totalRev     = parseFloat(adRevenue)
    const creatorPool  = totalRev * 0.55

    // Fetch all monetized creators with their scores
    const { data: monetized } = await supabase
      .from('users')
      .select('id, creator_metrics(monetization_score)')
      .eq('monetization_enabled', true)

    const totalScore = monetized?.reduce((sum, u) => sum + (u.creator_metrics?.[0]?.monetization_score || 0), 0) || 1

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const rows = (monetized || []).map(u => {
      const score  = u.creator_metrics?.[0]?.monetization_score || 0
      const share  = totalScore > 0 ? (score / totalScore) * creatorPool : 0
      return { user_id: u.id, amount: parseFloat(share.toFixed(2)), period_start: periodStart, period_end: periodEnd, status: 'pending' }
    }).filter(r => r.amount > 0)

    if (rows.length > 0) {
      await supabase.from('earnings').insert(rows)
      // Update pending_payout on each user
      for (const r of rows) {
        const { data: cu } = await supabase.from('users').select('pending_payout').eq('id', r.user_id).single()
        await supabase.from('users').update({ pending_payout: (cu?.pending_payout || 0) + r.amount }).eq('id', r.user_id)
      }
    }

    toast.success(`Earnings calculated for ${rows.length} creators. Total creator pool: $${creatorPool.toFixed(2)}`)
    setAdRevenue('')
    setCalcLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Monetization Applications</h1>
      </div>

      {/* Revenue calculator */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Monthly Earnings Calculator</h2>
        <p className="text-xs text-muted-foreground">Enter total platform ad revenue to calculate and distribute creator shares (55/45 split).</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" value={adRevenue} onChange={e => setAdRevenue(e.target.value)}
              placeholder="Total ad revenue this month"
              className="w-full pl-7 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button onClick={triggerEarningsCalc} disabled={calcLoading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
            {calcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Calculate & Distribute
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No {filter === 'all' ? '' : filter} applications.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => {
            const m = app.creator_metrics?.[0] || {}
            return (
              <div key={app.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {app.users?.avatar_url
                      ? <img src={app.users.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span className="text-sm font-medium text-muted-foreground">{app.users?.full_name?.[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{app.users?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{app.users?.email} · plan: {app.users?.plan || 'free'}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />{(m.total_followers || 0).toLocaleString()} followers
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" />{(m.total_views || 0).toLocaleString()} views
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />{(m.monetization_score || 0).toFixed(1)} score
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                    {app.rejection_reason && <p className="text-xs text-red-400 mt-1">Reason: {app.rejection_reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => approve(app)} disabled={actionId === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50">
                          {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                        </button>
                        <button onClick={() => { setRejectModal({ app }); setReason('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {app.status !== 'pending' && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize
                        ${app.status === 'approved' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {app.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-foreground mb-3">Reject Application</h3>
            <p className="text-sm text-muted-foreground mb-4">Rejecting <strong>{rejectModal.app.users?.full_name}</strong>'s monetization application.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection…" rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={reject} disabled={!reason.trim() || actionId === rejectModal.app.id}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 disabled:opacity-50">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
