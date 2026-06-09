import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Megaphone, CheckCircle2, XCircle, Loader2, Eye,
  MousePointer, Rocket, BarChart3, Pause, Play,
  Image as ImageIcon, ExternalLink,
} from 'lucide-react'

const STATUS_CFG = {
  pending:        { color: 'text-yellow-400 bg-yellow-400/10' },
  under_review:   { color: 'text-yellow-400 bg-yellow-400/10' },
  pending_review: { color: 'text-yellow-400 bg-yellow-400/10' },
  submitted:      { color: 'text-yellow-400 bg-yellow-400/10' },
  active:         { color: 'text-green-400 bg-green-400/10'   },
  paused:         { color: 'text-blue-400 bg-blue-400/10'     },
  rejected:       { color: 'text-red-400 bg-red-400/10'       },
  completed:      { color: 'text-muted-foreground bg-muted'   },
}

const PENDING_STATUSES = ['pending', 'under_review', 'pending_review', 'submitted']

async function callApproveCampaign(body) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-campaign`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body:    JSON.stringify(body),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export default function AdminAds() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending_campaigns')
  const [campaigns, setCampaigns] = useState([])
  const [boosts, setBoosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)  // campaign being rejected
  const [rejectReason, setRejectReason] = useState('')

  if (user && !user.is_admin) return <Navigate to="/" replace />

  const fetchData = async () => {
    setLoading(true)
    const [{ data: camps }, { data: bsts }] = await Promise.all([
      supabase.from('ad_campaigns')
        .select('*, users!ad_campaigns_advertiser_id_fkey(id, full_name, email), ad_creatives(id, file_url, file_type, thumbnail_url)')
        .order('created_at', { ascending: false }),
      supabase.from('boosted_posts')
        .select('*, users!boosted_posts_creator_id_fkey(id, full_name, email), posts(id, content, media_urls)')
        .order('created_at', { ascending: false }),
    ])
    setCampaigns(camps || [])
    setBoosts(bsts || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const approveCampaign = async (c) => {
    const budget = c.total_budget ?? c.budget ?? 0
    if (!window.confirm(`Approve this campaign? $${Number(budget).toFixed(2)} will be captured from the advertiser's card.`)) return
    setActionId(c.id)
    try {
      // Use edge function only when there's a Stripe authorization to capture;
      // legacy campaigns (no payment intent) just flip status.
      if (c.stripe_payment_intent_id) {
        await callApproveCampaign({ campaignId: c.id, action: 'approve', adminId: user.id })
      } else {
        await supabase.from('ad_campaigns').update({ status: 'active', starts_at: new Date().toISOString() }).eq('id', c.id)
      }
      toast.success('Campaign approved and live!')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Approval failed')
    }
    setActionId(null)
  }

  const submitReject = async () => {
    const c = rejectTarget
    if (!c) return
    setActionId(c.id)
    try {
      if (c.stripe_payment_intent_id) {
        await callApproveCampaign({ campaignId: c.id, action: 'reject', adminId: user.id, rejectionReason: rejectReason })
      } else {
        await supabase.from('ad_campaigns').update({ status: 'rejected', rejection_reason: rejectReason || null }).eq('id', c.id)
      }
      toast.success('Campaign rejected — advertiser refunded.')
      setRejectTarget(null); setRejectReason('')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Rejection failed')
    }
    setActionId(null)
  }

  const approveBoost = async (b) => {
    setActionId(b.id)
    await supabase.from('boosted_posts').update({ status: 'active', starts_at: new Date().toISOString() }).eq('id', b.id)
    toast.success('Boost approved.')
    fetchData()
    setActionId(null)
  }

  const rejectBoost = async (b) => {
    setActionId(b.id)
    await supabase.from('boosted_posts').update({ status: 'rejected' }).eq('id', b.id)
    toast.success('Boost rejected.')
    fetchData()
    setActionId(null)
  }

  const pauseResumeCampaign = async (c) => {
    setActionId(c.id)
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', c.id)
    fetchData()
    setActionId(null)
  }

  const pendingCampaigns = campaigns.filter(c => PENDING_STATUSES.includes(c.status))
  const activeCampaigns  = campaigns.filter(c => c.status === 'active' || c.status === 'paused')
  const pendingBoosts    = boosts.filter(b => b.status === 'pending')

  // Analytics totals
  const totalImpressions = campaigns.reduce((a, c) => a + (c.impressions_served || 0), 0)
    + boosts.reduce((a, b) => a + (b.impressions_served || 0), 0)
  const totalClicks = campaigns.reduce((a, c) => a + (c.clicks || 0), 0)
    + boosts.reduce((a, b) => a + (b.clicks || 0), 0)
  const totalRevenue = campaigns.filter(c => c.status !== 'pending' && c.status !== 'rejected')
    .reduce((a, c) => a + (c.budget || 0), 0)
    + boosts.filter(b => b.status !== 'pending' && b.status !== 'rejected')
    .reduce((a, b) => a + (b.budget || 0), 0)

  const TABS = [
    { id: 'pending_campaigns', label: 'Pending Campaigns', badge: pendingCampaigns.length },
    { id: 'pending_boosts',    label: 'Pending Boosts',    badge: pendingBoosts.length    },
    { id: 'active_campaigns',  label: 'Active',            badge: activeCampaigns.length  },
    { id: 'analytics',         label: 'Analytics',         badge: null                    },
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Ad Review</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {t.label}
            {t.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── PENDING CAMPAIGNS ── */}
          {tab === 'pending_campaigns' && (
            pendingCampaigns.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No pending campaigns.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCampaigns.map(c => (
                  <CampaignRow key={c.id} campaign={c} actionId={actionId}
                    onApprove={() => approveCampaign(c)}
                    onReject={() => { setRejectTarget(c); setRejectReason('') }} />
                ))}
              </div>
            )
          )}

          {/* ── PENDING BOOSTS ── */}
          {tab === 'pending_boosts' && (
            pendingBoosts.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No pending boosts.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBoosts.map(b => (
                  <BoostRow key={b.id} boost={b} actionId={actionId}
                    onApprove={() => approveBoost(b)}
                    onReject={() => rejectBoost(b)} />
                ))}
              </div>
            )
          )}

          {/* ── ACTIVE CAMPAIGNS ── */}
          {tab === 'active_campaigns' && (
            activeCampaigns.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No active campaigns.
              </div>
            ) : (
              <div className="space-y-4">
                {activeCampaigns.map(c => (
                  <CampaignRow key={c.id} campaign={c} actionId={actionId}
                    onPauseResume={() => pauseResumeCampaign(c)} showStats />
                ))}
              </div>
            )
          )}

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-blue-400' },
                  { label: 'Total Clicks',       value: totalClicks.toLocaleString(),      icon: MousePointer, color: 'text-purple-400' },
                  { label: 'Total Revenue',      value: `$${totalRevenue.toFixed(2)}`,     icon: BarChart3, color: 'text-green-400' },
                  { label: 'Active Campaigns',   value: activeCampaigns.length.toString(), icon: Megaphone, color: 'text-primary' },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                    <s.icon className={`w-4 h-4 mb-2 ${s.color}`} />
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground text-sm">All Campaigns</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Campaign','Package','Status','Impressions','Clicks','CTR','Budget'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {campaigns.map(c => {
                        const cfg = STATUS_CFG[c.status] || STATUS_CFG.pending
                        const ctr = c.impressions_served > 0 ? ((c.clicks / c.impressions_served) * 100).toFixed(1) : '0.0'
                        return (
                          <tr key={c.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">{c.package_type}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${cfg.color}`}>{c.status}</span></td>
                            <td className="px-4 py-3 text-muted-foreground">{(c.impressions_served || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{(c.clicks || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{ctr}%</td>
                            <td className="px-4 py-3 text-muted-foreground">${c.budget}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-1">Reject Campaign</h3>
            <p className="text-xs text-muted-foreground mb-4">
              The advertiser's card authorization will be released (no charge). The reason below is emailed to them.
            </p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (sent to advertiser)…" rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={submitReject} disabled={actionId === rejectTarget.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionId === rejectTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignPreview({ campaign: c }) {
  const creative = c.ad_creatives?.[0]
  if (!creative) {
    return (
      <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground italic">
        No creative uploaded
      </div>
    )
  }
  if (creative.file_type === 'video') {
    return (
      <video
        src={creative.file_url}
        controls
        poster={creative.thumbnail_url ?? undefined}
        className="w-full max-h-64 rounded-lg object-cover bg-black"
      />
    )
  }
  return (
    <img
      src={creative.file_url}
      alt="Ad creative"
      className="w-full max-h-64 rounded-lg object-cover"
    />
  )
}

function CampaignRow({ campaign: c, actionId, onApprove, onReject, onPauseResume, showStats }) {
  const cfg = STATUS_CFG[c.status] || STATUS_CFG.pending
  const ctr = c.impressions_served > 0 ? ((c.clicks / c.impressions_served) * 100).toFixed(1) : '0.0'
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Creative preview — full width above the detail row */}
      <div className="px-4 pt-4">
        <CampaignPreview campaign={c} />
      </div>
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm">{c.title || 'Untitled'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${cfg.color}`}>{c.status}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{c.package_type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                By: {c.users?.full_name || c.users?.email} · ${c.total_budget ?? c.budget} budget ·{' '}
                {new Date(c.created_at).toLocaleDateString()}
              </p>
              {c.stripe_payment_intent_id && (
                <p className="text-xs mt-1">
                  <span className={c.stripe_payment_status === 'captured' ? 'text-green-400' : 'text-amber-400'}>
                    {c.stripe_payment_status === 'captured' ? '✓ Payment captured' : '✓ Payment authorized'} (${(c.total_budget ?? c.budget ?? 0)})
                  </span>
                </p>
              )}
              {c.website_url && (
                <p className="text-xs text-muted-foreground">🔗 {c.website_url}</p>
              )}
            </div>
          </div>
          {showStats && (
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{c.impressions_served || 0} views</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><MousePointer className="w-3 h-3" />{c.clicks || 0} clicks</span>
              <span className="text-xs text-muted-foreground">{ctr}% CTR</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {c.cta_url && (
            <a href={c.cta_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Preview URL
            </a>
          )}
          {PENDING_STATUSES.includes(c.status) && (
            <div className="flex gap-2">
              <button onClick={onApprove} disabled={actionId === c.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50">
                {actionId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
              </button>
              <button onClick={onReject} disabled={actionId === c.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
          {(c.status === 'active' || c.status === 'paused') && onPauseResume && (
            <button onClick={onPauseResume} disabled={actionId === c.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border text-xs font-medium hover:bg-muted/80 disabled:opacity-50">
              {actionId === c.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : c.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BoostRow({ boost: b, actionId, onApprove, onReject }) {
  const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
  const post = b.posts
  const img  = Array.isArray(post?.media_urls) ? post.media_urls[0] : null
  const text = post?.content?.replace(/<[^>]+>/g, '').slice(0, 80) || 'Post'
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
          {img ? <img src={img} className="w-full h-full object-cover" alt="" />
               : <p className="text-[9px] text-muted-foreground text-center px-1">{text.slice(0, 30)}</p>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{b.status}</span>
          </div>
          <p className="text-sm text-foreground truncate">{text}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            By: {b.users?.full_name || b.users?.email} · ${b.budget} · {(b.impressions_limit || 0).toLocaleString()} impressions ·{' '}
            {b.reach_type} reach
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {b.status === 'pending' && (
            <>
              <button onClick={onApprove} disabled={actionId === b.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50">
                {actionId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
              </button>
              <button onClick={onReject} disabled={actionId === b.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
