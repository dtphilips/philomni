import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Megaphone, Eye, MousePointer, DollarSign, Plus,
  Loader2, Pause, Play, Clock, CheckCircle2, XCircle, BarChart3,
} from 'lucide-react'

const STATUS_CFG = {
  pending:   { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10' },
  active:    { label: 'Active',         color: 'text-green-400 bg-green-400/10'   },
  paused:    { label: 'Paused',         color: 'text-blue-400 bg-blue-400/10'     },
  completed: { label: 'Completed',      color: 'text-muted-foreground bg-muted'   },
  rejected:  { label: 'Rejected',       color: 'text-red-400 bg-red-400/10'       },
}

export default function MyAds() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [ads,     setAds]     = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const fetchAds = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false })
    setAds(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAds() }, [user?.id])

  const togglePause = async (ad) => {
    setToggling(ad.id)
    const newStatus = ad.status === 'active' ? 'paused' : 'active'
    await supabase.from('ads').update({ status: newStatus }).eq('id', ad.id)
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a))
    toast.success(`Ad ${newStatus === 'paused' ? 'paused' : 'resumed'}.`)
    setToggling(null)
  }

  // Summary totals
  const totals = ads.reduce((acc, ad) => ({
    spent:  acc.spent  + (ad.spent  || 0),
    views:  acc.views  + (ad.total_views  || 0),
    clicks: acc.clicks + (ad.total_clicks || 0),
  }), { spent: 0, views: 0, clicks: 0 })
  const ctr = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : '0.00'

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Ads</h1>
        </div>
        <button onClick={() => navigate('/advertise')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create Ad
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Spent', value: `$${totals.spent.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Total Views',  value: totals.views.toLocaleString(),  icon: Eye,        color: 'text-blue-400'  },
          { label: 'Total Clicks', value: totals.clicks.toLocaleString(), icon: MousePointer,color: 'text-purple-400'},
          { label: 'Avg CTR',      value: `${ctr}%`,                      icon: BarChart3,  color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <s.icon className={`w-4 h-4 mb-2 ${s.color}`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-14 bg-card rounded-2xl border border-border">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-foreground font-medium mb-1">No ads yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first ad to reach Philomni's audience.</p>
          <button onClick={() => navigate('/advertise')}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            Create Ad
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Ad</th>
                  <th className="text-center px-3 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-3 py-3 text-xs text-muted-foreground font-medium">Views</th>
                  <th className="text-right px-3 py-3 text-xs text-muted-foreground font-medium">Clicks</th>
                  <th className="text-right px-3 py-3 text-xs text-muted-foreground font-medium">CTR</th>
                  <th className="text-right px-3 py-3 text-xs text-muted-foreground font-medium">Budget Left</th>
                  <th className="text-right px-3 py-3 text-xs text-muted-foreground font-medium">Days Left</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ads.map(ad => {
                  const cfg = STATUS_CFG[ad.status] || STATUS_CFG.pending
                  const adCtr = ad.total_views > 0 ? ((ad.total_clicks / ad.total_views) * 100).toFixed(1) : '0.0'
                  const budgetLeft = Math.max(0, (ad.budget || 0) - (ad.spent || 0))
                  const daysLeft = ad.end_date
                    ? Math.max(0, Math.ceil((new Date(ad.end_date) - new Date()) / 86400000))
                    : '—'
                  return (
                    <tr key={ad.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{ad.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ad.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-foreground">{(ad.total_views || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-foreground">{(ad.total_clicks || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-foreground">{adCtr}%</td>
                      <td className="px-3 py-3 text-right text-foreground">${budgetLeft.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right text-muted-foreground">{daysLeft}</td>
                      <td className="px-3 py-3 text-right">
                        {(ad.status === 'active' || ad.status === 'paused') && (
                          <button onClick={() => togglePause(ad)} disabled={toggling === ad.id}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            {toggling === ad.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : ad.status === 'active'
                              ? <Pause className="w-4 h-4" />
                              : <Play className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
