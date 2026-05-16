import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  Star, ShoppingBag, Download, X, Plus, Check, Copy, ChevronRight,
  Search, Shield, TrendingUp, Users, DollarSign, Package, Settings,
  Upload, Tag, Eye, CreditCard, Store, LayoutDashboard, Compass
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { id: 'digital',    icon: '📄', label: 'Digital Download', desc: 'eBook, PDF, template, preset' },
  { id: 'video',      icon: '🎬', label: 'Video / Tutorial',  desc: 'Course, masterclass, single video' },
  { id: 'audio',      icon: '🎵', label: 'Audio',             desc: 'Beat, sample pack, music, SFX' },
  { id: 'design',     icon: '🖼',  label: 'Design Asset',      desc: 'Canva template, logo pack, brand kit' },
  { id: 'membership', icon: '🔑', label: 'Membership',        desc: 'Recurring subscription for exclusive content' },
  { id: 'service',    icon: '🤝', label: 'Service',           desc: '1-on-1 call, coaching, review' },
]

const SAMPLE_STORES = [
  { id: 's1', username: 'sarahkim',    name: 'Sarah Kim',    tagline: 'Social Media Growth Resources',   banner_color: 'from-purple-600 to-pink-500',   avatar: 'SK', bio: 'Creator educator helping you grow on every platform. 10M+ followers taught.',            total_sales: 2341, total_revenue: 84200,  followers: 12400, verified: true },
  { id: 's2', username: 'djnexus',     name: 'DJ Nexus',     tagline: 'Premium Beats & Sample Packs',    banner_color: 'from-blue-600 to-cyan-500',     avatar: 'DN', bio: 'Grammy-nominated producer. All beats are royalty-free for creators.',                  total_sales: 891,  total_revenue: 31500,  followers: 5600,  verified: true },
  { id: 's3', username: 'zoestudio',   name: 'Zoe Chen',     tagline: 'Brand Photography Presets & Guides', banner_color: 'from-amber-500 to-rose-500', avatar: 'ZC', bio: 'Commercial photographer turned educator. Presets used by 5K+ photographers.',          total_sales: 1203, total_revenue: 47800,  followers: 8900,  verified: false },
  { id: 's4', username: 'marcuswebb',  name: 'Marcus Webb',  tagline: 'YouTube Growth Templates',        banner_color: 'from-red-600 to-orange-500',    avatar: 'MW', bio: 'Full-time YouTuber sharing everything I know about building a channel business.',      total_sales: 567,  total_revenue: 22400,  followers: 3400,  verified: true },
  { id: 's5', username: 'priyadesigns',name: 'Priya Sharma', tagline: 'Brand Kits & Canva Templates',    banner_color: 'from-emerald-500 to-teal-600',  avatar: 'PS', bio: 'Brand designer for 200+ creators. Download and launch your brand today.',              total_sales: 3102, total_revenue: 112000, followers: 18200, verified: true },
  { id: 's6', username: 'alexai',      name: 'Alex Rivera',  tagline: 'AI Prompts & Automation Tools',   banner_color: 'from-violet-600 to-indigo-600', avatar: 'AR', bio: 'AI educator helping creators 10x their output. 500+ prompt library.',                  total_sales: 4521, total_revenue: 94300,  followers: 21000, verified: true },
]

const SAMPLE_PRODUCTS = [
  { id: 'p1', seller_id: 's1', seller_name: 'Sarah Kim',   seller_avatar: 'SK', name: 'Social Media Content Calendar 2024',        type: 'digital',    price: 19,  cover: '📅', description: 'A complete 365-day content calendar template with 52 weeks of content ideas, hashtag banks for every niche, posting time optimizer, and engagement tracker. Works with Google Sheets, Notion, and Excel.', what_includes: ['365-day content calendar','52 hashtag bank sheets','Posting time optimizer','Engagement tracker','Video walkthrough (30 min)'],                               tags: ['content calendar','social media','template','notion'], sales_count: 892,  rating: 4.9, featured: true },
  { id: 'p2', seller_id: 's2', seller_name: 'DJ Nexus',    seller_avatar: 'DN', name: 'Trap & R&B Starter Pack Vol.1',              type: 'audio',      price: 29,  cover: '🎵', description: 'Premium trap and R&B beats ready for your content. All beats are royalty-free for YouTube, TikTok, Instagram, and Spotify. WAV + MP3 included. Commercial license included.',                             what_includes: ['25 original beats','WAV + MP3 formats','Commercial license','Album artwork','25 stems/trackouts'],                                                                  tags: ['beats','trap','rnb','royalty free'],                   sales_count: 341,  rating: 4.8, featured: false },
  { id: 'p3', seller_id: 's3', seller_name: 'Zoe Chen',    seller_avatar: 'ZC', name: 'Brand Photography Lightroom Preset Pack',    type: 'design',     price: 39,  cover: '📸', description: '20 professional Lightroom presets used by top brand photographers. Works on mobile and desktop. Perfect for product photography, lifestyle shots, and UGC content.',                                          what_includes: ['20 Lightroom presets','Mobile + Desktop versions','Installation guide','Before/After examples','1 year of updates'],                                                 tags: ['lightroom','presets','photography','brand'],           sales_count: 1203, rating: 4.7, featured: true },
  { id: 'p4', seller_id: 's5', seller_name: 'Priya Sharma',seller_avatar: 'PS', name: 'Complete Brand Kit — 50 Canva Templates',   type: 'design',     price: 49,  cover: '🎨', description: 'Everything you need to launch a professional brand: logo variations, social media templates, media kit, link-in-bio page, pitch deck, invoice template, and more. All editable in free Canva.',               what_includes: ['Logo suite (5 variations)','100 social media templates','Media kit template','Link-in-bio page','Pitch deck (20 slides)','Invoice + contract templates'],            tags: ['canva','brand kit','templates','design'],              sales_count: 3102, rating: 4.9, featured: true },
  { id: 'p5', seller_id: 's6', seller_name: 'Alex Rivera', seller_avatar: 'AR', name: '500 AI Prompts for Content Creators',        type: 'digital',    price: 27,  cover: '🤖', description: 'The ultimate AI prompt library for creators. 500 carefully crafted prompts for ChatGPT, Claude, and Gemini. Covers: scripts, captions, emails, story ideas, YouTube titles, thumbnails briefs, and more.',  what_includes: ['500 prompts organized by use case','Prompt chaining guides','Video tutorial (45 min)','Monthly updates via email','Private community access'],                      tags: ['ai','chatgpt','prompts','automation'],                 sales_count: 4521, rating: 4.9, featured: false },
  { id: 'p6', seller_id: 's1', seller_name: 'Sarah Kim',   seller_avatar: 'SK', name: 'TikTok Viral Growth Masterclass',            type: 'video',      price: 97,  cover: '🎬', description: 'My exact strategy for going viral on TikTok — used to grow 3 accounts to 1M+ followers. 3-hour masterclass with live examples, case studies, and a 30-day action plan.',                                    what_includes: ['3-hour video masterclass','30-day action plan PDF','Hook template library','Private community access','Lifetime access + updates'],                                  tags: ['tiktok','viral','growth','masterclass'],               sales_count: 567,  rating: 4.8, featured: false },
  { id: 'p7', seller_id: 's4', seller_name: 'Marcus Webb', seller_avatar: 'MW', name: 'YouTube Channel Audit (1-on-1)',             type: 'service',    price: 149, cover: '🎥', description: "60-minute 1-on-1 Zoom call where I personally audit your YouTube channel. I'll review your thumbnails, titles, content strategy, upload schedule, and monetization. You'll leave with a clear 90-day growth plan.", what_includes: ['60-min Zoom call','Channel audit report','90-day action plan','Email follow-up support','Recording of the call'],                                                 tags: ['youtube','coaching','audit','1on1'],                   sales_count: 89,   rating: 5.0, featured: false },
  { id: 'p8', seller_id: 's2', seller_name: 'DJ Nexus',    seller_avatar: 'DN', name: 'Monthly Beat Membership',                   type: 'membership', price: 9,   cover: '🔑', description: 'Get 5 new premium beats every month, exclusive access to stems, early access to new packs, and a private Discord with DJ Nexus. Cancel anytime.',                                                              what_includes: ['5 new beats/month','Full stems + trackouts','Private Discord access','Early pack access','Monthly Q&A session'],                                                    tags: ['beats','membership','monthly','exclusive'],            sales_count: 234,  rating: 4.7, featured: true },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtPrice = (price, type) => {
  if (!price || price === 0) return 'Free'
  if (type === 'membership') return `$${price}/mo`
  return `$${price}`
}

const fmtNum = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const TYPE_COLORS = {
  digital:    'from-purple-500/20 to-purple-700/20',
  video:      'from-red-500/20 to-red-700/20',
  audio:      'from-blue-500/20 to-blue-700/20',
  design:     'from-pink-500/20 to-pink-700/20',
  membership: 'from-amber-500/20 to-amber-700/20',
  service:    'from-green-500/20 to-green-700/20',
}

const TYPE_BADGE_COLORS = {
  digital:    'bg-purple-500/20 text-purple-300',
  video:      'bg-red-500/20 text-red-300',
  audio:      'bg-blue-500/20 text-blue-300',
  design:     'bg-pink-500/20 text-pink-300',
  membership: 'bg-amber-500/20 text-amber-300',
  service:    'bg-green-500/20 text-green-300',
}

const PRESET_COLORS = [
  { label: 'Purple', value: 'from-purple-600 to-pink-500' },
  { label: 'Blue',   value: 'from-blue-600 to-cyan-500' },
  { label: 'Amber',  value: 'from-amber-500 to-rose-500' },
  { label: 'Red',    value: 'from-red-600 to-orange-500' },
  { label: 'Green',  value: 'from-emerald-500 to-teal-600' },
  { label: 'Violet', value: 'from-violet-600 to-indigo-600' },
]

const PRESET_BG_MAPS = {
  'from-purple-600 to-pink-500':   'bg-gradient-to-r from-purple-600 to-pink-500',
  'from-blue-600 to-cyan-500':     'bg-gradient-to-r from-blue-600 to-cyan-500',
  'from-amber-500 to-rose-500':    'bg-gradient-to-r from-amber-500 to-rose-500',
  'from-red-600 to-orange-500':    'bg-gradient-to-r from-red-600 to-orange-500',
  'from-emerald-500 to-teal-600':  'bg-gradient-to-r from-emerald-500 to-teal-600',
  'from-violet-600 to-indigo-600': 'bg-gradient-to-r from-violet-600 to-indigo-600',
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, onOpen }) {
  const typeLabel = PRODUCT_TYPES.find((t) => t.id === product.type)?.label || product.type

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
      onClick={() => onOpen(product)}
    >
      {/* Cover */}
      <div className={`relative h-40 bg-gradient-to-br ${TYPE_COLORS[product.type] || 'from-muted to-muted'} flex items-center justify-center`}>
        <span className="text-5xl select-none">{product.cover}</span>
        {/* Type badge */}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE_COLORS[product.type]}`}>
          {typeLabel}
        </span>
        {/* Featured badge */}
        {product.featured && (
          <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-1">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{product.name}</h3>

        {/* Seller */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {product.seller_avatar}
          </div>
          <span className="text-xs text-muted-foreground">{product.seller_name}</span>
        </div>

        {/* Rating + sales */}
        <div className="flex items-center justify-between">
          <StarRating rating={product.rating} />
          <span className="text-xs text-muted-foreground">{fmtNum(product.sales_count)} sales</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-border">
          <span className="text-lg font-bold text-foreground">{fmtPrice(product.price, product.type)}</span>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onOpen(product)}
              className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1"
            >
              <Eye size={12} /> Preview
            </button>
            <button
              onClick={() => onOpen(product)}
              className="text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium flex items-center gap-1"
            >
              <ShoppingBag size={12} /> Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ProductModal ─────────────────────────────────────────────────────────────

function ProductModal({ product, onClose }) {
  const [step, setStep] = useState(0) // 0=details, 1=checkout, 2=success
  const [email, setEmail] = useState('')
  const [cardNum, setCardNum] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePurchase = async () => {
    if (!email || !cardNum || !expiry || !cvv) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await supabase.from('store_purchases').insert({
        product_id: product.id,
        amount: product.price,
        buyer_email: email,
      })
    } catch (_) {
      // ignore Supabase errors for demo
    } finally {
      setLoading(false)
      setStep(2)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <span className="font-semibold text-foreground">
            {step === 0 ? 'Product Details' : step === 1 ? 'Checkout' : 'Purchase Complete'}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step 0: Product details */}
        {step === 0 && (
          <div className="flex flex-col md:flex-row">
            {/* Left */}
            <div className="flex-1 p-5 space-y-4">
              {/* Cover */}
              <div className={`h-52 rounded-xl bg-gradient-to-br ${TYPE_COLORS[product.type]} flex items-center justify-center`}>
                <span className="text-7xl">{product.cover}</span>
              </div>
              {/* Type + tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE_COLORS[product.type]}`}>
                  {PRODUCT_TYPES.find(t => t.id === product.type)?.label}
                </span>
                {(product.tags || []).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{tag}</span>
                ))}
              </div>
              {/* Description */}
              <div>
                <h4 className="font-semibold text-foreground mb-1">About this product</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
              {/* What's included */}
              {product.what_includes && product.what_includes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What's included</h4>
                  <ul className="space-y-1.5">
                    {product.what_includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-green-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right sticky */}
            <div className="md:w-64 p-5 border-t md:border-t-0 md:border-l border-border space-y-4">
              {/* Price */}
              <div className="text-3xl font-bold text-foreground">{fmtPrice(product.price, product.type)}</div>
              {/* Seller */}
              <div className="flex items-center gap-2 py-3 border-y border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {product.seller_avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{product.seller_name}</div>
                  <div className="text-xs text-muted-foreground">{fmtNum(product.sales_count)} sales</div>
                </div>
              </div>
              {/* Rating */}
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} />
                <span className="text-xs text-muted-foreground">({product.sales_count})</span>
              </div>
              {/* CTA */}
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Buy Now
              </button>
              <p className="text-xs text-muted-foreground text-center">30-day money-back guarantee</p>
            </div>
          </div>
        )}

        {/* Step 1: Checkout */}
        {step === 1 && (
          <div className="p-5 space-y-5 max-w-md mx-auto">
            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <span className="text-3xl">{product.cover}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground line-clamp-1">{product.name}</div>
                <div className="text-xs text-muted-foreground">{product.seller_name}</div>
              </div>
              <div className="font-bold text-foreground">{fmtPrice(product.price, product.type)}</div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CreditCard size={14} /> Payment details
              </label>
              <input
                type="text"
                value={cardNum}
                onChange={(e) => setCardNum(e.target.value)}
                placeholder="Card number"
                maxLength={19}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM / YY"
                  maxLength={7}
                  className="px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                  maxLength={4}
                  className="px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing…' : `Complete Purchase (${fmtPrice(product.price, product.type)})`}
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">🔒 Secured by Stripe. Your payment info is never stored.</p>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Purchase Successful!</h3>
              <p className="text-muted-foreground text-sm">A receipt has been sent to {email || 'your email'}.</p>
            </div>
            <div className="p-4 bg-muted rounded-xl w-full max-w-xs">
              <div className="text-2xl mb-1">{product.cover}</div>
              <div className="font-medium text-sm text-foreground">{product.name}</div>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <a
                href="#"
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Now
              </a>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Back to Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AddProductModal ──────────────────────────────────────────────────────────

function AddProductModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', free: false, tags: '', featured: false })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const fileLabel = {
    digital: 'Upload PDF / File',
    video:   'Upload Video',
    audio:   'Upload Audio',
    design:  'Upload Design File',
    membership: 'Upload Cover Image',
    service: 'Upload Preview Image',
  }

  const handlePublish = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await supabase.from('store_products').insert({
        name: form.name,
        description: form.description,
        type: selectedType,
        price: form.free ? 0 : parseFloat(form.price) || 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: form.featured,
      })
    } catch (_) {
      // ignore for demo
    } finally {
      setLoading(false)
      setDone(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <span className="font-semibold text-foreground">Add Product</span>
            <span className="text-xs text-muted-foreground ml-2">Step {step} of 2</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={28} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Product Published!</h3>
              <p className="text-muted-foreground text-sm">Your product is now live in your store.</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : step === 1 ? (
          <div className="p-5 space-y-4">
            <h3 className="font-medium text-foreground">What type of product are you selling?</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRODUCT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedType === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted hover:border-border/80'
                  }`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="font-medium text-sm text-foreground">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
            <button
              disabled={!selectedType}
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Selected type pill */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{PRODUCT_TYPES.find(t => t.id === selectedType)?.icon}</span>
              <span className="text-sm font-medium text-foreground">{PRODUCT_TYPES.find(t => t.id === selectedType)?.label}</span>
              <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline ml-auto">Change</button>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Product Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Social Media Starter Kit"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what buyers will get..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Price</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                    disabled={form.free}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, free: !form.free })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.free ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.free ? 'translate-x-4' : ''}`} />
                  </div>
                  Free
                </label>
              </div>
            </div>

            {/* Cover placeholder */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cover Image</label>
              <div className="h-28 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload cover image</span>
              </div>
            </div>

            {/* File upload */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{fileLabel[selectedType] || 'Upload File'}</label>
              <div className="h-20 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{fileLabel[selectedType] || 'Upload File'}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Tag size={13} /> Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. social media, template, canva"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Featured toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm({ ...form, featured: !form.featured })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.featured ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.featured ? 'translate-x-4' : ''}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Mark as Featured</div>
                <div className="text-xs text-muted-foreground">Featured products appear at the top of your store</div>
              </div>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Publishing…' : '🚀 Publish Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StoreCard ────────────────────────────────────────────────────────────────

function StoreCard({ store, onOpen }) {
  const bannerClass = PRESET_BG_MAPS[store.banner_color] || `bg-gradient-to-r ${store.banner_color}`

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpen && onOpen(store)}
    >
      {/* Banner */}
      <div className={`h-24 ${bannerClass} relative`} />
      {/* Avatar overlap */}
      <div className="px-4 pb-4 -mt-6 relative">
        <div className="w-12 h-12 rounded-full bg-card border-2 border-card flex items-center justify-center text-primary font-bold text-sm mb-2 shadow">
          {store.avatar}
        </div>
        {/* Name + verified */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground text-sm">{store.name}</span>
          {store.verified && (
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Check size={10} className="text-white" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{store.tagline}</p>
        {/* Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{fmtNum(store.total_sales)} sales</span>
          <span>·</span>
          <span>{fmtNum(store.followers)} followers</span>
        </div>
        {/* Visit button */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpen && onOpen(store) }}
          className="mt-3 w-full py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          Visit Store
        </button>
      </div>
    </div>
  )
}

// ─── StoreDashboard ───────────────────────────────────────────────────────────

function StoreDashboard({ myProducts, onAddProduct }) {
  const [storeForm, setStoreForm] = useState({
    name: 'My Creator Store',
    tagline: 'Digital products for creators',
    bio: '',
    color: 'from-purple-600 to-pink-500',
  })
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    try {
      await supabase.from('stores').upsert({ ...storeForm })
    } catch (_) {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const revenueCards = [
    { label: 'Today',      value: '$0',    icon: DollarSign },
    { label: 'This Week',  value: '$0',    icon: TrendingUp },
    { label: 'This Month', value: '$0',    icon: TrendingUp },
    { label: 'All Time',   value: '$0',    icon: Package },
  ]

  return (
    <div className="space-y-6">
      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {revenueCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <card.icon size={14} className="text-muted-foreground" />
            </div>
            <div className="text-xl font-bold text-foreground">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Share + total sales */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1">
          <div className="text-xs text-muted-foreground mb-1">Total Sales</div>
          <div className="text-2xl font-bold text-foreground">{myProducts.length > 0 ? myProducts.reduce((s, p) => s + (p.sales_count || 0), 0) : 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
          <div className="text-sm font-medium text-foreground mb-2">Share Store Link</div>
          <button
            onClick={copyLink}
            className="w-full py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy Store URL'}
          </button>
        </div>
      </div>

      {/* Customize */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Settings size={16} /> Customize Store
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Store Name</label>
          <input
            value={storeForm.name}
            onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Tagline</label>
          <input
            value={storeForm.tagline}
            onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Bio</label>
          <textarea
            value={storeForm.bio}
            onChange={(e) => setStoreForm({ ...storeForm, bio: e.target.value })}
            rows={3}
            placeholder="Tell buyers about yourself..."
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Banner Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setStoreForm({ ...storeForm, color: c.value })}
                title={c.label}
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${c.value} border-2 transition-all ${storeForm.color === c.value ? 'border-foreground scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
        </button>
      </div>

      {/* Recent transactions */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="font-semibold text-foreground mb-3">Recent Transactions</div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Package size={32} className="mx-auto mb-2 opacity-40" />
          No transactions yet. Share your store to start selling!
        </div>
      </div>

      {/* My products */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-foreground">My Products ({myProducts.length})</div>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={12} /> Add Product
          </button>
        </div>
        {myProducts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No products yet. Add your first product!
          </div>
        ) : (
          <div className="space-y-2">
            {myProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <span className="text-xl">{p.cover}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtPrice(p.price, p.type)} · {p.sales_count} sales</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE_COLORS[p.type]}`}>
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CreatorStore (main) ──────────────────────────────────────────────────────

export default function CreatorStore() {
  const [activeTab, setActiveTab] = useState('discover')
  const [products, setProducts] = useState(SAMPLE_PRODUCTS)
  const [stores] = useState(SAMPLE_STORES)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedStore, setSelectedStore] = useState(null)

  // Load products from Supabase (merge with sample)
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          setProducts([...data, ...SAMPLE_PRODUCTS])
        }
      } catch (_) {}
    }
    load()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.seller_name?.toLowerCase().includes(q) || (p.tags || []).some(t => t.includes(q))
      return matchesType && matchesSearch
    })
  }, [products, typeFilter, searchQuery])

  const featuredProducts = useMemo(() => products.filter(p => p.featured), [products])

  // My store: pretend user owns s1
  const myStore = SAMPLE_STORES[0]
  const myProducts = products.filter(p => p.seller_id === 's1')
  const myBannerClass = PRESET_BG_MAPS[myStore.banner_color] || `bg-gradient-to-r ${myStore.banner_color}`

  const TYPE_FILTERS = [
    { id: 'all',        label: 'All' },
    { id: 'digital',    label: '📄 Digital' },
    { id: 'video',      label: '🎬 Video' },
    { id: 'audio',      label: '🎵 Audio' },
    { id: 'design',     label: '🖼 Design' },
    { id: 'membership', label: '🔑 Membership' },
    { id: 'service',    label: '🤝 Service' },
  ]

  const tabs = [
    { id: 'discover',   label: 'Discover',   icon: Compass },
    { id: 'my-store',   label: 'My Store',   icon: Store },
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 h-14">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={15} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── DISCOVER TAB ── */}
        {activeTab === 'discover' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-2">Creator Stores</h1>
              <p className="text-muted-foreground">Discover premium digital products made by top creators</p>
            </div>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, creators, tags…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Featured Stores */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users size={18} /> Featured Stores
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stores.slice(0, 6).map((store) => (
                  <StoreCard key={store.id} store={store} onOpen={setSelectedStore} />
                ))}
              </div>
            </div>

            {/* Product type filters */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShoppingBag size={18} /> All Products
                <span className="text-sm font-normal text-muted-foreground">({filteredProducts.length})</span>
              </h2>
              <div className="flex gap-2 flex-wrap mb-5">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Products grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No products match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MY STORE TAB ── */}
        {activeTab === 'my-store' && (
          <div className="space-y-6">
            {/* Store hero */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className={`h-32 ${myBannerClass}`} />
              <div className="px-6 pb-6 -mt-8 relative">
                <div className="flex items-end justify-between">
                  <div className="w-16 h-16 rounded-full bg-card border-4 border-card flex items-center justify-center text-primary font-bold text-lg shadow">
                    {myStore.avatar}
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Settings size={14} /> Edit Store
                  </button>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{myStore.name}</span>
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{myStore.tagline}</p>
                  <p className="text-sm text-foreground/80 mt-2 max-w-xl">{myStore.bio}</p>
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">{fmtNum(myStore.total_sales)}</strong> sales</span>
                    <span><strong className="text-foreground">{fmtNum(myStore.followers)}</strong> followers</span>
                    <span><strong className="text-foreground">${fmtNum(myStore.total_revenue)}</strong> earned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* My products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">My Products ({myProducts.length})</h2>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              {myProducts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                  <Package size={40} className="mx-auto mb-3 opacity-40" />
                  <h3 className="font-medium text-foreground mb-1">No products yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling</p>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                  >
                    <Plus size={14} /> Add your first product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {/* Add product card */}
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">Add Product</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Upload & sell instantly</div>
                    </div>
                  </button>

                  {myProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <LayoutDashboard size={20} /> Store Dashboard
              </h2>
            </div>
            <StoreDashboard myProducts={myProducts} onAddProduct={() => setShowAddProduct(true)} />
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}

      {/* Store quick-view modal (simplified) */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className={`h-28 bg-gradient-to-r ${selectedStore.banner_color} relative`}>
              <button
                onClick={() => setSelectedStore(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 pb-5 -mt-7 relative">
              <div className="w-14 h-14 rounded-full bg-card border-4 border-card flex items-center justify-center text-primary font-bold shadow mb-2">
                {selectedStore.avatar}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-foreground">{selectedStore.name}</span>
                {selectedStore.verified && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{selectedStore.tagline}</p>
              <p className="text-sm text-foreground/80 mb-3">{selectedStore.bio}</p>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                <span><strong className="text-foreground">{fmtNum(selectedStore.total_sales)}</strong> sales</span>
                <span><strong className="text-foreground">{fmtNum(selectedStore.followers)}</strong> followers</span>
              </div>
              {/* Products by this seller */}
              <div className="font-semibold text-foreground mb-3 text-sm">Products</div>
              <div className="space-y-2">
                {products.filter(p => p.seller_id === selectedStore.id).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => { setSelectedStore(null); setSelectedProduct(p) }}
                  >
                    <span className="text-xl">{p.cover}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground line-clamp-1">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{fmtPrice(p.price, p.type)} · {fmtNum(p.sales_count)} sales</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                ))}
                {products.filter(p => p.seller_id === selectedStore.id).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No products listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
