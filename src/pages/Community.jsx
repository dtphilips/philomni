import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  MessageSquare, Users, Target, Calendar, Trophy, Megaphone,
  Plus, X, Search, ChevronUp, ChevronDown, ArrowUp, ArrowDown,
  Heart, Bookmark, Share2, Flag, Pin, Clock, MapPin, Globe,
  Star, Check, Loader2, Send, Eye, ThumbsUp, ThumbsDown, Award, Zap,
  Bell, TrendingUp, Hash, UserPlus, ChevronRight, HelpCircle,
  Lock, Unlock, Gift, DollarSign, Link, ExternalLink, Mail,
} from 'lucide-react'
import {
  getUserCountry, getPaymentProvider,
  loadPaystackScript, openPaystackPopup,
  loadFlutterwaveScript, openFlutterwaveCheckout,
  createPaymentIntent, recordPayment, PAYMENT_CONFIG,
} from '../lib/payments'
import { QRCodeSVG } from 'qrcode.react'

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

const PRO_SAMPLE_POSTS = [
  { id: 'pp1', board: 'bizdev', title: 'How I closed a $500K B2B deal in 3 months — full breakdown', author_name: 'Marcus D.', author_avatar: null, score: 612, comment_count: 87, view_count: 9400, created_at: new Date(Date.now()-3600000).toISOString(), is_pinned: true, tags: ['b2b', 'sales', 'deals'], content: 'Step 1: Identify pain, not features. Step 2: Multi-thread the account. Step 3: Build a business case with their numbers. Full breakdown below...' },
  { id: 'pp2', board: 'career', title: 'The hiring mistake every startup makes (and how to avoid it)', author_name: 'Aisha P.', author_avatar: null, score: 445, comment_count: 62, view_count: 7800, created_at: new Date(Date.now()-7200000).toISOString(), is_pinned: false, tags: ['hiring', 'startup', 'hr'], content: 'Hiring for skills instead of systems. Here is what I mean...' },
  { id: 'pp3', board: 'insights', title: 'AI is changing our industry faster than we think — here\'s what I\'m doing', author_name: 'Dr. Sarah C.', author_avatar: null, score: 789, comment_count: 134, view_count: 14200, created_at: new Date(Date.now()-14400000).toISOString(), is_pinned: false, tags: ['ai', 'future', 'strategy'], content: 'Three structural changes I am making to my business in 2026 because of AI...' },
  { id: 'pp4', board: 'career', title: 'My CISSP journey: 6 months of study, worth every hour', author_name: 'Tariq R.', author_avatar: null, score: 534, comment_count: 98, view_count: 8100, created_at: new Date(Date.now()-86400000).toISOString(), is_pinned: false, tags: ['cissp', 'cybersecurity', 'certification'], content: 'Study plan, resources, what actually showed up on the exam, and my single biggest tip...' },
  { id: 'pp5', board: 'career', title: 'How to negotiate your salary in 2026 — data from 500 responses', author_name: 'Priya N.', author_avatar: null, score: 892, comment_count: 203, view_count: 18700, created_at: new Date(Date.now()-172800000).toISOString(), is_pinned: false, tags: ['salary', 'negotiation', 'career'], content: 'Survey results plus the script that added $24k to my last offer...' },
  { id: 'pp6', board: 'strategy', title: 'We raised our Series A — here\'s what investors actually wanted to see', author_name: 'Simone O.', author_avatar: null, score: 1240, comment_count: 267, view_count: 22000, created_at: new Date(Date.now()-259200000).toISOString(), is_pinned: false, tags: ['fundraising', 'seriesa', 'startup'], content: 'The 3 things that mattered: defensible distribution, clear unit economics, and a founder story...' },
  { id: 'pp7', board: 'finance', title: 'The real cost of raising venture capital that no one talks about', author_name: 'James L.', author_avatar: null, score: 678, comment_count: 112, view_count: 11400, created_at: new Date(Date.now()-345600000).toISOString(), is_pinned: false, tags: ['vc', 'finance', 'dilution'], content: 'Dilution, board dynamics, and the pressure to grow at all costs. Is it always the right path?' },
  { id: 'pp8', board: 'opps', title: '🔥 RFP: Enterprise cybersecurity audit — $200K budget, Q3 start', author_name: 'Tech Corp Procurement', author_avatar: null, score: 234, comment_count: 45, view_count: 5600, created_at: new Date(Date.now()-432000000).toISOString(), is_pinned: false, tags: ['rfp', 'cybersecurity', 'contract'], content: 'Looking for a firm to conduct a full enterprise security audit. ISO 27001 experience required. Respond with credentials and rate card.' },
  { id: 'pp9', board: 'insights', title: 'Product-led growth is not a strategy — it is an outcome', author_name: 'Kwame A.', author_avatar: null, score: 445, comment_count: 78, view_count: 8900, created_at: new Date(Date.now()-518400000).toISOString(), is_pinned: false, tags: ['plg', 'product', 'growth'], content: 'Everyone says they want PLG. Very few understand what it actually requires at the org level...' },
  { id: 'pp10', board: 'bizdev', title: 'Cold outreach that actually works in 2026 — tested on 10,000 sends', author_name: 'Emma L.', author_avatar: null, score: 567, comment_count: 89, view_count: 10200, created_at: new Date(Date.now()-604800000).toISOString(), is_pinned: false, tags: ['outreach', 'sales', 'email'], content: 'Open rate 34%, reply rate 12%. Here is the exact framework...' },
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

const PRO_SAMPLE_LEADERBOARD = [
  { rank: 1,  name: 'Adaeze N.',    avatar: null, role: 'Cybersecurity Expert',    points: 5120, change: 18,  badge: '🥇', badges: ['🔒','💡','🏆'] },
  { rank: 2,  name: 'Marcus D.',    avatar: null, role: 'B2B Sales Leader',        points: 4780, change: 9,   badge: '🥈', badges: ['🤝','⭐'] },
  { rank: 3,  name: 'Simone O.',    avatar: null, role: 'Founder & CEO',           points: 4340, change: -3,  badge: '🥉', badges: ['🚀','💡'] },
  { rank: 4,  name: 'Priya N.',     avatar: null, role: 'Talent Acquisition Lead', points: 3910, change: 12,  badge: '',   badges: ['🤝'] },
  { rank: 5,  name: 'James L.',     avatar: null, role: 'Investment Analyst',      points: 3640, change: 4,   badge: '',   badges: ['💰','📊'] },
  { rank: 6,  name: 'Dr. Sarah C.', avatar: null, role: 'Cloud Architect',         points: 3290, change: -2,  badge: '',   badges: ['🔒'] },
  { rank: 7,  name: 'Kwame A.',     avatar: null, role: 'Product Manager',         points: 3010, change: 27,  badge: '',   badges: ['📋','⭐'] },
  { rank: 8,  name: 'Tariq R.',     avatar: null, role: 'CISO',                    points: 2780, change: 6,   badge: '',   badges: ['🔒','🏆'] },
  { rank: 9,  name: 'Emma L.',      avatar: null, role: 'Growth Marketing Lead',   points: 2540, change: -1,  badge: '',   badges: ['📊'] },
  { rank: 10, name: 'Yemi A.',      avatar: null, role: 'Product Manager',         points: 2280, change: 14,  badge: '',   badges: [] },
]

const SAMPLE_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Welcome to the Philomni Community! 🎉', content: 'We\'ve officially launched the Philomni Community Hub — your home base for connecting with thousands of creators worldwide. This is your space to learn, collaborate, share your work, and grow together. Introduce yourself below! Tell us who you are, what you create, and what you\'re working on right now.', created_at: new Date(Date.now()-2592000000).toISOString(), reactions: { '❤️': 892, '👏': 654, '🔥': 441, '🤩': 328 } },
  { id: 'a2', title: 'New Feature: Creator Studio is Now Live ✨', content: 'We\'re thrilled to announce Creator Studio — your professional media editing suite built directly into Philomni. Edit photos with 16 professional filters, cut and color-grade videos, add text overlays, use our AI Enhance tool, and export in up to 4K quality. Access it from the sidebar → Creator Studio. We\'d love to see what you make!', created_at: new Date(Date.now()-1728000000).toISOString(), reactions: { '❤️': 534, '👏': 445, '🔥': 812, '🤩': 623 } },
  { id: 'a3', title: 'Philomni Marketplace is Open for Business 🛍️', content: 'The Philomni Marketplace is live! Buy and sell scripts, beats, digital products, courses, services, physical gear, and collab opportunities — all in one place built specifically for creators. We\'ve pre-loaded 15 sample listings to get you started. Sellers: click "Sell Something" to list your first offer. Buyers: explore and find what you need.', created_at: new Date(Date.now()-864000000).toISOString(), reactions: { '❤️': 412, '👏': 389, '🔥': 567, '🤩': 298 } },
  { id: 'a4', title: 'Community Challenge: Win Featured Placement on Philomni Homepage 🏆', content: 'Our first official community challenge is LIVE: The 30-Second Origin Story Challenge. Tell your creator story in 30 seconds or less. The top 3 entries (as voted by the community) win featured placement on the Philomni homepage for a full week, plus our exclusive Challenge Champion badge. Head to the Challenges tab to enter!', created_at: new Date(Date.now()-432000000).toISOString(), reactions: { '❤️': 678, '👏': 521, '🔥': 834, '🤩': 445 } },
  { id: 'a5', title: 'Introducing Skill Exchange — Trade Skills, Not Money 🔄', content: 'Skill Exchange is Philomni\'s barter economy. Trade your skills directly with other creators — no money needed. A video editor trades with a graphic designer. A photographer trades with a web developer. It\'s the creative economy working the way it should. Browse 12 sample offers already posted, or add your own skill offer today. Head to Skill Exchange in the sidebar.', created_at: new Date(Date.now()-86400000).toISOString(), reactions: { '❤️': 789, '👏': 612, '🔥': 445, '🤩': 334 } },
]

const PRO_SAMPLE_ANNOUNCEMENTS = [
  { id: 'pa1', title: 'Welcome to the Philomni Professional Network! 💼', content: 'The Professional Community is now live — your home for networking with executives, founders, engineers, and industry experts. Join groups, ask career questions, share insights, and connect with 20,000+ professionals. Introduce yourself in the General Discussion board!', created_at: new Date(Date.now()-2592000000).toISOString(), reactions: { '❤️': 678, '👏': 534, '🔥': 312, '🤩': 245 } },
  { id: 'pa2', title: 'New: Company Pages Are Live ✨', content: 'Companies can now claim their Philomni Company Page to post jobs, share updates, showcase their culture, and connect with talent. Over 500 companies have already joined. If you represent a company, head to Companies → Create Company Page to get started.', created_at: new Date(Date.now()-1728000000).toISOString(), reactions: { '❤️': 445, '👏': 378, '🔥': 623, '🤩': 512 } },
  { id: 'pa3', title: 'Learning Hub Pro: 200+ Professional Courses Added 🎓', content: 'The Philomni Learning Hub now includes 200+ professional development courses — covering Cybersecurity (CISSP, CEH), Data Science, Product Management, Leadership, Finance, and more. Several courses are free. Check the Learning Hub under Pro mode.', created_at: new Date(Date.now()-864000000).toISOString(), reactions: { '❤️': 534, '👏': 412, '🔥': 289, '🤩': 198 } },
  { id: 'pa4', title: 'Consulting Exchange: Trade Expertise Directly 🔄', content: 'The Consulting Exchange is Philomni\'s peer expertise network. Trade professional skills directly — a CFO helps a startup with financial modeling; in exchange, the startup\'s CTO reviews their security posture. No hourly rates, no invoices. Pure value exchange. Explore it in the sidebar.', created_at: new Date(Date.now()-432000000).toISOString(), reactions: { '❤️': 678, '👏': 512, '🔥': 334, '🤩': 267 } },
]

const BOARDS = [
  { id: 'all',      label: '🔥 Hot Today'         },
  { id: 'pinned',   label: '📌 Pinned'             },
  { id: 'qna',      label: '❓ Q&A'                },
  { id: 'tips',     label: '💡 Creator Tips'       },
  { id: 'collab',   label: '🤝 Collaborations'     },
  { id: 'tools',    label: '🛠 Tools & Tech'        },
  { id: 'money',    label: '💰 Monetization'       },
  { id: 'showcase', label: '🎨 Showcase Your Work' },
  { id: 'help',     label: '❓ Questions & Help'   },
  { id: 'general',  label: '🗣 General Chat'       },
  { id: 'opps',     label: '📢 Opportunities'      },
]

const PRO_BOARDS = [
  { id: 'all',      label: '🔥 Hot Today'              },
  { id: 'pinned',   label: '📌 Pinned'                  },
  { id: 'insights', label: '💡 Industry Insights'       },
  { id: 'bizdev',   label: '🤝 Business Development'    },
  { id: 'tools',    label: '🛠 Tools & Productivity'    },
  { id: 'finance',  label: '💰 Finance & Investment'    },
  { id: 'strategy', label: '🎯 Strategy & Growth'       },
  { id: 'career',   label: '❓ Career Advice'           },
  { id: 'exec',     label: '🗣 Executive Lounge'        },
  { id: 'opps',     label: '📢 Opportunities & RFPs'    },
  { id: 'africa',   label: '🌍 African Business'        },
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
  const board = [...BOARDS, ...PRO_BOARDS].find(b => b.id === post.board)
  const isQnA = post.board === 'qna'
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group flex">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1.5 px-3 py-4 bg-muted/20 border-r border-border min-w-[52px]">
        <button onClick={e => { e.stopPropagation(); onVote(post.id, 1) }}
          className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all ${voted === 1 ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
          <ThumbsUp className="w-4 h-4" />
          <span className="text-[10px] font-bold leading-none">Upvote</span>
        </button>
        <span className={`text-sm font-bold leading-none ${voted === 1 ? 'text-primary' : voted === -1 ? 'text-red-400' : 'text-foreground'}`}>
          {fmt(post.score + (voted ?? 0))}
        </span>
        <button onClick={e => { e.stopPropagation(); onVote(post.id, -1) }}
          className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all ${voted === -1 ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-400'}`}>
          <ThumbsDown className="w-4 h-4" />
          <span className="text-[10px] font-bold leading-none">Down</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 cursor-pointer min-w-0" onClick={() => onOpen(post)}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {post.is_pinned && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium"><Pin className="w-2.5 h-2.5" />Pinned</span>}
          {isQnA && <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full font-medium"><HelpCircle className="w-2.5 h-2.5" />Question</span>}
          {board && !isQnA && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{board.label}</span>}
          {post.tags?.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">#{t}</span>)}
        </div>
        <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Avatar name={post.author_name} url={post.author_avatar} size={5} />{post.author_name} · {timeAgo(post.created_at)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{fmt(post.comment_count)} {isQnA ? 'answers' : ''}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(post.view_count)}</span>
          <span className="flex items-center gap-1 ml-auto cursor-pointer hover:text-primary transition-colors"><Bookmark className="w-3 h-3" />Save</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"><Share2 className="w-3 h-3" />Share</span>
        </div>
      </div>
    </div>
  )
}

// ─── Post Detail Modal ────────────────────────────────────────────────────────

const SAMPLE_POST_COMMENTS = [
  { id: 'cm1', author_name: 'Jordan B.', content: 'This is exactly what I needed. The niche down advice is so underrated.', score: 34, created_at: new Date(Date.now()-3600000).toISOString() },
  { id: 'cm2', author_name: 'Devon L.', content: 'Did you use any paid tools for growth analytics or was it all native platform data?', score: 12, created_at: new Date(Date.now()-7200000).toISOString() },
  { id: 'cm3', author_name: 'Priya S.', content: 'The collaboration point is key. I doubled my growth by doing IG Lives with creators 2x my size.', score: 28, created_at: new Date(Date.now()-10800000).toISOString() },
]

function PostModal({ post, onClose }) {
  const { user } = useAuth()
  const isQnA = post.board === 'qna'
  const isRealPost = typeof post.id === 'string' && post.id.length > 10 && post.id.includes('-')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(isRealPost ? [] : SAMPLE_POST_COMMENTS)
  const [loadingComments, setLoadingComments] = useState(isRealPost)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isRealPost) return
    supabase.from('discussion_replies').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments(data ?? [])
        setLoadingComments(false)
      })
  }, [post.id, isRealPost])

  const submit = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    if (isRealPost && user?.id) {
      const { data } = await supabase.from('discussion_replies').insert({
        post_id: post.id,
        content: comment.trim(),
        author_id: user.id,
        author_name: user.user_metadata?.full_name ?? user.email ?? 'Creator',
        author_avatar: user.user_metadata?.avatar_url ?? null,
        created_by: user.id,
      }).select().single()
      if (data) setComments(prev => [...prev, data])
      await supabase.from('discussion_posts').update({ reply_count: (post.reply_count ?? 0) + 1 }).eq('id', post.id)
    } else {
      setComments(prev => [...prev, { id: Date.now(), author_name: user?.full_name ?? 'You', content: comment.trim(), score: 0, created_at: new Date().toISOString() }])
    }
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
            <span className="ml-auto flex items-center gap-1 text-primary"><ThumbsUp className="w-3 h-3" />{fmt(post.score)} upvotes</span>
          </div>
          <div className="bg-muted/20 rounded-xl p-4">
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              {loadingComments ? 'Loading…' : `${comments.length} ${isQnA ? 'Answer' : 'Comment'}${comments.length !== 1 ? 's' : ''}`}
            </p>
            {isQnA && (
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Quora-style: best answers rise to the top based on upvotes</span>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <Avatar name={user?.full_name} url={user?.avatar_url} size={7} />
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder={isQnA ? 'Write your answer…' : 'Add a comment…'}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" />
                <button onClick={submit} disabled={!comment.trim() || submitting}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isQnA && !submitting && <span className="text-xs font-semibold">Answer</span>}
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
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"><ThumbsUp className="w-3 h-3" />{c.score ?? 0} helpful</button>
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

function NewPostModal({ onClose, onSubmit, saving, boards }) {
  const boardList = boards || BOARDS
  const [form, setForm] = useState({ title: '', content: '', board: boardList.find(b => b.id !== 'all' && b.id !== 'pinned')?.id ?? 'general', tags: '', postType: 'discussion' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const isQnA = form.board === 'qna' || form.postType === 'question'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">{isQnA ? 'Ask a Question' : 'New Discussion'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Post type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => set('postType', 'discussion')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all ${form.postType !== 'question' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              <MessageSquare className="w-3.5 h-3.5" /> Discussion
            </button>
            <button
              onClick={() => { set('postType', 'question'); set('board', 'qna') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all ${form.postType === 'question' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              <HelpCircle className="w-3.5 h-3.5" /> Question (Q&A)
            </button>
          </div>
          {isQnA && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
              Questions get community answers. Best answers rise by upvotes — Quora style.
            </p>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Board</label>
            <select className={inp + ' cursor-pointer'} value={form.board} onChange={e => set('board', e.target.value)}>
              {boardList.filter(b => b.id !== 'all' && b.id !== 'pinned').map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{isQnA ? 'Your question *' : 'Title *'}</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)}
              placeholder={isQnA ? 'e.g. What\'s the best way to grow on YouTube in 2026?' : 'Give your post a clear, specific title'} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{isQnA ? 'More context (optional)' : 'Content'}</label>
            <textarea className={inp + ' resize-none'} rows={4} value={form.content} onChange={e => set('content', e.target.value)}
              placeholder={isQnA ? 'Add details to help people give better answers…' : 'Share your thoughts, tips, questions…'} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tags (comma-separated)</label>
            <input className={inp} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. growth, instagram, strategy" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.title.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isQnA ? <HelpCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {saving ? 'Posting…' : isQnA ? 'Ask Question' : 'Post Discussion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({ events, challenges, posts, communityMode }) {
  const trending = communityMode === 'pro'
    ? ['BusinessStrategy','Leadership','Cybersecurity','AfricanBusiness','StartupLife','FinTech']
    : ['CreatorEconomy','AfroBeats','VideoEditing','BrandDeals','Thumbnails','AITools']
  const stats = [
    { label: 'Challenges', value: challenges.length || '—' },
    { label: 'Events',     value: events.length || '—' },
    { label: 'Posts',      value: posts.length || '—' },
    { label: 'Active',     value: challenges.filter(c => c.status === 'active').length || '—' },
  ]
  return (
    <div className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" />Trending Topics</p>
        <div className="space-y-1.5">
          {trending.map(t => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="w-3 h-3 flex-shrink-0" />{t}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />Upcoming Events</p>
        <div className="space-y-2">
          {events.length === 0
            ? <p className="text-xs text-muted-foreground">No upcoming events</p>
            : events.slice(0, 3).map(e => (
              <div key={e.id} className="text-xs">
                <p className="font-medium text-foreground line-clamp-1">{e.title}</p>
                <p className="text-muted-foreground">{new Date(e.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Active Challenges */}
      {challenges.filter(c => c.status === 'active').length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-amber-400" />Active Challenges</p>
          <div className="space-y-2">
            {challenges.filter(c => c.status === 'active').slice(0, 3).map(c => (
              <div key={c.id} className="text-xs">
                <p className="font-medium text-foreground line-clamp-1">{c.title}</p>
                {c.prize && <p className="text-amber-400 mt-0.5 line-clamp-1">🏆 {c.prize}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Stats */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-400" />Community Stats</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          {stats.map(s => (
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

// ─── CAT_META for group emoji/colors ─────────────────────────────────────────

const CAT_META = {
  video:    { emoji: '🎬', color: 'from-violet-600 to-blue-600' },
  audio:    { emoji: '🎙', color: 'from-indigo-600 to-blue-600' },
  photo:    { emoji: '📸', color: 'from-blue-600 to-cyan-600' },
  writing:  { emoji: '✍️', color: 'from-purple-600 to-violet-600' },
  music:    { emoji: '🎵', color: 'from-pink-600 to-rose-600' },
  business: { emoji: '💼', color: 'from-amber-600 to-orange-600' },
  social:   { emoji: '📱', color: 'from-rose-600 to-pink-600' },
  tech:     { emoji: '🤖', color: 'from-teal-600 to-emerald-600' },
  design:   { emoji: '🎨', color: 'from-orange-600 to-red-600' },
  regional: { emoji: '🌍', color: 'from-emerald-600 to-teal-600' },
  general:  { emoji: '👥', color: 'from-primary to-primary/60' },
}

// Predefined prizes — admin picks one (or more) when creating a challenge
const PRIZE_OPTIONS = [
  { id: 'cash_50',    label: '$50 Cash',             emoji: '💵', desc: 'Paid directly to your Philomni wallet', grand: true },
  { id: 'featured',  label: 'Homepage Spotlight',    emoji: '⭐', desc: 'Featured on Philomni homepage for 1 week' },
  { id: 'pro_month', label: '1 Month Pro Max Free',  emoji: '💎', desc: 'Full Pro Max subscription — free for 30 days' },
  { id: 'coins_500', label: '500 Philomni Coins',    emoji: '🪙', desc: 'Coins added directly to your wallet' },
  { id: 'badge',     label: 'Challenge Badge',        emoji: '🏅', desc: 'Exclusive winner badge on your creator profile' },
]

const CHALLENGE_TYPE_META = {
  video:   { emoji: '🎬', color: 'from-violet-600 to-purple-700' },
  photo:   { emoji: '📸', color: 'from-amber-500 to-orange-600' },
  music:   { emoji: '🎵', color: 'from-pink-600 to-rose-700' },
  writing: { emoji: '✍️', color: 'from-indigo-600 to-blue-700' },
  design:  { emoji: '🎨', color: 'from-purple-600 to-violet-700' },
  general: { emoji: '⭐', color: 'from-emerald-600 to-teal-700' },
}

const GROUP_CATEGORIES = [
  { id: 'video', label: 'Video Creators' }, { id: 'audio', label: 'Audio & Podcasts' },
  { id: 'photo', label: 'Photography' },    { id: 'writing', label: 'Writing & Blogging' },
  { id: 'music', label: 'Music & Production' }, { id: 'business', label: 'Business & Brand Deals' },
  { id: 'social', label: 'Social Media' },  { id: 'tech', label: 'Tech & AI' },
  { id: 'design', label: 'Design & Art' },  { id: 'regional', label: 'Regional / Cultural' },
  { id: 'general', label: 'General' },
]

const CHALLENGE_TYPES = [
  { id: 'video', label: '🎬 Video' }, { id: 'photo', label: '📸 Photo' },
  { id: 'music', label: '🎵 Music / Audio' }, { id: 'writing', label: '✍️ Writing' },
  { id: 'design', label: '🎨 Design' }, { id: 'general', label: '⭐ General' },
]

const EVENT_TYPES = [
  { id: 'webinar',    label: '🎙 Webinar',      physical: false },
  { id: 'workshop',   label: '🛠 Workshop',      physical: false },
  { id: 'masterclass',label: '🎓 Masterclass',   physical: false },
  { id: 'networking', label: '🤝 Networking',    physical: false },
  { id: 'showcase',   label: '🎤 Showcase',      physical: false },
  { id: 'conference', label: '🏛 Conference',    physical: false },
  { id: 'in-person',  label: '📍 In-Person',     physical: true  },
]

// ─── Create Group Modal ───────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const [form, setForm] = useState({ name: '', description: '', category: 'general', is_private: false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Create a Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Group Name *</label>
            <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lagos Video Creators" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this group about? Who should join?" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
            <select className={inp + ' cursor-pointer'} value={form.category} onChange={e => set('category', e.target.value)}>
              {GROUP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => set('is_private', !form.is_private)}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_private ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-foreground flex items-center gap-1.5">
              {form.is_private ? <><Lock className="w-3.5 h-3.5" />Private — invite only</> : <><Unlock className="w-3.5 h-3.5" />Public — anyone can join</>}
            </span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Challenge Modal ───────────────────────────────────────────────────

function CreateChallengeModal({ onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const defaultEnd = new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10)
  const [form, setForm] = useState({ title: '', description: '', type: 'video', prizes: ['cash_50'], hashtag: '', rules: '', ends_at: defaultEnd })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const togglePrize = (id) => setForm(f => ({
    ...f,
    prizes: f.prizes.includes(id) ? f.prizes.filter(p => p !== id) : [...f.prizes, id]
  }))
  const autoHashtag = form.title
    ? '#' + form.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('')
    : ''
  const prizeLabel = PRIZE_OPTIONS.filter(p => form.prizes.includes(p.id)).map(p => `${p.emoji} ${p.label}`).join(' + ') || ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">🎯 Create a Challenge</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Challenge Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 30-Second Origin Story" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select className={inp + ' cursor-pointer'} value={form.type} onChange={e => set('type', e.target.value)}>
                {CHALLENGE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ends On *</label>
              <input type="date" className={inp} value={form.ends_at} onChange={e => set('ends_at', e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">What participants must do *</label>
            <textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Record a 30-second video telling your creator origin story and post it with the hashtag." />
          </div>

          {/* Prize picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" /> Prize Package * <span className="text-primary">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRIZE_OPTIONS.map(p => {
                const selected = form.prizes.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePrize(p.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selected ? 'border-amber-400 bg-amber-500/10' : 'border-border bg-muted/20 hover:border-amber-400/50'}`}>
                    <span className="text-xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{p.label}</span>
                        {p.grand && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">GRAND PRIZE</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-amber-400 bg-amber-400' : 'border-border'}`}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
            {form.prizes.length === 0 && <p className="text-xs text-red-400 mt-1">Select at least one prize.</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Hashtag</label>
            <input className={inp} value={form.hashtag} onChange={e => set('hashtag', e.target.value)} placeholder={autoHashtag || '#YourChallengeTag'} />
            {autoHashtag && !form.hashtag && <p className="text-xs text-primary mt-1">Will use: {autoHashtag}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Rules (optional)</label>
            <textarea className={inp + ' resize-none'} rows={2} value={form.rules} onChange={e => set('rules', e.target.value)} placeholder="e.g. Original content only. Max 60 seconds. Must use the hashtag. One entry per person." />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit({ ...form, prize: prizeLabel, hashtag: form.hashtag || autoHashtag })}
              disabled={!form.title.trim() || !form.description.trim() || form.prizes.length === 0 || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {saving ? 'Launching…' : 'Launch Challenge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Creator Challenge Modal ──────────────────────────────────────────

function CreateCreatorChallengeModal({ onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const defaultEnd = new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10)
  const [form, setForm] = useState({
    title: '', description: '', type: 'video',
    custom_prize: '', hashtag: '', rules: '', ends_at: defaultEnd,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const autoHashtag = form.title
    ? '#' + form.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('')
    : ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">👤 Creator Challenge</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Challenge your followers — you set the prize</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You're creating a challenge for <strong className="text-foreground">your own community</strong>. You decide the prize — it could be a shoutout, a 1:1 session, cash you arrange yourself, or anything you choose. You are responsible for delivering it.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Challenge Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Best Short-Form Video This Week" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select className={inp + ' cursor-pointer'} value={form.type} onChange={e => set('type', e.target.value)}>
                {CHALLENGE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ends On *</label>
              <input type="date" className={inp} value={form.ends_at} onChange={e => set('ends_at', e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">What participants must do *</label>
            <textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Post a 60-second tutorial on any topic and tag me — I'll pick the most helpful one." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" /> Your Prize *
            </label>
            <input className={inp} value={form.custom_prize} onChange={e => set('custom_prize', e.target.value)} placeholder="e.g. Free 30-min 1:1 coaching call with me" />
            <p className="text-xs text-muted-foreground mt-1">Be specific — your followers are trusting you to deliver this.</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Hashtag</label>
            <input className={inp} value={form.hashtag} onChange={e => set('hashtag', e.target.value)} placeholder={autoHashtag || '#YourChallengeTag'} />
            {autoHashtag && !form.hashtag && <p className="text-xs text-primary mt-1">Will use: {autoHashtag}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Rules (optional)</label>
            <textarea className={inp + ' resize-none'} rows={2} value={form.rules} onChange={e => set('rules', e.target.value)} placeholder="e.g. Must follow me. Original content only. One entry per person." />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button
              onClick={() => onSubmit({ ...form, hashtag: form.hashtag || autoHashtag })}
              disabled={!form.title.trim() || !form.description.trim() || !form.custom_prize.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {saving ? 'Launching…' : 'Launch My Challenge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Challenge Entry Modal ────────────────────────────────────────────────────

function ChallengeEntryModal({ challenge, user, onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const [content, setContent]           = useState('')
  const [myVideos, setMyVideos]         = useState([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const meta = CHALLENGE_TYPE_META[challenge.type] ?? CHALLENGE_TYPE_META.general

  const [contentSource, setContentSource] = useState('feed') // 'feed' | 'watch'

  useEffect(() => {
    if (!user?.id) { setVideosLoading(false); return }
    Promise.all([
      supabase.from('posts')
        .select('id, content, media_urls, thumbnail_url, view_count, views_count, like_count, likes_count, comment_count, comments_count, share_count, shares_count, save_count, saves_count, created_at')
        .eq('created_by', user.id)
        .eq('media_type', 'video')
        .neq('feed_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('videos')
        .select('id, title, thumbnail_url, cloudflare_thumbnail, view_count, like_count, comment_count, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]).then(([{ data: feedVids }, { data: watchVids }]) => {
      setMyVideos({
        feed: (feedVids ?? []).map(p => ({ ...p, _type: 'post', _title: p.content?.replace(/<[^>]*>/g,'').slice(0,60) || 'Feed video' })),
        watch: (watchVids ?? []).map(v => ({ ...v, _type: 'video', _title: v.title || 'Watch video' })),
      })
      setVideosLoading(false)
    })
  }, [user?.id])

  const thumbUrl = (v) => {
    if (v._type === 'post') {
      const urls = Array.isArray(v.media_urls) ? v.media_urls : (typeof v.media_urls === 'string' ? JSON.parse(v.media_urls) : [])
      return v.thumbnail_url || urls[0] || null
    }
    return v.thumbnail_url || v.cloudflare_thumbnail || null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className={`h-20 bg-gradient-to-br ${meta.color} rounded-t-3xl flex items-center gap-3 px-5 flex-shrink-0`}>
          <span className="text-3xl">{meta.emoji}</span>
          <div>
            <p className="text-white font-bold text-sm">{challenge.title}</p>
            {challenge.hashtag && <p className="text-white/70 text-xs">{challenge.hashtag}</p>}
          </div>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block mb-1">What to do:</span>
            {challenge.description}
          </div>

          {/* Philomni content picker — Feed Videos or Watch */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                Select your Philomni video *
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Philomni only</span>
              </label>
            </div>
            {/* Source toggle */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 mb-2">
              {[{ id: 'feed', label: '🎬 Feed Videos' }, { id: 'watch', label: '▶ Watch' }].map(s => (
                <button key={s.id} onClick={() => { setContentSource(s.id); setSelectedVideo(null) }}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${contentSource === s.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {videosLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (() => {
              const list = myVideos?.[contentSource] ?? []
              if (list.length === 0) return (
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {contentSource === 'feed' ? "No feed videos yet. Post a video to your feed first." : "No Watch videos yet."}
                  </p>
                  <a href={contentSource === 'feed' ? '/' : '/creator-studio'} className="text-xs text-primary hover:underline">
                    {contentSource === 'feed' ? 'Go to Feed →' : 'Go to Creator Studio →'}
                  </a>
                </div>
              )
              return (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {list.map(v => (
                    <button key={v.id} onClick={() => setSelectedVideo(selectedVideo?.id === v.id ? null : v)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${selectedVideo?.id === v.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
                      <div className="aspect-video bg-muted/40 relative">
                        {thumbUrl(v)
                          ? <img src={thumbUrl(v)} alt={v._title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>}
                        {selectedVideo?.id === v.id && (
                          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        )}
                        <span className="absolute top-1 left-1 text-[8px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                          {v._type === 'post' ? 'FEED' : 'WATCH'}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-foreground px-2 py-1 line-clamp-1">{v._title}</p>
                      <p className="text-[9px] text-muted-foreground px-2 pb-1.5">{((v.view_count ?? v.views_count) ?? 0).toLocaleString()} views</p>
                    </button>
                  ))}
                </div>
              )
            })()}
            {selectedVideo && (
              <p className="mt-1.5 text-[10px] text-primary font-medium flex items-center gap-1">
                <span>✓</span> {selectedVideo._title}
                <span className="text-muted-foreground">({selectedVideo._type === 'post' ? 'Feed video' : 'Watch video'})</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Describe your entry *</label>
            <textarea className={inp + ' resize-none'} rows={3} value={content} onChange={e => setContent(e.target.value)}
              placeholder="Tell us about your approach, your story, what makes this special…" />
          </div>

          {challenge.prize && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">Prize if you win</p>
                <p className="text-xs text-foreground">{challenge.prize}</p>
              </div>
            </div>
          )}

          <div className="bg-muted/20 rounded-xl px-3 py-2 text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">📊 Winner formula</span><br />
            {selectedVideo?._type === 'post'
              ? 'Feed: Views×1 + Likes×5 + Comments×10 + Shares×15 + Saves×8'
              : 'Watch: Views×1 + Likes×5 + Comments×10'} — tracked live
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(content, selectedVideo)} disabled={!content.trim() || !selectedVideo || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Submitting…' : 'Submit Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Challenge Entries Viewer ─────────────────────────────────────────────────

function ChallengeEntriesModal({ challenge, isAdmin, currentUserId, onClose, onPickWinner }) {
  const [entries, setEntries]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [picking, setPicking]           = useState(null)
  const [myVotes, setMyVotes]           = useState(new Set())
  const [sortBy, setSortBy]             = useState('score')  // 'score' | 'votes' | 'newest'
  const [expanded, setExpanded]         = useState(null)
  const [videoMetrics, setVideoMetrics] = useState({}) // { videoId: { view_count, like_count, comment_count, title, thumbnail_url } }

  const calcScore = (entry, metrics) => {
    if (entry.content_id && metrics[entry.content_id]) {
      const m = metrics[entry.content_id]
      if (entry.content_type === 'video') {
        return (m.view_count ?? 0) * 1 + (m.like_count ?? 0) * 5 + (m.comment_count ?? 0) * 10
      }
      if (entry.content_type === 'post') {
        return (m.view_count ?? m.views_count ?? 0) * 1
          + (m.like_count ?? m.likes_count ?? 0) * 5
          + (m.comment_count ?? m.comments_count ?? 0) * 10
          + (m.share_count ?? m.shares_count ?? 0) * 15
          + (m.save_count ?? m.saves_count ?? 0) * 8
      }
    }
    return (entry.votes ?? 0) * 10
  }

  useEffect(() => {
    const load = async () => {
      const { data: entryData } = await supabase
        .from('challenge_entries').select('*').eq('challenge_id', challenge.id)
      const rows = entryData ?? []
      setEntries(rows)

      // Fetch metrics for Watch video entries
      const videoIds = [...new Set(rows.filter(e => e.content_type === 'video' && e.content_id).map(e => e.content_id))]
      // Fetch metrics for Feed video (post) entries
      const postIds = [...new Set(rows.filter(e => e.content_type === 'post' && e.content_id).map(e => e.content_id))]

      const metrics = {}
      await Promise.all([
        videoIds.length && supabase.from('videos')
          .select('id, title, thumbnail_url, cloudflare_thumbnail, view_count, like_count, comment_count')
          .in('id', videoIds)
          .then(({ data }) => { (data ?? []).forEach(v => { metrics[v.id] = { ...v, _src: 'video' } }) }),
        postIds.length && supabase.from('posts')
          .select('id, content, media_urls, thumbnail_url, view_count, views_count, like_count, likes_count, comment_count, comments_count, share_count, shares_count, save_count, saves_count')
          .in('id', postIds)
          .then(({ data }) => { (data ?? []).forEach(p => { metrics[p.id] = { ...p, _src: 'post' } }) }),
      ])
      setVideoMetrics(metrics)

      if (currentUserId) {
        const ids = rows.map(e => e.id)
        if (ids.length) {
          const { data: voteData } = await supabase
            .from('challenge_entry_votes')
            .select('entry_id').eq('user_id', currentUserId).in('entry_id', ids)
          setMyVotes(new Set((voteData ?? []).map(v => v.entry_id)))
        }
      }
      setLoading(false)
    }
    load()
  }, [challenge.id, currentUserId])

  // Real-time metric updates for both videos and posts
  useEffect(() => {
    const videoIds = entries.filter(e => e.content_type === 'video' && e.content_id).map(e => e.content_id)
    const postIds  = entries.filter(e => e.content_type === 'post'  && e.content_id).map(e => e.content_id)
    if (!videoIds.length && !postIds.length) return
    const ch = supabase.channel(`entries-metrics-${challenge.id}`)
    if (videoIds.length) ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'videos' }, (payload) => {
      const v = payload.new
      if (videoIds.includes(v.id)) setVideoMetrics(prev => ({ ...prev, [v.id]: { ...prev[v.id], ...v } }))
    })
    if (postIds.length) ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
      const p = payload.new
      if (postIds.includes(p.id)) setVideoMetrics(prev => ({ ...prev, [p.id]: { ...prev[p.id], ...p } }))
    })
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [entries, challenge.id])

  const handleVote = async (entryId) => {
    if (!currentUserId) return
    const { data } = await supabase.rpc('vote_challenge_entry', { p_entry_id: entryId, p_user_id: currentUserId })
    const action = data?.action
    setMyVotes(prev => { const n = new Set(prev); action === 'voted' ? n.add(entryId) : n.delete(entryId); return n })
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, votes: (e.votes ?? 0) + (action === 'voted' ? 1 : -1) } : e))
  }

  const handlePick = async (entry) => {
    setPicking(entry.id)
    await onPickWinner(challenge.id, entry.user_id, entry.user_name)
    setPicking(null)
    onClose()
  }

  const withScore = entries.map(e => ({ ...e, _score: calcScore(e, videoMetrics) }))

  const sorted = [...withScore].sort((a, b) => {
    if (sortBy === 'score')  return b._score - a._score
    if (sortBy === 'votes')  return (b.votes ?? 0) - (a.votes ?? 0)
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const topScore = Math.max(...withScore.map(e => e._score), 0)
  const isEnded  = challenge.status === 'ended'
  const isPlatformChallenge = !challenge.challenge_type || challenge.challenge_type === 'platform'
  const hasLinkedContent = entries.some(e => e.content_type === 'video')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-2xl my-6">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground line-clamp-1">{challenge.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length} submission{entries.length !== 1 ? 's' : ''}
              {isEnded && challenge.winner_name ? ` · 🏆 Winner: ${challenge.winner_name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Info banner */}
        <div className="px-5 pt-4 pb-0">
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block mb-1">
              {isPlatformChallenge ? '🤖 Auto-scored challenge' : '👥 Creator challenge'}
            </span>
            {isPlatformChallenge
              ? 'Entries must link a Philomni Watch video. Score = Views×1 + Likes×5 + Comments×10. Winner is picked automatically at deadline.'
              : `Community votes guide the decision. ${isAdmin || challenge.created_by === currentUserId ? 'As the creator, you pick the final winner.' : 'The creator picks the final winner.'}`}
          </div>
        </div>

        {/* Sort pills */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-wrap gap-2">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {[
              { id: 'score', label: '📊 Top Score' },
              { id: 'votes', label: '🔥 Most Voted' },
              { id: 'newest', label: '🆕 Newest' },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${sortBy === s.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {hasLinkedContent && !isEnded && (
            <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" /> Live scores
            </span>
          )}
          {(isAdmin || challenge.created_by === currentUserId) && entries.length > 0 && !isEnded && !isPlatformChallenge && (
            <span className="text-xs text-amber-400 font-medium">Pick a winner below ↓</span>
          )}
        </div>

        {/* Entries list */}
        <div className="px-5 pb-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">🎯</p>
              <p className="text-sm font-semibold text-foreground">No entries yet</p>
              <p className="text-xs text-muted-foreground">Be the first to participate!</p>
            </div>
          ) : sorted.map((e, idx) => {
            const isWinner   = challenge.winner_id === e.user_id
            const isLeading  = !isEnded && e._score === topScore && topScore > 0 && withScore.length > 1
            const iVoted     = myVotes.has(e.id)
            const isExpanded = expanded === e.id
            const vid        = e.content_type === 'video' && e.content_id ? videoMetrics[e.content_id] : null
            const canPick    = !isEnded && !isPlatformChallenge && (isAdmin || challenge.created_by === currentUserId)

            return (
              <div key={e.id} className={`rounded-2xl border transition-all ${isWinner ? 'border-amber-400/60 bg-amber-500/5' : isLeading ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20'}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Rank / vote */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleVote(e.id)}
                        disabled={isEnded || !currentUserId}
                        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all ${iVoted ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'} disabled:opacity-40 disabled:cursor-default`}>
                        <ChevronUp className="w-4 h-4" />
                        <span className="text-xs font-bold">{e.votes ?? 0}</span>
                      </button>
                      {idx < 3 && sortBy === 'score' && <span className="text-[10px] text-muted-foreground font-semibold">#{idx + 1}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Avatar name={e.user_name} url={e.user_avatar} size={6} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                            {e.user_name}
                            {isWinner && <span className="text-amber-400 font-bold">🏆 Winner</span>}
                            {isLeading && !isWinner && <span className="text-primary text-[10px] font-bold bg-primary/15 px-1.5 py-0.5 rounded-full">⭐ Leading</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        {canPick && (
                          <button onClick={() => handlePick(e)} disabled={!!picking}
                            className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-1">
                            {picking === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '🏆 Pick Winner'}
                          </button>
                        )}
                      </div>

                      {/* Live score pill */}
                      {vid && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Score: {e._score.toLocaleString()}
                          </span>
                          {e.content_type === 'post'
                            ? <span className="text-[10px] text-muted-foreground">
                                {(vid.view_count ?? vid.views_count ?? 0).toLocaleString()} views · {(vid.like_count ?? vid.likes_count ?? 0).toLocaleString()} likes · {(vid.comment_count ?? vid.comments_count ?? 0).toLocaleString()} comments · {(vid.share_count ?? vid.shares_count ?? 0).toLocaleString()} shares
                              </span>
                            : <span className="text-[10px] text-muted-foreground">
                                {(vid.view_count ?? 0).toLocaleString()} views · {(vid.like_count ?? 0).toLocaleString()} likes · {(vid.comment_count ?? 0).toLocaleString()} comments
                              </span>
                          }
                        </div>
                      )}

                      {/* Content thumbnail + link */}
                      {vid && (() => {
                        const isFeedVid = vid._src === 'post' || e.content_type === 'post'
                        const mediaUrls = Array.isArray(vid.media_urls) ? vid.media_urls : (typeof vid.media_urls === 'string' ? (() => { try { return JSON.parse(vid.media_urls) } catch { return [] } })() : [])
                        const thumb = isFeedVid ? (vid.thumbnail_url || mediaUrls[0] || null) : (vid.thumbnail_url || vid.cloudflare_thumbnail || null)
                        const label = isFeedVid ? (vid.content?.replace(/<[^>]*>/g,'').slice(0,50) || 'Feed video') : (vid.title || 'Watch video')
                        const href  = isFeedVid ? null : `/watch/${e.content_id}`
                        const inner = (
                          <div className="mt-2 flex items-center gap-2 bg-muted/40 hover:bg-muted/70 rounded-xl px-2.5 py-2 transition-colors group">
                            <div className="w-10 h-7 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {thumb ? <img src={thumb} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎬</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{label}</p>
                              <span className="text-[8px] font-bold text-muted-foreground">{isFeedVid ? 'FEED VIDEO' : 'WATCH VIDEO'}</span>
                            </div>
                            {href && <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          </div>
                        )
                        return href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner
                      })()}

                      {/* Description */}
                      <p className={`text-xs text-foreground mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>{e.content}</p>
                      {e.content?.length > 160 && (
                        <button onClick={() => setExpanded(isExpanded ? null : e.id)} className="text-[10px] text-primary mt-0.5 hover:underline">
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── QR Ticket Modal ─────────────────────────────────────────────────────────

function TicketModal({ event, user, status, onClose }) {
  const ticketRef  = `phi-evt-${event.id.slice(0,8)}-usr-${(user?.id ?? '').slice(0,8)}`
  const isPhysical = event.type === 'in-person'
  const qrPayload  = JSON.stringify({
    ref:      ticketRef,
    event:    event.title,
    attendee: user?.full_name ?? user?.user_metadata?.full_name ?? 'Attendee',
    status,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-5 text-center">
          <p className="text-white/70 text-[11px] tracking-widest uppercase mb-1">Philomni Events</p>
          <h2 className="text-white text-xl font-bold">Your Ticket 🎟</h2>
        </div>

        <div className="p-5 space-y-3">
          {/* Event info */}
          <div>
            <p className="text-sm font-bold text-foreground line-clamp-2">{event.title}</p>
            {event.starts_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status === 'PAID' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Check className="w-3 h-3" />
            {status === 'PAID' ? 'Paid Ticket' : 'Free RSVP Confirmed'}
          </div>

          {/* Attendee */}
          <div className="bg-muted/30 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Attendee</p>
            <p className="text-sm font-semibold text-foreground">{user?.full_name ?? user?.user_metadata?.full_name ?? 'You'}</p>
          </div>

          {/* Location */}
          {(event.location || event.join_url) && (
            <div className="bg-muted/30 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                {isPhysical ? '📍 Venue' : '💻 How to Join'}
              </p>
              <p className="text-xs text-foreground font-medium">{event.location ?? event.join_url}</p>
            </div>
          )}

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2">
            <QRCodeSVG value={qrPayload} size={160} level="M" includeMargin={false} />
            <p className="text-[10px] text-gray-500 font-mono">{ticketRef}</p>
            {isPhysical && <p className="text-[10px] text-gray-400">Show this at the door</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Close
            </button>
            <button onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              Save / Print
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground">Ticket also sent to your email</p>
        </div>
      </div>
    </div>
  )
}

// ─── Event Share Modal ────────────────────────────────────────────────────────

function EventShareModal({ event, onClose }) {
  const { user } = useAuth()
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteResults, setInviteResults] = useState([])
  const [sending, setSending] = useState(null)
  const [copied, setCopied] = useState(false)

  const shareUrl  = `${window.location.origin}/community`
  const shareText = `Join me at "${event.title}" on Philomni!${event.starts_at ? ' ' + new Date(event.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const searchUsers = useCallback(async (q) => {
    if (q.trim().length < 2) { setInviteResults([]); return }
    const { data } = await supabase.from('users').select('id, full_name, avatar_url').ilike('full_name', `%${q}%`).limit(5)
    setInviteResults(data ?? [])
  }, [])

  const sendInvite = async (toUser) => {
    if (!user?.id || sending) return
    setSending(toUser.id)
    await supabase.from('notifications').insert({
      user_id: toUser.id, type: 'event_invite', created_by: user.id,
      content: `${user.full_name ?? 'Someone'} invited you to "${event.title}"`,
      reference_id: event.id,
    })
    toast.success(`Invite sent to ${toUser.full_name}!`)
    setSending(null)
    setInviteQuery('')
    setInviteResults([])
  }

  const SHARE_OPTIONS = [
    { label: copied ? 'Copied!' : 'Copy Link', emoji: '🔗', action: copyLink },
    { label: 'WhatsApp',   emoji: '💬', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank') },
    { label: 'X / Twitter', emoji: '𝕏', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
    { label: 'LinkedIn',   emoji: '💼', action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank') },
    { label: 'Email',      emoji: '📧', action: () => window.open(`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`) },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" />Share Event</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2 line-clamp-2">{event.title}</p>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2">
            {SHARE_OPTIONS.map(s => (
              <button key={s.label} onClick={s.action}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-xs font-medium text-foreground transition-all">
                <span className="text-base leading-none">{s.emoji}</span>{s.label}
              </button>
            ))}
          </div>

          {/* Philomni invite */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-primary" /> Invite a Philomni member
            </p>
            <input
              value={inviteQuery}
              onChange={e => { setInviteQuery(e.target.value); searchUsers(e.target.value) }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              placeholder="Search by name…"
            />
            {inviteResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {inviteResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.full_name} url={u.avatar_url} size={6} />
                      <span className="text-xs text-foreground">{u.full_name}</span>
                    </div>
                    <button onClick={() => sendInvite(u)} disabled={sending === u.id}
                      className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {sending === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Invite'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Event Payment Modal ──────────────────────────────────────────────────────

function EventPaymentModal({ event, user, onSuccess, onClose }) {
  const [paying, setPaying]     = useState(false)
  const [country, setCountry]   = useState(null)
  const [provider, setProvider] = useState(null)

  useEffect(() => {
    getUserCountry(user).then(c => {
      setCountry(c)
      setProvider(getPaymentProvider(c))
    })
  }, [user])

  const priceUSD = parseFloat(event.price) || 0
  const priceNGN = Math.round(priceUSD * 1550 * 100) // kobo

  const launch = async () => {
    if (!user?.id || paying) return
    setPaying(true)
    try {
      if (provider === 'paystack') {
        await loadPaystackScript()
        const intent = await createPaymentIntent(supabase, {
          userId: user.id, amount: priceNGN, currency: 'ngn',
          type: 'event_ticket', metadata: { event_id: event.id, event_title: event.title },
        })
        openPaystackPopup({
          email: user.email, amountKobo: priceNGN, currency: 'NGN',
          metadata: { event_id: event.id, user_id: user.id, payment_intent_id: intent.id },
          onSuccess: async (ref) => {
            await recordPayment(supabase, { intentId: intent.id, provider: 'paystack', reference: ref, userId: user.id, amount: priceUSD })
            onSuccess()
          },
          onClose: () => setPaying(false),
        })
      } else if (provider === 'flutterwave') {
        await loadFlutterwaveScript()
        openFlutterwaveCheckout({
          email: user.email, name: user.full_name ?? user.email,
          amount: priceUSD, currency: 'USD',
          txRef: `phi-event-${event.id}-${user.id}-${Date.now()}`,
          metadata: { event_id: event.id, user_id: user.id },
          onSuccess: async (ref) => { onSuccess() },
          onClose: () => setPaying(false),
        })
      } else {
        // Stripe or PayPal — inform user, can't do inline without server setup
        toast.info('Redirecting to secure checkout…')
        setPaying(false)
        // Could redirect to a Stripe payment link here if configured
      }
    } catch (err) {
      toast.error('Payment could not start. Please try again.')
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">🎟 Buy Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-muted/30 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-foreground line-clamp-2">{event.title}</p>
            {event.starts_at && <p className="text-xs text-muted-foreground">{new Date(event.starts_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <span className="text-sm font-semibold text-foreground">Ticket price</span>
            <span className="text-xl font-bold text-amber-400">${priceUSD.toFixed(2)}</span>
          </div>
          {provider && (
            <p className="text-xs text-center text-muted-foreground">
              Payment via {provider === 'paystack' ? 'Paystack 🇳🇬' : provider === 'flutterwave' ? 'Flutterwave' : 'Stripe'} · Secure & encrypted
            </p>
          )}
          <button onClick={launch} disabled={paying || !provider}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {paying ? 'Processing…' : `Pay $${priceUSD.toFixed(2)} & RSVP`}
          </button>
          <button onClick={onClose} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Event Modal ───────────────────────────────────────────────────────

function CreateEventModal({ onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16)
  const [form, setForm] = useState({ title: '', description: '', type: 'webinar', location: '', join_url: '', starts_at: nextWeek, ends_at: '', is_free: true, price: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">📅 Create an Event</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Event Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Creator Monetization Summit 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select className={inp + ' cursor-pointer'} value={form.type} onChange={e => set('type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Location / Platform</label>
              <input className={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Virtual — Zoom / Philomni Room" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Starts At *</label>
              <input type="datetime-local" className={inp} value={form.starts_at} onChange={e => set('starts_at', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ends At</label>
              <input type="datetime-local" className={inp} value={form.ends_at} onChange={e => set('ends_at', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description *</label>
            <textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What will attendees learn or experience? Who should attend?" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Join Link (Zoom, Google Meet, Philomni Room, etc.)
            </label>
            <input className={inp} value={form.join_url} onChange={e => set('join_url', e.target.value)} placeholder="https://zoom.us/j/… or https://philomni.com/rooms/…" />
            <p className="text-xs text-muted-foreground mt-1">Only shown to attendees who RSVP.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => set('is_free', !form.is_free)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_free ? 'bg-emerald-500' : 'bg-primary'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_free ? 'translate-x-0' : 'translate-x-5'}`} />
              </div>
              <span className="text-sm text-foreground">{form.is_free ? 'Free event' : 'Paid event'}</span>
            </label>
            {!form.is_free && (
              <div className="flex-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input type="number" className={inp} value={form.price} onChange={e => set('price', e.target.value)} placeholder="Price in USD" min="0" />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.title.trim() || !form.description.trim() || !form.starts_at || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Announcement Modal ────────────────────────────────────────────────

function CreateAnnouncementModal({ onClose, onSubmit, saving }) {
  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const [form, setForm] = useState({ title: '', content: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">📣 New Announcement</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-400">
            Announcements are shown to all community members. Use for important platform updates.
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. New Feature: Creator Studio is Now Live ✨" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Content *</label>
            <textarea className={inp + ' resize-none'} rows={5} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement here. Be clear, specific, and helpful." />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.title.trim() || !form.content.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {saving ? 'Publishing…' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scan Ticket Modal ────────────────────────────────────────────────────────

function ScanTicketModal({ event, onClose }) {
  const [result, setResult]   = useState(null)  // { valid, name, status, scanned_at, ref }
  const [scanning, setScanning] = useState(false)
  const [manualRef, setManualRef] = useState('')
  const [checking, setChecking] = useState(false)
  const readerRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    let scanner
    const start = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')
        scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, false)
        scannerRef.current = scanner
        scanner.render(
          async (decoded) => {
            scanner.pause()
            await validateTicket(decoded)
          },
          () => {}
        )
        setScanning(true)
      } catch {
        setScanning(false)
      }
    }
    start()
    return () => { try { scannerRef.current?.clear() } catch {} }
  }, [])

  const validateTicket = async (decoded) => {
    setChecking(true)
    try {
      // Try to parse as JSON ticket ref: { ref, event, attendee, status }
      let ref = decoded
      try { ref = JSON.parse(decoded).ref ?? decoded } catch {}

      // Parse out event_id and user_id from ref: phi-evt-{8}-usr-{8}
      const match = ref.match(/phi-evt-([a-f0-9-]+)-usr-([a-f0-9-]+)/i)
      if (!match) {
        setResult({ valid: false, error: 'Invalid QR code — not a Philomni ticket' })
        setChecking(false)
        return
      }
      const eventIdFrag = match[1]
      const userIdFrag  = match[2]

      // Find the RSVP
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('*, users:user_id(full_name, email)')
        .eq('event_id', event.id)
        .ilike('user_id', `${userIdFrag}%`)
        .limit(1)

      if (!rsvps?.length) {
        setResult({ valid: false, error: 'No RSVP found for this ticket' })
        setChecking(false)
        return
      }
      const rsvp = rsvps[0]

      if (rsvp.scanned_at) {
        setResult({
          valid: false,
          alreadyUsed: true,
          name: rsvp.users?.full_name ?? rsvp.user_id,
          scanned_at: rsvp.scanned_at,
          ref,
        })
        setChecking(false)
        return
      }

      // Mark as used
      const now = new Date().toISOString()
      await supabase.from('event_rsvps').update({ scanned_at: now }).eq('id', rsvp.id)

      setResult({
        valid: true,
        name: rsvp.users?.full_name ?? rsvp.user_id,
        email: rsvp.users?.email,
        status: rsvp.status,
        ref,
      })
    } catch (e) {
      setResult({ valid: false, error: e.message })
    }
    setChecking(false)
  }

  const handleManualCheck = async () => {
    if (!manualRef.trim()) return
    scannerRef.current?.pause()
    await validateTicket(manualRef.trim())
  }

  const handleRescan = () => {
    setResult(null)
    setManualRef('')
    try { scannerRef.current?.resume() } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">Scanning tickets for</p>
            <p className="font-bold text-foreground truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {!result ? (
            <>
              {/* Camera scanner */}
              <div id="qr-reader" ref={readerRef} className="rounded-xl overflow-hidden bg-black" />
              {checking && (
                <div className="flex items-center justify-center gap-2 py-4 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Checking ticket…</span>
                </div>
              )}
              {/* Manual entry fallback */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Or enter ticket ref manually</p>
                <div className="flex gap-2">
                  <input
                    value={manualRef}
                    onChange={e => setManualRef(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualCheck()}
                    placeholder="phi-evt-…"
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground font-mono"
                  />
                  <button onClick={handleManualCheck} disabled={checking} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    Check
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {result.valid ? (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-green-500">VALID TICKET</p>
                    <p className="text-foreground font-bold mt-1">{result.name}</p>
                    {result.email && <p className="text-sm text-muted-foreground">{result.email}</p>}
                    <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${result.status === 'paid' ? 'bg-violet-500/15 text-violet-400' : 'bg-green-500/15 text-green-400'}`}>
                      {result.status === 'paid' ? '💳 PAID' : '✓ FREE RSVP'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{result.ref}</p>
                </div>
              ) : result.alreadyUsed ? (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
                    <Flag className="w-10 h-10 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-amber-500">ALREADY SCANNED</p>
                    <p className="text-foreground font-bold mt-1">{result.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scanned at {new Date(result.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-red-500">INVALID</p>
                    <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
                  </div>
                </div>
              )}
              <button onClick={handleRescan} className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">
                Scan Next Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Community() {
  const { user, isAdmin, isPro, isProMax } = useAuth()
  const navigate  = useNavigate()
  const { mode }  = useMode()
  const [communityMode, setCommunityMode] = useState(mode === 'pro' ? 'pro' : 'creator')

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

  const [dbGroups, setDbGroups]           = useState([])
  const [dbEvents, setDbEvents]           = useState([])
  const [dbChallenges, setDbChallenges]   = useState([])
  const [dbAnnouncements, setDbAnnouncements] = useState([])
  const [dbLeaderboard, setDbLeaderboard] = useState([])
  const [userGroupIds, setUserGroupIds]   = useState(new Set())
  const [userEventRsvps, setUserEventRsvps] = useState(new Set())
  const [userChallengeIds, setUserChallengeIds] = useState(new Set())

  const [showCreateGroup, setShowCreateGroup]           = useState(false)
  const [showCreateChallenge, setShowCreateChallenge]   = useState(false)
  const [showCreateEvent, setShowCreateEvent]           = useState(false)
  const [showCreateAnn, setShowCreateAnn]               = useState(false)
  const [savingCreate, setSavingCreate]                 = useState(false)
  const [enteringChallenge, setEnteringChallenge]       = useState(null)
  const [viewingEntries, setViewingEntries]             = useState(null)
  const [savingEntry, setSavingEntry]                   = useState(false)
  const [sharingEvent, setSharingEvent]                 = useState(null)
  const [payingEvent, setPayingEvent]                   = useState(null)
  const [ticketEvent, setTicketEvent]                   = useState(null) // { event, status }
  const [searchQuery, setSearchQuery]                   = useState('')
  const [myContentOnly, setMyContentOnly]               = useState(false)
  const [scanningEvent, setScanningEvent]               = useState(null)
  const [groupsFilter, setGroupsFilter]                 = useState('discover') // 'mine' | 'discover'
  const [challengeTypeFilter, setChallengeTypeFilter]   = useState('all') // 'all' | 'platform' | 'creator'
  const [showCreateCreatorChallenge, setShowCreateCreatorChallenge] = useState(false)


  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('discussion_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) console.error('[Community] discussion_posts:', error.message)
        setPosts(data ?? [])
      } catch (e) {
        console.error('[Community] fetch failed:', e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load groups, events, challenges, announcements, leaderboard from DB
  useEffect(() => {
    supabase.from('groups').select('*').eq('is_private', false).eq('status', 'active').order('member_count', { ascending: false }).limit(30)
      .then(({ data }) => setDbGroups(data ?? []))
    supabase.from('events').select('*').eq('status', 'upcoming').order('starts_at', { ascending: true }).limit(20)
      .then(({ data }) => setDbEvents(data ?? []))
    supabase.from('challenges').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setDbChallenges(data ?? []))
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setDbAnnouncements(data ?? []))
    supabase.from('community_points').select('user_id, points, weekly_points, badges').order('points', { ascending: false }).limit(10)
      .then(async ({ data }) => {
        if (!data?.length) return
        const ids = data.map(d => d.user_id)
        const { data: usrs } = await supabase.from('users').select('id, full_name, avatar_url, headline').in('id', ids)
        const umap = Object.fromEntries((usrs ?? []).map(u => [u.id, u]))
        setDbLeaderboard(data.map((d, i) => ({
          rank: i + 1,
          name: umap[d.user_id]?.full_name ?? 'Creator',
          avatar: umap[d.user_id]?.avatar_url ?? null,
          role: umap[d.user_id]?.headline ?? '',
          points: d.points,
          change: 0,
          badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
          badges: d.badges ?? [],
        })))
      })
  }, [])

  // Auto-pick winners for expired platform challenges (runs once when challenges load)
  const autoWinnerChecked = useRef(false)
  useEffect(() => {
    if (autoWinnerChecked.current || !dbChallenges.length) return
    autoWinnerChecked.current = true
    const now = new Date()
    const expired = dbChallenges.filter(c =>
      c.status === 'active' &&
      (!c.challenge_type || c.challenge_type === 'platform') &&
      c.ends_at && new Date(c.ends_at) < now
    )
    for (const ch of expired) {
      supabase.rpc('auto_pick_challenge_winner', { p_challenge_id: ch.id })
        .then(({ data }) => {
          if (data?.ok) {
            setDbChallenges(prev => prev.map(c => c.id === ch.id
              ? { ...c, winner_name: data.winner, status: 'ended' }
              : c
            ))
          }
        })
    }
  }, [dbChallenges])

  // Load user memberships & RSVPs
  useEffect(() => {
    if (!user?.id) return
    supabase.from('group_members').select('group_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setUserGroupIds(new Set(data.map(m => m.group_id))) })
    supabase.from('event_rsvps').select('event_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setUserEventRsvps(new Set(data.map(r => r.event_id))) })
    supabase.from('challenge_entries').select('challenge_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setUserChallengeIds(new Set(data.map(e => e.challenge_id))) })
  }, [user?.id])

  // ── Algorithmic scoring for Groups ───────────────────────────────────────
  // Score = member_count weighted by recency + joined-group bonus
  const scoredGroups = useMemo(() => {
    const now = Date.now()
    return [...dbGroups].sort((a, b) => {
      const ageA = (now - new Date(a.created_at ?? 0).getTime()) / 86400000 // days
      const ageB = (now - new Date(b.created_at ?? 0).getTime()) / 86400000
      // Joined bonus: groups you're a member of float up when on Discover
      const joinedA = userGroupIds.has(a.id) ? 0 : 0
      const joinedB = userGroupIds.has(b.id) ? 0 : 0
      const scoreA = ((a.member_count ?? 0) / Math.pow(ageA + 2, 0.4)) + joinedA
      const scoreB = ((b.member_count ?? 0) / Math.pow(ageB + 2, 0.4)) + joinedB
      return scoreB - scoreA
    })
  }, [dbGroups, userGroupIds])

  // ── Algorithmic scoring for Challenges ───────────────────────────────────
  // Hard recency gate: challenges > 90 days old are capped below ALL recent ones.
  // Within the recent bucket, urgency + entries determine rank.
  const scoredChallenges = useMemo(() => {
    const now = Date.now()
    const RECENT_GATE_MS = 90 * 24 * 3600000 // 90 days

    const active = [...dbChallenges.filter(c => !c.status || c.status === 'active')]
      .sort((a, b) => {
        const ageA = now - new Date(a.created_at).getTime()
        const ageB = now - new Date(b.created_at).getTime()
        const recentA = ageA < RECENT_GATE_MS
        const recentB = ageB < RECENT_GATE_MS

        // Hard gate: recent challenges always above stale ones
        if (recentA && !recentB) return -1
        if (!recentA && recentB) return 1

        const ageHoursA = ageA / 3600000
        const ageHoursB = ageB / 3600000
        const daysLeftA = a.ends_at ? (new Date(a.ends_at) - now) / 86400000 : 999
        const daysLeftB = b.ends_at ? (new Date(b.ends_at) - now) / 86400000 : 999

        // Urgency: ending in <3 days is critical, <7 days is high
        const urgencyA = daysLeftA < 0 ? -999 : daysLeftA < 3 ? 50 : daysLeftA < 7 ? 20 : 0
        const urgencyB = daysLeftB < 0 ? -999 : daysLeftB < 3 ? 50 : daysLeftB < 7 ? 20 : 0

        // Engagement score with stronger decay (^0.8 instead of ^0.6)
        const scoreA = ((a.entry_count ?? 0) * 4 + urgencyA) / Math.pow(ageHoursA + 2, 0.8)
        const scoreB = ((b.entry_count ?? 0) * 4 + urgencyB) / Math.pow(ageHoursB + 2, 0.8)
        return scoreB - scoreA
      })

    // Ended challenges: most recently ended first (not by old entry count)
    const ended = [...dbChallenges.filter(c => c.status === 'ended')]
      .sort((a, b) => new Date(b.updated_at ?? b.created_at) - new Date(a.updated_at ?? a.created_at))

    return { active, ended }
  }, [dbChallenges])

  // ── Algorithmic scoring for Events ───────────────────────────────────────
  // Hard rule: events that ended (starts_at + 2h grace) are hidden from feed.
  // Live events → soonest upcoming → RSVPd boost → attendee tiebreaker.
  const scoredEvents = useMemo(() => {
    const now = Date.now()
    const GRACE_MS = 2 * 3600000 // 2-hour grace period after start time

    return [...dbEvents]
      // Hard gate: drop events that have clearly passed (no end_at and started >2h ago,
      // or end_at is in the past)
      .filter(e => {
        if (e.ends_at) return new Date(e.ends_at).getTime() > now
        return new Date(e.starts_at).getTime() + GRACE_MS > now
      })
      .sort((a, b) => {
        const startA = new Date(a.starts_at).getTime()
        const startB = new Date(b.starts_at).getTime()
        const endA   = a.ends_at ? new Date(a.ends_at).getTime() : startA + GRACE_MS
        const endB   = b.ends_at ? new Date(b.ends_at).getTime() : startB + GRACE_MS

        // Tier 1: currently LIVE (started and not ended)
        const liveA = startA <= now && endA > now ? 1 : 0
        const liveB = startB <= now && endB > now ? 1 : 0
        if (liveA !== liveB) return liveB - liveA

        // Tier 2: strict chronological (soonest first) — time is the primary truth
        // RSVPd events get a 48-hour proximity bonus (feels closer)
        const rsvpBonusA = userEventRsvps.has(a.id) ? 48 * 3600000 : 0
        const rsvpBonusB = userEventRsvps.has(b.id) ? 48 * 3600000 : 0
        const effectiveA = startA - rsvpBonusA
        const effectiveB = startB - rsvpBonusB
        if (effectiveA !== effectiveB) return effectiveA - effectiveB

        // Tier 3: more attendees wins same-day tiebreaker
        return (b.attendee_count ?? 0) - (a.attendee_count ?? 0)
      })
  }, [dbEvents, userEventRsvps])

  const displayPosts = useMemo(() => {
    return posts.map(p => ({
      ...p,
      score: p.likes_count ?? p.score ?? 0,
      comment_count: p.reply_count ?? p.comment_count ?? 0,
      view_count: p.view_count ?? 0,
      is_pinned: p.is_pinned ?? false,
    }))
  }, [posts])

  const filteredPosts = useMemo(() => {
    let list = [...displayPosts]

    // My content filter
    if (myContentOnly && user?.id) list = list.filter(p => p.created_by === user.id || p.author_id === user.id)

    // Board filter
    if (boardFilter === 'pinned') list = list.filter(p => p.is_pinned)
    else if (boardFilter !== 'all') list = list.filter(p => p.board === boardFilter)

    // Search — when a query is present, filter by title/content/tags
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(p =>
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.content ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
        (p.author_name ?? '').toLowerCase().includes(q)
      )
      // Sort search results by relevance (title match scores higher)
      list.sort((a, b) => {
        const aTitle = (a.title ?? '').toLowerCase().includes(q) ? 1 : 0
        const bTitle = (b.title ?? '').toLowerCase().includes(q) ? 1 : 0
        return bTitle - aTitle || (b.score - a.score)
      })
      return list
    }

    // No search: apply sort + algorithmic shuffle for 'hot'
    if (sortBy === 'hot') {
      // Weight: score + comments + slight recency boost
      list.sort((a, b) => {
        const now = Date.now()
        const ageA = (now - new Date(a.created_at).getTime()) / 3600000 // hours
        const ageB = (now - new Date(b.created_at).getTime()) / 3600000
        const scoreA = (a.score + a.comment_count * 0.5) / Math.pow(ageA + 2, 0.8)
        const scoreB = (b.score + b.comment_count * 0.5) / Math.pow(ageB + 2, 0.8)
        return scoreB - scoreA
      })
    } else if (sortBy === 'new') {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'top') {
      list.sort((a, b) => b.score - a.score)
    }
    // Pinned always first
    return [...list.filter(p => p.is_pinned), ...list.filter(p => !p.is_pinned)]
  }, [displayPosts, boardFilter, sortBy, searchQuery, myContentOnly, user?.id])

  const handleVote = useCallback(async (id, dir) => {
    const prev = votes[id] ?? 0
    const next = prev === dir ? 0 : dir
    setVotes(v => ({ ...v, [id]: next }))
    const dbPost = posts.find(p => p.id === id)
    if (dbPost && user?.id) {
      const delta = next - prev
      await supabase.from('discussion_posts').update({ likes_count: Math.max(0, (dbPost.likes_count ?? 0) + delta) }).eq('id', id)
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: Math.max(0, (p.likes_count ?? 0) + delta) } : p))
    }
  }, [posts, votes, user?.id])

  const handleJoinGroup = useCallback(async (groupId) => {
    if (!user?.id) return
    const isJoined = userGroupIds.has(groupId)
    setUserGroupIds(prev => { const n = new Set(prev); isJoined ? n.delete(groupId) : n.add(groupId); return n })
    // Also update legacy joinedGroups for sample data
    setJoinedGroups(prev => { const n = new Set(prev); isJoined ? n.delete(groupId) : n.add(groupId); return n })
    const isDbGroup = dbGroups.some(g => g.id === groupId)
    if (isDbGroup) {
      if (isJoined) {
        await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
        setDbGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: Math.max(0, (g.member_count ?? 0) - 1) } : g))
      } else {
        await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, created_by: user.id })
        setDbGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: (g.member_count ?? 0) + 1 } : g))
      }
    }
  }, [user?.id, userGroupIds, dbGroups])

  const handleEventRsvp = useCallback(async (eventId) => {
    if (!user?.id) return
    const isRsvpd = userEventRsvps.has(eventId)
    setUserEventRsvps(prev => { const n = new Set(prev); isRsvpd ? n.delete(eventId) : n.add(eventId); return n })
    const isDbEvent = dbEvents.some(e => e.id === eventId)
    if (isDbEvent) {
      if (isRsvpd) {
        await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id)
        setDbEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendee_count: Math.max(0, (e.attendee_count ?? 0) - 1) } : e))
      } else {
        await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status: 'going' })
        setDbEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendee_count: (e.attendee_count ?? 0) + 1 } : e))
        const ev = dbEvents.find(e => e.id === eventId)
        if (ev) {
          setTicketEvent({ event: ev, status: 'FREE RSVP' })
          sendTicketEmail(ev, user, 'FREE RSVP')
        }
      }
    }
  }, [user?.id, userEventRsvps, dbEvents])

  const sendTicketEmail = useCallback(async (ev, usr, status) => {
    if (!usr?.email) return
    const ticketRef = `phi-evt-${ev.id.slice(0,8)}-usr-${(usr.id ?? '').slice(0,8)}`
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-event-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        attendeeName:  usr.full_name ?? usr.user_metadata?.full_name ?? usr.email,
        attendeeEmail: usr.email,
        eventTitle:    ev.title,
        eventDate:     ev.starts_at ? new Date(ev.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        eventType:     ev.type === 'in-person' ? 'in-person' : 'virtual',
        eventLocation: ev.location ?? null,
        joinUrl:       ev.join_url ?? null,
        ticketRef,
        status,
        price:         ev.price ?? null,
      }),
    }).catch(() => {}) // fire and forget
  }, [])

  const handleEventPaymentSuccess = useCallback(async () => {
    if (!payingEvent || !user?.id) return
    const eventId = payingEvent.id
    await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status: 'paid' })
    setUserEventRsvps(prev => new Set([...prev, eventId]))
    setDbEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendee_count: (e.attendee_count ?? 0) + 1 } : e))
    setTicketEvent({ event: payingEvent, status: 'PAID' })
    sendTicketEmail(payingEvent, user, 'PAID')
    toast.success('🎟 Ticket confirmed! Check your email.')
    setPayingEvent(null)
  }, [payingEvent, user, sendTicketEmail])

  const handleSubmitEntry = useCallback(async (content, selectedVideo) => {
    if (!user?.id || !enteringChallenge) return
    setSavingEntry(true)
    const { error } = await supabase.from('challenge_entries').insert({
      challenge_id: enteringChallenge.id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name ?? user.full_name ?? user.email ?? 'Creator',
      user_avatar: user.user_metadata?.avatar_url ?? user.avatar_url ?? null,
      content,
      media_url: selectedVideo
        ? (selectedVideo._type === 'post' ? null : `${window.location.origin}/watch/${selectedVideo.id}`)
        : null,
      content_type: selectedVideo ? selectedVideo._type : null,
      content_id: selectedVideo?.id ?? null,
      votes: 0,
    })
    if (!error) {
      setUserChallengeIds(prev => new Set([...prev, enteringChallenge.id]))
      setDbChallenges(prev => prev.map(c => c.id === enteringChallenge.id ? { ...c, entry_count: (c.entry_count ?? 0) + 1 } : c))
      toast.success('Entry submitted! Good luck 🏆')
    } else {
      toast.error('Failed to submit entry')
    }
    setSavingEntry(false)
    setEnteringChallenge(null)
  }, [user, enteringChallenge])

  const handlePickWinner = useCallback(async (challengeId, winnerId, winnerName) => {
    if (!isAdmin) return
    const { error } = await supabase.from('challenges').update({ winner_id: winnerId, status: 'ended' }).eq('id', challengeId)
    if (!error) {
      setDbChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, winner_id: winnerId, winner_name: winnerName, status: 'ended' } : c))
      toast.success(`🏆 ${winnerName} picked as winner!`)
    }
  }, [isAdmin])

  const handleAnnouncementReact = useCallback(async (annId, emoji, isDb) => {
    const key = `${annId}-${emoji}`
    const wasReacted = !!reactionMap[key]
    setReactionMap(prev => ({ ...prev, [key]: !wasReacted }))
    if (isDb) {
      const ann = dbAnnouncements.find(a => a.id === annId)
      if (ann) {
        const reactions = { ...(ann.reactions ?? {}) }
        reactions[emoji] = Math.max(0, (reactions[emoji] ?? 0) + (wasReacted ? -1 : 1))
        await supabase.from('announcements').update({ reactions }).eq('id', annId)
        setDbAnnouncements(prev => prev.map(a => a.id === annId ? { ...a, reactions } : a))
      }
    }
  }, [reactionMap, dbAnnouncements])

  const handleNewPost = useCallback(async (form) => {
    setSavingPost(true)
    try {
      const { data } = await supabase.from('discussion_posts').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        board: form.board,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        author_id: user?.id,
        author_name: user?.user_metadata?.full_name ?? user?.full_name ?? 'Creator',
        author_avatar: user?.user_metadata?.avatar_url ?? user?.avatar_url ?? null,
        likes_count: 0, reply_count: 0, view_count: 0,
        created_by: user?.id,
      }).select().single()
      if (data) setPosts(prev => [data, ...prev])
      setShowNewPost(false)
    } catch (e) { console.error(e) }
    setSavingPost(false)
  }, [user])

  const handleCreateGroup = useCallback(async (form) => {
    if (!user?.id) return
    setSavingCreate(true)
    const { data, error } = await supabase.from('groups').insert({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      is_private: form.is_private,
      status: 'active',
      member_count: 1,
      created_by: user.id,
    }).select().single()
    if (!error && data) {
      setDbGroups(prev => [data, ...prev])
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, created_by: user.id })
      setUserGroupIds(prev => new Set([...prev, data.id]))
    }
    setSavingCreate(false)
    setShowCreateGroup(false)
  }, [user])

  const handleCreateChallenge = useCallback(async (form) => {
    if (!user?.id || !isAdmin) return
    setSavingCreate(true)
    const { data, error } = await supabase.from('challenges').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      prize: form.prize.trim(),
      hashtag: form.hashtag,
      rules: form.rules.trim() || null,
      ends_at: new Date(form.ends_at).toISOString(),
      status: 'active',
      entry_count: 0,
      challenge_type: 'platform',
      created_by: user.id,
    }).select().single()
    if (!error && data) setDbChallenges(prev => [data, ...prev])
    setSavingCreate(false)
    setShowCreateChallenge(false)
  }, [user, isAdmin])

  const handleCreateCreatorChallenge = useCallback(async (form) => {
    if (!user?.id) return
    setSavingCreate(true)
    const { data, error } = await supabase.from('challenges').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      prize: form.custom_prize.trim(),
      custom_prize: form.custom_prize.trim(),
      hashtag: form.hashtag,
      rules: form.rules.trim() || null,
      ends_at: new Date(form.ends_at).toISOString(),
      status: 'active',
      entry_count: 0,
      challenge_type: 'creator',
      creator_name: user.user_metadata?.full_name ?? user.full_name ?? 'Creator',
      creator_avatar: user.user_metadata?.avatar_url ?? user.avatar_url ?? null,
      created_by: user.id,
    }).select().single()
    if (!error && data) setDbChallenges(prev => [data, ...prev])
    setSavingCreate(false)
    setShowCreateCreatorChallenge(false)
  }, [user])

  const handleCreateEvent = useCallback(async (form) => {
    if (!user?.id) return
    setSavingCreate(true)
    const { data, error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      location: form.location.trim() || null,
      join_url: form.join_url.trim() || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_free: form.is_free,
      price: form.is_free ? null : parseFloat(form.price) || null,
      status: 'upcoming',
      attendee_count: 0,
      organizer_id: user.id,
      organizer_name: user.user_metadata?.full_name ?? user.full_name ?? 'Creator',
      organizer_avatar: user.user_metadata?.avatar_url ?? user.avatar_url ?? null,
      created_by: user.id,
    }).select().single()
    if (!error && data) setDbEvents(prev => [data, ...prev])
    setSavingCreate(false)
    setShowCreateEvent(false)
  }, [user])

  const handleCreateAnn = useCallback(async (form) => {
    if (!user?.id || !isAdmin) return
    setSavingCreate(true)
    const { data, error } = await supabase.from('announcements').insert({
      title: form.title.trim(),
      content: form.content.trim(),
      reactions: { '❤️': 0, '👏': 0, '🔥': 0, '🤩': 0 },
      created_by: user.id,
    }).select().single()
    if (!error && data) setDbAnnouncements(prev => [{ ...data, isDb: true }, ...prev])
    setSavingCreate(false)
    setShowCreateAnn(false)
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
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {communityMode === 'creator' ? 'Creator Community' : 'Professional Community'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {communityMode === 'creator' ? 'Connect · Collaborate · Create · Grow' : 'Network · Discuss · Mentor · Lead'}
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center bg-muted rounded-full p-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setCommunityMode('creator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${communityMode === 'creator' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            🎨 Creator
          </button>
          <button
            onClick={() => setCommunityMode('pro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${communityMode === 'pro' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            💼 Professional
          </button>
        </div>
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
            {(communityMode === 'pro' ? PRO_BOARDS : BOARDS).map(b => (
              <button key={b.id} onClick={() => setBoardFilter(b.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${boardFilter === b.id ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <span className="truncate">{b.label}</span>
              </button>
            ))}
          </div>

          {/* Main feed */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search discussions, questions, tips…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile: new post + sort + my content */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowNewPost(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New Post
              </button>
              {user?.id && (
                <button
                  onClick={() => setMyContentOnly(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${myContentOnly ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  👤 My Posts
                </button>
              )}
              {!searchQuery && (
                <div className="flex gap-1 ml-auto bg-muted rounded-xl p-1">
                  {['hot','new','top'].map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${sortBy === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                      {s === 'hot' ? '🔥' : s === 'new' ? '🆕' : '⭐'} {s}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && (
                <p className="ml-auto text-xs text-muted-foreground">{filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted/40 rounded-2xl animate-pulse" />)
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                  {searchQuery ? '🔍' : myContentOnly ? '👤' : boardFilter === 'qna' ? '❓' : '💬'}
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-1">
                    {searchQuery ? `No results for "${searchQuery}"` : myContentOnly ? 'You haven\'t posted yet' : boardFilter === 'qna' ? 'No questions yet' : 'No posts yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try different keywords or browse the feed'
                      : myContentOnly
                        ? 'Create a post and it will appear here'
                        : boardFilter === 'qna'
                          ? 'Be the first to ask the community a question'
                          : 'Be the first to start a discussion in this community'}
                  </p>
                </div>
                {!searchQuery && (
                  <button onClick={() => setShowNewPost(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                    {boardFilter === 'qna' ? 'Ask a Question' : 'Start a Discussion'}
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map(p => (
                <PostCard key={p.id} post={p} onOpen={setActivePost} onVote={handleVote} voted={votes[p.id] ?? 0} />
              ))
            )}
          </div>

          <RightSidebar events={dbEvents} challenges={dbChallenges} posts={posts} communityMode={communityMode} />
        </div>
      )}

      {/* ══ GROUPS ═════════════════════════════════════════════════════════ */}
      {tab === 'groups' && (
        <div className="space-y-5">
          {/* Header: search + Mine/Discover toggle + Create */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {[{ id: 'discover', label: '🌍 Discover' }, { id: 'mine', label: '👤 Mine' }].map(f => (
                <button key={f.id} onClick={() => setGroupsFilter(f.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${groupsFilter === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateGroup(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>

          {(() => {
            const enriched = scoredGroups.map(g => ({
              ...g,
              emoji: CAT_META[g.category]?.emoji ?? '👥',
              cover_color: CAT_META[g.category]?.color ?? 'from-primary to-primary/60',
            }))
            const myGroups      = enriched.filter(g => userGroupIds.has(g.id) || g.created_by === user?.id)
            const discoverGroups = enriched.filter(g => !userGroupIds.has(g.id))
            const visible = groupsFilter === 'mine' ? myGroups : discoverGroups

            const renderCard = (g) => {
              const isJoined = userGroupIds.has(g.id)
              const isOwner  = g.created_by === user?.id
              return (
                <div key={g.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer" onClick={() => navigate(`/groups/${g.id}`)}>
                  <div className={`h-24 text-4xl bg-gradient-to-br ${g.cover_color} flex items-center justify-center relative`}>
                    {g.emoji}
                    {isOwner && <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-bold rounded-full">YOUR GROUP</span>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmt(g.member_count ?? 0)} members</p>
                    {g.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{g.description}</p>}
                    <button onClick={e => { e.stopPropagation(); handleJoinGroup(g.id) }}
                      className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors ${isJoined ? 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400' : 'bg-primary text-white hover:bg-primary/90'}`}>
                      {isJoined ? '✓ Joined · Leave' : 'Join Group'}
                    </button>
                  </div>
                </div>
              )
            }

            if (visible.length === 0) return (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                  {groupsFilter === 'mine' ? '👤' : '👥'}
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-1">
                    {groupsFilter === 'mine' ? "You haven't joined any groups yet" : 'No groups yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {groupsFilter === 'mine' ? 'Discover groups below and join the ones that interest you' : 'Create the first group and invite creators to join'}
                  </p>
                </div>
                {groupsFilter === 'mine' ? (
                  <button onClick={() => setGroupsFilter('discover')} className="px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/70 transition-colors">
                    Browse Groups
                  </button>
                ) : (
                  <button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Create a Group
                  </button>
                )}
              </div>
            )

            return (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  {groupsFilter === 'mine' ? `${myGroups.length} group${myGroups.length !== 1 ? 's' : ''} you're part of` : `${discoverGroups.length} group${discoverGroups.length !== 1 ? 's' : ''} to explore`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visible.map(g => renderCard(g))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ══ CHALLENGES ══════════════════════════════════════════════════════ */}
      {tab === 'challenges' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 bg-muted rounded-xl p-1">
                {[{ id: 'all', label: '⚡ All' }, { id: 'platform', label: '🏅 Official' }, { id: 'creator', label: '👤 Creator' }].map(f => (
                  <button key={f.id} onClick={() => setChallengeTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${challengeTypeFilter === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {user?.id && (
                <button
                  onClick={() => setMyContentOnly(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${myContentOnly ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  👤 Mine
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Pro/ProMax users can create creator challenges */}
              {(isPro || isProMax) && (
                <button onClick={() => setShowCreateCreatorChallenge(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> My Challenge
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowCreateChallenge(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Official Challenge
                </button>
              )}
            </div>
          </div>

          {/* Challenges grid */}
          {(() => {
            // Use algorithmically-scored arrays, then apply filters on top
            let active = [...scoredChallenges.active]
            let ended  = [...scoredChallenges.ended]
            if (challengeTypeFilter !== 'all') {
              active = active.filter(c => (c.challenge_type ?? 'platform') === challengeTypeFilter)
              ended  = ended.filter(c => (c.challenge_type ?? 'platform') === challengeTypeFilter)
            }
            if (myContentOnly && user?.id) {
              active = active.filter(c => c.created_by === user.id)
              ended  = ended.filter(c => c.created_by === user.id)
            }
            const allC = [...active, ...ended]

            if (allC.length === 0) return (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">🎯</div>
                <div>
                  <p className="text-base font-bold text-foreground mb-1">
                    {myContentOnly ? "You haven't created any challenges yet" : challengeTypeFilter === 'creator' ? 'No creator challenges yet' : 'No challenges yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {challengeTypeFilter === 'creator' ? 'Pro/ProMax creators can launch challenges for their followers' : 'Launch the first challenge — set a task, a prize, and a deadline'}
                  </p>
                </div>
                {isAdmin && challengeTypeFilter !== 'creator' && (
                  <button onClick={() => setShowCreateChallenge(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Create a Challenge
                  </button>
                )}
                {(isPro || isProMax) && challengeTypeFilter !== 'platform' && (
                  <button onClick={() => setShowCreateCreatorChallenge(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-colors">
                    <Plus className="w-4 h-4" /> Launch My Challenge
                  </button>
                )}
              </div>
            )

            const ChallengeCard = ({ c }) => {
              const meta    = CHALLENGE_TYPE_META[c.type] ?? CHALLENGE_TYPE_META.general
              const entered = userChallengeIds.has(c.id)
              const isCreatorChallenge = (c.challenge_type ?? 'platform') === 'creator'
              return (
                <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-28 bg-gradient-to-br ${meta.color} flex items-center justify-center text-5xl relative`}>
                    {meta.emoji}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {isCreatorChallenge ? (
                        <span className="px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          👤 Creator Challenge
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/80 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          🏅 Official
                        </span>
                      )}
                    </div>
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur text-white text-xs rounded-full font-medium capitalize">{c.type}</span>
                    {c.hashtag && <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur text-white text-xs rounded-full">{c.hashtag}</span>}
                  </div>
                  <div className="p-4 space-y-2.5">
                    {/* Creator attribution for creator challenges */}
                    {isCreatorChallenge && c.creator_name && (
                      <div className="flex items-center gap-2">
                        <Avatar name={c.creator_name} url={c.creator_avatar} size={5} />
                        <span className="text-xs text-muted-foreground">by <span className="text-foreground font-medium">{c.creator_name}</span></span>
                      </div>
                    )}
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    {c.prize && (
                      <div className={`rounded-xl p-2.5 border ${isCreatorChallenge ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <p className={`text-xs font-semibold flex items-center gap-1 ${isCreatorChallenge ? 'text-blue-400' : 'text-amber-400'}`}><Gift className="w-3 h-3" />{isCreatorChallenge ? 'Creator Prize' : 'Prize / Reward'}</p>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed">{c.prize}</p>
                      </div>
                    )}
                    {c.rules && (
                      <div className="bg-muted/20 rounded-xl p-2.5">
                        <p className="text-xs text-muted-foreground font-semibold mb-0.5">Rules</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{c.rules}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" />{c.ends_at ? timeUntil(c.ends_at) : 'No deadline'}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.entry_count ?? 0} entries</span>
                    </div>
                    <div className="flex gap-2">
                      {entered ? (
                        <button disabled className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400">✓ Entered</button>
                      ) : (
                        <button onClick={() => setEnteringChallenge(c)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
                          Enter Challenge
                        </button>
                      )}
                      <button onClick={() => setViewingEntries(c)}
                        className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                        {c.entry_count ?? 0} Entries
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(c => <ChallengeCard key={c.id} c={c} />)}
                </div>

                {ended.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-foreground mb-4">🏁 Past Challenges</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ended.map(c => {
                        const meta = CHALLENGE_TYPE_META[c.type] ?? CHALLENGE_TYPE_META.general
                        return (
                          <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden opacity-80">
                            <div className={`h-20 bg-gradient-to-br ${meta.color} flex items-center justify-center text-4xl relative`}>
                              {meta.emoji}
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">ENDED</span>
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-semibold text-foreground">{c.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{c.entry_count ?? 0} entries</p>
                              {c.prize && <p className="text-xs text-amber-400 mt-1 line-clamp-1">Prize: {c.prize}</p>}
                              {c.winner_name && <p className="text-xs text-amber-400 font-semibold mt-1">🏆 Winner: {c.winner_name}</p>}
                              <button onClick={() => setViewingEntries(c)}
                                className="w-full mt-2 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                                See Entries
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* ══ EVENTS ══════════════════════════════════════════════════════════ */}
      {tab === 'events' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">📅 Upcoming Events</h2>
              {user?.id && (
                <button
                  onClick={() => setMyContentOnly(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${myContentOnly ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  👤 Mine
                </button>
              )}
            </div>
            <button onClick={() => setShowCreateEvent(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Event
            </button>
          </div>

          {(() => {
            const visibleEvents = myContentOnly && user?.id
              ? scoredEvents.filter(e => e.created_by === user.id || e.organizer_id === user.id)
              : scoredEvents
            if (visibleEvents.length === 0) return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">📅</div>
              <div>
                <p className="text-base font-bold text-foreground mb-1">{myContentOnly ? "You haven't created any events yet" : 'No events yet'}</p>
                <p className="text-sm text-muted-foreground">{myContentOnly ? 'Create an event for the community' : 'Create a webinar, workshop, or meetup for the community'}</p>
              </div>
              <button onClick={() => setShowCreateEvent(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Create an Event
              </button>
            </div>
            )
            return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleEvents.map(e => {
                const isRsvpd    = userEventRsvps.has(e.id)
                const hostName   = e.organizer_name ?? e.host_name ?? 'Philomni'
                const hostAvatar = e.organizer_avatar ?? e.host_avatar ?? null
                const now        = Date.now()
                const isLive     = e.starts_at && e.ends_at && now >= new Date(e.starts_at).getTime() && now <= new Date(e.ends_at).getTime()
                const joinUrl    = e.join_url ?? (e.location?.startsWith('http') ? e.location : null)
                const duration   = e.ends_at && e.starts_at
                  ? (() => { const h = Math.round((new Date(e.ends_at) - new Date(e.starts_at)) / 3600000); return h > 0 ? `${h}h` : '<1h' })()
                  : null
                const typeEmoji = { webinar: '🎙', workshop: '🛠', masterclass: '🎓', networking: '🤝', showcase: '🎤', conference: '🏛' }[e.type] ?? '📅'
                return (
                  <div key={e.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                    <div className="h-28 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-5xl relative">
                      {typeEmoji}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className="px-2 py-0.5 bg-black/40 backdrop-blur text-white text-xs rounded-full font-medium capitalize">{e.type}</span>
                        {e.is_free
                          ? <span className="px-2 py-0.5 bg-emerald-500/80 text-white text-xs rounded-full font-medium">Free</span>
                          : <span className="px-2 py-0.5 bg-amber-500/80 text-white text-xs rounded-full font-medium">${e.price}</span>
                        }
                        {isLive && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">● LIVE</span>}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{e.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400" />{e.starts_at ? new Date(e.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        {duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{duration}</span>}
                      </div>
                      {e.location && !e.location.startsWith('http') && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Globe className="w-3 h-3" />{e.location}</div>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar name={hostName} url={hostAvatar} size={5} />
                        <span>{hostName} · {fmt(e.attendee_count ?? 0)} attending</span>
                      </div>

                      {/* Join link — shown only after RSVP */}
                      {isRsvpd && joinUrl && (
                        <a href={joinUrl} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-center ${isLive ? 'bg-red-500 text-white hover:bg-red-400 animate-pulse' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}>
                          <ExternalLink className="w-3 h-3" />
                          {isLive ? '🔴 Join Now — Event is Live!' : 'Join Link (saved for when it starts)'}
                        </a>
                      )}

                      <div className="flex gap-2 pt-1">
                        {isRsvpd ? (
                          <button onClick={() => handleEventRsvp(e.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                            ✓ RSVP'd · Cancel
                          </button>
                        ) : !e.is_free && e.price > 0 ? (
                          <button onClick={() => setPayingEvent(e)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-400 transition-colors">
                            🎟 Buy Ticket — ${parseFloat(e.price).toFixed(2)}
                          </button>
                        ) : (
                          <button onClick={() => handleEventRsvp(e.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
                            RSVP — Free
                          </button>
                        )}
                        <button onClick={() => setSharingEvent(e)}
                          className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                          <Share2 className="w-3 h-3" />
                        </button>
                        {/* Scan button for organizer/admin — physical events or any event they own */}
                        {(isAdmin || e.created_by === user?.id || e.organizer_id === user?.id) && (
                          <button onClick={() => setScanningEvent(e)}
                            title="Scan tickets"
                            className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            )
          })()}
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
              {dbLeaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <Trophy className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No points earned yet. Post, comment, and enter challenges to get on the board.</p>
                </div>
              ) : null}
              {dbLeaderboard.map((creator, i) => (
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground">📣 Official Announcements</h2>
            {isAdmin && (
              <button onClick={() => setShowCreateAnn(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New Announcement
              </button>
            )}
          </div>

          {dbAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">📣</div>
              <div>
                <p className="text-base font-bold text-foreground mb-1">No announcements yet</p>
                <p className="text-sm text-muted-foreground">Post important updates for the whole community to see</p>
              </div>
              <button onClick={() => setShowCreateAnn(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Post an Announcement
              </button>
            </div>
          ) : dbAnnouncements.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
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
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {Object.entries(a.reactions ?? {}).map(([emoji, count]) => {
                  const key = `${a.id}-${emoji}`
                  const reacted = !!reactionMap[key]
                  return (
                    <button key={emoji}
                      onClick={() => handleAnnouncementReact(a.id, emoji, true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${reacted ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {emoji} <span>{count ?? 0}</span>
                    </button>
                  )
                })}
              </div>
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
      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} saving={savingPost} boards={communityMode === 'pro' ? PRO_BOARDS : BOARDS} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onSubmit={handleCreateGroup} saving={savingCreate} />}
      {showCreateChallenge && <CreateChallengeModal onClose={() => setShowCreateChallenge(false)} onSubmit={handleCreateChallenge} saving={savingCreate} />}
      {showCreateEvent && <CreateEventModal onClose={() => setShowCreateEvent(false)} onSubmit={handleCreateEvent} saving={savingCreate} />}
      {showCreateAnn && <CreateAnnouncementModal onClose={() => setShowCreateAnn(false)} onSubmit={handleCreateAnn} saving={savingCreate} />}
      {enteringChallenge && <ChallengeEntryModal challenge={enteringChallenge} user={user} onClose={() => setEnteringChallenge(null)} onSubmit={handleSubmitEntry} saving={savingEntry} />}
      {viewingEntries && <ChallengeEntriesModal challenge={viewingEntries} isAdmin={isAdmin} currentUserId={user?.id} onClose={() => setViewingEntries(null)} onPickWinner={handlePickWinner} />}
      {sharingEvent && <EventShareModal event={sharingEvent} onClose={() => setSharingEvent(null)} />}
      {payingEvent && <EventPaymentModal event={payingEvent} user={user} onSuccess={handleEventPaymentSuccess} onClose={() => setPayingEvent(null)} />}
      {ticketEvent && <TicketModal event={ticketEvent.event} user={user} status={ticketEvent.status} onClose={() => setTicketEvent(null)} />}
      {scanningEvent && <ScanTicketModal event={scanningEvent} onClose={() => setScanningEvent(null)} />}
      {showCreateCreatorChallenge && <CreateCreatorChallengeModal onClose={() => setShowCreateCreatorChallenge(false)} onSubmit={handleCreateCreatorChallenge} saving={savingCreate} />}
    </div>
  )
}
