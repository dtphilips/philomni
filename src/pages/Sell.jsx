import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Package, Plus, DollarSign, Download, Eye, EyeOff,
  Trash2, Edit3, Loader2, BarChart2, Upload,
} from 'lucide-react'

const CATEGORIES = ['Templates', 'eBooks', 'Presets', 'Software', 'Music', 'Graphics', 'Other']

export default function Sell() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('my-products')
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState(null)

  const empty = { title: '', description: '', category: 'Templates', price: '', thumbnail_url: '', file_url: '' }
  const [form, setForm] = useState(empty)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!user?.id) return
    supabase.from('digital_products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [user?.id])

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) return toast.error('Product title is required')
    if (!form.price || parseFloat(form.price) <= 0) return toast.error('Price must be greater than 0')
    if (!form.file_url.trim()) return toast.error('File URL is required')
    setSaving(true)

    try {
      const data = {
        seller_id:    user.id,
        title:        form.title.trim(),
        description:  form.description,
        category:     form.category,
        price:        parseFloat(form.price),
        thumbnail_url: form.thumbnail_url,
        file_url:     form.file_url.trim(),
        is_published: publish,
      }

      if (editId) {
        await supabase.from('digital_products').update(data).eq('id', editId)
      } else {
        await supabase.from('digital_products').insert(data)
      }

      toast.success(publish ? '🎉 Product listed!' : 'Product saved as draft!')
      setForm(empty)
      setEditId(null)
      setTab('my-products')

      const { data: updated } = await supabase.from('digital_products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
      setProducts(updated || [])
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const togglePublish = async (product) => {
    const newVal = !product.is_published
    await supabase.from('digital_products').update({ is_published: newVal }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_published: newVal } : p))
    toast.success(newVal ? 'Product listed!' : 'Product unlisted')
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await supabase.from('digital_products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Product deleted')
  }

  const startEdit = (product) => {
    setForm({
      title:        product.title,
      description:  product.description || '',
      category:     product.category || 'Templates',
      price:        product.price?.toString() || '',
      thumbnail_url: product.thumbnail_url || '',
      file_url:     product.file_url || '',
    })
    setEditId(product.id)
    setTab('create')
  }

  const totalRevenue = products.reduce((s, p) => s + (p.total_revenue || 0), 0)
  const totalSales   = products.reduce((s, p) => s + (p.total_sales || 0), 0)

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Sell Digital Products</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Products',      value: products.length,         icon: Package,    color: 'text-blue-400' },
          { label: 'Total Sales',   value: totalSales,              icon: Download,   color: 'text-purple-400' },
          { label: 'Revenue (85%)', value: `$${(totalRevenue*0.85).toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['my-products','My Products'],['create', editId ? 'Edit Product' : 'Add Product']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'create' && !editId) setForm(empty) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'my-products' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No products yet</p>
            <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mx-auto">
              <Plus className="w-4 h-4" /> Add Your First Product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
                  {p.thumbnail_url ? <img src={p.thumbnail_url} className="w-full h-full object-cover" alt="" /> : '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>${Number(p.price).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{p.total_sales} sales</span>
                    <span className="text-green-400">${((p.total_revenue||0)*0.85).toFixed(2)} earned</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(p)} className={`p-1.5 rounded-lg ${p.is_published ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted'}`}>
                    {p.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => { setTab('create'); setEditId(null); setForm(empty) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <Plus className="w-4 h-4" /> Add Another Product
            </button>
          </div>
        )
      )}

      {tab === 'create' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Product Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Social Media Canva Templates Pack"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="What's included? Who is it for?"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Price (USD) *</label>
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="9.99"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Thumbnail URL</label>
              <input value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">File URL (download link) *</label>
              <input value={form.file_url} onChange={e => set('file_url', e.target.value)}
                placeholder="https://… (Supabase storage, Google Drive, Dropbox)"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">You keep <span className="text-green-400 font-semibold">85%</span> of every sale. Philomni takes a 15% platform fee.</p>

          <div className="flex gap-3">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              List Product
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
