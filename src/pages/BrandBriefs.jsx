import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Briefcase, Plus, X, DollarSign, Clock, Users, Search,
  ChevronRight, Eye, CheckCircle, XCircle, Star, BarChart2,
  Filter, Tag, MessageSquare, ExternalLink
} from 'lucide-react'

const CONTENT_TYPES = ['Video', 'Short-form', 'Blog', 'Podcast', 'Photo', 'Reel', 'Story', 'Newsletter']
const NICHES = ['Beauty', 'Lifestyle', 'Tech', 'Finance', 'Food', 'Fashion', 'Fitness', 'Travel', 'Gaming', 'Education', 'Parenting', 'Business']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open:      { label: 'Open',      cls: 'bg-green-500/20 text-green-400' },
    in_review: { label: 'In Review', cls: 'bg-yellow-500/20 text-yellow-400' },
    closed:    { label: 'Closed',    cls: 'bg-zinc-500/20 text-zinc-400' },
  }
  const s = map[status] ?? map.open
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${s.cls}`}>{s.label}</span>
}

function AppStatusBadge({ status }) {
  const map = {
    pending:     { label: 'Pending',     cls: 'bg-zinc-700 text-zinc-300' },
    shortlisted: { label: 'Shortlisted', cls: 'bg-blue-500/20 text-blue-400' },
    approved:    { label: 'Approved',    cls: 'bg-green-500/20 text-green-400' },
    rejected:    { label: 'Rejected',    cls: 'bg-red-500/20 text-red-400' },
  }
  const s = map[status] ?? map.pending
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

// ─── Apply modal (creator side) ───────────────────────────────────────────────
function ApplyModal({ brief, onClose, onApplied }) {
  const { user } = useAuth()
  const [pitch, setPitch]       = useState('')
  const [quote, setQuote]       = useState('')
  const [portUrl, setPortUrl]   = useState('')
  const [portUrls, setPortUrls] = useState([])
  const [saving, setSaving]     = useState(false)

  function addUrl() {
    const u = portUrl.trim()
    if (!u) return
    setPortUrls(urls => [...urls, u])
    setPortUrl('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!pitch.trim()) { toast.error("Tell the brand why you're a fit"); return }
    setSaving(true)
    const { error } = await supabase.from('brief_applications').insert({
      brief_id: brief.id, creator_id: user.id,
      pitch: pitch.trim(), quote: quote ? Number(quote) : null,
      portfolio_urls: portUrls, status: 'pending',
    })
    setSaving(false)
    if (error) {
      toast.error(error.code === '23505' ? 'You already applied to this brief' : error.message)
      return
    }
    toast.success('Application submitted!')
    onApplied?.(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Apply to Brief</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-white">{brief.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Budget: ${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()} {brief.currency}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Pitch</label>
            <textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={4}
              placeholder="Why are you the right creator for this? What's your angle?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Quote (USD, optional)</label>
            <input type="number" min={0} value={quote} onChange={e => setQuote(e.target.value)} placeholder="Enter your rate"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Portfolio Links (optional)</label>
            <div className="flex gap-2 mb-2">
              <input value={portUrl} onChange={e => setPortUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="https://…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
              <button type="button" onClick={addUrl} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm transition-colors border border-zinc-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {portUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <span className="truncate flex-1">{u}</span>
                <button type="button" onClick={() => setPortUrls(urls => urls.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
            {saving ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Post brief modal (brand side) ───────────────────────────────────────────
function PostBriefModal({ companyId, onClose, onPosted }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', description: '', budget_min: '', budget_max: '',
    currency: 'USD', deadline: '', target_audience: '',
    content_types: [], niches: [], min_followers: '', external_ref: '',
  })
  const [saving, setSaving] = useState(false)

  function toggle(arr, key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim())   { toast.error('Title required'); return }
    if (!form.budget_min || !form.budget_max) { toast.error('Budget range required'); return }
    setSaving(true)
    const { error } = await supabase.from('brand_briefs').insert({
      title: form.title.trim(), description: form.description.trim(),
      budget_min: Number(form.budget_min), budget_max: Number(form.budget_max),
      currency: form.currency,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      target_audience: form.target_audience || null,
      content_types: form.content_types, niches: form.niches,
      min_followers: form.min_followers ? Number(form.min_followers) : null,
      external_ref: form.external_ref || null,
      company_id: companyId, status: 'open',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Brief posted! Creators can now apply.')
    onPosted?.(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800">
          <h2 className="font-bold text-white text-lg">Post a Brief</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Brief Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 30-sec product reel for our Q3 launch"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Brief Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
              placeholder="Describe the campaign, what you need, tone of voice, deliverables…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min Budget (USD)</label>
              <input type="number" min={0} value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))}
                placeholder="500"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Max Budget (USD)</label>
              <input type="number" min={0} value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
                placeholder="2000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Application Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min Followers</label>
              <input type="number" min={0} value={form.min_followers} onChange={e => setForm(f => ({ ...f, min_followers: e.target.value }))}
                placeholder="e.g. 10000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Content Types Needed</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map(ct => (
                <button key={ct} type="button" onClick={() => toggle(form.content_types, 'content_types', ct)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${form.content_types.includes(ct) ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Niches / Categories</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n} type="button" onClick={() => toggle(form.niches, 'niches', n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${form.niches.includes(n) ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Audience</label>
            <input value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
              placeholder="e.g. Women 18–34 in Nigeria and Ghana"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Campaign Reference (optional)</label>
            <input value={form.external_ref} onChange={e => setForm(f => ({ ...f, external_ref: e.target.value }))}
              placeholder="e.g. CAMPAIGN-Q3-2026"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Posting…' : 'Post Brief'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Applications modal (brand side) ──────────────────────────────────────────
function ApplicationsModal({ brief, onClose }) {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [deciding, setDeciding] = useState(null)

  useEffect(() => { load() }, [brief.id])

  async function load() {
    const { data } = await supabase.from('brief_applications')
      .select('*, creator:creator_id(id, full_name, username, avatar_url, headline, follower_count)')
      .eq('brief_id', brief.id).order('created_at', { ascending: false })
    setApps(data ?? [])
    setLoading(false)
  }

  async function decide(appId, status) {
    setDeciding(appId)
    const now = new Date().toISOString()
    const timestamps = {}
    if (status === 'approved')    { timestamps.approved_at = now; timestamps.rejected_at = null }
    if (status === 'rejected')    { timestamps.rejected_at = now; timestamps.approved_at = null }
    if (status === 'shortlisted') { timestamps.shortlisted_at = now }
    await supabase.from('brief_applications').update({ status, ...timestamps }).eq('id', appId)
    setDeciding(null)
    toast.success(`Application ${status}`)
    load()
  }

  async function updateBriefStatus(status) {
    await supabase.from('brand_briefs').update({ status }).eq('id', brief.id)
    toast.success(`Brief marked as ${status.replace('_', ' ')}`)
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const counts = { all: apps.length, pending: 0, shortlisted: 0, approved: 0, rejected: 0 }
  apps.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-white">{brief.title}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{apps.length} applications · <StatusBadge status={brief.status} /></p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors shrink-0"><X className="w-5 h-5" /></button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Pending',     val: counts.pending,     color: 'text-zinc-300' },
              { label: 'Shortlisted', val: counts.shortlisted, color: 'text-blue-400' },
              { label: 'Approved',    val: counts.approved,    color: 'text-green-400' },
              { label: 'Rejected',    val: counts.rejected,    color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {['all', 'pending', 'shortlisted', 'approved', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                {f} {counts[f] > 0 && `(${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Applications list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-24 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{apps.length === 0 ? 'No applications yet' : `No ${filter} applications`}</p>
            </div>
          ) : filtered.map(app => (
            <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <img src={app.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.full_name ?? 'C')}&background=7c3aed&color=fff&size=40`}
                  className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-white">{app.creator?.full_name}</p>
                    <span className="text-xs text-zinc-500">@{app.creator?.username}</span>
                    {app.creator?.follower_count > 0 && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {(app.creator.follower_count / 1000).toFixed(1)}k followers
                      </span>
                    )}
                    <AppStatusBadge status={app.status} />
                  </div>
                  {app.creator?.headline && <p className="text-xs text-zinc-500 mb-2 truncate">{app.creator.headline}</p>}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-2 line-clamp-3">{app.pitch}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {app.quote && <span className="text-green-400 font-medium">${app.quote?.toLocaleString()}</span>}
                    {(app.portfolio_urls ?? []).length > 0 && (
                      <a href={app.portfolio_urls[0]} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Portfolio
                      </a>
                    )}
                    <span>{new Date(app.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {app.status !== 'approved' && app.status !== 'rejected' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/60">
                  {app.status !== 'shortlisted' && (
                    <button onClick={() => decide(app.id, 'shortlisted')} disabled={deciding === app.id}
                      className="flex-1 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-60">
                      <Star className="w-3 h-3" /> Shortlist
                    </button>
                  )}
                  <button onClick={() => decide(app.id, 'approved')} disabled={deciding === app.id}
                    className="flex-1 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-60">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => decide(app.id, 'rejected')} disabled={deciding === app.id}
                    className="flex-1 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-60">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}
              {app.status === 'approved' && (
                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : ''}</span>
                  <button onClick={() => decide(app.id, 'rejected')} disabled={deciding === app.id} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Undo</button>
                </div>
              )}
              {app.status === 'rejected' && (
                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs text-red-400 font-medium">Rejected</span>
                  <button onClick={() => decide(app.id, 'pending')} disabled={deciding === app.id} className="text-xs text-zinc-500 hover:text-white transition-colors">Undo</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Brief status controls */}
        <div className="p-4 border-t border-zinc-800 shrink-0 flex gap-2">
          <p className="text-xs text-zinc-500 self-center mr-auto">Mark brief as:</p>
          {['open', 'in_review', 'closed'].filter(s => s !== brief.status).map(s => (
            <button key={s} onClick={() => updateBriefStatus(s)}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl capitalize transition-colors">
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Brief card (creator / browse side) ───────────────────────────────────────
function BriefCard({ brief, hasApplied, onApply }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge status={brief.status} />
            {(brief.content_types ?? []).map(ct => (
              <span key={ct} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{ct}</span>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-white">{brief.title}</h3>
        </div>
      </div>
      <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{brief.description}</p>
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          ${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()} {brief.currency}
        </div>
        {brief.deadline && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            Due {new Date(brief.deadline).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          {brief.application_count ?? 0} applicants
        </div>
        {brief.min_followers > 0 && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            {(brief.min_followers / 1000).toFixed(0)}k+ followers
          </div>
        )}
      </div>
      {brief.target_audience && (
        <p className="text-xs text-zinc-500 mb-3"><span className="text-zinc-400 font-medium">Audience: </span>{brief.target_audience}</p>
      )}
      {(brief.niches ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {brief.niches.map(n => <span key={n} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">{n}</span>)}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          {brief.company?.logo_url ? (
            <img src={brief.company.logo_url} className="w-5 h-5 rounded object-cover" alt="" />
          ) : (
            <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
              {brief.company?.name?.[0] ?? 'B'}
            </div>
          )}
          <span className="text-xs text-zinc-500">{brief.company?.name ?? 'Brand'}</span>
        </div>
        {brief.status === 'open' && (
          hasApplied ? (
            <span className="text-xs text-purple-400 font-medium">Applied ✓</span>
          ) : (
            <button onClick={() => onApply(brief)}
              className="flex items-center gap-1 text-xs text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl font-medium transition-colors">
              Apply <ChevronRight className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── My brief card (brand side) ───────────────────────────────────────────────
function MyBriefCard({ brief, onManage, onRefresh }) {
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function setStatus(status) {
    setUpdatingStatus(true)
    await supabase.from('brand_briefs').update({ status }).eq('id', brief.id)
    setUpdatingStatus(false)
    onRefresh?.()
  }

  const appCount = brief.application_count ?? 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={brief.status} />
            {brief.external_ref && <span className="text-xs text-zinc-600 font-mono">{brief.external_ref}</span>}
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{brief.title}</h3>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">Budget</p>
          <p className="text-sm font-bold text-white">${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">Applications</p>
          <p className={`text-xl font-bold ${appCount > 0 ? 'text-purple-400' : 'text-zinc-500'}`}>{appCount}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-zinc-500 mb-0.5">Views</p>
          <p className="text-xl font-bold text-blue-400">{brief.views ?? 0}</p>
        </div>
      </div>

      {brief.deadline && (
        <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1">
          <Clock className="w-3 h-3 text-yellow-400" />
          Deadline: {new Date(brief.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      <div className="flex gap-2 pt-3 border-t border-zinc-800/60">
        <button onClick={() => onManage(brief)}
          className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center justify-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> View Applications {appCount > 0 && `(${appCount})`}
        </button>
        {brief.status === 'open' && (
          <button onClick={() => setStatus('closed')} disabled={updatingStatus}
            className="px-3 py-2 text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-60">
            Close
          </button>
        )}
        {brief.status === 'closed' && (
          <button onClick={() => setStatus('open')} disabled={updatingStatus}
            className="px-3 py-2 text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-60">
            Reopen
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BrandBriefs() {
  const { user } = useAuth()
  const [briefs,        setBriefs]        = useState([])
  const [myBriefs,      setMyBriefs]      = useState([])
  const [myApplications, setMyApps]       = useState(new Set())
  const [company,       setCompany]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [myBriefsLoading, setMBL]         = useState(true)
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState('browse')
  const [filterType,    setFilterType]    = useState('All')
  const [applying,      setApplying]      = useState(null)
  const [posting,       setPosting]       = useState(false)
  const [managing,      setManaging]      = useState(null)

  useEffect(() => { loadBriefs() }, [])
  useEffect(() => { if (user) { loadMyApps(); loadMyCompany() } }, [user])

  async function loadBriefs() {
    const { data } = await supabase.from('brand_briefs')
      .select('*, company:company_id(id, name, logo_url, handle)')
      .order('created_at', { ascending: false })
    setBriefs(data ?? [])
    setLoading(false)
  }

  async function loadMyApps() {
    const { data } = await supabase.from('brief_applications').select('brief_id').eq('creator_id', user.id)
    setMyApps(new Set((data ?? []).map(a => a.brief_id)))
  }

  async function loadMyCompany() {
    const { data } = await supabase.from('company_members').select('*, companies(*)').eq('user_id', user.id).limit(1).single()
    if (data?.companies) {
      setCompany(data.companies)
      loadMyBriefs(data.companies.id)
    } else {
      setMBL(false)
    }
  }

  async function loadMyBriefs(companyId) {
    setMBL(true)
    const { data } = await supabase.from('brand_briefs')
      .select('*').eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setMyBriefs(data ?? [])
    setMBL(false)
  }

  const allTypes = ['All', ...CONTENT_TYPES]
  const filtered = briefs.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.company?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType === 'All' || (b.content_types ?? []).includes(filterType)
    return matchSearch && matchType
  })

  // Analytics for My Briefs tab
  const totalApps     = myBriefs.reduce((s, b) => s + (b.application_count ?? 0), 0)
  const totalViews    = myBriefs.reduce((s, b) => s + (b.views ?? 0), 0)
  const openBriefs    = myBriefs.filter(b => b.status === 'open').length

  const TABS = [
    { id: 'browse',    label: 'Browse Briefs' },
    { id: 'my-briefs', label: company ? 'My Briefs' : 'For Brands' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {applying  && <ApplyModal brief={applying} onClose={() => setApplying(null)} onApplied={loadBriefs} />}
      {posting   && company && <PostBriefModal companyId={company.id} onClose={() => setPosting(false)} onPosted={() => { setPosting(false); loadMyBriefs(company.id); setTab('my-briefs') }} />}
      {managing  && <ApplicationsModal brief={managing} onClose={() => { setManaging(null); company && loadMyBriefs(company.id) }} />}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-blue-900/50 via-violet-900/30 to-zinc-900 border border-blue-800/30 p-8">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Brand × Creator</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Brand Briefs</h1>
        <p className="text-zinc-400 max-w-lg">Brands post what they need. Creators pitch for it. Find paid brand deals that match your style.</p>
        {company && (
          <button onClick={() => setPosting(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Post a Brief
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Browse tab ── */}
      {tab === 'browse' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs or brands…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {allTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-48 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{briefs.length === 0 ? 'No brand briefs yet.' : 'No briefs match your filter.'}</p>
              <p className="text-xs mt-1">Brands will post briefs here when they're ready to work with creators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(b => <BriefCard key={b.id} brief={b} hasApplied={myApplications.has(b.id)} onApply={setApplying} />)}
            </div>
          )}
        </>
      )}

      {/* ── My Briefs tab ── */}
      {tab === 'my-briefs' && (
        <>
          {!user ? (
            <div className="text-center py-20 text-zinc-500"><p className="text-sm">Sign in to manage your brand briefs</p></div>
          ) : !company ? (
            <div className="text-center py-20 text-zinc-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-zinc-400">You need a Company profile to post briefs</p>
              <p className="text-xs mt-1 mb-5 text-zinc-600">Create a company to access the brand side of Philomni</p>
              <a href="/company/create" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors inline-block">
                Create Company
              </a>
            </div>
          ) : (
            <>
              {/* Analytics summary */}
              {myBriefs.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Active Briefs</p>
                    <p className="text-2xl font-bold text-blue-400">{openBriefs}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total Applications</p>
                    <p className="text-2xl font-bold text-purple-400">{totalApps}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total Views</p>
                    <p className="text-2xl font-bold text-white">{totalViews}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Your Briefs ({myBriefs.length})</p>
                <button onClick={() => setPosting(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Post Brief
                </button>
              </div>

              {myBriefsLoading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-40 animate-pulse" />)}</div>
              ) : myBriefs.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">No briefs posted yet</p>
                  <p className="text-xs mt-1 mb-5">Post your first brief to start receiving creator applications</p>
                  <button onClick={() => setPosting(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
                    Post Your First Brief
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myBriefs.map(b => (
                    <MyBriefCard key={b.id} brief={b}
                      onManage={setManaging}
                      onRefresh={() => loadMyBriefs(company.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
