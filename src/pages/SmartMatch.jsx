import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles, ArrowLeft, ArrowRight, Check, MapPin, Briefcase,
  Users, Heart, MessageCircle, X, Clock, Star, ChevronRight,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const LOOKING_FOR = [
  { id: 'investment', emoji: '🏦', label: 'Investment / Funding', desc: 'I have an idea or business that needs funding', matchLabel: 'investors, VCs & angel investors' },
  { id: 'cofounder',  emoji: '🤝', label: 'Co-Founder / Partner',  desc: 'I need someone to build this with me',           matchLabel: 'complementary co-founders' },
  { id: 'talent',     emoji: '🎨', label: 'Creative Talent',       desc: 'I need a designer, editor, creator, musician…', matchLabel: 'verified creative talent' },
  { id: 'clients',    emoji: '💼', label: 'Clients / Brands',      desc: "I'm a creator or freelancer looking for paid work", matchLabel: 'brands and businesses hiring' },
  { id: 'mentor',     emoji: '🧠', label: 'Mentor / Advisor',      desc: "I need guidance from someone who's been there",  matchLabel: 'experienced mentors & advisors' },
  { id: 'network',    emoji: '👥', label: 'Community / Network',   desc: 'I want to connect with people in my niche',      matchLabel: 'relevant community members' },
]

const OFFERING = [
  { id: 'investor',  emoji: '🏦', label: "I'm an Investor",            desc: 'Looking for deals & opportunities' },
  { id: 'cofounder', emoji: '🤝', label: "I'm available to Co-Found",  desc: 'Ready to build something great together' },
  { id: 'creator',   emoji: '🎨', label: "I'm a Creator — open to work", desc: 'Available for brand deals & collabs' },
  { id: 'brand',     emoji: '💼', label: "I'm a Brand",                desc: 'Looking for creators and talent' },
  { id: 'mentor',    emoji: '🧠', label: "I'm a Mentor",               desc: 'Open to guiding the next generation' },
  { id: 'network',   emoji: '👥', label: "I'm building my network",    desc: 'Here to connect and grow together' },
]

const QUESTIONS = {
  investment: [
    { id: 'stage',    label: 'What stage is your business?', type: 'chips',   options: ['Just an idea', 'Pre-revenue', 'Making revenue', 'Scaling'] },
    { id: 'industry', label: 'What industry?',               type: 'select',  options: ['Tech', 'Creative / Media', 'Fashion', 'Food & Beverage', 'Health', 'Education', 'Finance', 'Social Impact', 'Other'] },
    { id: 'amount',   label: 'How much are you seeking?',    type: 'chips',   options: ['Under $10K', '$10K – $50K', '$50K – $250K', '$250K+'] },
    { id: 'location', label: 'Where are you based?',         type: 'text',    placeholder: 'e.g. Lagos, Nigeria' },
  ],
  cofounder: [
    { id: 'brings',   label: 'What do you bring to the table?',   type: 'chips',   options: ['Technical / Engineering', 'Product / Design', 'Marketing / Growth', 'Sales / BD', 'Finance / Ops'] },
    { id: 'seeking',  label: 'What skills does your co-founder need?', type: 'chips', options: ['Technical / Engineering', 'Product / Design', 'Marketing / Growth', 'Sales / BD', 'Finance / Ops'] },
    { id: 'stage',    label: 'Where are you in the journey?',     type: 'chips',   options: ['Still ideating', 'Building MVP', 'Launched, no revenue', 'Generating revenue'] },
    { id: 'commit',   label: 'Expected time commitment?',         type: 'chips',   options: ['Full-time', 'Part-time', 'Advisory only'] },
  ],
  talent: [
    { id: 'type',     label: 'What kind of talent do you need?',  type: 'chips',  options: ['Designer', 'Video Editor', 'Photographer', 'Musician / Audio', 'Writer / Copywriter', 'Developer'] },
    { id: 'budget',   label: 'Budget range?',                     type: 'chips',  options: ['Volunteer / Equity', '$50 – $200', '$200 – $1,000', '$1,000+'] },
    { id: 'project',  label: 'Type of engagement?',               type: 'chips',  options: ['One-time project', 'Ongoing contract', 'Full-time hire'] },
    { id: 'when',     label: 'When do you need them?',            type: 'chips',  options: ['ASAP', 'Within a month', 'Flexible timeline'] },
  ],
  clients: [
    { id: 'specialty', label: 'What is your specialty?',         type: 'chips',  options: ['UGC / Content Creation', 'Social Media Management', 'Photography', 'Video Production', 'Copywriting', 'Graphic Design'] },
    { id: 'rate',      label: 'What is your monthly rate range?', type: 'chips', options: ['Under $500', '$500 – $2K', '$2K – $5K', '$5K+'] },
    { id: 'location',  label: 'Work preference?',                 type: 'chips', options: ['Remote only', 'Open to local', 'Local only'] },
    { id: 'start',     label: 'When can you start?',              type: 'chips', options: ['Immediately', 'Within 2 weeks', 'Next month'] },
  ],
  mentor: [
    { id: 'field',     label: 'What field do you need mentorship in?', type: 'chips', options: ['Tech / Product', 'Business / Strategy', 'Creative Industries', 'Finance / Investing', 'Marketing / Growth', 'Personal Development'] },
    { id: 'exp',       label: 'Seniority level of mentor?',            type: 'chips', options: ['2–5 years experience', '5–10 years experience', '10+ years experience'] },
    { id: 'format',    label: 'Preferred format?',                     type: 'chips', options: ['Weekly video calls', 'Async / text-based', 'Both work for me'] },
    { id: 'duration',  label: 'Duration?',                             type: 'chips', options: ['Single session', 'Monthly commitment', 'Long-term relationship'] },
  ],
  network: [
    { id: 'industry',  label: "What's your industry / niche?",   type: 'chips',  options: ['Tech', 'Creative / Media', 'Finance', 'Education', 'Health & Wellness', 'Fashion', 'Music', 'Social Impact'] },
    { id: 'goal',      label: 'What are you looking to do?',      type: 'chips',  options: ['Find collaborators', 'Learn from others', 'Find opportunities', 'Give back', 'All of the above'] },
    { id: 'geo',       label: 'Location preference?',             type: 'chips',  options: ['People in my city', 'My country / region', 'Anywhere globally'] },
  ],
}

const SAMPLE_MATCHES = {
  investment: [
    { id: 'm1', name: 'Sarah Kwame',     location: 'Lagos, Nigeria',    role: 'Angel Investor · Tech & Media',          pct: 94, avatar: '🧑🏾', why: ["Your industry: Creator Economy", "Your stage: Pre-revenue", "Her focus: African early-stage founders"], bio: "Has invested in 12 African startups. Actively looking for creator-economy plays." },
    { id: 'm2', name: 'David Osei',      location: 'Accra, Ghana',      role: 'VC Partner · Accel Africa Fund',         pct: 88, avatar: '👨🏿', why: ["Writes $25K–$100K first checks", "Deep media industry knowledge", "Open to remote-first teams"], bio: "Previously built and sold two media companies. Now backs the next generation." },
    { id: 'm3', name: 'Priya Nair',      location: 'London, UK',        role: 'Angel Network · Founders of Color',      pct: 82, avatar: '👩🏽', why: ["Backs diverse founders globally", "Strong network in creator tools", "Mentors as well as invests"], bio: "Led 30+ angel investments across Africa, South Asia, and Latin America." },
    { id: 'm4', name: 'Marcus Webb',     location: 'Toronto, Canada',   role: 'Impact Investor · Social Ventures',     pct: 79, avatar: '👨🏾', why: ["Focus on community platforms", "Looking for African market exposure", "Invests up to $250K"], bio: "Serial entrepreneur turned investor. Passionate about platforms with real community impact." },
    { id: 'm5', name: 'Amara Johnson',   location: 'Nairobi, Kenya',    role: 'Crowdfunding Lead · Seedstars',          pct: 74, avatar: '👩🏾', why: ["East Africa specialist", "Creative economy investments", "Strong media connections"], bio: "Runs Africa's largest creator-focused investment syndicate." },
  ],
  cofounder: [
    { id: 'm1', name: 'Kofi Acheampong', location: 'Accra, Ghana',      role: 'Full-Stack Engineer · 7 years exp',      pct: 96, avatar: '👨🏿', why: ["Perfectly complements your skill set", "Built 3 SaaS products before", "Looking for co-founder with your background"], bio: "Previously at Google. Loves building products from 0 to 1. Needs a creative / growth partner." },
    { id: 'm2', name: 'Zainab Musa',     location: 'Abuja, Nigeria',    role: 'Product Designer · Ex-Spotify',          pct: 91, avatar: '👩🏿', why: ["Design + product thinking combined", "Available full-time immediately", "Has a complementary network"], bio: "World-class product designer ready to co-build something meaningful in the creator space." },
    { id: 'm3', name: 'James Okafor',    location: 'Lagos, Nigeria',    role: 'Growth / Marketing Lead',                pct: 85, avatar: '👨🏾', why: ["Built 2 creator platforms to 100K+ users", "Brings distribution you need", "Looking for a technical co-founder"], bio: "Grew two platforms from zero. Ready to do it again with the right partner." },
    { id: 'm4', name: 'Nadia Petrov',    location: 'Berlin, Germany',   role: 'Engineer + Entrepreneur',                pct: 81, avatar: '👩🏼', why: ["Has raised funding before", "Full-stack + AI background", "Open to remote co-founding"], bio: "Built and sold a B2B SaaS. Wants to work on consumer social this time." },
  ],
  talent: [
    { id: 'm1', name: 'Tunde Adeyemi',   location: 'Lagos, Nigeria',    role: 'Motion Designer · Brand Specialist',     pct: 95, avatar: '👨🏾', why: ["Matches your budget range exactly", "Available immediately", "Portfolio in your category"], bio: "5 years creating for top African brands. Works fast, communicates well." },
    { id: 'm2', name: 'Chisom Nwosu',    location: 'Enugu, Nigeria',    role: 'Video Editor · YouTube + Reels Expert',  pct: 90, avatar: '👩🏿', why: ["Specializes in short-form video", "Delivered 200+ projects on time", "Open to ongoing work"], bio: "Has edited for creators with 5M+ combined followers. Turnaround in 24–48 hours." },
    { id: 'm3', name: 'André Batista',   location: 'São Paulo, Brazil', role: 'Music Producer · Afro / Amapiano',       pct: 87, avatar: '👨🏽', why: ["Genre fits your project brief", "Works remotely across time zones", "Has a content license package"], bio: "Produced beats for chart-toppers. Available for custom tracks and licensing." },
    { id: 'm4', name: 'Blessing Okon',   location: 'Port Harcourt, NG', role: 'UGC Creator · Lifestyle & Beauty',       pct: 83, avatar: '👩🏾', why: ["10K+ authentic followers in your niche", "Produced 50+ UGC pieces", "Very affordable rate"], bio: "Specializes in authentic, conversion-focused UGC for brands in FMCG and beauty." },
  ],
  clients: [
    { id: 'm1', name: 'Flo Beauty NG',   location: 'Lagos, Nigeria',    role: 'Brand · Beauty & Personal Care',         pct: 93, avatar: '🏢', why: ["Looking for your exact specialty", "Budget matches your rate", "Has worked with 10+ creators"], bio: "Fast-growing beauty brand actively seeking long-term creator partnerships." },
    { id: 'm2', name: 'TechHive Africa', location: 'Nairobi, Kenya',    role: 'Tech Media Brand · B2B Content',         pct: 88, avatar: '🏢', why: ["Needs content in your niche", "Monthly retainer available", "Remote-first team"], bio: "Tech media platform reaching 500K monthly readers. Looking for consistent content creators." },
    { id: 'm3', name: 'Naomi Styles',    location: 'London, UK',        role: 'Fashion Creator · Personal Brand',       pct: 82, avatar: '👩🏾', why: ["Wants to outsource editing", "Budget in your range", "Very structured to work with"], bio: "Fashion creator with 300K followers. Needs a reliable long-term creative partner." },
    { id: 'm4', name: 'Global Eats',     location: 'Toronto, Canada',   role: 'Food Brand · African Diaspora',          pct: 77, avatar: '🏢', why: ["Targets your audience", "Looking for African creators", "Campaign starts next month"], bio: "Pan-African food brand expanding into UK and Canada. UGC campaign launching soon." },
  ],
  mentor: [
    { id: 'm1', name: 'Dr. Yemi Adeola', location: 'Lagos, Nigeria',    role: 'Serial Entrepreneur · 15+ years',        pct: 96, avatar: '👨🏾', why: ["Exact industry match", "Has mentored 50+ founders", "Available for your preferred format"], bio: "Built 3 companies from Nigeria to global scale. Mentors promising founders pro bono." },
    { id: 'm2', name: 'Claire Thompson', location: 'London, UK',        role: 'Creative Director · Ex-BBC',             pct: 91, avatar: '👩🏼', why: ["Deep creative industry expertise", "Warm, structured approach", "Available for monthly sessions"], bio: "20 years in global media. Specializes in helping African creatives break into global markets." },
    { id: 'm3', name: 'Emeka Eze',       location: 'San Francisco, US', role: 'VC & Angel Investor · Tech',             pct: 85, avatar: '👨🏿', why: ["Fundraising expertise you need", "Active mentor in your industry", "Straightforward, direct style"], bio: "Partner at a top US VC firm. Mentors 5 early-stage founders at a time. Applications open." },
    { id: 'm4', name: 'Funke Alabi',     location: 'Abuja, Nigeria',    role: 'Marketing Executive · FMCG Expert',      pct: 80, avatar: '👩🏿', why: ["20 years brand-building experience", "Loves mentoring women in business", "Async communication preferred"], bio: "CMO at a Fortune 500 FMCG. Mentors 2–3 people per year. Very selective but very impactful." },
  ],
  network: [
    { id: 'm1', name: 'The Creator Hub', location: '4,200 members',     role: 'Community · African Creators',           pct: 97, avatar: '🌍', why: ["Matches your industry exactly", "Active daily engagement", "Has events in your city"], bio: "The largest community of African creators online. Weekly collabs, monthly meetups." },
    { id: 'm2', name: 'Aisha Kamara',    location: 'Accra, Ghana',      role: 'Community Builder · Tech',               pct: 90, avatar: '👩🏿', why: ["Runs regular creator events", "Powerful connector in your niche", "Looking to grow her network too"], bio: "Founded Ghana's top creator collective. Passionate about building bridges between creators and brands." },
    { id: 'm3', name: 'Black Founders',  location: '8,000+ members',    role: 'Community · Startup Founders',           pct: 85, avatar: '🤝', why: ["Active investor matching programme", "Weekly founder roundtables", "Strong African representation"], bio: "Community for Black entrepreneurs globally. Resources, connections, and real opportunities." },
    { id: 'm4', name: 'Emre Yilmaz',     location: 'Istanbul, Turkey',  role: 'Entrepreneur · Creator Economy',         pct: 79, avatar: '👨🏼', why: ["Shared interest in creator tools", "Looking for African market partners", "Active and responsive"], bio: "Building tools for creators in emerging markets. Looking to expand to Africa and collaborate." },
  ],
}

const SUCCESS_STORIES = [
  { from: 'Marcus O.', fromLoc: 'Lagos', to: 'FreshBrand', toLoc: 'Toronto', result: 'Landed a $15,000 UGC contract', emoji: '🎬', category: 'Creator → Brand' },
  { from: "Amara's Fintech",  fromLoc: 'Abuja',  to: 'Angel Investor', toLoc: 'London',  result: 'Closed first $50K angel round',     emoji: '💰', category: 'Founder → Investor' },
  { from: 'Zara & David',    fromLoc: 'Accra',  to: 'Co-Founders',    toLoc: 'Remote',  result: 'Launched and hit 1K users in 30 days', emoji: '🚀', category: 'Co-Founder Match' },
  { from: 'Blessing K.',     fromLoc: 'Nairobi',to: 'Claire T.',      toLoc: 'London',  result: 'Secured BBC partnership deal',       emoji: '🏆', category: 'Creator → Mentor' },
  { from: 'TechHive Nigeria', fromLoc: 'Lagos', to: 'Kofi Design',    toLoc: 'Accra',   result: 'Built a 50K-follower media brand',   emoji: '📈', category: 'Brand → Talent' },
  { from: 'Priya S.',        fromLoc: 'Mumbai', to: 'Africa Network', toLoc: 'Global',  result: 'Expanded business to 3 new markets', emoji: '🌍', category: 'Network Expansion' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchCard({ match, onConnect, onPass }) {
  const navigate = useNavigate()
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
          {match.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground">{match.name}</span>
            <span className="text-xs bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">{match.pct}% match</span>
          </div>
          <p className="text-xs text-primary font-medium mt-0.5">{match.role}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{match.location}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-muted-foreground italic">"{match.bio}"</p>

      {/* Why match */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Why you match</p>
        {match.why.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            {r}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConnect(match)}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition"
        >
          Connect <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition"
        >
          View Profile
        </button>
        <button
          onClick={() => onPass(match.id)}
          className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition"
        >
          Pass
        </button>
      </div>
    </div>
  )
}

function ConnectModal({ match, lookingFor, onClose, onSent }) {
  const [message, setMessage] = useState(
    `Hi ${match.name.split(' ')[0]}, I found you through Philomni SmartMatch. I'm looking for ${lookingFor} and think we could be a great fit. I'd love to connect and explore the possibility of working together!`
  )
  const navigate = useNavigate()

  const handleSend = () => {
    onSent()
    navigate('/messages')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-lg">Send Connection Request</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">{match.avatar}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{match.name}</p>
            <p className="text-xs text-muted-foreground">{match.role}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Your intro message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
        <button
          onClick={handleSend}
          className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Send & Open Messages
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartMatch() {
  const { user } = useAuth()
  const [view, setView] = useState('home')          // home | questions | matching | results | history
  const [lookingFor, setLookingFor] = useState(null)
  const [offerAs, setOfferAs] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [matches, setMatches] = useState([])
  const [passed, setPassed] = useState([])
  const [connected, setConnected] = useState([])
  const [connectTarget, setConnectTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const questions = lookingFor ? QUESTIONS[lookingFor] ?? [] : []
  const selectedCategory = LOOKING_FOR.find(l => l.id === lookingFor)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2800)
  }

  const startLooking = (id) => {
    setLookingFor(id)
    setAnswers({})
    setCurrentQ(0)
    setView('questions')
  }

  const handleAnswer = (qId, val) => {
    setAnswers(a => ({ ...a, [qId]: val }))
  }

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      runMatching()
    }
  }

  const runMatching = () => {
    setView('matching')
    setTimeout(() => {
      const raw = SAMPLE_MATCHES[lookingFor] ?? []
      setMatches(raw.filter(m => !passed.includes(m.id)))
      setView('results')
    }, 2200)
  }

  const handlePass = useCallback((id) => {
    setPassed(p => [...p, id])
    setMatches(m => m.filter(x => x.id !== id))
  }, [])

  const handleConnect = useCallback((match) => {
    setConnectTarget(match)
  }, [])

  const handleSent = useCallback(() => {
    if (!connectTarget) return
    setConnected(c => [...c, connectTarget])
    setMatches(m => m.filter(x => x.id !== connectTarget.id))
    setConnectTarget(null)
    showToast(`Connection request sent to ${connectTarget.name}!`)
  }, [connectTarget])

  const q = questions[currentQ]
  const canNext = q && (answers[q.id] || q.type === 'text')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none whitespace-nowrap">
          ✅ {toastMsg}
        </div>
      )}

      {/* Connect modal */}
      {connectTarget && (
        <ConnectModal
          match={connectTarget}
          lookingFor={selectedCategory?.label ?? 'a connection'}
          onClose={() => setConnectTarget(null)}
          onSent={handleSent}
        />
      )}

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      {view === 'home' && (
        <>
          {/* Hero */}
          <div className="text-center py-8 px-4 bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/20 rounded-3xl">
            <div className="text-5xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Find Your Missing Piece</h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Whether you need a co-founder, investor, collaborator, client, or creative partner —
              Philomni SmartMatch connects you to exactly who you need.
            </p>
          </div>

          {/* Two columns */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Looking For */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">?</span>
                I am looking for…
              </h2>
              <div className="space-y-2.5">
                {LOOKING_FOR.map(item => (
                  <button
                    key={item.id}
                    onClick={() => startLooking(item.id)}
                    className="w-full text-left bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Offering */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">!</span>
                I have to offer…
              </h2>
              <div className="space-y-2.5">
                {OFFERING.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setOfferAs(offerAs === item.id ? null : item.id)}
                    className={`w-full text-left rounded-2xl p-4 border transition-all ${
                      offerAs === item.id
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-card border-border hover:border-emerald-500/30 hover:bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      {offerAs === item.id && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
              {offerAs && (
                <button
                  onClick={() => showToast('You\'re now in the matching pool! Others can find you.')}
                  className="w-full mt-3 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition text-sm"
                >
                  Add me to the pool ✓
                </button>
              )}
            </div>
          </div>

          {/* Match history CTA */}
          {connected.length > 0 && (
            <button
              onClick={() => setView('history')}
              className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4 hover:bg-muted transition"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground text-sm">{connected.length} connection{connected.length > 1 ? 's' : ''} pending</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Success stories */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">🌟 What's Possible on Philomni</h2>
            <p className="text-xs text-muted-foreground mb-4">Aspirational examples of what SmartMatch connections can look like</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUCCESS_STORIES.map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{s.result}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{s.from}</span> ({s.fromLoc}) connected with <span className="text-foreground font-medium">{s.to}</span> ({s.toLoc})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── QUESTIONS ────────────────────────────────────────────────────── */}
      {view === 'questions' && q && (
        <div className="space-y-6">
          {/* Back + progress */}
          <div className="flex items-center gap-4">
            <button onClick={() => { setView('home'); setCurrentQ(0) }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex-1 flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentQ ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{currentQ + 1} / {questions.length}</span>
          </div>

          {/* Category badge */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCategory?.emoji}</span>
            <div>
              <p className="font-bold text-foreground">{selectedCategory?.label}</p>
              <p className="text-xs text-muted-foreground">Matching you with {selectedCategory?.matchLabel}</p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">{q.label}</h2>

            {q.type === 'chips' && (
              <div className="flex flex-wrap gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      answers[q.id] === opt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'select' && (
              <select
                value={answers[q.id] ?? ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select an option…</option>
                {q.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {q.type === 'text' && (
              <input
                value={answers[q.id] ?? ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}
          </div>

          <button
            onClick={nextQuestion}
            disabled={q.type !== 'text' && !answers[q.id]}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {currentQ < questions.length - 1 ? (
              <><ArrowRight className="w-4 h-4" /> Next</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Find My Matches</>
            )}
          </button>
        </div>
      )}

      {/* ── MATCHING (loading) ────────────────────────────────────────────── */}
      {view === 'matching' && (
        <div className="py-24 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Finding your matches…</h2>
            <p className="text-muted-foreground text-sm mt-2">Analysing profiles across the Philomni network</p>
          </div>
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS ──────────────────────────────────────────────────────── */}
      {view === 'results' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-2">
                <ArrowLeft className="w-4 h-4" /> New Search
              </button>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {matches.length} matches for "{selectedCategory?.label}"
              </h2>
            </div>
            {connected.length > 0 && (
              <button onClick={() => setView('history')} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-semibold text-foreground">No more matches</p>
              <p className="text-sm text-muted-foreground mt-1">You've reviewed all available matches in this category.</p>
              <button onClick={() => setView('home')} className="mt-4 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition">
                Try Another Category
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map(m => (
                <MatchCard key={m.id} match={m} onConnect={handleConnect} onPass={handlePass} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ──────────────────────────────────────────────────────── */}
      {view === 'history' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-foreground">Match History</h2>
          </div>

          {connected.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No connection history yet</p>
              <p className="text-sm mt-1">Start matching to see your requests here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connected.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                  <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
