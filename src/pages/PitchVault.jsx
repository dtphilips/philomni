import React, { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Rocket, Loader2, X, Eye, Check, ArrowLeft, ArrowRight,
  UploadCloud, Globe, Lock, Zap, TrendingUp, Heart,
  Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, MessageSquare,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Tech', 'Creative / Media', 'Fashion', 'Music', 'Education',
  'Food & Beverage', 'Health', 'Social Impact', 'Finance', 'Fintech', 'Other']
const STAGES  = ['Idea', 'MVP', 'Revenue', 'Scaling']
const SEEKING = [
  { id: 'investment', label: 'Investment',    emoji: '💰' },
  { id: 'cofounder',  label: 'Co-Founder',    emoji: '🤝' },
  { id: 'mentorship', label: 'Mentorship',    emoji: '🧠' },
  { id: 'brand',      label: 'Brand Partner', emoji: '🏢' },
  { id: 'team',       label: 'Team Members',  emoji: '👥' },
  { id: 'talent',     label: 'Creative Talent',emoji: '🎨' },
]
const VISIBILITY_OPTS = [
  { id: 'public',     icon: Globe, label: 'Public',          desc: 'Anyone on Philomni can discover this pitch' },
  { id: 'smartmatch', icon: Zap,   label: 'SmartMatch Only', desc: 'Only surfaces in AI matching results' },
  { id: 'private',    icon: Lock,  label: 'Private',         desc: 'Only people you directly invite' },
]

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
    tagline: "The luxury resale market for Africa's growing middle class.",
    category: 'Fashion', stage: 'Revenue', seeking: ['investment', 'brand'],
    funding_goal: 250000, views: 512, interests: 28,
    founder_name: 'Kwame Asante', founder_location: 'Accra, Ghana', founder_avatar: '👨🏿',
  },
  {
    id: 's3', title: 'TuneHive — Collaborative Music Production Network',
    tagline: 'Where producers and artists co-create and split royalties fairly.',
    category: 'Music', stage: 'Idea', seeking: ['cofounder', 'team'],
    funding_goal: null, views: 189, interests: 7,
    founder_name: 'Zara Williams', founder_location: 'London, UK', founder_avatar: '👩🏾',
  },
]

const BLANK_FORM = {
  title: '', tagline: '', category: '', stage: '',
  problem: '', solution: '', why_you: '', traction: '',
  seeking: [], funding_goal: '', equity: '', cofounder_skills: '',
  visibility: 'public',
}

const POWER_WORDS = ['first','only','instant','proven','ai','platform','global',
  'million','billion','transform','disrupt','fastest','largest','only']

// ─── Score helpers ────────────────────────────────────────────────────────────

function calcPitchScore(form) {
  const s = { hook: 0, problem: 0, solution: 0, traction: 0 }
  const t = form.title.trim(), tg = form.tagline.trim()

  // Hook: 0-25
  if (t.length >= 5)  s.hook += 5
  if (t.length >= 20) s.hook += 5
  if (t.length >= 40) s.hook += 3
  if (POWER_WORDS.some(w => t.toLowerCase().includes(w))) s.hook += 5
  if (tg.length >= 20) s.hook += 4
  if (tg.length >= 60) s.hook += 3

  // Problem: 0-25
  if (form.problem.trim().length >= 30)  s.problem += 8
  if (form.problem.trim().length >= 100) s.problem += 9
  if (form.category) s.problem += 5
  if (form.stage)    s.problem += 3

  // Solution: 0-25
  if (form.solution.trim().length >= 30)  s.solution += 8
  if (form.solution.trim().length >= 100) s.solution += 9
  if (form.why_you.trim().length >= 30)   s.solution += 8

  // Traction: 0-25
  if (form.seeking.length > 0)              s.traction += 5
  if (form.traction.trim().length >= 20)    s.traction += 10
  if (form.traction.trim().length >= 80)    s.traction += 7
  if (form.funding_goal)                    s.traction += 3

  Object.keys(s).forEach(k => { s[k] = Math.min(s[k], 25) })
  return { ...s, total: Object.values(s).reduce((a, b) => a + b, 0) }
}

function getGrade(score) {
  if (score >= 90) return { g: 'A+', cls: 'text-emerald-400', bar: 'bg-emerald-400' }
  if (score >= 80) return { g: 'A',  cls: 'text-emerald-400', bar: 'bg-emerald-400' }
  if (score >= 70) return { g: 'B+', cls: 'text-blue-400',    bar: 'bg-blue-400' }
  if (score >= 60) return { g: 'B',  cls: 'text-blue-400',    bar: 'bg-blue-400' }
  if (score >= 50) return { g: 'C+', cls: 'text-amber-400',   bar: 'bg-amber-400' }
  if (score >= 40) return { g: 'C',  cls: 'text-amber-400',   bar: 'bg-amber-400' }
  return { g: 'D', cls: 'text-red-400', bar: 'bg-red-400' }
}

// ─── AI helpers ───────────────────────────────────────────────────────────────

async function callLLM(prompt, schema) {
  const body = { prompt }
  if (schema) body.response_json_schema = schema
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ─── AI Score Panel ───────────────────────────────────────────────────────────

function ScorePanel({ score }) {
  const { g, cls, bar } = getGrade(score.total)
  const sections = [
    { label: 'Hook strength',      key: 'hook' },
    { label: 'Problem clarity',    key: 'problem' },
    { label: 'Solution uniqueness',key: 'solution' },
    { label: 'Traction/credibility',key: 'traction' },
  ]
  return (
    <div className="space-y-4">
      {/* Total score */}
      <div className="text-center py-3">
        <div className={`text-4xl font-black ${cls}`}>{score.total}<span className="text-lg font-normal text-muted-foreground">/100</span></div>
        <div className={`text-sm font-bold mt-1 px-3 py-0.5 rounded-full inline-block ${cls} bg-current/10`}>{g}</div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${score.total}%` }} />
        </div>
      </div>
      {/* Sub-scores */}
      <div className="space-y-2">
        {sections.map(({ label, key }) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{score[key]}/25</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(score[key] / 25) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">Scores update as you write</p>
    </div>
  )
}

// ─── Improve Field Button ─────────────────────────────────────────────────────

function ImproveField({ fieldName, fieldLabel, currentValue, onApply }) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)

  const improve = async () => {
    if (!currentValue.trim()) return
    setLoading(true)
    try {
      const data = await callLLM(
        `You are a pitch coach. Improve this "${fieldLabel}" field for a startup pitch.
Current text: "${currentValue}"
Provide exactly 3 improved versions that are more compelling, specific, and clear.
For "one-liner" keep under 120 characters. Be direct and impactful.`,
        { type: 'object', properties: { suggestions: { type: 'array', items: { type: 'string' } } }, required: ['suggestions'] }
      )
      setSuggestions(data.suggestions ?? [])
      setOpen(true)
    } catch { /* fail silently */ }
    setLoading(false)
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={loading ? undefined : improve}
        disabled={!currentValue.trim() || loading}
        className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 disabled:opacity-40 transition"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {loading ? 'Improving…' : '✨ Improve with AI'}
      </button>
      {open && suggestions.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Click to apply:</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onApply(s); setSuggestions([]); setOpen(false) }}
              className="w-full text-left text-xs bg-primary/10 text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/20 transition"
            >
              {s}
            </button>
          ))}
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition">Dismiss</button>
        </div>
      )}
    </div>
  )
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ form, onClose }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const data = await callLLM(
          `You are an experienced venture capitalist and pitch coach. Review this startup pitch comprehensively.

PITCH:
Title: ${form.title}
One-liner: ${form.tagline}
Category: ${form.category} | Stage: ${form.stage}
Problem: ${form.problem}
Solution: ${form.solution}
Why us: ${form.why_you}
Traction: ${form.traction || 'None provided'}
Seeking: ${form.seeking.join(', ')}
Funding goal: ${form.funding_goal ? '$' + form.funding_goal : 'N/A'}

Provide honest, specific, actionable feedback.`,
          {
            type: 'object',
            properties: {
              score: { type: 'number' },
              grade: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
              missing: { type: 'array', items: { type: 'string' } },
              investor_perspective: { type: 'string' },
              revised_one_liner: { type: 'string' },
              verdict: { type: 'string' },
            },
            required: ['score', 'grade', 'strengths', 'improvements', 'verdict'],
          }
        )
        setResult(data)
      } catch {
        setResult({ score: 0, grade: '?', strengths: [], improvements: ['Could not connect to AI. Please try again.'], missing: [], verdict: 'Error' })
      }
      setLoading(false)
    }
    run()
  }, [])

  const verdictIcon = result?.verdict?.toLowerCase().includes('ready')
    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    : result?.verdict?.toLowerCase().includes('major')
    ? <XCircle className="w-5 h-5 text-red-400" />
    : <AlertTriangle className="w-5 h-5 text-amber-400" />

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Pitch Review</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">Analysing your pitch…</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Score */}
            <div className="flex items-center gap-4 bg-muted rounded-2xl p-4">
              <div className="text-center">
                <div className="text-4xl font-black text-primary">{result.score}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-foreground">Grade: {result.grade}</div>
                <div className="h-2 bg-background rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${result.score}%` }} />
                </div>
              </div>
            </div>

            {/* Verdict */}
            {result.verdict && (
              <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
                {verdictIcon}
                <p className="text-sm font-semibold text-foreground">{result.verdict}</p>
              </div>
            )}

            {/* Revised one-liner */}
            {result.revised_one_liner && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Suggested One-Liner</p>
                <p className="text-sm text-foreground italic">"{result.revised_one_liner}"</p>
              </div>
            )}

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">✅ Strengths</p>
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Improvements */}
            {result.improvements?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">⚠️ Critical Improvements</p>
                {result.improvements.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Missing */}
            {result.missing?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">❌ Missing Elements</p>
                {result.missing.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start mb-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Investor perspective */}
            {result.investor_perspective && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">💼 Investor Perspective</p>
                <p className="text-sm text-foreground">{result.investor_perspective}</p>
              </div>
            )}

            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition">
              Close & Keep Editing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pitch Card (browse view) ─────────────────────────────────────────────────

function CategoryBadge({ label }) {
  return <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{label}</span>
}

function StageBadge({ label }) {
  const c = { Idea: 'bg-violet-500/15 text-violet-400', MVP: 'bg-blue-500/15 text-blue-400', Revenue: 'bg-emerald-500/15 text-emerald-400', Scaling: 'bg-orange-500/15 text-orange-400' }
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${c[label] ?? 'bg-muted text-muted-foreground'}`}>{label}</span>
}

function PitchCard({ pitch, onInterest }) {
  const [interested, setInterested] = useState(false)
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          {pitch.founder_avatar ?? '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground leading-tight">{pitch.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pitch.founder_name} · {pitch.founder_location}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic">"{pitch.tagline}"</p>
      <div className="flex flex-wrap gap-2">
        {pitch.category && <CategoryBadge label={pitch.category} />}
        {pitch.stage    && <StageBadge    label={pitch.stage}    />}
        {pitch.funding_goal && (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
            Seeking ${(pitch.funding_goal / 1000).toFixed(0)}K
          </span>
        )}
      </div>
      {pitch.seeking?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pitch.seeking.map(s => {
            const item = SEEKING.find(x => x.id === s)
            return item ? <span key={s} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{item.emoji} {item.label}</span> : null
          })}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {pitch.views ?? 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {pitch.interests ?? 0}</span>
        </div>
        <button
          onClick={() => { setInterested(true); onInterest?.(pitch) }}
          disabled={interested}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition ${interested ? 'bg-emerald-500/15 text-emerald-400 cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {interested ? <><Check className="w-3.5 h-3.5" /> Interest Sent</> : 'Express Interest'}
        </button>
      </div>
    </div>
  )
}

// ─── Multi-step Pitch Form ────────────────────────────────────────────────────

function PitchForm({ onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(BLANK_FORM)
  const [posting, setPosting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showAI, setShowAI] = useState(true)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSeeking = id => set('seeking', form.seeking.includes(id) ? form.seeking.filter(x => x !== id) : [...form.seeking, id])

  const score = useMemo(() => calcPitchScore(form), [form])

  const canNext = {
    1: form.title.trim() && form.tagline.trim() && form.category && form.stage,
    2: form.problem.trim() && form.solution.trim() && form.why_you.trim(),
    3: form.seeking.length > 0,
    4: true, 5: true,
  }

  const handleSubmit = async () => {
    setPosting(true)
    await onSubmit(form)
    setPosting(false)
  }

  return (
    <>
      {showReview && <ReviewModal form={form} onClose={() => setShowReview(false)} />}

      <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col sm:flex-row overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── LEFT: form ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
              <div>
                <h2 className="font-bold text-foreground">Submit a Pitch</h2>
                <p className="text-xs text-muted-foreground">Step {step} of 5</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAI(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${showAI ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <Sparkles className="w-3 h-3" /> AI {showAI ? 'On' : 'Off'}
                </button>
                <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1 px-5 pt-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            {/* Fields */}
            <div className="px-5 pb-5 pt-4 space-y-4 flex-1">
              {/* Step 1 */}
              {step === 1 && (
                <>
                  <div>
                    <label className="field-label">Pitch Title *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value.slice(0, 60))}
                      placeholder="e.g. CreatorPay — Instant Payments for African Creators"
                      className="field-input" />
                    <div className="flex items-center justify-between mt-1">
                      <ImproveField fieldName="title" fieldLabel="Pitch Title" currentValue={form.title} onApply={v => set('title', v)} />
                      <span className="text-xs text-muted-foreground">{form.title.length}/60</span>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">One-liner Pitch *</label>
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value.slice(0, 120))}
                      placeholder="One sentence that captures the essence of your idea"
                      className="field-input" />
                    <div className="flex items-center justify-between mt-1">
                      <ImproveField fieldName="tagline" fieldLabel="One-liner Pitch" currentValue={form.tagline} onApply={v => set('tagline', v)} />
                      <span className="text-xs text-muted-foreground">{form.tagline.length}/120</span>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Category *</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} className="field-input">
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Stage *</label>
                    <div className="flex gap-2 flex-wrap">
                      {STAGES.map(s => (
                        <button key={s} type="button" onClick={() => set('stage', s)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.stage === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border hover:border-primary/50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <>
                  {[
                    { k: 'problem',  l: "Problem you're solving *",  p: 'What pain point or gap does this address?' },
                    { k: 'solution', l: 'Your solution *',            p: 'How do you solve it uniquely?' },
                    { k: 'why_you',  l: 'Why you? *',                 p: 'Why are you the right person to build this?' },
                    { k: 'traction', l: 'Traction so far',            p: 'Any early users, revenue, validation? (optional)' },
                  ].map(f => (
                    <div key={f.k}>
                      <label className="field-label">{f.l}</label>
                      <textarea value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                        placeholder={f.p} rows={3} className="field-input resize-none" />
                      <ImproveField fieldName={f.k} fieldLabel={f.l.replace(' *', '')} currentValue={form[f.k]} onApply={v => set(f.k, v)} />
                    </div>
                  ))}
                </>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <>
                  <div>
                    <label className="field-label">What are you seeking? *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SEEKING.map(s => (
                        <button key={s.id} type="button" onClick={() => toggleSeeking(s.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.seeking.includes(s.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border hover:border-primary/40'}`}>
                          <span>{s.emoji}</span> {s.label}
                          {form.seeking.includes(s.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.seeking.includes('investment') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Funding goal ($)</label>
                        <input type="number" value={form.funding_goal} onChange={e => set('funding_goal', e.target.value)} placeholder="e.g. 50000" className="field-input" />
                      </div>
                      <div>
                        <label className="field-label">Equity offered (%)</label>
                        <input type="number" value={form.equity} onChange={e => set('equity', e.target.value)} placeholder="e.g. 10" className="field-input" />
                      </div>
                    </div>
                  )}
                  {form.seeking.includes('cofounder') && (
                    <div>
                      <label className="field-label">Skills needed in co-founder</label>
                      <input value={form.cofounder_skills} onChange={e => set('cofounder_skills', e.target.value)} placeholder="e.g. Technical / Engineering background" className="field-input" />
                    </div>
                  )}
                </>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Attach supporting materials. (Optional)</p>
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

              {/* Step 5 */}
              {step === 5 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Who can discover your pitch?</p>
                  {VISIBILITY_OPTS.map(v => {
                    const Icon = v.icon
                    return (
                      <button key={v.id} type="button" onClick={() => set('visibility', v.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${form.visibility === v.id ? 'bg-primary/10 border-primary' : 'bg-muted border-border hover:border-primary/40'}`}>
                        <Icon className={`w-5 h-5 flex-shrink-0 ${form.visibility === v.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${form.visibility === v.id ? 'text-primary' : 'text-foreground'}`}>{v.label}</p>
                          <p className="text-xs text-muted-foreground">{v.desc}</p>
                        </div>
                        {form.visibility === v.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    )
                  })}
                  {/* AI Review CTA */}
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="w-full flex items-center justify-center gap-2 border border-primary/40 text-primary text-sm font-semibold py-3 rounded-xl hover:bg-primary/5 transition mt-2"
                  >
                    <Sparkles className="w-4 h-4" /> Get AI Pitch Review First
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step < 5 ? (
                  <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={posting}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition">
                    {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4" /> Launch Pitch</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: AI panel ──────────────────────────────────── */}
          {showAI && (
            <div className="sm:w-64 border-t sm:border-t-0 sm:border-l border-border bg-muted/30 p-4 flex-shrink-0 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">AI Assistant</span>
              </div>
              <ScorePanel score={score} />

              {/* Live preview */}
              {(form.title || form.tagline) && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Live Preview</p>
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    {form.title && <p className="text-xs font-bold text-foreground line-clamp-2">{form.title}</p>}
                    {form.tagline && <p className="text-xs text-muted-foreground italic line-clamp-2">"{form.tagline}"</p>}
                    <div className="flex gap-1 flex-wrap">
                      {form.category && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{form.category}</span>}
                      {form.stage    && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{form.stage}</span>}
                    </div>
                  </div>
                </div>
              )}

              {score.total < 60 && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-400 mb-1">💡 Quick wins</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-none">
                    {!form.tagline.trim() && <li>• Add a one-liner pitch</li>}
                    {!form.problem.trim() && <li>• Describe the problem</li>}
                    {!form.traction.trim() && <li>• Add any traction you have</li>}
                    {!form.category && <li>• Select a category</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tailwind class helpers — kept in JSX to avoid purge */}
      <style>{`.field-label{display:block;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted-foreground);margin-bottom:0.375rem}.field-input{width:100%;background:var(--muted);border-radius:0.75rem;padding:0.625rem 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.field-input:focus{box-shadow:0 0 0 2px rgba(124,58,237,0.3)}`}</style>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PitchVault() {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState('browse')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.from('pitches').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setPitches(data ?? []); setLoading(false) })
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleSubmit = async (form) => {
    const { data } = await supabase.from('pitches').insert({
      title: form.title, description: form.tagline,
      category: form.category, stage: form.stage,
      seeking: form.seeking,
      funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : null,
      visibility: form.visibility, status: 'pending',
      created_by: user?.id,
    }).select().single()
    if (data) setPitches(p => [data, ...p])
    setShowForm(false)
    showToast('Your pitch is live! 🚀')
  }

  const displayPitches = pitches.length > 0 ? pitches : SAMPLE_PITCHES
  const myPitches = pitches.filter(p => p.created_by === user?.id)

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
        <p className="text-muted-foreground/60 text-xs flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" /> AI pitch assistant included — write better pitches in minutes
        </p>
      </div>

      {/* Two CTAs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 space-y-3">
          <div className="text-3xl">💡</div>
          <h3 className="font-bold text-foreground">Have an idea?</h3>
          <p className="text-sm text-muted-foreground">Submit your pitch with AI assistance and get discovered by investors, co-founders, and collaborators.</p>
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

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : tab === 'browse' ? (
        <div className="space-y-4">
          {displayPitches.map(p => (
            <PitchCard key={p.id} pitch={p} onInterest={pitch => showToast(`Interest sent to ${pitch.founder_name ?? 'this founder'}!`)} />
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
          {myPitches.map(p => <PitchCard key={p.id} pitch={p} />)}
        </div>
      )}
    </div>
  )
}
