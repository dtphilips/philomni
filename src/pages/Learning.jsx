import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Search, Star, Clock, BookOpen, Users, ChevronDown, ChevronRight,
  Play, Lock, CheckCircle, X, Plus, Trash2, Upload, Award,
  TrendingUp, Zap, GraduationCap, BarChart2, ChevronLeft, Globe,
  ThumbsUp, ThumbsDown, MessageCircle, StickyNote, HelpCircle,
  FileText, Mic, Video, File, Download, Send, Filter,
} from 'lucide-react'

// ─── Static Data ────────────────────────────────────────────────────────────

const CREATOR_CATEGORIES = [
  { id: 'video',        icon: '🎬', label: 'Video Production',      count: 94  },
  { id: 'music',        icon: '🎵', label: 'Music & Audio',          count: 67  },
  { id: 'social',       icon: '📱', label: 'Social Media Growth',    count: 112 },
  { id: 'monetization', icon: '💰', label: 'Creator Monetization',   count: 45  },
  { id: 'design',       icon: '🎨', label: 'Design & Branding',      count: 88  },
  { id: 'photo',        icon: '📸', label: 'Photography',            count: 56  },
  { id: 'writing',      icon: '✍️', label: 'Writing & Storytelling', count: 73  },
  { id: 'speaking',     icon: '🎤', label: 'Public Speaking',        count: 34  },
  { id: 'ugc',          icon: '🤳', label: 'UGC Creation',           count: 28  },
  { id: 'podcasting',   icon: '🎙', label: 'Podcasting',             count: 41  },
  { id: 'gaming',       icon: '🎮', label: 'Gaming & Streaming',     count: 52  },
  { id: 'ai',           icon: '🤖', label: 'AI for Creators',        count: 39  },
]

const PRO_CATEGORIES = [
  { id: 'cybersecurity', icon: '🔒', label: 'Cybersecurity',              count: 87  },
  { id: 'business',      icon: '💼', label: 'Business & Entrepreneurship', count: 142 },
  { id: 'marketing',     icon: '📊', label: 'Marketing & Sales',           count: 118 },
  { id: 'tech',          icon: '💻', label: 'Tech & Programming',          count: 203 },
  { id: 'finance',       icon: '💰', label: 'Finance & Investing',         count: 76  },
  { id: 'leadership',    icon: '🏆', label: 'Leadership & Management',     count: 94  },
  { id: 'data',          icon: '📈', label: 'Data & Analytics',            count: 112 },
  { id: 'pm',            icon: '📋', label: 'Project Management',          count: 68  },
  { id: 'ux',            icon: '🎨', label: 'UX & Product Design',         count: 89  },
  { id: 'hr',            icon: '👥', label: 'HR & People Ops',             count: 45  },
  { id: 'legal',         icon: '⚖️', label: 'Legal & Compliance',          count: 34  },
  { id: 'writing',       icon: '✍️', label: 'Business Writing',            count: 57  },
]

// Pro trending courses (full shape for CourseCard)
const PRO_TRENDING_COURSES = [
  { id: 'pt1', title: 'CISSP Certification Complete Guide', subtitle: 'Pass the CISSP on your first attempt', category: 'cybersecurity', level: 'Advanced', instructor: 'David K.', thumbnail: '🔒', price: 129, original_price: 249, rating: 4.9, review_count: 8432, enrollment_count: 28400, total_lessons: 85, total_duration_hours: 42, skills: ['Cryptography','Network Security','Risk Management','CISSP'], status: 'published' },
  { id: 'pt2', title: 'Digital Marketing Strategy 2025', subtitle: 'Drive real business results', category: 'marketing', level: 'Intermediate', instructor: 'Sarah M.', thumbnail: '📊', price: 79, original_price: 149, rating: 4.8, review_count: 6201, enrollment_count: 15600, total_lessons: 45, total_duration_hours: 18, skills: ['SEO','PPC','Email Marketing','Analytics'], status: 'published' },
  { id: 'pt3', title: 'Financial Modeling & Valuation', subtitle: 'Build models used at investment banks', category: 'finance', level: 'Intermediate', instructor: 'James L.', thumbnail: '💰', price: 99, original_price: 199, rating: 4.7, review_count: 4892, enrollment_count: 12300, total_lessons: 38, total_duration_hours: 22, skills: ['DCF','LBO','Excel','Valuation'], status: 'published' },
  { id: 'pt4', title: 'Python for Data Science', subtitle: 'From beginner to job-ready in 12 weeks', category: 'tech', level: 'Beginner', instructor: 'Kwame A.', thumbnail: '💻', price: 89, original_price: 179, rating: 4.8, review_count: 5620, enrollment_count: 52000, total_lessons: 40, total_duration_hours: 18, skills: ['Python','Pandas','ML','Data Visualization'], status: 'published' },
  { id: 'pt5', title: 'Product Management Fundamentals', subtitle: 'Launch products users love', category: 'pm', level: 'Beginner', instructor: 'Sarah B.', thumbnail: '📋', price: 0, original_price: 0, rating: 4.6, review_count: 4231, enrollment_count: 41000, total_lessons: 22, total_duration_hours: 7, skills: ['Roadmap','User Research','Agile'], status: 'published' },
  { id: 'pt6', title: 'Leadership & Executive Presence', subtitle: 'Lead with confidence and clarity', category: 'leadership', level: 'Intermediate', instructor: 'Dr. Angela R.', thumbnail: '🏆', price: 99, original_price: 199, rating: 4.7, review_count: 1340, enrollment_count: 8900, total_lessons: 20, total_duration_hours: 8, skills: ['Communication','Influence','Decision Making'], status: 'published' },
]

// Creator-specific free courses (beyond existing SAMPLE_COURSES)
const CREATOR_FREE_EXTRA = [
  { id: 'cf1', title: 'Canva for Content Creators', subtitle: 'Design stunning content in minutes', category: 'design', level: 'Beginner', instructor: 'Design Daily', thumbnail: '🎨', price: 0, original_price: 0, rating: 4.5, review_count: 5621, enrollment_count: 38000, total_lessons: 12, total_duration_hours: 3, skills: ['Canva','Graphics','Templates'], status: 'published' },
]

// Pro free courses
const PRO_FREE_COURSES = [
  { id: 'pf1', title: 'Introduction to Cybersecurity', subtitle: 'Build your security foundation', category: 'cybersecurity', level: 'Beginner', instructor: 'Tech Academy', thumbnail: '🔒', price: 0, original_price: 0, rating: 4.6, review_count: 12450, enrollment_count: 89000, total_lessons: 15, total_duration_hours: 5, skills: ['Security Basics','CompTIA'], status: 'published' },
  { id: 'pf2', title: 'LinkedIn Profile Optimization', subtitle: 'Get 5x more profile views', category: 'marketing', level: 'Beginner', instructor: 'Career Coach Pro', thumbnail: '💼', price: 0, original_price: 0, rating: 4.5, review_count: 8930, enrollment_count: 62000, total_lessons: 8, total_duration_hours: 2, skills: ['LinkedIn','Personal Brand'], status: 'published' },
]

// Fallback alias for backward-compatibility
const CATEGORIES = CREATOR_CATEGORIES

const SAMPLE_COURSES = [
  {
    id: 'c1', title: 'Social Media Growth Masterclass', subtitle: 'Go from 0 to 100K followers on any platform',
    category: 'social', level: 'Beginner', language: 'English',
    instructor: 'Sarah Kim', instructor_avatar: 'SK', instructor_bio: '10M+ followers across platforms. Social media coach for 5 years.',
    thumbnail: '📱', price: 49, original_price: 99,
    rating: 4.8, review_count: 2341, enrollment_count: 18420,
    total_lessons: 24, total_duration_hours: 6.5,
    skills: ['TikTok Algorithm', 'Instagram Reels', 'Content Strategy', 'Hashtag Research', 'Analytics'],
    requirements: ['A smartphone or camera', 'Willingness to post consistently', 'No prior experience needed'],
    what_you_learn: ['Build a content strategy that actually works', 'Crack the algorithm on every major platform', 'Create viral short-form content', 'Monetize your audience from day 1', 'Batch produce 30 days of content in one session'],
    includes: ['24 video lessons', 'Downloadable content calendar template', 'Private Discord community', 'Certificate of completion'],
    curriculum: [
      { section: 'Getting Started', lessons: [{ id: 'l1', title: "Welcome & What You'll Learn", duration: '5:30', free: true, type: 'video' }, { id: 'l2', title: 'Setting Up Your Profile for Success', duration: '12:00', free: false, type: 'video' }, { id: 'l3', title: 'Understanding the Algorithm in 2024', duration: '18:30', free: false, type: 'video' }] },
      { section: 'Content Strategy', lessons: [{ id: 'l4', title: 'Finding Your Niche', duration: '15:00', free: false, type: 'video' }, { id: 'l5', title: 'Content Pillars Framework', duration: '20:00', free: false, type: 'video' }, { id: 'l6', title: 'The Viral Content Formula', duration: '22:00', free: false, type: 'video' }, { id: 'l7', title: 'Batch Creating Content', duration: '35:00', free: false, type: 'video' }, { id: 'l8', title: 'Content Calendar Workshop', duration: '28:00', free: false, type: 'text' }] },
      { section: 'Growing on TikTok', lessons: [{ id: 'l9', title: 'TikTok Deep Dive', duration: '25:00', free: false, type: 'video' }, { id: 'l10', title: 'Hook Formulas That Work', duration: '18:00', free: false, type: 'video' }, { id: 'l11', title: 'TikTok SEO', duration: '14:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c2', title: 'YouTube Monetization Blueprint', subtitle: 'Build a channel that earns $5K/month',
    category: 'money', level: 'Intermediate', language: 'English',
    instructor: 'Marcus Webb', instructor_avatar: 'MW', instructor_bio: 'Full-time YouTuber since 2018. $250K+ earned from YouTube alone.',
    thumbnail: '💰', price: 99, original_price: 199,
    rating: 4.9, review_count: 1876, enrollment_count: 9240,
    total_lessons: 32, total_duration_hours: 9.5,
    skills: ['YouTube AdSense', 'Sponsorships', 'Merchandise', 'Memberships', 'Affiliate Marketing'],
    requirements: ['An active YouTube channel', 'At least 10 uploaded videos', 'Basic video editing knowledge'],
    what_you_learn: ['Hit 1,000 subscribers and 4,000 watch hours fast', 'Maximize AdSense RPM', 'Land your first $5,000 sponsorship', 'Set up merchandise without inventory', 'Build a $10K/month passive income machine'],
    includes: ['32 video lessons', 'Sponsorship email templates', 'Revenue calculator spreadsheet', 'Certificate of completion', '1-on-1 Q&A session with Marcus'],
    curriculum: [
      { section: 'Monetization Foundations', lessons: [{ id: 'l1', title: 'The $5K/Month Roadmap', duration: '8:00', free: true, type: 'video' }, { id: 'l2', title: 'AdSense Explained', duration: '16:00', free: false, type: 'video' }, { id: 'l3', title: 'RPM vs CPM — What You Need to Know', duration: '12:00', free: false, type: 'video' }] },
      { section: 'Sponsorships', lessons: [{ id: 'l4', title: 'Finding Your First Sponsor', duration: '20:00', free: false, type: 'video' }, { id: 'l5', title: 'Cold Outreach Templates', duration: '15:00', free: false, type: 'text' }, { id: 'l6', title: 'Negotiating Rates', duration: '25:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c3', title: 'Music Production for Creators', subtitle: 'Make professional beats at home',
    category: 'music', level: 'Beginner', language: 'English',
    instructor: 'DJ Nexus', instructor_avatar: 'DN', instructor_bio: 'Grammy-nominated producer. Tracks on Spotify with 50M+ streams.',
    thumbnail: '🎵', price: 0, original_price: 0,
    rating: 4.7, review_count: 3102, enrollment_count: 42100,
    total_lessons: 18, total_duration_hours: 5.0,
    skills: ['FL Studio', 'Logic Pro', 'Mixing', 'Mastering', 'Sound Design'],
    requirements: ['Computer (Mac or PC)', 'Headphones or monitors', 'No prior music experience needed'],
    what_you_learn: ['Set up your home studio on any budget', 'Create a full beat from scratch in 2 hours', 'Mix and master your tracks professionally', 'Upload and monetize your music', 'License beats to other creators'],
    includes: ['18 video lessons', 'Sample pack (200 royalty-free sounds)', 'Beat templates', 'Certificate of completion'],
    curriculum: [
      { section: 'Studio Setup', lessons: [{ id: 'l1', title: 'Choosing Your DAW', duration: '10:00', free: true, type: 'video' }, { id: 'l2', title: 'Studio on a Budget', duration: '14:00', free: true, type: 'video' }, { id: 'l3', title: 'Essential Plugins', duration: '18:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c4', title: 'Brand Photography Masterclass', subtitle: 'Shoot scroll-stopping product photos with your phone',
    category: 'photo', level: 'Beginner', language: 'English',
    instructor: 'Zoe Chen', instructor_avatar: 'ZC', instructor_bio: 'Commercial photographer. Shot for Apple, Nike, and 50+ brands.',
    thumbnail: '📸', price: 49, original_price: 79,
    rating: 4.6, review_count: 891, enrollment_count: 5670,
    total_lessons: 20, total_duration_hours: 4.5,
    skills: ['Composition', 'Lighting', 'Phone Photography', 'Lightroom', 'Product Styling'],
    requirements: ['Any smartphone', 'Basic photo editing app', 'No camera needed'],
    what_you_learn: ['Master natural and artificial lighting', 'Style products like a pro', 'Edit in Lightroom Mobile', 'Build a consistent visual brand', 'Charge $500+ per photo shoot'],
    includes: ['20 video lessons', 'Lightroom preset pack', 'Shot list templates', 'Certificate of completion'],
    curriculum: [
      { section: 'Fundamentals', lessons: [{ id: 'l1', title: 'The Rule of Thirds', duration: '8:00', free: true, type: 'video' }, { id: 'l2', title: 'Mastering Natural Light', duration: '15:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c5', title: 'AI Tools for Content Creators', subtitle: '10x your output using AI',
    category: 'tech', level: 'All Levels', language: 'English',
    instructor: 'Alex Rivera', instructor_avatar: 'AR', instructor_bio: 'AI educator. Built tools used by 100K+ creators.',
    thumbnail: '💻', price: 29, original_price: 59,
    rating: 4.9, review_count: 4521, enrollment_count: 31200,
    total_lessons: 28, total_duration_hours: 7.0,
    skills: ['ChatGPT', 'Midjourney', 'ElevenLabs', 'Runway ML', 'Automation'],
    requirements: ['Basic computer skills', 'Internet connection', 'No AI experience needed'],
    what_you_learn: ['Write scripts 10x faster with ChatGPT', 'Create AI thumbnails with Midjourney', 'Clone your voice with ElevenLabs', 'Generate B-roll with Runway ML', 'Automate your entire content workflow'],
    includes: ['28 video lessons', 'AI prompt library (500+ prompts)', 'Workflow templates', 'Certificate of completion'],
    curriculum: [
      { section: 'AI Writing', lessons: [{ id: 'l1', title: 'ChatGPT for Creators', duration: '12:00', free: true, type: 'video' }, { id: 'l2', title: 'Prompt Engineering 101', duration: '20:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c6', title: 'Podcast Launch & Grow', subtitle: 'Start a show that builds real audience',
    category: 'music', level: 'Beginner', language: 'English',
    instructor: 'Nina Scott', instructor_avatar: 'NS', instructor_bio: 'Host of "Creator Stories" podcast, 500K downloads/month.',
    thumbnail: '🎙', price: 39, original_price: 79,
    rating: 4.7, review_count: 1203, enrollment_count: 8900,
    total_lessons: 22, total_duration_hours: 5.5,
    skills: ['Podcast Recording', 'Audacity', 'RSS Feed', 'Spotify', 'Apple Podcasts'],
    requirements: ['A computer', 'Microphone (or phone)', "A topic you're passionate about"],
    what_you_learn: ['Record and edit professional audio', 'Distribute to all major platforms', 'Grow from 0 to 1,000 listeners in 90 days', 'Monetize through sponsors and Patreon', 'Interview guests like a pro'],
    includes: ['22 video lessons', 'Episode planning templates', 'Pitch deck for sponsors', 'Certificate of completion'],
    curriculum: [
      { section: 'Getting Started', lessons: [{ id: 'l1', title: 'Podcast Formats Explained', duration: '10:00', free: true, type: 'video' }, { id: 'l2', title: 'Your First Episode', duration: '22:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c7', title: 'Copywriting for Creators', subtitle: 'Write words that sell your content and products',
    category: 'writing', level: 'Intermediate', language: 'English',
    instructor: 'James Liu', instructor_avatar: 'JL', instructor_bio: 'Copywriter behind $50M+ in online sales. Writes for 7-figure creators.',
    thumbnail: '✍️', price: 79, original_price: 149,
    rating: 4.8, review_count: 2034, enrollment_count: 11400,
    total_lessons: 30, total_duration_hours: 8.0,
    skills: ['Email Marketing', 'Sales Pages', 'Captions', 'Headlines', 'Storytelling'],
    requirements: ['No prior writing experience needed', 'Willingness to write every day for 30 days'],
    what_you_learn: ['Write headlines that double your click rate', 'Craft email sequences that convert', 'Write bios that get you followed', 'Create sales pages that sell your courses', 'Tell stories that build loyal audiences'],
    includes: ['30 video lessons', 'Swipe file (100+ proven templates)', 'Daily writing exercises', 'Certificate of completion'],
    curriculum: [
      { section: 'Copy Foundations', lessons: [{ id: 'l1', title: 'What Makes Copy Convert', duration: '14:00', free: true, type: 'video' }, { id: 'l2', title: 'The Attention Economy', duration: '18:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
  {
    id: 'c8', title: 'Branding for Creators', subtitle: 'Build a brand that people remember',
    category: 'design', level: 'Beginner', language: 'English',
    instructor: 'Priya Sharma', instructor_avatar: 'PS', instructor_bio: 'Brand designer for 200+ creators and D2C brands.',
    thumbnail: '🎨', price: 59, original_price: 99,
    rating: 4.6, review_count: 1567, enrollment_count: 13200,
    total_lessons: 26, total_duration_hours: 6.0,
    skills: ['Canva', 'Color Theory', 'Typography', 'Logo Design', 'Brand Identity'],
    requirements: ['Free Canva account', 'No design experience needed'],
    what_you_learn: ['Create a logo that works everywhere', 'Build a complete brand identity kit', 'Choose colors and fonts that convert', 'Design templates you use forever', 'Position yourself as a premium creator'],
    includes: ['26 video lessons', 'Brand kit Canva template', 'Color palette generator', 'Certificate of completion'],
    curriculum: [
      { section: 'Brand Identity', lessons: [{ id: 'l1', title: 'What Is a Brand Really?', duration: '8:00', free: true, type: 'video' }, { id: 'l2', title: 'Color Psychology', duration: '16:00', free: false, type: 'video' }] },
    ],
    status: 'published'
  },
]

const SAMPLE_DISCUSSIONS = [
  { id:'d1', lesson_id:'l1', user_name:'Jordan T.', user_avatar:'JT', is_instructor:false, content:'This lesson completely changed how I approach content creation. The algorithm breakdown is spot on!', type:'discussion', upvotes:24, user_upvoted:false, reactions:{'💡':8,'🔥':5}, created_at:'2 days ago', replies:[
    { id:'d1r1', user_name:'Sarah Kim', user_avatar:'SK', is_instructor:true, content:'So glad this resonated with you! The algorithm piece is where most people get stuck.', upvotes:6, created_at:'1 day ago' }
  ]},
  { id:'d2', lesson_id:'l1', user_name:'Aisha M.', user_avatar:'AM', is_instructor:false, content:'Does this strategy work for LinkedIn as well, or is it only for TikTok/Instagram?', type:'question', is_resolved:true, upvotes:31, user_upvoted:false, reactions:{}, created_at:'3 days ago', replies:[
    { id:'d2r1', user_name:'Sarah Kim', user_avatar:'SK', is_instructor:true, content:'Great question! Yes, the core principle applies to LinkedIn, though the content format is different. LinkedIn favors text-heavy posts with personal stories.', upvotes:18, created_at:'3 days ago' }
  ]},
  { id:'d3', lesson_id:'l1', user_name:'Carlos R.', user_avatar:'CR', is_instructor:false, content:"Is there a recommended posting frequency? I've been posting 3x per day and seeing good results.", type:'question', is_resolved:false, upvotes:15, user_upvoted:false, reactions:{}, created_at:'5 days ago', replies:[] },
]

const SAMPLE_REVIEWS = [
  { name: 'Jordan T.', avatar: 'JT', rating: 5, date: '2 weeks ago', text: 'Absolutely game-changing. I went from 500 to 12K followers in 60 days following this exact framework.' },
  { name: 'Aisha M.', avatar: 'AM', rating: 5, date: '1 month ago', text: 'The curriculum is dense in the best way. Every lesson has actionable takeaways I could implement immediately.' },
  { name: 'Carlos R.', avatar: 'CR', rating: 4, date: '3 weeks ago', text: 'Great content, especially the batch creation module. Would love more advanced topics in a Part 2.' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}
        />
      ))}
    </span>
  )
}

function LevelBadge({ level }) {
  const colors = {
    Beginner: 'bg-green-500/15 text-green-400',
    Intermediate: 'bg-yellow-500/15 text-yellow-400',
    Advanced: 'bg-red-500/15 text-red-400',
    'All Levels': 'bg-blue-500/15 text-blue-400',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[level] || 'bg-muted text-muted-foreground'}`}>
      {level}
    </span>
  )
}

function formatPrice(price) {
  if (price === 0) return 'Free'
  return `$${price}`
}

function discountPct(original, current) {
  if (!original || original === current) return null
  return Math.round((1 - current / original) * 100)
}

// ─── LessonFeedback ──────────────────────────────────────────────────────────

function LessonFeedback({ course, lesson, user }) {
  const [feedback, setFeedback] = useState(null)
  const helpfulCount = 42

  async function vote(type) {
    setFeedback(type)
    await supabase.from('lesson_feedback').upsert({
      course_id: course.id, lesson_id: lesson?.id,
      user_id: user?.id, helpful: type === 'helpful',
    }).catch(() => {})
  }

  const pct = Math.round(helpfulCount / (helpfulCount + 4) * 100)
  return (
    <div className="flex items-center gap-4 py-4 border-t border-border mt-4">
      <span className="text-sm text-muted-foreground">Was this lesson helpful?</span>
      <button onClick={() => vote('helpful')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${feedback === 'helpful' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}>
        <ThumbsUp size={14} /> Yes
      </button>
      <button onClick={() => vote('not_helpful')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${feedback === 'not_helpful' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}>
        <ThumbsDown size={14} /> No
      </button>
      {feedback && <span className="text-xs text-muted-foreground">{pct}% found this helpful</span>}
    </div>
  )
}

// ─── LessonDiscussion ─────────────────────────────────────────────────────────

function LessonDiscussion({ course, lesson, user }) {
  const [activeTab, setActiveTab] = useState('discussion')
  const [discussions, setDiscussions] = useState(
    SAMPLE_DISCUSSIONS.filter(d => d.lesson_id === lesson?.id)
  )
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('top')
  const [filterType, setFilterType] = useState('all')
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(`notes_${course.id}_${lesson?.id}`) || '' } catch { return '' }
  })
  const [notesSaved, setNotesSaved] = useState(false)
  const REACTIONS = ['👍','💡','🔥','❓','💯']

  useEffect(() => {
    const timer = setTimeout(() => {
      if (lesson?.id) {
        localStorage.setItem(`notes_${course.id}_${lesson.id}`, notes)
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [notes, course.id, lesson?.id])

  async function submitPost() {
    if (!newContent.trim()) return
    setSubmitting(true)
    const post = {
      id: `d${Date.now()}`,
      lesson_id: lesson?.id,
      user_name: user?.user_metadata?.full_name || 'You',
      user_avatar: user?.user_metadata?.full_name?.[0] || 'Y',
      is_instructor: false,
      content: newContent.trim(),
      type: activeTab === 'questions' ? 'question' : 'discussion',
      is_resolved: false,
      upvotes: 0, user_upvoted: false, reactions: {},
      created_at: 'Just now', replies: [],
    }
    await supabase.from('lesson_discussions').insert({
      course_id: course.id, lesson_id: lesson?.id,
      user_id: user?.id, user_name: post.user_name,
      content: post.content, type: post.type,
    }).catch(() => {})
    setDiscussions(prev => [post, ...prev])
    setNewContent('')
    setSubmitting(false)
  }

  function toggleUpvote(id) {
    setDiscussions(prev => prev.map(d => d.id === id
      ? { ...d, upvotes: d.user_upvoted ? d.upvotes - 1 : d.upvotes + 1, user_upvoted: !d.user_upvoted }
      : d))
  }

  function addReaction(dId, emoji) {
    setDiscussions(prev => prev.map(d => d.id === dId
      ? { ...d, reactions: { ...d.reactions, [emoji]: (d.reactions[emoji] || 0) + 1 } }
      : d))
  }

  const filteredDiscussions = useMemo(() => {
    let list = discussions.filter(d => activeTab === 'questions' ? d.type === 'question' : d.type === 'discussion')
    if (filterType === 'unanswered') list = list.filter(d => !d.is_resolved && d.replies.length === 0)
    if (filterType === 'answered') list = list.filter(d => d.is_resolved || d.replies.length > 0)
    if (sortBy === 'top') list = [...list].sort((a, b) => b.upvotes - a.upvotes)
    return list
  }, [discussions, activeTab, filterType, sortBy])

  return (
    <div className="border-t border-border mt-6 pt-6 space-y-4">
      <div className="flex items-center gap-1 border-b border-border">
        {[{id:'discussion',label:'Discussion',icon:<MessageCircle size={13}/>},{id:'questions',label:'Questions',icon:<HelpCircle size={13}/>},{id:'notes',label:'My Notes',icon:<StickyNote size={13}/>}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Personal notes — only visible to you, auto-saved</p>
            {notesSaved && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12}/> Saved</span>}
          </div>
          <textarea rows={8} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Type your notes here... They auto-save as you type."
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"/>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{notes.length} characters</span>
            <button onClick={() => {
              const blob = new Blob([notes], {type:'text/plain'})
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url
              a.download = `notes-${lesson?.title || 'lesson'}.txt`; a.click()
            }} className="flex items-center gap-1 text-primary hover:opacity-80">
              <Download size={12}/> Download
            </button>
          </div>
        </div>
      )}

      {activeTab !== 'notes' && (
        <>
          <div className="space-y-2">
            <textarea rows={2} value={newContent} onChange={e => setNewContent(e.target.value)}
              placeholder={activeTab === 'questions' ? 'Ask the instructor or other students...' : 'Share your thoughts on this lesson...'}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"/>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {activeTab === 'questions'
                  ? ['all','unanswered','answered'].map(f => (
                    <button key={f} onClick={() => setFilterType(f)}
                      className={`text-xs px-2.5 py-1 rounded-full capitalize ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{f}</button>
                  ))
                  : ['top','new'].map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`text-xs px-2.5 py-1 rounded-full capitalize ${sortBy === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{s}</button>
                  ))
                }
              </div>
              <button onClick={submitPost} disabled={submitting || !newContent.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:opacity-90">
                <Send size={12}/> Post
              </button>
            </div>
          </div>
          <div className="space-y-5">
            {filteredDiscussions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {activeTab === 'questions' ? 'No questions yet. Ask the first one!' : 'No comments yet. Start the discussion!'}
              </div>
            )}
            {filteredDiscussions.map(d => (
              <div key={d.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${d.is_instructor ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{d.user_avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{d.user_name}</span>
                      {d.is_instructor && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold">Instructor</span>}
                      {d.is_resolved && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">Resolved ✓</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{d.created_at}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{d.content}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <button onClick={() => toggleUpvote(d.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${d.user_upvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        <ThumbsUp size={12}/> {d.upvotes}
                      </button>
                      {REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => addReaction(d.id, emoji)}
                          className="text-xs hover:opacity-80 transition-opacity">
                          {emoji}{d.reactions[emoji] ? ` ${d.reactions[emoji]}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {d.replies && d.replies.length > 0 && (
                  <div className="ml-11 space-y-3 pl-4 border-l-2 border-border">
                    {d.replies.map(r => (
                      <div key={r.id} className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${r.is_instructor ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{r.user_avatar}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">{r.user_name}</span>
                            {r.is_instructor && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold">Instructor</span>}
                            <span className="text-xs text-muted-foreground">{r.created_at}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{r.content}</p>
                          <button className="flex items-center gap-1 text-xs mt-1 text-muted-foreground hover:text-foreground">
                            <ThumbsUp size={10}/> {r.upvotes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── RateCourseModal ──────────────────────────────────────────────────────────

function RateCourseModal({ course, onClose, onRate }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submitRating() {
    setSubmitting(true)
    await supabase.from('course_reviews').upsert({
      course_id: course.id, user_id: user?.id,
      rating, review, created_at: new Date().toISOString(),
    }).catch(() => {})
    onRate(rating)
    setDone(true)
    setSubmitting(false)
  }

  if (done) return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-3">⭐</div>
        <h3 className="text-xl font-bold text-foreground mb-2">Thanks for your review!</h3>
        <p className="text-muted-foreground text-sm mb-5">Your feedback helps other creators find great courses.</p>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-lg">Rate this course</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16}/></button>
        </div>
        <p className="text-sm text-muted-foreground">{course.title}</p>
        <div className="flex items-center gap-3">
          {[1,2,3,4,5].map(i => (
            <button key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(i)} className="transition-transform hover:scale-110">
              <Star size={32} className={i <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}/>
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-sm font-medium text-foreground">{['','Poor','Fair','Good','Very Good','Excellent!'][rating]}</p>}
        <textarea rows={3} value={review} onChange={e => setReview(e.target.value)}
          placeholder="Share what you learned or what could be improved (optional)"
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"/>
        <button onClick={submitRating} disabled={!rating || submitting}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}

// ─── CategoryCard ────────────────────────────────────────────────────────────

function CategoryCard({ cat, onSelect }) {
  return (
    <button
      onClick={() => onSelect(cat.id)}
      className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all group text-center"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
      <span className="text-xs font-semibold text-foreground leading-tight">{cat.label}</span>
      <span className="text-[10px] text-muted-foreground">{cat.count} courses</span>
    </button>
  )
}

// ─── CourseCard ──────────────────────────────────────────────────────────────

function CourseCard({ course, enrolled, onOpen, compact = false }) {
  const discount = discountPct(course.original_price, course.price)
  const progress = enrolled?.progress_percent ?? 0

  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-primary/40 transition-all cursor-pointer ${compact ? 'min-w-[260px]' : ''}`}
      onClick={() => onOpen(course)}
    >
      {/* Thumbnail */}
      <div className="h-36 bg-primary/10 flex items-center justify-center relative">
        <span className="text-6xl">{course.thumbnail}</span>
        {course.price === 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
        )}
        {discount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Stars rating={course.rating} size={12} />
          <span className="text-xs font-semibold text-yellow-400">{course.rating}</span>
          <span className="text-[10px] text-muted-foreground">({course.review_count.toLocaleString()})</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{course.title}</p>

        {/* Instructor */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
            {course.instructor_avatar}
          </div>
          <span className="text-xs text-muted-foreground truncate">{course.instructor}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <BookOpen size={10} /> {course.total_lessons} lessons
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} /> {course.total_duration_hours}h
          </span>
          <LevelBadge level={course.level} />
        </div>

        {/* Skills */}
        <div className="flex gap-1 flex-wrap">
          {course.skills.slice(0, 3).map(s => (
            <span key={s} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">{s}</span>
          ))}
        </div>

        {/* Progress bar if enrolled */}
        {enrolled && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price row */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-sm">{formatPrice(course.price)}</span>
          {course.original_price > 0 && course.original_price !== course.price && (
            <span className="text-[11px] text-muted-foreground line-through">${course.original_price}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {enrolled ? (
            <button
              onClick={e => { e.stopPropagation(); onOpen(course) }}
              className="flex-1 bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onOpen(course) }}
              className="flex-1 bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Enroll Now
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onOpen(course) }}
            className="border border-border text-xs text-foreground font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CourseDetailModal ───────────────────────────────────────────────────────

function CourseDetailModal({ course, enrolled, onClose, onEnroll }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({ 0: true })
  const [enrolling, setEnrolling] = useState(false)
  const [enrollSuccess, setEnrollSuccess] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [showRating, setShowRating] = useState(false)
  const [userRating, setUserRating] = useState(0)

  function toggleSection(idx) {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  async function handleEnroll() {
    setEnrolling(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        await supabase.from('enrollments').insert({
          course_id: course.id,
          user_id: u.id,
          progress_percent: 0,
          enrolled_at: new Date().toISOString(),
        })
      }
      onEnroll(course.id)
      setEnrollSuccess(true)
    } catch (err) {
      console.error('Enroll error', err)
    } finally {
      setEnrolling(false)
    }
  }

  const tabs = ['Overview', 'Curriculum', 'Reviews', 'Instructor']
  const discount = discountPct(course.original_price, course.price)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="relative h-40 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
          <span className="text-8xl">{course.thumbnail}</span>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-6">
          {/* Left content */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LevelBadge level={course.level} />
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Globe size={10} /> {course.language}</span>
              </div>
              <h2 className="text-xl font-bold text-foreground leading-snug">{course.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{course.subtitle}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <Stars rating={course.rating} size={13} />
                  <span className="text-sm font-semibold text-yellow-400">{course.rating}</span>
                  <span className="text-xs text-muted-foreground">({course.review_count.toLocaleString()} reviews)</span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={11} /> {course.enrollment_count.toLocaleString()} enrolled</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t.toLowerCase())}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t.toLowerCase() ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">What you'll learn</h3>
                  <ul className="grid grid-cols-1 gap-2">
                    {course.what_you_learn.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle size={15} className="text-green-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Requirements</h3>
                  <ul className="space-y-1.5">
                    {course.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Skills you'll gain</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.skills.map(s => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Curriculum */}
            {activeTab === 'curriculum' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{course.total_lessons} lessons · {course.total_duration_hours} hours total</p>
                {course.curriculum.map((sec, idx) => (
                  <div key={idx} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(idx)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="font-semibold text-sm text-foreground">{sec.section}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{sec.lessons.length} lessons</span>
                        {expandedSections[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </button>
                    {expandedSections[idx] && (
                      <div className="divide-y divide-border">
                        {sec.lessons.map((lesson, li) => (
                          <button
                            key={li}
                            onClick={() => (enrolled || lesson.free) && setSelectedLesson(selectedLesson?.id === lesson.id ? null : lesson)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${(enrolled || lesson.free) ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'} ${selectedLesson?.id === lesson.id ? 'bg-primary/5' : ''}`}
                          >
                            {lesson.free ? (
                              <Play size={13} className="text-primary flex-shrink-0" />
                            ) : enrolled ? (
                              <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                            ) : (
                              <Lock size={13} className="text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm text-foreground flex-1">{lesson.title}</span>
                            {lesson.free && <span className="text-[10px] text-primary border border-primary/30 px-1.5 py-0.5 rounded">Preview</span>}
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Lesson player + discussion */}
                {selectedLesson && (
                  <div className="border border-primary/30 rounded-xl overflow-hidden bg-card">
                    <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
                      <h4 className="font-semibold text-sm text-foreground">{selectedLesson.title}</h4>
                      <button onClick={() => setSelectedLesson(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
                    </div>
                    <div className="p-4">
                      {selectedLesson.type === 'video' && (
                        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center mb-4">
                          <div className="text-center text-muted-foreground">
                            <Play size={40} className="mx-auto mb-2 text-primary opacity-60"/>
                            <p className="text-sm">Video — {selectedLesson.duration}</p>
                            <p className="text-xs mt-1 opacity-50">Upload video in course builder to play here</p>
                          </div>
                        </div>
                      )}
                      {selectedLesson.type === 'text' && (
                        <div className="bg-muted rounded-xl p-4 mb-4">
                          <p className="text-sm text-foreground">Article: {selectedLesson.title}</p>
                        </div>
                      )}
                      <LessonFeedback course={course} lesson={selectedLesson} user={user} />
                      <LessonDiscussion course={course} lesson={selectedLesson} user={user} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-5">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-foreground">{course.rating}</div>
                    <Stars rating={course.rating} size={16} />
                    <div className="text-xs text-muted-foreground mt-1">Course Rating</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(star => {
                      const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 2 : 1
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-4 text-right">{star}</span>
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-4">
                  {SAMPLE_REVIEWS.map((review, i) => (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{review.avatar}</div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{review.name}</div>
                          <div className="flex items-center gap-2">
                            <Stars rating={review.rating} size={11} />
                            <span className="text-[10px] text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            {activeTab === 'instructor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                    {course.instructor_avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-lg">{course.instructor}</div>
                    <div className="text-sm text-muted-foreground">Course Instructor</div>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{course.instructor_bio}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{course.review_count.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Reviews</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{course.enrollment_count.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sticky card */}
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{formatPrice(course.price)}</span>
                  {course.original_price > 0 && course.original_price !== course.price && (
                    <span className="text-sm text-muted-foreground line-through">${course.original_price}</span>
                  )}
                  {discount && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">{discount}% off</span>}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users size={11} /> {course.enrollment_count.toLocaleString()} already enrolled
                </div>
              </div>

              {enrollSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle size={15} className="text-green-400 flex-shrink-0"/>
                  <span className="text-xs text-green-400 font-medium">Enrolled! Click any lesson to start.</span>
                </div>
              )}
              {(enrolled || enrollSuccess) ? (
                <div className="space-y-2">
                  <button onClick={() => setActiveTab('curriculum')} className="w-full bg-green-500 text-white font-semibold py-2.5 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                    <Play size={16} /> Continue Learning
                  </button>
                  <button onClick={() => setShowRating(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">
                    <Star size={14}/> {userRating ? `Your rating: ${userRating}★` : 'Rate this course'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll Free' : `Enroll Now — $${course.price}`}
                  </button>
                  {course.price > 0 && (
                    <p className="text-[10px] text-center text-muted-foreground">30-day money-back guarantee</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">This course includes:</div>
                {course.includes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center border-t border-border pt-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{course.total_lessons}</div>
                  <div className="text-[10px] text-muted-foreground">Lessons</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{course.total_duration_hours}h</div>
                  <div className="text-[10px] text-muted-foreground">Content</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showRating && (
        <RateCourseModal
          course={course}
          onClose={() => setShowRating(false)}
          onRate={(r) => setUserRating(r)}
        />
      )}
    </div>
  )
}

// ─── CourseBuilderModal ──────────────────────────────────────────────────────

function CourseBuilderModal({ onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [publishing, setPublishing] = useState(false)
  const [lessonUploads, setLessonUploads] = useState({})
  const [expandedLessons, setExpandedLessons] = useState({})
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', category: 'social', level: 'Beginner',
    price_type: 'free', price: 0, certificate: true, refund_policy: '30-day',
    curriculum: [],
  })

  const PRICE_OPTIONS = [
    { label: 'Free', value: 0 },
    { label: '$9.99', value: 9.99 },
    { label: '$19.99', value: 19.99 },
    { label: '$49', value: 49 },
    { label: '$99', value: 99 },
    { label: '$199', value: 199 },
  ]

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function addSection() {
    setForm(prev => ({
      ...prev,
      curriculum: [...prev.curriculum, { section: '', lessons: [] }]
    }))
  }

  function updateSection(idx, val) {
    const c = [...form.curriculum]
    c[idx] = { ...c[idx], section: val }
    setField('curriculum', c)
  }

  function removeSection(idx) {
    const c = form.curriculum.filter((_, i) => i !== idx)
    setField('curriculum', c)
  }

  function addLesson(sIdx) {
    const c = [...form.curriculum]
    c[sIdx].lessons = [...c[sIdx].lessons, { title: '', type: 'video', free: false }]
    setField('curriculum', c)
  }

  function updateLesson(sIdx, lIdx, key, val) {
    const c = [...form.curriculum]
    c[sIdx].lessons[lIdx] = { ...c[sIdx].lessons[lIdx], [key]: val }
    setField('curriculum', c)
  }

  function removeLesson(sIdx, lIdx) {
    const c = [...form.curriculum]
    c[sIdx].lessons = c[sIdx].lessons.filter((_, i) => i !== lIdx)
    setField('curriculum', c)
  }

  function toggleLessonExpand(key) {
    setExpandedLessons(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleLessonUpload(sIdx, lIdx, file) {
    const key = `${sIdx}_${lIdx}`
    setLessonUploads(prev => ({ ...prev, [key]: { uploading: true, progress: 0, url: '', filename: file.name } }))
    const interval = setInterval(() => {
      setLessonUploads(prev => ({ ...prev, [key]: { ...prev[key], progress: Math.min((prev[key]?.progress || 0) + 15, 90) } }))
    }, 300)
    const path = `courses/lessons/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('uploads').upload(path, file)
    clearInterval(interval)
    if (error) {
      setLessonUploads(prev => ({ ...prev, [key]: { uploading: false, progress: 0, url: '', filename: '' } }))
      alert('Upload failed: ' + error.message)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
    setLessonUploads(prev => ({ ...prev, [key]: { uploading: false, progress: 100, url: publicUrl, filename: file.name } }))
    updateLesson(sIdx, lIdx, 'content_url', publicUrl)
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('courses').insert({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        category: form.category,
        level: form.level,
        price: form.price_type === 'free' ? 0 : form.price,
        certificate: form.certificate,
        refund_policy: form.refund_policy,
        curriculum: form.curriculum,
        instructor_id: user?.id,
        status: 'published',
        created_at: new Date().toISOString(),
      })
      onClose()
    } catch (err) {
      console.error('Publish error', err)
    } finally {
      setPublishing(false)
    }
  }

  const stepLabels = ['Basics', 'Curriculum', 'Pricing', 'Publish']

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create a Course</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-5 py-3 border-b border-border gap-0">
          {stepLabels.map((label, i) => {
            const n = i + 1
            const active = n === step
            const done = n < step
            return (
              <div key={n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {done ? <CheckCircle size={14} /> : n}
                  </div>
                  <span className={`text-[10px] mt-1 ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`flex-1 h-px mx-1 mt-[-10px] ${done ? 'bg-green-500' : 'bg-border'}`} />}
              </div>
            )
          })}
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Course Title *</label>
                <input
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Social Media Growth Masterclass"
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={e => setField('subtitle', e.target.value)}
                  placeholder="One-line description of what students will achieve"
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Describe your course in detail..."
                  rows={4}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setField('category', e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Level</label>
                  <select
                    value={form.level}
                    onChange={e => setField('level', e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Thumbnail</label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload thumbnail image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB · 1280×720 recommended</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Curriculum */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Organize your course content into sections and lessons.</p>
                <button
                  onClick={addSection}
                  className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>

              {form.curriculum.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                  No sections yet. Click "Add Section" to get started.
                </div>
              )}

              {form.curriculum.map((sec, sIdx) => (
                <div key={sIdx} className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-muted/50">
                    <input
                      value={sec.section}
                      onChange={e => updateSection(sIdx, e.target.value)}
                      placeholder={`Section ${sIdx + 1} title`}
                      className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button onClick={() => removeSection(sIdx)} className="text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="divide-y divide-border">
                    {sec.lessons.map((lesson, lIdx) => {
                      const key = `${sIdx}_${lIdx}`
                      const upload = lessonUploads[key]
                      const expanded = expandedLessons[key]
                      return (
                        <div key={lIdx}>
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <select value={lesson.type} onChange={e => updateLesson(sIdx, lIdx, 'type', e.target.value)}
                              className="bg-muted border border-border rounded-lg text-xs text-foreground px-2 py-1 focus:outline-none">
                              {['video','text','pdf','audio','quiz'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                            </select>
                            <input value={lesson.title} onChange={e => updateLesson(sIdx, lIdx, 'title', e.target.value)}
                              placeholder="Lesson title"
                              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"/>
                            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                              <input type="checkbox" checked={lesson.free} onChange={e => updateLesson(sIdx, lIdx, 'free', e.target.checked)} className="accent-primary"/>
                              Free
                            </label>
                            <button onClick={() => toggleLessonExpand(key)} className="text-muted-foreground hover:text-foreground">
                              {expanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                            </button>
                            <button onClick={() => removeLesson(sIdx, lIdx)} className="text-muted-foreground hover:text-red-400"><X size={13}/></button>
                          </div>
                          {expanded && (
                            <div className="px-3 pb-3 space-y-3 bg-muted/20 border-t border-border">
                              {/* Video upload */}
                              {lesson.type === 'video' && (
                                <div className="pt-2">
                                  <label className="text-xs text-muted-foreground block mb-1">📹 Video File</label>
                                  {upload?.url ? (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      <Video size={13} className="text-primary"/><span className="text-xs flex-1 truncate">{upload.filename}</span>
                                      <span className="text-xs text-green-400">✓ Uploaded</span>
                                    </div>
                                  ) : upload?.uploading ? (
                                    <div className="space-y-1">
                                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{width:`${upload.progress}%`}}/>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{upload.progress}% uploading...</p>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                      <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files[0] && handleLessonUpload(sIdx, lIdx, e.target.files[0])}/>
                                      <Upload size={13} className="text-muted-foreground"/>
                                      <span className="text-xs text-muted-foreground">Upload MP4, MOV</span>
                                    </label>
                                  )}
                                </div>
                              )}
                              {/* PDF upload */}
                              {lesson.type === 'pdf' && (
                                <div className="pt-2">
                                  <label className="text-xs text-muted-foreground block mb-1">📄 PDF File</label>
                                  {upload?.url ? (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      <FileText size={13} className="text-red-400"/><span className="text-xs flex-1 truncate">{upload.filename}</span>
                                      <span className="text-xs text-green-400">✓ Uploaded</span>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                      <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleLessonUpload(sIdx, lIdx, e.target.files[0])}/>
                                      <Upload size={13} className="text-muted-foreground"/>
                                      <span className="text-xs text-muted-foreground">Upload PDF (max 100MB)</span>
                                    </label>
                                  )}
                                </div>
                              )}
                              {/* Audio upload */}
                              {lesson.type === 'audio' && (
                                <div className="pt-2">
                                  <label className="text-xs text-muted-foreground block mb-1">🎵 Audio File</label>
                                  {upload?.url ? (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      <Mic size={13} className="text-blue-400"/><span className="text-xs flex-1 truncate">{upload.filename}</span>
                                      <span className="text-xs text-green-400">✓ Uploaded</span>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                      <input type="file" accept=".mp3,.wav,.m4a" className="hidden" onChange={e => e.target.files[0] && handleLessonUpload(sIdx, lIdx, e.target.files[0])}/>
                                      <Upload size={13} className="text-muted-foreground"/>
                                      <span className="text-xs text-muted-foreground">Upload MP3, WAV, M4A</span>
                                    </label>
                                  )}
                                </div>
                              )}
                              {/* Text article */}
                              {lesson.type === 'text' && (
                                <div className="pt-2">
                                  <label className="text-xs text-muted-foreground block mb-1">✍️ Article Content</label>
                                  <textarea rows={4} value={lesson.content || ''} onChange={e => updateLesson(sIdx, lIdx, 'content', e.target.value)}
                                    placeholder="Write the lesson article content..."
                                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"/>
                                  <p className="text-xs text-muted-foreground mt-1">{(lesson.content || '').split(' ').filter(Boolean).length} words</p>
                                </div>
                              )}
                              {/* Quiz builder */}
                              {lesson.type === 'quiz' && (
                                <div className="space-y-3 pt-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-muted-foreground">Quiz Questions</label>
                                    <button onClick={() => updateLesson(sIdx, lIdx, 'questions', [...(lesson.questions || []), {q:'',options:['','','',''],correct:0}])}
                                      className="text-xs text-primary flex items-center gap-1 hover:opacity-80"><Plus size={11}/> Add Question</button>
                                  </div>
                                  {(lesson.questions || []).map((qs, qi) => (
                                    <div key={qi} className="space-y-2 p-3 bg-card rounded-xl border border-border">
                                      <input value={qs.q} onChange={e => { const q=[...(lesson.questions||[])]; q[qi]={...q[qi],q:e.target.value}; updateLesson(sIdx,lIdx,'questions',q) }}
                                        placeholder={`Question ${qi+1}`}
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"/>
                                      {qs.options.map((opt, oi) => (
                                        <div key={oi} className="flex items-center gap-2">
                                          <input type="radio" name={`correct_${key}_${qi}`} checked={qs.correct===oi}
                                            onChange={() => { const q=[...(lesson.questions||[])]; q[qi]={...q[qi],correct:oi}; updateLesson(sIdx,lIdx,'questions',q) }}
                                            className="accent-primary"/>
                                          <input value={opt} onChange={e => { const q=[...(lesson.questions||[])]; const opts=[...q[qi].options]; opts[oi]=e.target.value; q[qi]={...q[qi],options:opts}; updateLesson(sIdx,lIdx,'questions',q) }}
                                            placeholder={`Option ${String.fromCharCode(65+oi)}`}
                                            className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"/>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Resources for any type */}
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">📎 Downloadable Resources</label>
                                <label className="flex items-center gap-2 p-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                  <input type="file" multiple className="hidden" onChange={e => {
                                    const files = Array.from(e.target.files)
                                    const existing = lesson.resources || []
                                    updateLesson(sIdx, lIdx, 'resources', [...existing, ...files.map(f => ({ name: f.name, size: (f.size/1024).toFixed(0)+'KB', url:'#' }))])
                                  }}/>
                                  <File size={12} className="text-muted-foreground"/>
                                  <span className="text-xs text-muted-foreground">Add resource files</span>
                                </label>
                                {(lesson.resources || []).map((r, ri) => (
                                  <div key={ri} className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <File size={10}/><span className="flex-1">{r.name}</span><span>{r.size}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="px-3 py-2 border-t border-border">
                    <button
                      onClick={() => addLesson(sIdx)}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Pricing Model</label>
                <div className="space-y-2">
                  {[['free', 'Free', 'Let anyone enroll at no cost'], ['one-time', 'One-Time Payment', 'Charge a single price for lifetime access'], ['subscription', 'Subscription', 'Charge a monthly/yearly fee']].map(([val, label, desc]) => (
                    <label key={val} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.price_type === val ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                      <input
                        type="radio"
                        name="price_type"
                        value={val}
                        checked={form.price_type === val}
                        onChange={() => setField('price_type', val)}
                        className="accent-primary mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {form.price_type !== 'free' && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Price</label>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setField('price', opt.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${form.price === opt.value ? 'bg-primary text-white border-primary' : 'bg-muted text-foreground border-border hover:border-primary/50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Refund Policy</label>
                <select
                  value={form.refund_policy}
                  onChange={e => setField('refund_policy', e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="no-refund">No Refund</option>
                  <option value="7-day">7-Day Money Back</option>
                  <option value="30-day">30-Day Money Back</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.certificate}
                  onChange={e => setField('certificate', e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <div>
                  <div className="text-sm font-semibold text-foreground">Include Certificate of Completion</div>
                  <div className="text-xs text-muted-foreground">Students receive a certificate when they finish the course</div>
                </div>
              </label>
            </div>
          )}

          {/* Step 4: Publish */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Award size={16} className="text-primary" /> Course Summary</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Title', form.title || '—'],
                    ['Category', CATEGORIES.find(c => c.id === form.category)?.label || '—'],
                    ['Level', form.level],
                    ['Price', form.price_type === 'free' ? 'Free' : `$${form.price}`],
                    ['Sections', `${form.curriculum.length}`],
                    ['Total Lessons', `${form.curriculum.reduce((a, s) => a + s.lessons.length, 0)}`],
                    ['Certificate', form.certificate ? 'Yes' : 'No'],
                    ['Refund Policy', form.refund_policy],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Pre-publish checklist</h3>
                {[
                  { label: 'Course title added', done: !!form.title },
                  { label: 'At least 1 section with 1 lesson', done: form.curriculum.length > 0 && form.curriculum[0]?.lessons?.length > 0 },
                  { label: 'Category selected', done: !!form.category },
                  { label: 'Price configured', done: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={15} className={item.done ? 'text-green-400' : 'text-muted-foreground'} />
                    <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePublish}
                disabled={publishing || !form.title}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {publishing ? 'Publishing...' : 'Publish Course'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t border-border">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} /> {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MyLearningTab ───────────────────────────────────────────────────────────

function MyLearningTab({ enrolledCourses, enrollments, onOpen, onBrowse }) {
  const [subTab, setSubTab] = useState('in-progress')

  const inProgress = enrolledCourses.filter(c => {
    const e = enrollments.find(en => en.course_id === c.id)
    return !e || (e.progress_percent || 0) < 100
  })
  const completed = enrolledCourses.filter(c => {
    const e = enrollments.find(en => en.course_id === c.id)
    return e && (e.progress_percent || 0) >= 100
  })

  const list = subTab === 'in-progress' ? inProgress : completed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Learning</h1>
        <span className="text-sm text-muted-foreground">{enrolledCourses.length} enrolled</span>
      </div>
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[{id:'in-progress',label:'In Progress'},{id:'completed',label:'Completed'}].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === t.id ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label} {t.id === 'in-progress' ? `(${inProgress.length})` : `(${completed.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="text-6xl">{subTab === 'completed' ? '🎓' : '📚'}</div>
          <h2 className="text-xl font-bold text-foreground">{subTab === 'completed' ? 'No completed courses yet' : 'No courses in progress'}</h2>
          <p className="text-muted-foreground">{subTab === 'completed' ? 'Finish a course to earn your certificate' : 'Enroll in a course to start your journey'}</p>
          {subTab !== 'completed' && (
            <button onClick={onBrowse} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Browse Courses
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(course => {
            const enr = enrollments.find(e => e.course_id === course.id)
            const pct = enr?.progress_percent || 0
            const lessonsCompleted = Math.round(pct / 100 * course.total_lessons)
            return (
              <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0 cursor-pointer" onClick={() => onOpen(course)}>
                  {course.thumbnail}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate cursor-pointer hover:text-primary" onClick={() => onOpen(course)}>{course.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{course.instructor}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% complete · {lessonsCompleted}/{course.total_lessons} lessons</span>
                      <span>{Math.round(pct / 100 * course.total_duration_hours * 60)} min spent</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => onOpen(course)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
                    {subTab === 'completed' ? 'Review' : 'Continue'}
                  </button>
                  {subTab === 'completed' && (
                    <button onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl border border-border text-xs text-foreground hover:bg-muted flex items-center gap-1 justify-center">
                      <Award size={12}/> Certificate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── HorizontalRow ───────────────────────────────────────────────────────────

function HorizontalRow({ title, courses, enrollments, onOpen }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {courses.map(course => (
          <div key={course.id} className="min-w-[260px] flex-shrink-0">
            <CourseCard
              course={course}
              enrolled={enrollments.find(e => e.course_id === course.id)}
              onOpen={onOpen}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Learning Component ─────────────────────────────────────────────────

export default function Learning() {
  const { mode } = useMode()
  // Read directly from localStorage so initial render matches stored mode
  const [learningMode, setLearningMode] = useState(
    () => localStorage.getItem('philomni_mode') || mode || 'creator'
  )
  const [activeTab, setActiveTab] = useState('home')
  const [courses, setCourses] = useState(SAMPLE_COURSES)
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const activeCategories = learningMode === 'pro' ? PRO_CATEGORIES : CREATOR_CATEGORIES

  useEffect(() => {
    async function load() {
      try {
        const [{ data: dbCourses }, { data: dbEnrollments }] = await Promise.all([
          supabase.from('courses').select('*').eq('status', 'published'),
          supabase.from('enrollments').select('*'),
        ])
        if (dbCourses && dbCourses.length > 0) {
          const dbIds = new Set(dbCourses.map(c => c.id))
          const merged = [...dbCourses, ...SAMPLE_COURSES.filter(c => !dbIds.has(c.id))]
          setCourses(merged)
        }
        if (dbEnrollments) setEnrollments(dbEnrollments)
      } catch (err) {
        console.error('Load error', err)
      }
    }
    load()
  }, [])

  const filteredCourses = useMemo(() => {
    let result = courses
    if (selectedCategory) result = result.filter(c => c.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q) ||
        c.instructor?.toLowerCase().includes(q) ||
        c.skills?.some(s => s.toLowerCase().includes(q))
      )
    }
    return result
  }, [courses, selectedCategory, searchQuery])

  const enrolledCourses = useMemo(() =>
    courses.filter(c => enrollments.some(e => e.course_id === c.id)),
    [courses, enrollments]
  )

  // FIX 1: Free / trending / new filtered by mode
  const freeCourses = learningMode === 'pro'
    ? PRO_FREE_COURSES
    : [...courses.filter(c => c.price === 0), ...CREATOR_FREE_EXTRA]
  const trendingCourses = learningMode === 'pro'
    ? PRO_TRENDING_COURSES
    : [...courses].sort((a, b) => b.enrollment_count - a.enrollment_count).slice(0, 6)
  const newCourses = learningMode === 'pro'
    ? PRO_TRENDING_COURSES.slice(3, 6)
    : courses.slice(-4)

  function handleEnroll(courseId) {
    setEnrollments(prev => [...prev, { course_id: courseId, progress_percent: 0 }])
  }

  const activeCategoryLabel = (learningMode === 'pro' ? PRO_CATEGORIES : CREATOR_CATEGORIES).find(c => c.id === selectedCategory)?.label

  const tabs = [
    { id: 'home', label: 'Discover', icon: <GraduationCap size={16} /> },
    { id: 'my-learning', label: 'My Learning', icon: <BookOpen size={16} /> },
    { id: 'teach', label: 'Teach', icon: <TrendingUp size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Top Nav Tabs */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          {/* Mode toggle */}
          <div className="ml-auto flex items-center bg-muted rounded-full p-0.5 gap-0.5 my-2">
            <button
              onClick={() => { setLearningMode('creator'); setSelectedCategory(null) }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${learningMode === 'creator' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              🎨 Creator
            </button>
            <button
              onClick={() => { setLearningMode('pro'); setSelectedCategory(null) }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${learningMode === 'pro' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              💼 Pro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <>
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8 md:p-12">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">{learningMode === 'pro' ? 'Pro Academy' : 'Creator Academy'}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {learningMode === 'pro' ? 'Advance Your Professional Career' : 'Level Up Your Creator Skills'}
                </h1>
                <p className="text-muted-foreground">
                  {learningMode === 'pro'
                    ? 'Industry-recognized certifications, business skills, and professional development. Built for serious career growth.'
                    : 'Learn from the best creators in the game. Practical, no-fluff courses that actually move the needle.'}
                </p>
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search courses, instructors, skills..."
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-10 pointer-events-none select-none">
                <span className="text-[180px]">🎓</span>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Browse by Category</h2>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    <X size={12} /> Clear filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {activeCategories.map(cat => (
                  <div key={cat.id} className={selectedCategory === cat.id ? 'ring-2 ring-primary rounded-xl' : ''}>
                    <CategoryCard cat={cat} onSelect={setSelectedCategory} />
                  </div>
                ))}
              </div>
            </div>

            {/* Filtered / Search results */}
            {(selectedCategory || searchQuery.trim()) && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">
                  {searchQuery.trim() ? `Results for "${searchQuery}"` : activeCategoryLabel}
                  <span className="text-sm font-normal text-muted-foreground ml-2">({filteredCourses.length} courses)</span>
                </h2>
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No courses found</p>
                    <p className="text-sm mt-1">Try a different keyword or category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCourses.map(course => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        enrolled={enrollments.find(e => e.course_id === course.id)}
                        onOpen={setSelectedCourse}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Default home sections */}
            {!selectedCategory && !searchQuery.trim() && (
              <>
                {/* Continue Learning */}
                {enrolledCourses.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">Continue Learning</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrolledCourses.slice(0, 3).map(course => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          enrolled={enrollments.find(e => e.course_id === course.id)}
                          onOpen={setSelectedCourse}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <HorizontalRow
                  title="Trending This Week"
                  courses={trendingCourses}
                  enrollments={enrollments}
                  onOpen={setSelectedCourse}
                />

                {/* Free Courses */}
                {freeCourses.length > 0 && (
                  <HorizontalRow
                    title="Free Courses"
                    courses={freeCourses}
                    enrollments={enrollments}
                    onOpen={setSelectedCourse}
                  />
                )}

                {/* New Releases */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground">New Releases</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {newCourses.map(course => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        enrolled={enrollments.find(e => e.course_id === course.id)}
                        onOpen={setSelectedCourse}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── MY LEARNING TAB ── */}
        {activeTab === 'my-learning' && (
          <MyLearningTab
            enrolledCourses={enrolledCourses}
            enrollments={enrollments}
            onOpen={setSelectedCourse}
            onBrowse={() => setActiveTab('home')}
          />
        )}

        {/* ── TEACH TAB ── */}
        {activeTab === 'teach' && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-primary/10 to-transparent border border-primary/20 p-8 md:p-12">
              <div className="max-w-xl space-y-4 relative z-10">
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Become an Instructor</span>
                <h1 className="text-3xl font-bold text-foreground leading-tight">Share Your Knowledge. Earn Revenue.</h1>
                <p className="text-muted-foreground">Create and sell courses to millions of creators worldwide. Keep 80% of every sale.</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowBuilder(true)}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={18} /> Create Your First Course
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-10 pointer-events-none select-none">
                <span className="text-[180px]">🏆</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Users size={20} className="text-primary" />, label: 'Total Students', value: '0' },
                { icon: <BookOpen size={20} className="text-green-400" />, label: 'Courses Published', value: '0' },
                { icon: <BarChart2 size={20} className="text-yellow-400" />, label: 'Total Revenue', value: '$0' },
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{stat.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue chart placeholder */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="font-semibold text-foreground">Revenue Overview</h2>
              <div className="h-40 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart2 size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Revenue chart will appear after your first sale</p>
                </div>
              </div>
            </div>

            {/* My courses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">My Courses</h2>
                <button
                  onClick={() => setShowBuilder(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus size={14} /> New Course
                </button>
              </div>
              <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl space-y-3">
                <div className="text-5xl">🎬</div>
                <h3 className="font-semibold text-foreground">No courses yet</h3>
                <p className="text-sm text-muted-foreground">Create your first course and start earning</p>
                <button
                  onClick={() => setShowBuilder(true)}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors mt-2"
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          enrolled={enrollments.find(e => e.course_id === selectedCourse.id)}
          onClose={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      )}

      {/* Course Builder Modal */}
      {showBuilder && (
        <CourseBuilderModal onClose={() => setShowBuilder(false)} />
      )}
    </div>
  )
}
