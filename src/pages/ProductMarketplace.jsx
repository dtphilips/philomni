import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { addToWallet } from '../lib/wallet'
import { toast } from 'sonner'
import {
  ShoppingBag, Search, Download, Star, Loader2,
  Tag, Package, ExternalLink, X, DollarSign,
} from 'lucide-react'

const CATEGORIES = ['All', 'Templates', 'eBooks', 'Presets', 'Software', 'Music', 'Graphics', 'Other']

const TYPE_ICON = {
  pdf:  '📄', zip: '📦', mp3: '🎵', mp4: '🎬', ai: '🎨', psd: '🎨', default: '📁'
}

function ProductCard({ product, onBuy, purchases }) {
  const owned = purchases.has(product.id)
  const ext = product.file_url?.split('.').pop()?.toLowerCase() || 'default'
  const icon = TYPE_ICON[ext] || TYPE_ICON.default

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all flex flex-col">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {product.thumbnail_url
          ? <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{icon}</div>
        }
        {owned && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Owned</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 flex-1">{product.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-1 mb-3">
          <Download className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{product.total_sales || 0} sales</span>
          <span className="mx-1 text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground">{product.users?.full_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">${Number(product.price).toFixed(2)}</span>
          {owned ? (
            <a href={product.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          ) : (
            <button onClick={() => onBuy(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductMarketplace() {
  const { user } = useAuth()
  const { plan, isAdmin } = useSubscription()
  const [products,  setProducts]  = useState([])
  const [purchases, setPurchases] = useState(new Set())
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [buying,    setBuying]    = useState(null) // product being confirmed

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let q = supabase
        .from('digital_products')
        .select('*, users!digital_products_seller_id_fkey(id,full_name,avatar_url)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (category !== 'All') q = q.eq('category', category)
      if (search) q = q.ilike('title', `%${search}%`)

      const { data } = await q
      setProducts(data || [])

      if (user?.id) {
        const { data: p } = await supabase
          .from('product_purchases')
          .select('product_id')
          .eq('buyer_id', user.id)
        setPurchases(new Set(p?.map(x => x.product_id) || []))
      }
      setLoading(false)
    }
    fetch()
  }, [user?.id, search, category])

  const handleBuy = async (product) => {
    if (!user?.id) return toast.error('Sign in to purchase')
    setBuying(null)

    try {
      const { error } = await supabase.from('product_purchases').insert({
        buyer_id: user.id,
        product_id: product.id,
        amount_paid: product.price,
      })
      if (error) throw error

      await supabase.from('digital_products').update({
        total_sales: (product.total_sales || 0) + 1,
        total_revenue: (product.total_revenue || 0) + product.price,
      }).eq('id', product.id)

      // 85% to seller
      const sellerShare = product.price * 0.85
      await addToWallet(product.seller_id, sellerShare, 'product_sale', `Product sale: ${product.title}`, product.id)

      setPurchases(prev => new Set([...prev, product.id]))
      toast.success('🎉 Purchase successful! Download link is now available.')
    } catch (err) {
      toast.error(err.message || 'Purchase failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Digital Marketplace</h1>
        </div>
        <Link to="/sell" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <Package className="w-4 h-4" /> Sell Products
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search digital products…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onBuy={setBuying} purchases={purchases} />
          ))}
        </div>
      )}

      {/* Buy confirm modal */}
      {buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBuying(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <button onClick={() => setBuying(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <Package className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-foreground mb-1">{buying.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">By {buying.users?.full_name}</p>
            <p className="text-2xl font-bold text-foreground mb-1">${Number(buying.price).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mb-6">One-time purchase · Instant download</p>
            <div className="flex gap-3">
              <button onClick={() => setBuying(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => handleBuy(buying)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                <DollarSign className="w-4 h-4" /> Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
