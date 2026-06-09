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
  const [toggling,  setToggling]  = useState(null)

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

  const toggleCampaign = async (c) => {
    setToggling(c.id)
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', c.id)
    if (error) { toast.error('Failed to update campaign'); setToggling(null); return }
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
    toast.success(`Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}.`)
    setToggling(null)
  }

  const [deleting, setDeleting] = useState(null)

  const handleDeleteCampaign = async (c) => {
    if (!DELETABLE_STATUSES.includes(c.status)) {
      toast.error('Cannot delete an active campaign. Pause it first.')
      return
    }
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return
    setDeleting(c.id)

    // If there's a Stripe auth to cancel, invoke the reject edge function
    if (c.stripe_payment_intent_id && c.stripe_payment_status === 'requires_capture') {
      await supabase.functions.invoke('approve-campaign', {
        body: { campaignId: c.id, action: 'reject', adminId: user.id, rejectionReason: 'Cancelled by advertiser' },
      }).then(({ error: e }) => { if (e) console.warn('stripe cancel:', e) })
    }

    // Delete creatives first
    await supabase.from('ad_creatives').delete().eq('campaign_id', c.id)

    // Delete campaign
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', c.id).eq('advertiser_id', user.id)
    if (error) {
      toast.error('Failed to delete campaign')
      setDeleting(null)
      return
    }
    toast.success('Campaign deleted')
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>

                          {/* Pause / Resume for active & paused */}
                          {(c.status === 'active' || c.status === 'paused') && (
                            <button onClick={() => toggleCampaign(c)} disabled={toggling === c.id}
                              title={c.status === 'active' ? 'Pause campaign' : 'Resume campaign'}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              {toggling === c.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : c.status === 'active'
                                ? <Pause className="w-4 h-4" />
                                : <Play className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Delete button — review/rejected/paused statuses */}
                          {DELETABLE_STATUSES.includes(c.status) && (
                            <button
                              onClick={() => handleDeleteCampaign(c)}
                              disabled={deleting === c.id}
                              title="Delete campaign"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                              {deleting === c.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
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
