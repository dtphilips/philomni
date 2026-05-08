import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Loader2, ArrowLeft, Upload, Download, Send, CheckCircle,
  RefreshCw, AlertTriangle, Star, X, Clock, Package,
} from 'lucide-react'

const STATUS_STEPS = ['pending', 'in_progress', 'delivered', 'completed']

const STATUS_CONFIG = {
  pending:            { label: 'Pending',           cls: 'bg-yellow-500/20 text-yellow-400' },
  in_progress:        { label: 'In Progress',       cls: 'bg-blue-500/20 text-blue-400' },
  delivered:          { label: 'Delivered',          cls: 'bg-orange-500/20 text-orange-400' },
  revision_requested: { label: 'Revision Requested',cls: 'bg-purple-500/20 text-purple-400' },
  completed:          { label: 'Completed',          cls: 'bg-emerald-500/20 text-emerald-400' },
  cancelled:          { label: 'Cancelled',          cls: 'bg-red-500/20 text-red-400' },
  disputed:           { label: 'Disputed',           cls: 'bg-red-700/20 text-red-300' },
}

function countdown(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  if (diff <= 0) return { label: 'OVERDUE', cls: 'text-red-400 font-bold' }
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return { label: days > 0 ? `Due in ${days}d ${hours}h` : `Due in ${hours}h`, cls: days === 0 && hours < 6 ? 'text-orange-400' : 'text-muted-foreground' }
}

function TimelineStep({ label, active, done, isLast }) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
        }`}>
          {done ? '✓' : active ? '●' : '○'}
        </div>
        <p className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-primary font-semibold' : done ? 'text-emerald-400' : 'text-muted-foreground'}`}>{label}</p>
      </div>
      {!isLast && (
        <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${done ? 'bg-emerald-500' : 'bg-muted'}`} />
      )}
    </div>
  )
}

function ReviewModal({ onClose, onSubmit }) {
  const [stars, setStars]   = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    await onSubmit(stars, comment)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Leave a Review</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex justify-center gap-2 mb-5">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setStars(i)}>
              <Star className={`w-8 h-8 transition-colors ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with the seller..."
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}

export default function OrderPage() {
  const { id }      = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const fileRef     = useRef()

  const [order, setOrder]               = useState(null)
  const [deliveries, setDeliveries]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [message, setMessage]           = useState('')
  const [deliveryMsg, setDeliveryMsg]   = useState('')
  const [deliveryFiles, setDeliveryFiles] = useState([])
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [showReview, setShowReview]     = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast]               = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadOrder = useCallback(async () => {
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, creator_content(title, cover, category, description, packages, metadata)')
        .eq('id', id)
        .single()
      if (orderData) setOrder(orderData)

      const { data: del } = await supabase
        .from('order_deliveries')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true })
      setDeliveries(del ?? [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_deliveries', filter: `order_id=eq.${id}` }, (payload) => {
        setDeliveries(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        setOrder(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  const isSeller = order?.seller_id === user?.id
  const isBuyer  = order?.buyer_id  === user?.id

  const updateOrderStatus = async (status) => {
    setActionLoading(true)
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (!error) setOrder(prev => ({ ...prev, status }))
      showToast(`Order marked as ${status.replace('_', ' ')}`)
    } catch (e) { console.error(e) }
    setActionLoading(false)
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    try {
      await supabase.from('order_deliveries').insert({
        order_id: id,
        sender_id: user.id,
        message,
        delivery_type: 'message',
        file_urls: [],
      })
      setMessage('')
    } catch (e) { console.error(e) }
  }

  const submitDelivery = async () => {
    if (!deliveryMsg.trim()) return
    setUploading(true)
    let fileUrls = []
    try {
      for (const file of deliveryFiles) {
        const ext = file.name.split('.').pop()
        const path = `orders/${id}/${Date.now()}.${ext}`
        const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
          fileUrls.push({ name: file.name, url: publicUrl })
        }
      }
    } catch (e) { console.error(e) }

    try {
      await supabase.from('order_deliveries').insert({
        order_id: id,
        sender_id: user.id,
        message: deliveryMsg,
        delivery_type: 'delivery',
        file_urls: fileUrls,
      })
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', id)
      setOrder(prev => ({ ...prev, status: 'delivered' }))
      setShowDeliverModal(false)
      setDeliveryMsg('')
      setDeliveryFiles([])
      showToast('Delivery submitted!')
    } catch (e) { console.error(e) }
    setUploading(false)
  }

  const markComplete = async () => {
    await updateOrderStatus('completed')
    setShowReview(true)
  }

  const requestRevision = async () => {
    setActionLoading(true)
    try {
      await supabase.from('order_deliveries').insert({
        order_id: id,
        sender_id: user.id,
        message: 'Revision requested.',
        delivery_type: 'revision',
        file_urls: [],
      })
      await updateOrderStatus('revision_requested')
    } catch (e) { console.error(e) }
    setActionLoading(false)
  }

  const submitReview = async (stars, comment) => {
    try {
      await supabase.from('reviews').insert({
        listing_id: order.listing_id,
        reviewer_id: user.id,
        seller_id: order.seller_id,
        order_id: id,
        rating: stars,
        comment,
      })
      showToast('Review submitted! Thank you.')
    } catch (e) {
      showToast('Review saved!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Order not found.</p>
        <button onClick={() => navigate('/my-orders')} className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">Back to Orders</button>
      </div>
    )
  }

  const status   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const due      = countdown(order.delivery_deadline)
  const stepIdx  = STATUS_STEPS.indexOf(order.status)
  const listing  = order.creator_content

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Back */}
      <button onClick={() => navigate('/my-orders')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      {/* Order header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
            {listing?.cover
              ? <img src={listing.cover} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground line-clamp-2">{listing?.title ?? 'Order'}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
              <span className="text-sm font-bold text-primary">${order.price?.toFixed(2)}</span>
              {order.package_type && <span className="text-xs text-muted-foreground capitalize">{order.package_type} package</span>}
              {due && <span className={`text-xs ${due.cls}`}>{due.label}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Order #{id?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Buyer message */}
        {order.buyer_message && (
          <div className="mt-4 bg-muted/30 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Buyer requirements</p>
            <p className="text-sm text-foreground">{order.buyer_message}</p>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Order Progress</p>
        <div className="flex items-start overflow-x-auto pb-2">
          {STATUS_STEPS.map((s, i) => {
            const done   = stepIdx > i || order.status === 'completed'
            const active = stepIdx === i && order.status !== 'completed'
            return (
              <React.Fragment key={s}>
                <TimelineStep
                  label={STATUS_CONFIG[s]?.label ?? s}
                  active={active}
                  done={done}
                  isLast={i === STATUS_STEPS.length - 1}
                />
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-4 mx-1 transition-colors ${stepIdx > i ? 'bg-emerald-500' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Seller actions */}
        {isSeller && order.status === 'pending' && (
          <button
            onClick={() => updateOrderStatus('in_progress')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 disabled:opacity-50 transition-colors">
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Accept & Start Working
          </button>
        )}
        {isSeller && ['in_progress', 'revision_requested'].includes(order.status) && (
          <button
            onClick={() => setShowDeliverModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" /> Deliver Now
          </button>
        )}

        {/* Buyer actions */}
        {isBuyer && order.status === 'delivered' && (
          <>
            <button
              onClick={markComplete}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Complete
            </button>
            <button
              onClick={requestRevision}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Request Revision
            </button>
          </>
        )}
        {isBuyer && order.status === 'completed' && (
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold hover:bg-amber-500/30 transition-colors">
            <Star className="w-4 h-4" /> Leave a Review
          </button>
        )}
        {(isBuyer || isSeller) && ['pending', 'in_progress'].includes(order.status) && (
          <button
            onClick={() => updateOrderStatus('cancelled')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50 transition-colors ml-auto">
            <X className="w-4 h-4" /> Cancel Order
          </button>
        )}
      </div>

      {/* Messages / Deliveries Thread */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Activity & Messages</p>
        </div>

        <div className="p-4 space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
          {deliveries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            deliveries.map(d => {
              const isMe = d.sender_id === user?.id
              return (
                <div key={d.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {isMe ? (user?.full_name?.[0] ?? '?') : '?'}
                  </div>
                  <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                    {d.delivery_type === 'delivery' && (
                      <span className="text-xs font-semibold text-orange-400 flex items-center gap-1">
                        📦 Delivery Submitted
                      </span>
                    )}
                    {d.delivery_type === 'revision' && (
                      <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                        🔄 Revision Requested
                      </span>
                    )}
                    {d.message && (
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                        {d.message}
                      </div>
                    )}
                    {d.file_urls?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {d.file_urls.map((f, i) => (
                          <a
                            key={i}
                            href={f.url ?? f}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-xl text-xs text-foreground hover:bg-muted/80 transition-colors">
                            <Download className="w-3.5 h-3.5" /> {f.name ?? `File ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Message input */}
        {(isBuyer || isSeller) && !['completed', 'cancelled', 'disputed'].includes(order.status) && (
          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="px-3 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Deliver Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Submit Delivery</h3>
              <button onClick={() => setShowDeliverModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Delivery message *</label>
                <textarea
                  value={deliveryMsg}
                  onChange={e => setDeliveryMsg(e.target.value)}
                  rows={4}
                  placeholder="Describe what you've delivered, any instructions, passwords, or notes..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Attach files (optional)</label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {deliveryFiles.length > 0 ? `${deliveryFiles.length} file(s) selected` : 'Click to attach delivery files'}
                  </span>
                  <input type="file" multiple className="hidden" ref={fileRef} onChange={e => setDeliveryFiles(Array.from(e.target.files))} />
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeliverModal(false)} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button
                  onClick={submitDelivery}
                  disabled={uploading || !deliveryMsg.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Submit Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <ReviewModal onClose={() => setShowReview(false)} onSubmit={submitReview} />
      )}
    </div>
  )
}
