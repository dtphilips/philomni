import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Globe, Users, Calendar, Briefcase,
  Star, ThumbsUp, ThumbsDown, ChevronRight, Plus, X,
  CheckCircle, XCircle, Lightbulb, Search, ExternalLink,
  Edit, LayoutDashboard, Heart, Share2, MessageSquare,
  TrendingUp, DollarSign, Clock, Award, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_COMPANY = {
  id: 'sample-1',
  name: 'Creator IQ',
  tagline: 'The intelligence platform for the creator economy',
  industry: 'Creator Economy',
  company_size: '201-500',
  company_type: 'Private',
  headquarters: 'Los Angeles, CA',
  website: 'https://creatoriq.com',
  founded_year: 2014,
  description: "Creator IQ is the most trusted influencer marketing platform for the world's most innovative brands and agencies. We connect brands with the right creators, measure campaign performance, and optimize for results at scale.",
  specialties: ['Influencer Marketing', 'Creator Analytics', 'Brand Partnerships', 'Content Marketing', 'Social Media'],
  follower_count: 12400,
  logo_url: null,
  banner_url: null,
}

const SAMPLE_REVIEWS = [
  { id: 'r1', headline: 'Great culture but slow growth', overall_rating: 4, work_life_balance: 5, compensation: 3, career_growth: 3, management: 4, culture: 5, pros: 'Flexible hours, great team, exciting projects, good work-life balance and supportive management that genuinely cares.', cons: 'Limited salary growth, slow promotion process, communication between departments could improve significantly.', advice: 'Invest more in employee development programs and create clearer career paths.', employment_status: 'Former Employee', job_title: 'Video Editor', employment_type: 'Full-time', location: 'Remote', years_at_company: '2-3 years', would_recommend: true, ceo_approval: 'approve', helpful_count: 12, is_anonymous: true, display_name: 'Anonymous Employee', created_at: new Date(Date.now() - 60 * 24 * 3600000).toISOString() },
  { id: 'r2', headline: 'Amazing place to grow as a creator', overall_rating: 5, work_life_balance: 4, compensation: 4, career_growth: 5, management: 5, culture: 5, pros: 'Incredible opportunity to learn the creator economy inside out. Leadership is visionary, colleagues are passionate and talented.', cons: 'Fast pace can be overwhelming at times. Work-life balance requires you to set your own boundaries clearly.', advice: 'Keep up the momentum and consider formalizing mentorship programs.', employment_status: 'Current Employee', job_title: 'Brand Partnerships Manager', employment_type: 'Full-time', location: 'Los Angeles, CA', years_at_company: '1-2 years', would_recommend: true, ceo_approval: 'approve', helpful_count: 8, is_anonymous: true, display_name: 'Anonymous Employee', created_at: new Date(Date.now() - 15 * 24 * 3600000).toISOString() },
  { id: 'r3', headline: 'Decent pay, mediocre management', overall_rating: 3, work_life_balance: 3, compensation: 4, career_growth: 3, management: 2, culture: 3, pros: 'Competitive compensation for the industry. Good product. Remote-friendly environment.', cons: 'Middle management layer is ineffective. Too many meetings. Strategic direction changes frequently.', advice: 'Streamline middle management and commit to a clearer long-term strategy.', employment_status: 'Former Employee', job_title: 'Marketing Manager', employment_type: 'Full-time', location: 'Remote', years_at_company: '3-5 years', would_recommend: false, ceo_approval: 'no_opinion', helpful_count: 5, is_anonymous: true, display_name: 'Anonymous Employee', created_at: new Date(Date.now() - 90 * 24 * 3600000).toISOString() },
]

const SAMPLE_SALARIES = [
  { id: 's1', job_title: 'Video Editor', employment_type: 'Full-time', location: 'Remote', base_salary: 58000, currency: 'USD', pay_period: 'yearly', total_compensation: 65000, created_at: new Date().toISOString() },
  { id: 's2', job_title: 'Brand Partnerships Manager', employment_type: 'Full-time', location: 'Los Angeles, CA', base_salary: 85000, currency: 'USD', pay_period: 'yearly', total_compensation: 110000, created_at: new Date().toISOString() },
  { id: 's3', job_title: 'Content Strategist', employment_type: 'Full-time', location: 'Remote', base_salary: 72000, currency: 'USD', pay_period: 'yearly', total_compensation: 80000, created_at: new Date().toISOString() },
  { id: 's4', job_title: 'UGC Creator', employment_type: 'Contract', location: 'Remote', base_salary: 4500, currency: 'USD', pay_period: 'monthly', total_compensation: 4500, created_at: new Date().toISOString() },
]

const SAMPLE_INTERVIEWS = [
  { id: 'i1', job_title: 'Brand Partnerships Manager', application_method: 'Company website', difficulty: 'Average', got_offer: 'Yes', description: 'Two rounds total: a 30-min HR screening followed by a panel interview with 3 team members. Very professional process, quick turnaround. Questions focused on past experience and situational scenarios.', questions: ["Tell me about a brand partnership you're most proud of.", 'How do you handle difficult negotiations with clients?', 'What metrics do you use to measure campaign success?'], overall_experience: 'Positive', duration: '2 weeks', created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString() },
  { id: 'i2', job_title: 'Video Editor', application_method: 'Philomni', difficulty: 'Easy', got_offer: 'No', description: 'Single round video interview, relaxed atmosphere. They asked to review my portfolio live during the call. Feedback was that they needed someone more senior.', questions: ['Walk me through your editing workflow.', 'What software are you most comfortable with?'], overall_experience: 'Positive', duration: '1 week', created_at: new Date(Date.now() - 60 * 24 * 3600000).toISOString() },
]

const SAMPLE_JOBS = [
  { id: 'cj1', title: 'UGC Content Creator', type: 'Contract', location: 'Remote', remote_type: 'Remote', salary_min: 3000, salary_max: 5000, salary_period: 'month', tags: ['UGC', 'TikTok', 'Content'], applicants: 47, posted_days: 2, match: 88 },
  { id: 'cj2', title: 'Social Media Manager', type: 'Full-time', location: 'Los Angeles, CA', remote_type: 'Hybrid', salary_min: 70000, salary_max: 95000, salary_period: 'year', tags: ['Social Media', 'Strategy', 'Analytics'], applicants: 120, posted_days: 5, match: 74 },
]

const SAMPLE_PEOPLE = [
  { id: 'p1', full_name: 'Jordan Lee', title: 'Senior Brand Manager', avatar_url: null },
  { id: 'p2', full_name: 'Maya Chen', title: 'Content Strategist', avatar_url: null },
  { id: 'p3', full_name: 'Alex Rivera', title: 'Video Editor', avatar_url: null },
  { id: 'p4', full_name: 'Sam Patel', title: 'Partnerships Lead', avatar_url: null },
]

const SAMPLE_POSTS = [
  { id: 'post1', text: "We're thrilled to announce our Q2 Creator Economy Report is live! Dive into key trends shaping the future of brand-creator partnerships.", likes: 142, comments: 23, time: '2 days ago' },
  { id: 'post2', text: "Join us at Creator Summit 2025 in LA! Our team will be speaking on data-driven influencer marketing strategies. Register now — link in bio.", likes: 89, comments: 14, time: '1 week ago' },
  { id: 'post3', text: "Congratulations to our Brand Partnerships team for hitting a record $50M in managed campaign value this quarter! Incredible work.", likes: 310, comments: 47, time: '2 weeks ago' },
]

// ─── Helper Components ────────────────────────────────────────────────────────
function Stars({ rating, size = 'sm' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`${size === 'lg' ? 'text-2xl' : 'text-sm'} ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-muted-foreground/30'}`}>★</span>
      ))}
    </div>
  )
}

function ClickableStars({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className={`text-2xl transition-colors ${i <= (hovered || value) ? 'text-yellow-400' : 'text-muted-foreground/20 hover:text-yellow-400/50'}`}
        >★</button>
      ))}
    </div>
  )
}

function timeAgo(dateStr) {
  const d = new Date(dateStr), now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff < 30) return `${diff} days ago`
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`
  return `${Math.floor(diff / 365)} years ago`
}

function formatSalary(s) {
  if (s.pay_period === 'monthly') return `$${s.base_salary.toLocaleString()}/mo`
  if (s.pay_period === 'hourly') return `$${s.base_salary}/hr`
  return `$${Math.round(s.base_salary / 1000)}K/yr`
}

function difficultyColor(d) {
  const map = { 'Very Easy': 'text-emerald-400 bg-emerald-400/10', 'Easy': 'text-green-400 bg-green-400/10', 'Average': 'text-yellow-400 bg-yellow-400/10', 'Difficult': 'text-red-400 bg-red-400/10', 'Very Difficult': 'text-red-600 bg-red-600/10' }
  return map[d] || 'text-muted-foreground bg-muted'
}

function expColor(e) {
  const map = { 'Positive': 'text-green-400 bg-green-400/10', 'Neutral': 'text-yellow-400 bg-yellow-400/10', 'Negative': 'text-red-400 bg-red-400/10' }
  return map[e] || 'text-muted-foreground bg-muted'
}

function Avatar({ name, url, size = 10 }) {
  if (url) return <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ─── Write Review Modal ───────────────────────────────────────────────────────
function WriteReviewModal({ company, user, onClose, onSubmit }) {
  const [form, setForm] = useState({
    overall_rating: 0, employment_status: 'Current Employee', job_title: '',
    employment_type: 'Full-time', location: '', years_at_company: '1-2 years',
    work_life_balance: 0, compensation: 0, career_growth: 0, management: 0, culture: 0,
    headline: '', pros: '', cons: '', advice: '',
    would_recommend: null, ceo_approval: null, is_anonymous: true,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const row = { ...form, company_id: company.id, user_id: user?.id, display_name: form.is_anonymous ? 'Anonymous Employee' : (user?.full_name || 'Employee'), helpful_count: 0 }
    const { error } = await supabase.from('company_reviews').insert(row)
    onSubmit({ ...row, id: 'new-' + Date.now(), created_at: new Date().toISOString() })
    onClose()
  }

  const catFields = [
    { key: 'work_life_balance', label: 'Work-Life Balance' },
    { key: 'compensation', label: 'Compensation & Benefits' },
    { key: 'career_growth', label: 'Career Growth' },
    { key: 'management', label: 'Senior Management' },
    { key: 'culture', label: 'Culture & Values' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
        <h2 className="text-xl font-bold mb-6">Write a Review for {company.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1">Overall Rating *</label>
            <ClickableStars value={form.overall_rating} onChange={v => set('overall_rating', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Employment Status</label>
              <div className="flex gap-2">
                {['Current Employee', 'Former Employee'].map(s => (
                  <button key={s} type="button" onClick={() => set('employment_status', s)}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.employment_status === s ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {s.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Employment Type</label>
              <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['Full-time', 'Part-time', 'Contract', 'Freelance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Job Title *</label>
              <input value={form.job_title} onChange={e => set('job_title', e.target.value)} required
                placeholder="Your role" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="City or Remote" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Years at Company</label>
            <select value={form.years_at_company} onChange={e => set('years_at_company', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
              {['<1 year', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Category Ratings</label>
            <div className="space-y-2">
              {catFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground w-44">{label}</span>
                  <ClickableStars value={form[key]} onChange={v => set(key, v)} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Review Headline *</label>
            <input value={form.headline} onChange={e => set('headline', e.target.value)} required
              placeholder="Sum up your experience in one line" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Pros *</label>
            <textarea value={form.pros} onChange={e => set('pros', e.target.value)} required rows={3}
              placeholder="What are the best parts of working here? (min. 100 chars suggested)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none" />
            <p className="text-xs text-muted-foreground mt-1">{form.pros.length} chars</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Cons *</label>
            <textarea value={form.cons} onChange={e => set('cons', e.target.value)} required rows={3}
              placeholder="What are the downsides?"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Advice to Management (optional)</label>
            <textarea value={form.advice} onChange={e => set('advice', e.target.value)} rows={2}
              placeholder="Any suggestions for leadership?"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Would you recommend?</label>
            <div className="flex gap-2">
              {[{ v: true, label: 'Yes ✅' }, { v: false, label: 'No ❌' }, { v: 'depends', label: 'It depends 🤔' }].map(({ v, label }) => (
                <button key={String(v)} type="button" onClick={() => set('would_recommend', v)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.would_recommend === v ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">CEO Approval</label>
            <div className="flex gap-2">
              {[{ v: 'approve', label: '👍 Approve' }, { v: 'disapprove', label: '👎 Disapprove' }, { v: 'no_opinion', label: '🤷 No Opinion' }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => set('ceo_approval', v)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.ceo_approval === v ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('is_anonymous', !form.is_anonymous)}
              className={`w-10 h-6 rounded-full transition-colors ${form.is_anonymous ? 'bg-primary' : 'bg-muted'} relative`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.is_anonymous ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-muted-foreground">Post anonymously</span>
          </div>
          <button type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Add Salary Modal ─────────────────────────────────────────────────────────
function AddSalaryModal({ company, user, onClose, onSubmit }) {
  const [form, setForm] = useState({ job_title: '', employment_type: 'Full-time', location: '', base_salary: '', currency: 'USD', pay_period: 'yearly', total_compensation: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const row = { ...form, company_id: company.id, user_id: user?.id, base_salary: Number(form.base_salary), total_compensation: Number(form.total_compensation) || Number(form.base_salary) }
    await supabase.from('company_salaries').insert(row)
    onSubmit({ ...row, id: 'sal-' + Date.now(), created_at: new Date().toISOString() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
        <h2 className="text-xl font-bold mb-5">Add Your Salary</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Job Title *</label>
            <input value={form.job_title} onChange={e => set('job_title', e.target.value)} required
              placeholder="Your role at this company" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Employment Type</label>
              <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['Full-time', 'Part-time', 'Contract', 'Freelance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Pay Period</label>
              <select value={form.pay_period} onChange={e => set('pay_period', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['hourly', 'monthly', 'yearly'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="City or Remote" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Base Salary *</label>
              <input value={form.base_salary} onChange={e => set('base_salary', e.target.value)} required type="number"
                placeholder="e.g. 75000" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Total Comp (optional)</label>
              <input value={form.total_compensation} onChange={e => set('total_compensation', e.target.value)} type="number"
                placeholder="Including bonus" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle size={12} /> Submitted anonymously</p>
          <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">Submit Salary</button>
        </form>
      </div>
    </div>
  )
}

// ─── Interview Form Modal ─────────────────────────────────────────────────────
function InterviewFormModal({ company, user, onClose, onSubmit }) {
  const [form, setForm] = useState({ job_title: '', application_method: 'Company website', difficulty: 'Average', got_offer: 'Yes', description: '', questions: [''], overall_experience: 'Positive', duration: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addQuestion = () => { if (form.questions.length < 5) set('questions', [...form.questions, '']) }
  const setQ = (i, v) => { const q = [...form.questions]; q[i] = v; set('questions', q) }
  const removeQ = (i) => { set('questions', form.questions.filter((_, idx) => idx !== i)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const row = { ...form, company_id: company.id, user_id: user?.id, questions: form.questions.filter(Boolean) }
    await supabase.from('interview_experiences').insert(row)
    onSubmit({ ...row, id: 'int-' + Date.now(), created_at: new Date().toISOString() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
        <h2 className="text-xl font-bold mb-5">Share Interview Experience</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Job Title *</label>
            <input value={form.job_title} onChange={e => set('job_title', e.target.value)} required
              placeholder="Role you interviewed for" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Application Method</label>
              <select value={form.application_method} onChange={e => set('application_method', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['Company website', 'Referral', 'Philomni', 'LinkedIn', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['Very Easy', 'Easy', 'Average', 'Difficult', 'Very Difficult'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Got Offer?</label>
              <select value={form.got_offer} onChange={e => set('got_offer', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                {['Yes', 'No', 'Declined'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Process Duration</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)}
                placeholder="e.g. 2 weeks" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Interview Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={4}
              placeholder="Describe the interview process, rounds, atmosphere..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Questions Asked</label>
            <div className="space-y-2">
              {form.questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={e => setQ(i, e.target.value)}
                    placeholder={`Question ${i + 1}`} className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                  {form.questions.length > 1 && <button type="button" onClick={() => removeQ(i)} className="text-muted-foreground hover:text-red-400"><X size={16} /></button>}
                </div>
              ))}
            </div>
            {form.questions.length < 5 && (
              <button type="button" onClick={addQuestion} className="mt-2 text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add question
              </button>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Overall Experience</label>
            <div className="flex gap-2">
              {['Positive', 'Neutral', 'Negative'].map(e => (
                <button key={e} type="button" onClick={() => set('overall_experience', e)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.overall_experience === e ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">Submit Experience</button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [reviews, setReviews] = useState([])
  const [salaries, setSalaries] = useState([])
  const [interviews, setInterviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [people, setPeople] = useState([])
  const [reviewsSubTab, setReviewsSubTab] = useState('reviews')
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [showAddSalary, setShowAddSalary] = useState(false)
  const [showInterviewForm, setShowInterviewForm] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')
  const [isAdmin] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (id && id !== 'sample-1') {
          const { data: co } = await supabase.from('companies').select('*').eq('id', id).maybeSingle()
          setCompany(co || SAMPLE_COMPANY)
          setFollowerCount(co?.follower_count || SAMPLE_COMPANY.follower_count)

          if (user?.id) {
            const { data: fol } = await supabase.from('company_followers').select('id').eq('company_id', id).eq('user_id', user.id).maybeSingle()
            setIsFollowing(!!fol)
          }

          const { data: rev } = await supabase.from('company_reviews').select('*').eq('company_id', id).order('created_at', { ascending: false })
          setReviews(rev?.length ? rev : SAMPLE_REVIEWS)

          const { data: sal } = await supabase.from('company_salaries').select('*').eq('company_id', id)
          setSalaries(sal?.length ? sal : SAMPLE_SALARIES)

          const { data: intv } = await supabase.from('interview_experiences').select('*').eq('company_id', id)
          setInterviews(intv?.length ? intv : SAMPLE_INTERVIEWS)

          const { data: jbs } = await supabase.from('jobs').select('*').eq('company_id', id)
          setJobs(jbs?.length ? jbs : SAMPLE_JOBS)
        } else {
          setCompany(SAMPLE_COMPANY)
          setFollowerCount(SAMPLE_COMPANY.follower_count)
          setReviews(SAMPLE_REVIEWS)
          setSalaries(SAMPLE_SALARIES)
          setInterviews(SAMPLE_INTERVIEWS)
          setJobs(SAMPLE_JOBS)
        }
        setPeople(SAMPLE_PEOPLE)
      } catch (err) {
        setCompany(SAMPLE_COMPANY)
        setFollowerCount(SAMPLE_COMPANY.follower_count)
        setReviews(SAMPLE_REVIEWS)
        setSalaries(SAMPLE_SALARIES)
        setInterviews(SAMPLE_INTERVIEWS)
        setJobs(SAMPLE_JOBS)
        setPeople(SAMPLE_PEOPLE)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user?.id])

  const handleFollow = async () => {
    if (!user) return
    if (isFollowing) {
      await supabase.from('company_followers').delete().eq('company_id', company.id).eq('user_id', user.id)
      setFollowerCount(c => c - 1)
      setIsFollowing(false)
    } else {
      await supabase.from('company_followers').insert({ company_id: company.id, user_id: user.id })
      setFollowerCount(c => c + 1)
      setIsFollowing(true)
    }
  }

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length) : 0
  const starDist = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => Math.round(r.overall_rating) === s).length }))
  const avgCat = (key) => reviews.length ? (reviews.reduce((s, r) => s + (r[key] || 0), 0) / reviews.length).toFixed(1) : '—'
  const recommendPct = reviews.length ? Math.round(reviews.filter(r => r.would_recommend === true).length / reviews.length * 100) : 0
  const ceoApprovePct = reviews.length ? Math.round(reviews.filter(r => r.ceo_approval === 'approve').length / reviews.length * 100) : 0

  const filteredPeople = people.filter(p => p.full_name.toLowerCase().includes(peopleSearch.toLowerCase()))

  const tabs = [
    { key: 'home', label: '🏠 Home' },
    { key: 'jobs', label: '💼 Jobs' },
    { key: 'people', label: '👥 People' },
    { key: 'about', label: 'ℹ️ About' },
    { key: 'reviews', label: '⭐ Reviews' },
  ]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-52 rounded-2xl bg-muted" />
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-72 rounded-xl bg-muted" />
        <div className="h-4 w-40 rounded-xl bg-muted" />
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {/* Banner */}
      <div
        className="h-52 rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary/20 to-purple-900/30"
        style={company.banner_url ? { background: `url(${company.banner_url}) center/cover` } : {}}
      />

      {/* Logo + Actions */}
      <div className="-mt-10 ml-6 flex items-end justify-between">
        <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg">
          {company.logo_url ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" /> : <span className="text-primary">{company.name[0]}</span>}
        </div>
        <div className="flex gap-2 mb-1">
          {isAdmin && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                <Edit size={14} /> Edit Page
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                <LayoutDashboard size={14} /> Admin
              </button>
            </>
          )}
          <button
            onClick={handleFollow}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isFollowing ? 'bg-muted text-foreground border border-border hover:bg-muted/70' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            <Heart size={14} className={isFollowing ? 'fill-current' : ''} />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Company Info */}
      <div className="px-1 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
        {company.tagline && <p className="text-muted-foreground">{company.tagline}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground items-center">
          {company.industry && <span className="flex items-center gap-1"><Building2 size={13} />{company.industry}</span>}
          {company.company_size && <><span>·</span><span className="flex items-center gap-1"><Users size={13} />{company.company_size} employees</span></>}
          {company.headquarters && <><span>·</span><span className="flex items-center gap-1"><MapPin size={13} />{company.headquarters}</span></>}
          {company.website && <><span>·</span><a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe size={13} />Website <ExternalLink size={11} /></a></>}
        </div>
        <p className="text-sm text-muted-foreground">{followerCount.toLocaleString()} followers</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HOME TAB ── */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Company Updates</h2>
            {isAdmin && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors">
                <Plus size={14} /> Post Update
              </button>
            )}
          </div>
          {SAMPLE_POSTS.map(post => (
            <div key={post.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {company.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{company.name}</p>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{post.text}</p>
              <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <ThumbsUp size={13} /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <MessageSquare size={13} /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Share2 size={13} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── JOBS TAB ── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{jobs.length} Open Positions</h2>
          {jobs.length === 0 && <p className="text-muted-foreground text-sm">No open positions right now.</p>}
          {jobs.map(job => (
            <div key={job.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold">{job.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    <span>·</span>
                    <span className={`px-2 py-0.5 rounded-full ${job.remote_type === 'Remote' ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'}`}>{job.remote_type}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><DollarSign size={11} />
                      {job.salary_min?.toLocaleString()}–{job.salary_max?.toLocaleString()}/{job.salary_period === 'year' ? 'yr' : 'mo'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={11} />Posted {job.posted_days}d ago</span>
                    <span>·</span>
                    <span>{job.applicants} applicants</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.tags?.map(tag => <span key={tag} className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">{tag}</span>)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {job.match && <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{job.match}% match</span>}
                  <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">Easy Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PEOPLE TAB ── */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={peopleSearch} onChange={e => setPeopleSearch(e.target.value)}
              placeholder="Search people..." className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPeople.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-colors">
                <Avatar name={p.full_name} url={p.avatar_url} size={12} />
                <div>
                  <p className="font-semibold text-sm">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.title}</p>
                </div>
                <button className="w-full py-1.5 border border-border rounded-xl text-xs font-medium hover:border-primary/50 hover:text-primary transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">About {company.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{company.description}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Company Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Founded', value: company.founded_year },
                { icon: Building2, label: 'Type', value: company.company_type },
                { icon: Users, label: 'Company Size', value: `${company.company_size} employees` },
                { icon: TrendingUp, label: 'Industry', value: company.industry },
                { icon: MapPin, label: 'Headquarters', value: company.headquarters },
              ].filter(i => i.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {company.specialties?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h3 className="font-semibold">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {company.specialties.map(s => (
                  <span key={s} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
              <Globe size={14} /> {company.website} <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
            {['reviews', 'salaries', 'interviews'].map(st => (
              <button key={st} onClick={() => setReviewsSubTab(st)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${reviewsSubTab === st ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {st}
              </button>
            ))}
          </div>

          {/* ── Reviews Sub-tab ── */}
          {reviewsSubTab === 'reviews' && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-8 flex-wrap">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                    <Stars rating={avgRating} size="lg" />
                    <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 min-w-48 space-y-1.5">
                    {starDist.map(({ star, count }) => {
                      const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-right text-muted-foreground">{star}</span>
                          <span className="text-yellow-400 text-xs">★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      { key: 'work_life_balance', label: 'Work-Life Balance' },
                      { key: 'compensation', label: 'Compensation' },
                      { key: 'career_growth', label: 'Career Growth' },
                      { key: 'management', label: 'Management' },
                      { key: 'culture', label: 'Culture' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="font-medium">{avgCat(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
                  <span><span className="font-semibold text-foreground">{recommendPct}%</span> would recommend</span>
                  <span>·</span>
                  <span>CEO: <span className="font-semibold text-foreground">{ceoApprovePct}%</span> approve</span>
                  <button onClick={() => setShowWriteReview(true)}
                    className="ml-auto px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                    Write a Review
                  </button>
                </div>
              </div>

              {/* Review Cards */}
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} onHelpful={(id) => {
                  setReviews(rs => rs.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r))
                }} />
              ))}
            </div>
          )}

          {/* ── Salaries Sub-tab ── */}
          {reviewsSubTab === 'salaries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{salaries.length} salaries reported</h3>
                <button onClick={() => setShowAddSalary(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Plus size={14} /> Add Your Salary
                </button>
              </div>
              {salaries.map(sal => (
                <div key={sal.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{sal.job_title}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        <span>{sal.employment_type}</span>
                        <span>·</span>
                        <span>{sal.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatSalary(sal)}</p>
                      {sal.total_compensation > sal.base_salary && (
                        <p className="text-xs text-muted-foreground">Total: {sal.pay_period === 'monthly' ? `$${sal.total_compensation.toLocaleString()}/mo` : `$${Math.round(sal.total_compensation / 1000)}K/yr`}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><AlertCircle size={11} />Reported anonymously</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Interviews Sub-tab ── */}
          {reviewsSubTab === 'interviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{interviews.length} interview experiences</h3>
                <button onClick={() => setShowInterviewForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Plus size={14} /> Share Experience
                </button>
              </div>
              {interviews.map(intv => (
                <div key={intv.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">{intv.job_title}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(intv.difficulty)}`}>{intv.difficulty}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${expColor(intv.overall_experience)}`}>{intv.overall_experience}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intv.got_offer === 'Yes' ? 'text-green-400 bg-green-400/10' : intv.got_offer === 'Declined' ? 'text-blue-400 bg-blue-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {intv.got_offer === 'Yes' ? '✅ Got Offer' : intv.got_offer === 'Declined' ? '🔄 Declined' : '❌ No Offer'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Via {intv.application_method}</p>
                      {intv.duration && <p>Duration: {intv.duration}</p>}
                      <p>{timeAgo(intv.created_at)}</p>
                    </div>
                  </div>
                  {intv.description && <p className="text-sm text-muted-foreground leading-relaxed">{intv.description}</p>}
                  {intv.questions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Questions asked:</p>
                      <ul className="space-y-1">
                        {intv.questions.map((q, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <ChevronRight size={12} className="mt-1 text-primary shrink-0" />{q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showWriteReview && (
        <WriteReviewModal company={company} user={user} onClose={() => setShowWriteReview(false)}
          onSubmit={(r) => setReviews(rs => [r, ...rs])} />
      )}
      {showAddSalary && (
        <AddSalaryModal company={company} user={user} onClose={() => setShowAddSalary(false)}
          onSubmit={(s) => setSalaries(ss => [s, ...ss])} />
      )}
      {showInterviewForm && (
        <InterviewFormModal company={company} user={user} onClose={() => setShowInterviewForm(false)}
          onSubmit={(i) => setInterviews(is => [i, ...is])} />
      )}
    </div>
  )
}

// ─── Review Card (separate component to keep render clean) ────────────────────
function ReviewCard({ review, onHelpful }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Stars rating={review.overall_rating} />
          <h3 className="font-semibold mt-1">{review.headline}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {review.employment_status} · {review.job_title} · {review.location} · {timeAgo(review.created_at)}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground shrink-0">
          <p>{review.years_at_company}</p>
        </div>
      </div>

      {review.pros && (
        <div className="flex gap-2">
          <CheckCircle size={15} className="text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-400 mb-0.5">Pros</p>
            <p className="text-sm text-foreground leading-relaxed">{review.pros}</p>
          </div>
        </div>
      )}

      {review.cons && (
        <div className="flex gap-2">
          <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400 mb-0.5">Cons</p>
            <p className="text-sm text-foreground leading-relaxed">{review.cons}</p>
          </div>
        </div>
      )}

      {review.advice && (
        <div className="flex gap-2">
          <Lightbulb size={15} className="text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-400 mb-0.5">Advice to Management</p>
            <p className="text-sm text-foreground leading-relaxed">{review.advice}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50 flex-wrap gap-2">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>Recommend: {review.would_recommend === true ? '✅' : review.would_recommend === false ? '❌' : '🤔'}</span>
          <span>CEO: {review.ceo_approval === 'approve' ? '👍' : review.ceo_approval === 'disapprove' ? '👎' : '🤷'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onHelpful(review.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp size={12} /> Helpful {review.helpful_count}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
