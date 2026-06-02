import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  TrendingUp, Loader2, DollarSign, Clock, Calendar, ShoppingBag,
  Trash2, MousePointerClick, Package, Copy, Check,
} from 'lucide-react'

export default function AffiliateEarnings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [links, setLinks]     = useState([])   // affiliate_links joined with product
  const [orders, setOrders]   = useState([])   // shop_orders where affiliate_creator_id = me
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const loadAll = async () => {
    if (!user?.id) { setLoading(false); return }
    const [{ data: l }, { data: o }] = await Promise.all([
      supabase.from('affiliate_links').select('*, shop_products(title, price, commission_rate, images)').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('shop_orders').select('*').eq('affiliate_creator_id', user.id).order('created_at', { ascending: false }),
    ])
    setLinks(l || [])
    setOrders(o || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const totalEarned = links.reduce((s, l) => s + Number(l.total_earned || 0), 0)
    const now = new Date()
    const thisMonth = orders
      .filter(o => {
        const d = new Date(o.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, o) => s + Number(o.commission_amount || 0), 0)
    const pending = orders.filter(o => o.status !== 'paid')
      .reduce((s, o) => s + Number(o.commission_amount || 0), 0)
    return { totalEarned, thisMonth, pending }
  }, [links, orders])

  const stopPromoting = async (linkId) => {
    if (!window.confirm('Stop promoting this product? Your affiliate link will be removed.')) return
    await supabase.from('affiliate_links').delete().eq('id', linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
    toast.success('Stopped promoting')
  }

  const copyLink = (link) => {
    const url = `${window.location.origin}/?ref=${link.tracking_code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Affiliate Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your commissions and promoted products</p>
          </div>
        </div>
        <button onClick={() => navigate('/affiliate')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <ShoppingBag className="w-4 h-4" /> Browse Products
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Earned', value: `$${stats.totalEarned.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', sub: 'all time' },
          { label: 'Pending Payout', value: `$${stats.pending.toFixed(2)}`, icon: Clock, color: 'text-amber-400', sub: 'not yet paid' },
          { label: 'This Month', value: `$${stats.thisMonth.toFixed(2)}`, icon: Calendar, color: 'text-blue-400', sub: 'commissions' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Products I'm promoting */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" /> Products I&apos;m Promoting
        </h2>
        {links.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">You&apos;re not promoting anything yet.</p>
            <Link to="/affiliate" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              <ShoppingBag className="w-4 h-4" /> Find Products to Promote
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map(l => {
              const prod = l.shop_products
              return (
                <div key={l.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-lg">
                    {prod?.images?.[0] ? <img src={prod.images[0]} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{prod?.title || 'Product'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{l.total_clicks}</span>
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{l.total_sales} sales</span>
                      <span className="text-green-400">${Number(l.total_earned).toFixed(2)} earned</span>
                      {prod && <span className="text-primary">{Number(prod.commission_rate)}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copyLink(l)} title="Copy affiliate link"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted">
                      {copiedId === l.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => stopPromoting(l.id)} title="Stop promoting"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" /> Payout History
        </h2>
        {orders.length === 0 ? (
          <div className="text-center py-8 bg-card border border-border rounded-2xl text-muted-foreground text-sm">
            No commissions yet. Sales through your links will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Sale #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-400">+${Number(o.commission_amount || 0).toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    o.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-500'
                  }`}>{o.status === 'paid' ? 'paid' : 'pending'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
