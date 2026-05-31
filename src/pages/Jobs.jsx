import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { useSubscription } from '../context/SubscriptionContext'
import UpgradePrompt from '../components/UpgradePrompt'
import {
  Search, MapPin, DollarSign, Bookmark, BookmarkCheck,
  X, ChevronRight, ChevronLeft, Briefcase, Clock,
  Users, Building2, Star, Upload, Plus, Trash2,
  CheckCircle2, Circle, FileText, Globe, Filter,
  ArrowRight, Eye, Send, Heart, HeartHandshake, Phone,
  Linkedin, MessageCircle, ThumbsUp, AlertCircle, Loader2
} from 'lucide-react'

const SAMPLE_JOBS = [
  { id:'j1', title:'UGC Content Creator', company:'Glossier', logo:'💄', location:'Remote', remote_type:'Remote', type:'Contract', salary_min:3000, salary_max:6000, salary_currency:'USD', salary_period:'month', posted_days:1, tags:['UGC','TikTok','Beauty','Video Editing'], match:92, description:'We are looking for talented UGC creators to produce authentic content featuring our beauty products. You will shoot, edit, and deliver 4-8 short-form videos per month showcasing Glossier products in your natural environment...', requirements:['1+ years UGC/content creation experience','Smartphone or camera with good quality','Video editing skills (CapCut, Adobe Premiere)','Authentic engagement on at least one platform','Based in the US'], benefits:['Free products every month','Flexible schedule','$100 product credit per campaign','Performance bonuses','Portfolio rights'], deadline:'2026-06-15', applicants:47 },
  { id:'j2', title:'Social Media Manager', company:'Spotify', logo:'🎵', location:'New York, NY', remote_type:'Hybrid', type:'Full-time', salary_min:70000, salary_max:95000, salary_currency:'USD', salary_period:'year', posted_days:3, tags:['Social Media','Instagram','TikTok','Content Strategy','Analytics'], match:85, description:'Spotify is looking for a creative and data-driven Social Media Manager to grow our artist-facing social presence across platforms. You will develop content strategy, manage posting calendars, and analyze performance...', requirements:['3+ years social media management','Strong writing and visual storytelling','Experience with analytics tools (Sprout Social, Hootsuite)','Knowledge of music industry a plus','Bachelor\'s in Marketing or related'], benefits:['Health, dental, vision insurance','401k matching','Spotify Premium + family plan','Learning & development budget $2,000/yr','Remote Fridays'], deadline:'2026-06-01', applicants:213 },
  { id:'j3', title:'Podcast Producer', company:'Wondery', logo:'🎙', location:'Los Angeles, CA', remote_type:'On-site', type:'Full-time', salary_min:65000, salary_max:85000, salary_currency:'USD', salary_period:'year', posted_days:5, tags:['Podcast','Audio Editing','Storytelling','Adobe Audition','Pro Tools'], match:78, description:'Wondery is seeking an experienced Podcast Producer to join our growing production team. You will oversee end-to-end production of multiple hit shows, manage recording sessions, and ensure audio excellence...', requirements:['2+ years podcast production','Proficiency in Adobe Audition or Pro Tools','Strong storytelling instinct','Experience managing remote guests','Project management skills'], benefits:['Competitive salary + bonus','Health benefits','Paid studio equipment','Industry events budget','Flexible PTO'], deadline:'2026-05-28', applicants:89 },
  { id:'j4', title:'Video Editor', company:'MrBeast Productions', logo:'🎬', location:'Greenville, NC', remote_type:'On-site', type:'Full-time', salary_min:55000, salary_max:80000, salary_currency:'USD', salary_period:'year', posted_days:2, tags:['Video Editing','Premiere Pro','After Effects','Color Grading','YouTube'], match:91, description:'Join the MrBeast team as a Video Editor and help produce some of YouTube\'s most viral content. You will cut episodes from raw footage, add graphics, color grade, and ensure every video hits our high production standard...', requirements:['Expert in Adobe Premiere Pro','After Effects motion graphics','Color grading experience','Fast turnaround (24-48hr edits)','YouTube content experience preferred'], benefits:['Competitive salary','Profit sharing','Epic team culture','Content credit on videos','Health insurance'], deadline:'2026-06-10', applicants:1204 },
  { id:'j5', title:'Brand Partnerships Manager', company:'Creator IQ', logo:'🤝', location:'Remote', remote_type:'Remote', type:'Full-time', salary_min:80000, salary_max:120000, salary_currency:'USD', salary_period:'year', posted_days:7, tags:['Brand Partnerships','Influencer Marketing','Sales','CRM','Negotiation'], match:74, description:'Creator IQ is hiring a Brand Partnerships Manager to connect top creators with Fortune 500 brands. You will manage the full deal lifecycle from prospecting to contract to delivery...', requirements:['5+ years influencer marketing or brand partnerships','Strong sales and negotiation skills','Existing brand relationships a plus','CRM experience (Salesforce, HubSpot)','Excellent communication'], benefits:['Base + commission structure','Unlimited PTO','Home office stipend $1,500','Health + dental + vision','Equity options'], deadline:'2026-06-20', applicants:156 },
  { id:'j6', title:'Creative Director', company:'Adobe', logo:'🎨', location:'San Jose, CA', remote_type:'Hybrid', type:'Full-time', salary_min:140000, salary_max:180000, salary_currency:'USD', salary_period:'year', posted_days:10, tags:['Creative Direction','Brand Identity','Design','Leadership','Adobe Suite'], match:68, description:'Adobe is looking for a visionary Creative Director to lead our creator-facing campaigns. You will set the visual and tonal direction for campaigns targeting the creative community...', requirements:['10+ years design/creative experience','5+ years leading creative teams','Expert Adobe Creative Suite','Strong portfolio of brand campaigns','Excellent presentation skills'], benefits:['Top-tier compensation','Full benefits package','Adobe software + hardware','Annual stock grants','Sabbatical program'], deadline:'2026-07-01', applicants:78 },
  { id:'j7', title:'Music Supervisor', company:'Netflix', logo:'🎬', location:'Los Angeles, CA', remote_type:'Hybrid', type:'Full-time', salary_min:90000, salary_max:130000, salary_currency:'USD', salary_period:'year', posted_days:14, tags:['Music Licensing','Music Supervision','Film & TV','Negotiations','Music Industry'], match:71, description:'Netflix seeks an experienced Music Supervisor to curate and license music for our original series and films. You will work closely with directors and showrunners to select the perfect soundtrack...', requirements:['5+ years music supervision experience','Deep knowledge of licensing and sync rights','Relationships with publishers and labels','Creative ear and genre versatility','Film/TV production experience'], benefits:['Premium compensation package','Unlimited PTO','Netflix streaming perks','401k + match','Relocation assistance'], deadline:'2026-06-30', applicants:312 },
  { id:'j8', title:'Community Manager', company:'Discord', logo:'💬', location:'Remote', remote_type:'Remote', type:'Full-time', salary_min:60000, salary_max:80000, salary_currency:'USD', salary_period:'year', posted_days:4, tags:['Community Management','Discord','Social Media','Customer Success','Gaming'], match:82, description:'Discord is hiring a Community Manager to nurture and grow creator communities on our platform. You will moderate servers, run events, collect feedback, and be the bridge between creators and our product team...', requirements:['2+ years community management','Active Discord user (power user preferred)','Excellent written communication','Experience with creator communities','Data analysis skills'], benefits:['Full remote + stipend','Health benefits','Discord Nitro perks','Learning budget','Flexible hours'], deadline:'2026-05-30', applicants:445 },
  { id:'j9', title:'Copywriter — Creator Economy', company:'Patreon', logo:'✍️', location:'Remote', remote_type:'Remote', type:'Full-time', salary_min:70000, salary_max:90000, salary_currency:'USD', salary_period:'year', posted_days:6, tags:['Copywriting','Content Marketing','SEO','Email Marketing','Brand Voice'], match:88, description:'Patreon needs a talented Copywriter who lives and breathes the creator economy. You will write everything from landing pages and onboarding flows to email campaigns and help center articles...', requirements:['3+ years copywriting experience','Portfolio of conversion-focused copy','SEO writing knowledge','Familiarity with creator economy','HubSpot or Mailchimp experience'], benefits:['Competitive salary','Remote-first culture','Free Patreon Pro','Health + dental','Annual retreat'], deadline:'2026-06-05', applicants:189 },
  { id:'j10', title:'Talent Agent — Digital Creators', company:'WME', logo:'⭐', location:'New York, NY', remote_type:'Hybrid', type:'Full-time', salary_min:50000, salary_max:75000, salary_currency:'USD', salary_period:'year', posted_days:8, tags:['Talent Management','Influencer','Negotiation','Contracts','Entertainment Law'], match:65, description:'William Morris Endeavor is expanding its digital creator division and seeking a junior Talent Agent to represent top YouTube, TikTok, and podcast creators. You will pitch clients for brand deals, speaking engagements, and media opportunities...', requirements:['1-3 years talent/entertainment experience','Knowledge of digital creator landscape','Strong network and hustle mentality','Contract reading ability','Bachelor\'s required'], benefits:['Industry-leading reputation','Commission-based upside','Full benefits','Entertainment industry access','Career growth'], deadline:'2026-06-15', applicants:267 },
  { id:'j11', title:'Brand Ambassador', company:'GoPro', logo:'📸', location:'Remote', remote_type:'Remote', type:'Part-time', salary_min:1500, salary_max:3000, salary_currency:'USD', salary_period:'month', posted_days:3, tags:['Content Creation','Photography','Video','Adventure','Social Media'], match:76, description:'GoPro is recruiting passionate content creators and adventure enthusiasts to represent our brand as official Brand Ambassadors. You will create monthly content featuring GoPro cameras in your authentic adventures...', requirements:['Active social following (5k+)','Passion for adventure/sports/travel','Content creation skills','Authentic engagement','Must own or be willing to use GoPro'], benefits:['Free GoPro equipment','$1,500-3,000/month','Product launch access','Repost to GoPro channels','Ambassador badge'], deadline:'2026-06-30', applicants:2341 },
  { id:'j12', title:'Art Director — Social Campaigns', company:'Nike', logo:'👟', location:'Portland, OR', remote_type:'Hybrid', type:'Full-time', salary_min:95000, salary_max:130000, salary_currency:'USD', salary_period:'year', posted_days:12, tags:['Art Direction','Graphic Design','Photoshop','Campaign Creative','Branding'], match:72, description:'Nike\'s Social & Creator team is looking for an Art Director to lead visual development for creator-facing campaigns. You\'ll collaborate with creators, photographers, and videographers to produce culturally relevant content at scale...', requirements:['6+ years art direction experience','Expert in Adobe Creative Suite','Strong cultural and design sensibility','Experience with creator/UGC campaigns','Team leadership experience'], benefits:['Premium salary + bonus','Nike product allowance','Full health benefits','Career development','Portland campus perks'], deadline:'2026-07-15', applicants:534 },
]

const SAMPLE_APPLICATIONS = [
  { ...SAMPLE_JOBS[0], status: 'Screening', applied_date: '2026-05-10' },
  { ...SAMPLE_JOBS[3], status: 'Under Review', applied_date: '2026-05-12' },
  { ...SAMPLE_JOBS[7], status: 'Interview Scheduled', applied_date: '2026-05-08' },
]

const COMPANY_HIGHLIGHTS = [
  { id:'c1', name:'Spotify', emoji:'🎵', jobs:24, industry:'Music' },
  { id:'c2', name:'Adobe', emoji:'🎨', jobs:18, industry:'Technology' },
  { id:'c3', name:'Creator IQ', emoji:'📊', jobs:8, industry:'Creator Economy' },
  { id:'c4', name:'Patreon', emoji:'✍️', jobs:12, industry:'Creator Economy' },
  { id:'c5', name:'Discord', emoji:'💬', jobs:15, industry:'Technology' },
  { id:'c6', name:'TikTok', emoji:'🎵', jobs:45, industry:'Media' },
  { id:'c7', name:'MrBeast', emoji:'🎬', jobs:9, industry:'Film & TV' },
  { id:'c8', name:'Nike', emoji:'👟', jobs:22, industry:'Fashion' },
]

const STAGES = ['Applied','Reviewing','Screening','Interview','Offer','Hired','Rejected']

const PIPELINE_DATA = {
  Applied: [
    { id:'a1', name:'Jordan Lee', headline:'UGC Creator • 50k TikTok', match:88, initials:'JL' },
    { id:'a2', name:'Maya Chen', headline:'Content Strategist • 3yrs exp', match:82, initials:'MC' },
  ],
  Reviewing: [
    { id:'a3', name:'Alex Rivera', headline:'Video Editor • Adobe Expert', match:91, initials:'AR' },
    { id:'a4', name:'Sam Patel', headline:'Social Media Mgr • Analytics', match:79, initials:'SP' },
  ],
  Screening: [
    { id:'a5', name:'Chris Wong', headline:'Brand Partnerships • 5yrs', match:85, initials:'CW' },
  ],
  Interview: [
    { id:'a6', name:'Taylor Kim', headline:'Creative Director • Portfolio', match:94, initials:'TK' },
    { id:'a7', name:'Morgan Davis', headline:'Copywriter • Creator Econ', match:87, initials:'MD' },
  ],
  Offer: [
    { id:'a8', name:'Riley Scott', headline:'Podcast Producer • Pro Tools', match:92, initials:'RS' },
  ],
  Hired: [],
  Rejected: [
    { id:'a9', name:'Casey Brown', headline:'Community Mgr • Discord', match:61, initials:'CB' },
  ],
}

function daysAgo(n) {
  if (n === 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return `${n}d ago`
}

function fmtSalary(job) {
  if (!job.salary_min && !job.salary_max) return 'Competitive'
  const fmt = (n) => {
    if (job.salary_period === 'year') return `$${(n / 1000).toFixed(0)}k`
    return `$${n.toLocaleString()}`
  }
  const period = job.salary_period === 'year' ? '/yr' : '/mo'
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}${period}`
  if (job.salary_min) return `From ${fmt(job.salary_min)}${period}`
  return `Up to ${fmt(job.salary_max)}${period}`
}

function matchColor(score) {
  if (score >= 80) return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (score >= 65) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  return 'bg-muted text-muted-foreground border border-border'
}

function remoteTypeBadge(type) {
  const map = {
    Remote: 'bg-blue-500/20 text-blue-400',
    Hybrid: 'bg-purple-500/20 text-purple-400',
    'On-site': 'bg-orange-500/20 text-orange-400',
  }
  return map[type] || 'bg-muted text-muted-foreground'
}

// ─── JobCard ──────────────────────────────────────────────────────────────────

function JobCard({ job, onOpen, saved, onSave }) {
  return (
    <div
      className={`bg-card border rounded-xl p-5 shadow-sm hover:border-primary/40 transition-all cursor-pointer group ${job.is_featured ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/5 to-card' : 'border-border'}`}
      onClick={() => onOpen(job)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
            {job.logo}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <p className="text-xs text-muted-foreground/60">{daysAgo(job.posted_days)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {job.is_featured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              ⭐ Featured
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${matchColor(job.match)}`}>
            {job.match}% match
          </span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {job.title}
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          {job.location}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${remoteTypeBadge(job.remote_type)}`}>
          {job.remote_type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {job.type}
        </span>
      </div>

      {(job.salary_min || job.salary_max) && (
        <div className="flex items-center gap-1 text-sm text-foreground mb-3">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          {fmtSalary(job)}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {tag}
          </span>
        ))}
        {job.tags.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            +{job.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" />
          {job.applicants.toLocaleString()} applicants
        </span>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSave(job.id)}
            className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onOpen(job)}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Easy Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── JobQnA ───────────────────────────────────────────────────────────────────

function JobQnA({ job }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([
    { id:'q1', user_name:'Maya Chen', user_avatar:'MC', question:'Is there any flexibility on the compensation range for candidates with more than 5 years experience?', answer:'Absolutely — our ranges are guidelines. Exceptional candidates with relevant experience can negotiate above the listed maximum.', answered_by_name:'Hiring Manager', upvotes:12, user_upvoted: false },
    { id:'q2', user_name:'Jordan Lee', user_avatar:'JL', question:'What does the interview process look like and how many rounds are there?', answer:null, answered_by_name:null, upvotes:8, user_upvoted: false },
    { id:'q3', user_name:'Alex Kim', user_avatar:'AK', question:'Is relocation assistance available for candidates who would need to move for this role?', answer:'We offer a $5,000 relocation package for candidates relocating more than 50 miles.', answered_by_name:'HR Team', upvotes:6, user_upvoted: false },
  ])
  const [newQ, setNewQ] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitQuestion() {
    if (!newQ.trim()) return
    setSubmitting(true)
    const q = {
      id: `q${Date.now()}`,
      user_name: user?.user_metadata?.full_name || 'You',
      user_avatar: (user?.user_metadata?.full_name?.[0] || 'Y'),
      question: newQ.trim(),
      answer: null,
      answered_by_name: null,
      upvotes: 0,
      user_upvoted: false,
    }
    await supabase.from('job_questions').insert({
      job_id: job.id,
      user_id: user?.id,
      user_name: q.user_name,
      question: q.question,
    })
    setQuestions(prev => [q, ...prev])
    setNewQ('')
    setSubmitting(false)
  }

  function toggleUpvote(qId) {
    setQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, upvotes: q.user_upvoted ? q.upvotes - 1 : q.upvotes + 1, user_upvoted: !q.user_upvoted }
      : q
    ))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <textarea
          rows={2}
          value={newQ}
          onChange={e => setNewQ(e.target.value)}
          placeholder="Ask a question about this role..."
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
        />
        <button
          onClick={submitQuestion}
          disabled={submitting || !newQ.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Posting...' : 'Ask Question'}
        </button>
      </div>

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="border border-border rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {q.user_avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{q.user_name}</span>
                    <span className="text-xs text-muted-foreground">asked a question</span>
                  </div>
                  <p className="text-sm text-foreground">{q.question}</p>
                </div>
                <button
                  onClick={() => toggleUpvote(q.id)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${q.user_upvoted ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> {q.upvotes}
                </button>
              </div>
            </div>
            {q.answer && (
              <div className="px-4 py-3 bg-green-500/5 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">✓</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-green-400">Official Answer</span>
                      <span className="text-xs text-muted-foreground">from {q.answered_by_name}</span>
                    </div>
                    <p className="text-sm text-foreground">{q.answer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── JobModal ─────────────────────────────────────────────────────────────────

function JobModal({ job, onClose, onApply }) {
  const [tab, setTab] = useState('overview')

  const tabs = ['Overview', 'Company', 'Similar Jobs', 'Q&A']

  const similarJobs = SAMPLE_JOBS.filter(j => j.id !== job.id && j.tags.some(t => job.tags.includes(t))).slice(0, 3)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              {job.logo}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{job.title}</h2>
              <p className="text-muted-foreground">{job.company}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />{job.location}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${remoteTypeBadge(job.remote_type)}`}>{job.remote_type}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{job.type}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${matchColor(job.match)}`}>{job.match}% match</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-border overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t.toLowerCase().replace(' ', '-'))}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${tab === t.toLowerCase().replace(' ', '-') ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'overview' && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Compensation
                </h4>
                <p className="text-foreground font-medium">{fmtSalary(job)}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">About the Role</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{job.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Requirements</h4>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Benefits</h4>
                <ul className="space-y-2">
                  {job.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Deadline: {job.deadline}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {job.applicants.toLocaleString()} applied</span>
              </div>
            </>
          )}

          {tab === 'company' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-4xl">{job.logo}</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{job.company}</h3>
                  <p className="text-muted-foreground text-sm">Creator Economy Company</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {job.company} is a leading company in the creator economy space, empowering creators and innovating at the intersection of content, community, and commerce. They are known for their strong culture, competitive compensation, and commitment to creator success.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Company Size</p>
                  <p className="font-semibold text-foreground">500 – 2,000</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Industry</p>
                  <p className="font-semibold text-foreground">Creator Economy</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Founded</p>
                  <p className="font-semibold text-foreground">2015</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Open Roles</p>
                  <p className="font-semibold text-foreground">12 positions</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'similar-jobs' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Jobs matching your skills from this search</p>
              {similarJobs.map(sj => (
                <div key={sj.id} className="bg-muted rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sj.logo}</span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{sj.title}</p>
                      <p className="text-xs text-muted-foreground">{sj.company} • {sj.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${matchColor(sj.match)}`}>{sj.match}%</span>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'q-a' && <JobQnA job={job} />}
        </div>

        {/* Sticky footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-card rounded-b-2xl">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm">
            <Bookmark className="w-4 h-4" /> Save Job
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ApplyModal ───────────────────────────────────────────────────────────────

function ApplyModal({ job, onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUrl, setResumeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(true)
  const [form, setForm] = useState({
    coverLetter: '', portfolio: '', phone: '', linkedin: '', q1: '', q2: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const TOTAL_STEPS = 3
  const QUESTIONS = [
    'What makes you a strong fit for this role at ' + job.company + '?',
    'Describe a recent project or campaign you are proud of.',
  ]

  useEffect(() => {
    async function checkDuplicate() {
      if (!user) { setCheckingDuplicate(false); return }
      const { data } = await supabase.from('applications')
        .select('id').eq('job_id', job.id).eq('user_id', user.id).maybeSingle()
      if (data) setAlreadyApplied(true)
      setCheckingDuplicate(false)
    }
    checkDuplicate()
  }, [job.id, user])

  async function handleResumeSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file)
    setUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return prev }
        return prev + 10
      })
    }, 200)

    const path = `resumes/${user?.id ?? 'anon'}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('uploads').upload(path, file)
    clearInterval(progressInterval)

    if (error) {
      setUploading(false)
      setUploadProgress(0)
      alert('Upload failed: ' + error.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
    setResumeUrl(publicUrl)
    setUploadProgress(100)
    setUploading(false)
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await supabase.from('applications').insert({
        job_id: job.id,
        user_id: user?.id,
        job_title: job.title,
        company: job.company,
        cover_letter: form.coverLetter,
        portfolio_url: form.portfolio,
        phone: form.phone,
        linkedin_url: form.linkedin,
        resume_url: resumeUrl,
        screening_answers: { q1: form.q1, q2: form.q2 },
        stage: 'applied',
        status: 'Under Review',
        applied_at: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (err) {
      alert('Submission failed. Please try again.')
    }
    setLoading(false)
  }

  if (checkingDuplicate) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Checking application status...</p>
        </div>
      </div>
    )
  }

  if (alreadyApplied) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Already Applied</h3>
          <p className="text-muted-foreground mb-6">
            You have already applied to <strong className="text-foreground">{job.title}</strong> at <strong className="text-foreground">{job.company}</strong>. Check My Applications to track your status.
          </p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Close
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Application Sent!</h3>
          <p className="text-muted-foreground mb-6">Your application to <strong className="text-foreground">{job.title}</strong> at <strong className="text-foreground">{job.company}</strong> has been submitted. Good luck!</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">Apply to {job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {['Resume & Cover', 'Screening', 'Review'][i]}
              </span>
              {i < TOTAL_STEPS - 1 && <div className={`h-px flex-1 ${step > i + 1 ? 'bg-green-500' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Resume (PDF, DOC, DOCX)</label>
                <label className="block border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeSelect} />
                  {!resumeFile ? (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload PDF, DOC, DOCX (max 10MB)</p>
                    </div>
                  ) : uploading ? (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground">{resumeFile.name}</p>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded...</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-foreground font-medium">{resumeFile.name}</span>
                      <span className="text-xs text-green-400 ml-auto">Uploaded ✓</span>
                    </div>
                  )}
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cover Letter</label>
                <textarea
                  rows={4}
                  value={form.coverLetter}
                  onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))}
                  placeholder="Tell them why you are a great fit..."
                  className={`w-full bg-muted border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none ${form.coverLetter.length > 0 && form.coverLetter.length < 100 ? 'border-red-500/50' : 'border-border'}`}
                />
                <p className={`text-xs mt-1 ${form.coverLetter.length < 100 ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {form.coverLetter.length}/100 min
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Portfolio URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.portfolio}
                    onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))}
                    placeholder="https://yourportfolio.com"
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">LinkedIn URL</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Please answer these screening questions from {job.company}:</p>
              {QUESTIONS.map((q, i) => (
                <div key={i}>
                  <label className="text-sm font-medium text-foreground mb-2 block">{i + 1}. {q}</label>
                  <textarea
                    rows={3}
                    value={form[`q${i + 1}`]}
                    onChange={e => setForm(f => ({ ...f, [`q${i + 1}`]: e.target.value }))}
                    placeholder="Your answer..."
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Review your application:</p>
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Position</span>
                  <span className="text-foreground font-medium">{job.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="text-foreground font-medium">{job.company}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resume</span>
                  <span className="text-foreground">{resumeUrl ? '✓ Uploaded' : 'Not uploaded'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cover Letter</span>
                  <span className="text-foreground">{form.coverLetter ? '✓ Added' : 'Not added'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{form.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Portfolio</span>
                  <span className="text-foreground">{form.portfolio || 'Not provided'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LinkedIn</span>
                  <span className="text-foreground">{form.linkedin ? '✓ Added' : 'Not provided'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Screening Answers</span>
                  <span className="text-foreground">2 / 2 answered</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">By submitting, you confirm all information is accurate. Your application will be reviewed by {job.company}.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-60">
              {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PostJobModal ─────────────────────────────────────────────────────────────

function PostJobModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    title: '', company: '', logo: '', type: 'Full-time', location: '', remote_type: 'Remote',
    salary_min: '', salary_max: '', salary_period: 'year', description: '',
    requirements: [''], skills: [], deadline: '',
    questions: [''], is_featured: false,
  })

  function updateForm(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addRequirement() { updateForm('requirements', [...form.requirements, '']) }
  function updateReq(i, val) { const r = [...form.requirements]; r[i] = val; updateForm('requirements', r) }
  function removeReq(i) { updateForm('requirements', form.requirements.filter((_, idx) => idx !== i)) }

  function addQuestion() { if (form.questions.length < 5) updateForm('questions', [...form.questions, '']) }
  function updateQ(i, val) { const q = [...form.questions]; q[i] = val; updateForm('questions', q) }
  function removeQ(i) { updateForm('questions', form.questions.filter((_, idx) => idx !== i)) }

  const [skillInput, setSkillInput] = useState('')
  function addSkill() {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      updateForm('skills', [...form.skills, skillInput.trim()])
      setSkillInput('')
    }
  }
  function removeSkill(s) { updateForm('skills', form.skills.filter(x => x !== s)) }

  async function handlePublish() {
    setLoading(true)
    try {
      await supabase.from('jobs').insert({
        ...form,
        salary_min: Number(form.salary_min) || null,
        salary_max: Number(form.salary_max) || null,
        requirements: form.requirements.filter(Boolean),
        tags: form.skills,
        questions: form.questions.filter(Boolean),
        posted_at: new Date().toISOString(),
      })
    } catch (_) {}
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Job Posted!</h3>
          <p className="text-muted-foreground mb-6">Your job listing is now live and accepting applications.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Done
          </button>
        </div>
      </div>
    )
  }

  const inputCls = "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
  const selectCls = "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground text-lg">Post a Job</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-1 px-5 py-3 border-b border-border">
          {['Basic Info','Details','Screening'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < 2 && <div className={`h-px flex-1 ${step > i + 1 ? 'bg-green-500' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Job Title *</label>
                  <input value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="e.g. UGC Content Creator" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company *</label>
                  <input value={form.company} onChange={e => updateForm('company', e.target.value)} placeholder="Company name" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {form.logo || '🏢'}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <input
                        value={form.logo}
                        onChange={e => updateForm('logo', e.target.value)}
                        placeholder="Paste emoji (e.g. 🎬)"
                        className={inputCls + ' text-sm'}
                      />
                      <span className="text-xs text-muted-foreground">Use an emoji as company logo</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Job Type</label>
                  <select value={form.type} onChange={e => updateForm('type', e.target.value)} className={selectCls}>
                    {['Full-time','Part-time','Contract','Freelance'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Work Mode</label>
                  <select value={form.remote_type} onChange={e => updateForm('remote_type', e.target.value)} className={selectCls}>
                    {['Remote','Hybrid','On-site'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                  <input value={form.location} onChange={e => updateForm('location', e.target.value)} placeholder="e.g. Remote or New York, NY" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Min Salary</label>
                  <input type="number" value={form.salary_min} onChange={e => updateForm('salary_min', e.target.value)} placeholder="50000" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Salary</label>
                  <input type="number" value={form.salary_max} onChange={e => updateForm('salary_max', e.target.value)} placeholder="80000" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Period</label>
                  <select value={form.salary_period} onChange={e => updateForm('salary_period', e.target.value)} className={selectCls}>
                    <option value="year">/ year</option>
                    <option value="month">/ month</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                <textarea rows={4} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Describe the role, responsibilities..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Requirements</label>
                {form.requirements.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={r} onChange={e => updateReq(i, e.target.value)} placeholder={`Requirement ${i + 1}`} className={inputCls} />
                    <button onClick={() => removeReq(i)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addRequirement} className="flex items-center gap-1 text-xs text-primary hover:opacity-80"><Plus className="w-3 h-3" /> Add requirement</button>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Skills / Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="e.g. TikTok" className={inputCls} />
                  <button onClick={addSkill} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Application Deadline</label>
                <input type="date" value={form.deadline} onChange={e => updateForm('deadline', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => updateForm('is_featured', !form.is_featured)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.is_featured ? 'bg-yellow-500' : 'bg-muted'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_featured ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">⭐ Feature this listing</p>
                    <p className="text-xs text-muted-foreground">Featured jobs appear at the top with a gold badge</p>
                  </div>
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Add up to 5 custom screening questions for applicants.</p>
              {form.questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={e => updateQ(i, e.target.value)} placeholder={`Question ${i + 1}`} className={inputCls} />
                  <button onClick={() => removeQ(i)} className="p-2 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {form.questions.length < 5 && (
                <button onClick={addQuestion} className="flex items-center gap-1 text-xs text-primary hover:opacity-80"><Plus className="w-3 h-3" /> Add question</button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 text-sm">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handlePublish} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 text-sm disabled:opacity-60">
              {loading ? 'Publishing...' : 'Publish Job'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── HiringPipeline ───────────────────────────────────────────────────────────

function HiringPipeline() {
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [stageData, setStageData] = useState(PIPELINE_DATA)
  const [showSchedule, setShowSchedule] = useState(false)
  const [screening, setScreening] = useState(false)
  const [aiScores, setAiScores] = useState({})
  const [showAiResults, setShowAiResults] = useState(false)
  const [sortByAi, setSortByAi] = useState(false)

  const moveApplicant = async (applicant, newStage) => {
    await supabase.from('applications').update({ stage: newStage.toLowerCase() }).eq('id', applicant.id)
    setStageData(prev => {
      const next = {}
      STAGES.forEach(s => { next[s] = prev[s].filter(a => a.id !== applicant.id) })
      next[newStage] = [...(prev[newStage] || []), { ...applicant, currentStage: newStage }]
      return next
    })
    setSelectedApplicant(prev => prev ? { ...prev, currentStage: newStage } : null)
  }

  const handleAIScreening = async () => {
    setScreening(true)
    try {
      const targetApplicants = [
        ...(stageData['Applied'] || []),
        ...(stageData['Reviewing'] || []),
      ]

      if (targetApplicants.length === 0) {
        setScreening(false)
        return
      }

      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an AI hiring assistant. Score each applicant for fit with a creator economy role.

APPLICANTS:
${targetApplicants.map((a, i) => `${i+1}. Name: ${a.name}, Headline: ${a.headline}, Match score: ${a.match}%`).join('\n')}

For each applicant (by their number 1-${targetApplicants.length}), provide a JSON array:
[{"index": 1, "score": 85, "recommendation": "Strong Yes", "strengths": ["Strong content background", "Proven track record"], "concerns": ["Limited analytics experience"]}]

Scores 0-100. Recommendations: "Strong Yes", "Yes", "Maybe", "No".
Return ONLY the JSON array, nothing else.`
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.content || data.result || data.text || JSON.stringify(data)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const scores = {}
          parsed.forEach(item => {
            const applicant = targetApplicants[item.index - 1]
            if (applicant) {
              scores[applicant.id] = {
                score: item.score,
                recommendation: item.recommendation,
                strengths: item.strengths || [],
                concerns: item.concerns || [],
              }
            }
          })
          for (const [appId, score] of Object.entries(scores)) {
            await supabase.from('applications').update({
              ai_score: score.score,
              ai_recommendation: score.recommendation,
              ai_analysis: { strengths: score.strengths, concerns: score.concerns },
            }).eq('id', appId)
          }
          setAiScores(scores)
          setShowAiResults(true)
        }
      }
    } catch (err) {
      console.error('AI screening error:', err)
      const targetApplicants = [...(stageData['Applied'] || []), ...(stageData['Reviewing'] || [])]
      const mockScores = {}
      targetApplicants.forEach(a => {
        const score = Math.min(99, Math.max(20, a.match + Math.floor(Math.random() * 20 - 10)))
        mockScores[a.id] = {
          score,
          recommendation: score >= 85 ? 'Strong Yes' : score >= 70 ? 'Yes' : score >= 50 ? 'Maybe' : 'No',
          strengths: ['Relevant industry experience', 'Strong portfolio'],
          concerns: score < 70 ? ['Limited specific skill match'] : [],
        }
      })
      setAiScores(mockScores)
      setShowAiResults(true)
    }
    setScreening(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Hiring Pipeline</h3>
          <p className="text-sm text-muted-foreground">Manage your applicants across hiring stages</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {Object.values(stageData).flat().length} applicants total
        </div>
      </div>

      {/* AI Screening toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleAIScreening}
          disabled={screening}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400 hover:bg-violet-500/30 text-sm font-medium transition-all disabled:opacity-60"
        >
          {screening ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <>✨ AI Screen Applicants</>}
        </button>
        {Object.keys(aiScores).length > 0 && (
          <button onClick={() => setSortByAi(v => !v)} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {sortByAi ? 'Unsort' : 'Sort by AI Score'}
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(stage => {
            let applicants = stageData[stage]
            if (sortByAi && Object.keys(aiScores).length > 0) {
              applicants = [...applicants].sort((a, b) => {
                const aScore = aiScores[a.id]?.score ?? -1
                const bScore = aiScores[b.id]?.score ?? -1
                return bScore - aScore
              })
            }
            return (
              <div key={stage} className="w-52 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stage}</h4>
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {stageData[stage].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {applicants.length === 0 && (
                    <div className="bg-muted/50 border border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground">No applicants</p>
                    </div>
                  )}
                  {applicants.map(applicant => (
                    <div key={applicant.id} className="bg-card border border-border rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {applicant.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{applicant.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{applicant.headline}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${matchColor(applicant.match)}`}>
                            {applicant.match}%
                          </span>
                          {/* AI score badge */}
                          {aiScores[applicant.id] && (
                            <div className="mt-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                aiScores[applicant.id].score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                aiScores[applicant.id].score >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                ✨ AI: {aiScores[applicant.id].score} · {aiScores[applicant.id].recommendation}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const a = applicant
                            setSelectedApplicant({ ...a, currentStage: stage })
                            setShowSchedule(false)
                            // Auto-move from Applied to Reviewing when first opened
                            if (stage === 'Applied') {
                              supabase.from('applications').update({ stage: 'reviewing', viewed_at: new Date().toISOString() }).eq('id', a.id)
                              setStageData(prev => {
                                const next = { ...prev }
                                next['Applied'] = prev['Applied'].filter(x => x.id !== a.id)
                                next['Reviewing'] = [...prev['Reviewing'], { ...a, currentStage: 'Reviewing' }]
                                return next
                              })
                            }
                          }}
                          className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Applicant Detail Sheet */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Applicant Detail</h3>
              <button onClick={() => setSelectedApplicant(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary text-xl font-bold flex items-center justify-center">
                {selectedApplicant.initials}
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">{selectedApplicant.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedApplicant.headline}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${matchColor(selectedApplicant.match)}`}>
                  {selectedApplicant.match}% match
                </span>
              </div>
            </div>

            {/* AI Analysis section */}
            {aiScores[selectedApplicant.id] && (
              <div className="mb-4 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-400 mb-2 flex items-center gap-1.5">✨ AI Analysis</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                    aiScores[selectedApplicant.id].score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                    aiScores[selectedApplicant.id].score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{aiScores[selectedApplicant.id].score}/100</span>
                  <span className="text-sm font-semibold text-foreground">{aiScores[selectedApplicant.id].recommendation}</span>
                </div>
                {aiScores[selectedApplicant.id].strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-muted-foreground mb-1">STRENGTHS</p>
                    {aiScores[selectedApplicant.id].strengths.map((s, i) => (
                      <p key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-emerald-400 flex-shrink-0">✓</span>{s}</p>
                    ))}
                  </div>
                )}
                {aiScores[selectedApplicant.id].concerns.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">CONCERNS</p>
                    {aiScores[selectedApplicant.id].concerns.map((c, i) => (
                      <p key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-yellow-400 flex-shrink-0">⚠</span>{c}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Cover Letter</p>
                <p className="text-sm text-foreground">Passionate about this opportunity and excited to bring my skills to your team. I have relevant experience and a strong portfolio demonstrating my capabilities...</p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Portfolio</p>
                <p className="text-sm text-primary">https://portfolio.example.com</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-muted-foreground block">Quick Actions</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => moveApplicant(selectedApplicant, 'Screening')}
                  className="py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  → Screening
                </button>
                <button onClick={() => moveApplicant(selectedApplicant, 'Interview')}
                  className="py-2 rounded-xl border border-primary/40 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                  → Interview
                </button>
                <button onClick={() => moveApplicant(selectedApplicant, 'Offer')}
                  className="py-2 rounded-xl border border-emerald-500/40 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  ✓ Send Offer
                </button>
                <button onClick={() => { moveApplicant(selectedApplicant, 'Rejected'); setSelectedApplicant(null) }}
                  className="py-2 rounded-xl border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                  ✗ Reject
                </button>
              </div>
            </div>

            {/* Stage Move */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-muted-foreground block">Move to Stage</label>
              <select
                value={selectedApplicant.currentStage || 'Applied'}
                onChange={async (e) => {
                  const newStage = e.target.value
                  await supabase.from('applications')
                    .update({ stage: newStage.toLowerCase() })
                    .eq('id', selectedApplicant.id)
                  setStageData(prev => {
                    const next = {}
                    STAGES.forEach(s => {
                      next[s] = prev[s].filter(a => a.id !== selectedApplicant.id)
                    })
                    next[newStage] = [...prev[newStage], { ...selectedApplicant, currentStage: newStage }]
                    return next
                  })
                  setSelectedApplicant(prev => ({ ...prev, currentStage: newStage }))
                }}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
              >
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Schedule Interview */}
            <div className="mb-4">
              <button
                onClick={() => setShowSchedule(s => !s)}
                className="w-full py-2 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 text-sm font-medium transition-colors"
              >
                {showSchedule ? 'Hide Scheduler' : 'Schedule Interview'}
              </button>
              {showSchedule && (
                <div className="space-y-3 p-3 bg-muted rounded-xl mt-2">
                  <p className="text-xs font-semibold text-foreground">Schedule Interview</p>
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none">
                    <option>Video Call (Philomni Room)</option>
                    <option>Phone Call</option>
                    <option>In-Person</option>
                  </select>
                  <input type="datetime-local" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none" />
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none">
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>1 hour</option>
                    <option>1.5 hours</option>
                  </select>
                  <button
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                    onClick={async () => {
                      await supabase.from('bookings').insert({
                        title: `Interview: ${selectedApplicant.name}`,
                        type: 'interview',
                        applicant_name: selectedApplicant.name,
                      })
                      setShowSchedule(false)
                      // Auto-move to Interview stage
                      setStageData(prev => {
                        const next = {}
                        STAGES.forEach(s => { next[s] = prev[s].filter(x => x.id !== selectedApplicant.id) })
                        next['Interview'] = [...next['Interview'], { ...selectedApplicant, currentStage: 'Interview' }]
                        return next
                      })
                      setSelectedApplicant(prev => ({ ...prev, currentStage: 'Interview' }))
                      await supabase.from('applications').update({ stage: 'interview' }).eq('id', selectedApplicant.id)
                      alert('Interview scheduled! Candidate notification sent.')
                    }}
                  >
                    Send Interview Invite
                  </button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await supabase.from('applications').update({ stage: 'rejected' }).eq('id', selectedApplicant.id)
                  setStageData(prev => {
                    const next = { ...prev }
                    STAGES.forEach(s => { next[s] = prev[s].filter(a => a.id !== selectedApplicant.id) })
                    next['Rejected'] = [...next['Rejected'], selectedApplicant]
                    return next
                  })
                  setSelectedApplicant(null)
                }}
                className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Jobs() {
  const { user } = useAuth()
  const { mode } = useMode()
  const { canUse, incrementUsage } = useSubscription()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('browse')
  const [jobs, setJobs] = useState(SAMPLE_JOBS)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [savedJobs, setSavedJobs] = useState(new Set())
  const [selectedJob, setSelectedJob] = useState(null)
  const [showApply, setShowApply] = useState(false)
  const [showPostJob, setShowPostJob] = useState(false)
  const [jobLimitMsg, setJobLimitMsg] = useState(null)

  const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Freelance']

  useEffect(() => {
    supabase.from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data?.length) setJobs(data) })
      .catch(() => {}) // keep SAMPLE_JOBS on error
  }, [])

  useEffect(() => {
    async function loadSaved() {
      if (!user) return
      const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id)
      if (data) setSavedJobs(new Set(data.map(r => r.job_id)))
    }
    loadSaved()
  }, [user])

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.tags.some(t => t.toLowerCase().includes(q))
      const matchesType = typeFilter === 'All' || job.type === typeFilter
      const matchesRemote = !remoteOnly || job.remote_type === 'Remote'
      return matchesSearch && matchesType && matchesRemote
    })
  }, [searchQuery, typeFilter, remoteOnly])

  const savedJobsList = useMemo(() => jobs.filter(j => savedJobs.has(j.id)), [jobs, savedJobs])

  async function toggleSave(jobId) {
    const next = new Set(savedJobs)
    if (next.has(jobId)) {
      next.delete(jobId)
      await supabase.from('saved_jobs').delete()
        .eq('job_id', jobId).eq('user_id', user?.id)
    } else {
      next.add(jobId)
      await supabase.from('saved_jobs').insert({ job_id: jobId, user_id: user?.id })
    }
    setSavedJobs(next)
  }

  function openJob(job) {
    setSelectedJob(job)
    setShowApply(false)
  }

  function handleApply() {
    // Check job application limit before opening the apply modal
    const check = canUse('job_application')
    if (!check.allowed) {
      setJobLimitMsg(check.reason)
      return
    }
    setJobLimitMsg(null)
    setShowApply(true)
    // Track usage when the modal opens (user intent to apply)
    incrementUsage('job_application')
  }

  const statusColors = {
    'Under Review': 'bg-blue-500/20 text-blue-400',
    'Screening': 'bg-yellow-500/20 text-yellow-400',
    'Interview Scheduled': 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === 'creator' ? '🎨 Creator Opportunities' : '💼 Jobs & Careers'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'creator'
                ? 'Brand deals, UGC briefs, creator roles, and creative economy jobs'
                : 'Professional roles, leadership positions, and career opportunities'}
            </p>
          </div>
          <button
            onClick={() => setShowPostJob(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={mode === 'creator' ? 'Search creator opportunities, brand deals, UGC briefs...' : 'Search jobs, roles, companies...'}
            className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {JOB_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === type ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={e => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            Remote only
          </label>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
          {[
            { key: 'browse', label: 'Browse Jobs' },
            { key: 'applications', label: 'My Applications' },
            { key: 'pipeline', label: 'Hiring Pipeline' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{filteredJobs.length}</span> creator economy jobs
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                Sorted by match
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onOpen={openJob}
                  saved={savedJobs.has(job.id)}
                  onSave={toggleSave}
                />
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No jobs found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
              </div>
            )}

            {/* Saved jobs section */}
            {savedJobsList.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-primary" /> Saved Jobs ({savedJobsList.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {savedJobsList.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onOpen={openJob}
                      saved={true}
                      onSave={toggleSave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Creator: Brand Partnership & UGC Opportunities spotlight */}
            {mode === 'creator' && (
              <div className="mt-8 bg-gradient-to-br from-violet-500/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🤝</span>
                  <h2 className="text-base font-bold text-foreground">Brand Partnership Opportunities</h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold">New</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Brands looking for creators right now — no middleman, no agency fees.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { brand: 'Glossier', emoji: '💄', type: 'UGC Campaign Brief', budget: '$300/video', niche: 'Beauty & Wellness', slots: 10 },
                    { brand: 'GoPro', emoji: '📸', type: 'Brand Ambassador', budget: '$1,500–$3,000/mo', niche: 'Adventure & Sports', slots: 5 },
                    { brand: 'Notion', emoji: '📋', type: 'Sponsored Content', budget: '$800/post', niche: 'Productivity & Tech', slots: 3 },
                    { brand: 'Spotify', emoji: '🎵', type: 'Podcast Integration', budget: 'Custom CPM', niche: 'Music & Culture', slots: 8 },
                  ].map(opp => (
                    <div key={opp.brand} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{opp.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opp.brand}</p>
                          <p className="text-xs text-muted-foreground">{opp.type}</p>
                        </div>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">{opp.slots} slots</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>💰 {opp.budget}</span>
                        <span>🎯 {opp.niche}</span>
                      </div>
                      <button className="w-full mt-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors">
                        Apply Now →
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">More brand opportunities coming soon. <span className="text-primary cursor-pointer hover:underline">Submit your media kit →</span></p>
              </div>
            )}

            {/* Browse by Company */}
            <div className="mt-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Browse by Company
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {mode === 'creator' ? 'Explore jobs at top creator economy companies' : 'Explore roles at leading companies'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {COMPANY_HIGHLIGHTS.map(co => (
                  <button key={co.id} onClick={() => navigate(`/company/${co.id}`)}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all text-left group">
                    <div className="text-3xl mb-2">{co.emoji}</div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{co.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{co.jobs} open roles</p>
                    <p className="text-xs text-muted-foreground">{co.industry}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/companies')} className="mt-4 w-full py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                View All Companies →
              </button>
            </div>
          </div>
        )}

        {/* My Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">My Applications</h2>
              <span className="text-sm text-muted-foreground">{SAMPLE_APPLICATIONS.length} active</span>
            </div>
            {SAMPLE_APPLICATIONS.map((app, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {app.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{app.title}</h3>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Applied {app.applied_date}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[app.status] || 'bg-muted text-muted-foreground'}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {app.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === 'Interview Scheduled' && (
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 font-medium hover:opacity-80 transition-opacity">
                        View Interview
                      </button>
                    )}
                    <button className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-colors">
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {SAMPLE_APPLICATIONS.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No applications yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Start applying to jobs to track your progress here</p>
                <button onClick={() => setActiveTab('browse')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hiring Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <HiringPipeline />
        )}
      </div>

      {/* Job application limit prompt */}
      {jobLimitMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <UpgradePrompt reason={jobLimitMsg} />
          <button
            onClick={() => setJobLimitMsg(null)}
            className="absolute top-1 right-5 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && !showApply && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
        />
      )}

      {/* Apply Modal */}
      {selectedJob && showApply && (
        <ApplyModal
          job={selectedJob}
          onClose={() => { setShowApply(false); setSelectedJob(null) }}
        />
      )}

      {/* Post Job Modal */}
      {showPostJob && (
        <PostJobModal onClose={() => setShowPostJob(false)} />
      )}
    </div>
  )
}
