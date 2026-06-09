import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Megaphone, Eye, MousePointer, Plus, Loader2,
  Pause, Play, Rocket, Zap, TrendingUp, Crown, Trash2,
} from 'lucide-react'

const STATUS_CFG = {
  pending:        { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10' },
  under_review:   { label: 'Under Review',   color: 'text-yellow-400 bg-yellow-400/10' },
  pending_review: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10' },
  submitted:      { label: 'Submitted',      color: 'text-yellow-400 bg-yellow-400/10' },
  active:         { label: 'Active',         color: 'text-green-400 bg-green-400/10'   },
  paused:         { label: 'Paused',         color: 'text-blue-400 bg-blue-400/10'     },
  completed:      { label: 'Completed',      color: 'text-muted-foreground bg-muted'   },
  rejected:       { label: 'Rejected',       color: 'text-red-400 bg-red-400/10'       },
  cancelled:      { label: 'Cancelled',      color: 'text-muted-foreground bg-muted'   },
}

const DELETABLE_STATUSES = ['pending', 'under_review', 'pending_review', 'submitted', 'rejected', 'paused']

const PKG_ICONS = { starter: Zap, growth: TrendingUp, premium: Crown }

function CampaignThumbnail({ campaign }) {
  const creative = campaign.ad_creatives?.[0]
  const thumbUrl = creative?.thumbnail_url || (creative?.file_type === 'image' ? creative?.file_url : null)
  if (!thumbUrl) {
    return (
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
        📢
      </div>
    )
  }
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-muted">
      <img src={thumbUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
      {creative?.file_type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-white text-sm">▶</span>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ value, max }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function MyAds() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [tab, setTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState([])
  const [boosts,    setBoosts]    = useState([])
  const [loading,   setLoading]   = useState(true)

  const fetchAll = async () => {
    if (!user?.id) return
    setLoading(true)
    const [{ data: camps }, { data: bsts }] = await Promise.all([
      supabase.from('ad_campaigns').select('*, ad_creatives(id, file_url, file_type, thumbnail_url)').eq('advertiser_id', user.id).order('created_at', { ascending: false }),
      supabase.from('boosted_posts').select('*, posts(id, content, media_urls, media_type)').eq('creator_id', user.id).order('created_at', { ascending: false }),
    ])
    setCampaigns(camps || [])
    setBoosts(bsts || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [user?.id])

  // Show confirmation after a campaign is submitted from the builder
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('submitted') === 'true') {
      toast.success('Campaign submitted! We review within 24 hours.')
      window.history.replaceState({}, '', '/my-campaigns')
    }
  }, [])

  const [toggling,  setToggling]  = useState(null)
  const [deleting,  setDeleting]  = useState(null)
  const [cancelling, setCancelling] = useState(null)

  // Resume a paused campaign (direct DB update — no refund logic needed)
  const handleResume = async (c) => {
    setToggling(c.id)
    const { error } = await supabase.from('ad_campaigns').update({ status: 'active' }).eq('id', c.id)
    if (error) { toast.error('Failed to resume campaign'); setToggling(null); return }
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'active' } : x))
    toast.success('Campaign resumed.')
    setToggling(null)
  }

  // Pause an active campaign via cancel-campaign edge function (sets status=paused, no refund)
  const handlePause = async (c) => {
    setCancelling(c.id)
    const { data, error } = await supabase.functions.invoke('cancel-campaign', {
      body: { campaignId: c.id, userId: user.id, action: 'pause' },
    })
    if (error || data?.error) { toast.error('Failed to pause campaign'); setCancelling(null); return }
    toast.success(data?.message ?? 'Campaign paused.')
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'paused' } : x))
    setCancelling(null)
  }

  // Cancel an active/paused/under_review campaign — routes through cancel-campaign edge function
  const handleCancelCampaign = async (c) => {
    const REVIEW_STATUSES = ['pending', 'under_review', 'pending_review', 'submitted']
    const isUnderReview = REVIEW_STATUSES.includes(c.status)
    const isActive = c.status === 'active'

    let msg = ''
    if (isUnderReview) {
      // With manual capture, card is AUTHORIZED but NOT charged until approval
      msg =
        'Cancel this campaign?\n\n' +
        'Your card has an authorization hold of $' + Number(c.total_budget ?? 0).toFixed(2) + ' USD ' +
        'but has NOT been charged.\n\n' +
        'Cancelling releases the hold immediately — no charge will be made.\n' +
        'Allow 1–3 business days for the hold to clear from your statement.'
    } else if (isActive || c.status === 'paused') {
      const today = new Date()
      const endDate = c.end_date ? new Date(c.end_date) : null
      const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate - today) / 86_400_000)) : 0
      const potentialRefund = daysRemaining * Number(c.daily_budget ?? 10)
      msg = potentialRefund > 0
        ? `Cancel this campaign?\n\n${daysRemaining} days remaining = $${potentialRefund.toFixed(2)} USD refund.\n\nDays already served will not be refunded.\nAllow 5–10 business days for the refund.`
        : 'Cancel this campaign? All days have been served — no refund will be issued.'
    } else {
      msg = 'Remove this campaign?'
    }

    if (!window.confirm(msg)) return
    setCancelling(c.id)

    const { data, error } = await supabase.functions.invoke('cancel-campaign', {
      body: { campaignId: c.id, userId: user.id, action: 'cancel' },
    })
    if (error || data?.error) {
      toast.error('Failed to cancel. Email support@philomni.com')
      setCancelling(null); return
    }
    toast.success(data?.message ?? 'Campaign cancelled.')
    setCampaigns(prev => prev.filter(x => x.id !== c.id))
    setCancelling(null)
  }

  // Delete campaigns that were never charged (rejected only — review uses handleCancelCampaign)
  const handleDeleteCampaign = async (c) => {
    const deletable = ['rejected', 'cancelled'].includes(c.status)
    if (!deletable) {
      // Under-review campaigns need proper cancel to release hold
      handleCancelCampaign(c)
      return
    }
    if (!window.confirm('Remove this campaign from your list?')) return
    setDeleting(c.id)
    await supabase.from('ad_creatives').delete().eq('campaign_id', c.id)
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', c.id).eq('advertiser_id', user.id)
    if (error) { toast.error('Failed to delete campaign'); setDeleting(null); return }
    toast.success('Campaign removed.')
    setCampaigns(prev => prev.filter(x => x.id !== c.id))
    setDeleting(null)
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Ads</h1>
        </div>
        <button onClick={() => navigate('/advertise')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone, count: campaigns.length },
          { id: 'boosts',    label: 'Boosted Posts', icon: Rocket, count: boosts.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── CAMPAIGNS ── */}
          {tab === 'campaigns' && (
            campaigns.length === 0 ? (
              <div className="text-center py-14 bg-card rounded-2xl border border-border">
                <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-foreground font-medium mb-1">No campaigns yet</p>
                <p className="text-sm text-muted-foreground mb-4">Launch a campaign to reach Philomni's audience.</p>
                <button onClick={() => navigate('/advertise')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => {
                  const cfg = STATUS_CFG[c.status] || STATUS_CFG.pending
                  const PkgIcon = PKG_ICONS[c.package_type] || Megaphone
                  const ctr = c.impressions_served > 0
                    ? ((c.clicks / c.impressions_served) * 100).toFixed(1)
                    : '0.0'
                  const daysLeft = c.ends_at
                    ? Math.max(0, Math.ceil((new Date(c.ends_at) - new Date()) / 86400000))
                    : null
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CampaignThumbnail campaign={c} />
                          <div>
                            <p className="font-semibold text-foreground text-sm">{c.name || c.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {c.placement_type || c.package_type || 'campaign'} ·{' '}
                              ${c.total_budget ?? c.budget ?? 0}
                            </p>
                            {c.status === 'rejected' && c.rejection_reason && (
                              <p className="text-xs text-red-400 mt-1">Reason: {c.rejection_reason}</p>
                            )}
                            {/* Payment status note */}
                            {['pending', 'under_review', 'pending_review', 'submitted'].includes(c.status) && (
                              <p className="text-[11px] text-yellow-500/80 mt-0.5">
                                Card hold of ${Number(c.total_budget ?? 0).toFixed(2)} — not charged until approved
                              </p>
                            )}
                            {c.status === 'active' && (
                              <p className="text-[11px] text-green-500/80 mt-0.5">
                                ${Number(c.total_budget ?? 0).toFixed(2)} charged · campaign live
                              </p>
                            )}
                            {c.status === 'paused' && (
                              <p className="text-[11px] text-blue-400/80 mt-0.5">
                                Paused · no further charges until resumed
                              </p>
                            )}
                            {c.status === 'cancelled' && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Cancelled · refund issued if applicable
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>

                          {/* Active: Pause + Cancel */}
                          {c.status === 'active' && (
                            <>
                              <button onClick={() => handlePause(c)} disabled={cancelling === c.id}
                                title="Pause campaign"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                {cancelling === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleCancelCampaign(c)} disabled={cancelling === c.id}
                                title="Cancel campaign"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Paused: Resume + Cancel */}
                          {c.status === 'paused' && (
                            <>
                              <button onClick={() => handleResume(c)} disabled={toggling === c.id}
                                title="Resume campaign"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                {toggling === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleCancelCampaign(c)} disabled={cancelling === c.id}
                                title="Cancel campaign"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                {cancelling === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </>
                          )}

                          {/* Under review: Cancel button (releases hold, never charged) */}
                          {['pending', 'under_review', 'pending_review', 'submitted'].includes(c.status) && (
                            <button onClick={() => handleCancelCampaign(c)} disabled={cancelling === c.id}
                              title="Cancel campaign — releases card hold"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                              {cancelling === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Rejected / Cancelled: Remove from list */}
                          {['rejected', 'cancelled'].includes(c.status) && (
                            <button onClick={() => handleDeleteCampaign(c)} disabled={deleting === c.id}
                              title="Remove from list"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                              {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}

                        </div>
                      </div>

                      {/* Impressions progress */}
                      {c.impressions_limit && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Impressions</span>
                            <span>{(c.impressions_served || 0).toLocaleString()} / {c.impressions_limit.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={c.impressions_served || 0} max={c.impressions_limit} />
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex gap-4 pt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /> {(c.impressions_served || 0).toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MousePointer className="w-3 h-3" /> {(c.clicks || 0).toLocaleString()} clicks
                        </span>
                        <span className="text-xs text-muted-foreground">CTR: {ctr}%</span>
                        {daysLeft !== null && (
                          <span className="text-xs text-muted-foreground ml-auto">{daysLeft}d remaining</span>
                        )}
                      </div>

                      {c.starts_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.starts_at).toLocaleDateString()} – {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : 'ongoing'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ── BOOSTED POSTS ── */}
          {tab === 'boosts' && (
            boosts.length === 0 ? (
              <div className="text-center py-14 bg-card rounded-2xl border border-border">
                <Rocket className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-foreground font-medium mb-1">No boosted posts yet</p>
                <p className="text-sm text-muted-foreground mb-4">Boost a post to reach more people.</p>
                <button onClick={() => navigate('/advertise?tab=boost')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Boost a Post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {boosts.map(b => {
                  const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
                  const post = b.posts
                  const img = Array.isArray(post?.media_urls) ? post.media_urls[0] : null
                  const text = post?.content?.replace(/<[^>]+>/g, '').slice(0, 60) || 'Post'
                  const daysLeft = b.ends_at
                    ? Math.max(0, Math.ceil((new Date(b.ends_at) - new Date()) / 86400000))
                    : null
                  return (
                    <div key={b.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {/* Post thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {img
                            ? <img src={img} alt="" className="w-full h-full object-cover" />
                            : <p className="text-[9px] text-muted-foreground text-center px-1 leading-tight">{text.slice(0, 30)}</p>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{text}</p>
                          <p className="text-xs text-muted-foreground capitalize">{b.reach_type} reach · ${b.budget}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      </div>

                      {b.impressions_limit && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Impressions</span>
                            <span>{(b.impressions_served || 0).toLocaleString()} / {b.impressions_limit.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={b.impressions_served || 0} max={b.impressions_limit} />
                        </div>
                      )}

                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /> {(b.impressions_served || 0).toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MousePointer className="w-3 h-3" /> {(b.clicks || 0).toLocaleString()} clicks
                        </span>
                        {daysLeft !== null && (
                          <span className="text-xs text-muted-foreground ml-auto">{daysLeft}d remaining</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
