import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Briefcase, Plus, X, DollarSign, Clock, Users, Search,
  ChevronRight, CheckCircle, XCircle, Star, Heart, BarChart2,
  MessageSquare, ExternalLink, Send, AlertCircle, Info, Building2,
  FileText, ChevronDown, ChevronUp, ArrowRight, Upload, ThumbsUp,
  RotateCcw, Award, Handshake, Package, Edit3, Link2,
  Paperclip, File, Music, Video, Image, FileSpreadsheet, Mic
} from 'lucide-react'

const CONTENT_TYPE_SUGGESTIONS = ['Video', 'Short-form', 'Blog', 'Podcast', 'Photo', 'Reel', 'Story', 'Newsletter', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn']
const NICHE_SUGGESTIONS = ['Beauty', 'Lifestyle', 'Tech', 'Finance', 'Food', 'Fashion', 'Fitness', 'Travel', 'Gaming', 'Education', 'Parenting', 'Business', 'Health', 'Sports', 'Music', 'Comedy', 'DIY', 'Cars', 'Pets', 'Real Estate']
const CONTENT_TYPES = CONTENT_TYPE_SUGGESTIONS
const NICHES = NICHE_SUGGESTIONS

// Tag input: presets + free type, Enter or comma to add
function TagInput({ label, sublabel, values, onChange, suggestions, color = 'blue', placeholder }) {
  const [input, setInput] = useState('')

  function add(val) {
    const v = val.trim()
    if (!v || values.includes(v)) { setInput(''); return }
    onChange([...values, v]); setInput('')
  }
  function remove(v) { onChange(values.filter(x => x !== v)) }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && values.length) { onChange(values.slice(0,-1)) }
  }
  const filtered = suggestions.filter(s => !values.includes(s) && (!input || s.toLowerCase().includes(input.toLowerCase())))

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label} {sublabel && <span className="text-zinc-600 font-normal">{sublabel}</span>}
      </label>
      {/* Tag chips + input */}
      <div className={`flex flex-wrap gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 focus-within:border-${color}-600 min-h-[44px]`}>
        {values.map(v => (
          <span key={v} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-${color}-600/20 text-${color}-300 border border-${color}-600/30`}>
            {v}
            <button type="button" onClick={() => remove(v)} className={`text-${color}-400/60 hover:text-${color}-300`}><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => input.trim() && add(input)}
          placeholder={values.length ? '' : (placeholder || 'Type and press Enter…')}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
        />
      </div>
      {/* Suggestions */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filtered.slice(0, 12).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 hover:border-zinc-600 hover:text-white transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const DEAL_STATUS_MAP = {
  offer_sent:         { label: 'Offer Sent',          color: 'text-yellow-400',  bg: 'bg-yellow-500/20' },
  accepted:           { label: 'Accepted',             color: 'text-blue-400',    bg: 'bg-blue-500/20' },
  declined:           { label: 'Declined',             color: 'text-red-400',     bg: 'bg-red-500/20' },
  in_progress:        { label: 'In Progress',          color: 'text-purple-400',  bg: 'bg-purple-500/20' },
  delivered:          { label: 'Delivered',            color: 'text-cyan-400',    bg: 'bg-cyan-500/20' },
  revision_requested: { label: 'Revision Requested',  color: 'text-orange-400',  bg: 'bg-orange-500/20' },
  completed:          { label: 'Completed',            color: 'text-green-400',   bg: 'bg-green-500/20' },
  cancelled:          { label: 'Cancelled',            color: 'text-zinc-400',    bg: 'bg-zinc-800' },
}

function DealBadge({ status }) {
  const s = DEAL_STATUS_MAP[status] ?? DEAL_STATUS_MAP.offer_sent
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
}

function StatusBadge({ status }) {
  const map = { open: 'bg-green-500/20 text-green-400', in_review: 'bg-yellow-500/20 text-yellow-400', closed: 'bg-zinc-500/20 text-zinc-400' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] ?? map.open}`}>{status?.replace('_', ' ')}</span>
}

function AppStatusBadge({ status }) {
  const map = { pending: 'bg-zinc-700 text-zinc-300', shortlisted: 'bg-blue-500/20 text-blue-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? map.pending}`}>{status}</span>
}

// ─── Deal timeline steps (visual) ─────────────────────────────────────────────
function DealTimeline({ status }) {
  const steps = [
    { key: 'offer_sent',   label: 'Offer Sent' },
    { key: 'accepted',     label: 'Accepted' },
    { key: 'in_progress',  label: 'In Progress' },
    { key: 'delivered',    label: 'Delivered' },
    { key: 'completed',    label: 'Completed' },
  ]
  const order = steps.map(s => s.key)
  const currentIdx = order.indexOf(status)

  return (
    <div className="flex items-center gap-0 w-full my-3">
      {steps.map((s, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const special = ['revision_requested','declined','cancelled'].includes(status) && i === currentIdx
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${done ? 'bg-green-600 border-green-600 text-white' : active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center leading-tight ${done || active ? 'text-zinc-300' : 'text-zinc-600'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mb-4 transition-colors ${done ? 'bg-green-600' : 'bg-zinc-800'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── How it works panel ────────────────────────────────────────────────────────
function HowItWorksPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-white">Full process — start to finish</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800 space-y-6 pt-4">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">Brands</p>
            <div className="space-y-3">
              {[
                { n:'1', t:'Create a company profile', d:'Set up your brand identity on Philomni. Briefs are posted under your company, not your personal profile.' },
                { n:'2', t:'Post a brief', d:'Set title, budget range, content types (Reel, Video, Blog…), target niches, minimum follower count, deadline, and campaign description.' },
                { n:'3', t:'Review interest & applications', d:'Creators express interest (one tap, no form — their profile is shared instantly) or submit a full pitch with rate and portfolio links.' },
                { n:'4', t:'Shortlist & approve', d:'Move applicants through Pending → Shortlisted → Approved. Rejected creators are notified.' },
                { n:'5', t:'Send a deal offer', d:'After approving, send a formal offer: agreed amount, payment terms, and any notes. The creator then accepts or declines.' },
                { n:'6', t:'Review deliverables', d:'Creator submits their content links. You review and either approve (releasing payment) or request a revision with notes.' },
                { n:'7', t:'Mark complete & rate', d:'Once satisfied, mark the deal complete. Both parties leave a rating and review. It appears on your company profile.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-400">{s.n}</div>
                  <div><p className="text-sm font-medium text-white">{s.t}</p><p className="text-xs text-zinc-500 mt-0.5">{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-800/60" />
          <div>
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">Creators</p>
            <div className="space-y-3">
              {[
                { n:'1', t:'Browse & express interest', d:'Tap the heart on any brief. Your Philomni profile (followers, niche, headline) is instantly shared with the brand. No pitch needed.' },
                { n:'2', t:'Apply', d:'Write a pitch, add your rate, and attach portfolio links. Your full Philomni profile is auto-attached.' },
                { n:'3', t:'Get shortlisted or approved', d:'Track your status in My Activity. If approved, the brand will send you a deal offer.' },
                { n:'4', t:'Accept or decline the offer', d:'Review the agreed amount and terms. Accept to lock in the deal and start working.' },
                { n:'5', t:'Submit your deliverables', d:'Add the links to your completed content (YouTube video, Instagram reel, blog post, etc.). Include a note to the brand.' },
                { n:'6', t:'Get paid & rated', d:'Once the brand approves your work, they mark the deal complete. You earn a rating on your creator profile.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center shrink-0 text-xs font-bold text-purple-400">{s.n}</div>
                  <div><p className="text-sm font-medium text-white">{s.t}</p><p className="text-xs text-zinc-500 mt-0.5">{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-400 space-y-1.5">
            <p><span className="text-green-400 font-medium">How payments work:</span> All payments are processed through Philomni — the brand never pays the creator directly. Once both parties agree on a deal, the brand funds payment via <span className="text-white">Stripe, Paystack, or Flutterwave</span>. Philomni holds the funds and releases them to the creator once the brand approves their deliverables.</p>
            <p><span className="text-blue-400 font-medium">Platform fee:</span> Philomni takes a 5% fee on every payout. Creators receive 95% of the agreed amount.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── No company banner ─────────────────────────────────────────────────────────
function NoCompanyBanner() {
  const navigate = useNavigate()
  return (
    <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-1">You need a company profile to post briefs</p>
          <p className="text-xs text-zinc-400 mb-3">Brands post briefs under their company identity. Set up your company page first, then come back to post.</p>
          <button onClick={() => navigate('/company/create')}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create company profile
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Brief modal ──────────────────────────────────────────────────────────
function PostBriefModal({ companyId, onClose, onPosted }) {
  const [form, setForm] = useState({ title:'', description:'', budget_min:'', budget_max:'', currency:'USD', deadline:'', target_audience:'', content_types:[], niches:[], min_followers:'', external_ref:'' })
  const [saving, setSaving] = useState(false)

  function toggleArr(key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim())                   { toast.error('Title required'); return }
    if (!form.budget_min || !form.budget_max) { toast.error('Budget range required'); return }
    if (!form.deadline)                       { toast.error('Deadline required'); return }
    setSaving(true)
    const { error } = await supabase.from('brand_briefs').insert({
      title: form.title.trim(), description: form.description.trim(),
      budget_min: Number(form.budget_min), budget_max: Number(form.budget_max),
      currency: form.currency, deadline: new Date(form.deadline).toISOString(),
      target_audience: form.target_audience || null,
      content_types: form.content_types, niches: form.niches,
      min_followers: form.min_followers ? Number(form.min_followers) : 0,
      external_ref: form.external_ref || null,
      company_id: companyId, status: 'open',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Brief posted! Creators can now discover and apply.')
    onPosted?.(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-white text-lg">Post a Brief</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Creators will discover this and can express interest or apply</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Campaign Title</label>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. 30-sec product reel for our Q3 launch"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description <span className="text-zinc-600">— what creators need to know</span></label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={7}
              placeholder="Campaign goals, deliverables, tone of voice, usage rights, revision policy…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600 resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget Min (USD)</label>
              <input type="number" min={0} value={form.budget_min} onChange={e => setForm(f=>({...f,budget_min:e.target.value}))} placeholder="500"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget Max (USD)</label>
              <input type="number" min={0} value={form.budget_max} onChange={e => setForm(f=>({...f,budget_max:e.target.value}))} placeholder="2000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Application Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min Followers Required</label>
              <input type="number" min={0} value={form.min_followers} onChange={e => setForm(f=>({...f,min_followers:e.target.value}))} placeholder="0 = any creator"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          </div>
          <TagInput
            label="Content Types Needed"
            values={form.content_types}
            onChange={v => setForm(f => ({...f, content_types: v}))}
            suggestions={CONTENT_TYPE_SUGGESTIONS}
            color="blue"
            placeholder="e.g. Reel, YouTube, TikTok… type anything"
          />
          <TagInput
            label="Creator Niches"
            sublabel="— used to match creators"
            values={form.niches}
            onChange={v => setForm(f => ({...f, niches: v}))}
            suggestions={NICHE_SUGGESTIONS}
            color="purple"
            placeholder="e.g. Skincare, Crypto, Afrobeats… type anything"
          />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Audience</label>
            <input value={form.target_audience} onChange={e => setForm(f=>({...f,target_audience:e.target.value}))} placeholder="e.g. Women 18–34 in Nigeria and Ghana"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Internal Reference <span className="text-zinc-600">— optional</span></label>
            <input value={form.external_ref} onChange={e => setForm(f=>({...f,external_ref:e.target.value}))} placeholder="e.g. CAMPAIGN-Q3-2026"
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

// ─── Apply modal ───────────────────────────────────────────────────────────────
function ApplyModal({ brief, onClose, onApplied }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [pitch, setPitch]     = useState('')
  const [quote, setQuote]     = useState('')
  const [portUrl, setPortUrl] = useState('')
  const [portUrls, setPortUrls] = useState([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (user) supabase.from('users').select('full_name,avatar_url,follower_count,headline,username').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  function addUrl() { const u = portUrl.trim(); if (!u) return; setPortUrls(p => [...p, u]); setPortUrl('') }

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
    toast.success('Application submitted! Track it in My Activity.')
    onApplied?.(); onClose()
  }

  const meetsF = brief.min_followers && profile?.follower_count >= brief.min_followers
  const belowF = brief.min_followers && profile?.follower_count < brief.min_followers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-800">
          <h2 className="font-bold text-white">Apply to Brief</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="mx-5 mt-4 bg-zinc-900 rounded-xl p-3">
          <p className="text-sm font-medium text-white">{brief.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-zinc-500">{brief.company?.name}</span>
            <span className="text-xs text-green-400 font-medium">${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()}</span>
            {brief.deadline && <span className="text-xs text-zinc-500">Due {new Date(brief.deadline).toLocaleDateString()}</span>}
          </div>
        </div>
        {belowF && (
          <div className="mx-5 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">Requires {(brief.min_followers/1000).toFixed(0)}k+ followers. You have {((profile?.follower_count??0)/1000).toFixed(1)}k. You can still apply.</p>
          </div>
        )}
        <div className="mx-5 mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-300 mb-1.5">Auto-attached to this application:</p>
          {profile ? (
            <div className="flex items-center gap-2.5">
              <img src={profile.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name??'C')}&background=7c3aed&color=fff&size=32`} className="w-8 h-8 rounded-full object-cover" alt="" />
              <div>
                <p className="text-xs text-white font-medium">{profile.full_name} <span className="text-zinc-500">@{profile.username}</span></p>
                <p className="text-xs text-zinc-400">{(profile.follower_count??0).toLocaleString()} followers {meetsF?'✓':''} · {profile.headline??'no headline set'}</p>
              </div>
            </div>
          ) : <p className="text-xs text-blue-400/70">Your follower count, niche, and headline are auto-included.</p>}
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Pitch <span className="text-red-400">*</span></label>
            <textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={5}
              placeholder="Why are you the right creator? What's your angle, approach, and why does your audience fit this brand?"
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
                onKeyDown={e => e.key==='Enter'&&(e.preventDefault(),addUrl())} placeholder="Past work, YouTube, Instagram reel…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
              <button type="button" onClick={addUrl} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700"><Plus className="w-4 h-4" /></button>
            </div>
            {portUrls.map((u,i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 mb-1 bg-zinc-900 rounded-lg px-3 py-2">
                <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate flex-1">{u}</span>
                <button type="button" onClick={() => setPortUrls(us=>us.filter((_,j)=>j!==i))} className="text-zinc-600 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm">
            {saving ? 'Submitting…' : 'Submit Application'}
          </button>
          <p className="text-xs text-center text-zinc-600">Track your application status in My Activity below</p>
        </form>
      </div>
    </div>
  )
}

// ─── Send Offer modal (brand → creator) ───────────────────────────────────────
function SendOfferModal({ app, brief, onClose, onSent }) {
  const [dealType,       setDealType]       = useState('one_time')
  const [amount,         setAmount]         = useState(app.quote ?? '')
  const [monthlyAmount,  setMonthlyAmount]  = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [startDate,      setStartDate]      = useState('')
  const [message,        setMessage]        = useState('')
  // Milestone rows: { title, amount, due_date }
  const [milestones,     setMilestones]     = useState([
    { title: 'Milestone 1', amount: '', due_date: '' },
    { title: 'Milestone 2', amount: '', due_date: '' },
  ])
  const [saving, setSaving] = useState(false)

  function updateMs(i, key, val) {
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [key]: val } : m))
  }
  function addMs()    { setMilestones(ms => [...ms, { title: `Milestone ${ms.length + 1}`, amount: '', due_date: '' }]) }
  function removeMs(i){ setMilestones(ms => ms.filter((_, idx) => idx !== i)) }

  const totalMilestoneAmount = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const totalRetainerAmount  = (Number(monthlyAmount) || 0) * (Number(durationMonths) || 0)

  async function submit(e) {
    e.preventDefault()

    if (dealType === 'one_time' && !amount) { toast.error('Agreed amount required'); return }
    if (dealType === 'milestone' && milestones.some(m => !m.title || !m.amount)) { toast.error('All milestones need a title and amount'); return }
    if (dealType === 'retainer' && (!monthlyAmount || !durationMonths)) { toast.error('Monthly amount and duration required'); return }

    setSaving(true)

    const dealPayload = {
      application_id:  app.id,
      brief_id:        brief.id,
      creator_id:      app.creator_id ?? app.creator?.id,
      company_id:      brief.company_id,
      deal_type:       dealType,
      offer_message:   message.trim() || null,
      status:          'offer_sent',
      start_date:      startDate || null,
      ...(dealType === 'one_time'  ? { agreed_amount: Number(amount) } : {}),
      ...(dealType === 'milestone' ? { agreed_amount: totalMilestoneAmount } : {}),
      ...(dealType === 'retainer'  ? { monthly_amount: Number(monthlyAmount), duration_months: Number(durationMonths), agreed_amount: totalRetainerAmount } : {}),
      ...(dealType === 'retainer' && durationMonths && startDate ? {
        end_date: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + Number(durationMonths))).toISOString().split('T')[0]
      } : {}),
    }

    const { data: deal, error } = await supabase.from('brief_deals').insert(dealPayload).select('id').single()
    if (error) { toast.error(error.message); setSaving(false); return }

    // Insert milestones for milestone + retainer deal types
    if (dealType === 'milestone') {
      const rows = milestones.map((m, i) => ({
        deal_id: deal.id, title: m.title, amount: Number(m.amount),
        due_date: m.due_date || null, sort_order: i, status: 'pending',
      }))
      await supabase.from('deal_milestones').insert(rows)
    }

    if (dealType === 'retainer') {
      // Create one milestone per period
      const rows = Array.from({ length: Number(durationMonths) }, (_, i) => {
        const start = startDate ? new Date(startDate) : new Date()
        const due = new Date(start)
        due.setMonth(due.getMonth() + i + 1)
        return {
          deal_id: deal.id,
          title: `Month ${i + 1}`,
          amount: Number(monthlyAmount),
          due_date: due.toISOString().split('T')[0],
          sort_order: i, status: 'pending',
        }
      })
      await supabase.from('deal_milestones').insert(rows)
    }

    await supabase.from('brief_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', app.id)
    toast.success('Offer sent!')
    onSent?.(); onClose()
    setSaving(false)
  }

  const DEAL_TYPES = [
    { id: 'one_time',  label: 'One-time',  desc: 'Single deliverable, single payment' },
    { id: 'milestone', label: 'Milestones',desc: 'Multiple phases, paid per milestone' },
    { id: 'retainer',  label: 'Retainer',  desc: 'Recurring monthly over a fixed period' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white">Send Deal Offer</h3>
            <p className="text-xs text-zinc-500 mt-0.5">to {app.creator?.full_name} · {brief.title}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-5">
          {app.quote && (
            <div className="bg-zinc-900 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Creator's quoted rate</span>
              <span className="text-sm font-semibold text-green-400">${Number(app.quote).toLocaleString()}</span>
            </div>
          )}

          {/* Deal type selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Deal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {DEAL_TYPES.map(dt => (
                <button key={dt.id} type="button" onClick={() => setDealType(dt.id)}
                  className={`p-3 rounded-xl text-left border transition-colors ${dealType === dt.id ? 'border-blue-600 bg-blue-600/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                  <p className={`text-xs font-semibold ${dealType === dt.id ? 'text-blue-400' : 'text-white'}`}>{dt.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{dt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* One-time amount */}
          {dealType === 'one_time' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Agreed Amount (USD) <span className="text-red-400">*</span></label>
              <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`e.g. ${brief.budget_max?.toLocaleString()}`}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          )}

          {/* Milestone rows */}
          {dealType === 'milestone' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Milestones</label>
                <span className="text-xs text-zinc-500">Total: <span className="text-green-400 font-semibold">${totalMilestoneAmount.toLocaleString()}</span></span>
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-5 shrink-0">{i + 1}.</span>
                      <input value={m.title} onChange={e => updateMs(i, 'title', e.target.value)} placeholder="Milestone title"
                        className="flex-1 bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" />
                      {milestones.length > 1 && (
                        <button type="button" onClick={() => removeMs(i)} className="text-zinc-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-7">
                      <input type="number" min={0} value={m.amount} onChange={e => updateMs(i, 'amount', e.target.value)} placeholder="Amount (USD)"
                        className="bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" />
                      <input type="date" value={m.due_date} onChange={e => updateMs(i, 'due_date', e.target.value)}
                        className="bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMs} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add milestone
              </button>
            </div>
          )}

          {/* Retainer config */}
          {dealType === 'retainer' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Monthly Amount (USD) <span className="text-red-400">*</span></label>
                  <input type="number" min={0} value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} placeholder="e.g. 2000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (months) <span className="text-red-400">*</span></label>
                  <input type="number" min={1} max={36} value={durationMonths} onChange={e => setDurationMonths(e.target.value)} placeholder="12"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
                </div>
              </div>
              {monthlyAmount && durationMonths && (
                <div className="bg-zinc-900 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{durationMonths} months × ${Number(monthlyAmount).toLocaleString()}/mo</span>
                  <span className="text-sm font-bold text-green-400">${totalRetainerAmount.toLocaleString()} total</span>
                </div>
              )}
            </div>
          )}

          {/* Start date (retainer + milestone) */}
          {(dealType === 'milestone' || dealType === 'retainer') && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Start Date <span className="text-zinc-500 font-normal">— optional</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Message to Creator <span className="text-zinc-500 font-normal">— optional</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Payment schedule, revision policy, content requirements, anything they need to know…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600 resize-none" />
          </div>

          <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl p-3 text-xs text-zinc-400">
            <span className="text-blue-400 font-medium">Escrow:</span> After the creator accepts, you'll be prompted to secure funds via Stripe. Philomni holds payment and releases it to the creator when you approve their deliverables. Philomni takes a 5% platform fee.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Sending…' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Submit Deliverables modal (creator) ──────────────────────────────────────
function SubmitDeliverablesModal({ deal, onClose, onSubmitted }) {
  const { user } = useAuth()
  const [title,   setTitle]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [url,     setUrl]     = useState('')
  const [urls,    setUrls]    = useState([])
  const [saving,  setSaving]  = useState(false)

  function addUrl() { const u = url.trim(); if (!u) return; setUrls(p => [...p, u]); setUrl('') }

  async function submit(e) {
    e.preventDefault()
    if (urls.length === 0) { toast.error('Add at least one content link'); return }
    setSaving(true)
    const { error: dErr } = await supabase.from('brief_deliverables').insert({
      deal_id: deal.id, brief_id: deal.brief_id, creator_id: user.id,
      title: title.trim() || 'Deliverable', description: desc.trim() || null, content_urls: urls,
    })
    if (!dErr) {
      await supabase.from('brief_deals').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', deal.id)
      toast.success('Deliverables submitted! The brand will review.')
      onSubmitted?.(); onClose()
    } else toast.error(dErr.message)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white">Submit Deliverables</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{deal.brief?.title}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title <span className="text-zinc-500 font-normal">— optional</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Instagram Reel — Final Version"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Note to Brand <span className="text-zinc-500 font-normal">— optional</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Context, what you created, anything they should know…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Content Links <span className="text-red-400">*</span></label>
            <p className="text-xs text-zinc-500 mb-2">Add links to your published or draft content — YouTube, Instagram, TikTok, Google Drive, Notion, etc.</p>
            <div className="flex gap-2 mb-2">
              <input value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key==='Enter'&&(e.preventDefault(),addUrl())} placeholder="https://…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600" />
              <button type="button" onClick={addUrl} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700"><Plus className="w-4 h-4" /></button>
            </div>
            {urls.map((u,i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 mb-1 bg-zinc-900 rounded-lg px-3 py-2">
                <Link2 className="w-3 h-3 text-purple-400 shrink-0" />
                <a href={u} target="_blank" rel="noreferrer" className="truncate flex-1 hover:text-white">{u}</a>
                <button type="button" onClick={() => setUrls(us=>us.filter((_,j)=>j!==i))} className="text-zinc-600 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit Deliverables'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Rate modal (mutual, after completion) ────────────────────────────────────
function RateModal({ deal, role, rateeId, rateeName, onClose, onRated }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!rating) { toast.error('Select a rating'); return }
    setSaving(true)
    const { error } = await supabase.from('brief_ratings').insert({
      deal_id: deal.id, rater_id: user.id, ratee_id: rateeId,
      role, rating, review_text: review.trim() || null,
    })
    if (!error) { toast.success('Review submitted!'); onRated?.(); onClose() }
    else toast.error(error.message)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white">Rate & Review</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{rateeName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <p className="text-sm text-zinc-300 mb-3">How was working with {rateeName}?</p>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`text-2xl transition-transform ${rating >= n ? 'scale-110' : 'opacity-30'}`}>⭐</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Review <span className="text-zinc-500 font-normal">— optional</span></label>
            <textarea value={review} onChange={e => setReview(e.target.value)} rows={3}
              placeholder="What was great? Anything to note for future collaborations?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-yellow-500 resize-none" />
          </div>
          <button type="submit" disabled={saving || !rating} className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black rounded-xl text-sm font-bold">
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Deal Chat ────────────────────────────────────────────────────────────────
function fileIcon(type) {
  if (!type) return <File className="w-4 h-4" />
  if (type.startsWith('image/'))  return <Image className="w-4 h-4 text-blue-400" />
  if (type.startsWith('video/'))  return <Video className="w-4 h-4 text-purple-400" />
  if (type.startsWith('audio/'))  return <Mic className="w-4 h-4 text-pink-400" />
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-400" />
  return <File className="w-4 h-4 text-zinc-400" />
}

function fmt(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function DealChat({ deal, isBrand, otherPartyName }) {
  const { user } = useAuth()
  const [messages,   setMessages]   = useState([])
  const [text,       setText]       = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [sending,    setSending]    = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])   // [{file, preview, uploading}]
  const bottomRef  = useRef(null)
  const fileRef    = useRef(null)
  const channelRef = useRef(null)

  // Load + subscribe
  useEffect(() => {
    loadMessages()
    const ch = supabase
      .channel(`deal-chat-${deal.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'deal_messages',
        filter: `deal_id=eq.${deal.id}`,
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [deal.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages.length])

  async function loadMessages() {
    const { data } = await supabase
      .from('deal_messages')
      .select('*, sender:sender_id(id, full_name, avatar_url)')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function pickFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const previews = files.map(f => ({
      file: f,
      name: f.name,
      type: f.type,
      size: f.size,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setPendingFiles(prev => [...prev, ...previews])
    e.target.value = ''
  }

  function removePending(i) {
    setPendingFiles(prev => {
      const next = [...prev]; next.splice(i, 1); return next
    })
  }

  async function uploadAll() {
    const uploaded = []
    for (const pf of pendingFiles) {
      const path = `${deal.id}/${Date.now()}-${pf.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { error } = await supabase.storage.from('deal-attachments').upload(path, pf.file)
      if (error) { toast.error(`Upload failed: ${pf.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('deal-attachments').getPublicUrl(path)
      uploaded.push({ url: publicUrl, name: pf.name, type: pf.type, size: pf.size })
    }
    return uploaded
  }

  async function send(e) {
    e?.preventDefault()
    if (!text.trim() && pendingFiles.length === 0) return
    setSending(true)
    setUploading(pendingFiles.length > 0)
    const attachments = pendingFiles.length > 0 ? await uploadAll() : []
    setUploading(false)
    const { error } = await supabase.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: user.id,
      content: text.trim() || null,
      attachments,
    })
    if (error) { toast.error(error.message); setSending(false); return }
    setText('')
    setPendingFiles([])
    setSending(false)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const senderName = isBrand ? (deal.brief?.company?.name ?? 'Brand') : 'You'

  return (
    <div className="flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-xs font-semibold text-white">Deal Chat</span>
        <span className="text-xs text-zinc-500 ml-auto">with {otherPartyName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 min-h-[120px]">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-6">No messages yet — start the conversation</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          const atts  = msg.attachments ?? []
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <img
                src={msg.sender?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.full_name ?? 'U')}&background=7c3aed&color=fff&size=28`}
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                alt=""
              />
              <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {msg.content && (
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                    ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                )}
                {atts.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs max-w-full
                      ${isMe ? 'bg-blue-700/40 border-blue-600/40 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}
                      hover:opacity-80 transition-opacity`}>
                    {a.type?.startsWith('image/') && a.url ? (
                      <img src={a.url} alt={a.name} className="w-32 h-20 object-cover rounded-lg" />
                    ) : (
                      <>
                        {fileIcon(a.type)}
                        <div className="min-w-0">
                          <p className="truncate font-medium max-w-[180px]">{a.name}</p>
                          {a.size && <p className="text-zinc-500 text-[10px]">{fmt(a.size)}</p>}
                        </div>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-auto opacity-60" />
                      </>
                    )}
                  </a>
                ))}
                <span className="text-[10px] text-zinc-600 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 py-2 border-t border-zinc-800 bg-zinc-900/40">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative group">
              {pf.preview
                ? <img src={pf.preview} alt={pf.name} className="w-14 h-14 object-cover rounded-lg border border-zinc-700" />
                : (
                  <div className="w-14 h-14 rounded-lg border border-zinc-700 bg-zinc-800 flex flex-col items-center justify-center gap-1 p-1">
                    {fileIcon(pf.type)}
                    <span className="text-[9px] text-zinc-500 text-center truncate w-full leading-tight">{pf.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                )
              }
              <button onClick={() => removePending(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex items-end gap-2 px-3 py-3 border-t border-zinc-800 bg-zinc-900/40">
        <input type="file" ref={fileRef} onChange={pickFiles} multiple className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.txt" />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="shrink-0 w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="Attach files">
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600 resize-none max-h-32 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
        />
        <button type="submit" disabled={sending || (!text.trim() && pendingFiles.length === 0)}
          className="shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center transition-colors">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </form>
    </div>
  )
}

// ─── Deal detail panel (inline, used in both brand and creator views) ──────────
// ─── Milestone row (inside DealPanel) ─────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'stripe',      label: 'Stripe',      desc: 'Card / bank via Stripe Connect' },
  { id: 'paystack',    label: 'Paystack',    desc: 'Card, bank, USSD (NGN, GHS, KES…)' },
  { id: 'flutterwave', label: 'Flutterwave', desc: 'Card, mobile money, bank transfer' },
]

function ConfirmPaymentModal({ amount, onConfirm, onClose }) {
  const [method, setMethod] = useState('')
  const [ref,    setRef]    = useState('')
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white">Release Payment</h3>
            <p className="text-xs text-zinc-500 mt-0.5">${Number(amount).toLocaleString()} to creator</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Pay via <span className="text-red-400">*</span></label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${method === m.id ? 'border-blue-600 bg-blue-600/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                  <span className={`text-sm font-semibold ${method === m.id ? 'text-blue-400' : 'text-white'}`}>{m.label}</span>
                  <span className="text-xs text-zinc-500">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Transaction / Reference ID <span className="text-zinc-500 font-normal">— optional</span></label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. TRX-2026-00123"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
          </div>
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl p-3 text-xs text-zinc-400">
            Philomni will process this payment through the selected provider and release funds to the creator. The deal is marked <span className="text-green-400 font-medium">Paid</span> once confirmed.
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium">Cancel</button>
            <button disabled={!method} onClick={() => onConfirm(method, ref)}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
              Release Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MilestoneRow({ ms, isBrand, dealId, onUpdate }) {
  const { user } = useAuth()
  const [showDelModal,     setShowDelModal]     = useState(false)
  const [showPayConfirm,   setShowPayConfirm]   = useState(false)
  const [revNote,          setRevNote]          = useState('')
  const [acting,           setActing]           = useState(false)
  const [deliverables,     setDeliverables]     = useState([])

  useEffect(() => {
    supabase.from('brief_deliverables').select('*').eq('deal_id', dealId).eq('milestone_id', ms.id)
      .then(({ data }) => setDeliverables(data ?? []))
  }, [ms.id])

  const MS_STATUS = {
    pending:            { label: 'Pending',           color: 'text-zinc-400',   bg: 'bg-zinc-800' },
    in_progress:        { label: 'In Progress',        color: 'text-blue-400',   bg: 'bg-blue-500/20' },
    delivered:          { label: 'Delivered',          color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
    revision_requested: { label: 'Revision Requested', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    approved:           { label: 'Approved',           color: 'text-green-400',  bg: 'bg-green-500/20' },
    paid:               { label: 'Paid',               color: 'text-green-400',  bg: 'bg-green-500/20' },
    cancelled:          { label: 'Cancelled',          color: 'text-zinc-500',   bg: 'bg-zinc-800' },
  }
  const st = MS_STATUS[ms.status] ?? MS_STATUS.pending

  async function updateMs(updates) {
    setActing(true)
    await supabase.from('deal_milestones').update(updates).eq('id', ms.id)
    setActing(false); onUpdate?.()
  }

  async function releasePayment(paymentMethod, paymentRef) {
    setShowPayConfirm(false)
    setActing(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brief-deal-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action: 'release_to_creator', deal_id: dealId, milestone_id: ms.id, payment_method: paymentMethod, payment_ref: paymentRef }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Payment failed')
    else if (data.payment_method === 'manual') toast.success(`$${data.amount_paid?.toLocaleString()} marked as paid via ${paymentMethod}`)
    else toast.success(`$${data.amount_paid?.toLocaleString()} sent to creator via Stripe!`)
    setActing(false); onUpdate?.()
  }

  return (
    <div className="border border-zinc-800/60 rounded-xl p-3 space-y-2">
      {showPayConfirm && (
        <ConfirmPaymentModal amount={ms.amount} onClose={() => setShowPayConfirm(false)} onConfirm={releasePayment} />
      )}
      {showDelModal && (
        <SubmitDeliverablesModal
          deal={{ id: dealId, brief: {} }}
          milestoneId={ms.id}
          onClose={() => setShowDelModal(false)}
          onSubmitted={() => {
            updateMs({ status: 'delivered', delivered_at: new Date().toISOString() })
            supabase.from('brief_deliverables').select('*').eq('deal_id', dealId).eq('milestone_id', ms.id).then(({ data }) => setDeliverables(data ?? []))
          }} />
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-white">{ms.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-green-400 font-medium">${Number(ms.amount).toLocaleString()}</span>
            {ms.due_date && <span className="text-xs text-zinc-600">Due {new Date(ms.due_date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</span>}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
      </div>

      {/* Creator: deliver this milestone */}
      {!isBrand && ['in_progress','revision_requested'].includes(ms.status) && (
        <button onClick={() => setShowDelModal(true)} className="w-full py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
          <Upload className="w-3 h-3" /> {ms.status === 'revision_requested' ? 'Resubmit' : 'Submit Deliverable'}
        </button>
      )}
      {ms.status === 'revision_requested' && ms.revision_note && (
        <p className="text-xs text-orange-300 bg-orange-500/10 rounded-lg px-2 py-1.5">{ms.revision_note}</p>
      )}

      {/* Deliverables for this milestone */}
      {deliverables.map(d => (
        <div key={d.id} className="bg-zinc-900/60 rounded-lg p-2 space-y-1">
          {(d.content_urls ?? []).map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
              <Link2 className="w-3 h-3 shrink-0" /><span className="truncate">{u}</span>
            </a>
          ))}
          {d.description && <p className="text-xs text-zinc-500">{d.description}</p>}
        </div>
      ))}

      {/* Brand: approve or request revision */}
      {isBrand && ms.status === 'delivered' && (
        <div className="space-y-1.5 pt-1">
          <div className="flex gap-1.5">
            <button disabled={acting} onClick={() => updateMs({ status: 'approved', approved_at: new Date().toISOString() })}
              className="flex-1 py-1.5 bg-green-600/80 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg text-xs font-semibold">Approve</button>
            <div className="flex-1 flex gap-1">
              <input value={revNote} onChange={e => setRevNote(e.target.value)} placeholder="Revision note…"
                className="flex-1 bg-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none min-w-0" />
              <button disabled={acting || !revNote.trim()} onClick={() => updateMs({ status: 'revision_requested', revision_note: revNote.trim() })}
                className="shrink-0 px-2 py-1.5 bg-orange-600/30 hover:bg-orange-600/50 disabled:opacity-50 text-orange-400 rounded-lg text-xs">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand: release payment after approval */}
      {isBrand && ms.status === 'approved' && (
        <button disabled={acting} onClick={() => setShowPayConfirm(true)}
          className="w-full py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
          <DollarSign className="w-3 h-3" /> Release Payment ${Number(ms.amount).toLocaleString()}
        </button>
      )}
      {ms.status === 'paid' && (
        <p className="text-xs text-green-400 text-center py-1">✓ Paid {ms.paid_at ? new Date(ms.paid_at).toLocaleDateString() : ''}</p>
      )}
    </div>
  )
}

function DealPanel({ deal, isBrand, onUpdate }) {
  const { user } = useAuth()
  const [deliverables,   setDeliverables]   = useState([])
  const [milestones,     setMilestones]     = useState([])
  const [ratings,        setRatings]        = useState([])
  const [revNote,        setRevNote]        = useState('')
  const [acting,         setActing]         = useState(false)
  const [showDelModal,   setShowDelModal]   = useState(false)
  const [showRateModal,  setShowRateModal]  = useState(false)
  const [showPayConfirm, setShowPayConfirm] = useState(false)

  const isMultiPhase = deal.deal_type === 'milestone' || deal.deal_type === 'retainer'

  useEffect(() => {
    if (!isMultiPhase) loadDeliverables()
    else loadMilestones()
    loadRatings()
  }, [deal.id])

  async function loadDeliverables() {
    const { data } = await supabase.from('brief_deliverables').select('*').eq('deal_id', deal.id).is('milestone_id', null).order('created_at', { ascending: false })
    setDeliverables(data ?? [])
  }
  async function loadMilestones() {
    const { data } = await supabase.from('deal_milestones').select('*').eq('deal_id', deal.id).order('sort_order')
    setMilestones(data ?? [])
  }
  async function loadRatings() {
    const { data } = await supabase.from('brief_ratings').select('*').eq('deal_id', deal.id)
    setRatings(data ?? [])
  }

  async function updateDeal(updates) {
    setActing(true)
    await supabase.from('brief_deals').update(updates).eq('id', deal.id)
    setActing(false); onUpdate?.()
  }

  async function releaseFullPayment(paymentMethod, paymentRef) {
    setShowPayConfirm(false)
    setActing(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brief-deal-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action: 'release_to_creator', deal_id: deal.id, payment_method: paymentMethod, payment_ref: paymentRef }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Payment failed')
    else if (data.payment_method === 'manual') toast.success(`$${data.amount_paid?.toLocaleString()} marked as paid via ${paymentMethod}`)
    else toast.success(`$${data.amount_paid?.toLocaleString()} sent to creator via Stripe!`)
    setActing(false); onUpdate?.()
  }

  const myRating = ratings.find(r => r.rater_id === user?.id)
  const s = deal.status

  const paidMs    = milestones.filter(m => m.status === 'paid').length
  const totalMs   = milestones.length
  const msAllDone = totalMs > 0 && milestones.every(m => m.status === 'paid')

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-4">
      {showDelModal  && <SubmitDeliverablesModal deal={deal} onClose={() => setShowDelModal(false)} onSubmitted={() => { loadDeliverables(); onUpdate?.() }} />}
      {showPayConfirm && <ConfirmPaymentModal amount={deal.agreed_amount} onClose={() => setShowPayConfirm(false)} onConfirm={releaseFullPayment} />}
      {showRateModal && (
        <RateModal deal={deal}
          role={isBrand ? 'brand' : 'creator'}
          rateeId={isBrand ? deal.creator_id : deal.company?.owner_id}
          rateeName={isBrand ? deal.creator?.full_name : deal.brief?.company?.name}
          onClose={() => setShowRateModal(false)}
          onRated={() => { loadRatings(); onUpdate?.() }} />
      )}

      {/* Summary header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs text-zinc-500">
              {deal.deal_type === 'one_time'  ? 'One-time deal' :
               deal.deal_type === 'milestone' ? `Milestone deal · ${paidMs}/${totalMs} paid` :
               deal.deal_type === 'retainer'  ? `Retainer · ${paidMs}/${totalMs} months paid` : 'Deal'}
            </p>
          </div>
          <p className="text-xl font-bold text-green-400">${Number(deal.agreed_amount).toLocaleString()}
            {deal.deal_type === 'retainer' && deal.monthly_amount && (
              <span className="text-sm font-normal text-zinc-400 ml-1">(${Number(deal.monthly_amount).toLocaleString()}/mo)</span>
            )}
          </p>
          {deal.start_date && <p className="text-xs text-zinc-500 mt-0.5">
            {deal.start_date} {deal.end_date ? `→ ${deal.end_date}` : ''}
          </p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <DealBadge status={deal.status} />
          {deal.payment_status && deal.payment_status !== 'unpaid' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              deal.payment_status === 'held'    ? 'bg-yellow-500/20 text-yellow-400' :
              deal.payment_status === 'paid'    ? 'bg-green-500/20 text-green-400' :
              deal.payment_status === 'refunded'? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
            }`}>
              Escrow: {deal.payment_status}
            </span>
          )}
        </div>
      </div>

      {/* For one-time deals: show timeline */}
      {!isMultiPhase && <DealTimeline status={deal.status} />}

      {deal.offer_message && (
        <div className="bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-300">
          <p className="text-zinc-500 font-medium mb-1">Message from brand:</p>
          {deal.offer_message}
        </div>
      )}

      {/* Creator: accept / decline */}
      {!isBrand && s === 'offer_sent' && (
        <div className="flex gap-2">
          <button disabled={acting} onClick={() => updateDeal({ status: 'accepted', accepted_at: new Date().toISOString() })}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Accept Offer
          </button>
          <button disabled={acting} onClick={() => updateDeal({ status: 'declined' })}
            className="flex-1 py-2 bg-red-600/30 hover:bg-red-600/50 disabled:opacity-60 text-red-400 rounded-xl text-xs font-medium">
            Decline
          </button>
        </div>
      )}

      {/* Brand: mark in_progress */}
      {isBrand && s === 'accepted' && (
        <button disabled={acting} onClick={() => updateDeal({ status: 'in_progress' })}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold">
          Mark as In Progress
        </button>
      )}

      {/* ── MILESTONE / RETAINER PHASE LIST ── */}
      {isMultiPhase && milestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">
            {deal.deal_type === 'retainer' ? 'Monthly periods' : 'Milestones'}
          </p>
          {milestones.map(ms => (
            <MilestoneRow key={ms.id} ms={ms} isBrand={isBrand} dealId={deal.id} onUpdate={() => { loadMilestones(); onUpdate?.() }} />
          ))}
          {isBrand && msAllDone && s !== 'completed' && (
            <button disabled={acting} onClick={() => updateDeal({ status: 'completed', completed_at: new Date().toISOString() })}
              className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 mt-2">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Deal Complete
            </button>
          )}
        </div>
      )}

      {/* ── ONE-TIME: deliverable submit / review flow ── */}
      {!isMultiPhase && (
        <>
          {!isBrand && (s === 'accepted' || s === 'in_progress' || s === 'revision_requested') && (
            <button onClick={() => setShowDelModal(true)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {s === 'revision_requested' ? 'Resubmit Deliverables' : 'Submit Deliverables'}
            </button>
          )}
          {s === 'revision_requested' && deal.revision_note && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-xs text-orange-300">
              <p className="font-medium mb-1">Revision requested:</p>{deal.revision_note}
            </div>
          )}
          {deliverables.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-2">Submitted deliverables</p>
              {deliverables.map(d => (
                <div key={d.id} className="bg-zinc-900 rounded-xl p-3 mb-2">
                  {d.title && <p className="text-xs font-medium text-white mb-1">{d.title}</p>}
                  {d.description && <p className="text-xs text-zinc-500 mb-2">{d.description}</p>}
                  {(d.content_urls ?? []).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline mb-1">
                      <Link2 className="w-3 h-3 shrink-0" /><span className="truncate">{u}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
          {isBrand && s === 'delivered' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-300">Review deliverables:</p>
              <button disabled={acting} onClick={() => updateDeal({ status: 'completed', completed_at: new Date().toISOString() })}
                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> Approve & Complete Deal
              </button>
              <div className="flex gap-2 items-start">
                <textarea value={revNote} onChange={e => setRevNote(e.target.value)} rows={2} placeholder="Describe what needs to be revised…"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 resize-none" />
                <button disabled={acting || !revNote.trim()} onClick={() => updateDeal({ status: 'revision_requested', revision_note: revNote.trim() })}
                  className="shrink-0 py-2 px-3 bg-orange-600/30 hover:bg-orange-600/50 disabled:opacity-50 text-orange-400 rounded-xl text-xs font-semibold flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Revision
                </button>
              </div>
            </div>
          )}
          {/* Release full payment button (one-time, after approval) */}
          {isBrand && s === 'completed' && deal.payment_status !== 'paid' && (
            <button disabled={acting} onClick={() => setShowPayConfirm(true)}
              className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Release Payment ${Number(deal.agreed_amount).toLocaleString()}
            </button>
          )}
        </>
      )}

      {/* Deal Chat */}
      {(s !== 'offer_sent' && s !== 'declined') && (
        <DealChat
          deal={deal}
          isBrand={isBrand}
          otherPartyName={isBrand ? (deal.creator?.full_name ?? 'Creator') : (deal.brief?.company?.name ?? 'Brand')}
        />
      )}

      {/* Rate after completion */}
      {s === 'completed' && !myRating && (
        <button onClick={() => setShowRateModal(true)}
          className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-yellow-500/30">
          <Award className="w-3.5 h-3.5" /> Leave a Rating
        </button>
      )}
      {s === 'completed' && myRating && (
        <div className="bg-zinc-800/50 rounded-xl p-3 flex items-center gap-2 text-xs text-zinc-400">
          <Award className="w-4 h-4 text-yellow-400" />
          You rated {'⭐'.repeat(myRating.rating)} · {myRating.review_text ?? 'No written review'}
        </div>
      )}
    </div>
  )
}

// ─── Manage applications modal (brand) ────────────────────────────────────────
function ManageModal({ brief, onClose, onRefresh }) {
  const [apps,       setApps]       = useState([])
  const [interested, setInterested] = useState([])
  const [deals,      setDeals]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [acting,     setActing]     = useState(null)
  const [tab,        setTab]        = useState('applications')
  const [offerApp,   setOfferApp]   = useState(null)

  useEffect(() => { loadAll() }, [brief.id])

  async function loadAll() {
    const [{ data: a }, { data: i }, { data: d }] = await Promise.all([
      supabase.from('brief_applications').select('*, creator:creator_id(id, full_name, username, avatar_url, headline, follower_count)').eq('brief_id', brief.id).order('created_at', { ascending: false }),
      supabase.from('brief_interests').select('*, creator:creator_id(id, full_name, username, avatar_url, headline, follower_count)').eq('brief_id', brief.id).order('created_at', { ascending: false }),
      supabase.from('brief_deals').select('*, creator:creator_id(full_name, avatar_url)').eq('brief_id', brief.id),
    ])
    setApps(a ?? [])
    setInterested(i ?? [])
    setDeals(d ?? [])
    setLoading(false)
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
    loadAll(); onRefresh?.()
  }

  async function updateBriefStatus(status) {
    await supabase.from('brand_briefs').update({ status }).eq('id', brief.id)
    toast.success(`Brief marked as ${status.replace('_',' ')}`)
    onRefresh?.()
  }

  const counts = { all: apps.length, pending: 0, shortlisted: 0, approved: 0, rejected: 0 }
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })
  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  function nicheMatch(creator) {
    return brief.niches?.some(n => creator?.headline?.toLowerCase().includes(n.toLowerCase())) ?? false
  }
  function meetsF(creator) {
    if (!brief.min_followers) return null
    return (creator?.follower_count ?? 0) >= brief.min_followers
  }
  function dealFor(app) {
    return deals.find(d => d.application_id === app.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      {offerApp && <SendOfferModal app={offerApp} brief={brief} onClose={() => setOfferApp(null)} onSent={() => { loadAll(); onRefresh?.() }} />}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-white">{brief.title}</h2>
              <StatusBadge status={brief.status} />
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label:'Interested', val:interested.length, color:'text-blue-400' },
              { label:'Applied',    val:apps.length,       color:'text-purple-400' },
              { label:'Deals',      val:deals.length,      color:'text-green-400' },
              { label:'Views',      val:brief.views??0,    color:'text-zinc-300' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {['applications','interested','deals'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${tab===t ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                {t === 'applications' ? `Applications (${apps.length})` : t === 'interested' ? `Interested (${interested.length})` : `Deals (${deals.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* ── Applications ── */}
          {tab === 'applications' && (
            <>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-1">
                {['all','pending','shortlisted','approved','rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter===f ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                    {f} {counts[f]>0?`(${counts[f]})`:''}
                  </button>
                ))}
              </div>
              {loading ? [1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-24 animate-pulse" />) :
               filtered.length === 0 ? (
                <div className="text-center py-12 text-zinc-500"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No applications yet</p></div>
               ) : filtered.map(app => {
                const mf = meetsF(app.creator)
                const deal = dealFor(app)
                return (
                  <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <img src={app.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.full_name??'C')}&background=7c3aed&color=fff&size=40`}
                        className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Link to={`/profile/${app.creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">{app.creator?.full_name}</Link>
                          <span className="text-xs text-zinc-500">@{app.creator?.username}</span>
                          <AppStatusBadge status={app.status} />
                          {deal && <DealBadge status={deal.status} />}
                        </div>
                        {app.creator?.headline && <p className="text-xs text-zinc-500 mb-1.5 truncate">{app.creator.headline}</p>}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {app.creator?.follower_count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${mf===true?'bg-green-500/20 text-green-400':mf===false?'bg-red-500/20 text-red-400':'bg-zinc-800 text-zinc-400'}`}>
                              {(app.creator.follower_count/1000).toFixed(1)}k followers {mf===true?'✓':mf===false?'✗':''}
                            </span>
                          )}
                          {app.quote && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">${Number(app.quote).toLocaleString()}</span>}
                          {nicheMatch(app.creator) && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-medium">Niche match</span>}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-2 line-clamp-3">{app.pitch}</p>
                        {(app.portfolio_urls??[]).length > 0 && (
                          <a href={app.portfolio_urls[0]} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View portfolio
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!deal && app.status !== 'rejected' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/60">
                        {app.status !== 'shortlisted' && (
                          <button onClick={() => decide(app.id, 'shortlisted')} disabled={acting===app.id}
                            className="flex-1 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-1">
                            <Star className="w-3 h-3" /> Shortlist
                          </button>
                        )}
                        {app.status !== 'approved' && (
                          <button onClick={() => decide(app.id, 'approved')} disabled={acting===app.id}
                            className="flex-1 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-xl flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {app.status === 'approved' && (
                          <button onClick={() => setOfferApp(app)}
                            className="flex-1 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-1">
                            <Handshake className="w-3 h-3" /> Send Offer
                          </button>
                        )}
                        <button onClick={() => decide(app.id, 'rejected')} disabled={acting===app.id}
                          className="flex-1 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}

                    {/* Deal panel inline */}
                    {deal && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/60">
                        <DealPanel deal={{ ...deal, brief }} isBrand={true} onUpdate={loadAll} />
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ── Interested ── */}
          {tab === 'interested' && (
            interested.length === 0 ? (
              <div className="text-center py-12 text-zinc-500"><Heart className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No creators expressed interest yet</p></div>
            ) : interested.map(i => {
              const mf = meetsF(i.creator)
              const alsoApplied = apps.some(a => a.creator_id === i.creator?.id)
              return (
                <div key={i.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                  <img src={i.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(i.creator?.full_name??'C')}&background=3b82f6&color=fff&size=40`}
                    className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/profile/${i.creator?.id}`} className="text-sm font-semibold text-white hover:text-purple-300">{i.creator?.full_name}</Link>
                      <span className="text-xs text-zinc-500">@{i.creator?.username}</span>
                      {alsoApplied && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Also applied</span>}
                    </div>
                    {i.creator?.headline && <p className="text-xs text-zinc-500 mb-2 truncate">{i.creator.headline}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {i.creator?.follower_count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${mf===true?'bg-green-500/20 text-green-400':mf===false?'bg-red-500/20 text-red-400':'bg-zinc-800 text-zinc-400'}`}>
                          {(i.creator.follower_count/1000).toFixed(1)}k followers {mf===true?'✓':mf===false?'✗':''}
                        </span>
                      )}
                      {nicheMatch(i.creator) && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Niche match</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* ── Deals ── */}
          {tab === 'deals' && (
            deals.length === 0 ? (
              <div className="text-center py-12 text-zinc-500"><Handshake className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No deals yet — approve an applicant and send an offer</p></div>
            ) : deals.map(d => (
              <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={d.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=C&background=7c3aed&color=fff&size=36`} className="w-9 h-9 rounded-full object-cover" alt="" />
                  <div>
                    <p className="text-sm font-semibold text-white">{d.creator?.full_name}</p>
                    <DealBadge status={d.status} />
                  </div>
                </div>
                <DealPanel deal={{ ...d, brief }} isBrand={true} onUpdate={loadAll} />
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 shrink-0 flex items-center gap-2">
          <p className="text-xs text-zinc-500 mr-auto">Mark brief as:</p>
          {['open','in_review','closed'].filter(s => s !== brief.status).map(s => (
            <button key={s} onClick={() => updateBriefStatus(s)}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl capitalize transition-colors">{s.replace('_',' ')}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Brief card (creator browse) ───────────────────────────────────────────────
function BriefCard({ brief, interested, hasApplied, myFollowers, onToggleInterest, onApply }) {
  const [toggling, setToggling] = useState(false)
  const meetsMin = !brief.min_followers || myFollowers >= brief.min_followers

  async function toggleInterest() {
    setToggling(true); await onToggleInterest(brief.id, interested); setToggling(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge status={brief.status} />
            {(brief.content_types??[]).slice(0,2).map(ct => <span key={ct} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{ct}</span>)}
            {(brief.content_types??[]).length > 2 && <span className="text-xs text-zinc-600">+{brief.content_types.length-2}</span>}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{brief.title}</h3>
        </div>
        <button onClick={toggleInterest} disabled={toggling || brief.status !== 'open'}
          title={interested ? 'Remove interest' : 'Express interest — shares your profile with the brand'}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${interested ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10'}`}>
          <Heart className={`w-4 h-4 ${interested ? 'fill-blue-400' : ''}`} />
        </button>
      </div>

      {brief.description && <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{brief.description}</p>}

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400"><DollarSign className="w-3.5 h-3.5 text-green-400" />${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()}</div>
        {brief.deadline && <div className="flex items-center gap-1.5 text-zinc-400"><Clock className="w-3.5 h-3.5 text-yellow-400" />Due {new Date(brief.deadline).toLocaleDateString()}</div>}
        <div className="flex items-center gap-1.5 text-zinc-400"><Heart className="w-3.5 h-3.5 text-blue-400" />{brief.interest_count??0} interested</div>
        <div className="flex items-center gap-1.5 text-zinc-400"><Send className="w-3.5 h-3.5 text-purple-400" />{brief.application_count??0} applied</div>
        {brief.min_followers > 0 && (
          <div className={`flex items-center gap-1.5 col-span-2 ${!meetsMin ? 'text-yellow-400/70' : 'text-zinc-400'}`}>
            <Users className="w-3.5 h-3.5" />{(brief.min_followers/1000).toFixed(0)}k+ required {meetsMin && myFollowers > 0 ? '✓ you qualify' : !meetsMin && myFollowers > 0 ? `(you have ${(myFollowers/1000).toFixed(1)}k)` : ''}
          </div>
        )}
      </div>

      {(brief.niches??[]).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {brief.niches.map(n => <span key={n} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">{n}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          {brief.company?.logo_url ? <img src={brief.company.logo_url} className="w-5 h-5 rounded object-cover" alt="" /> : <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">{brief.company?.name?.[0]??'B'}</div>}
          <span className="text-xs text-zinc-500">{brief.company?.name??'Brand'}</span>
        </div>
        {brief.status === 'open' && (
          hasApplied
            ? <span className="text-xs text-purple-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Applied</span>
            : <button onClick={() => onApply(brief)} className="flex items-center gap-1.5 text-xs text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl font-medium transition-colors">Apply <ChevronRight className="w-3 h-3" /></button>
        )}
      </div>
    </div>
  )
}

// ─── Creator deal card (My Activity → Deals tab) ──────────────────────────────
function CreatorDealCard({ deal, onUpdate }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o=>!o)} className="w-full flex items-start gap-4 p-4 text-left hover:bg-zinc-800/30 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${DEAL_STATUS_MAP[deal.status]?.bg ?? 'bg-zinc-800'}`}>
          <Handshake className={`w-5 h-5 ${DEAL_STATUS_MAP[deal.status]?.color ?? 'text-zinc-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{deal.brief?.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500">{deal.brief?.company?.name}</span>
            <DealBadge status={deal.status} />
          </div>
          <p className="text-xs text-green-400 font-medium mt-1">${Number(deal.agreed_amount).toLocaleString()}</p>
        </div>
        <div className="shrink-0 mt-1">{open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}</div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <DealPanel deal={deal} isBrand={false} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BrandBriefs() {
  const { user } = useAuth()

  const [briefs,          setBriefs]         = useState([])
  const [myBriefs,        setMyBriefs]       = useState([])
  const [loading,         setLoading]        = useState(true)
  const [myInterests,     setMyInterests]    = useState(new Set())
  const [myApps,          setMyApps]         = useState(new Set())
  const [interestRecords, setInterestRecords]= useState([])
  const [appRecords,      setAppRecords]     = useState([])
  const [dealRecords,     setDealRecords]    = useState([])
  const [company,         setCompany]        = useState(null)
  const [companyChecked,  setCompanyChecked] = useState(false)
  const [myFollowers,     setMyFollowers]    = useState(0)
  const [search,          setSearch]         = useState('')
  const [filterType,      setFilterType]     = useState('All')
  const [posting,         setPosting]        = useState(false)
  const [applying,        setApplying]       = useState(null)
  const [managing,        setManaging]       = useState(null)
  const [activityTab,     setActivityTab]    = useState('deals')
  const [activeSection,   setActiveSection]  = useState('browse')

  useEffect(() => {
    loadBriefs()
    if (user) { loadMyCompany(); loadMyActivity(); loadMyProfile() }
  }, [user])

  async function loadBriefs() {
    const { data } = await supabase.from('brand_briefs')
      .select('*, company:company_id(id, name, logo_url)')
      .eq('status', 'open').order('created_at', { ascending: false })
    setBriefs(data ?? []); setLoading(false)
  }

  async function loadMyProfile() {
    const { data } = await supabase.from('users').select('follower_count').eq('id', user.id).single()
    setMyFollowers(data?.follower_count ?? 0)
  }

  async function loadMyCompany() {
    const { data: owned } = await supabase.from('company_pages').select('*').eq('owner_id', user.id).limit(1).maybeSingle()
    if (owned) { setCompany(owned); loadMyBriefs(owned.id); setCompanyChecked(true); return }
    const { data: member } = await supabase.from('company_members').select('*, company_pages(*)').eq('user_id', user.id).limit(1).maybeSingle()
    if (member?.company_pages) { setCompany(member.company_pages); loadMyBriefs(member.company_pages.id) }
    setCompanyChecked(true)
  }

  async function loadMyBriefs(companyId) {
    const { data } = await supabase.from('brand_briefs')
      .select('*, company:company_id(id, name, logo_url)')
      .eq('company_id', companyId).order('created_at', { ascending: false })
    setMyBriefs(data ?? [])
  }

  async function loadMyActivity() {
    const [{ data: ints }, { data: apps }, { data: deals }] = await Promise.all([
      supabase.from('brief_interests')
        .select('*, brief:brief_id(id, title, status, budget_min, budget_max, deadline, company:company_id(id, name, logo_url))')
        .eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('brief_applications')
        .select('*, brief:brief_id(id, title, status, budget_min, budget_max, deadline, company:company_id(id, name, logo_url))')
        .eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('brief_deals')
        .select('*, brief:brief_id(id, title, company:company_id(id, name, logo_url))')
        .eq('creator_id', user.id).order('created_at', { ascending: false }),
    ])
    setInterestRecords(ints ?? [])
    setMyInterests(new Set((ints ?? []).map(i => i.brief_id)))
    setAppRecords(apps ?? [])
    setMyApps(new Set((apps ?? []).map(a => a.brief_id)))
    setDealRecords(deals ?? [])
  }

  async function toggleInterest(briefId, currentlyInterested) {
    if (!user) { toast.error('Sign in to express interest'); return }
    if (currentlyInterested) {
      await supabase.from('brief_interests').delete().eq('brief_id', briefId).eq('creator_id', user.id)
      toast.success('Interest removed')
    } else {
      await supabase.from('brief_interests').insert({ brief_id: briefId, creator_id: user.id })
      toast.success('Interest expressed — the brand can now see your profile')
    }
    loadBriefs(); loadMyActivity()
  }

  const allTypes = ['All', ...CONTENT_TYPES]
  const filtered = briefs.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.company?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType === 'All' || (b.content_types ?? []).includes(filterType)
    return matchSearch && matchType
  })

  const openBriefs        = myBriefs.filter(b => b.status === 'open').length
  const totalAppsReceived = myBriefs.reduce((s, b) => s + (b.application_count ?? 0), 0)
  const totalViews        = myBriefs.reduce((s, b) => s + (b.views ?? 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {posting  && company && <PostBriefModal companyId={company.id} onClose={() => setPosting(false)} onPosted={() => { loadBriefs(); loadMyBriefs(company.id) }} />}
      {applying && <ApplyModal brief={applying} onClose={() => setApplying(null)} onApplied={() => { loadBriefs(); loadMyActivity() }} />}
      {managing && <ManageModal brief={managing} onClose={() => setManaging(null)} onRefresh={() => { loadBriefs(); company && loadMyBriefs(company.id) }} />}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900/50 via-violet-900/30 to-zinc-900 border border-blue-800/30 p-8">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Brand × Creator</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Brand Briefs</h1>
        <p className="text-zinc-400 max-w-lg">Brands post campaigns. Creators pitch. Deals get made — tracked start to finish on Philomni.</p>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setActiveSection('browse')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeSection==='browse' ? 'bg-white text-zinc-900' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60'}`}>
            Browse Briefs
          </button>
          <button onClick={() => setActiveSection('brand')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeSection==='brand' ? 'bg-blue-600 text-white' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60'}`}>
            I'm a Brand
          </button>
        </div>
      </div>

      <HowItWorksPanel />

      {/* ════ BRAND SECTION ════ */}
      {activeSection === 'brand' && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Brand Dashboard</h2>
            {company && (
              <button onClick={() => setPosting(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium">
                <Plus className="w-3.5 h-3.5" /> Post Brief
              </button>
            )}
          </div>
          {companyChecked && !company && <NoCompanyBanner />}
          {company && (
            <>
              {myBriefs.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">Active</p><p className="text-2xl font-bold text-blue-400">{openBriefs}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">Applications</p><p className="text-2xl font-bold text-purple-400">{totalAppsReceived}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"><p className="text-xs text-zinc-500 mb-1">Views</p><p className="text-2xl font-bold text-white">{totalViews}</p></div>
                </div>
              )}
              {myBriefs.length === 0 ? (
                <div className="text-center py-14 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                  <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">No briefs yet</p>
                  <p className="text-xs mt-1 mb-4">Post your first brief and creators can apply</p>
                  <button onClick={() => setPosting(true)} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-colors">Post your first brief →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myBriefs.map(b => (
                    <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1"><StatusBadge status={b.status} />{b.external_ref && <span className="text-xs text-zinc-600 font-mono truncate">{b.external_ref}</span>}</div>
                          <p className="text-sm font-semibold text-white">{b.title}</p>
                          {b.deadline && <p className="text-xs text-zinc-500 mt-0.5">Deadline: {new Date(b.deadline).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500">Interested</p><p className="text-lg font-bold text-blue-400">{b.interest_count??0}</p></div>
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500">Applied</p><p className="text-lg font-bold text-purple-400">{b.application_count??0}</p></div>
                        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center"><p className="text-xs text-zinc-500">Views</p><p className="text-lg font-bold text-white">{b.views??0}</p></div>
                      </div>
                      <button onClick={() => setManaging(b)}
                        className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Manage Applications & Deals
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ════ BROWSE SECTION ════ */}
      {activeSection === 'browse' && (
        <section className="space-y-5">
          <h2 className="text-base font-bold text-white">Browse Open Briefs</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs or brands…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-600" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterType===t ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>{t}</button>
            ))}
          </div>
          {!user && (
            <div className="bg-zinc-900/60 border border-zinc-800 border-dashed rounded-2xl p-4 flex items-center gap-3">
              <Heart className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Sign in to express interest or apply</p>
                <p className="text-xs text-zinc-500 mt-0.5">Tap the heart to flag interest (one tap, no form) or submit a full pitch with rate + portfolio</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-52 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500"><Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">{briefs.length===0 ? 'No open briefs yet.' : 'No briefs match your filter.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(b => (
                <BriefCard key={b.id} brief={b} interested={myInterests.has(b.id)} hasApplied={myApps.has(b.id)}
                  myFollowers={myFollowers} onToggleInterest={toggleInterest} onApply={setApplying} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ════ MY ACTIVITY ════ */}
      {user && (
        <section>
          <h2 className="text-base font-bold text-white mb-4">My Activity</h2>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-4">
            {[
              { id:'deals',        label:`Deals (${dealRecords.length})` },
              { id:'applications', label:`Applications (${appRecords.length})` },
              { id:'interests',    label:`Interested (${interestRecords.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setActivityTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${activityTab===t.id ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}>{t.label}</button>
            ))}
          </div>

          {activityTab === 'deals' && (
            dealRecords.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                <Handshake className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-zinc-400">No deals yet</p>
                <p className="text-xs mt-1">Apply to a brief — if approved, the brand sends you a deal offer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dealRecords.map(d => <CreatorDealCard key={d.id} deal={d} onUpdate={loadMyActivity} />)}
              </div>
            )
          )}

          {activityTab === 'applications' && (
            appRecords.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-zinc-400">No applications yet</p>
                <p className="text-xs mt-1">Browse briefs and hit Apply to submit your pitch</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appRecords.map(a => (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.status==='approved'?'bg-green-500/20':a.status==='rejected'?'bg-red-500/20':a.status==='shortlisted'?'bg-blue-500/20':'bg-zinc-800'}`}>
                      {a.status==='approved'?<CheckCircle className="w-5 h-5 text-green-400"/>:a.status==='rejected'?<XCircle className="w-5 h-5 text-red-400"/>:a.status==='shortlisted'?<Star className="w-5 h-5 text-blue-400"/>:<Send className="w-5 h-5 text-zinc-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{a.brief?.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-zinc-500">{a.brief?.company?.name}</span>
                        <AppStatusBadge status={a.status} />
                        <span className="text-xs text-zinc-600">{new Date(a.created_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>
                      </div>
                      <div className="mt-1.5 text-xs">
                        {a.status==='pending'     && <p className="text-zinc-500">Submitted — waiting for brand review</p>}
                        {a.status==='shortlisted' && <p className="text-blue-400">You've been shortlisted! Brand is reviewing top picks.</p>}
                        {a.status==='approved'    && <p className="text-green-400 font-medium">Approved — waiting for the brand to send you a deal offer</p>}
                        {a.status==='rejected'    && <p className="text-zinc-500">Not selected. Keep pitching!</p>}
                      </div>
                    </div>
                    {a.quote && <span className="shrink-0 text-xs text-green-400 font-bold self-start">${Number(a.quote).toLocaleString()}</span>}
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
                <p className="text-xs mt-1">Tap the heart on any brief to express interest in one tap</p>
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
                        <button onClick={() => setApplying(i.brief)} className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors">Apply</button>
                      )}
                      <button onClick={() => toggleInterest(i.brief_id, true)} className="shrink-0 p-2 text-zinc-600 hover:text-red-400 transition-colors" title="Remove interest"><X className="w-4 h-4" /></button>
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
