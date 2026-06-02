import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { X, ShoppingBag, Loader2, Check } from 'lucide-react'

const PLATFORM_FEE_RATE = 0.10 // 10% platform fee

/**
 * Bottom drawer listing the products tagged on a post, each with a Buy Now button.
 * tags: array of { product_id, title, price, commission_rate, image, affiliate_link_id }
 */
export default function TaggedProductsDrawer({ tags = [], onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [buyingId, setBuyingId] = useState(null)
  const [boughtIds, setBoughtIds] = useState([])

  const buyNow = async (tag) => {
    if (!user?.id) {
      toast.error('Sign in to buy')
      navigate('/login?returnUrl=/')
      return
    }
    setBuyingId(tag.product_id)
    try {
      // Look up the product for seller_id + live price
      const { data: product, error: pErr } = await supabase
        .from('shop_products').select('id, seller_id, price, commission_rate').eq('id', tag.product_id).single()
      if (pErr || !product) throw pErr || new Error('Product unavailable')

      const price        = Number(product.price)
      const rate         = Number(product.commission_rate)
      const commission   = +(price * rate / 100).toFixed(2)
      const platformFee  = +(price * PLATFORM_FEE_RATE).toFixed(2)
      const sellerPayout = +(price - commission - platformFee).toFixed(2)

      // Find the affiliate link (if this tag carried one) to attribute the creator
      let affiliateCreatorId = null
      if (tag.affiliate_link_id) {
        const { data: link } = await supabase.from('affiliate_links').select('creator_id').eq('id', tag.affiliate_link_id).maybeSingle()
        affiliateCreatorId = link?.creator_id || null
      }

      const { error: oErr } = await supabase.from('shop_orders').insert({
        buyer_id: user.id,
        product_id: product.id,
        seller_id: product.seller_id,
        affiliate_creator_id: affiliateCreatorId,
        affiliate_link_id: tag.affiliate_link_id || null,
        quantity: 1,
        unit_price: price,
        total_amount: price,
        commission_amount: commission,
        platform_fee: platformFee,
        seller_payout: sellerPayout,
        status: 'pending',
      })
      if (oErr) throw oErr

      // Best-effort: bump the affiliate link's sales + earnings counters
      if (tag.affiliate_link_id) {
        const { data: link } = await supabase.from('affiliate_links')
          .select('total_sales, total_earned').eq('id', tag.affiliate_link_id).maybeSingle()
        if (link) {
          await supabase.from('affiliate_links').update({
            total_sales:  (link.total_sales || 0) + 1,
            total_earned: +(Number(link.total_earned || 0) + commission).toFixed(2),
          }).eq('id', tag.affiliate_link_id)
        }
      }

      setBoughtIds(prev => [...prev, tag.product_id])
      toast.success('Order placed! Check My Orders for details.')
    } catch (err) {
      toast.error(err.message || 'Could not complete purchase')
    }
    setBuyingId(null)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full sm:max-w-md bg-card border-t sm:border border-border sm:rounded-2xl rounded-t-2xl max-h-[70vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Shop this post ({tags.length})</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto p-3 space-y-2">
          {tags.map(tag => {
            const bought = boughtIds.includes(tag.product_id)
            return (
              <div key={tag.product_id} className="flex items-center gap-3 p-2 rounded-xl border border-border">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
                  {tag.image ? <img src={tag.image} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{tag.title}</p>
                  <p className="text-sm font-bold text-foreground">${Number(tag.price).toFixed(2)}</p>
                </div>
                <button onClick={() => buyNow(tag)} disabled={buyingId === tag.product_id || bought}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 ${
                    bought ? 'bg-green-500/15 text-green-400' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
                  }`}>
                  {buyingId === tag.product_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : bought ? <><Check className="w-3.5 h-3.5" /> Ordered</>
                    : 'Buy Now'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
