import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Search, X, Check, ShoppingBag, Loader2 } from 'lucide-react'

const MAX_TAGS = 5

/**
 * Modal for tagging up to 5 shop products on a post.
 * onConfirm(selectedTags) — each tag: { product_id, title, price, commission_rate, image, affiliate_link_id }
 */
export default function ProductTagPicker({ initial = [], onClose, onConfirm }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [myLinks, setMyLinks]   = useState({}) // product_id -> affiliate_link_id
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(initial) // array of tag objects

  useEffect(() => {
    supabase.from('shop_products').select('id, title, price, commission_rate, images').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
    if (user?.id) {
      supabase.from('affiliate_links').select('id, product_id').eq('creator_id', user.id)
        .then(({ data }) => {
          const m = {}
          ;(data || []).forEach(l => { m[l.product_id] = l.id })
          setMyLinks(m)
        })
    }
  }, [user?.id])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => p.title.toLowerCase().includes(q))
  }, [products, query])

  const isSelected = (id) => selected.some(s => s.product_id === id)

  const toggle = (p) => {
    if (isSelected(p.id)) {
      setSelected(prev => prev.filter(s => s.product_id !== p.id))
      return
    }
    if (selected.length >= MAX_TAGS) return
    setSelected(prev => [...prev, {
      product_id: p.id,
      title: p.title,
      price: Number(p.price),
      commission_rate: Number(p.commission_rate),
      image: p.images?.[0] || null,
      affiliate_link_id: myLinks[p.id] || null,
    }])
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Tag products ({selected.length}/{MAX_TAGS})</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No products found.</p>
          ) : (
            filtered.map(p => {
              const sel = isSelected(p.id)
              const disabled = !sel && selected.length >= MAX_TAGS
              return (
                <button key={p.id} onClick={() => toggle(p)} disabled={disabled}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left ${
                    sel ? 'bg-primary/10' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-base">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${sel ? 'text-primary' : 'text-foreground'}`}>{p.title}</p>
                    <p className="text-xs text-muted-foreground">${Number(p.price).toFixed(2)} · {Number(p.commission_rate)}% commission</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${sel ? 'bg-primary border-primary' : 'border-border'}`}>
                    {sel && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <button onClick={() => onConfirm(selected)}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            Done {selected.length > 0 && `· ${selected.length} tagged`}
          </button>
        </div>
      </div>
    </div>
  )
}
