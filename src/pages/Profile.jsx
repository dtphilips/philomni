import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Camera, Edit2, Loader2, MapPin, Globe, Share2, Settings,
  MessageSquare, UserPlus, UserMinus, MoreHorizontal, Grid, List,
  Briefcase, GraduationCap, Heart, MessageCircle, Eye, Play,
  Plus, X, Check, Star, Radio, Users, Building2, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import GoLiveModal from '../components/GoLiveModal'

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTENT_CATEGORIES = [
  'Lifestyle', 'Fashion', 'Beauty', 'Tech', 'Finance', 'Food',
  'Travel', 'Fitness', 'Music', 'Gaming', 'Education', 'Business',
  'Comedy', 'Motivational', 'Parenting', 'Nigerian Content',
]
const CREATOR_TYPES = [
  'UGC Creator', 'Educator', 'Entertainer', 'Influencer',
  'Artist', 'Podcaster', 'Photographer', 'Other',
]
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Media & Entertainment',
  'Real Estate', 'Marketing', 'Consulting', 'Law', 'Engineering',
  'Government', 'Non-profit', 'Other',
]
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Volunteer']
const DEGREE_TYPES = ["Bachelor's", "Master's", 'PhD', 'MBA', 'Diploma', 'Certificate', 'Associate', 'Other']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeHTML(html) {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
}

function isEmptyHTML(html) {
  if (!html) return true
  const stripped = html.replace(/<[^>]+>/g, '').replace(/\s/g, '')
  return stripped.length === 0
}

function formatCount(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, viewMode = 'list' }) {
  const hasContent = !isEmptyHTML(post.content)
  const mediaUrls = post.media_urls || (post.image_url ? [post.image_url] : [])
  const isVideo = post.post_type === 'video' || mediaUrls.some(u => /\.(mp4|mov|webm)/i.test(u))
  const isEmpty = !hasContent && mediaUrls.length === 0

  if (viewMode === 'grid') {
    if (mediaUrls.length > 0) {
      return (
        <div className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer">
          <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-3 text-white text-sm font-semibold">
              <span>❤️ {post.like_count ?? 0}</span>
              <span>💬 {post.comment_count ?? 0}</span>
            </div>
          </div>
          {isVideo && <div className="absolute top-2 right-2"><Play className="w-5 h-5 text-white fill-white drop-shadow" /></div>}
        </div>
      )
    }
    return (
      <div className="aspect-square rounded-xl overflow-hidden relative cursor-pointer bg-gradient-to-br from-primary/20 to-purple-900/30 p-3 flex items-center justify-center group">
        <p className="text-xs text-foreground/70 text-center line-clamp-4">
          {(post.content || '').replace(/<[^>]+>/g, ' ').trim() || '📝'}
        </p>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
          <span className="text-white text-sm font-semibold">❤️ {post.like_count ?? 0}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic">📝 Empty post</p>
      ) : (
        <>
          {hasContent && (
            <div
              className="text-sm text-foreground leading-relaxed prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content) }}
            />
          )}
          {mediaUrls.length === 1 && (
            <div className="mt-3 rounded-xl overflow-hidden">
              {isVideo
                ? <div className="relative aspect-video bg-black/40 rounded-xl flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/60" />
                  </div>
                : <img src={mediaUrls[0]} alt="" className="w-full max-h-80 object-cover rounded-xl" />}
            </div>
          )}
          {mediaUrls.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
              {mediaUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                      +{mediaUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart className="w-3 h-3" /> {post.like_count ?? 0}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="w-3 h-3" /> {post.comment_count ?? 0}</span>
        {post.view_count > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" /> {post.view_count}</span>}
        <span className="text-xs text-muted-foreground ml-auto">
          {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
        </span>
      </div>
    </div>
  )
}

// ─── WorkExperienceItem ───────────────────────────────────────────────────────
function WorkExperienceItem({ item }) {
  const duration = () => {
    if (!item.start_date) return ''
    const start = (() => { try { return format(new Date(item.start_date + '-01'), 'MMM yyyy') } catch { return item.start_date } })()
    const end = item.is_current ? 'Present' : item.end_date ? (() => { try { return format(new Date(item.end_date + '-01'), 'MMM yyyy') } catch { return item.end_date } })() : ''
    return `${start}${end ? ' – ' + end : ''}`
  }
  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{item.job_title}</p>
        <p className="text-sm text-muted-foreground">{item.company_name}{item.employment_type ? ` · ${item.employment_type}` : ''}</p>
        {duration() && <p className="text-xs text-muted-foreground mt-0.5">{duration()}</p>}
        {item.location && <p className="text-xs text-muted-foreground">{item.location}</p>}
        {item.description && <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{item.description}</p>}
      </div>
    </div>
  )
}

// ─── EducationItem ────────────────────────────────────────────────────────────
function EducationItem({ item }) {
  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{item.school_name}</p>
        <p className="text-sm text-muted-foreground">{[item.degree, item.field_of_study].filter(Boolean).join(' · ')}</p>
        {(item.start_year || item.end_year) && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.start_year}{item.end_year ? ` – ${item.end_year}` : ''}</p>
        )}
        {item.description && <p className="text-sm text-foreground/70 mt-2">{item.description}</p>}
      </div>
    </div>
  )
}

// ─── ProfileCompletionCard ────────────────────────────────────────────────────
function ProfileCompletionCard({ profileUser }) {
  const checks = [
    { label: 'Add profile photo', done: !!profileUser?.avatar_url, pct: 10 },
    { label: 'Add a headline', done: !!profileUser?.headline, pct: 10 },
    { label: 'Add your bio', done: !!profileUser?.bio, pct: 10 },
    { label: 'Add work experience', done: (profileUser?.work_experience?.length ?? 0) > 0, pct: 15 },
    { label: 'Add skills', done: (profileUser?.skills?.length ?? 0) > 0, pct: 10 },
    { label: 'Add your location', done: !!profileUser?.location, pct: 5 },
    { label: 'Add a website', done: !!profileUser?.website, pct: 5 },
    { label: 'Connect social accounts', done: !!(profileUser?.social_links?.instagram || profileUser?.social_links?.twitter), pct: 10 },
  ]
  const total = checks.reduce((acc, c) => acc + (c.done ? c.pct : 0), 0)
  if (total >= 90) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm">Profile Completion</h3>
        <span className="text-sm font-bold text-primary">{total}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full mb-3">
        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: `${total}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mb-3">Complete your profile to attract more opportunities</p>
      <div className="space-y-1.5">
        {checks.filter(c => !c.done).slice(0, 4).map(c => (
          <div key={c.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded border border-border flex-shrink-0" />
            <span>{c.label} <span className="text-primary/60">(+{c.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EditProfileModal ─────────────────────────────────────────────────────────
function EditProfileModal({ profileUser, onClose, onSave }) {
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profileUser?.full_name ?? '',
    username: profileUser?.username ?? '',
    headline: profileUser?.headline ?? '',
    bio: profileUser?.bio ?? '',
    location: profileUser?.location ?? '',
    website: profileUser?.website ?? '',
    creator_type: profileUser?.creator_type ?? '',
    content_categories: profileUser?.content_categories ?? [],
    professional_summary: profileUser?.professional_summary ?? '',
    industry: profileUser?.industry ?? '',
    skills: profileUser?.skills ?? [],
    work_experience: profileUser?.work_experience ?? [],
    education: profileUser?.education ?? [],
    social_links: profileUser?.social_links ?? {},
  })
  const [newSkill, setNewSkill] = useState('')
  const [addingWork, setAddingWork] = useState(false)
  const [addingEdu, setAddingEdu] = useState(false)
  const [workForm, setWorkForm] = useState({
    job_title: '', company_name: '', employment_type: 'Full-time',
    start_date: '', end_date: '', is_current: false, location: '', description: '',
  })
  const [eduForm, setEduForm] = useState({
    school_name: '', degree: "Bachelor's", field_of_study: '',
    start_year: '', end_year: '', description: '',
  })

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form); onClose() } finally { setSaving(false) }
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (!s || form.skills.includes(s)) return
    f('skills', [...form.skills, s])
    setNewSkill('')
  }

  const addWork = () => {
    if (!workForm.job_title || !workForm.company_name) return
    f('work_experience', [...form.work_experience, { ...workForm, id: Date.now() }])
    setWorkForm({ job_title: '', company_name: '', employment_type: 'Full-time', start_date: '', end_date: '', is_current: false, location: '', description: '' })
    setAddingWork(false)
  }

  const addEdu = () => {
    if (!eduForm.school_name) return
    f('education', [...form.education, { ...eduForm, id: Date.now() }])
    setEduForm({ school_name: '', degree: "Bachelor's", field_of_study: '', start_year: '', end_year: '', description: '' })
    setAddingEdu(false)
  }

  const inp = (key, placeholder, extra = {}) => (
    <input value={form[key] ?? ''} onChange={e => f(key, e.target.value)} placeholder={placeholder} {...extra}
      className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
  )

  const ta = (key, placeholder, rows = 3, max) => (
    <div>
      <textarea value={form[key] ?? ''} onChange={e => f(key, e.target.value)} placeholder={placeholder}
        rows={rows} maxLength={max} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      {max && <p className="text-xs text-muted-foreground text-right mt-0.5">{(form[key] ?? '').length}/{max}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
          {[['basic', 'Basic Info'], ['creator', 'Creator'], ['pro', 'Professional'], ['social', 'Social Links']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${tab === k ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ── BASIC INFO ── */}
          {tab === 'basic' && (
            <>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Full Name</label>{inp('full_name', 'Your full name')}</div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input value={form.username ?? ''} onChange={e => f('username', e.target.value)} placeholder="yourhandle"
                    className="w-full bg-muted rounded-xl pl-7 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Headline <span className="opacity-50">(120 chars)</span></label>
                {inp('headline', 'Creator | Educator | Entrepreneur', { maxLength: 120 })}
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Bio</label>{ta('bio', 'Tell people about yourself...', 4, 500)}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Location</label>{inp('location', 'City, Country')}</div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Website</label>{inp('website', 'https://yoursite.com')}</div>
              </div>
            </>
          )}

          {/* ── CREATOR ── */}
          {tab === 'creator' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Creator Type</label>
                <div className="flex flex-wrap gap-2">
                  {CREATOR_TYPES.map(ct => (
                    <button key={ct} onClick={() => f('creator_type', ct)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.creator_type === ct ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Content Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_CATEGORIES.map(cat => {
                    const on = (form.content_categories || []).includes(cat)
                    return (
                      <button key={cat} onClick={() => f('content_categories', on ? form.content_categories.filter(c => c !== cat) : [...(form.content_categories || []), cat])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Other Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['instagram', 'Instagram @handle'], ['tiktok', 'TikTok @handle'], ['youtube', 'YouTube URL'], ['twitter', 'Twitter/X @handle']].map(([key, ph]) => (
                    <input key={key} value={form.social_links?.[key] ?? ''} onChange={e => f('social_links', { ...form.social_links, [key]: e.target.value })} placeholder={ph}
                      className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── PROFESSIONAL ── */}
          {tab === 'pro' && (
            <>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">Professional Summary</label>{ta('professional_summary', 'Describe your professional background...', 5, 2000)}</div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Industry</label>
                <select value={form.industry ?? ''} onChange={e => f('industry', e.target.value)}
                  className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Work Experience */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Work Experience</label>
                  <button onClick={() => setAddingWork(true)} className="text-xs text-primary flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                {form.work_experience.map((w, i) => (
                  <div key={w.id || i} className="bg-muted/50 rounded-xl p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{w.job_title}</p>
                      <p className="text-xs text-muted-foreground">{w.company_name} · {w.employment_type}</p>
                    </div>
                    <button onClick={() => f('work_experience', form.work_experience.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-muted flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {addingWork && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={workForm.job_title} onChange={e => setWorkForm(w => ({ ...w, job_title: e.target.value }))} placeholder="Job title *" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                      <input value={workForm.company_name} onChange={e => setWorkForm(w => ({ ...w, company_name: e.target.value }))} placeholder="Company *" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={workForm.employment_type} onChange={e => setWorkForm(w => ({ ...w, employment_type: e.target.value }))} className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                        {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input value={workForm.location} onChange={e => setWorkForm(w => ({ ...w, location: e.target.value }))} placeholder="Location" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="month" value={workForm.start_date} onChange={e => setWorkForm(w => ({ ...w, start_date: e.target.value }))} className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                      {!workForm.is_current && <input type="month" value={workForm.end_date} onChange={e => setWorkForm(w => ({ ...w, end_date: e.target.value }))} className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={workForm.is_current} onChange={e => setWorkForm(w => ({ ...w, is_current: e.target.checked }))} />
                      Currently working here
                    </label>
                    <textarea value={workForm.description} onChange={e => setWorkForm(w => ({ ...w, description: e.target.value }))} placeholder="Description..." rows={2}
                      className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={addWork} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Save</button>
                      <button onClick={() => setAddingWork(false)} className="px-4 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Education</label>
                  <button onClick={() => setAddingEdu(true)} className="text-xs text-primary flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                {form.education.map((e, i) => (
                  <div key={e.id || i} className="bg-muted/50 rounded-xl p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{e.school_name}</p>
                      <p className="text-xs text-muted-foreground">{e.degree} · {e.field_of_study}</p>
                    </div>
                    <button onClick={() => f('education', form.education.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-muted flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {addingEdu && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                    <input value={eduForm.school_name} onChange={e => setEduForm(f => ({ ...f, school_name: e.target.value }))} placeholder="School / University *" className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                        {DEGREE_TYPES.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <input value={eduForm.field_of_study} onChange={e => setEduForm(f => ({ ...f, field_of_study: e.target.value }))} placeholder="Field of study" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={eduForm.start_year} onChange={e => setEduForm(f => ({ ...f, start_year: e.target.value }))} placeholder="Start year" type="number" min="1950" max="2030" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                      <input value={eduForm.end_year} onChange={e => setEduForm(f => ({ ...f, end_year: e.target.value }))} placeholder="End year" type="number" min="1950" max="2030" className="bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addEdu} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Save</button>
                      <button onClick={() => setAddingEdu(false)} className="px-4 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Skills</label>
                <div className="flex gap-2">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Add a skill (Enter to add)"
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                  <button onClick={addSkill} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl"><Plus className="w-4 h-4" /></button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map(s => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {s}<button onClick={() => f('skills', form.skills.filter(x => x !== s))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SOCIAL LINKS ── */}
          {tab === 'social' && (
            <div className="space-y-3">
              {[
                ['instagram', '📸 Instagram', 'https://instagram.com/yourhandle'],
                ['tiktok', '🎵 TikTok', 'https://tiktok.com/@yourhandle'],
                ['youtube', '▶️ YouTube', 'https://youtube.com/@yourchannel'],
                ['twitter', '𝕏 Twitter/X', 'https://twitter.com/yourhandle'],
                ['linkedin', '💼 LinkedIn', 'https://linkedin.com/in/yourprofile'],
                ['facebook', '📘 Facebook', 'https://facebook.com/yourpage'],
                ['website', '🌐 Website', 'https://yourwebsite.com'],
              ].map(([key, label, ph]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input value={form.social_links?.[key] ?? ''} onChange={e => f('social_links', { ...form.social_links, [key]: e.target.value })} placeholder={ph}
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ShareProfileModal ────────────────────────────────────────────────────────
function ShareProfileModal({ profileUser, onClose }) {
  const [copied, setCopied] = useState(false)
  const link = `https://philomni.com/profile/${profileUser?.username || profileUser?.id || 'user'}`

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Share Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <span className="text-xs text-muted-foreground flex-1 truncate">{link}</span>
            <button onClick={copy} className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-primary/15 text-primary'}`}>
              {copied ? <><Check className="w-3 h-3 inline mr-1" />Copied!</> : 'Copy'}
            </button>
          </div>
          <button onClick={() => { if (navigator.share) navigator.share({ title: `${profileUser?.full_name} on Philomni`, url: link }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm text-foreground">
            <Share2 className="w-4 h-4 text-muted-foreground" /> Share via...
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Celebrations Wall (tab on profile) ──────────────────────────────────────
function CelebrationsWall({ userId, isOwnProfile }) {
  const navigate = useNavigate()
  const [celebrations, setCelebrations] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase
      .from('celebrations')
      .select('*')
      .eq('honoree_user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setCelebrations(data || [])
        setLoading(false)
      })
  }, [userId])

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  if (celebrations.length === 0) return (
    <div className="text-center py-14 text-muted-foreground">
      <p className="text-4xl mb-3">🎉</p>
      <p className="font-medium">No celebrations yet</p>
      <p className="text-sm mt-1 opacity-60">Celebrations people create for this person will appear here</p>
      <button onClick={() => navigate('/celebrations/create')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
        Create a Celebration
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Celebrations this person has received from the community</p>
      {celebrations.map(c => (
        <div
          key={c.id}
          onClick={() => navigate(`/celebrations/${c.id}`)}
          className="bg-card border border-border/60 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            {c.creator_avatar ? (
              <img src={c.creator_avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {(c.creator_name || '?')[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-xs font-semibold text-foreground">{c.creator_name}</span>
                <span className="text-xs text-muted-foreground">created a celebration</span>
              </div>
              <p className="font-bold text-foreground text-sm">{c.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>💬 {c.wish_count || 0} wishes</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <span className="text-lg flex-shrink-0">{c.celebration_type === 'birthday' ? '🎂' : c.celebration_type === 'memorial' ? '🕊️' : c.celebration_type === 'achievement' ? '🏆' : '🎉'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FollowListModal ──────────────────────────────────────────────────────────
function FollowListModal({ type, targetId, onClose, onNavigate, onNavigateCompany }) {
  const [people, setPeople] = useState([])   // { kind:'user'|'company', ...fields }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    const load = async () => {
      if (type === 'followers') {
        // Users who follow this person
        const { data: userRows } = await supabase
          .from('follows').select('follower_id').eq('following_id', targetId).limit(100)
        const userIds = (userRows ?? []).map(r => r.follower_id)

        // Companies that follow this person (via company_following table)
        const { data: coRows } = await supabase
          .from('company_following').select('company_id')
          .eq('target_type', 'user').eq('target_id', targetId).limit(100)
        const coIds = (coRows ?? []).map(r => r.company_id)

        const [{ data: users }, { data: cos }] = await Promise.all([
          userIds.length > 0
            ? supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', userIds)
            : Promise.resolve({ data: [] }),
          coIds.length > 0
            ? supabase.from('company_pages').select('id, name, handle, logo_url, tagline').in('id', coIds)
            : Promise.resolve({ data: [] }),
        ])
        setPeople([
          ...(users ?? []).map(u => ({ ...u, kind: 'user' })),
          ...(cos ?? []).map(c => ({ ...c, kind: 'company' })),
        ])
      } else {
        // Users this person follows
        const { data: userRows } = await supabase
          .from('follows').select('following_id').eq('follower_id', targetId).limit(100)
        const userIds = (userRows ?? []).map(r => r.following_id)

        // Companies this person follows (via company_follows table)
        const { data: coRows } = await supabase
          .from('company_follows').select('company_id').eq('user_id', targetId).limit(100)
        const coIds = (coRows ?? []).map(r => r.company_id)

        const [{ data: users }, { data: cos }] = await Promise.all([
          userIds.length > 0
            ? supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', userIds)
            : Promise.resolve({ data: [] }),
          coIds.length > 0
            ? supabase.from('company_pages').select('id, name, handle, logo_url, tagline').in('id', coIds)
            : Promise.resolve({ data: [] }),
        ])
        setPeople([
          ...(users ?? []).map(u => ({ ...u, kind: 'user' })),
          ...(cos ?? []).map(c => ({ ...c, kind: 'company' })),
        ])
      }
      setLoading(false)
    }
    load()
  }, [type, targetId])

  const navigate = (item) => {
    onClose()
    if (item.kind === 'company') onNavigateCompany(item.handle)
    else onNavigate(item.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground capitalize">{type}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : people.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {people.map(item => {
                const isCompany = item.kind === 'company'
                const name = isCompany ? item.name : (item.full_name || item.username || 'User')
                const sub = isCompany ? `@${item.handle}` : (item.username ? `@${item.username}` : null)
                const desc = isCompany ? item.tagline : item.headline
                const initials = (name || '?')[0].toUpperCase()
                return (
                  <button key={item.id} onClick={() => navigate(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                    <div className={`w-10 h-10 ${isCompany ? 'rounded-xl border border-border' : 'rounded-full'} bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0`}>
                      {item.avatar_url || item.logo_url
                        ? <img src={item.avatar_url || item.logo_url} className="w-full h-full object-cover" alt="" />
                        : isCompany ? <Building2 className="w-4 h-4 text-muted-foreground" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">{name}</p>
                      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                      {desc && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{desc}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Profile Component ───────────────────────────────────────────────────
export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()
  const { userId } = useParams()

  const isOwnProfile = !userId || userId === user?.id

  const [profileUser, setProfileUser] = useState(isOwnProfile ? user : null)
  const [posts, setPosts] = useState([])
  const [watchVideos, setWatchVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [viewMode, setViewMode] = useState('list')
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showGoLive, setShowGoLive] = useState(false)
  const [followModal, setFollowModal] = useState(null) // 'followers' | 'following' | null
  const [myCompanies, setMyCompanies] = useState([])
  const [companyFollowingUser, setCompanyFollowingUser] = useState(new Set()) // company ids already following this user
  const [showAsDropdown, setShowAsDropdown] = useState(false)
  const [activeLive, setActiveLive] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [bannerUrl, setBannerUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const avatarInputRef = useRef()
  const bannerInputRef = useRef()

  // Sync display user
  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(user)
      setAvatarUrl(user?.avatar_url ?? null)
      setBannerUrl(user?.banner_url ?? null)
    } else if (userId) {
      supabase.from('users').select('*').eq('id', userId).single()
        .then(({ data }) => {
          if (data) { setProfileUser(data); setAvatarUrl(data.avatar_url); setBannerUrl(data.banner_url) }
        })
    }
  }, [userId, user, isOwnProfile])

  // Check if this user is currently live
  useEffect(() => {
    const targetId = isOwnProfile ? user?.id : userId
    if (!targetId) return
    supabase.from('lives').select('*').eq('host_id', targetId).eq('status', 'live').maybeSingle()
      .then(({ data }) => setActiveLive(data || null))
  }, [userId, user?.id, isOwnProfile])

  // Load posts — try both column names
  useEffect(() => {
    const targetId = isOwnProfile ? user?.id : userId
    if (!targetId) return
    setLoading(true)
    const load = async () => {
      let data = null
      for (const col of ['author_id', 'created_by']) {
        try {
          const { data: d } = await supabase.from('posts').select('*').eq(col, targetId).order('created_at', { ascending: false }).limit(30)
          if (d?.length) { data = d; break }
        } catch {}
      }
      setPosts(data ?? [])
      setLoading(false)
    }
    load()
  }, [userId, user?.id, isOwnProfile])

  // Load watch videos from the videos table
  useEffect(() => {
    const targetId = isOwnProfile ? user?.id : userId
    if (!targetId) return
    supabase
      .from('videos')
      .select('id, title, thumbnail_url, cloudflare_uid, cloudflare_thumbnail, duration_seconds, view_count, published_at, cloudflare_status')
      .eq('creator_id', targetId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setWatchVideos(data ?? []))
  }, [userId, user?.id, isOwnProfile])

  // Load stats
  useEffect(() => {
    const targetId = isOwnProfile ? user?.id : userId
    if (!targetId) return
    const load = async () => {
      const s = { posts: 0, followers: 0, following: 0 }
      try {
        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
          .or(`author_id.eq.${targetId},created_by.eq.${targetId}`)
        s.posts = count || 0
      } catch {}
      try {
        const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId)
        s.followers = count || 0
      } catch {}
      try {
        const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetId)
        s.following = count || 0
      } catch {}
      setStats(s)
    }
    load()
  }, [userId, user?.id, isOwnProfile])

  // Check follow status
  useEffect(() => {
    if (isOwnProfile || !user?.id || !userId) return
    supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [userId, user?.id, isOwnProfile])

  // Load companies I manage (for "Follow as Company" on other profiles)
  useEffect(() => {
    if (!user?.id || isOwnProfile) return
    Promise.all([
      supabase.from('company_pages').select('id, name, logo_url, handle').eq('owner_id', user.id),
      supabase.from('company_members').select('company_pages(id, name, logo_url, handle)').eq('user_id', user.id).in('role', ['admin', 'editor']),
    ]).then(([{ data: owned }, { data: membered }]) => {
      const merged = [...(owned ?? []), ...(membered ?? []).map(m => m.company_pages).filter(Boolean)]
      const seen = new Set()
      const companies = merged.filter(c => c && !seen.has(c.id) && seen.add(c.id))
      setMyCompanies(companies)
      // Check which of my companies already follow this user
      if (companies.length > 0 && userId) {
        supabase.from('company_following')
          .select('company_id')
          .eq('target_type', 'user')
          .eq('target_id', userId)
          .in('company_id', companies.map(c => c.id))
          .then(({ data }) => setCompanyFollowingUser(new Set((data ?? []).map(r => r.company_id))))
      }
    })
  }, [user?.id, isOwnProfile, userId])

  const toggleFollowAsCompany = async (myCompany) => {
    setShowAsDropdown(false)
    const isAlreadyFollowing = companyFollowingUser.has(myCompany.id)
    if (isAlreadyFollowing) {
      await supabase.from('company_following').delete()
        .eq('company_id', myCompany.id).eq('target_type', 'user').eq('target_id', userId)
      setCompanyFollowingUser(prev => { const s = new Set(prev); s.delete(myCompany.id); return s })
      toast.success(`${myCompany.name} unfollowed this profile`)
    } else {
      await supabase.from('company_following').insert({ company_id: myCompany.id, target_type: 'user', target_id: userId })
      setCompanyFollowingUser(prev => new Set([...prev, myCompany.id]))
      toast.success(`${myCompany.name} is now following this profile`)
    }
  }

  const handleFollow = async () => {
    if (!user?.id || !userId) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId)
        setIsFollowing(false)
        setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }))
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: userId, created_at: new Date().toISOString() })
        setIsFollowing(true)
        setStats(s => ({ ...s, followers: s.followers + 1 }))
      }
    } catch (e) { console.error(e) }
    setFollowLoading(false)
  }

  const handleAvatarUpload = async (file) => {
    if (!file?.type.startsWith('image/')) return
    setAvatarUploading(true)
    setAvatarUrl(URL.createObjectURL(file))
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
      await refreshProfile()
    } catch (e) { console.error('Avatar upload:', e) }
    setAvatarUploading(false)
  }

  const handleBannerUpload = async (file) => {
    if (!file?.type.startsWith('image/')) return
    setBannerUploading(true)
    setBannerUrl(URL.createObjectURL(file))
    try {
      const ext = file.name.split('.').pop()
      const path = `banners/${user.id}/banner-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
      await supabase.from('users').update({ banner_url: publicUrl }).eq('id', user.id)
      setBannerUrl(publicUrl)
      await refreshProfile()
    } catch (e) { console.error('Banner upload:', e) }
    setBannerUploading(false)
  }

  const handleSaveProfile = async (form) => {
    await supabase.from('users').update({
      full_name: form.full_name, username: form.username, headline: form.headline,
      bio: form.bio, location: form.location, website: form.website,
      creator_type: form.creator_type, content_categories: form.content_categories,
      professional_summary: form.professional_summary, industry: form.industry,
      skills: form.skills, work_experience: form.work_experience,
      education: form.education, social_links: form.social_links,
    }).eq('id', user.id)
    await refreshProfile()
    setProfileUser(prev => ({ ...prev, ...form }))
  }

  if (!user) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  const du = profileUser || user
  const initials = (du?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const targetId = isOwnProfile ? user?.id : userId

  // Videos = all feed video posts (< 3 min; same data whether posted as reel or feed video)
  const videoPosts = posts.filter(p => p.media_type === 'video' || p.feed_type === 'reel')
  const photoPosts = posts.filter(p => (p.media_urls?.length > 0 || p.image_url) && p.media_type !== 'video' && p.feed_type !== 'reel')

  const TABS = [
    { key: 'posts',  label: '📝 Posts',  count: posts.length },
    { key: 'videos', label: '🎬 Videos', count: videoPosts.length },
    { key: 'photos', label: '📸 Photos', count: photoPosts.length },
    { key: 'watch',  label: '▶ Watch',  count: watchVideos.length },
    ...(isOwnProfile ? [{ key: 'saved', label: '🔖 Saved' }] : []),
    ...(mode === 'pro' ? [{ key: 'professional', label: '💼 Professional' }] : []),
    { key: 'celebrations', label: '🎉 Celebrations' },
    { key: 'store', label: '🏪 Store' },
    { key: 'about', label: 'ℹ️ About' },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* ── BANNER ── */}
      <div className="relative h-48 rounded-2xl overflow-hidden group">
        <div className="w-full h-full"
          style={bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #1e1b4b 100%)' }} />
        {isOwnProfile && (
          <>
            <button onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
              {bannerUploading
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <div className="flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-xl text-xs font-medium"><Camera className="w-4 h-4" /> Change Banner</div>}
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleBannerUpload(e.target.files[0])} />
          </>
        )}
      </div>

      {/* ── AVATAR + ACTIONS ── */}
      <div className="flex items-end justify-between px-1 -mt-12 mb-3 relative z-10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-background flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
          </div>
          {isOwnProfile && (
            <>
              <button onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                {avatarUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatarUpload(e.target.files[0])} />
            </>
          )}
        </div>

        <div className="flex items-center gap-2 pt-14">
          {isOwnProfile ? (
            <>
              <button onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-all">
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button
                onClick={() => setShowGoLive(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Go Live
              </button>
              <button onClick={() => setShowShareModal(true)}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-all" title="Share">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/settings')}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-all" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleFollow} disabled={followLoading}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${isFollowing ? 'border border-border bg-card text-foreground hover:bg-muted' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              {/* Follow as Company dropdown */}
              {myCompanies.length > 0 && (
                <div className="relative">
                  <button onClick={() => setShowAsDropdown(v => !v)}
                    className="flex items-center gap-1 px-2 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-all">
                    <Building2 className="w-3.5 h-3.5" /><ChevronDown className="w-3 h-3" />
                  </button>
                  {showAsDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      <p className="text-xs text-muted-foreground px-3 pt-2.5 pb-1 font-medium">Follow as company</p>
                      {myCompanies.map(mc => (
                        <button key={mc.id} onClick={() => toggleFollowAsCompany(mc)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-sm text-left transition-colors">
                          <div className="w-6 h-6 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {mc.logo_url ? <img src={mc.logo_url} className="w-full h-full object-cover" alt="" /> : <Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                          <span className="flex-1 truncate">{mc.name}</span>
                          {companyFollowingUser.has(mc.id) && <UserMinus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => navigate('/messages')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-all">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── LIVE NOW banner ── */}
      {activeLive && (
        <button
          onClick={() => navigate(`/live/${activeLive.id}`)}
          className="w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl bg-destructive/10 border-2 border-destructive/40 hover:border-destructive transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-bold text-destructive">🔴 LIVE NOW</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{activeLive.title}</p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {activeLive.viewer_count || 0}
          </div>
        </button>
      )}

      {/* ── NAME + BIO ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">{du?.full_name || 'User'}</h1>
          {du?.spotlight_winner && du?.spotlight_month && (
            <Link
              to={`/spotlight/${du.spotlight_month}`}
              className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-teal-500/10 hover:from-amber-500/20 hover:to-teal-500/20 transition-colors overflow-hidden relative"
              title="Philomni Spotlight Winner"
            >
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 flex-shrink-0" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              <span>⭐ Spotlight</span>
              {/* Shimmer */}
              <span className="absolute inset-0 w-full h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)',
                  animation: 'shimmerBadge 2s ease-in-out infinite',
                  backgroundSize: '200% 100%',
                }} />
            </Link>
          )}
        </div>
        <style>{`
          @keyframes shimmerBadge {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
        {du?.username && <p className="text-sm text-muted-foreground">@{du.username}</p>}
        {du?.headline && <p className="text-sm text-primary/80 mt-0.5">{du.headline}</p>}
        {du?.bio && <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{du.bio}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          {du?.location && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{du.location}</span>}
          {du?.website && (
            <a href={du.website} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              <Globe className="w-3 h-3" />{du.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="flex items-center gap-6 py-3 border-y border-border mb-4">
        {[
          { label: 'Posts', value: formatCount(stats.posts || posts.length), modal: null },
          { label: 'Followers', value: formatCount(stats.followers), modal: 'followers' },
          { label: 'Following', value: formatCount(stats.following), modal: 'following' },
        ].map(({ label, value, modal }) => (
          <button key={label} onClick={() => modal && setFollowModal(modal)}
            className={`text-center transition-opacity ${modal ? 'hover:opacity-70 cursor-pointer' : ''}`}>
            <p className="font-bold text-foreground text-sm">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      {/* ── PROFILE COMPLETION ── */}
      {isOwnProfile && <ProfileCompletionCard profileUser={du} />}

      {/* ── TABS ── */}
      <div className="flex overflow-x-auto border-b border-border mb-4 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* ── POSTS TAB ── */}
      {activeTab === 'posts' && (
        <div>
          <div className="flex items-center justify-end mb-4 gap-1">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground'}`}><Grid className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-4xl mb-3">📝</p>
              <p className="font-medium">No posts yet</p>
              {isOwnProfile && <p className="text-sm mt-1 opacity-60">Share your first post to get started</p>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-1">{posts.map(p => <PostCard key={p.id} post={p} viewMode="grid" />)}</div>
          ) : (
            <div className="space-y-3">{posts.map(p => <PostCard key={p.id} post={p} viewMode="list" />)}</div>
          )}
        </div>
      )}

      {/* ── VIDEOS TAB — all feed video posts (reels + feed videos, same thing) ── */}
      {activeTab === 'videos' && (
        videoPosts.length === 0
          ? <div className="text-center py-14 text-muted-foreground"><p className="text-4xl mb-3">🎬</p><p className="font-medium">No videos yet</p><p className="text-sm mt-1 opacity-60">Videos posted to your feed appear here</p></div>
          : <div className="grid grid-cols-3 gap-1">{videoPosts.map(p => <PostCard key={p.id} post={p} viewMode="grid" />)}</div>
      )}

      {/* ── PHOTOS TAB ── */}
      {activeTab === 'photos' && (
        photoPosts.length === 0
          ? <div className="text-center py-14 text-muted-foreground"><p className="text-4xl mb-3">📸</p><p>No photos yet</p></div>
          : <div className="grid grid-cols-3 gap-1">{photoPosts.map(p => <PostCard key={p.id} post={p} viewMode="grid" />)}</div>
      )}

      {/* ── WATCH VIDEOS TAB ── */}
      {activeTab === 'watch' && (
        watchVideos.length === 0
          ? (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-4xl mb-3">▶</p>
              <p className="font-medium">No long-form videos yet</p>
              <p className="text-sm mt-1 opacity-60">Videos uploaded to Watch will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {watchVideos.map(v => {
                const thumb = (v.thumbnail_url && !v.thumbnail_url.includes('undefined'))
                  ? v.thumbnail_url
                  : v.cloudflare_uid
                    ? `https://videodelivery.net/${v.cloudflare_uid}/thumbnails/thumbnail.jpg`
                    : null
                const dur = v.duration_seconds
                  ? (() => {
                      const h = Math.floor(dur / 3600), m = Math.floor((dur % 3600) / 60), s = dur % 60
                      return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
                    })()
                  : null
                return (
                  <a key={v.id} href={`/watch/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', position: 'relative', overflow: 'hidden' }}>
                        {thumb
                          ? <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
                        }
                        {dur && <span style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 11, padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{dur}</span>}
                        {v.cloudflare_status !== 'ready' && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 11, background: 'rgba(139,92,246,0.85)', padding: '3px 8px', borderRadius: 20 }}>Processing…</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35 }}>{v.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>{(v.view_count ?? 0).toLocaleString()} views</p>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )
      )}

      {/* ── SAVED TAB ── */}
      {activeTab === 'saved' && isOwnProfile && (
        <div className="text-center py-14 text-muted-foreground">
          <p className="text-4xl mb-3">🔖</p>
          <p>No saved posts yet</p>
          <p className="text-sm mt-1 opacity-60">Posts you bookmark will appear here</p>
        </div>
      )}

      {/* ── PROFESSIONAL TAB ── */}
      {activeTab === 'professional' && (
        <div className="space-y-4">
          {du?.professional_summary && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">About</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{du.professional_summary}</p>
            </div>
          )}
          {du?.work_experience?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-1">Experience</h3>
              {du.work_experience.map((w, i) => <WorkExperienceItem key={i} item={w} />)}
            </div>
          )}
          {du?.education?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-1">Education</h3>
              {du.education.map((e, i) => <EducationItem key={i} item={e} />)}
            </div>
          )}
          {du?.skills?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {du.skills.map(s => <span key={s} className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-foreground">{s}</span>)}
              </div>
            </div>
          )}
          {!du?.professional_summary && !du?.work_experience?.length && !du?.skills?.length && (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-4xl mb-3">💼</p>
              <p>No professional info yet</p>
              {isOwnProfile && <button onClick={() => setShowEditModal(true)} className="mt-3 text-sm text-primary hover:underline">Add your experience</button>}
            </div>
          )}
        </div>
      )}

      {/* ── CELEBRATIONS TAB ── */}
      {activeTab === 'celebrations' && (
        <CelebrationsWall userId={targetId} isOwnProfile={isOwnProfile} />
      )}

      {/* ── STORE TAB ── */}
      {activeTab === 'store' && (
        <div className="text-center py-14 text-muted-foreground">
          <p className="text-4xl mb-3">🏪</p>
          <p>No products yet</p>
          {isOwnProfile && <button onClick={() => navigate('/store')} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Go to My Store</button>}
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          {du?.bio && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bio</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{du.bio}</p>
            </div>
          )}
          <div className="space-y-2">
            {du?.location && <p className="text-sm text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{du.location}</p>}
            {du?.website && <a href={du.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-2 hover:underline"><Globe className="w-4 h-4" />{du.website}</a>}
            {du?.email && <p className="text-sm text-muted-foreground">{du.email}</p>}
          </div>
          {du?.social_links && Object.entries(du.social_links).filter(([, v]) => v).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Social</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(du.social_links).filter(([, v]) => v).map(([key, url]) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-muted rounded-full text-xs text-foreground hover:bg-muted/80 capitalize">{key}</a>
                ))}
              </div>
            </div>
          )}
          {du?.created_at && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Joined {format(new Date(du.created_at), 'MMMM yyyy')}
            </p>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      {showEditModal && <EditProfileModal profileUser={du} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />}
      {showShareModal && <ShareProfileModal profileUser={du} onClose={() => setShowShareModal(false)} />}
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}
      {followModal && (
        <FollowListModal
          type={followModal}
          targetId={targetId}
          onClose={() => setFollowModal(null)}
          onNavigate={(id) => navigate(`/profile/${id}`)}
          onNavigateCompany={(handle) => navigate(`/company/${handle}`)}
        />
      )}
    </div>
  )
}
