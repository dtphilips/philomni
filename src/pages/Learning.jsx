import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search, Star, Clock, BookOpen, Users, ChevronDown, ChevronRight,
  Play, Lock, CheckCircle, X, Plus, Trash2, Upload, Award,
  TrendingUp, Zap, GraduationCap, BarChart2, ChevronLeft, Globe
} from 'lucide-react'

// ─── Static Data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'video',    icon: '🎬', label: 'Video Production',      count: 124 },
  { id: 'music',    icon: '🎵', label: 'Music & Audio',         count: 89  },
  { id: 'social',   icon: '📱', label: 'Social Media Growth',   count: 203 },
  { id: 'money',    icon: '💰', label: 'Creator Monetization',  count: 67  },
  { id: 'design',   icon: '🎨', label: 'Design & Branding',     count: 145 },
  { id: 'business', icon: '📊', label: 'Business & Marketing',  count: 98  },
  { id: 'tech',     icon: '💻', label: 'Tech & AI Tools',       count: 76  },
  { id: 'photo',    icon: '📸', label: 'Photography',           count: 112 },
  { id: 'writing',  icon: '✍️', label: 'Writing & Storytelling',count: 88  },
  { id: 'speaking', icon: '🎤', label: 'Public Speaking',       count: 54  },
  { id: 'security', icon: '🔒', label: 'Cybersecurity',         count: 32  },
  { id: 'wellness', icon: '🏥', label: 'Health & Wellness',     count: 41  },
]

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
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({ 0: true })
  const [enrolling, setEnrolling] = useState(false)

  function toggleSection(idx) {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  async function handleEnroll() {
    setEnrolling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('enrollments').insert({
          course_id: course.id,
          user_id: user.id,
          progress_percent: 0,
          enrolled_at: new Date().toISOString(),
        })
      }
      onEnroll(course.id)
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
                          <div key={li} className="flex items-center gap-3 px-4 py-2.5">
                            {lesson.free ? (
                              <Play size={13} className="text-primary flex-shrink-0" />
                            ) : (
                              <Lock size={13} className="text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm text-foreground flex-1">{lesson.title}</span>
                            {lesson.free && <span className="text-[10px] text-primary border border-primary/30 px-1.5 py-0.5 rounded">Preview</span>}
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

              {enrolled ? (
                <button className="w-full bg-green-500 text-white font-semibold py-2.5 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Continue Learning
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                </button>
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
    </div>
  )
}

// ─── CourseBuilderModal ──────────────────────────────────────────────────────

function CourseBuilderModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [publishing, setPublishing] = useState(false)
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
                    {sec.lessons.map((lesson, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-2 px-3 py-2.5">
                        <select
                          value={lesson.type}
                          onChange={e => updateLesson(sIdx, lIdx, 'type', e.target.value)}
                          className="bg-muted border border-border rounded-lg text-xs text-foreground px-2 py-1 focus:outline-none"
                        >
                          {['Video', 'Text', 'PDF', 'Audio', 'Quiz'].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                        </select>
                        <input
                          value={lesson.title}
                          onChange={e => updateLesson(sIdx, lIdx, 'title', e.target.value)}
                          placeholder="Lesson title"
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lesson.free}
                            onChange={e => updateLesson(sIdx, lIdx, 'free', e.target.checked)}
                            className="accent-primary"
                          />
                          Free preview
                        </label>
                        <button onClick={() => removeLesson(sIdx, lIdx)} className="text-muted-foreground hover:text-red-400 transition-colors"><X size={13} /></button>
                      </div>
                    ))}
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
  const [activeTab, setActiveTab] = useState('home')
  const [courses, setCourses] = useState(SAMPLE_COURSES)
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const freeCourses = courses.filter(c => c.price === 0)
  const trendingCourses = [...courses].sort((a, b) => b.enrollment_count - a.enrollment_count).slice(0, 6)
  const newCourses = courses.slice(-4)

  function handleEnroll(courseId) {
    setEnrollments(prev => [...prev, { course_id: courseId, progress_percent: 0 }])
  }

  const activeCategoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label

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
                  <span className="text-sm font-semibold text-primary">Creator Academy</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">Level Up Your Creator Skills</h1>
                <p className="text-muted-foreground">Learn from the best creators in the game. Practical, no-fluff courses that actually move the needle.</p>
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
                {CATEGORIES.map(cat => (
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">My Learning</h1>
              <span className="text-sm text-muted-foreground">{enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled</span>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="text-6xl">📚</div>
                <h2 className="text-xl font-bold text-foreground">No courses yet</h2>
                <p className="text-muted-foreground">Enroll in a course to start your learning journey</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {enrolledCourses.map(course => (
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
