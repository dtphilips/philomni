import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Rocket, Plus, Loader2, X, Eye, DollarSign, ChevronDown, Check,
  ArrowLeft, ArrowRight, Users, Target, Lightbulb, UploadCloud,
  Globe, Lock, Zap, TrendingUp, Handshake, Heart,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Tech', 'Creative / Media', 'Fashion', 'Music', 'Education', 'Food & Beverage', 'Health', 'Social Impact', 'Finance', 'Other']
const STAGES     = ['Idea', 'MVP', 'Revenue', 'Scaling']
const SEEKING    = [
  { id: 'investment',    label: 'Investment',       emoji: '💰' },
  { id: 'cofounder',     label: 'Co-Founder',       emoji: '🤝' },
  { id: 'mentorship',    label: 'Mentorship',        emoji: '🧠' },
  { id: 'brand',         label: 'Brand Partner',     emoji: '🏢' },
  { id: 'team',          label: 'Team Members',      emoji: '👥' },
  { id: 'talent',        label: 'Creative Talent',   emoji: '🎨' },
]
const VISIBILITY_OPTS = [
  { id: 'public',    icon: Globe,    label: 'Public',          desc: 'Anyone on Philomni can discover this pitch' },
  { id: 'smartmatch',icon: Zap,      label: 'SmartMatch Only', desc: 'Only surfaces in AI matching results' },
  { id: 'private',   icon: Lock,     label: 'Private',         desc: 'Only people you directly invite' },
]
const STATUS_COLORS = {
  draft:    'bg-muted text-muted-foreground border-border',
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const SAMPLE_PITCHES = [
  {
    id: 's1', title: 'CreatorPay — Instant Payment Rails for African Creators',
    tagline: 'We help 10M+ African creators get paid in seconds, not weeks.',
    category: 'Fintech', stage: 'MVP', seeking: ['investment', 'cofounder'],
    funding_goal: 75000, views: 340, interests: 12,
    founder_name: 'Adaeze Okafor', founder_location: 'Lagos, Nigeria', founder_avatar: '👩🏿',
  },
  {
    id: 's2', title: 'StyleVault Africa — Premium Fashion Resale Platform',
    tagline: 'The luxury resale market for Africa\'s growing middle class.',
    category: 'Fashion', stage: 'Revenue', seeking: ['investment', 'brand'],
    funding_goal: 250000, views: 512, interests: 28,
    founder_name: 'Kwame Asante', founder_location: 'Accra, Ghana', founder_avatar: '👨🏿',
  },
  {
    id: 's3', title: 'TuneHive — Collaborative Music Production Network',
    tagline: 'Where producers and artists co-create and split royalties fairly.',
    category: 'Music', stage: 'Idea', seeking: ['cofounder', 'team', 'mentorship'],
    funding_goal: null, views: 189, interests: 7,
    founder_name: 'Zara Williams', founder_location: 'London, UK', founder_avatar: '👩🏾',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ label }) {
  return <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{label}</span>
}

function StageBadge({ label }) {
  const colors = { Idea: 'bg-violet-500/15 text-violet-400', MVP: 'bg-blue-500/15 text-blue-400', Revenue: 'bg-emerald-500/15 text-emerald-400', Scaling: 'bg-orange-500/15 text-orange-400' }
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colors[label] ?? 'bg-muted text-muted-foreground'}`}>{label}</span>
}

function PitchCard({ pitch, onInterest }) {
  const [interested, setInterested] = useState(false)

  const handleInterest = () => {
    setInterested(true)
    onInterest?.(pitch)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          {pitch.founder_avatar ?? '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground leading-tight">{pitch.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pitch.founder_name} · {pitch.founder_location}</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-sm text-muted-foreground italic">"{pitch.tagline}"</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {pitch.category && <CategoryBadge label={pitch.category} />}
        {pitch.stage    && <StageBadge    label={pitch.stage}    />}
        {pitch.funding_goal && (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
            Seeking ${(pitch.funding_goal / 1000).toFixed(0)}K
          </span>
        )}
      </div>

      {/* Seeking tags */}
      {pitch.seeking?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pitch.seeking.map(s => {
            const item = SEEKING.find(x => x.id === s)
            if (!item) return null
            return (
              <span key={s} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                {item.emoji} {item.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Stats + action */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {pitch.views ?? 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {pitch.interests ?? 0} interested</span>
        </div>
        <button
          onClick={handleInterest}
          disabled={interested}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition ${
            interested
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {interested ? <><Check className="w-3.5 h-3.5" /> Interest Sent</> : 'Express Interest'}
        </button>
      </div>
    </div>
  )
}

// ─── Multi-step Pitch Form ────────────────────────────────────────────────────

const BLANK_FORM = {
  title: '', tagline: '', category: '', stage: '',
  problem: '', solution: '', why_you: '', traction: '',
  seeking: [], funding_goal: '', equity: '',
  cofounder_skills: '', visibility: 'public',
}

function PitchForm({ onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(BLANK_FORM)
  const [posting, setPosting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSeeking = (id) => set('seeking', form.seeking.includes(id) ? form.seeking.filter(x => x !== id) : [...form.seeking, id])

  const canNext = {
    1: form.title.trim() && form.tagline.trim() && form.category && form.stage,
    2: form.problem.trim() && form.solution.trim() && form.why_you.trim(),
    3: form.seeking.length > 0,
    4: true,
    5: true,
  }

  const handleSubmit = async () => {
    setPosting(true)
    await onSubmit(form)
    setPosting(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-foreground">Submit a Pitch</h2>
            <p className="text-xs text-muted-foreground">Step {step} of 5</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="px-5 pb-5 pt-5 space-y-4">
          {/* Step 1 — The Hook */}
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Pitch Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title} onChange={e => set('title', e.target.value.slice(0, 60))}
                  placeholder="e.g. CreatorPay — Instant Payments for African Creators"
                  className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{form.title.length}/60</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">One-liner Pitch <span className="text-red-400">*</span></label>
                <input
                  value={form.tagline} onChange={e => set('tagline', e.target.value.slice(0, 120))}
                  placeholder="One sentence that captures the essence of your idea"
                  className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{form.tagline.length}/120</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category <span className="text-red-400">*</span></label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Stage <span className="text-red-400">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => set('stage', s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.stage === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border hover:border-primary/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2 — The Story */}
          {step === 2 && (
            <>
              {[
                { key: 'problem',   label: 'Problem you\'re solving', placeholder: 'What pain point or gap does this address?', required: true },
                { key: 'solution',  label: 'Your solution',           placeholder: 'How do you solve it uniquely?', required: true },
                { key: 'why_you',   label: 'Why you?',                placeholder: 'Why are you the right person to build this?', required: true },
                { key: 'traction',  label: 'Traction so far',         placeholder: 'Any early users, revenue, validation? (optional)', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    {f.label} {f.required && <span className="text-red-400">*</span>}
                  </label>
                  <textarea value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} rows={3}
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                </div>
              ))}
            </>
          )}

          {/* Step 3 — What You Need */}
          {step === 3 && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">What are you seeking? <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {SEEKING.map(s => (
                    <button key={s.id} onClick={() => toggleSeeking(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.seeking.includes(s.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border hover:border-primary/40'
                      }`}>
                      <span>{s.emoji}</span> {s.label}
                      {form.seeking.includes(s.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              {form.seeking.includes('investment') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Funding goal ($)</label>
                    <input type="number" value={form.funding_goal} onChange={e => set('funding_goal', e.target.value)}
                      placeholder="e.g. 50000" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Equity offered (%)</label>
                    <input type="number" value={form.equity} onChange={e => set('equity', e.target.value)}
                      placeholder="e.g. 10" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
              )}
              {form.seeking.includes('cofounder') && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Skills needed in co-founder</label>
                  <input value={form.cofounder_skills} onChange={e => set('cofounder_skills', e.target.value)}
                    placeholder="e.g. Technical / Engineering background" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              )}
            </>
          )}

          {/* Step 4 — Media */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Attach supporting materials to make your pitch stand out. (Optional)</p>
              {[
                { icon: '📄', label: 'Pitch Deck', desc: 'PDF up to 20MB', accept: '.pdf' },
                { icon: '🎬', label: 'Demo Video', desc: 'MP4 / MOV up to 100MB', accept: 'video/*' },
                { icon: '🖼️', label: 'Screenshots', desc: 'Up to 5 images', accept: 'image/*' },
              ].map(m => (
                <label key={m.label} className="flex items-center gap-4 bg-muted border border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <input type="file" className="hidden" accept={m.accept} />
                </label>
              ))}
            </div>
          )}

          {/* Step 5 — Visibility */}
          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Who can discover your pitch?</p>
              {VISIBILITY_OPTS.map(v => {
                const Icon = v.icon
                return (
                  <button key={v.id} onClick={() => set('visibility', v.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      form.visibility === v.id ? 'bg-primary/10 border-primary' : 'bg-muted border-border hover:border-primary/40'
                    }`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${form.visibility === v.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${form.visibility === v.id ? 'text-primary' : 'text-foreground'}`}>{v.label}</p>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                    </div>
                    {form.visibility === v.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext[step]}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={posting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4" /> Launch Pitch</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PitchVault() {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState('browse')  // browse | mine
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.from('pitches').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setPitches(data ?? []); setLoading(false) })
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleSubmit = async (form) => {
    const { data } = await supabase.from('pitches').insert({
      title: form.title, description: form.tagline,
      category: form.category, stage: form.stage,
      seeking: form.seeking, funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : null,
      visibility: form.visibility, status: 'pending',
      created_by: user?.id,
    }).select().single()
    if (data) setPitches(p => [data, ...p])
    setShowForm(false)
    showToast('Your pitch is live! 🚀')
  }

  const allPitches = pitches.length > 0 ? pitches : SAMPLE_PITCHES
  const myPitches  = pitches.filter(p => p.created_by === user?.id)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none whitespace-nowrap">
          {toast}
        </div>
      )}

      {showForm && <PitchForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}

      {/* Header */}
      <div className="text-center py-8 px-4 bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/20 rounded-3xl">
        <div className="text-4xl mb-3">🚀</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Pitch Vault</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-1">Where ideas meet investors, partners, and supporters.</p>
        <p className="text-muted-foreground/70 text-xs">Your idea deserves to be seen by the right people.</p>
      </div>

      {/* Two CTA cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 space-y-3">
          <div className="text-3xl">💡</div>
          <h3 className="font-bold text-foreground">Have an idea?</h3>
          <p className="text-sm text-muted-foreground">Submit your pitch and get discovered by investors, co-founders, and collaborators on Philomni.</p>
          <button onClick={() => setShowForm(true)} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2">
            <Rocket className="w-4 h-4" /> Submit a Pitch
          </button>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="font-bold text-foreground">Browse Opportunities</h3>
          <p className="text-sm text-muted-foreground">Are you an investor, brand, or collaborator? Browse pitches and find your next opportunity.</p>
          <button onClick={() => setTab('browse')} className="w-full border border-primary text-primary text-sm font-semibold py-3 rounded-xl hover:bg-primary/5 transition flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" /> Browse Pitches
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
        {[{ id: 'browse', label: 'All Pitches' }, { id: 'mine', label: 'My Pitches' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : tab === 'browse' ? (
        <div className="space-y-4">
          {allPitches.map(p => (
            <PitchCard key={p.id} pitch={p} onInterest={(pitch) => showToast(`Interest sent to ${pitch.founder_name ?? 'this founder'}!`)} />
          ))}
        </div>
      ) : myPitches.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground">No pitches yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Your submitted pitches will appear here</p>
          <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition">
            Submit Your First Pitch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myPitches.map(p => (
            <PitchCard key={p.id} pitch={p} />
          ))}
        </div>
      )}
    </div>
  )
}
