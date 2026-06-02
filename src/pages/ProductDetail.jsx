import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Loader2, ShoppingBag, DollarSign, Gift, Sparkles, Check, X,
  ChevronLeft, Store,
} from 'lucide-react'

const PLATFORM_FEE_RATE = 0.10
const makeTrackingCode = (handle, productId) =>
  `${(handle || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${productId.slice(0, 8)}`

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [seller,  setSeller]  = useState(null)
  const [myLink,  setMyLink]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [buying, setBuying]   = useState(false)
  const [bought, setBought]   = useState(false)
  const [sampleOpen, setSampleOpen] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: p } = await supabase.from('shop_products').select('*').eq('id', id).maybeSingle()
      if (!alive) return
      setProduct(p || null)
      if (p?.seller_id) {
        const { data: s } = await supabase.from('users').select('id, full_name, avatar_url').eq('id', p.seller_id).maybeSingle()
        if (alive) setSeller(s || null)
      }
      if (p && user?.id) {
        const { data: l } = await supabase.from('affiliate_links').select('*').eq('creator_id', user.id).eq('product_id', p.id).maybeSingle()
        if (alive) setMyLink(l || null)
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [id, user?.id])

  const buyNow = async () => {
    if (!user?.id) { toast.error('Sign in to buy'); navigate(`/login?returnUrl=/product/${id}`); return }
    setBuying(true)
    try {
      const p = Number(product.price)
      const rate = Number(product.commission_rate)
      const commission   = product.allow_affiliates ? +(p * rate / 100).toFixed(2) : 0
      const platformFee  = +(p * PLATFORM_FEE_RATE).toFixed(2)
      const sellerPayout = +(p - commission - platformFee).toFixed(2)
      const { error } = await supabase.from('shop_orders').insert({
        buyer_id: user.id, product_id: product.id, seller_id: product.seller_id,
        quantity: 1, unit_price: p, total_amount: p,
        commission_amount: commission, platform_fee: platformFee, seller_payout: sellerPayout,
        status: 'pending',
      })
      if (error) throw error
      setBought(true)
      toast.success('🎉 Order placed! Check My Orders.')
    } catch (err) {
      toast.error(err.message || 'Purchase failed')
    }
    setBuying(false)
  }

  const promote = async () => {
    if (!user?.id) { toast.error('Sign in to promote'); navigate(`/login?returnUrl=/product/${id}`); return }
    if (myLink) { toast.success(`Already promoting · ${myLink.tracking_code}`); return }
    const handle = user.username || user.full_name || user.email?.split('@')[0]
    try {
      const { data, error } = await supabase.from('affiliate_links').insert({
        creator_id: user.id, product_id: product.id, tracking_code: makeTrackingCode(handle, product.id),
      }).select().single()
      if (error) throw error
      setMyLink(data)
      toast.success(`Promoting! Your code: ${data.tracking_code}`)
    } catch (err) {
      toast.error(err.message || 'Could not create affiliate link')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm mb-4">Product not found.</p>
        <Link to="/shop" className="text-primary text-sm font-semibold">← Back to shop</Link>
      </div>
    )
  }

  const price = Number(product.price)
  const rate  = Number(product.commission_rate)
  const images = product.images?.length ? product.images : [null]

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden flex items-center justify-center text-5xl">
            {images[activeImg] ? <img src={images[activeImg]} alt={product.title} className="w-full h-full object-cover" /> : '🛍️'}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex items-center justify-center text-lg ${i === activeImg ? 'border-primary' : 'border-transparent'}`}>
                  {img ? <img src={img} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{product.category}</span>
              {product.allow_affiliates && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Affiliate
                </span>
              )}
              {product.sample_available && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold flex items-center gap-1">
                  <Gift className="w-2.5 h-2.5" /> Sample
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
            <p className="text-2xl font-bold text-foreground mt-1">${price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{product.is_digital ? 'Digital · instant access' : 'Physical · ships to you'}</p>
          </div>

          {/* Seller */}
          {seller && (
            <Link to={`/profile/${seller.id}`} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-semibold text-sm">
                {seller.avatar_url ? <img src={seller.avatar_url} className="w-full h-full object-cover" alt="" /> : (seller.full_name?.[0]?.toUpperCase() ?? '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Sold by</p>
                <p className="text-sm font-semibold text-foreground truncate">{seller.full_name || 'Seller'}</p>
              </div>
              <Store className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}

          {product.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>}

          {/* Affiliate commission info */}
          {product.allow_affiliates && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Earn {rate}% promoting this
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Creators earn ${(price * rate / 100).toFixed(2)} on every sale through their link.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button onClick={buyNow} disabled={buying || bought}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                bought ? 'bg-green-500/15 text-green-400' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
              }`}>
              {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : bought ? <><Check className="w-4 h-4" /> Ordered</> : <><DollarSign className="w-4 h-4" /> Buy Now · ${price.toFixed(2)}</>}
            </button>
            <div className="flex gap-2">
              {product.allow_affiliates && (
                <button onClick={promote}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    myLink ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}>
                  {myLink ? <><Check className="w-4 h-4" /> Promoting</> : <><Sparkles className="w-4 h-4" /> Promote This</>}
                </button>
              )}
              {product.sample_available && (
                <button onClick={() => setSampleOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-500 text-sm font-semibold hover:bg-amber-500/25 transition-colors">
                  <Gift className="w-4 h-4" /> Request Sample
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {sampleOpen && <SampleModal product={product} user={user} onClose={() => setSampleOpen(false)} />}
    </div>
  )
}

// ── Sample request modal ──────────────────────────────────────────────────────
function SampleModal({ product, user, onClose }) {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()

  const submit = async () => {
    if (!user?.id) { toast.error('Sign in to request samples'); navigate(`/login?returnUrl=/product/${product.id}`); return }
    if (!address.trim()) { toast.error('Shipping address is required'); return }
    setSending(true)
    try {
      const { error } = await supabase.from('sample_requests').insert({
        creator_id: user.id, product_id: product.id, seller_id: product.seller_id,
        shipping_address: { raw: address.trim() }, message: message.trim() || null,
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
            placeholder="Tell them about your audience"
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
