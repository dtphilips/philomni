import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  MessageSquare, Users, Target, Calendar, Trophy, Megaphone,
  Plus, X, Search, ChevronUp, ChevronDown, ArrowUp, ArrowDown,
  Heart, Bookmark, Share2, Flag, Pin, Clock, MapPin, Globe,
  Star, Check, Loader2, Send, Eye, ThumbsUp, Award, Zap,
  Bell, TrendingUp, Hash, UserPlus, ChevronRight,
} from 'lucide-react'

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_POSTS = [
  { id: 'p1', board: 'tips', title: 'How I grew from 0 to 50K followers in 6 months (no paid ads)', author_name: 'Sarah K.', author_avatar: null, score: 247, comment_count: 68, view_count: 4200, created_at: new Date(Date.now()-7200000).toISOString(), is_pinned: true, tags: ['growth', 'instagram', 'strategy'], content: 'Here\'s everything I did step by step...\n\n1. Niche down hard — I picked "sustainable travel" and never deviated\n2. Posted 3x per day for the first 30 days\n3. Collaborated with micro-influencers in my niche\n4. Used a consistent visual brand from day 1\n5. Engaged with every single comment for the first 3 months' },
  { id: 'p2', board: 'collab', title: 'Looking for a video editor for my documentary short — paid opportunity', author_name: 'Marcus O.', author_avatar: null, score: 89, comment_count: 23, view_count: 1800, created_at: new Date(Date.now()-18000000).toISOString(), is_pinned: false, tags: ['hiring', 'video', 'paid'], content: 'My short documentary "Voices of Lagos" is nearly complete but I need an experienced editor. Budget: $500. DM me your reel.' },
  { id: 'p3', board: 'tools', title: 'Honest review: Is CapCut Pro actually worth it in 2025?', author_name: 'Devon L.', author_avatar: null, score: 156, comment_count: 44, view_count: 3100, created_at: new Date(Date.now()-86400000).toISOString(), is_pinned: false, tags: ['capcut', 'review', 'editing'], content: 'I\'ve been using CapCut Pro for 3 months now. Here\'s my unfiltered take...' },
  { id: 'p4', board: 'money', title: 'I made $12k last month from digital products — here\'s my exact breakdown', author_name: 'Priya S.', author_avatar: null, score: 512, comment_count: 97, view_count: 8900, created_at: new Date(Date.now()-172800000).toISOString(), is_pinned: false, tags: ['income', 'digital products', 'breakdown'], content: 'Preset packs: $4,200\nLightroom course: $3,800\nCoaching calls: $2,100\nAffiliate: $1,900\n\nTotal: $12,000. Ask me anything.' },
  { id: 'p5', board: 'showcase', title: 'Just finished my first cinematic travel film — would love feedback', author_name: 'Yuki T.', author_avatar: null, score: 74, comment_count: 31, view_count: 920, created_at: new Date(Date.now()-259200000).toISOString(), is_pinned: false, tags: ['film', 'travel', 'feedback'], content: 'Spent 3 weeks in Morocco with just my Sony A7IV. This is the result. Be honest!' },
  { id: 'p6', board: 'help', title: 'YouTube shorts vs TikTok vs Instagram Reels — which is actually worth the time in 2025?', author_name: 'Jordan B.', author_avatar: null, score: 203, comment_count: 78, view_count: 5600, created_at: new Date(Date.now()-345600000).toISOString(), is_pinned: false, tags: ['shorts', 'tiktok', 'reels', 'strategy'], content: 'I\'m a solo creator with limited time. I want to know where to focus. What\'s working for you right now?' },
  { id: 'p7', board: 'general', title: 'The creator economy is not dying — it\'s evolving. Here\'s why I\'m more optimistic than ever', author_name: 'Emma L.', author_avatar: null, score: 388, comment_count: 112, view_count: 7200, created_at: new Date(Date.now()-432000000).toISOString(), is_pinned: false, tags: ['creator economy', 'opinion', 'future'], content: 'Every few months someone publishes a "creator economy is dead" article. Here\'s my counter-argument...' },
  { id: 'p8', board: 'opps', title: '🚨 Brand is looking for 10 micro-influencers for a skincare campaign — $300 each', author_name: 'Kai Studio', author_avatar: null, score: 167, comment_count: 56, view_count: 4400, created_at: new Date(Date.now()-518400000).toISOString(), is_pinned: false, tags: ['ugc', 'skincare', 'paid'], content: 'Requirements: 1K-50K followers, beauty/wellness niche. DM with stats.' },
  { id: 'p9', board: 'tips', title: 'The email list strategy that doubled my course sales', author_name: 'Alex T.', author_avatar: null, score: 291, comment_count: 53, view_count: 3900, created_at: new Date(Date.now()-604800000).toISOString(), is_pinned: false, tags: ['email', 'sales', 'strategy'], content: 'I ignored email for 2 years. That was a mistake. Here\'s how I built 8,000 subscribers in 4 months and the sequence that converts them.' },
  { id: 'p10', board: 'collab', title: 'Music producer looking for a vocalist for R&B track — revenue share', author_name: 'Marcus O.', author_avatar: null, score: 63, comment_count: 19, view_count: 740, created_at: new Date(Date.now()-691200000).toISOString(), is_pinned: false, tags: ['music', 'collab', 'rb'], content: 'I have a polished R&B instrumental ready. Looking for a vocalist with a smooth, soulful voice. 50/50 royalty split on all platforms.' },
  { id: 'p11', board: 'tools', title: 'Adobe vs DaVinci Resolve in 2025 — made the switch and here\'s my honest take', author_name: 'Tyler O.', author_avatar: null, score: 145, comment_count: 67, view_count: 2800, created_at: new Date(Date.now()-777600000).toISOString(), is_pinned: false, tags: ['davinci', 'adobe', 'editing'], content: 'After 5 years of Premiere Pro, I fully switched to DaVinci Resolve 19. Was it worth it? Short answer: mostly yes.' },
  { id: 'p12', board: 'money', title: 'Brand deal red flags — 7 things that make me say no immediately', author_name: 'Sofia C.', author_avatar: null, score: 334, comment_count: 89, view_count: 6100, created_at: new Date(Date.now()-864000000).toISOString(), is_pinned: false, tags: ['brand deals', 'contracts', 'advice'], content: '1. No contract sent upfront\n2. "Exposure" as payment\n3. Unlimited usage rights\n4. Full creative control request\n5. Payment after posting\n6. No kill fee clause\n7. "We\'ll review the content before you post" + no edit limit' },
  { id: 'p13', board: 'showcase', title: 'My Afrobeats EP "Lagos Nights" is live on all platforms 🎶', author_name: 'Marcus O.', author_avatar: null, score: 98, comment_count: 41, view_count: 1500, created_at: new Date(Date.now()-950400000).toISOString(), is_pinned: false, tags: ['afrobeats', 'release', 'ep'], content: '2 years in the making. 7 tracks. Fully independent. Stream "Lagos Nights" everywhere music is played.' },
  { id: 'p14', board: 'tips', title: 'Stop making content for the algorithm — make it for your community instead', author_name: 'Emma L.', author_avatar: null, score: 421, comment_count: 103, view_count: 8300, created_at: new Date(Date.now()-1036800000).toISOString(), is_pinned: false, tags: ['mindset', 'community', 'strategy'], content: 'The algorithm changes every 6 months. Your community lasts forever. Here\'s how I shifted my focus and doubled my engagement without changing my posting frequency.' },
  { id: 'p15', board: 'help', title: 'Newbie here — what\'s the single best investment to make as a new creator with $500?', author_name: 'Carlos R.', author_avatar: null, score: 176, comment_count: 134, view_count: 4700, created_at: new Date(Date.now()-1123200000).toISOString(), is_pinned: false, tags: ['newbie', 'gear', 'advice'], content: 'I have $500 to spend on my creator journey. Should it go to gear? Software? A course? Please help.' },
]

const SAMPLE_GROUPS = [
  { id: 'g1', name: 'Video Creators Network', category: 'video', emoji: '🎬', member_count: 12430, description: 'Connect with video creators worldwide. Share work, get feedback, find collabs and job opportunities.', is_featured: true, joined_this_week: 340, cover_color: 'from-violet-600 to-blue-600' },
  { id: 'g2', name: 'African Creators Hub', category: 'regional', emoji: '🌍', member_count: 8720, description: 'The premier community for African and diaspora creators — celebrating African creativity and building together.', is_featured: true, joined_this_week: 215, cover_color: 'from-emerald-600 to-teal-600' },
  { id: 'g3', name: 'Musicians & Producers', category: 'music', emoji: '🎵', member_count: 9180, description: 'Producers, beatmakers, singers, and musicians. Share tracks, find features, discuss the craft.', is_featured: false, joined_this_week: 178, cover_color: 'from-pink-600 to-rose-600' },
  { id: 'g4', name: 'UGC Creators & Brand Deals', category: 'business', emoji: '💼', member_count: 6540, description: 'Land brand deals, share rate cards, get contract advice. The business side of creating.', is_featured: true, joined_this_week: 290, cover_color: 'from-amber-600 to-orange-600' },
  { id: 'g5', name: 'Photographers Collective', category: 'photo', emoji: '📸', member_count: 5210, description: 'Share your work, get feedback, discuss gear, and connect with other visual artists globally.', is_featured: false, joined_this_week: 89, cover_color: 'from-blue-600 to-cyan-600' },
  { id: 'g6', name: 'Writers & Storytellers', category: 'writing', emoji: '✍️', member_count: 4380, description: 'Scripts, blog posts, newsletters, books. Writers helping writers get better and reach more readers.', is_featured: false, joined_this_week: 67, cover_color: 'from-purple-600 to-violet-600' },
  { id: 'g7', name: 'Podcast Creator Community', category: 'audio', emoji: '🎙', member_count: 3920, description: 'Launch, grow, and monetize your podcast. Tips, collabs, guest swaps, and equipment advice.', is_featured: false, joined_this_week: 112, cover_color: 'from-indigo-600 to-blue-600' },
  { id: 'g8', name: 'Social Media Strategists', category: 'social', emoji: '📱', member_count: 7760, description: 'Algorithm updates, content calendars, engagement tactics. Stay ahead of the social media game.', is_featured: false, joined_this_week: 203, cover_color: 'from-rose-600 to-pink-600' },
  { id: 'g9', name: 'Tech & AI for Creators', category: 'tech', emoji: '🤖', member_count: 5540, description: 'AI tools, automation, tech setups. How to use technology to 10x your creative output.', is_featured: true, joined_this_week: 445, cover_color: 'from-teal-600 to-emerald-600' },
  { id: 'g10', name: 'Designers & Visual Artists', category: 'design', emoji: '🎨', member_count: 4150, description: 'Graphic designers, motion artists, illustrators. Share your work, get critiques, and find clients.', is_featured: false, joined_this_week: 94, cover_color: 'from-orange-600 to-red-600' },
]

const SAMPLE_CHALLENGES = [
  { id: 'c1', title: '30-Second Origin Story', description: 'Tell your creator origin story in 30 seconds or less. Why did you start creating? What\'s your mission?', type: 'video', prize: '🏅 Featured on Philomni homepage + Challenge Champion badge', hashtag: '#MyCreatorStory', ends_at: new Date(Date.now()+259200000).toISOString(), entry_count: 234, status: 'active', cover_color: 'from-violet-600 to-purple-700', emoji: '🎬' },
  { id: 'c2', title: 'Golden Hour Challenge', description: 'Capture the most stunning golden hour photo or video. Any subject — let the light be the star.', type: 'photo', prize: '🖼 Featured in Philomni gallery + $50 Marketplace credit', hashtag: '#GoldenHourPhilomni', ends_at: new Date(Date.now()+432000000).toISOString(), entry_count: 412, status: 'active', cover_color: 'from-amber-500 to-orange-600', emoji: '📸' },
  { id: 'c3', title: 'Hot 16 Challenge', description: 'Drop your best 16 bars. Original beats only. Any genre. Show the community what you\'ve got.', type: 'music', prize: '🎵 Beat placement opportunity + Philomni Music feature', hashtag: '#Hot16Philomni', ends_at: new Date(Date.now()+604800000).toISOString(), entry_count: 178, status: 'active', cover_color: 'from-pink-600 to-rose-700', emoji: '🎵' },
  { id: 'c4', title: '60-Second Tutorial', description: 'Teach something valuable in 60 seconds. Skill, trick, life hack — anything that helps other creators.', type: 'video', prize: '👑 Creator Elite badge + 1 month Philomni Pro free', hashtag: '#60SecTutorial', ends_at: new Date(Date.now()+777600000).toISOString(), entry_count: 89, status: 'active', cover_color: 'from-emerald-600 to-teal-700', emoji: '💡' },
  { id: 'c5', title: 'Brand Pitch Challenge', description: 'Design and pitch a creator brand campaign concept for any fictional or real brand. Written or video.', type: 'writing', prize: '💼 Featured in Creator Market + Business mentorship session', hashtag: '#BrandPitchChallenge', ends_at: new Date(Date.now()+950400000).toISOString(), entry_count: 56, status: 'active', cover_color: 'from-blue-600 to-indigo-700', emoji: '📊' },
  { id: 'c6', title: 'Best Thumbnail Design', description: 'Design a thumbnail for any topic. Most click-worthy wins as voted by the community.', type: 'design', prize: '🎨 Design Portfolio feature + Marketplace Seller Boost', hashtag: '#ThumbnailChamp', ends_at: new Date(Date.now()-86400000).toISOString(), entry_count: 341, status: 'ended', winner: 'Tyler O.', cover_color: 'from-purple-600 to-violet-700', emoji: '🎨' },
  { id: 'c7', title: 'Short Film Sprint', description: 'Create a short film (under 3 mins) in 72 hours. Any genre, any format.', type: 'video', prize: '🏆 Philomni Hall of Fame + Distribution opportunity', hashtag: '#FilmSprint72', ends_at: new Date(Date.now()-604800000).toISOString(), entry_count: 67, status: 'ended', winner: 'Yuki T.', cover_color: 'from-red-600 to-rose-700', emoji: '🎬' },
  { id: 'c8', title: 'Personal Essay Challenge', description: 'Write a personal essay (500-1000 words) about a pivotal moment in your creative journey.', type: 'writing', prize: '✍️ Featured in Philomni Blog + Writing badge', hashtag: '#MyCreatorJourney', ends_at: new Date(Date.now()-1209600000).toISOString(), entry_count: 89, status: 'ended', winner: 'Dana P.', cover_color: 'from-indigo-600 to-blue-700', emoji: '✍️' },
]

const SAMPLE_EVENTS = [
  { id: 'e1', title: 'Creator Monetization Summit 2026', type: 'webinar', host_name: 'Philomni Team', date: new Date(Date.now()+432000000).toISOString(), duration: '3 hours', location: 'Virtual — Philomni Live Room', attendee_count: 1240, is_free: true, description: 'Join 1,000+ creators for deep dives into brand deals, digital products, courses, and the future of creator monetization. Featuring 8 speakers.', emoji: '🎙', cover_color: 'from-violet-600 to-purple-700', speakers: ['Alex Turner', 'Priya Sharma', 'Emma Laurent'] },
  { id: 'e2', title: 'Afrobeats Producers Masterclass', type: 'masterclass', host_name: 'Marcus Osei', date: new Date(Date.now()+777600000).toISOString(), duration: '2 hours', location: 'Virtual — Zoom', attendee_count: 340, is_free: false, price: 35, description: 'Learn Afrobeats production from scratch — drum patterns, bass lines, melody, arrangement, and mixing. All levels welcome.', emoji: '🎵', cover_color: 'from-pink-600 to-rose-700', speakers: ['Marcus Osei'] },
  { id: 'e3', title: 'London Creator Networking Meetup', type: 'networking', host_name: 'UK Creators Network', date: new Date(Date.now()+1296000000).toISOString(), duration: '3 hours', location: 'Shoreditch, London — WeWork Space', attendee_count: 87, is_free: true, description: 'In-person networking for London-based creators. Connect, collaborate, share what you\'re working on. Drinks and food provided.', emoji: '🤝', cover_color: 'from-blue-600 to-cyan-700', speakers: [] },
  { id: 'e4', title: 'YouTube Algorithm Decoded: 2026 Edition', type: 'webinar', host_name: 'Alex Turner', date: new Date(Date.now()+1728000000).toISOString(), duration: '90 mins', location: 'Virtual — Philomni Room', attendee_count: 892, is_free: true, description: 'What actually works on YouTube in 2026? Deep dive into the algorithm, SEO, thumbnails, and the content types YouTube is actively promoting.', emoji: '📺', cover_color: 'from-red-600 to-rose-700', speakers: ['Alex Turner'] },
  { id: 'e5', title: 'Brand Deal Negotiation Workshop', type: 'workshop', host_name: 'Emma Laurent', date: new Date(Date.now()+2160000000).toISOString(), duration: '2 hours', location: 'Virtual — Zoom', attendee_count: 234, is_free: false, price: 49, description: 'Live workshop: how to find, negotiate, and close brand deals. Rate card templates, contract review, and live Q&A. Limited to 50 spots.', emoji: '💼', cover_color: 'from-amber-600 to-orange-700', speakers: ['Emma Laurent'] },
  { id: 'e6', title: 'Community Open Mic: Showcase Your Work', type: 'showcase', host_name: 'Philomni Community', date: new Date(Date.now()+2592000000).toISOString(), duration: '2 hours', location: 'Virtual — Philomni Live Room', attendee_count: 156, is_free: true, description: 'Monthly community showcase! Share your latest work — video, music, design, writing — and get live feedback from fellow creators.', emoji: '🎤', cover_color: 'from-emerald-600 to-teal-700', speakers: [] },
]

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: 'Sarah K.',   avatar: null, role: 'Video Creator',     points: 4280, change: 12,  badge: '🥇', badges: ['🔥','💡','🏆'] },
  { rank: 2, name: 'Alex T.',    avatar: null, role: 'Course Creator',    points: 3910, change: 5,   badge: '🥈', badges: ['⭐','🎓'] },
  { rank: 3, name: 'Priya S.',   avatar: null, role: 'Social Strategist', points: 3640, change: -2,  badge: '🥉', badges: ['🔥','🤝'] },
  { rank: 4, name: 'Tyler O.',   avatar: null, role: 'Designer',          points: 3180, change: 8,   badge: '',   badges: ['🎨'] },
  { rank: 5, name: 'Emma L.',    avatar: null, role: 'Brand Consultant',  points: 2970, change: 3,   badge: '',   badges: ['💡','🌍'] },
  { rank: 6, name: 'Marcus O.',  avatar: null, role: 'Music Producer',    points: 2720, change: -5,  badge: '',   badges: ['🎵'] },
  { rank: 7, name: 'Jordan B.',  avatar: null, role: 'UGC Creator',       points: 2540, change: 21,  badge: '',   badges: ['⭐'] },
  { rank: 8, name: 'Devon L.',   avatar: null, role: 'Tech Creator',      points: 2310, change: -1,  badge: '',   badges: [] },
  { rank: 9, name: 'Sofia C.',   avatar: null, role: 'Graphic Designer',  points: 2180, change: 4,   badge: '',   badges: ['🎨','🤝'] },
  { rank: 10, name: 'Carlos R.', avatar: null, role: 'Voice Artist',      points: 1940, change: 11,  badge: '',   badges: [] },
]

const SAMPLE_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Welcome to the Philomni Community! 🎉', content: 'We\'ve officially launched the Philomni Community Hub — your home base for connecting with thousands of creators worldwide. This is your space to learn, collaborate, share your work, and grow together. Introduce yourself below! Tell us who you are, what you create, and what you\'re working on right now.', created_at: new Date(Date.now()-2592000000).toISOString(), reactions: { '❤️': 892, '👏': 654, '🔥': 441, '🤩': 328 } },
  { id: 'a2', title: 'New Feature: Creator Studio is Now Live ✨', content: 'We\'re thrilled to announce Creator Studio — your professional media editing suite built directly into Philomni. Edit photos with 16 professional filters, cut and color-grade videos, add text overlays, use our AI Enhance tool, and export in up to 4K quality. Access it from the sidebar → Creator Studio. We\'d love to see what you make!', created_at: new Date(Date.now()-1728000000).toISOString(), reactions: { '❤️': 534, '👏': 445, '🔥': 812, '🤩': 623 } },
  { id: 'a3', title: 'Philomni Marketplace is Open for Business 🛍️', content: 'The Philomni Marketplace is live! Buy and sell scripts, beats, digital products, courses, services, physical gear, and collab opportunities — all in one place built specifically for creators. We\'ve pre-loaded 15 sample listings to get you started. Sellers: click "Sell Something" to list your first offer. Buyers: explore and find what you need.', created_at: new Date(Date.now()-864000000).toISOString(), reactions: { '❤️': 412, '👏': 389, '🔥': 567, '🤩': 298 } },
  { id: 'a4', title: 'Community Challenge: Win Featured Placement on Philomni Homepage 🏆', content: 'Our first official community challenge is LIVE: The 30-Second Origin Story Challenge. Tell your creator story in 30 seconds or less. The top 3 entries (as voted by the community) win featured placement on the Philomni homepage for a full week, plus our exclusive Challenge Champion badge. Head to the Challenges tab to enter!', created_at: new Date(Date.now()-432000000).toISOString(), reactions: { '❤️': 678, '👏': 521, '🔥': 834, '🤩': 445 } },
  { id: 'a5', title: 'Introducing Skill Exchange — Trade Skills, Not Money 🔄', content: 'Skill Exchange is Philomni\'s barter economy. Trade your skills directly with other creators — no money needed. A video editor trades with a graphic designer. A photographer trades with a web developer. It\'s the creative economy working the way it should. Browse 12 sample offers already posted, or add your own skill offer today. Head to Skill Exchange in the sidebar.', created_at: new Date(Date.now()-86400000).toISOString(), reactions: { '❤️': 789, '👏': 612, '🔥': 445, '🤩': 334 } },
]

const BOARDS = [
  { id: 'all',      label: '🔥 Hot Today',           count: 127 },
  { id: 'pinned',   label: '📌 Pinned',               count: 3 },
  { id: 'tips',     label: '💡 Creator Tips',         count: 48 },
  { id: 'collab',   label: '🤝 Collaborations',       count: 34 },
  { id: 'tools',    label: '🛠 Tools & Tech',          count: 29 },
  { id: 'money',    label: '💰 Monetization',         count: 41 },
  { id: 'showcase', label: '🎨 Showcase Your Work',   count: 22 },
  { id: 'help',     label: '❓ Questions & Help',     count: 56 },
  { id: 'general',  label: '🗣 General Chat',         count: 73 },
  { id: 'opps',     label: '📢 Opportunities',        count: 18 },
]

const POINTS_INFO = [
  { action: 'Post in community',    pts: '+5'  },
  { action: 'Leave a comment',      pts: '+2'  },
  { action: 'Receive an upvote',    pts: '+3'  },
  { action: 'Enter a challenge',    pts: '+10' },
  { action: 'Win a challenge',      pts: '+50' },
  { action: 'Complete your profile',pts: '+20' },
  { action: 'Refer a new member',   pts: '+15' },
]

const ALL_BADGES = [
  { emoji: '🌟', name: 'Rising Star',      desc: 'Earn 500 points' },
  { emoji: '🔥', name: 'On Fire',          desc: '7-day posting streak' },
  { emoji: '💡', name: 'Thought Leader',   desc: '10 posts with 50+ upvotes' },
  { emoji: '🤝', name: 'Connector',        desc: 'Follow 50 creators' },
  { emoji: '🏆', name: 'Champion',         desc: 'Win a challenge' },
  { emoji: '👑', name: 'Creator Elite',    desc: 'Earn 10,000 points' },
  { emoji: '🎓', name: 'Knowledge Sharer', desc: '5 posts in Creator Tips' },
  { emoji: '🌍', name: 'Global Reach',     desc: 'Followers in 10+ countries' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m || 1}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `${d}d ${h}h`
  const min = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${min}m`
}

function Avatar({ name, url, size = 8 }) {
  const fontSize = size <= 6 ? 11 : size <= 9 ? 14 : 18
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden`}
      style={{ fontSize }}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name?.[0] ?? '?'}
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onOpen, onVote, voted }) {
  const board = BOARDS.find(b => b.id === post.board)
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group flex">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 px-3 py-4 bg-muted/20 border-r border-border">
        <button onClick={e => { e.stopPropagation(); onVote(post.id, 1) }}
          className={`p-1 rounded hover:bg-primary/20 transition-colors ${voted === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <ChevronUp className="w-4 h-4" />
        </button>
        <span className={`text-sm font-bold ${voted === 1 ? 'text-primary' : voted === -1 ? 'text-red-400' : 'text-foreground'}`}>
          {fmt(post.score + (voted ?? 0))}
        </span>
        <button onClick={e => { e.stopPropagation(); onVote(post.id, -1) }}
          className={`p-1 rounded hover:bg-red-500/20 transition-colors ${voted === -1 ? 'text-red-400' : 'text-muted-foreground'}`}>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 cursor-pointer min-w-0" onClick={() => onOpen(post)}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {post.is_pinned && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium"><Pin className="w-2.5 h-2.5" />Pinned</span>}
          {board && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{board.label}</span>}
          {post.tags?.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">#{t}</span>)}
        </div>
        <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Avatar name={post.author_name} url={post.author_avatar} size={5} />{post.author_name} · {timeAgo(post.created_at)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{fmt(post.comment_count)}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(post.view_count)}</span>
          <span className="flex items-center gap-1 ml-auto cursor-pointer hover:text-primary transition-colors"><Bookmark className="w-3 h-3" />Save</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"><Share2 className="w-3 h-3" />Share</span>
        </div>
      </div>
    </div>
  )
}

// ─── Post Detail Modal ────────────────────────────────────────────────────────

function PostModal({ post, onClose }) {
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([
    { id: 'cm1', author_name: 'Jordan B.', content: 'This is exactly what I needed. The niche down advice is so underrated.', score: 34, created_at: new Date(Date.now()-3600000).toISOString() },
    { id: 'cm2', author_name: 'Devon L.', content: 'Did you use any paid tools for growth analytics or was it all native platform data?', score: 12, created_at: new Date(Date.now()-7200000).toISOString() },
    { id: 'cm3', author_name: 'Priya S.', content: 'The collaboration point is key. I doubled my growth by doing IG Lives with creators 2x my size.', score: 28, created_at: new Date(Date.now()-10800000).toISOString() },
  ])
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    setComments(prev => [{ id: Date.now(), author_name: user?.full_name ?? 'You', content: comment, score: 0, created_at: new Date().toISOString() }, ...prev])
    setComment('')
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-2xl my-6 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            {BOARDS.find(b => b.id === post.board) && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {BOARDS.find(b => b.id === post.board)?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{post.title}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Avatar name={post.author_name} url={post.author_avatar} size={6} />
            <span>{post.author_name} · {timeAgo(post.created_at)}</span>
            <span className="ml-auto flex items-center gap-1"><ChevronUp className="w-3 h-3" />{fmt(post.score)} upvotes</span>
          </div>
          <div className="bg-muted/20 rounded-xl p-4">
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-3">{comments.length} Comments</p>
            <div className="flex gap-2 mb-4">
              <Avatar name={user?.full_name} url={user?.avatar_url} size={7} />
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" />
                <button onClick={submit} disabled={!comment.trim() || submitting}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author_name} url={null} size={7} />
                  <div className="flex-1 bg-muted/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground">{c.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"><ChevronUp className="w-3 h-3" />{c.score}</button>
                      <button className="text-xs text-muted-foreground hover:text-primary transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── New Post Modal ────────────────────────────────────────────────────────────

function NewPostModal({ onClose, onSubmit, saving }) {
  const [form, setForm] = useState({ title: '', content: '', board: 'general', tags: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">New Discussion</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Board</label>
            <select className={inp + ' cursor-pointer'} value={form.board} onChange={e => set('board', e.target.value)}>
              {BOARDS.filter(b => b.id !== 'all' && b.id !== 'pinned').map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Give your post a clear, specific title" required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Content</label>
            <textarea className={inp + ' resize-none'} rows={4} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Share your thoughts, tips, questions..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tags (comma-separated)</label>
            <input className={inp} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. growth, instagram, strategy" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.title.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Posting…' : 'Post Discussion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({ events, challenges }) {
  const onlineMembers = ['Sarah K.','Alex T.','Jordan B.','Priya S.','Tyler O.']
  const trending = ['#CreatorEconomy','#AfroBeats','#VideoEditing','#BrandDeals','#Thumbnails','#AITools']
  return (
    <div className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
      {/* Who's Online */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-400" />Who's Online</p>
        <div className="space-y-2">
          {onlineMembers.map(name => (
            <div key={name} className="flex items-center gap-2">
              <div className="relative"><Avatar name={name} url={null} size={6} /><div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-card" /></div>
              <span className="text-xs text-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" />Trending Today</p>
        <div className="space-y-1.5">
          {trending.map(t => (
            <button key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full">
              <Hash className="w-3 h-3" />{t.replace('#','')}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />Upcoming Events</p>
        <div className="space-y-2">
          {events.slice(0, 3).map(e => (
            <div key={e.id} className="text-xs">
              <p className="font-medium text-foreground line-clamp-1">{e.emoji} {e.title}</p>
              <p className="text-muted-foreground">{new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community Stats */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-400" />Community Stats</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'Members',    value: '28.4k' },
            { label: 'Posts',      value: '4.2k' },
            { label: 'Challenges', value: '8' },
            { label: 'Events',     value: '6' },
          ].map(s => (
            <div key={s.label} className="bg-muted/30 rounded-xl p-2">
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Community() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [tab, setTab]         = useState('discussions')
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [boardFilter, setBoardFilter] = useState('all')
  const [sortBy, setSortBy]   = useState('hot')
  const [votes, setVotes]     = useState({})
  const [activePost, setActivePost]   = useState(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [savingPost, setSavingPost]   = useState(false)
  const [joinedGroups, setJoinedGroups] = useState(new Set())
  const [rsvpd, setRsvpd]   = useState(new Set())
  const [reactionMap, setReactionMap] = useState({})
  const [leaderTab, setLeaderTab] = useState('active')

  useEffect(() => {
    supabase.from('discussion_posts')
      .select('*').order('created_at', { ascending: false }).limit(60)
      .then(({ data }) => {
        const db = data ?? []
        const dbIds = new Set(db.map(p => p.id))
        setPosts([...db, ...SAMPLE_POSTS.filter(p => !dbIds.has(p.id))])
        setLoading(false)
      })
  }, [])

  const filteredPosts = useMemo(() => {
    let list = [...posts]
    if (boardFilter === 'pinned') list = list.filter(p => p.is_pinned)
    else if (boardFilter !== 'all') list = list.filter(p => p.board === boardFilter)
    if (sortBy === 'hot')  list.sort((a, b) => (b.score + b.comment_count * 0.5) - (a.score + a.comment_count * 0.5))
    if (sortBy === 'new')  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortBy === 'top')  list.sort((a, b) => b.score - a.score)
    // Pinned always first
    return [...list.filter(p => p.is_pinned), ...list.filter(p => !p.is_pinned)]
  }, [posts, boardFilter, sortBy])

  const handleVote = useCallback((id, dir) => {
    setVotes(v => ({ ...v, [id]: v[id] === dir ? 0 : dir }))
  }, [])

  const handleNewPost = useCallback(async (form) => {
    setSavingPost(true)
    try {
      const { data } = await supabase.from('discussion_posts').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        board: form.board,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        author_id: user?.id,
        author_name: user?.full_name ?? 'Creator',
        author_avatar: user?.avatar_url ?? null,
        score: 0, comment_count: 0, view_count: 0,
      }).select().single()
      if (data) setPosts(prev => [data, ...prev])
      setShowNewPost(false)
    } catch (e) { console.error(e) }
    setSavingPost(false)
  }, [user])

  const TABS = [
    { id: 'discussions',   label: '💬 Discussions' },
    { id: 'groups',        label: '👥 Groups' },
    { id: 'challenges',    label: '🎯 Challenges' },
    { id: 'events',        label: '📅 Events' },
    { id: 'leaderboard',  label: '🏆 Leaderboard' },
    { id: 'announcements', label: '📣 Announcements' },
  ]

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Community
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Connect · Collaborate · Learn · Grow</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ DISCUSSIONS ════════════════════════════════════════════════════ */}
      {tab === 'discussions' && (
        <div className="flex gap-5">
          {/* Left sidebar */}
          <div className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
            <button onClick={() => setShowNewPost(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Post
            </button>
            {BOARDS.map(b => (
              <button key={b.id} onClick={() => setBoardFilter(b.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${boardFilter === b.id ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <span className="truncate">{b.label}</span>
                <span className="text-xs opacity-60 flex-shrink-0 ml-2">{b.count}</span>
              </button>
            ))}
          </div>

          {/* Main feed */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Mobile: new post + sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowNewPost(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New Post
              </button>
              <div className="flex gap-1 ml-auto bg-muted rounded-xl p-1">
                {['hot','new','top'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${sortBy === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    {s === 'hot' ? '🔥' : s === 'new' ? '🆕' : '⭐'} {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted/40 rounded-2xl animate-pulse" />)
            ) : (
              filteredPosts.map(p => (
                <PostCard key={p.id} post={p} onOpen={setActivePost} onVote={handleVote} voted={votes[p.id] ?? 0} />
              ))
            )}
          </div>

          <RightSidebar events={SAMPLE_EVENTS} challenges={SAMPLE_CHALLENGES} />
        </div>
      )}

      {/* ══ GROUPS ═════════════════════════════════════════════════════════ */}
      {tab === 'groups' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Find groups..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>

          {/* Featured */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3">⭐ Featured Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SAMPLE_GROUPS.filter(g => g.is_featured).map(g => (
                <div key={g.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-24 bg-gradient-to-br ${g.cover_color} flex items-center justify-center text-4xl`}>{g.emoji}</div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmt(g.member_count)} members</p>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{g.description}</p>
                    <p className="text-xs text-emerald-400 mt-1">+{g.joined_this_week} joined this week</p>
                    <button onClick={() => setJoinedGroups(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n })}
                      className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors ${joinedGroups.has(g.id) ? 'bg-muted text-muted-foreground' : 'bg-primary text-white hover:bg-primary/90'}`}>
                      {joinedGroups.has(g.id) ? 'Joined ✓' : 'Join Group'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All groups */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3">All Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SAMPLE_GROUPS.map(g => (
                <div key={g.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-20 bg-gradient-to-br ${g.cover_color} flex items-center justify-center text-3xl`}>{g.emoji}</div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(g.member_count)} members</p>
                    <button onClick={() => setJoinedGroups(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n })}
                      className={`w-full mt-2 py-1.5 rounded-xl text-xs font-semibold transition-colors ${joinedGroups.has(g.id) ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                      {joinedGroups.has(g.id) ? 'Joined ✓' : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CHALLENGES ══════════════════════════════════════════════════════ */}
      {tab === 'challenges' && (
        <div className="space-y-6">
          {/* Active */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4">🔥 Active Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_CHALLENGES.filter(c => c.status === 'active').map(c => (
                <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-28 bg-gradient-to-br ${c.cover_color} flex items-center justify-center text-5xl relative`}>
                    {c.emoji}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur text-white text-xs rounded-full font-medium">
                      {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                    </span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="bg-muted/30 rounded-xl p-2.5">
                      <p className="text-xs text-muted-foreground">🎁 Prize</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{c.prize}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" />⏰ {timeUntil(c.ends_at)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.entry_count} entries</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">Enter Challenge</button>
                      <button className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">See Entries</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4">🏁 Past Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_CHALLENGES.filter(c => c.status === 'ended').map(c => (
                <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden opacity-80">
                  <div className={`h-20 bg-gradient-to-br ${c.cover_color} flex items-center justify-center text-4xl relative`}>
                    {c.emoji}
                    <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold">ENDED</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.entry_count} entries · <span className="text-amber-400">🏆 Winner: {c.winner}</span></p>
                    <button className="w-full mt-2 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">See Entries</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ EVENTS ══════════════════════════════════════════════════════════ */}
      {tab === 'events' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Upcoming Events</h2>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Event
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_EVENTS.map(e => {
              const isRsvpd = rsvpd.has(e.id)
              return (
                <div key={e.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-32 bg-gradient-to-br ${e.cover_color} flex items-center justify-center text-5xl relative`}>
                    {e.emoji}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="px-2 py-0.5 bg-black/40 backdrop-blur text-white text-xs rounded-full font-medium capitalize">{e.type}</span>
                      {e.is_free
                        ? <span className="px-2 py-0.5 bg-emerald-500/80 text-white text-xs rounded-full font-medium">Free</span>
                        : <span className="px-2 py-0.5 bg-amber-500/80 text-white text-xs rounded-full font-medium">${e.price}</span>
                      }
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{e.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400" />{new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3" />{e.location}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar name={e.host_name} url={null} size={5} />
                      <span>{e.host_name} · {fmt(e.attendee_count)} attending</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setRsvpd(prev => { const n = new Set(prev); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${isRsvpd ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary text-white hover:bg-primary/90'}`}>
                        {isRsvpd ? '✓ RSVP\'d' : 'RSVP'}
                      </button>
                      <button className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                        + Cal
                      </button>
                      <button className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ LEADERBOARD ═════════════════════════════════════════════════════ */}
      {tab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Rankings */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
              {[
                { id: 'active',   label: 'Most Active' },
                { id: 'helpful',  label: 'Most Helpful' },
                { id: 'content',  label: 'Best Content' },
                { id: 'champion', label: 'Champions' },
              ].map(t => (
                <button key={t.id} onClick={() => setLeaderTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${leaderTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {SAMPLE_LEADERBOARD.map((creator, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${i < 3 ? 'bg-primary/5' : ''}`}>
                  <div className="w-7 text-center flex-shrink-0">
                    {creator.badge
                      ? <span className="text-lg">{creator.badge}</span>
                      : <span className="text-sm font-bold text-muted-foreground">{creator.rank}</span>
                    }
                  </div>
                  <Avatar name={creator.name} url={creator.avatar} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{creator.role}</p>
                    <div className="flex gap-1 mt-0.5">
                      {creator.badges.map(b => <span key={b} className="text-xs">{b}</span>)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{fmt(creator.points)}</p>
                    <p className={`text-xs flex items-center gap-0.5 justify-end ${creator.change > 0 ? 'text-emerald-400' : creator.change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {creator.change > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : creator.change < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : '—'}
                      {Math.abs(creator.change)}
                    </p>
                  </div>
                  <button className="ml-2 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex-shrink-0">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Points system */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />How You Earn Points</p>
              <div className="space-y-2">
                {POINTS_INFO.map(p => (
                  <div key={p.action} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{p.action}</span>
                    <span className="font-bold text-emerald-400">{p.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-violet-400" />Badges to Earn</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_BADGES.map(b => (
                  <div key={b.name} className="bg-muted/30 rounded-xl p-2.5 text-center hover:bg-primary/10 transition-colors cursor-pointer group">
                    <p className="text-xl mb-1">{b.emoji}</p>
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ANNOUNCEMENTS ═══════════════════════════════════════════════════ */}
      {tab === 'announcements' && (
        <div className="space-y-4 max-w-2xl">
          {SAMPLE_ANNOUNCEMENTS.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Philomni Team</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                </div>
                <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Official</span>
              </div>

              <h3 className="text-base font-bold text-foreground">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>

              {/* Reactions */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {Object.entries(a.reactions).map(([emoji, count]) => {
                  const key = `${a.id}-${emoji}`
                  const reacted = reactionMap[key]
                  return (
                    <button key={emoji}
                      onClick={() => setReactionMap(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${reacted ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {emoji} <span>{count + (reacted ? 1 : 0)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Comments */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Add a comment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {activePost && <PostModal post={activePost} onClose={() => setActivePost(null)} />}
      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} saving={savingPost} />}
    </div>
  )
}
