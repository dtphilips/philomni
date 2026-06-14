import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Briefcase, Plus, X, DollarSign, Clock, Users, Search,
  ChevronRight, CheckCircle, XCircle, Star, Heart, BarChart2,
  Tag, MessageSquare, ExternalLink, Eye, Bookmark, Send,
  TrendingUp, AlertCircle, Info, Building2, Zap, FileText,
  ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react'

const CONTENT_TYPES = ['Video', 'Short-form', 'Blog', 'Podcast', 'Photo', 'Reel', 'Story', 'Newsletter']
const NICHES = ['Beauty', 'Lifestyle', 'Tech', 'Finance', 'Food', 'Fashion', 'Fitness', 'Travel', 'Gaming', 'Education', 'Parenting', 'Business']

// ─── Status badges ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open:      'bg-green-500/20 text-green-400',
    in_review: 'bg-yellow-500/20 text-yellow-400',
    closed:    'bg-zinc-500/20 text-zinc-400',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] ?? map.open}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

function AppStatusBadge({ status }) {
  const map = {
    pending:     'bg-zinc-700 text-zinc-300',
    shortlisted: 'bg-blue-500/20 text-blue-400',
    approved:    'bg-green-500/20 text-green-400',
    rejected:    'bg-red-500/20 text-red-400',
  }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? map.pending}`}>{status}</span>
}

// ─── How it works explainer ───────────────────────────────────────────────────
function HowItWorksPanel({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-white">How Brand Briefs work</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-zinc-800">
          {/* Brand flow */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">For Brands</p>
            <div className="space-y-3">
              {[
                { step: '1', icon: Building2, title: 'Set up your company profile', desc: 'Go to your profile and create a company page. This is the identity that gets shown on your briefs.' },
                { step: '2', icon: FileText, title: 'Post a brief', desc: 'Set your campaign title, budget range, content types (Reel, Video, Blog…), creator niches, minimum follower count, and deadline.' },
                { step: '3', icon: Heart, title: 'Creators express interest or apply', desc: 'Interested creators tap a button — you instantly see their Philomni profile: follower count, content niche, and headline. Full applicants also send a pitch, their rate quote, and portfolio links.' },
                { step: '4', icon: CheckCircle, title: 'Shortlist, approve, or reject', desc: 'Review each application or interested creator. Shortlist your top picks, then approve your chosen creators. They get notified.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-400">{s.step}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800/60" />

          {/* Creator flow */}
          <div>
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">For Creators</p>
            <div className="space-y-3">
              {[
                { step: '1', icon: Heart,      title: 'Express interest (one tap, no form)', desc: 'Tap the heart on any brief. Your Philomni profile — follower count, content niche, and headline — is instantly shared with the brand. No pitch needed. The brand can invite you to apply.' },
                { step: '2', icon: Send,        title: 'Apply (optional, but stronger)', desc: 'Write a pitch explaining your angle and why you\'re the right fit. Add your rate quote and 1–3 portfolio links. Your full Philomni profile is auto-attached — brands see everything.' },
                { step: '3', icon: BarChart2,   title: 'Track your status', desc: 'In My Activity below you can see every brief you\'ve expressed interest in or applied to, and your real-time status: Pending → Shortlisted → Approved / Rejected.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center shrink-0 text-xs font-bold text-purple-400">{s.step}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What brands see */}
          <div className="bg-zinc-800/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-300 mb-2">What brands see on each creator</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Follower count vs. brief minimum',
                'Content niche match',
                'Philomni headline',
                'Avatar + username',
                'Written pitch (if applied)',
                'Rate quote (if applied)',
                'Portfolio links (if applied)',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── No company banner ────────────────────────────────────────────────────────
function NoCompanyBanner() {
  const navigate = useNavigate()
  return (
    <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-1">You need a company profile to post briefs</p>
          <p className="text-xs text-zinc-400 mb-3">Brands on Philomni post briefs under their company identity — not their personal profile. Set up your company page first (it only takes a minute), then come back here to post.</p>
          <button onClick={() => navigate('/companies/new')}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create company profile
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Brief modal ─────────────────────────────────────────────────────────
function PostBriefModal({ companyId, onClose, onPosted }) {
  const [form, setForm] = useState({
    title: '', description: '', budget_min: '', budget_max: '',
    currency: 'USD', deadline: '', target_audience: '',
    content_types: [], niches: [], min_followers: '', external_ref: '',
  })
  const [saving, setSaving] = useState(false)

  function toggleArr(key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim())                  { toast.error('Title required'); return }
    if (!form.budget_min || !form.budget_max) { toast.error('Budget range required'); return }
    if (!form.deadline)                       { toast.error('Deadline required'); return }
    setSaving(true)
    const { error } = await supabase.from('brand_briefs').insert({
      title: form.title.trim(), description: form.description.trim(),
      budget_min: Number(form.budget_min), budget_max: Number(form.budget_max),
      currency: form.currency,
      deadline: new Date(form.deadline).toISOString(),
      target_audience: form.target_audience || null,
      content_types: form.content_types, niches: form.niches,
      min_followers: form.min_followers ? Number(form.min_followers) : 0,
      external_ref: form.external_ref || null,
      company_id: companyId, status: 'open',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Brief posted! Creators can now see and apply.')
    onPosted?.(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-white text-lg">Post a Brief</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Creators will see this and can express interest or apply</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Campaign Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 30-sec product reel for our Q3 launch"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description <span className="text-zinc-600">— what creators need to know</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
              placeholder="Campaign goals, deliverables, tone of voice, usage rights, anything the creator should know before applying…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget Min (USD)</label>
              <input type="number" min={0} value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))}
                placeholder="500"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget Max (USD)</label>
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
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min Followers Required</label>
              <input type="number" min={0} value={form.min_followers} onChange={e => setForm(f => ({ ...f, min_followers: e.target.value }))}
                placeholder="0 = any creator"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Content Types Needed</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map(ct => (
                <button key={ct} type="button" onClick={() => toggleArr('content_types', ct)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${form.content_types.includes(ct) ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Creator Niches <span className="text-zinc-600">— used to match creators</span></label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n} type="button" onClick={() => toggleArr('niches', n)}
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
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Internal Reference <span className="text-zinc-600">— optional</span></label>
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

// ─── Apply modal ──────────────────────────────────────────────────────────────
function ApplyModal({ brief, onClose, onApplied }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [pitch, setPitch]     = useState('')
  const [quote, setQuote]     = useState('')
  const [portUrl, setPortUrl] = useState('')
  const [portUrls, setPortUrls] = useState([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (user) supabase.from('profiles').select('full_name, avatar_url, follower_count, headline, username').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  function addUrl() {
    const u = portUrl.trim(); if (!u) return
    setPortUrls(p => [...p, u]); setPortUrl('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!pitch.trim()) { toast.error('Write your pitch'); return }
    setSaving(true)
    const { error } = await supabase.from('brief_applications').insert({
      brief_id: brief.id, creator_id: user.id,
      pitch: pitch.trim(), quote: quote ? Number(quote) : null,
      portfolio_urls: portUrls, status: 'pending',
    })
    setSaving(false)
    if (error) { toast.error(error.code === '23505' ? 'You\'ve already applied to this brief' : error.message); return }
    toast.success('Application submitted! Track it in My Activity below.')
    onApplied?.(); onClose()
  }

  const meetsFollowers = brief.min_followers && profile?.follower_count >= brief.min_followers
  const belowFollowers = brief.min_followers && profile?.follower_count < brief.min_followers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-800">
          <h2 className="font-bold text-white">Apply to Brief</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Brief summary */}
        <div className="mx-5 mt-4 bg-zinc-900 rounded-xl p-3">
          <p className="text-sm font-medium text-white">{brief.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-zinc-500">{brief.company?.name}</span>
            <span className="text-xs text-green-400 font-medium">${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()}</span>
            {brief.deadline && <span className="text-xs text-zinc-500">Due {new Date(brief.deadline).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Follower eligibility warning */}
        {belowFollowers && (
          <div className="mx-5 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">This brief requires {(brief.min_followers / 1000).toFixed(0)}k+ followers. You have {((profile?.follower_count ?? 0) / 1000).toFixed(1)}k. You can still apply — the brand makes the final call.</p>
          </div>
        )}

        {/* What auto-attaches */}
        <div className="mx-5 mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-300 mb-1.5">Your profile auto-attached to this application:</p>
          {profile ? (
            <div className="flex items-center gap-2.5">
              <img src={profile.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name ?? 'C')}&background=7c3aed&color=fff&size=32`}
                className="w-8 h-8 rounded-full object-cover" alt="" />
              <div>
                <p className="text-xs text-white font-medium">{profile.full_name} <span className="text-zinc-500">@{profile.username}</span></p>
                <p className="text-xs text-zinc-400">{(profile.follower_count ?? 0).toLocaleString()} followers {meetsFollowers ? '✓' : ''} · {profile.headline ?? 'no headline'}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-blue-400/70">Your follower count, content niche, and headline — automatically included.</p>
          )}
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Pitch <span className="text-red-400">*</span></label>
            <textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={5}
              placeholder="Why are you the right creator for this? What's your angle, approach, and what makes your audience a fit for this brand?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Rate (USD) <span className="text-zinc-500 font-normal">— optional</span></label>
            <input type="number" min={0} value={quote} onChange={e => setQuote(e.target.value)}
              placeholder={`Leave blank or enter within $${brief.budget_min?.toLocaleString()}–$${brief.budget_max?.toLocaleString()}`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Portfolio Links <span className="text-zinc-500 font-normal">— optional but recommended</span></label>
            <div className="flex gap-2 mb-2">
              <input value={portUrl} onChange={e => setPortUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="Past work, YouTube, Instagram reel, blog…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
              <button type="button" onClick={addUrl} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700"><Plus className="w-4 h-4" /></button>
            </div>
            {portUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 mb-1 bg-zinc-900 rounded-lg px-3 py-2">
                <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate flex-1">{u}</span>
                <button type="button" onClick={() => setPortUrls(urls => urls.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm">
            {saving ? 'Submitting…' : 'Submit Application'}
          </button>
          <p className="text-xs text-center text-zinc-600">You can track your application status in My Activity below</p>
        </form>
      </div>
    </div>
  )
}

// ─── Manage applications modal (brand side) ────────────────────────────────────
function ManageModal({ brief, onClose, onRefresh }) {
  const [apps,       setApps]       = useState([])
  const [interested, setInterested] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [acting,     setActing]     = useState(null)
  const [tab,        setTab]        = useState('applications')

  useEffect(() => { loadApps(); loadInterested() }, [brief.id])

  async function loadApps() {
    const { data } = await supabase.from('brief_applications')
      .select('*, creator:creator_id(id, full_name, username, avatar_url, headline, follower_count)')
      .eq('brief_id', brief.id).order('created_at', { ascending: false })
    setApps(data ?? [])
    setLoading(false)
  }

  async function loadInterested() {
    const { data } = await supabase.from('brief_interests')
      .select('*, creator:creator_id(id, full_name, username, avatar_url, headline, follower_count)')
      .eq('brief_id', brief.id).order('created_at', { ascending: false })
    setInterested(data ?? [])
  }

  async function decide(appId, status) {
    setActing(appId)
    const now = new Date().toISOString()
    const ts = {}
    if (status === 'approved')    { ts.approved_at = now; ts.rejected_at = null }
    if (status === 'rejected')    { ts.rejected_at = now; ts.approved_at = null }
    if (status === 'shortlisted') { ts.shortlisted_at = now }
    await supabase.from('brief_applications').update({ status, ...ts }).eq('id', appId)
    setActing(null)
    toast.success(`Application ${status}`)
    loadApps(); onRefresh?.()
  }

  async function updateBriefStatus(status) {
    await supabase.from('brand_briefs').update({ status }).eq('id', brief.id)
    toast.success(`Brief marked as ${status.replace('_', ' ')}`)
    onRefresh?.()
  }

  const counts = { all: apps.length, pending: 0, shortlisted: 0, approved: 0, rejected: 0 }
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })
  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  function nicheMatch(creator) {
    if (!brief.niches?.length) return null
    return brief.niches.some(n => creator?.headline?.toLowerCase().includes(n.toLowerCase())) ? true : null
  }
  function meetsFollowers(creator) {
    if (!brief.min_followers) return null
    return (creator?.follower_count ?? 0) >= brief.min_followers
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-white">{brief.title}</h2>
              <div className="flex items-center gap-2 mt-1"><StatusBadge status={brief.status} /></div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Interested', val: interested.length, color: 'text-blue-400' },
              { label: 'Applied',    val: apps.length,       color: 'text-purple-400' },
              { label: 'Approved',   val: counts.approved,   color: 'text-green-400' },
              { label: 'Views',      val: brief.views ?? 0,  color: 'text-zinc-300' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {['applications', 'interested'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                {t === 'applications' ? `Applications (${apps.length})` : `Interested (${interested.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {tab === 'applications' && (
            <>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-1">
                {['all','pending','shortlisted','approved','rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                    {f} {counts[f] > 0 ? `(${counts[f]})` : ''}
                  </button>
                ))}
              </div>
              {loading ? [1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-24 animate-pulse" />) :
               filtered.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{apps.length === 0 ? 'No applications yet — share your brief to attract creators.' : `No ${filter} applications`}</p>
                </div>
              ) : filtered.map(app => {
                const mf = meetsFollowers(app.creator)
                return (
                  <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <img src={app.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.full_name ?? 'C')}&background=7c3aed&color=fff&size=40`}
                        className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Link to={`/profile/${app.creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">{app.creator?.full_name}</Link>
                          <span className="text-xs text-zinc-500">@{app.creator?.username}</span>
                          <AppStatusBadge status={app.status} />
                        </div>
                        {app.creator?.headline && <p className="text-xs text-zinc-500 mb-1.5 truncate">{app.creator.headline}</p>}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {app.creator?.follower_count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${mf === true ? 'bg-green-500/20 text-green-400' : mf === false ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                              {(app.creator.follower_count / 1000).toFixed(1)}k followers {mf === true ? '✓' : mf === false ? '✗' : ''}
                            </span>
                          )}
                          {app.quote && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">${app.quote?.toLocaleString()}</span>}
                          {nicheMatch(app.creator) && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-medium">Niche match</span>}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-2 line-clamp-3">{app.pitch}</p>
                        {(app.portfolio_urls ?? []).length > 0 && (
                          <a href={app.portfolio_urls[0]} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View portfolio
                          </a>
                        )}
                      </div>
                    </div>
                    {app.status !== 'approved' && app.status !== 'rejected' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/60">
                        {app.status !== 'shortlisted' && (
                          <button onClick={() => decide(app.id, 'shortlisted')} disabled={acting === app.id}
                            className="flex-1 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-1">
                            <Star className="w-3 h-3" /> Shortlist
                          </button>
                        )}
                        <button onClick={() => decide(app.id, 'approved')} disabled={acting === app.id}
                          className="flex-1 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-xl flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => decide(app.id, 'rejected')} disabled={acting === app.id}
                          className="flex-1 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-xs text-green-400 font-medium">✓ Approved {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : ''}</span>
                        <button onClick={() => decide(app.id, 'pending')} className="text-xs text-zinc-600 hover:text-zinc-400">Undo</button>
                      </div>
                    )}
                    {app.status === 'rejected' && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-xs text-red-400">Rejected</span>
                        <button onClick={() => decide(app.id, 'pending')} className="text-xs text-zinc-600 hover:text-zinc-400">Undo</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {tab === 'interested' && (
            interested.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No creators have expressed interest yet</p>
                <p className="text-xs mt-1 text-zinc-600">When a creator taps "Interested", their Philomni profile appears here</p>
              </div>
            ) : interested.map(i => {
              const mf = meetsFollowers(i.creator)
              const alreadyApplied = apps.some(a => a.creator_id === i.creator?.id)
              return (
                <div key={i.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                  <img src={i.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(i.creator?.full_name ?? 'C')}&background=3b82f6&color=fff&size=40`}
                    className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/profile/${i.creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">{i.creator?.full_name}</Link>
                      <span className="text-xs text-zinc-500">@{i.creator?.username}</span>
                      {alreadyApplied && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Also applied</span>}
                    </div>
                    {i.creator?.headline && <p className="text-xs text-zinc-500 mb-2 truncate">{i.creator.headline}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {i.creator?.follower_count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${mf === true ? 'bg-green-500/20 text-green-400' : mf === false ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {(i.creator.follower_count / 1000).toFixed(1)}k followers {mf === true ? '✓' : mf === false ? '✗' : ''}
                        </span>
                      )}
                      {nicheMatch(i.creator) && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Niche match</span>}
                      <span className="text-xs text-zinc-600">Interested {new Date(i.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 shrink-0 flex items-center gap-2">
          <p className="text-xs text-zinc-500 mr-auto">Mark brief as:</p>
          {['open','in_review','closed'].filter(s => s !== brief.status).map(s => (
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

// ─── Brief card (creator browse view) ─────────────────────────────────────────
function BriefCard({ brief, interested, hasApplied, myFollowers, onToggleInterest, onApply }) {
  const [toggling, setToggling] = useState(false)
  const meetsMin = !brief.min_followers || myFollowers >= brief.min_followers

  async function toggleInterest() {
    setToggling(true)
    await onToggleInterest(brief.id, interested)
    setToggling(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge status={brief.status} />
            {(brief.content_types ?? []).slice(0, 2).map(ct => (
              <span key={ct} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{ct}</span>
            ))}
            {(brief.content_types ?? []).length > 2 && <span className="text-xs text-zinc-600">+{brief.content_types.length - 2}</span>}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{brief.title}</h3>
        </div>
        <button onClick={toggleInterest} disabled={toggling || brief.status !== 'open'}
          title={interested ? 'Remove interest' : 'Tap to express interest — shares your Philomni profile with the brand'}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${interested ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10'}`}>
          <Heart className={`w-4 h-4 ${interested ? 'fill-blue-400' : ''}`} />
        </button>
      </div>

      {brief.description && <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{brief.description}</p>}

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          ${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()}
        </div>
        {brief.deadline && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            Due {new Date(brief.deadline).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Heart className="w-3.5 h-3.5 text-blue-400" />
          {brief.interest_count ?? 0} interested
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Send className="w-3.5 h-3.5 text-purple-400" />
          {brief.application_count ?? 0} applied
        </div>
        {brief.min_followers > 0 && (
          <div className={`flex items-center gap-1.5 col-span-2 ${!meetsMin ? 'text-yellow-400/70' : 'text-zinc-400'}`}>
            <Users className="w-3.5 h-3.5" />
            {(brief.min_followers / 1000).toFixed(0)}k+ followers required {!meetsMin && myFollowers > 0 ? '(you have ' + ((myFollowers ?? 0) / 1000).toFixed(1) + 'k)' : meetsMin && myFollowers > 0 ? '✓ you qualify' : ''}
          </div>
        )}
      </div>

      {(brief.niches ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {brief.niches.map(n => <span key={n} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">{n}</span>)}
        </div>
      )}

      {brief.target_audience && (
        <p className="text-xs text-zinc-500 mb-3"><span className="text-zinc-400 font-medium">Audience: </span>{brief.target_audience}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          {brief.company?.logo_url
            ? <img src={brief.company.logo_url} className="w-5 h-5 rounded object-cover" alt="" />
            : <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">{brief.company?.name?.[0] ?? 'B'}</div>
          }
          <span className="text-xs text-zinc-500">{brief.company?.name ?? 'Brand'}</span>
        </div>
        {brief.status === 'open' && (
          hasApplied
            ? <span className="text-xs text-purple-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Applied</span>
            : <button onClick={() => onApply(brief)}
                className="flex items-center gap-1.5 text-xs text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl font-medium transition-colors">
                Apply <ChevronRight className="w-3 h-3" />
              </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BrandBriefs() {
  const { user } = useAuth()

  const [briefs,          setBriefs]          = useState([])
  const [myBriefs,        setMyBriefs]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [myInterests,     setMyInterests]     = useState(new Set())
  const [myApps,          setMyApps]          = useState(new Set())
  const [interestRecords, setInterestRecords] = useState([])
  const [appRecords,      setAppRecords]      = useState([])
  const [company,         setCompany]         = useState(null)
  const [companyChecked,  setCompanyChecked]  = useState(false)
  const [myFollowers,     setMyFollowers]     = useState(0)
  const [search,          setSearch]          = useState('')
  const [filterType,      setFilterType]      = useState('All')
  const [posting,         setPosting]         = useState(false)
  const [applying,        setApplying]        = useState(null)
  const [managing,        setManaging]        = useState(null)
  const [activityTab,     setActivityTab]     = useState('applications')
  const [activeSection,   setActiveSection]   = useState('browse') // browse | brand

  useEffect(() => {
    loadBriefs()
    if (user) { loadMyCompany(); loadMyActivity(); loadMyProfile() }
  }, [user])

  async function loadBriefs() {
    const { data } = await supabase.from('brand_briefs')
      .select('*, company:company_id(id, name, logo_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setBriefs(data ?? [])
    setLoading(false)
  }

  async function loadMyProfile() {
    const { data } = await supabase.from('profiles').select('follower_count').eq('id', user.id).single()
    setMyFollowers(data?.follower_count ?? 0)
  }

  async function loadMyCompany() {
    const { data: owned } = await supabase.from('companies').select('*').eq('owner_id', user.id).limit(1).maybeSingle()
    if (owned) { setCompany(owned); loadMyBriefs(owned.id); setCompanyChecked(true); return }
    const { data: member } = await supabase.from('company_members').select('*, companies(*)').eq('user_id', user.id).limit(1).maybeSingle()
    if (member?.companies) { setCompany(member.companies); loadMyBriefs(member.companies.id) }
    setCompanyChecked(true)
  }

  async function loadMyBriefs(companyId) {
    const { data } = await supabase.from('brand_briefs')
      .select('*, company:company_id(id, name, logo_url)')
      .eq('company_id', companyId).order('created_at', { ascending: false })
    setMyBriefs(data ?? [])
  }

  async function loadMyActivity() {
    const [{ data: ints }, { data: apps }] = await Promise.all([
      supabase.from('brief_interests')
        .select('*, brief:brief_id(id, title, status, budget_min, budget_max, deadline, company:company_id(id, name, logo_url))')
        .eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('brief_applications')
        .select('*, brief:brief_id(id, title, status, budget_min, budget_max, deadline, company:company_id(id, name, logo_url))')
        .eq('creator_id', user.id).order('created_at', { ascending: false }),
    ])
    setInterestRecords(ints ?? [])
    setMyInterests(new Set((ints ?? []).map(i => i.brief_id)))
    setAppRecords(apps ?? [])
    setMyApps(new Set((apps ?? []).map(a => a.brief_id)))
  }

  async function toggleInterest(briefId, currentlyInterested) {
    if (!user) { toast.error('Sign in to express interest'); return }
    if (currentlyInterested) {
      await supabase.from('brief_interests').delete().eq('brief_id', briefId).eq('creator_id', user.id)
      toast.success('Interest removed')
    } else {
      const { error } = await supabase.from('brief_interests').insert({ brief_id: briefId, creator_id: user.id })
      if (!error) toast.success('Interest expressed — the brand can now see your profile')
    }
    loadBriefs(); loadMyActivity()
  }

  const allTypes = ['All', ...CONTENT_TYPES]
  const filtered = briefs.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.company?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType === 'All' || (b.content_types ?? []).includes(filterType)
    return matchSearch && matchType
  })

  const openBriefs         = myBriefs.filter(b => b.status === 'open').length
  const totalAppsReceived  = myBriefs.reduce((s, b) => s + (b.application_count ?? 0), 0)
  const totalViews         = myBriefs.reduce((s, b) => s + (b.views ?? 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Modals */}
      {posting  && company && <PostBriefModal companyId={company.id} onClose={() => setPosting(false)} onPosted={() => { loadBriefs(); loadMyBriefs(company.id) }} />}
      {applying && <ApplyModal brief={applying} onClose={() => setApplying(null)} onApplied={() => { loadBriefs(); loadMyActivity() }} />}
      {managing && <ManageModal brief={managing} onClose={() => setManaging(null)} onRefresh={() => { loadBriefs(); company && loadMyBriefs(company.id) }} />}

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900/50 via-violet-900/30 to-zinc-900 border border-blue-800/30 p-8">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Brand × Creator</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Brand Briefs</h1>
        <p className="text-zinc-400 max-w-lg">Brands post campaigns. Creators express interest or pitch directly. Deals get made.</p>
        {/* Mode toggle */}
        <div className="flex gap-2 mt-5">
          <button onClick={() => setActiveSection('browse')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeSection === 'browse' ? 'bg-white text-zinc-900' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60'}`}>
            Browse Briefs
          </button>
          <button onClick={() => setActiveSection('brand')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeSection === 'brand' ? 'bg-blue-600 text-white' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60'}`}>
            I'm a Brand
          </button>
        </div>
      </div>

      {/* ── How it works ── */}
      <HowItWorksPanel />

      {/* ════════════════════ BRAND SECTION ════════════════════ */}
      {activeSection === 'brand' && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Brand Dashboard</h2>
            {company && (
              <button onClick={() => setPosting(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium">
                <Plus className="w-3.5 h-3.5" /> Post Brief
              </button>
            )}
          </div>

          {companyChecked && !company && <NoCompanyBanner />}

          {company && (
            <>
              {/* Analytics */}
              {myBriefs.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Active Briefs</p>
                    <p className="text-2xl font-bold text-blue-400">{openBriefs}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Applications</p>
                    <p className="text-2xl font-bold text-purple-400">{totalAppsReceived}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total Views</p>
                    <p className="text-2xl font-bold text-white">{totalViews}</p>
                  </div>
                </div>
              )}

              {myBriefs.length === 0 ? (
                <div className="text-center py-14 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                  <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">No briefs yet</p>
                  <p className="text-xs mt-1 mb-4">Post your first brief and creators on Philomni can express interest or apply</p>
                  <button onClick={() => setPosting(true)} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-colors">
                    Post your first brief →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myBriefs.map(b => (
                    <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={b.status} />
                            {b.external_ref && <span className="text-xs text-zinc-600 font-mono truncate">{b.external_ref}</span>}
                          </div>
                          <p className="text-sm font-semibold text-white">{b.title}</p>
                          {b.deadline && <p className="text-xs text-zinc-500 mt-0.5">Deadline: {new Date(b.deadline).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
                          <p className="text-xs text-zinc-500">Interested</p>
                          <p className="text-lg font-bold text-blue-400">{b.interest_count ?? 0}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
                          <p className="text-xs text-zinc-500">Applied</p>
                          <p className="text-lg font-bold text-purple-400">{b.application_count ?? 0}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
                          <p className="text-xs text-zinc-500">Views</p>
                          <p className="text-lg font-bold text-white">{b.views ?? 0}</p>
                        </div>
                      </div>
                      <button onClick={() => setManaging(b)}
                        className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Manage Applications & Interested
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ════════════════════ BROWSE SECTION ════════════════════ */}
      {activeSection === 'browse' && (
        <section className="space-y-5">
          <h2 className="text-base font-bold text-white">Browse Open Briefs</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs or brands…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {!user && (
            <div className="bg-zinc-900/60 border border-zinc-800 border-dashed rounded-2xl p-4 flex items-center gap-3">
              <Heart className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Sign in to express interest or apply</p>
                <p className="text-xs text-zinc-500 mt-0.5">Once signed in, you can tap the heart to flag interest (one tap, no form) or submit a full pitch</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-52 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{briefs.length === 0 ? 'No open briefs yet — check back soon.' : 'No briefs match your filter.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(b => (
                <BriefCard key={b.id} brief={b}
                  interested={myInterests.has(b.id)}
                  hasApplied={myApps.has(b.id)}
                  myFollowers={myFollowers}
                  onToggleInterest={toggleInterest}
                  onApply={setApplying} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ════════════════════ MY ACTIVITY ════════════════════ */}
      {user && (
        <section>
          <h2 className="text-base font-bold text-white mb-4">My Activity</h2>

          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-4">
            {[
              { id: 'applications', label: `Applications (${appRecords.length})` },
              { id: 'interests',    label: `Interested (${interestRecords.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setActivityTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${activityTab === t.id ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {activityTab === 'applications' && (
            appRecords.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-zinc-400">No applications yet</p>
                <p className="text-xs mt-1">Find a brief above and hit Apply to submit your pitch</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appRecords.map(a => (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        a.status === 'approved'    ? 'bg-green-500/20' :
                        a.status === 'rejected'    ? 'bg-red-500/20' :
                        a.status === 'shortlisted' ? 'bg-blue-500/20' : 'bg-zinc-800'
                      }`}>
                        {a.status === 'approved'    ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                         a.status === 'rejected'    ? <XCircle className="w-5 h-5 text-red-400" /> :
                         a.status === 'shortlisted' ? <Star className="w-5 h-5 text-blue-400" /> :
                         <Send className="w-5 h-5 text-zinc-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{a.brief?.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-zinc-500">{a.brief?.company?.name}</span>
                          <AppStatusBadge status={a.status} />
                          <span className="text-xs text-zinc-600">{new Date(a.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="mt-2 text-xs">
                          {a.status === 'pending' &&     <p className="text-zinc-500">Submitted — waiting for the brand to review</p>}
                          {a.status === 'shortlisted' && <p className="text-blue-400">You've been shortlisted! The brand is reviewing their top picks.</p>}
                          {a.status === 'approved' &&    <p className="text-green-400 font-medium">🎉 You've been approved! The brand will reach out to proceed.</p>}
                          {a.status === 'rejected' &&    <p className="text-zinc-500">Not selected this time. Keep pitching — each brief is a new chance.</p>}
                        </div>
                      </div>
                      {a.quote && <span className="shrink-0 text-xs text-green-400 font-bold self-start">${a.quote?.toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activityTab === 'interests' && (
            interestRecords.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-zinc-400">Nothing saved yet</p>
                <p className="text-xs mt-1">Tap the heart <Heart className="inline w-3 h-3" /> on any brief to express interest — one tap, no form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interestRecords.map(i => {
                  const alsoApplied = myApps.has(i.brief_id)
                  return (
                    <div key={i.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-blue-400 fill-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{i.brief?.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-zinc-500">{i.brief?.company?.name}</span>
                          <StatusBadge status={i.brief?.status} />
                          {alsoApplied && <span className="text-xs text-purple-400 font-medium">Applied ✓</span>}
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">Your profile is visible to this brand</p>
                      </div>
                      {i.brief?.status === 'open' && !alsoApplied && (
                        <button onClick={() => setApplying(i.brief)}
                          className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors">
                          Apply
                        </button>
                      )}
                      <button onClick={() => toggleInterest(i.brief_id, true)}
                        className="shrink-0 p-2 text-zinc-600 hover:text-red-400 transition-colors" title="Remove interest">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </section>
      )}
    </div>
  )
}
