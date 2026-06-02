import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ShoppingBag, Loader2, TrendingUp, Gift, Copy, Check, X,
  DollarSign, Tag, Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Fashion & Clothing',
  'Shoes & Footwear',
  'Bags & Purses',
  'Jewelry & Accessories',
  'Beauty & Skincare',
  'Hair & Wigs',
  'Nails & Nail Art',
  'Health & Wellness',
  'Fitness & Sports',
  'Home & Kitchen',
  'Home Decor',
  'Bedding & Bath',
  'Baby & Kids',
  'Toys & Games',
  'Food & Snacks',
  'Drinks & Beverages',
  'Pet Supplies',
  'Electronics & Gadgets',
  'Phone Accessories',
  'Laptops & Computers',
  'Books & Stationery',
  'Art & Craft Supplies',
  'Music & Instruments',
  'Automotive',
  'Garden & Outdoor',
  'Travel & Luggage',
  'Adult 18+',
  'Digital Products',
  'Courses & Education',
  'Software & Tools',
  'Other',
]
const COMMISSION_FILTERS = [
  { label: 'Any',  value: 0 },
  { label: '10%+', value: 10 },
  { label: '20%+', value: 20 },
  { label: '30%+', value: 30 },
]

// tracking code = creator handle + short product hash
const makeTrackingCode = (handle, productId) =>
  `${(handle || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${productId.slice(0, 8)}`

export default function AffiliateMarketplace() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [myLinks,  setMyLinks]  = useState({})   // product_id -> affiliate_link row
  const [loading,  setLoading]  = useState(true)

  // filters
  const [category,     setCategory]     = useState('All')
  const [minCommission, setMinCommission] = useState(0)
  const [samplesOnly,  setSamplesOnly]  = useState(false)

  // modals
  const [promoteModal, setPromoteModal] = useState(null) // { product, link }
  const [sampleModal,  setSampleModal]  = useState(null) // { product }

  useEffect(() => {
    supabase.from('shop_products').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  // Load this creator's existing affiliate links so we can show "Promoting"
  useEffect(() => {
    if (!user?.id) return
    supabase.from('affiliate_links').select('*').eq('creator_id', user.id)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(l => { map[l.product_id] = l })
        setMyLinks(map)
      })
  }, [user?.id])

  const filtered = useMemo(() => products.filter(p => {
    if (category !== 'All' && p.category !== category) return false
    if (Number(p.commission_rate) < minCommission) return false
    if (samplesOnly && !p.sample_available) return false
    return true
  }), [products, category, minCommission, samplesOnly])

  const handlePromote = async (product) => {
    if (!user?.id) { toast.error('Sign in to promote products'); navigate('/login?returnUrl=/affiliate'); return }
    // Already promoting? Just open the modal with the existing link.
    if (myLinks[product.id]) { setPromoteModal({ product, link: myLinks[product.id] }); return }

    const handle = user.username || user.full_name || user.email?.split('@')[0]
    const tracking_code = makeTrackingCode(handle, product.id)
    try {
      const { data, error } = await supabase.from('affiliate_links').insert({
        creator_id: user.id,
        product_id: product.id,
        tracking_code,
      }).select().single()
      if (error) throw error
      setMyLinks(prev => ({ ...prev, [product.id]: data }))
      setPromoteModal({ product, link: data })
      toast.success('You are now promoting this product! 🎉')
    } catch (err) {
      toast.error(err.message || 'Could not create affiliate link')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Philomni Affiliate</h1>
            <p className="text-sm text-muted-foreground">Earn commissions promoting products you love</p>
          </div>
        </div>
        <button onClick={() => navigate('/affiliate-earnings')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
          <TrendingUp className="w-4 h-4 text-green-400" /> My Earnings
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Commission:</span>
            {COMMISSION_FILTERS.map(f => (
              <button key={f.value} onClick={() => setMinCommission(f.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  minCommission === f.value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => setSamplesOnly(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              samplesOnly ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            <Gift className="w-3.5 h-3.5" /> Sample Available
          </button>
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const price = Number(p.price)
            const rate  = Number(p.commission_rate)
            const earn  = (price * rate / 100)
            const promoting = !!myLinks[p.id]
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                {/* Image */}
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" />{rate}% commission
                  </span>
                  {p.sample_available && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                      <Gift className="w-2.5 h-2.5" /> Sample
                    </span>
                  )}
                </div>
                {/* Body */}
                <div className="p-3.5 flex flex-col flex-1">
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Buyer pays</p>
                      <p className="text-sm font-bold text-foreground">${price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">You earn / sale</p>
                      <p className="text-sm font-bold text-green-400">${earn.toFixed(2)}</p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handlePromote(p)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        promoting ? 'bg-primary/15 text-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}>
                      {promoting ? <><Check className="w-3.5 h-3.5" /> Promoting</> : <><Sparkles className="w-3.5 h-3.5" /> Promote This</>}
                    </button>
                    {p.sample_available && (
                      <button onClick={() => setSampleModal({ product: p })}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-500 text-xs font-semibold hover:bg-amber-500/25 transition-colors">
                        <Gift className="w-3.5 h-3.5" /> Sample
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {promoteModal && <PromoteModal {...promoteModal} onClose={() => setPromoteModal(null)} />}
      {sampleModal  && <SampleModal product={sampleModal.product} user={user} onClose={() => setSampleModal(null)} />}
    </div>
  )
}

// ─── Promote success modal ────────────────────────────────────────────────────
function PromoteModal({ product, link, onClose }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/?ref=${link.tracking_code}`
  const rate = Number(product.commission_rate)

  const copy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center"><Check className="w-5 h-5 text-green-400" /></div>
            <h3 className="text-lg font-bold text-foreground">You&apos;re promoting!</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          Tag <span className="font-semibold text-foreground">{product.title}</span> in your posts and reels.
          You earn <span className="font-semibold text-green-400">{rate}%</span> (${(Number(product.price)*rate/100).toFixed(2)}) on every sale through your link.
        </p>
        <div>
          <label className="text-xs text-muted-foreground">Your affiliate link</label>
          <div className="flex items-center gap-2 mt-1">
            <input readOnly value={shareUrl}
              className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground truncate" />
            <button onClick={copy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tracking code: <span className="font-mono">{link.tracking_code}</span></p>
        </div>
      </div>
    </div>
  )
}

// ─── Sample request modal ─────────────────────────────────────────────────────
function SampleModal({ product, user, onClose }) {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!user?.id) { toast.error('Sign in to request samples'); return }
    if (!address.trim()) { toast.error('Shipping address is required'); return }
    setSending(true)
    try {
      const { error } = await supabase.from('sample_requests').insert({
        creator_id: user.id,
        product_id: product.id,
        seller_id:  product.seller_id,
        shipping_address: { raw: address.trim() },
        message: message.trim() || null,
      })
      if (error) throw error
      toast.success('Sample request sent! Seller will review within 48 hours.')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not send request')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><Gift className="w-5 h-5 text-amber-500" /></div>
            <h3 className="text-lg font-bold text-foreground">Request a free sample</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">Request a free <span className="font-semibold text-foreground">{product.title}</span> to review and promote.</p>
        <div>
          <label className="text-xs text-muted-foreground">Shipping address *</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3}
            placeholder="Full name, street, city, state, ZIP, country"
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Message to seller (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            placeholder="Tell them about your audience and how you'd promote this"
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={submit} disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />} Send Sample Request
        </button>
      </div>
    </div>
  )
}
