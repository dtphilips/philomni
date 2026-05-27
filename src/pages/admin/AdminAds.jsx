import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Megaphone, CheckCircle2, XCircle, Loader2, Eye,
  MousePointer, DollarSign, ExternalLink, Image as ImageIcon,
} from 'lucide-react'

const STATUS_CFG = {
  pending:   { color: 'text-yellow-400 bg-yellow-400/10' },
  active:    { color: 'text-green-400 bg-green-400/10'   },
  rejected:  { color: 'text-red-400 bg-red-400/10'       },
  completed: { color: 'text-muted-foreground bg-muted'   },
}

export default function AdminAds() {
  const { user } = useAuth()
  const [ads,         setAds]         = useState([])
  const [loading,     setLoading]     = useState(true)
  const [actionId,    setActionId]    = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason,      setReason]      = useState('')
  const [filter,      setFilter]      = useState('pending')

  if (user && !user.is_admin) return <Navigate to="/" replace />

  const fetchAds = async () => {
    setLoading(true)
    const q = supabase
      .from('ads')
      .select('*, users!ads_advertiser_id_fkey(id,full_name,email,avatar_url)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q.eq('status', filter)
    const { data } = await q
    setAds(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAds() }, [filter])

  const approve = async (ad) => {
    setActionId(ad.id)
    try {
      await supabase.from('ads').update({
        status: 'active', approved_at: new Date().toISOString(),
        start_date: ad.start_date || new Date().toISOString().slice(0, 10),
      }).eq('id', ad.id)
      toast.success(`✅ Ad "${ad.title}" approved and is now active.`)
      fetchAds()
    } catch { toast.error('Failed') }
    setActionId(null)
  }

  const reject = async () => {
    if (!rejectModal) return
    setActionId(rejectModal.ad.id)
    try {
      await supabase.from('ads').update({ status: 'rejected' }).eq('id', rejectModal.ad.id)
      toast.success('Ad rejected.')
      setRejectModal(null); setReason(''); fetchAds()
    } catch { toast.error('Failed') }
    setActionId(null)
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Ad Review</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending','active','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No {filter === 'all' ? '' : filter} ads.
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => {
            const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
            const ctr = ad.total_views > 0 ? ((ad.total_clicks / ad.total_views) * 100).toFixed(1) : '0.0'
            return (
              <div key={ad.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Creative thumbnail */}
                  <div className="w-20 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {ad.image_url
                      ? <img src={ad.image_url} className="w-full h-full object-cover" alt="" />
                      : <ImageIcon className="w-6 h-6 text-muted-foreground/40" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm">{ad.title || 'Untitled'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${cfg.color}`}>{ad.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ad.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {ad.users?.full_name} · ${ad.budget} budget ·{' '}
                          Submitted {new Date(ad.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Live stats for active ads */}
                    {ad.status === 'active' && (
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{ad.total_views} views</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MousePointer className="w-3 h-3" />{ad.total_clicks} clicks</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />${(ad.spent||0).toFixed(2)} spent</span>
                        <span className="text-xs text-muted-foreground">{ctr}% CTR</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {ad.cta_url && (
                      <a href={ad.cta_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Preview URL
                      </a>
                    )}
                    {ad.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve(ad)} disabled={actionId === ad.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50">
                          {actionId === ad.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                        </button>
                        <button onClick={() => { setRejectModal({ ad }); setReason('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
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
            <h3 className="font-bold text-foreground mb-3">Reject Ad</h3>
            <p className="text-sm text-muted-foreground mb-4">Rejecting ad: <strong>{rejectModal.ad.title}</strong></p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection (shown to advertiser)…" rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={reject} disabled={!reason.trim() || actionId === rejectModal.ad.id}
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
