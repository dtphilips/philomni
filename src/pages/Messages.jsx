import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    if (!user?.id) return
    supabase.from('conversations').select('*').or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .then(({ data }) => { setConversations(data ?? []); setLoading(false) })
  }, [user?.id])

  useEffect(() => {
    if (!active) return
    supabase.from('messages').select('*').eq('conversation_id', active.id).order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []))

    const channel = supabase.channel(`messages:${active.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active.id}` },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [active?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim() || !active) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: active.id,
      sender_id: user.id,
      content: text.trim(),
    })
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', active.id)
    setText('')
    setSending(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex h-[600px]">
        {/* Sidebar */}
        <div className="w-64 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4 text-muted-foreground text-sm">No conversations yet</div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors ${active?.id === c.id ? 'bg-primary/10' : ''}`}>
                <p className="text-sm font-medium text-foreground truncate">{c.title || 'Conversation'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : ''}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {active ? (
            <>
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-foreground">{active.title || 'Conversation'}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…"
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit" disabled={sending || !text.trim()}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
