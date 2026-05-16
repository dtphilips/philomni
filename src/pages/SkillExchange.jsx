import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Zap, Plus, X, Star, Search, MapPin, Clock, RefreshCw,
  Users, CheckCircle, ArrowRight, ChevronRight, Loader2,
  Heart, MessageSquare, Eye, Send, Upload, Edit2, Trash2,
  AlertCircle, Award, Globe,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CREATOR_SKILL_CATEGORIES = [
  { id: 'all',         label: 'All',           icon: '✨' },
  { id: 'video',       label: 'Video',         icon: '🎬' },
  { id: 'design',      label: 'Design',        icon: '🎨' },
  { id: 'writing',     label: 'Writing',       icon: '✍️' },
  { id: 'music',       label: 'Music',         icon: '🎵' },
  { id: 'photo',       label: 'Photography',   icon: '📸' },
  { id: 'tech',        label: 'Tech',          icon: '💻' },
  { id: 'social',      label: 'Social Media',  icon: '📱' },
  { id: 'voice',       label: 'Voice',         icon: '🎤' },
  { id: 'translation', label: 'Translation',   icon: '🌐' },
  { id: 'business',    label: 'Business',      icon: '📊' },
  { id: 'acting',      label: 'Acting',        icon: '🎭' },
  { id: 'other',       label: 'Other',         icon: '🔮' },
]

const PRO_SKILL_CATEGORIES = [
  { id: 'all',      label: 'All',                   icon: '✨' },
  { id: 'legal',    label: 'Legal Consulting',       icon: '⚖️' },
  { id: 'finance',  label: 'Financial Advisory',     icon: '💰' },
  { id: 'strategy', label: 'Strategy & Business',    icon: '🎯' },
  { id: 'tech',     label: 'Technical Architecture', icon: '🏗' },
  { id: 'pm',       label: 'Product Management',     icon: '📋' },
  { id: 'mktg',     label: 'Marketing Strategy',     icon: '📊' },
  { id: 'exec',     label: 'Executive Coaching',     icon: '🏆' },
  { id: 'invest',   label: 'Investment Advice',      icon: '📈' },
  { id: 'medical',  label: 'Medical Advisory',       icon: '🏥' },
  { id: 'realestate',label: 'Real Estate',           icon: '🏠' },
  { id: 'hr',       label: 'HR & Recruiting',        icon: '👥' },
  { id: 'ops',      label: 'Operations',             icon: '⚙️' },
]

// Keep backward-compatible alias (used in filter logic)
const SKILL_CATEGORIES = CREATOR_SKILL_CATEGORIES

const DELIVERY_OPTIONS = [
  { value: 1,  label: '1 day' },
  { value: 3,  label: '2–3 days' },
  { value: 7,  label: '1 week' },
  { value: 14, label: '2 weeks' },
]

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Expert', 'Professional']

const STATUS_CONFIG = {
  available: { label: 'Available',    cls: 'bg-emerald-500/20 text-emerald-400' },
  limited:   { label: 'Limited',      cls: 'bg-amber-500/20 text-amber-400' },
  busy:      { label: 'Busy',         cls: 'bg-red-500/20 text-red-400' },
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    id: 's-1', user_name: 'Kai Rodriguez', user_avatar: null, location: 'Toronto, Canada',
    offer_category: 'video', offer_title: 'Professional Video Editing (Premiere Pro)',
    offer_description: 'Cinematic edits, color grading, motion graphics, and captions. Up to 10-min videos. Delivered in 4K.',
    offer_tools: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
    offer_delivery_days: 3, offer_level: 'Professional',
    want_categories: ['design', 'social'],
    want_description: 'Logo design or social media management for my YouTube channel.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 14, rating: 4.9, review_count: 12,
  },
  {
    id: 's-2', user_name: 'Sofia Chen', user_avatar: null, location: 'Los Angeles, CA',
    offer_category: 'design', offer_title: 'Brand Identity & Logo Design',
    offer_description: 'Complete brand kits, logos in all formats (AI, SVG, PNG), color palettes, typography. Clean, modern style.',
    offer_tools: ['Illustrator', 'Figma', 'Photoshop'],
    offer_delivery_days: 7, offer_level: 'Expert',
    want_categories: ['writing', 'video'],
    want_description: 'Copywriting for my portfolio site, or short video edits for social.',
    want_flexible: false, status: 'available', simultaneous_trades: 3,
    trade_count: 28, rating: 5.0, review_count: 22,
  },
  {
    id: 's-3', user_name: 'Marcus Osei', user_avatar: null, location: 'London, UK',
    offer_category: 'music', offer_title: 'Music Production & Mixing',
    offer_description: 'Full song production, beat making, mixing & mastering. Specializes in Afrobeats, R&B, Hip-Hop. Pro tools setup.',
    offer_tools: ['Logic Pro', 'Ableton', 'FL Studio'],
    offer_delivery_days: 7, offer_level: 'Professional',
    want_categories: ['social', 'video'],
    want_description: 'Social media management or short-form content creation for my music brand.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 9, rating: 4.8, review_count: 8,
  },
  {
    id: 's-4', user_name: 'Dana Park', user_avatar: null, location: 'New York, NY',
    offer_category: 'writing', offer_title: 'Scriptwriting & Copywriting',
    offer_description: 'YouTube scripts, podcast outlines, website copy, email sequences. Hook-driven, audience-focused writing.',
    offer_tools: ['Google Docs', 'Notion', 'Hemingway App'],
    offer_delivery_days: 3, offer_level: 'Expert',
    want_categories: ['video', 'design'],
    want_description: 'Video editing for my YouTube channel, or thumbnail design.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 31, rating: 4.9, review_count: 27,
  },
  {
    id: 's-5', user_name: 'Lena Müller', user_avatar: null, location: 'Berlin, Germany',
    offer_category: 'photo', offer_title: 'Portrait & Brand Photography',
    offer_description: 'Professional photo shoots for creators, press kits, headshots. Studio or on-location in Berlin. Edited RAWs delivered.',
    offer_tools: ['Sony A7IV', 'Lightroom', 'Photoshop'],
    offer_delivery_days: 7, offer_level: 'Expert',
    want_categories: ['tech', 'design'],
    want_description: 'Website development or branding (in-person or remote trades considered).',
    want_flexible: true, status: 'available', simultaneous_trades: 1,
    trade_count: 7, rating: 4.7, review_count: 6,
  },
  {
    id: 's-6', user_name: 'Alex Nguyen', user_avatar: null, location: 'Ho Chi Minh City',
    offer_category: 'tech', offer_title: 'Web Development (React + Node)',
    offer_description: 'Landing pages, portfolio sites, web apps. React, Next.js, Tailwind. Fast delivery, clean code, mobile-first.',
    offer_tools: ['React', 'Next.js', 'Node.js', 'Tailwind'],
    offer_delivery_days: 14, offer_level: 'Expert',
    want_categories: ['design', 'writing'],
    want_description: 'UI/UX design or technical content writing for my dev blog.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 16, rating: 4.8, review_count: 14,
  },
  {
    id: 's-7', user_name: 'Priya Sharma', user_avatar: null, location: 'Mumbai, India',
    offer_category: 'social', offer_title: 'Social Media Management & Strategy',
    offer_description: 'Content calendars, posting schedules, caption writing, hashtag research, engagement growth. IG & TikTok specialist.',
    offer_tools: ['Later', 'Canva', 'CapCut', 'Meta Suite'],
    offer_delivery_days: 7, offer_level: 'Intermediate',
    want_categories: ['photo', 'video'],
    want_description: 'Content photography or video editing for the accounts I manage.',
    want_flexible: true, status: 'available', simultaneous_trades: 3,
    trade_count: 20, rating: 4.6, review_count: 17,
  },
  {
    id: 's-8', user_name: 'Carlos Rivera', user_avatar: null, location: 'Mexico City',
    offer_category: 'voice', offer_title: 'Professional Voice Over & Narration',
    offer_description: 'English & Spanish VO for ads, documentaries, audiobooks, explainer videos. Broadcast-quality home studio.',
    offer_tools: ['Rode NT1', 'Adobe Audition', 'iZotope RX'],
    offer_delivery_days: 3, offer_level: 'Professional',
    want_categories: ['writing', 'video'],
    want_description: 'Script writing for my VO demos, or video editing for my showreel.',
    want_flexible: false, status: 'available', simultaneous_trades: 2,
    trade_count: 42, rating: 5.0, review_count: 38,
  },
  {
    id: 's-9', user_name: 'Yuki Tanaka', user_avatar: null, location: 'Tokyo, Japan',
    offer_category: 'translation', offer_title: 'JP ↔ EN Translation & Subtitling',
    offer_description: 'Japanese-English translation for videos, scripts, websites, subtitles (SRT). Native Japanese, fluent English.',
    offer_tools: ['Aegisub', 'Notion', 'Final Cut Pro'],
    offer_delivery_days: 7, offer_level: 'Professional',
    want_categories: ['music', 'design'],
    want_description: 'Background music licensing or graphic design for my translation studio.',
    want_flexible: true, status: 'limited', simultaneous_trades: 1,
    trade_count: 5, rating: 4.9, review_count: 5,
  },
  {
    id: 's-10', user_name: 'Jordan Blake', user_avatar: null, location: 'Atlanta, GA',
    offer_category: 'acting', offer_title: 'Acting, UGC & On-Camera Performance',
    offer_description: 'UGC videos, ad acting, hosting, testimonials. High energy, natural delivery. 3M+ views across platforms.',
    offer_tools: ['iPhone 15 Pro', 'DJI OM6', 'Ring Light Setup'],
    offer_delivery_days: 3, offer_level: 'Expert',
    want_categories: ['video', 'music'],
    want_description: 'Professional editing for my content reel, or royalty-free music for UGC.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 19, rating: 4.7, review_count: 15,
  },
  {
    id: 's-11', user_name: 'Emma Laurent', user_avatar: null, location: 'Paris, France',
    offer_category: 'business', offer_title: 'Brand Strategy & Creator Business Consulting',
    offer_description: 'Monetization strategy, brand positioning, media kit creation, pitch deck design. 5 years brand consulting.',
    offer_tools: ['Google Slides', 'Notion', 'Canva Pro'],
    offer_delivery_days: 7, offer_level: 'Expert',
    want_categories: ['photo', 'design'],
    want_description: 'Personal brand photography or logo design for my consulting business.',
    want_flexible: true, status: 'available', simultaneous_trades: 2,
    trade_count: 11, rating: 4.8, review_count: 9,
  },
  {
    id: 's-12', user_name: 'Tyler Okafor', user_avatar: null, location: 'Lagos, Nigeria',
    offer_category: 'video', offer_title: 'YouTube Thumbnail Design & Channel Art',
    offer_description: 'Eye-catching thumbnails that drive clicks. A/B tested designs, consistent brand style, fast 24hr turnaround.',
    offer_tools: ['Photoshop', 'Canva Pro', 'Figma'],
    offer_delivery_days: 1, offer_level: 'Expert',
    want_categories: ['writing', 'voice'],
    want_description: 'YouTube script writing or VO for my explainer video series.',
    want_flexible: true, status: 'available', simultaneous_trades: 3,
    trade_count: 53, rating: 4.9, review_count: 48,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function Stars({ rating, count, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
      {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  )
}

function CatIcon({ catId }) {
  return SKILL_CATEGORIES.find(c => c.id === catId)?.icon ?? '🔮'
}

function CatLabel({ catId }) {
  return SKILL_CATEGORIES.find(c => c.id === catId)?.label ?? catId
}

function Avatar({ name, url, size = 10 }) {
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden`}
      style={{ fontSize: size <= 8 ? 14 : 18 }}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name?.[0] ?? '?'}
    </div>
  )
}

// ─── Skill Offer Card ─────────────────────────────────────────────────────────

function OfferCard({ offer, onPropose, onView, isOwn }) {
  const st = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.available
  const delivLabel = DELIVERY_OPTIONS.find(d => d.value === offer.offer_delivery_days)?.label ?? `${offer.offer_delivery_days}d`

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-all group">
      {/* Seller header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={offer.user_name} url={offer.user_avatar} size={9} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{offer.user_name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {offer.review_count > 0 && <Stars rating={offer.rating} count={offer.review_count} />}
              {offer.trade_count > 0 && <span className="text-xs text-muted-foreground">{offer.trade_count} trades</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
          {offer.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{offer.location}</span>
          )}
        </div>
      </div>

      {/* Offer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base">{CatIcon({ catId: offer.offer_category })}</span>
          <span className="text-xs font-bold text-primary uppercase tracking-wide">I Offer</span>
          <span className="text-xs text-muted-foreground ml-auto">{offer.offer_level}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">{offer.offer_title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.offer_description}</p>
        {offer.offer_tools?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {offer.offer_tools.slice(0, 4).map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-md">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Want */}
      <div className="bg-muted/30 border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base">🔄</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">I Want in Return</span>
        </div>
        {offer.want_flexible
          ? <p className="text-xs text-muted-foreground">Open to any skill — make me an offer!</p>
          : (
            <>
              <div className="flex flex-wrap gap-1 mb-1">
                {(offer.want_categories ?? []).map(c => (
                  <span key={c} className="px-1.5 py-0.5 bg-muted rounded text-xs text-foreground">
                    {CatIcon({ catId: c })} {CatLabel({ catId: c })}
                  </span>
                ))}
              </div>
              {offer.want_description && <p className="text-xs text-muted-foreground line-clamp-2">{offer.want_description}</p>}
            </>
          )
        }
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{delivLabel}</span>
        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{offer.simultaneous_trades === 99 ? 'Unlimited' : offer.simultaneous_trades} trade{offer.simultaneous_trades !== 1 ? 's' : ''} at once</span>
      </div>

      {/* Actions */}
      {!isOwn && (
        <div className="flex gap-2 mt-auto pt-1">
          <button onClick={() => onView(offer)}
            className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            View Profile
          </button>
          <button onClick={() => onPropose(offer)}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
            Propose Trade <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
      {isOwn && (
        <div className="flex gap-2 mt-auto pt-1">
          <span className="flex-1 text-center py-2 text-xs text-muted-foreground bg-muted/40 rounded-xl">Your offer</span>
        </div>
      )}
    </div>
  )
}

// ─── Propose Trade Modal ──────────────────────────────────────────────────────

function ProposeModal({ target, onClose, onSubmit, submitting }) {
  const [offerDesc, setOfferDesc] = useState('')
  const [timeline, setTimeline]   = useState('1 week')
  const [message, setMessage]     = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ offer_description: offerDesc, timeline, message })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Propose a Trade</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {/* Target offer summary */}
        <div className="p-4 bg-primary/5 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">Trading with <span className="font-semibold text-foreground">{target.user_name}</span></p>
          <p className="text-sm font-semibold text-foreground">{target.offer_title}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">What you'll offer in return *</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
              rows={3} required value={offerDesc} onChange={e => setOfferDesc(e.target.value)}
              placeholder="Describe exactly what you'll deliver in exchange..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Your delivery timeline</label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              value={timeline} onChange={e => setTimeline(e.target.value)}>
              <option>1 day</option><option>2–3 days</option><option>1 week</option><option>2 weeks</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Message to {target.user_name}</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
              rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder={`Hi ${target.user_name.split(' ')[0]}, I'd love to trade skills with you! I can offer...`} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Offer Form Modal (multi-step) ────────────────────────────────────────────

function OfferModal({ onClose, onSubmit, saving }) {
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState({
    offer_category: 'video', offer_title: '', offer_description: '',
    offer_tools: '', offer_delivery_days: 3, offer_level: 'Intermediate',
    want_flexible: true, want_categories: [], want_description: '',
    simultaneous_trades: 2, status: 'available', location: '', languages: '',
  })
  const [wantCats, setWantCats] = useState([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleWantCat = (id) => {
    setWantCats(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = () => {
    onSubmit({
      ...form,
      offer_tools: form.offer_tools.split(',').map(t => t.trim()).filter(Boolean),
      want_categories: wantCats,
    })
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const sel = inp + " cursor-pointer"

  const STEPS = ['What I Offer', 'What I Want', 'Availability', 'Preview']

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-xl my-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Offer a Skill</h2>
            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}: {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 px-5 pt-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* ── Step 1: What I Offer ── */}
          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Skill Category *</label>
                <select className={sel} value={form.offer_category} onChange={e => set('offer_category', e.target.value)}>
                  {SKILL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Skill Title *</label>
                <input className={inp} required value={form.offer_title} onChange={e => set('offer_title', e.target.value)} placeholder="e.g. Professional Video Editing (Premiere Pro)" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description *</label>
                <textarea className={inp + ' resize-none'} rows={3} value={form.offer_description} onChange={e => set('offer_description', e.target.value)} placeholder="What exactly do you offer? Your experience level, style, what's included..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Tools / Software (comma-separated)</label>
                <input className={inp} value={form.offer_tools} onChange={e => set('offer_tools', e.target.value)} placeholder="Premiere Pro, After Effects, DaVinci..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Typical Delivery</label>
                  <select className={sel} value={form.offer_delivery_days} onChange={e => set('offer_delivery_days', parseInt(e.target.value))}>
                    {DELIVERY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Skill Level</label>
                  <select className={sel} value={form.offer_level} onChange={e => set('offer_level', e.target.value)}>
                    {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Simultaneous Trades</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 99].map(n => (
                    <button key={n} type="button" onClick={() => set('simultaneous_trades', n)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.simultaneous_trades === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {n === 99 ? '∞' : n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: What I Want ── */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">Open to any skill</p>
                  <p className="text-xs text-muted-foreground">Let others make you any offer</p>
                </div>
                <button type="button" onClick={() => set('want_flexible', !form.want_flexible)}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.want_flexible ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.want_flexible ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {!form.want_flexible && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Preferred skill categories (up to 3)</label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <button key={c.id} type="button" onClick={() => toggleWantCat(c.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${wantCats.includes(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                          {c.icon} {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Describe what you need</label>
                    <textarea className={inp + ' resize-none'} rows={2} value={form.want_description} onChange={e => set('want_description', e.target.value)} placeholder="e.g. A logo for my YouTube channel, modern style, 3 concepts..." />
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Step 3: Availability ── */}
          {step === 3 && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Availability Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => set('status', k)}
                      className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${form.status === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Location (optional)</label>
                <input className={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Languages spoken (comma-separated)</label>
                <input className={inp} value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Spanish, French..." />
              </div>
            </>
          )}

          {/* ── Step 4: Preview ── */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">Your offer will look like this:</p>
              <div className="border border-primary/30 rounded-2xl overflow-hidden">
                <OfferCard
                  offer={{
                    ...form,
                    user_name: 'You',
                    user_avatar: null,
                    want_categories: wantCats,
                    offer_tools: form.offer_tools.split(',').map(t => t.trim()).filter(Boolean),
                    trade_count: 0, rating: 5, review_count: 0,
                  }}
                  onPropose={() => {}} onView={() => {}} isOwn={true}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1
              ? <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">← Back</button>
              : <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            }
            {step < STEPS.length
              ? <button type="button" onClick={() => setStep(s => s + 1)} disabled={!form.offer_title || !form.offer_description}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
                  Next →
                </button>
              : <button type="button" onClick={handleSubmit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {saving ? 'Posting…' : 'Post Offer'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Wanted Form ──────────────────────────────────────────────────────────────

function WantedForm({ onSubmit, saving }) {
  const [form, setForm] = useState({ need: '', offer: '', timeline: '1 week', open_to_pay: false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 max-w-xl">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">I need: *</label>
        <textarea className={inp + ' resize-none'} rows={2} value={form.need} onChange={e => set('need', e.target.value)} placeholder="e.g. A logo designed for my YouTube cooking channel, minimalist style..." required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">I can offer in return:</label>
        <input className={inp} value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. Video editing, Copywriting, Photography..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Timeline needed</label>
          <select className={inp + ' cursor-pointer'} value={form.timeline} onChange={e => set('timeline', e.target.value)}>
            <option>ASAP</option><option>1 day</option><option>2–3 days</option><option>1 week</option><option>2 weeks</option><option>Flexible</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <input type="checkbox" id="pay" checked={form.open_to_pay} onChange={e => set('open_to_pay', e.target.checked)} className="rounded" />
          <label htmlFor="pay" className="text-xs text-muted-foreground cursor-pointer">Open to paying if no trade</label>
        </div>
      </div>
      <button onClick={() => onSubmit(form)} disabled={!form.need || saving}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {saving ? 'Posting…' : 'Post to Wanted Board'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SkillExchange() {
  const { user } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()
  const isPro = mode === 'pro'
  const activeCategories = isPro ? PRO_SKILL_CATEGORIES : CREATOR_SKILL_CATEGORIES

  const [tab, setTab]             = useState('browse')
  const [offers, setOffers]       = useState([])
  const [myOffers, setMyOffers]   = useState([])
  const [myTrades, setMyTrades]   = useState([])
  const [wanted, setWanted]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [availFilter, setAvailFilter] = useState('all')

  const [showOffer, setShowOffer]     = useState(false)
  const [proposing, setProposing]     = useState(null)  // the offer being proposed to
  const [saving, setSaving]           = useState(false)
  const [submitProp, setSubmitProp]   = useState(false)
  const [toast, setToast]             = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load all data
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      const [offersRes, wantedRes] = await Promise.all([
        supabase.from('skill_exchanges').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('wanted_skills').select('*').order('created_at', { ascending: false }).limit(20).catch(() => ({ data: [] })),
      ])
      const dbOffers = offersRes.data ?? []
      const dbIds    = new Set(dbOffers.map(o => o.id))
      const merged   = [...dbOffers, ...SAMPLES.filter(s => !dbIds.has(s.id))]
      setOffers(merged)
      if (user?.id) {
        setMyOffers(merged.filter(o => o.user_id === user.id))
        // Load my trades
        const tradesRes = await supabase.from('trades').select('*')
          .or(`party_a_id.eq.${user.id},party_b_id.eq.${user.id}`)
          .order('created_at', { ascending: false }).limit(20)
        setMyTrades(tradesRes.data ?? [])
      }
      setWanted(wantedRes.data ?? [])
      setLoading(false)
    }
    loadAll()
  }, [user?.id])

  const filteredOffers = useMemo(() => {
    const q = search.toLowerCase()
    return offers.filter(o => {
      if (catFilter !== 'all' && o.offer_category !== catFilter) return false
      if (availFilter !== 'all' && o.status !== availFilter) return false
      if (q && !o.offer_title?.toLowerCase().includes(q) && !o.offer_description?.toLowerCase().includes(q) && !o.user_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [offers, catFilter, availFilter, search])

  const handlePostOffer = useCallback(async (payload) => {
    setSaving(true)
    try {
      const { data } = await supabase.from('skill_exchanges').insert({
        ...payload,
        user_id: user?.id,
        user_name: user?.full_name ?? user?.email ?? 'Creator',
        user_avatar: user?.avatar_url ?? null,
        trade_count: 0, rating: 0, review_count: 0,
      }).select().single()
      if (data) {
        setOffers(prev => [data, ...prev])
        setMyOffers(prev => [data, ...prev])
      }
      setShowOffer(false)
      showToast('Skill offer posted! 🎉')
    } catch (e) { console.error(e); showToast('Failed to post. Try again.', 'error') }
    setSaving(false)
  }, [user])

  const handlePropose = useCallback(async (payload) => {
    setSubmitProp(true)
    try {
      await supabase.from('trade_proposals').insert({
        exchange_id: proposing.id,
        proposer_id: user?.id,
        proposer_name: user?.full_name ?? 'Creator',
        proposer_avatar: user?.avatar_url ?? null,
        ...payload,
        status: 'pending',
      })
      setProposing(null)
      showToast(`Trade proposal sent to ${proposing.user_name}! 🤝`)
    } catch (e) { console.error(e); showToast('Failed to send. Try again.', 'error') }
    setSubmitProp(false)
  }, [proposing, user])

  const handlePostWanted = useCallback(async (payload) => {
    setSaving(true)
    try {
      const { data } = await supabase.from('wanted_skills').insert({
        ...payload,
        user_id: user?.id,
        user_name: user?.full_name ?? 'Creator',
        user_avatar: user?.avatar_url ?? null,
      }).select().single()
      if (data) setWanted(prev => [data, ...prev])
      showToast('Posted to Wanted board! 📋')
    } catch (e) { console.error(e); showToast('Failed to post. Try again.', 'error') }
    setSaving(false)
  }, [user])

  const totalTrades  = offers.reduce((s, o) => s + (o.trade_count ?? 0), 0)
  const totalListings = offers.length

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/20 via-violet-500/10 to-pink-500/10 border border-primary/20 rounded-3xl p-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #7c3aed 0%, transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isPro ? 'Consulting Exchange' : 'Skill Exchange'}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mb-5 max-w-md">
            {isPro
              ? <>Trade professional expertise. No invoices. No fees. <strong className="text-foreground">Just value for value.</strong></>
              : <>Trade your skills. Get what you need. <strong className="text-foreground">No money required.</strong> Connect with creators worldwide and build each other up.</>
            }
          </p>

          {/* Stats */}
          <div className="flex items-center gap-5 mb-5 flex-wrap">
            {[
              { label: 'Active Offers',      value: fmt(totalListings) },
              { label: 'Trades Completed',   value: fmt(totalTrades) },
              { label: 'Skill Categories',   value: '12+' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowOffer(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Offer a Skill
            </button>
            <button onClick={() => setTab('browse')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/50 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors">
              <Search className="w-4 h-4" /> Browse Skills
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-full max-w-lg">
        {[
          { id: 'browse', label: '🔍 Browse Offers' },
          { id: 'mine',   label: '📋 My Offers' },
          { id: 'trades', label: '🤝 My Trades' },
          { id: 'wanted', label: '💡 Wanted' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ────────────────────────────────────────────────────── */}
      {tab === 'browse' && (
        <div className="space-y-5">
          {/* Search + availability */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills, tools, creators..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" />
            </div>
            <select value={availFilter} onChange={e => setAvailFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer">
              <option value="all">Any Availability</option>
              <option value="available">Available Now</option>
              <option value="limited">Limited</option>
              <option value="busy">Busy</option>
            </select>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {activeCategories.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border ${catFilter === cat.id ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex gap-2"><div className="w-9 h-9 bg-muted rounded-full" /><div className="flex-1"><div className="h-4 bg-muted rounded mb-1" /><div className="h-3 bg-muted rounded w-2/3" /></div></div>
                  <div className="h-20 bg-muted rounded-xl" /><div className="h-14 bg-muted rounded-xl" /><div className="h-10 bg-muted rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-foreground font-semibold mb-1">No offers found</p>
              <p className="text-muted-foreground text-sm mb-4">Try a different category or search term</p>
              <button onClick={() => { setSearch(''); setCatFilter('all') }}
                className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOffers.map(o => (
                  <OfferCard
                    key={o.id} offer={o}
                    onPropose={setProposing}
                    onView={off => navigate(off.user_id ? `/seller/${off.user_id}` : '#')}
                    isOwn={o.user_id === user?.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MY OFFERS TAB ─────────────────────────────────────────────────── */}
      {tab === 'mine' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Your active skill offers</p>
            <button onClick={() => setShowOffer(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Offer
            </button>
          </div>
          {myOffers.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-foreground font-semibold mb-1">No offers yet</p>
              <p className="text-muted-foreground text-sm mb-4">Share a skill you can offer to other creators</p>
              <button onClick={() => setShowOffer(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                Offer a Skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myOffers.map(o => (
                <div key={o.id} className="relative">
                  <OfferCard offer={o} onPropose={() => {}} onView={() => {}} isOwn={true} />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button className="w-7 h-7 rounded-lg bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors">
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY TRADES TAB ─────────────────────────────────────────────────── */}
      {tab === 'trades' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Active & completed trades</p>
          {myTrades.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-foreground font-semibold mb-1">No trades yet</p>
              <p className="text-muted-foreground text-sm mb-4">Browse offers and propose a trade to get started</p>
              <button onClick={() => setTab('browse')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                Browse Offers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrades.map(t => {
                const isA   = t.party_a_id === user?.id
                const myOff = isA ? t.party_a_offer : t.party_b_offer
                const thOff = isA ? t.party_b_offer : t.party_a_offer
                const myDone = isA ? t.party_a_delivered : t.party_b_delivered
                const thDone = isA ? t.party_b_delivered : t.party_a_delivered
                return (
                  <div key={t.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">You: {myOff ?? 'Offer pending'}</p>
                      <p className="text-xs text-muted-foreground truncate">They: {thOff ?? 'Offer pending'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className={myDone ? 'text-emerald-400' : ''}>Your side: {myDone ? '✓ Delivered' : '⏳ Pending'}</span>
                        <span className={thDone ? 'text-emerald-400' : ''}>Their side: {thDone ? '✓ Delivered' : '⏳ Pending'}</span>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/trade/${t.id}`)}
                      className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex-shrink-0 flex items-center gap-1">
                      View <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── WANTED TAB ────────────────────────────────────────────────────── */}
      {tab === 'wanted' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Post what you need</p>
            <WantedForm onSubmit={handlePostWanted} saving={saving} />
          </div>

          {/* Board */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Wanted Board</p>
            {wanted.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                <p className="text-3xl mb-2">💡</p>
                <p className="text-muted-foreground text-sm">No requests yet. Be the first to post!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {wanted.map((w, i) => (
                  <div key={w.id ?? i} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={w.user_name} url={w.user_avatar} size={7} />
                      <span className="text-sm font-medium text-foreground">{w.user_name}</span>
                      {w.open_to_pay && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full ml-auto">Open to pay</span>}
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Needs:</p>
                      <p className="text-sm text-foreground">{w.need}</p>
                    </div>
                    {w.offer && (
                      <div className="bg-primary/5 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Can offer:</p>
                        <p className="text-sm text-foreground">{w.offer}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{w.timeline}</span>
                      <button className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Respond
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showOffer && (
        <OfferModal onClose={() => setShowOffer(false)} onSubmit={handlePostOffer} saving={saving} />
      )}
      {proposing && (
        <ProposeModal
          target={proposing}
          onClose={() => setProposing(null)}
          onSubmit={handlePropose}
          submitting={submitProp}
        />
      )}
    </div>
  )
}
