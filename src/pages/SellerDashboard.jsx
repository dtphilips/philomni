import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Store, Package, Plus, DollarSign, Eye, EyeOff, Trash2, Edit3,
  Loader2, ShoppingCart, Users, Gift, Upload, Check, XCircle, TrendingUp,
} from 'lucide-react'

const CATEGORIES = ['Courses', 'Templates', 'Apparel', 'Music', 'Software', 'eBooks', 'Other']
const PLATFORM_FEE = 0.10 // 10% platform fee on seller payout

const EMPTY = {
  title: '', description: '', price: '', commission_rate: 15,
  category: 'Courses', images: [], inventory_count: 100,
  is_digital: true, sample_available: false, sample_limit: 10,
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders]     = useState([])
  const [affiliates, setAffiliates] = useState([])
  const [samples, setSamples]   = useState([])
  const [loading, setLoading]   = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadAll = async () => {
    if (!user?.id) return
    const [{ data: prods }, { data: ords }, { data: affs }, { data: samps }] = await Promise.all([
      supabase.from('shop_products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('shop_orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_links').select('*, shop_products(title)').in('product_id',
        (await supabase.from('shop_products').select('id').eq('seller_id', user.id)).data?.map(p => p.id) || ['00000000-0000-0000-0000-000000000000']),
      supabase.from('sample_requests').select('*, shop_products(title)').eq('seller_id', user.id).order('created_at', { ascending: false }),
    ])
    setProducts(prods || [])
    setOrders(ords || [])
    setAffiliates(affs || [])
    setSamples(samps || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSales   = orders.length
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
    const pendingPayout = orders.filter(o => o.status !== 'paid')
      .reduce((s, o) => s + Number(o.seller_payout || 0), 0)
    return { products: products.length, totalSales, totalRevenue, pendingPayout }
  }, [products, orders])

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = []
      for (const file of files) {
        const path = `shop/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
        const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
        urls.push(publicUrl)
      }
      set('images', [...form.images, ...urls])
      toast.success(`${urls.length} image(s) uploaded`)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    }
    setUploading(false)
    e.target.value = ''
  }

  // ── Save product ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.price || parseFloat(form.price) <= 0) return toast.error('Price must be greater than 0')
    setSaving(true)
    try {
      const payload = {
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description,
        price: parseFloat(form.price),
        commission_rate: Number(form.commission_rate),
        category: form.category,
        images: form.images,
        inventory_count: parseInt(form.inventory_count) || 0,
        is_digital: form.is_digital,
        sample_available: form.sample_available,
        sample_limit: form.sample_available ? (parseInt(form.sample_limit) || 0) : 0,
      }
      if (editId) await supabase.from('shop_products').update(payload).eq('id', editId)
      else        await supabase.from('shop_products').insert(payload)
      toast.success(editId ? 'Product updated!' : '🎉 Product listed!')
      setForm(EMPTY); setEditId(null); setShowForm(false)
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const toggleActive = async (p) => {
    await supabase.from('shop_products').update({ is_active: !p.is_active }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }
  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await supabase.from('shop_products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Product deleted')
  }
  const startEdit = (p) => {
    setForm({
      title: p.title, description: p.description || '', price: String(p.price),
      commission_rate: Number(p.commission_rate), category: p.category || 'Courses',
      images: p.images || [], inventory_count: p.inventory_count ?? 100,
      is_digital: p.is_digital, sample_available: p.sample_available, sample_limit: p.sample_limit ?? 10,
    })
    setEditId(p.id); setShowForm(true)
  }

  // ── Sample request actions ──────────────────────────────────────────────────
  const updateSample = async (id, status) => {
    await supabase.from('sample_requests').update({ status }).eq('id', id)
    setSamples(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    toast.success(status === 'approved' ? 'Sample approved' : 'Sample declined')
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  const TABS = [
    ['products', 'Products', Package],
    ['orders', 'Orders', ShoppingCart],
    ['affiliates', 'Affiliates', Users],
    ['samples', 'Sample Requests', Gift],
  ]

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your products, orders, and affiliates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Products', value: stats.products, icon: Package, color: 'text-blue-400' },
          { label: 'Total Sales', value: stats.totalSales, icon: ShoppingCart, color: 'text-purple-400' },
          { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Pending Payout', value: `$${stats.pendingPayout.toFixed(2)}`, icon: TrendingUp, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3.5">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([t, l, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {l}
            {t === 'samples' && samples.filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-0.5 px-1.5 rounded-full bg-amber-500 text-white text-[10px]">{samples.filter(s => s.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="space-y-3">
          {!showForm && (
            <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}

          {showForm && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Social Media Growth Masterclass"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Price (USD) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                    placeholder="49.00"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Commission slider */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Affiliate commission: <span className="text-primary font-semibold">{form.commission_rate}%</span>
                    <span className="text-muted-foreground"> · creators earn ${((parseFloat(form.price)||0) * form.commission_rate/100).toFixed(2)}/sale</span>
                  </label>
                  <input type="range" min="5" max="50" step="1" value={form.commission_rate}
                    onChange={e => set('commission_rate', Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer" />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Inventory</label>
                  <input type="number" min="0" value={form.inventory_count} onChange={e => set('inventory_count', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={form.is_digital} onChange={e => set('is_digital', e.target.checked)} className="accent-primary w-4 h-4" />
                    Digital product
                  </label>
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">Images</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px]">×</button>
                      </div>
                    ))}
                    <label className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 text-muted-foreground">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {/* Samples */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={form.sample_available} onChange={e => set('sample_available', e.target.checked)} className="accent-amber-500 w-4 h-4" />
                    <Gift className="w-4 h-4 text-amber-500" /> Offer free samples to creators
                  </label>
                  {form.sample_available && (
                    <div className="pl-6">
                      <label className="block text-xs text-muted-foreground mb-1.5">Sample limit (total free units)</label>
                      <input type="number" min="0" value={form.sample_limit} onChange={e => set('sample_limit', e.target.value)}
                        className="w-32 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY) }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {editId ? 'Update Product' : 'List Product'}
                </button>
              </div>
            </div>
          )}

          {products.length === 0 && !showForm ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products yet — add your first one above.</p>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span>${Number(p.price).toFixed(2)}</span>
                    <span className="text-primary">{Number(p.commission_rate)}% commission</span>
                    <span>{p.inventory_count} in stock</span>
                    {p.sample_available && <span className="text-amber-500">samples on</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(p)} title={p.is_active ? 'Active' : 'Hidden'}
                    className={`p-1.5 rounded-lg ${p.is_active ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted'}`}>
                    {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ORDERS TAB ───────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        orders.length === 0 ? (
          <Empty icon={ShoppingCart} text="No orders yet." />
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · qty {o.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">${Number(o.total_amount).toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    o.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-500'
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── AFFILIATES TAB ───────────────────────────────────────────────────── */}
      {tab === 'affiliates' && (
        affiliates.length === 0 ? (
          <Empty icon={Users} text="No creators are promoting your products yet." />
        ) : (
          <div className="space-y-2">
            {affiliates.map(a => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.shop_products?.title || 'Product'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.tracking_code}</p>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-center"><p className="font-bold text-foreground">{a.total_clicks}</p><p className="text-muted-foreground">clicks</p></div>
                  <div className="text-center"><p className="font-bold text-foreground">{a.total_sales}</p><p className="text-muted-foreground">sales</p></div>
                  <div className="text-center"><p className="font-bold text-green-400">${Number(a.total_earned).toFixed(2)}</p><p className="text-muted-foreground">earned</p></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── SAMPLE REQUESTS TAB ──────────────────────────────────────────────── */}
      {tab === 'samples' && (
        samples.length === 0 ? (
          <Empty icon={Gift} text="No sample requests yet." />
        ) : (
          <div className="space-y-2">
            {samples.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.shop_products?.title || 'Product'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  {s.status === 'pending' ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateSample(s.id, 'approved')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold hover:bg-green-500/25">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => updateSample(s.id, 'declined')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive/25">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-destructive/15 text-destructive'
                    }`}>{s.status}</span>
                  )}
                </div>
                {s.message && <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{s.message}</p>}
                {s.shipping_address?.raw && <p className="text-[11px] text-muted-foreground">📦 {s.shipping_address.raw}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
