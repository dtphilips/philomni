import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Send, Loader2, MessageSquare, Paperclip, X, File, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  // File attachment
  const [attachFile, setAttachFile] = useState(null)
  const [attachPreview, setAttachPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef()
  const fileInputRef = useRef()

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

  const handleFileSelect = (file) => {
    if (!file) return
    setAttachFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setAttachPreview(url)
    } else {
      setAttachPreview(null)
    }
  }

  const clearAttachment = () => {
    setAttachFile(null)
    setAttachPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadAttachment = async () => {
    if (!attachFile || !user?.id) return null
    setUploading(true)
    try {
      const path = `messages/${user.id}/${Date.now()}-${attachFile.name}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, attachFile)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
      return publicUrl
    } catch (err) {
      console.error('Attachment upload failed:', err)
      return null
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!text.trim() && !attachFile) || !active) return
    setSending(true)

    let attachmentUrl = null
    let attachmentName = null
    let attachmentType = null

    if (attachFile) {
      attachmentUrl = await uploadAttachment()
      attachmentName = attachFile.name
      attachmentType = attachFile.type
    }

    await supabase.from('messages').insert({
      conversation_id: active.id,
      sender_id: user.id,
      content: text.trim() || null,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
    })
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', active.id)
    setText('')
    clearAttachment()
    setSending(false)
  }

  const isImage = (type) => type?.startsWith('image/')

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
                  <div key={m.id} className={`flex flex-col ${m.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                    {/* Text bubble */}
                    {m.content && (
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {m.content}
                      </div>
                    )}
                    {/* Attachment */}
                    {m.attachment_url && (
                      <div className={`max-w-xs mt-1 rounded-2xl overflow-hidden border ${m.sender_id === user.id ? 'border-primary/30' : 'border-border'}`}>
                        {isImage(m.attachment_type) ? (
                          <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                            <img src={m.attachment_url} alt={m.attachment_name} className="max-w-[240px] max-h-48 object-cover" />
                          </a>
                        ) : (
                          <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2.5 bg-muted hover:bg-muted/80 transition-colors">
                            <File className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground truncate max-w-[160px]">{m.attachment_name}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Attachment preview bar */}
              {attachFile && (
                <div className="px-3 py-2 border-t border-border bg-muted/50 flex items-center gap-3">
                  {attachPreview
                    ? <img src={attachPreview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <File className="w-4 h-4 text-primary" />
                      </div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{attachFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(attachFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={clearAttachment} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input bar */}
              <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2 items-end">
                {/* File attach button */}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />

                <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…"
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />

                <button type="submit" disabled={(sending || uploading) || (!text.trim() && !attachFile)}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex-shrink-0">
                  {(sending || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
