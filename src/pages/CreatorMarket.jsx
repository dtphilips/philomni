import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Search, Plus, X, Star, Heart, Play, Pause, ShoppingBag,
  Download, Clock, Users, BookOpen, Package, Mic2, Film,
  Music, Briefcase, Globe, Zap, Loader2, MessageSquare,
  Filter, ArrowDown,
} from 'lucide-react'

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',      label: 'All',                    icon: '🏪', color: 'bg-gray-500/20 text-gray-400' },
  { id: 'scripts',  label: 'Scripts & Stories',      icon: '🎬', color: 'bg-violet-500/20 text-violet-400' },
  { id: 'music',    label: 'Music & Audio',           icon: '🎵', color: 'bg-pink-500/20 text-pink-400' },
  { id: 'digital',  label: 'Digital Products',       icon: '🎨', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'courses',  label: 'Courses & Knowledge',    icon: '📚', color: 'bg-amber-500/20 text-amber-400' },
  { id: 'services', label: 'Services',               icon: '🤝', color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'physical', label: 'Physical & Used',        icon: '📦', color: 'bg-orange-500/20 text-orange-400' },
  { id: 'collabs',  label: 'Collabs & Opportunities',icon: '🌟', color: 'bg-rose-500/20 text-rose-400' },
]

const PRICE_FILTERS = [
  { label: 'Any Price', min: 0,   max: Infinity },
  { label: 'Under $10', min: 0,   max: 10 },
  { label: '$10–$50',   min: 10,  max: 50 },
  { label: '$50–$100',  min: 50,  max: 100 },
  { label: '$100+',     min: 100, max: Infinity },
]

const SELLER_LEVELS = {
  new:    { label: 'New',        cls: 'bg-muted text-muted-foreground' },
  rising: { label: 'Rising ⭐',  cls: 'bg-blue-500/20 text-blue-400' },
  top:    { label: 'Top 🏆',    cls: 'bg-amber-500/20 text-amber-400' },
}

// ─── Sample listings (15 across all categories) ───────────────────────────────

const SAMPLES = [
  {
    id: 'sample-1', category: 'scripts', subcategory: 'Film Script',
    title: 'NEON PULSE — Cyberpunk Feature Script', seller_name: 'Marcus Cole',
    seller_avatar: null, seller_level: 'top', rating: 4.9, review_count: 34,
    price: 149, description: 'A gritty cyberpunk thriller set in 2089 Neo-Tokyo. 110 pages. Registered WGA.',
    cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80',
    tags: ['sci-fi', 'thriller', 'feature'], is_featured: true, purchase_count: 12,
    metadata: { genre: 'Sci-Fi Thriller', page_count: 110, logline: 'A rogue detective hunts a ghost hacker through the neon-soaked megacity of Neo-Tokyo.', wga_registered: true },
  },
  {
    id: 'sample-2', category: 'music', subcategory: 'Beat License',
    title: 'MIDNIGHT DRIP — Trap Beat 140BPM', seller_name: 'Lex Wavez',
    seller_avatar: null, seller_level: 'rising', rating: 4.7, review_count: 89,
    price: 29, description: 'Hard-hitting trap beat with 808s, melodic piano, and crisp hi-hats. Stems included on exclusive.',
    cover: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80',
    tags: ['trap', '808', 'melodic'], is_featured: true, purchase_count: 203,
    audio_preview: null,
    metadata: { genre: 'Trap', bpm: 140, key: 'C# minor', license_nonexclusive: 29, license_exclusive: 299, license_unlimited: 999 },
  },
  {
    id: 'sample-3', category: 'digital', subcategory: 'Lightroom Presets',
    title: 'GOLDEN HOUR — 50 Cinematic Lightroom Presets', seller_name: 'Sofia Reyes',
    seller_avatar: null, seller_level: 'top', rating: 4.8, review_count: 421,
    price: 39, description: '50 professional presets for golden hour, travel, and lifestyle photography. One-click install.',
    cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    tags: ['lightroom', 'presets', 'photography'], is_featured: false, purchase_count: 1840,
    metadata: { file_type: 'XMP / DNG', compatible: 'Lightroom Classic, Mobile, CC', instant_download: true },
  },
  {
    id: 'sample-4', category: 'courses', subcategory: 'Video Production',
    title: 'YouTube Growth Blueprint — From 0 to 100K', seller_name: 'Alex Turner',
    seller_avatar: null, seller_level: 'top', rating: 4.9, review_count: 672,
    price: 97, description: 'Everything you need to grow your YouTube channel in 2025. 48 lessons, 12 hours of content.',
    cover: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
    tags: ['youtube', 'growth', 'content creation'], is_featured: true, purchase_count: 3200,
    metadata: { lessons: 48, duration: '12h', skill_level: 'Beginner–Intermediate', certificate: true, skills: ['YouTube SEO', 'Thumbnail Design', 'Scripting', 'Retention'] },
  },
  {
    id: 'sample-5', category: 'services', subcategory: 'Video Editing',
    title: 'Professional Short-Form Video Editing (Reels/TikTok)', seller_name: 'Kai Studio',
    seller_avatar: null, seller_level: 'top', rating: 5.0, review_count: 156,
    price: 49, description: 'Cinematic edits for Reels, TikTok, and YouTube Shorts with captions, music, and effects.',
    cover: 'https://images.unsplash.com/photo-1574717024453-354056afd6fc?w=400&q=80',
    tags: ['reels', 'editing', 'tiktok'], is_featured: true, purchase_count: 890,
    metadata: { delivery_days: 2, revisions: 3, response_time: '< 1 hour' },
    packages: [
      { name: 'Basic',    price: 49,  delivery: 3, revisions: 2, description: '1 video up to 60s, basic captions' },
      { name: 'Standard', price: 99,  delivery: 2, revisions: 3, description: '3 videos up to 90s, captions + music' },
      { name: 'Premium',  price: 199, delivery: 1, revisions: 5, description: '5 videos, full cinematic edit, captions, SFX' },
    ],
  },
  {
    id: 'sample-6', category: 'scripts', subcategory: 'YouTube Script',
    title: '10 Viral YouTube Script Templates — Hook to CTA', seller_name: 'Dana Writes',
    seller_avatar: null, seller_level: 'rising', rating: 4.6, review_count: 48,
    price: 25, description: 'Proven script frameworks for educational, storytime, and listicle YouTube videos. Fully editable.',
    cover: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80',
    tags: ['youtube', 'scripts', 'templates'], is_featured: false, purchase_count: 176,
    metadata: { genre: 'Educational', page_count: 30, logline: '10 battle-tested script templates to hook viewers in the first 15 seconds.', wga_registered: false },
  },
  {
    id: 'sample-7', category: 'music', subcategory: 'Jingle',
    title: 'Custom Brand Jingle — 15s, 30s, 60s Cuts', seller_name: 'BeatLab Pro',
    seller_avatar: null, seller_level: 'top', rating: 4.8, review_count: 63,
    price: 199, description: 'Fully custom brand audio identity. Delivered in WAV + MP3. Royalty-free commercial license included.',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    tags: ['jingle', 'branding', 'commercial'], is_featured: false, purchase_count: 44,
    metadata: { genre: 'Commercial', bpm: null, key: null, license_nonexclusive: null, license_exclusive: 199, license_unlimited: 499 },
  },
  {
    id: 'sample-8', category: 'digital', subcategory: 'Video LUTs',
    title: 'CINEMA PACK — 30 Professional Video LUTs', seller_name: 'ColorGrade Co',
    seller_avatar: null, seller_level: 'top', rating: 4.7, review_count: 234,
    price: 29, description: 'Hollywood-grade LUTs for Premiere Pro, DaVinci Resolve, and Final Cut. Cinematic looks instantly.',
    cover: 'https://images.unsplash.com/photo-1536240478700-b869ad10a2ab?w=400&q=80',
    tags: ['luts', 'color grading', 'premiere'], is_featured: false, purchase_count: 2100,
    metadata: { file_type: '.CUBE / .LOOK', compatible: 'Premiere Pro, DaVinci, FCPX', instant_download: true },
  },
  {
    id: 'sample-9', category: 'collabs', subcategory: 'Brand Deal',
    title: 'Paid UGC Campaign — Fitness App (5 Creators Needed)', seller_name: 'FitNation App',
    seller_avatar: null, seller_level: 'new', rating: 0, review_count: 0,
    price: 500, description: "We're looking for 5 UGC creators to film authentic workout content for our app launch. $500 per creator.",
    cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    tags: ['ugc', 'fitness', 'paid'], is_featured: true, purchase_count: 0,
    metadata: { budget: '$500 per creator', requirements: '5K+ followers, fitness niche', deadline: '2025-06-01', opportunity_type: 'Brand Deal' },
  },
  {
    id: 'sample-10', category: 'services', subcategory: 'Ghostwriting',
    title: 'Newsletter & Blog Ghostwriting — Weekly Content', seller_name: 'PenCraft Agency',
    seller_avatar: null, seller_level: 'rising', rating: 4.5, review_count: 29,
    price: 79, description: 'SEO-optimized blog posts and newsletters written in your voice. Research included.',
    cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
    tags: ['writing', 'newsletter', 'blog'], is_featured: false, purchase_count: 88,
    metadata: { delivery_days: 3, revisions: 2, response_time: '< 4 hours' },
    packages: [
      { name: 'Basic',    price: 79,  delivery: 5, revisions: 1, description: '1 blog post up to 800 words' },
      { name: 'Standard', price: 149, delivery: 3, revisions: 2, description: '2 posts up to 1200 words + SEO' },
      { name: 'Premium',  price: 299, delivery: 3, revisions: 3, description: '4 posts + newsletter + SEO strategy' },
    ],
  },
  {
    id: 'sample-11', category: 'physical', subcategory: 'Camera Gear',
    title: 'Sony A7III + 24-70mm Lens — Excellent Condition', seller_name: 'GearSwap_NYC',
    seller_avatar: null, seller_level: 'new', rating: 4.3, review_count: 7,
    price: 1800, description: 'Lightly used Sony A7III body with 24-70mm f/2.8 lens. ~8000 shutter count. Original box.',
    cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    tags: ['sony', 'camera', 'mirrorless'], is_featured: false, purchase_count: 0,
    metadata: { condition: 'Like New', location: 'New York, NY', shipping: true, shipping_cost: 35 },
  },
  {
    id: 'sample-12', category: 'courses', subcategory: 'Mentorship',
    title: '1-on-1 Podcast Launch Mentorship — 4 Sessions', seller_name: 'Podcast Queens',
    seller_avatar: null, seller_level: 'top', rating: 5.0, review_count: 22,
    price: 249, description: 'Launch your podcast the right way. 4 x 60-min sessions: setup, branding, recording, growth.',
    cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
    tags: ['podcast', 'mentorship', 'launch'], is_featured: false, purchase_count: 31,
    metadata: { lessons: 4, duration: '4h', skill_level: 'Beginner', certificate: false, skills: ['Podcast Setup', 'Audio Quality', 'Distribution', 'Audience Growth'] },
  },
  {
    id: 'sample-13', category: 'music', subcategory: 'Beat License',
    title: 'AFROBEATS FIRE — 95BPM E Major', seller_name: 'Lex Wavez',
    seller_avatar: null, seller_level: 'rising', rating: 4.8, review_count: 41,
    price: 35, description: 'Premium Afrobeats instrumental with live guitar, brass stabs, and deep percussion layers.',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    tags: ['afrobeats', 'afropop', 'dancehall'], is_featured: false, purchase_count: 67,
    audio_preview: null,
    metadata: { genre: 'Afrobeats', bpm: 95, key: 'E major', license_nonexclusive: 35, license_exclusive: 349, license_unlimited: 999 },
  },
  {
    id: 'sample-14', category: 'digital', subcategory: 'Brand Kit',
    title: 'Complete Creator Brand Kit — Logo, Templates, Colors', seller_name: 'BrandForge',
    seller_avatar: null, seller_level: 'top', rating: 4.9, review_count: 183,
    price: 59, description: 'Everything to launch your personal brand: logo variations, Instagram templates, color palettes, fonts.',
    cover: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80',
    tags: ['branding', 'logo', 'templates'], is_featured: true, purchase_count: 760,
    metadata: { file_type: 'AI / PSD / Canva', compatible: 'Adobe, Canva, Figma', instant_download: true },
  },
  {
    id: 'sample-15', category: 'collabs', subcategory: 'Casting Call',
    title: 'Voice Actors Wanted — Animated Series Pilot', seller_name: 'Studio Phantom',
    seller_avatar: null, seller_level: 'rising', rating: 0, review_count: 0,
    price: 0, description: 'Looking for 3 voice actors for an animated sci-fi pilot. SAG-AFTRA welcome. Paid opportunity.',
    cover: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80',
    tags: ['voice acting', 'animation', 'casting'], is_featured: false, purchase_count: 0,
    metadata: { budget: 'Paid — TBD', requirements: 'Demo reel required', deadline: '2025-05-20', opportunity_type: 'Casting Call' },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function Stars({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  )
}

function CatBadge({ catId }) {
  const cat = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[0]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
      {cat.icon} {cat.label}
    </span>
  )
}

function LevelBadge({ level }) {
  const lv = SELLER_LEVELS[level] ?? SELLER_LEVELS.new
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${lv.cls}`}>{lv.label}</span>
}

// ─── Mini Audio Player ────────────────────────────────────────────────────────

function MiniAudioPlayer({ src }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)
  const toggle = (e) => {
    e.stopPropagation()
    if (!ref.current) { setPlaying(!playing); return }
    if (playing) { ref.current.pause(); setPlaying(false) }
    else { ref.current.play().catch(() => {}); setPlaying(true) }
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={toggle}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0">
        {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
      </button>
      <div className="flex gap-0.5 items-end h-5">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className={`w-1 rounded-full ${playing ? 'bg-primary' : 'bg-muted-foreground/40'}`}
            style={{ height: `${20 + Math.sin(i * 0.8) * 60}%` }} />
        ))}
      </div>
      {src && <audio ref={ref} src={src} onEnded={() => setPlaying(false)} />}
    </div>
  )
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, onView, onSave, saved }) {
  const isService = listing.category === 'services'
  const isMusic   = listing.category === 'music'
  const isCollab  = listing.category === 'collabs'
  const basePrice = isService && listing.packages?.length
    ? listing.packages[0]?.price
    : listing.price

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group flex flex-col"
      onClick={() => onView(listing)}
    >
      {/* Cover image */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {listing.cover
          ? <img src={listing.cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{CATEGORIES.find(c => c.id === listing.category)?.icon ?? '🏪'}</div>
        }
        {listing.is_featured && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">⭐ Featured</span>
        )}
        {listing.metadata?.instant_download && (
          <span className="absolute top-2 right-8 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Download className="w-3 h-3" /> Instant
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onSave(listing.id) }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors">
          <Heart className={`w-4 h-4 ${saved ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
        </button>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CatBadge catId={listing.category} />
          <LevelBadge level={listing.seller_level ?? 'new'} />
        </div>

        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{listing.title}</h3>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
            {listing.seller_avatar
              ? <img src={listing.seller_avatar} alt="" className="w-full h-full object-cover" />
              : listing.seller_name?.[0] ?? '?'}
          </div>
          <span className="text-xs text-muted-foreground truncate">{listing.seller_name}</span>
        </div>

        {listing.review_count > 0 && <Stars rating={listing.rating ?? 0} count={listing.review_count ?? 0} />}

        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{listing.description}</p>

        {/* Beat metadata */}
        {isMusic && listing.metadata?.bpm && (
          <div className="flex gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">🥁 {listing.metadata.bpm} BPM</span>
            <span className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">🎵 {listing.metadata.key}</span>
            {listing.metadata.license_nonexclusive && (
              <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">Non-Excl ${listing.metadata.license_nonexclusive}</span>
            )}
          </div>
        )}

        {isMusic && (
          <div onClick={e => e.stopPropagation()}>
            <MiniAudioPlayer src={listing.audio_preview} />
          </div>
        )}

        {isCollab && listing.metadata?.budget && (
          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full text-xs font-medium w-fit">
            💰 {listing.metadata.budget}
          </span>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-base font-bold">
            {isCollab && listing.price === 0
              ? <span className="text-xs text-muted-foreground">Paid (TBD)</span>
              : <span className="text-primary">{isService ? 'From ' : ''}${fmt(basePrice)}</span>
            }
          </span>
          <button
            onClick={e => { e.stopPropagation(); onView(listing) }}
            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors">
            {isCollab ? 'Apply' : isService ? 'Hire' : 'View'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Listing Detail Modal ─────────────────────────────────────────────────────

function ListingModal({ listing, onClose, saved, onSave }) {
  const [pkgIdx, setPkgIdx]         = useState(0)
  const [licenseType, setLicenseType] = useState('nonexclusive')

  const isService  = listing.category === 'services'
  const isMusic    = listing.category === 'music'
  const isCollab   = listing.category === 'collabs'
  const isScript   = listing.category === 'scripts'
  const isCourse   = listing.category === 'courses'
  const isDigital  = listing.category === 'digital'
  const isPhysical = listing.category === 'physical'
  const pkg        = listing.packages?.[pkgIdx]
  const licPrices  = {
    nonexclusive: listing.metadata?.license_nonexclusive,
    exclusive:    listing.metadata?.license_exclusive,
    unlimited:    listing.metadata?.license_unlimited,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl">
        <div className="relative h-52 bg-muted overflow-hidden">
          {listing.cover
            ? <img src={listing.cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">{CATEGORIES.find(c => c.id === listing.category)?.icon}</div>
          }
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          {listing.is_featured && <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">⭐ Featured</span>}
        </div>

        <div className="p-6 space-y-5">
          {/* Title + seller */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CatBadge catId={listing.category} />
              <h2 className="text-xl font-bold text-foreground mt-2">{listing.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                  {listing.seller_avatar ? <img src={listing.seller_avatar} alt="" className="w-full h-full object-cover" /> : listing.seller_name?.[0]}
                </div>
                <span className="text-sm text-muted-foreground">{listing.seller_name}</span>
                <LevelBadge level={listing.seller_level ?? 'new'} />
              </div>
              {listing.review_count > 0 && <div className="mt-1"><Stars rating={listing.rating} count={listing.review_count} /></div>}
            </div>
            <button onClick={() => onSave(listing.id)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors flex-shrink-0">
              <Heart className={`w-5 h-5 ${saved ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'}`} />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

          {/* Music */}
          {isMusic && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-2xl p-4">
                <MiniAudioPlayer src={listing.audio_preview} />
                {listing.metadata?.bpm && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-muted rounded text-xs">🥁 {listing.metadata.bpm} BPM</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs">🎵 {listing.metadata.key}</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs">🎼 {listing.metadata.genre}</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">Choose License</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'nonexclusive', label: 'Non-Exclusive', sub: 'Others can also buy',           price: licPrices.nonexclusive },
                  { id: 'exclusive',    label: 'Exclusive',     sub: 'Only you own it',               price: licPrices.exclusive },
                  { id: 'unlimited',    label: 'Unlimited',     sub: 'Unlimited commercial + stems',  price: licPrices.unlimited },
                ].filter(l => l.price).map(l => (
                  <button key={l.id} onClick={() => setLicenseType(l.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${licenseType === l.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className="text-sm font-bold text-foreground">{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.sub}</p>
                    <p className="text-lg font-bold text-primary mt-2">${l.price}</p>
                  </button>
                ))}
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                Purchase {licenseType.charAt(0).toUpperCase() + licenseType.slice(1)} License — ${licPrices[licenseType]}
              </button>
            </div>
          )}

          {/* Scripts */}
          {isScript && listing.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-muted/40 rounded-xl p-3"><p className="text-xs text-muted-foreground">Genre</p><p className="text-sm font-semibold text-foreground mt-0.5">{listing.metadata.genre}</p></div>
                <div className="bg-muted/40 rounded-xl p-3"><p className="text-xs text-muted-foreground">Pages</p><p className="text-sm font-semibold text-foreground mt-0.5">{listing.metadata.page_count}</p></div>
                <div className="bg-muted/40 rounded-xl p-3"><p className="text-xs text-muted-foreground">WGA</p><p className="text-sm font-semibold text-foreground mt-0.5">{listing.metadata.wga_registered ? '✅ Registered' : '—'}</p></div>
              </div>
              {listing.metadata.logline && (
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Logline</p>
                  <p className="text-sm text-foreground italic">"{listing.metadata.logline}"</p>
                </div>
              )}
              <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                Purchase Script — ${listing.price}
              </button>
            </div>
          )}

          {/* Services */}
          {isService && listing.packages?.length > 0 && (
            <div className="space-y-3">
              <div className="flex rounded-xl bg-muted p-1">
                {listing.packages.map((p, i) => (
                  <button key={i} onClick={() => setPkgIdx(i)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${pkgIdx === i ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              {pkg && (
                <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-foreground">{pkg.description}</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-xs text-muted-foreground">Delivery</p><p className="text-sm font-bold text-foreground">{pkg.delivery}d</p></div>
                    <div><p className="text-xs text-muted-foreground">Revisions</p><p className="text-sm font-bold text-foreground">{pkg.revisions}</p></div>
                    <div><p className="text-xs text-muted-foreground">Price</p><p className="text-sm font-bold text-primary">${pkg.price}</p></div>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                    Order {pkg.name} — ${pkg.price}
                  </button>
                </div>
              )}
              {listing.metadata?.response_time && (
                <p className="text-xs text-muted-foreground text-center">⚡ Avg response: {listing.metadata.response_time}</p>
              )}
            </div>
          )}

          {/* Courses */}
          {isCourse && listing.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '📖', label: 'Lessons',     value: listing.metadata.lessons },
                  { icon: '⏱',  label: 'Duration',    value: listing.metadata.duration },
                  { icon: '🎯', label: 'Level',        value: listing.metadata.skill_level },
                  { icon: '🏆', label: 'Certificate',  value: listing.metadata.certificate ? 'Included' : 'No' },
                ].map(m => (
                  <div key={m.label} className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-xl mb-1">{m.icon}</p>
                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              {listing.metadata.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills you'll gain</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.metadata.skills.map(s => (
                      <span key={s} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                Enroll Now — ${listing.price}
              </button>
            </div>
          )}

          {/* Digital */}
          {isDigital && listing.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-xl p-3"><p className="text-xs text-muted-foreground">File Type</p><p className="text-sm font-semibold text-foreground mt-0.5">{listing.metadata.file_type}</p></div>
                <div className="bg-muted/40 rounded-xl p-3"><p className="text-xs text-muted-foreground">Compatible With</p><p className="text-sm font-semibold text-foreground mt-0.5">{listing.metadata.compatible}</p></div>
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Buy & Download — ${listing.price}
              </button>
            </div>
          )}

          {/* Physical */}
          {isPhysical && listing.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Condition', value: listing.metadata.condition },
                  { label: 'Location',  value: listing.metadata.location },
                  { label: 'Shipping',  value: listing.metadata.shipping ? `$${listing.metadata.shipping_cost}` : 'Local only' },
                  { label: 'Price',     value: `$${fmt(listing.price)}` },
                ].map(m => (
                  <div key={m.label} className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                Contact Seller — ${fmt(listing.price)}
              </button>
            </div>
          )}

          {/* Collabs */}
          {isCollab && listing.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Opportunity',    value: listing.metadata.opportunity_type },
                  { label: 'Compensation',   value: listing.metadata.budget },
                  { label: 'Requirements',   value: listing.metadata.requirements },
                  { label: 'Deadline',       value: listing.metadata.deadline },
                ].map(m => (
                  <div key={m.label} className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-400 transition-colors">
                Submit Application
              </button>
            </div>
          )}

          <button className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Message {listing.seller_name}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sell Modal ───────────────────────────────────────────────────────────────

function SellModal({ onClose, onSubmit, saving }) {
  const [cat, setCat] = useState('scripts')
  const [form, setForm] = useState({})
  const [pkgs, setPkgs] = useState([
    { name: 'Basic',    price: '', delivery: '', revisions: '', description: '' },
    { name: 'Standard', price: '', delivery: '', revisions: '', description: '' },
    { name: 'Premium',  price: '', delivery: '', revisions: '', description: '' },
  ])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPkg = (i, k, v) => setPkgs(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      category: cat,
      title: form.title || '',
      description: form.description || '',
      price: parseFloat(form.price ?? 0) || 0,
      tags: (form.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
      metadata: {},
      packages: null,
    }
    if (cat === 'scripts')  payload.metadata = { genre: form.genre, page_count: parseInt(form.page_count) || 0, logline: form.logline, wga_registered: !!form.wga }
    if (cat === 'music')    payload.metadata = { genre: form.genre, bpm: parseInt(form.bpm) || null, key: form.key, license_nonexclusive: parseFloat(form.price_ne) || null, license_exclusive: parseFloat(form.price_ex) || null, license_unlimited: parseFloat(form.price_ul) || null }
    if (cat === 'digital')  payload.metadata = { file_type: form.file_type, compatible: form.compatible, instant_download: true }
    if (cat === 'courses')  payload.metadata = { lessons: parseInt(form.lessons) || 0, duration: form.duration, skill_level: form.skill_level, certificate: !!form.certificate, skills: (form.skills ?? '').split(',').map(s => s.trim()).filter(Boolean) }
    if (cat === 'services') { payload.metadata = { delivery_days: parseInt(form.delivery_days) || 3, revisions: parseInt(form.revisions) || 1, response_time: form.response_time }; payload.packages = pkgs }
    if (cat === 'physical') payload.metadata = { condition: form.condition, location: form.location, shipping: !!form.shipping, shipping_cost: parseFloat(form.shipping_cost) || 0 }
    if (cat === 'collabs')  payload.metadata = { opportunity_type: form.opp_type, budget: form.budget, requirements: form.requirements, deadline: form.deadline }
    onSubmit(payload)
  }

  const inp = "w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
  const sel = inp + " cursor-pointer"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-2xl my-6 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">List Something</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <button type="button" key={c.id} onClick={() => setCat(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${cat === c.id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                  {c.icon} <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <input className={inp} required value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Give your listing a compelling title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <textarea className={inp + ' resize-none'} rows={3} required value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Describe what you're offering..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <input className={inp} value={form.tags ?? ''} onChange={e => set('tags', e.target.value)} placeholder="e.g. trap, beat, 808" />
              </div>
              {cat !== 'collabs' && cat !== 'services' && cat !== 'music' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                  <input className={inp} type="number" min="0" step="0.01" value={form.price ?? ''} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                </div>
              )}
            </div>
          </div>

          {/* Scripts */}
          {cat === 'scripts' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Script Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Genre</label>
                  <input className={inp} value={form.genre ?? ''} onChange={e => set('genre', e.target.value)} placeholder="Drama, Sci-Fi..." /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Page Count</label>
                  <input className={inp} type="number" value={form.page_count ?? ''} onChange={e => set('page_count', e.target.value)} placeholder="110" /></div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Logline</label>
                  <input className={inp} value={form.logline ?? ''} onChange={e => set('logline', e.target.value)} placeholder="A [protagonist] must [goal] before [stakes]..." /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="wga" checked={!!form.wga} onChange={e => set('wga', e.target.checked)} className="rounded" />
                  <label htmlFor="wga" className="text-xs text-muted-foreground cursor-pointer">WGA Registered</label>
                </div>
              </div>
            </div>
          )}

          {/* Music */}
          {cat === 'music' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Beat Details</p>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Genre</label><input className={inp} value={form.genre ?? ''} onChange={e => set('genre', e.target.value)} placeholder="Trap" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">BPM</label><input className={inp} type="number" value={form.bpm ?? ''} onChange={e => set('bpm', e.target.value)} placeholder="140" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Key</label><input className={inp} value={form.key ?? ''} onChange={e => set('key', e.target.value)} placeholder="C# minor" /></div>
              </div>
              <p className="text-xs font-semibold text-foreground">License Pricing</p>
              <div className="grid grid-cols-3 gap-3">
                {[['price_ne','Non-Exclusive ($)'],['price_ex','Exclusive ($)'],['price_ul','Unlimited ($)']].map(([k,l]) => (
                  <div key={k}><label className="text-xs text-muted-foreground mb-1 block">{l}</label>
                    <input className={inp} type="number" min="0" value={form[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder="0" /></div>
                ))}
              </div>
            </div>
          )}

          {/* Digital */}
          {cat === 'digital' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Product Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">File Type</label><input className={inp} value={form.file_type ?? ''} onChange={e => set('file_type', e.target.value)} placeholder=".XMP / .CUBE / .PSD" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Compatible With</label><input className={inp} value={form.compatible ?? ''} onChange={e => set('compatible', e.target.value)} placeholder="Lightroom, Premiere..." /></div>
              </div>
            </div>
          )}

          {/* Courses */}
          {cat === 'courses' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Course Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Lessons</label><input className={inp} type="number" value={form.lessons ?? ''} onChange={e => set('lessons', e.target.value)} placeholder="24" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Duration</label><input className={inp} value={form.duration ?? ''} onChange={e => set('duration', e.target.value)} placeholder="6h 30m" /></div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Skill Level</label>
                  <select className={sel} value={form.skill_level ?? ''} onChange={e => set('skill_level', e.target.value)}>
                    <option value="">Select level</option>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input type="checkbox" id="cert" checked={!!form.certificate} onChange={e => set('certificate', e.target.checked)} />
                  <label htmlFor="cert" className="text-xs text-muted-foreground">Certificate of completion</label>
                </div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Skills students gain (comma-separated)</label>
                  <input className={inp} value={form.skills ?? ''} onChange={e => set('skills', e.target.value)} placeholder="YouTube SEO, Thumbnail Design..." /></div>
              </div>
            </div>
          )}

          {/* Services + 3 packages */}
          {cat === 'services' && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Response Time</label><input className={inp} value={form.response_time ?? ''} onChange={e => set('response_time', e.target.value)} placeholder="< 1 hour" /></div>
              </div>
              <p className="text-xs font-semibold text-foreground">Packages (Basic / Standard / Premium)</p>
              {pkgs.map((p, i) => (
                <div key={i} className="bg-muted/30 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-primary uppercase">{p.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Price ($)</label><input className={inp} type="number" min="0" value={p.price} onChange={e => setPkg(i,'price',e.target.value)} placeholder="49" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Delivery (days)</label><input className={inp} type="number" min="1" value={p.delivery} onChange={e => setPkg(i,'delivery',e.target.value)} placeholder="3" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Revisions</label><input className={inp} type="number" min="0" value={p.revisions} onChange={e => setPkg(i,'revisions',e.target.value)} placeholder="2" /></div>
                  </div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">What's included</label><input className={inp} value={p.description} onChange={e => setPkg(i,'description',e.target.value)} placeholder="Describe this package..." /></div>
                </div>
              ))}
            </div>
          )}

          {/* Physical */}
          {cat === 'physical' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Item Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
                  <select className={sel} value={form.condition ?? ''} onChange={e => set('condition', e.target.value)}>
                    <option value="">Select condition</option>
                    <option>New</option><option>Like New</option><option>Good</option><option>Fair</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Location</label><input className={inp} value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="City, State" /></div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="ship" checked={!!form.shipping} onChange={e => set('shipping', e.target.checked)} />
                  <label htmlFor="ship" className="text-xs text-muted-foreground">Shipping available</label>
                  {form.shipping && <input className={inp + ' w-28'} type="number" min="0" value={form.shipping_cost ?? ''} onChange={e => set('shipping_cost', e.target.value)} placeholder="Shipping $" />}
                </div>
              </div>
            </div>
          )}

          {/* Collabs */}
          {cat === 'collabs' && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Opportunity Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Opportunity Type</label>
                  <select className={sel} value={form.opp_type ?? ''} onChange={e => set('opp_type', e.target.value)}>
                    <option value="">Select type</option>
                    <option>Brand Deal</option><option>Casting Call</option><option>Music Feature</option>
                    <option>Co-Creator</option><option>Podcast Guest</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Compensation</label><input className={inp} value={form.budget ?? ''} onChange={e => set('budget', e.target.value)} placeholder="$500 per creator" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Requirements</label><input className={inp} value={form.requirements ?? ''} onChange={e => set('requirements', e.target.value)} placeholder="5K+ followers, fitness niche" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Deadline</label><input className={inp} type="date" value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value)} /></div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Publishing…' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatorMarket() {
  const { user } = useAuth()

  const [listings, setListings]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeCat, setActiveCat]     = useState('all')
  const [priceFilter, setPriceFilter] = useState(0)
  const [search, setSearch]           = useState('')
  const [saved, setSaved]             = useState(new Set())
  const [selected, setSelected]       = useState(null)
  const [showSell, setShowSell]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.from('creator_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        const db = data ?? []
        // Always show samples — mark which ones are already in DB
        const dbIds = new Set(db.map(d => d.id))
        const merged = [...db, ...SAMPLES.filter(s => !dbIds.has(s.id))]
        setListings(merged)
        setLoading(false)
      })
  }, [])

  const filteredListings = useMemo(() => {
    const pf = PRICE_FILTERS[priceFilter]
    const q  = search.toLowerCase()
    return listings.filter(l => {
      if (activeCat !== 'all' && l.category !== activeCat) return false
      const price = l.packages?.length ? (l.packages[0]?.price ?? 0) : (l.price ?? 0)
      if (price < pf.min || price > pf.max) return false
      if (q && !l.title?.toLowerCase().includes(q) && !l.description?.toLowerCase().includes(q) && !l.seller_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [listings, activeCat, priceFilter, search])

  const catCounts = useMemo(() => {
    const counts = {}
    listings.forEach(l => { counts[l.category] = (counts[l.category] ?? 0) + 1 })
    return counts
  }, [listings])

  const toggleSave = useCallback((id) => {
    setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const handleSell = useCallback(async (payload) => {
    setSaving(true)
    try {
      const { data } = await supabase.from('creator_content').insert({
        ...payload,
        seller_id: user?.id,
        seller_name: user?.full_name ?? user?.email ?? 'Creator',
        seller_avatar: user?.avatar_url ?? null,
        status: 'active',
        rating: 0,
        review_count: 0,
        purchase_count: 0,
      }).select().single()
      if (data) setListings(prev => [data, ...prev])
      setShowSell(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }, [user])

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Scripts · Beats · Courses · Services · Gear · Collabs</p>
        </div>
        <button onClick={() => setShowSell(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Sell Something
        </button>
      </div>

      {/* ── Search + price filter ─────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts, beats, services…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <div className="relative">
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground hover:border-primary/40 transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" /> {PRICE_FILTERS[priceFilter].label}
          </button>
          {showFilters && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 min-w-[140px]">
              {PRICE_FILTERS.map((f, i) => (
                <button key={i} onClick={() => { setPriceFilter(i); setShowFilters(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl ${priceFilter === i ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border ${activeCat === cat.id ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
            {cat.icon} {cat.label}
            {cat.id !== 'all' && catCounts[cat.id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCat === cat.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>{catCounts[cat.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-4">
          {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
          {activeCat !== 'all' && ` in ${CATEGORIES.find(c => c.id === activeCat)?.label}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-3xl">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No listings found</h3>
          <p className="text-muted-foreground text-sm mb-5">Try a different category, price range, or search term</p>
          <button onClick={() => { setActiveCat('all'); setSearch(''); setPriceFilter(0) }}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(l => (
            <ListingCard
              key={l.id}
              listing={l}
              onView={setSelected}
              onSave={toggleSave}
              saved={saved.has(l.id)}
            />
          ))}
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      {selected && (
        <ListingModal
          listing={selected}
          onClose={() => setSelected(null)}
          saved={saved.has(selected.id)}
          onSave={toggleSave}
        />
      )}

      {/* ── Sell modal ───────────────────────────────────────────────────── */}
      {showSell && (
        <SellModal onClose={() => setShowSell(false)} onSubmit={handleSell} saving={saving} />
      )}
    </div>
  )
}
