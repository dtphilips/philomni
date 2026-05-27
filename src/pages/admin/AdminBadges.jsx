import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Shield, CheckCircle2, XCircle, ExternalLink, Loader2, Clock,
} from 'lucide-react'

const BADGE_COLORS = {
  blue:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  gold:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default function AdminBadges() {
  const { user } = useAuth()
  const [apps,        setApps]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [actionId,    setActionId]    = useState(null)
  const [rejectModal, setRejectModal] = useState(null) // { app }
  const [reason,      setReason]      = useState('')
  const [filter,      setFilter]      = useState('pending')

  if (user && !user.is_admin) return <Navigate to="/" replace />

  const fetchApps = async () => {
    setLoading(true)
    const q = supabase
      .from('badge_applications')
      .select('*, users!badge_applications_user_id_fkey(id,full_name,email,avatar_url,plan)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q.eq('status', filter)
    const { data } = await q
    setApps(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApps() }, [filter])

  const approve = async (app) => {
    setActionId(app.id)
    try {
      await supabase.from('badge_applications').update({
        status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString(),
      }).eq('id', app.id)
      await supabase.from('users').update({
        badge_type: app.badge_type, badge_status: 'approved',
      }).eq('id', app.user_id)
      toast.success(`✅ ${app.users?.full_name} — ${app.badge_type} tick approved`)
      fetchApps()
    } catch { toast.error('Failed to approve') }
    setActionId(null)
  }

  const reject = async () => {
    if (!rejectModal) return
    setActionId(rejectModal.app.id)
    try {
      await supabase.from('badge_applications').update({
        status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      }).eq('id', rejectModal.app.id)
      await supabase.from('users').update({ badge_status: 'rejected' }).eq('id', rejectModal.app.user_id)
      toast.success('Application rejected.')
      setRejectModal(null)
      setReason('')
      fetchApps()
    } catch { toast.error('Failed to reject') }
    setActionId(null)
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Badge Applications</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
              ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No {filter === 'all' ? '' : filter} applications.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div key={app.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {app.users?.avatar_url
                    ? <img src={app.users.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-sm font-medium text-muted-foreground">{app.users?.full_name?.[0]}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{app.users?.full_name}</p>
                    <span className="text-xs text-muted-foreground">{app.users?.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${BADGE_COLORS[app.badge_type] || 'text-muted-foreground'}`}>
                      {app.badge_type} tick
                    </span>
                    <span className="text-xs text-muted-foreground">plan: {app.users?.plan || 'free'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {app.rejection_reason && (
                    <p className="text-xs text-red-400 mt-1">Reason: {app.rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.document_url && (
                    <a href={app.document_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> View Doc
                    </a>
                  )}
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => approve(app)} disabled={actionId === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 transition-colors disabled:opacity-50">
                        {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button onClick={() => { setRejectModal({ app }); setReason('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 transition-colors">
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
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-foreground mb-3">Reject Application</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Rejecting <strong>{rejectModal.app.users?.full_name}</strong>'s {rejectModal.app.badge_type} tick application.
            </p>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection (shown to the user)…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={reject} disabled={!reason.trim() || actionId === rejectModal.app.id}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 disabled:opacity-50">
                {actionId === rejectModal.app.id ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
