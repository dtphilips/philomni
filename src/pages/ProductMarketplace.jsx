import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  ShoppingBag, Search, Loader2, Package, Store, Sparkles, Check,
  DollarSign, Gift, X,
} from 'lucide-react'

const CATEGORIES = [
  'All', 'Fashion & Clothing', 'Shoes & Footwear', 'Bags & Purses', 'Jewelry & Accessories',
  'Beauty & Skincare', 'Hair & Wigs', 'Nails & Nail Art', 'Health & Wellness', 'Fitness & Sports',
  'Home & Kitchen', 'Home Decor', 'Bedding & Bath', 'Baby & Kids', 'Toys & Games',
  'Food & Snacks', 'Drinks & Beverages', 'Pet Supplies', 'Electronics & Gadgets', 'Phone Accessories',
  'Laptops & Computers', 'Books & Stationery', 'Art & Craft Supplies', 'Music & Instruments', 'Automotive',
  'Garden & Outdoor', 'Travel & Luggage', 'Adult 18+', 'Digital Products', 'Courses & Education',
  'Software & Tools', 'Other',
]

const PRICE_FILTERS = [
  { label: 'Any price', value: 'all' },
  { label: 'Under $25', value: 'under25' },
  { label: '$25–$50',   value: '25-50' },
  { label: '$50–$100',  value: '50-100' },
  { label: '$100+',     value: '100+' },
]

const TYPE_FILTERS = [
  { label: 'All Types',         value: 'all' },
  { label: 'Physical Products', value: 'physical' },
  { label: 'Digital Products',  value: 'digital' },
  { label: 'Courses',           value: 'courses' },
  { label: 'Templates',         value: 'templates' },
]

const matchesType = (p, t) => {
  switch (t) {
    case 'physical':  return p.is_digital === false
    case 'digital':   return p.is_digital === true
    case 'courses':   return (p.category || '').toLowerCase().includes('course')
    case 'templates': return (p.category || '').toLowerCase().includes('template')
    default:          return true
  }
}

const PLATFORM_FEE_RATE = 0.10

const matchesPrice = (price, bucket) => {
  const p = Number(price)
  switch (bucket) {
    case 'under25': return p < 25
    case '25-50':   return p >= 25 && p <= 50
    case '50-100':  return p > 50 && p <= 100
    case '100+':    return p > 100
    default:        return true
  }
}

const makeTrackingCode = (handle, productId) =>
  `${(handle || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${productId.slice(0, 8)}`

export default function ProductMarketplace() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [sellers,  setSellers]  = useState({})  // id -> { full_name, avatar_url }
  const [myLinks,  setMyLinks]  = useState({})  // product_id -> affiliate_link
  const [loading,  setLoading]  = useState(true)

  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [price,    setPrice]    = useState('all')
  const [type,     setType]     = useState('all')

  const [buying,  setBuying]  = useState(null) // product in buy-confirm modal

  useEffect(() => {
    supabase.from('shop_products').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const list = data || []
        setProducts(list)
        // fetch seller names separately (no FK embed)
        const ids = [...new Set(list.map(p => p.seller_id).filter(Boolean))]
        if (ids.length) {
          const { data: us } = await supabase.from('users').select('id, full_name, avatar_url').in('id', ids)
          const m = {}
          ;(us || []).forEach(u => { m[u.id] = u })
          setSellers(m)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('affiliate_links').select('*').eq('creator_id', user.id)
      .then(({ data }) => {
        const m = {}
        ;(data || []).forEach(l => { m[l.product_id] = l })
        setMyLinks(m)
      })
  }, [user?.id])

  const filtered = useMemo(() => products.filter(p => {
    if (!matchesType(p, type)) return false
    if (category !== 'All' && p.category !== category) return false
    if (!matchesPrice(p.price, price)) return false
    if (search.trim() && !p.title?.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  }), [products, type, category, price, search])

  // ── Buy Now ──────────────────────────────────────────────────────────────
  const confirmBuy = async (product) => {
    if (!user?.id) { toast.error('Sign in to buy'); navigate('/login?returnUrl=/shop'); return }
    try {
      const p = Number(product.price)
      const rate = Number(product.commission_rate)
      const commission   = product.allow_affiliates ? +(p * rate / 100).toFixed(2) : 0
      const platformFee  = +(p * PLATFORM_FEE_RATE).toFixed(2)
      const sellerPayout = +(p - commission - platformFee).toFixed(2)
      const { error } = await supabase.from('shop_orders').insert({
        buyer_id: user.id,
        product_id: product.id,
        seller_id: product.seller_id,
        quantity: 1,
        unit_price: p,
        total_amount: p,
        commission_amount: commission,
        platform_fee: platformFee,
        seller_payout: sellerPayout,
        status: 'pending',
      })
      if (error) throw error
      setBuying(null)
      toast.success('🎉 Order placed! Check My Orders for details.')
    } catch (err) {
      toast.error(err.message || 'Purchase failed')
    }
  }

  // ── Promote ──────────────────────────────────────────────────────────────
  const promote = async (product) => {
    if (!user?.id) { toast.error('Sign in to promote'); navigate('/login?returnUrl=/shop'); return }
    if (myLinks[product.id]) {
      toast.success(`Already promoting · code ${myLinks[product.id].tracking_code}`)
      return
    }
    const handle = user.username || user.full_name || user.email?.split('@')[0]
    try {
      const { data, error } = await supabase.from('affiliate_links').insert({
        creator_id: user.id,
        product_id: product.id,
        tracking_code: makeTrackingCode(handle, product.id),
      }).select().single()
      if (error) throw error
      setMyLinks(prev => ({ ...prev, [product.id]: data }))
      toast.success(`Promoting! Your code: ${data.tracking_code}`)
    } catch (err) {
      toast.error(err.message || 'Could not create affiliate link')
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Philomni Shop</h1>
            <p className="text-sm text-muted-foreground">Discover products from creators &amp; brands</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/affiliate" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
            <Sparkles className="w-4 h-4 text-primary" /> Affiliate
          </Link>
          <Link to="/seller-dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Store className="w-4 h-4" /> Sell
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              type === t.value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Price:</span>
        {PRICE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setPrice(f.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              price === f.value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const seller = sellers[p.seller_id]
            const promoting = !!myLinks[p.id]
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
                <Link to={`/product/${p.id}`} className="block aspect-square bg-muted overflow-hidden relative">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>}
                  {p.allow_affiliates && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Affiliate
                    </span>
                  )}
                  {p.sample_available && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                      <Gift className="w-2.5 h-2.5" /> Sample
                    </span>
                  )}
                </Link>
                <div className="p-3 flex flex-col flex-1">
                  <Link to={`/product/${p.id}`} className="text-sm font-semibold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">{p.title}</Link>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{seller?.full_name || 'Seller'}</p>
                  <p className="text-base font-bold text-foreground mt-1">${Number(p.price).toFixed(2)}</p>
                  <div className="flex gap-2 mt-2.5">
                    <button onClick={() => setBuying(p)}
                      className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                      Buy Now
                    </button>
                    {p.allow_affiliates && user && (
                      <button onClick={() => promote(p)} title="Promote &amp; earn commission"
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          promoting ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}>
                        {promoting ? <Check className="w-3.5 h-3.5" /> : 'Promote'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Buy confirm modal */}
      {buying && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setBuying(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setBuying(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden mb-3 flex items-center justify-center text-2xl">
              {buying.images?.[0] ? <img src={buying.images[0]} className="w-full h-full object-cover" alt="" /> : '🛍️'}
            </div>
            <h3 className="font-bold text-foreground mb-0.5">{buying.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">By {sellers[buying.seller_id]?.full_name || 'Seller'}</p>
            <p className="text-2xl font-bold text-foreground mb-1">${Number(buying.price).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mb-5">{buying.is_digital ? 'Digital · instant access' : 'Physical · ships to you'}</p>
            <div className="flex gap-3">
              <button onClick={() => setBuying(null)} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => confirmBuy(buying)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                <DollarSign className="w-4 h-4" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
