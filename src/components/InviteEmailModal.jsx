import React, { useState } from 'react'
import { X, Mail, Loader2, Check, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function InviteEmailModal({ onClose, inviterName, type, title, description, link, scheduledAt, extraInfo }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const typeLabel = type === 'meeting' ? 'Meeting' : type === 'room' ? 'Room' : 'Group'

  async function handleSend() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid email address'); return }
    setSending(true)
    setError('')
    try {
      const { error: fnErr } = await supabase.functions.invoke('send-invite', {
        body: {
          inviterName,
          recipientEmail: trimmed,
          type,
          title,
          description,
          link,
          scheduledAt,
          extraInfo,
        },
      })
      if (fnErr) throw fnErr
      setSent(true)
      setTimeout(onClose, 2000)
    } catch (e) {
      setError('Failed to send. Please try again.')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Invite to {typeLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-muted/50 rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">{typeLabel}</p>
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center py-4 gap-2">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Invite sent!</p>
              <p className="text-xs text-muted-foreground">Sent to {email}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient email</label>
                <input
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="friend@example.com"
                  type="email"
                  autoFocus
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                They'll receive an email from <span className="text-foreground font-medium">noreply@philomni.com</span> with a join link. Your email stays private.
              </p>
              <button
                onClick={handleSend}
                disabled={sending || !email.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Invite</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
