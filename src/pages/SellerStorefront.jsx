import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Star, MessageSquare, Users, Package, ShoppingBag, Calendar,
  ArrowLeft, Loader2, Heart, Download, Play, Pause,
} from 'lucide-react'

function fmt(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

const CATEGORY_COLORS = {
  scripts:  'bg-violet-500/20 text-violet-400',
  music:    'bg-pink-500/20 text-pink-400',
  digital:  'bg-blue-500/20 text-blue-400',
  courses:  'bg-amber-500/20 text-amber-400',
  services: 'bg-emerald-500/20 text-emerald-400',
  physical: 'bg-orange-500/20 text-orange-400',
  collabs:  'bg-rose-500/20 text-rose-400',
  other:    'bg-gray-400/20 text-gray-300',
}

const CATEGORY_ICONS = {
  scripts: '🎬', music: '🎵', digital: '🎨', courses: '📚',
  services: '🤝', physical: '📦', collabs: '🌟', other: '🔮',
}

function MiniListingCard({ listing, navigate }) {
  const isService = listing.category === 'services'
  const basePrice = isService && listing.packages?.length
    ? listing.packages[0]?.price
    : listing.price
  const catColor  = CATEGORY_COLORS[listing.category] ?? 'bg-gray-500/20 text-gray-400'
  const catIcon   = CATEGORY_ICONS[listing.category] ?? '🏪'

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => navigate('/marketplace')}>
      <div className="relative aspect-video bg-muted overflow-hidden">
        {listing.cover
          ? <img src={listing.cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{catIcon}</div>
        }
        {listing.metadata?.instant_download && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Download className="w-3 h-3" /> Instant
          </span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${catColor}`}>
          {catIcon} {listing.category}
        </span>
        <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{listing.title}</p>
        {listing.review_count > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">{listing.rating?.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({listing.review_count})</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {listing.category === 'collabs' && listing.price === 0
              ? <span className="text-xs text-muted-foreground">Paid (TBD)</span>
              : `${isService ? 'From ' : ''}$${fmt(basePrice)}`}
          </span>
          {listing.purchase_count > 0 && (
            <span className="text-xs text-muted-foreground">{fmt(listing.purchase_count)} sold</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SellerStorefront() {
  const { sellerId } = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [seller, setSeller]     = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [followed, setFollowed] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeCat, setActiveCat] = useState('all')

  useEffect(() => {
    if (!sellerId) return
    setLoading(true)
    Promise.all([
      supabase.from('profiles').select('*').eq('id', sellerId).single(),
      supabase.from('creator_content').select('*').eq('seller_id', sellerId).eq('status', 'active').order('purchase_count', { ascending: false }),
    ]).then(([profileRes, listingsRes]) => {
      setSeller(profileRes.data)
      setListings(listingsRes.data ?? [])
      setLoading(false)
    })
  }, [sellerId])

  // Check follow status
  useEffect(() => {
    if (!user?.id || !sellerId) return
    supabase.from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', sellerId)
      .maybeSingle()
      .then(({ data }) => setFollowed(!!data))
  }, [user?.id, sellerId])

  const toggleFollow = async () => {
    if (!user) { navigate('/login'); return }
    setFollowLoading(true)
    try {
      if (followed) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', sellerId)
        setFollowed(false)
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: sellerId })
        setFollowed(true)
      }
    } catch (e) { console.error(e) }
    setFollowLoading(false)
  }

  const handleMessage = () => {
    navigate('/messages')
  }

  // Compute stats from listings
  const totalSales   = listings.reduce((s, l) => s + (l.purchase_count ?? 0), 0)
  const ratedListings = listings.filter(l => (l.review_count ?? 0) > 0)
  const avgRating    = ratedListings.length > 0
    ? ratedListings.reduce((s, l) => s + (l.rating ?? 0), 0) / ratedListings.length
    : 0
  const totalReviews = listings.reduce((s, l) => s + (l.review_count ?? 0), 0)

  const categories = ['all', ...new Set(listings.map(l => l.category))]
  const visibleListings = activeCat === 'all' ? listings : listings.filter(l => l.category === activeCat)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const displayName = seller?.full_name ?? seller?.username ?? seller?.email?.split('@')[0] ?? 'Creator'
  const memberSince = seller?.created_at ? new Date(seller.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null
  const isOwnProfile = user?.id === sellerId

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Cover Banner ───────────────────────────────────────────────── */}
      <div className="relative mb-16">
        {/* Banner */}
        <div
          className="h-40 rounded-3xl overflow-hidden"
          style={{
            background: seller?.banner_url
              ? `url(${seller.banner_url}) center/cover`
              : 'linear-gradient(135deg, hsl(var(--primary)/0.3) 0%, hsl(262 83% 58% / 0.2) 50%, hsl(var(--primary)/0.1) 100%)'
          }}>
          {seller?.banner_url && (
            <img src={seller.banner_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Avatar overlapping banner */}
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden shadow-lg">
            {seller?.avatar_url
              ? <img src={seller.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              : displayName[0]?.toUpperCase()}
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && (
          <div className="absolute -bottom-12 right-0 flex gap-2">
            <button
              onClick={handleMessage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                followed ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-primary text-white hover:bg-primary/90'
              }`}>
              {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {followed ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      {/* ── Seller Info ─────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        {seller?.bio && <p className="text-muted-foreground text-sm max-w-xl">{seller.bio}</p>}
        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {memberSince && (
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Member since {memberSince}</span>
          )}
          {seller?.location && <span>📍 {seller.location}</span>}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Package className="w-4 h-4 text-primary" />,     label: 'Listings',  value: listings.length },
          { icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />, label: 'Total Sales', value: fmt(totalSales) },
          { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
          { icon: <MessageSquare className="w-4 h-4 text-blue-400" />, label: 'Reviews',   value: fmt(totalReviews) },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category filter ─────────────────────────────────────────────── */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                activeCat === cat ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
              }`}>
              {cat === 'all' ? '🏪 All' : `${CATEGORY_ICONS[cat] ?? '🔮'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Listings Grid ───────────────────────────────────────────────── */}
      {visibleListings.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No listings yet</h3>
          <p className="text-muted-foreground text-sm">This creator hasn't listed anything in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleListings.map(l => (
            <MiniListingCard key={l.id} listing={l} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}
