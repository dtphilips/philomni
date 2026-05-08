import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Loader2, Package, Clock, CheckCircle, XCircle, RefreshCw, ShoppingBag, Store } from 'lucide-react'

const STATUS_CONFIG = {
  pending:            { label: 'Pending',           cls: 'bg-yellow-500/20 text-yellow-400',   icon: '🟡' },
  in_progress:        { label: 'In Progress',       cls: 'bg-blue-500/20 text-blue-400',       icon: '🔵' },
  delivered:          { label: 'Delivered',          cls: 'bg-orange-500/20 text-orange-400',   icon: '🟠' },
  revision_requested: { label: 'Revision Requested',cls: 'bg-purple-500/20 text-purple-400',   icon: '🟣' },
  completed:          { label: 'Completed',          cls: 'bg-emerald-500/20 text-emerald-400', icon: '🟢' },
  cancelled:          { label: 'Cancelled',          cls: 'bg-red-500/20 text-red-400',         icon: '🔴' },
  disputed:           { label: 'Disputed',           cls: 'bg-red-700/20 text-red-300',         icon: '🚨' },
}

function countdown(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  if (diff <= 0) return { label: 'OVERDUE', cls: 'text-red-400 font-bold' }
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return { label: `Due in ${days}d ${hours}h`, cls: 'text-muted-foreground' }
  return { label: `Due in ${hours}h`, cls: hours < 6 ? 'text-orange-400' : 'text-muted-foreground' }
}

function OrderCard({ order, isBuying, navigate }) {
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const title  = order.creator_content?.title ?? 'Order'
  const cover  = order.creator_content?.cover ?? null
  const cat    = order.creator_content?.category ?? ''
  const due    = countdown(order.delivery_deadline)
  const otherParty = isBuying ? (order.seller_name ?? order.seller_id?.slice(0, 8)) : (order.buyer_name ?? order.buyer_id?.slice(0, 8))

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="w-20 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
          {cover
            ? <img src={cover} alt={title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground line-clamp-1">{title}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.cls}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBuying ? 'From' : 'To'}: {otherParty ?? '—'}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm font-bold text-primary">${order.price?.toFixed(2) ?? '0.00'}</span>
            {due && <span className={`text-xs ${due.cls}`}>{due.label}</span>}
            {order.package_type && (
              <span className="text-xs text-muted-foreground capitalize">{order.package_type} package</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex justify-end">
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors">
          View Order →
        </button>
      </div>
    </div>
  )
}

export default function MyOrders() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab]       = useState('buying')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    const col = tab === 'buying' ? 'buyer_id' : 'seller_id'
    supabase.from('orders')
      .select('*, creator_content(title, cover, category)')
      .eq(col, user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [user?.id, tab])

  const statusGroups = {
    active:    orders.filter(o => ['pending','in_progress','delivered','revision_requested'].includes(o.status)),
    completed: orders.filter(o => o.status === 'completed'),
    cancelled: orders.filter(o => ['cancelled','disputed'].includes(o.status)),
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> My Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your purchases and sales</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-muted rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('buying')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'buying' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <ShoppingBag className="w-4 h-4" /> Buying
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'selling' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <Store className="w-4 h-4" /> Selling
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {tab === 'buying' ? 'No purchases yet' : 'No sales yet'}
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            {tab === 'buying'
              ? 'Browse the marketplace to find scripts, beats, courses, and more.'
              : 'List something on the marketplace to start selling.'}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            {tab === 'buying' ? 'Browse Marketplace' : 'Start Selling'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active orders */}
          {statusGroups.active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Active ({statusGroups.active.length})
              </h3>
              <div className="space-y-3">
                {statusGroups.active.map(o => (
                  <OrderCard key={o.id} order={o} isBuying={tab === 'buying'} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {/* Completed orders */}
          {statusGroups.completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed ({statusGroups.completed.length})
              </h3>
              <div className="space-y-3">
                {statusGroups.completed.map(o => (
                  <OrderCard key={o.id} order={o} isBuying={tab === 'buying'} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled/disputed */}
          {statusGroups.cancelled.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" /> Cancelled / Disputed ({statusGroups.cancelled.length})
              </h3>
              <div className="space-y-3">
                {statusGroups.cancelled.map(o => (
                  <OrderCard key={o.id} order={o} isBuying={tab === 'buying'} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
