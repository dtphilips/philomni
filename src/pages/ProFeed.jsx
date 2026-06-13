import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { formatDistanceToNow } from 'date-fns'
import {
  ThumbsUp, Lightbulb, PartyPopper, Heart, HandHelping, HelpCircle,
  MessageSquare, Share2, Send, Loader2, X, ChevronDown, Briefcase,
  TrendingUp, BookOpen, Users, Building2, Award, Target, Globe,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRO_POST_TYPES = [
  { id: 'insight',   label: 'Industry Insight',        emoji: '💡' },
  { id: 'milestone', label: 'Career Milestone',         emoji: '🏆' },
  { id: 'article',   label: 'Article',                  emoji: '📝' },
  { id: 'opportunity', label: 'Opportunity',            emoji: '💼' },
  { id: 'learning',  label: 'Learning Achievement',     emoji: '🎓' },
  { id: 'collab',    label: 'Looking to Collaborate',   emoji: '🤝' },
  { id: 'data',      label: 'Data & Research',          emoji: '📊' },
  { id: 'company',   label: 'Company Update',           emoji: '🏢' },
]

const REACTION_TYPES = [
  { id: 'like',       emoji: '👍', label: 'Like' },
  { id: 'insightful', emoji: '💡', label: 'Insightful' },
  { id: 'celebrate',  emoji: '🎉', label: 'Celebrate' },
  { id: 'love',       emoji: '❤️', label: 'Love' },
  { id: 'support',    emoji: '👏', label: 'Support' },
  { id: 'curious',    emoji: '🤔', label: 'Curious' },
]

const SAMPLE_PRO_POSTS = [
  {
    id: 'pro-1',
    author_name: 'Adaeze Okonkwo',
    author_avatar: null,
    author_headline: 'Senior Cybersecurity Analyst',
    author_company: 'Palo Alto Networks',
    connection_degree: 1,
    post_type: 'insight',
    content: 'Zero-trust architecture is no longer optional — it\'s the baseline. After reviewing 200+ breach reports from Q1 2025, 78% of successful attacks exploited implicit trust between internal services. If you\'re still segmenting by perimeter, you\'re already behind. The shift to identity-first security isn\'t coming — it\'s here.',
    hashtags: ['#CyberSecurity', '#ZeroTrust', '#InfoSec', '#CloudSecurity'],
    reactions: { like: 312, insightful: 189, celebrate: 12, love: 34, support: 8, curious: 67 },
    comment_count: 45,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
  {
    id: 'pro-2',
    author_name: 'Marcus Dellano',
    author_avatar: null,
    author_headline: 'VP of Product → Chief Product Officer',
    author_company: 'Stripe',
    connection_degree: 2,
    post_type: 'milestone',
    content: 'Thrilled to share that I\'ve been promoted to Chief Product Officer at Stripe! 🎉 It\'s been an incredible 4-year journey from VP of Product. Grateful to the entire team who believed in the vision and pushed the boundaries of what financial infrastructure can look like. Excited for what\'s next.',
    hashtags: ['#CareerMilestone', '#ProductLeadership', '#Fintech', '#Gratitude'],
    reactions: { like: 1204, insightful: 45, celebrate: 876, love: 532, support: 290, curious: 18 },
    comment_count: 213,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
  {
    id: 'pro-3',
    author_name: 'Priya Ramanathan',
    author_avatar: null,
    author_headline: 'Head of Content Strategy & Growth Marketing',
    author_company: 'HubSpot',
    connection_degree: 2,
    post_type: 'article',
    content: 'I wrote about the death of "spray and pray" content marketing. In 2025, brands that publish 3 deeply researched pieces per month are outperforming those publishing 30 shallow ones by 4x in qualified lead gen. Quality has officially won. Link to the full piece in comments ↓',
    hashtags: ['#ContentMarketing', '#B2BMarketing', '#GrowthStrategy', '#SEO'],
    reactions: { like: 445, insightful: 312, celebrate: 23, love: 88, support: 56, curious: 134 },
    comment_count: 87,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    is_promoted: true,
  },
  {
    id: 'pro-4',
    author_name: 'Kwame Asante-Boateng',
    author_avatar: null,
    author_headline: 'Creator Economy Researcher & Analyst',
    author_company: 'a16z',
    connection_degree: 1,
    post_type: 'data',
    content: 'New data from our creator economy report: The top 1% of creators now earn 60x more than the median creator. But here\'s the counterintuitive finding — micro-creators (10k–100k followers) have 3x higher engagement rates and 2x better conversion for brand deals. The era of the nano-creator is upon us.',
    hashtags: ['#CreatorEconomy', '#DataInsights', '#InfluencerMarketing', '#Research'],
    reactions: { like: 789, insightful: 543, celebrate: 34, love: 120, support: 67, curious: 298 },
    comment_count: 156,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
  {
    id: 'pro-5',
    author_name: 'Lena Hoffmann',
    author_avatar: null,
    author_headline: 'Talent Acquisition Lead — Engineering',
    author_company: 'Notion',
    connection_degree: 2,
    post_type: 'opportunity',
    content: 'We\'re hiring! Notion is looking for a Senior Staff Engineer — Infrastructure to lead our database reliability team. Remote-first, competitive comp ($280k–$340k), and you\'ll be working on one of the most loved B2B products in the world. DM me or apply via the link. Referral bonus available for our network.',
    hashtags: ['#Hiring', '#SoftwareEngineering', '#RemoteWork', '#Infrastructure', '#TechJobs'],
    reactions: { like: 234, insightful: 12, celebrate: 45, love: 23, support: 89, curious: 67 },
    comment_count: 98,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
  {
    id: 'pro-6',
    author_name: 'Tariq Al-Rashidi',
    author_avatar: null,
    author_headline: 'Cloud Security Architect | CISSP | CISM',
    author_company: 'Deloitte',
    connection_degree: 1,
    post_type: 'learning',
    content: 'After 6 months of studying while working full-time, I\'ve officially passed my CISSP exam on the first attempt! 🎓 The (ISC)² exam is no joke — 125–175 adaptive questions covering 8 domains. If you\'re on this journey, happy to share my study plan and resources. Drop a comment or DM me.',
    hashtags: ['#CISSP', '#CyberSecurity', '#ContinuousLearning', '#Certification', '#ISC2'],
    reactions: { like: 876, insightful: 134, celebrate: 654, love: 312, support: 445, curious: 23 },
    comment_count: 134,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
  {
    id: 'pro-7',
    author_name: 'Simone Oduya',
    author_avatar: null,
    author_headline: 'Co-Founder & CEO',
    author_company: 'Fable AI',
    connection_degree: 2,
    post_type: 'company',
    content: 'Today we\'re launching Fable AI v2.0 — our AI-powered interactive storytelling platform now supports real-time voice narration, branching narrative graphs with up to 10,000 nodes, and co-authoring with your audience. We went from 0 to 50k users in 90 days. Today we\'re opening Series A applications. Builders, DM us.',
    hashtags: ['#ProductLaunch', '#AIStartup', '#SeriesA', '#InteractiveStory', '#BuildInPublic'],
    reactions: { like: 1456, insightful: 234, celebrate: 987, love: 456, support: 178, curious: 345 },
    comment_count: 289,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    is_promoted: true,
  },
  {
    id: 'pro-8',
    author_name: 'Olivia Tran',
    author_avatar: null,
    author_headline: 'UX Research Lead | Design Systems',
    author_company: 'Figma',
    connection_degree: 2,
    post_type: 'collab',
    content: 'Looking to collaborate with product designers and researchers on an open-source accessibility toolkit for design systems. Specifically need: WCAG 2.2 auditing patterns, color contrast automation scripts, and screen-reader testing flows. This will be published under MIT. Comment or DM if you\'re in.',
    hashtags: ['#UXDesign', '#Accessibility', '#DesignSystems', '#OpenSource', '#A11y'],
    reactions: { like: 345, insightful: 189, celebrate: 23, love: 78, support: 234, curious: 112 },
    comment_count: 67,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    is_promoted: false,
  },
]

const SAMPLE_SUGGESTED_PEOPLE = [
  {
    name: 'Yemi Adebayo',
    headline: 'Product Manager at Google',
    company: 'Google',
    mutual_connections: 14,
    avatar_color: 'bg-violet-500',
  },
  {
    name: 'Chidi Ezenwachi',
    headline: 'Full-Stack Engineer & OSS Contributor',
    company: 'Vercel',
    mutual_connections: 7,
    avatar_color: 'bg-emerald-500',
  },
  {
    name: 'Fatima Al-Hassan',
    headline: 'Venture Analyst | Fintech & Web3',
    company: 'Sequoia Capital',
    mutual_connections: 22,
    avatar_color: 'bg-rose-500',
  },
  {
    name: 'Daniel Park',
    headline: 'DevRel Engineer | API & SDKs',
    company: 'Twilio',
    mutual_connections: 5,
    avatar_color: 'bg-amber-500',
  },
]

const SAMPLE_TRENDING = [
  { tag: 'AIInBusiness',      post_count: 24800 },
  { tag: 'FutureOfWork',      post_count: 18200 },
  { tag: 'CreatorEconomy',    post_count: 15600 },
  { tag: 'ProductLed Growth', post_count: 12900 },
  { tag: 'ZeroTrust',         post_count: 9400 },
]

const SAMPLE_JOBS_SIDEBAR = [
  { title: 'Senior Product Designer',   company: 'Figma',       location: 'San Francisco, CA', type: 'Full-time' },
  { title: 'Staff ML Engineer',         company: 'Anthropic',   location: 'Remote',            type: 'Full-time' },
  { title: 'Head of Growth Marketing',  company: 'Linear',      location: 'New York, NY',      type: 'Full-time' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function totalReactions(reactions) {
  return Object.values(reactions || {}).reduce((a, b) => a + b, 0)
}

function topReactionEmojis(reactions, count = 3) {
  return Object.entries(reactions || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([id]) => REACTION_TYPES.find(r => r.id === id)?.emoji)
    .filter(Boolean)
}

// ─── PostTypeTag ──────────────────────────────────────────────────────────────

function PostTypeTag({ type }) {
  const found = PRO_POST_TYPES.find(t => t.id === type)
  if (!found) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      <span>{found.emoji}</span>
      <span>{found.label}</span>
    </span>
  )
}

// ─── ReactionBar ──────────────────────────────────────────────────────────────

function ReactionBar({ post, onReact }) {
  const [showPicker, setShowPicker] = useState(false)
  const [userReaction, setUserReaction] = useState(null)
  const hoverTimeout = useRef(null)

  function handleMouseEnterLike() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setShowPicker(true), 350)
  }

  function handleMouseLeaveLike() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setShowPicker(false), 400)
  }

  function handlePickerMouseEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
  }

  function handlePickerMouseLeave() {
    hoverTimeout.current = setTimeout(() => setShowPicker(false), 300)
  }

  function handleReact(reactionId) {
    setUserReaction(reactionId)
    setShowPicker(false)
    onReact(post.id, reactionId)
  }

  const activeReaction = REACTION_TYPES.find(r => r.id === userReaction)

  return (
    <div className="flex items-center gap-1">
      {/* Like / Reaction button with picker */}
      <div className="relative">
        {/* Floating picker */}
        {showPicker && (
          <div
            className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-card border border-border rounded-full px-3 py-2 shadow-xl z-20"
            onMouseEnter={handlePickerMouseEnter}
            onMouseLeave={handlePickerMouseLeave}
          >
            {REACTION_TYPES.map(r => (
              <button
                key={r.id}
                onClick={() => handleReact(r.id)}
                title={r.label}
                className="text-xl hover:scale-125 transition-transform duration-150 cursor-pointer"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            userReaction
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onMouseEnter={handleMouseEnterLike}
          onMouseLeave={handleMouseLeaveLike}
          onClick={() => handleReact(userReaction ? null : 'like')}
        >
          {activeReaction ? (
            <span className="text-base">{activeReaction.emoji}</span>
          ) : (
            <ThumbsUp className="w-4 h-4" />
          )}
          <span>{activeReaction ? activeReaction.label : 'Like'}</span>
        </button>
      </div>
    </div>
  )
}

// ─── ProPostCard ──────────────────────────────────────────────────────────────

function ProPostCard({ post, onReact, onComment }) {
  const [expanded, setExpanded] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const { user } = useAuth()

  const isLong = post.content.length > 220
  const displayContent = !isLong || expanded ? post.content : post.content.slice(0, 220)

  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    await new Promise(r => setTimeout(r, 600))
    setCommentText('')
    setShowCommentInput(false)
    setSubmittingComment(false)
  }

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden relative">
      {/* Promoted badge */}
      {post.is_promoted && (
        <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
          Promoted
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
            {getInitials(post.author_name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm hover:underline cursor-pointer">
                {post.author_name}
              </span>

              {/* Connection degree */}
              {post.connection_degree === 1 ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                  1st
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                  2nd
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">{post.author_headline}</p>
            <p className="text-xs text-muted-foreground">{post.author_company}</p>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <PostTypeTag type={post.post_type} />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {displayContent}
            {isLong && !expanded && (
              <>
                {'... '}
                <button
                  className="text-primary text-sm font-medium hover:underline cursor-pointer"
                  onClick={() => setExpanded(true)}
                >
                  see more
                </button>
              </>
            )}
          </p>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-xs text-primary hover:underline cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reaction summary */}
        {totalReactions(post.reactions) > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
            <div className="flex items-center gap-1">
              <span>{topReactionEmojis(post.reactions).join('')}</span>
              <span>{totalReactions(post.reactions).toLocaleString()}</span>
            </div>
            <span>{post.comment_count} comments</span>
          </div>
        )}

        {/* Action row */}
        <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
          <ReactionBar post={post} onReact={onReact} />

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => setShowCommentInput(v => !v)}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span>Repost</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-auto">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>

        {/* Inline comment form */}
        {showCommentInput && (
          <form onSubmit={handleCommentSubmit} className="mt-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
              {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 border border-border focus-within:border-primary/50">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="text-primary disabled:opacity-40 cursor-pointer"
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  )
}

// ─── ProPostComposer ──────────────────────────────────────────────────────────

function ProPostComposer({ onPost }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [hashtag, setHashtag] = useState('')
  const [hashtags, setHashtags] = useState([])
  const [visibility, setVisibility] = useState('public')
  const [submitting, setSubmitting] = useState(false)
  const [postingAs, setPostingAs] = useState(null)
  const [myCompanies, setMyCompanies] = useState([])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('company_pages').select('id, name, logo_url').eq('owner_id', user.id).then(({ data }) => {
      setMyCompanies(data ?? [])
    })
  }, [user?.id])

  function handleHashtagKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ' || e.key === ',') && hashtag.trim()) {
      e.preventDefault()
      const tag = hashtag.replace(/^#/, '').trim()
      if (tag && !hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag])
      }
      setHashtag('')
    }
  }

  function removeHashtag(tag) {
    setHashtags(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)

    try {
      const isCompanyPost = !!postingAs
      const { error } = await supabase.from('posts').insert({
        content,
        feed_type: 'pro',
        post_type: selectedType,
        hashtags,
        visibility,
        author_id: user?.id,
        created_by: user?.id,
        user_id: user?.id,
        author_name: isCompanyPost ? postingAs.name : (user?.user_metadata?.full_name || user?.email),
        author_avatar: isCompanyPost ? postingAs.logo_url : null,
        company_id: isCompanyPost ? postingAs.id : null,
        created_at: new Date().toISOString(),
      })
      if (!error) {
        setContent('')
        setSelectedType(null)
        setHashtags([])
        setVisibility('public')
        setOpen(false)
        onPost?.()
      }
    } catch {
      // fail silently
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'

  const avatarSrc = postingAs?.logo_url ?? null
  const avatarName = postingAs?.name ?? displayName

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      {/* "Post as" switcher */}
      {myCompanies.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3 pb-3 border-b border-border">
          <span className="text-xs text-muted-foreground">Post as:</span>
          <button onClick={() => setPostingAs(null)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${!postingAs ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            {getInitials(displayName)}
            <span>{displayName.split(' ')[0]}</span>
          </button>
          {myCompanies.map(co => (
            <button key={co.id} onClick={() => setPostingAs(postingAs?.id === co.id ? null : co)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${postingAs?.id === co.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {co.logo_url ? <img src={co.logo_url} className="w-4 h-4 rounded-full object-cover" alt="" /> : '🏢'}
              {co.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
          {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" alt="" /> : getInitials(avatarName)}
        </div>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-full border border-border bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Share an industry insight, career milestone, or business update...
          </button>
        ) : (
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                maxLength={3000}
                placeholder="Share an industry insight, career milestone, or business update..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                autoFocus
              />

              {/* Char counter */}
              <div className="flex justify-end">
                <span className={`text-xs ${content.length > 2800 ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {content.length}/3000
                </span>
              </div>

              {/* Post type chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {PRO_POST_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(prev => prev === type.id ? null : type.id)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      selectedType === type.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Hashtag input */}
              <div className="flex flex-wrap gap-1.5 items-center bg-muted rounded-lg px-3 py-2 border border-border">
                {hashtags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    #{tag}
                    <button type="button" onClick={() => removeHashtag(tag)} className="cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={hashtag}
                  onChange={e => setHashtag(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="# Add hashtags"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-[120px]"
                />
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between gap-3">
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value)}
                  className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="public">🌐 Public</option>
                  <option value="connections">🔗 Connections</option>
                  <option value="anyone">👥 Anyone</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className="px-5 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────

function RightSidebar() {
  const navigate = useNavigate()
  const [connected, setConnected] = useState([])

  return (
    <aside className="space-y-4 w-full">
      {/* People you may know */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          People you may know
        </h3>
        <div className="space-y-3">
          {SAMPLE_SUGGESTED_PEOPLE.map(person => (
            <div key={person.name} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${person.avatar_color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                {getInitials(person.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground truncate">{person.headline}</p>
                <p className="text-xs text-muted-foreground">{person.mutual_connections} mutual</p>
              </div>
              <button
                onClick={() => setConnected(prev => prev.includes(person.name) ? prev : [...prev, person.name])}
                className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border font-medium transition-colors cursor-pointer ${
                  connected.includes(person.name)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                {connected.includes(person.name) ? 'Pending' : '+ Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs you might like */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Jobs you might like
        </h3>
        <div className="space-y-3">
          {SAMPLE_JOBS_SIDEBAR.map(job => (
            <div key={job.title} className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">{job.title}</p>
              <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
              <p className="text-xs text-muted-foreground">{job.type}</p>
              <button
                onClick={() => navigate('/jobs')}
                className="mt-1 text-xs text-primary hover:underline cursor-pointer"
              >
                Apply →
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        >
          View all jobs
        </button>
      </div>

      {/* Trending topics */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending topics
        </h3>
        <div className="space-y-2">
          {SAMPLE_TRENDING.map((topic, i) => (
            <div key={topic.tag} className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground mr-1">#{i + 1}</span>
                <span className="text-xs font-medium text-primary hover:underline cursor-pointer">
                  #{topic.tag}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {(topic.post_count / 1000).toFixed(1)}k posts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Learning for you */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Learning for you
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/learning')}
            className="w-full text-left px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-foreground">Product-Led Growth Fundamentals</p>
            <p className="text-xs text-muted-foreground mt-0.5">4.8 ★ · 2.3k learners</p>
          </button>
          <button
            onClick={() => navigate('/learning')}
            className="w-full text-left px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-foreground">AI for Business Leaders</p>
            <p className="text-xs text-muted-foreground mt-0.5">4.9 ★ · 5.1k learners</p>
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── ProFeed (default export) ─────────────────────────────────────────────────

export default function ProFeed() {
  const { user } = useAuth()
  const { mode } = useMode()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState({})

  useEffect(() => {
    async function loadPosts() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('feed_type', 'pro')
          .order('created_at', { ascending: false })
          .limit(30)

        if (error || !data || data.length === 0) {
          setPosts(SAMPLE_PRO_POSTS)
        } else {
          setPosts(data)
        }
      } catch {
        setPosts(SAMPLE_PRO_POSTS)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  function handleReact(postId, reactionId) {
    setReactions(prev => {
      const current = prev[postId]
      if (current === reactionId) {
        const next = { ...prev }
        delete next[postId]
        return next
      }
      return { ...prev, [postId]: reactionId }
    })
  }

  function handleNewPost() {
    // Re-fetch after posting
    setLoading(true)
    supabase
      .from('posts')
      .select('*')
      .eq('feed_type', 'pro')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setPosts(data)
        }
        setLoading(false)
      })
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Main feed */}
        <main className="space-y-4 min-w-0">
          {/* Composer */}
          <ProPostComposer onPost={handleNewPost} />

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            posts.map(post => (
              <ProPostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onComment={() => {}}
              />
            ))
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No professional posts yet. Be the first to share an insight.
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <div className="hidden lg:block sticky top-4">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
