import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Building2, Loader2, X, ExternalLink, Mail, Phone,
  CheckCircle2, XCircle, MessageSquare, Clock, TrendingUp,
  ChevronDown, Trash2,
} from 'lucide-react'

const STATUS_OPTIONS = ['new', 'in_discussion', 'converted', 'declined']
const STATUS_CFG = {
  new:           { label: 'New',           color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'     },
  in_discussion: { label: 'In Discussion', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  converted:     { label: 'Converted',     color: 'text-green-400 bg-green-400/10 border-green-400/20'   },
  declined:      { label: 'Declined',      color: 'text-red-400 bg-red-400/10 border-red-400/20'         },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.new
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function AdminBrands() {
  const { user } = useAuth()
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const [inquiries, setInquiries] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [filter,    setFilter]    = useState('all')

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('brand_inquiries').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setInquiries(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [filter])

  const openDetail = (inq) => {
    setSelected(inq)
    setNotes(inq.notes || '')
  }

  const updateStatus = async (id, status) => {
    await supabase.from('brand_inquiries').update({ status }).eq('id', id)
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    toast.success(`Status updated to ${STATUS_CFG[status]?.label || status}`)
  }

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Delete this inquiry? This cannot be undone.')) return
    const { error } = await supabase.from('brand_inquiries').delete().eq('id', inquiryId)
    if (error) { toast.error('Failed to delete inquiry'); return }
    toast.success('Inquiry deleted')
    setInquiries(prev => prev.filter(i => i.id !== inquiryId))
    if (selected?.id === inquiryId) setSelected(null)
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from('brand_inquiries').update({ notes }).eq('id', selected.id)
    setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, notes } : i))
    setSelected(prev => ({ ...prev, notes }))
    toast.success('Notes saved')
    setSaving(false)
  }

  const counts = {
    new:           inquiries.filter(i => i.status === 'new').length,
    in_discussion: inquiries.filter(i => i.status === 'in_discussion').length,
    converted:     inquiries.filter(i => i.status === 'converted').length,
    declined:      inquiries.filter(i => i.status === 'declined').length,
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Brand Inquiries</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'new',           label: 'New',           color: 'text-blue-400',   icon: Clock         },
          { key: 'in_discussion', label: 'In Discussion', color: 'text-yellow-400', icon: MessageSquare },
          { key: 'converted',     label: 'Converted',     color: 'text-green-400',  icon: CheckCircle2  },
          { key: 'declined',      label: 'Declined',      color: 'text-red-400',    icon: XCircle       },
        ].map(s => (
          <div key={s.key} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-4 h-4 mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUS_OPTIONS].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {f === 'all' ? 'All' : STATUS_CFG[f]?.label}
            {f !== 'all' && counts[f] > 0 && (
              <span className="ml-1.5 text-[10px]">({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter === 'all' ? '' : STATUS_CFG[filter]?.label?.toLowerCase()} inquiries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map(inq => (
            <button key={inq.id}
              onClick={() => openDetail(inq)}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{inq.brand_name || 'Unknown Brand'}</p>
                    <StatusBadge status={inq.status} />
                    {inq.package_interest && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{inq.package_interest}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span>{inq.contact_name}</span>
                    <span>·</span>
                    <span>{inq.contact_email}</span>
                    {inq.budget_range && <><span>·</span><span>{inq.budget_range}</span></>}
                    {inq.campaign_goal && <><span>·</span><span>{inq.campaign_goal}</span></>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{new Date(inq.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteInquiry(inq.id) }}
                      title="Delete inquiry"
                      className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{selected.brand_name}</h3>
                <StatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Contact',  value: selected.contact_name },
                  { label: 'Email',    value: selected.contact_email, href: `mailto:${selected.contact_email}` },
                  { label: 'Phone',    value: selected.phone || '—' },
                  { label: 'Website',  value: selected.website || '—', href: selected.website },
                  { label: 'Package',  value: selected.package_interest || '—' },
                  { label: 'Budget',   value: selected.budget_range || '—' },
                  { label: 'Goal',     value: selected.campaign_goal || '—' },
                  { label: 'Received', value: new Date(selected.created_at).toLocaleString() },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{f.label}</p>
                    {f.href
                      ? <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{f.value}</a>
                      : <p className="text-xs text-foreground truncate">{f.value}</p>
                    }
                  </div>
                ))}
              </div>

              {/* Campaign message */}
              {selected.message && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Campaign Message</p>
                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                    {selected.message}
                  </div>
                </div>
              )}

              {/* Status update */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        selected.status === s
                          ? STATUS_CFG[s].color
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Internal Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add private notes about this inquiry…"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveNotes} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Save Notes
                  </button>
                  <button onClick={() => handleDeleteInquiry(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete Inquiry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
