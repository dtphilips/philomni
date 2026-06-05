import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Send, Loader2, MessageSquare, Paperclip, X, File,
  Search, Edit3, Phone, Video, Info, MoreVertical, ArrowLeft,
  Smile, Download, Reply, Check, CheckCheck, Bell,
  Archive, Trash2, Shield, Users, Briefcase, Play,
} from 'lucide-react'
import EmojiPickerButton, { insertAtCursor } from '../components/EmojiPickerButton'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────
const ME_ID = 'current-user'

const SAMPLE_CONVERSATIONS = [
  {
    id: 'conv-1',
    is_group: false,
    mode: 'creator',
    other_user: {
      id: 'u-jordan', full_name: 'Jordan Lee', initials: 'JL',
      avatar_color: 'bg-violet-500', headline: 'Content Creator • 450K followers', is_online: true,
    },
    last_message: "That collab idea sounds amazing! I'm in 🎉",
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 2, is_pinned: true, is_muted: false, collab_request: true,
    messages: [
      { id: 'm1', sender_id: 'u-jordan', message_type: 'text', status: 'read', created_at: new Date(Date.now() - 3 * 3600000).toISOString(), content: 'Hey! I absolutely love your content 🔥 Would you be down for a collab? I think our audiences would vibe perfectly!' },
      { id: 'm2', sender_id: ME_ID, message_type: 'text', status: 'read', created_at: new Date(Date.now() - 2.5 * 3600000).toISOString(), content: 'Thanks so much! That means a lot 🙏 What kind of collab did you have in mind?' },
      { id: 'm3', sender_id: 'u-jordan', message_type: 'text', status: 'read', created_at: new Date(Date.now() - 2.2 * 3600000).toISOString(), content: 'I was thinking a YouTube video + cross-posted Instagram reel. My audience is 450K and loves creative content!' },
      { id: 'm4', sender_id: ME_ID, message_type: 'text', status: 'delivered', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), content: "That collab idea sounds amazing! I'm in 🎉", reactions: { '❤️': ['u-jordan'] } },
    ],
  },
  {
    id: 'conv-2',
    is_group: false,
    mode: 'creator',
    other_user: {
      id: 'u-maya', full_name: 'Maya Patel', initials: 'MP',
      avatar_color: 'bg-pink-500', headline: 'Photographer & Visual Artist', is_online: false,
    },
    last_message: 'Wow these are stunning! 😍',
    last_message_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    unread_count: 0, is_pinned: false, is_muted: false, fan_message: true,
    messages: [
      { id: 'm5', sender_id: 'u-maya', message_type: 'text', status: 'read', created_at: new Date(Date.now() - 27 * 3600000).toISOString(), content: 'Your latest post was so inspiring! Here are some shots I took inspired by your work ✨' },
      { id: 'm6', sender_id: 'u-maya', message_type: 'image', status: 'read', created_at: new Date(Date.now() - 26.8 * 3600000).toISOString(), content: null, file_url: 'https://picsum.photos/seed/collab/480/320', file_name: 'inspired-shot.jpg' },
      { id: 'm7', sender_id: ME_ID, message_type: 'text', status: 'read', created_at: new Date(Date.now() - 26 * 3600000).toISOString(), content: 'Wow these are stunning! 😍 You have real talent — keep creating!', reactions: { '❤️': ['u-maya'], '😮': ['u-maya'] } },
    ],
  },
  {
    id: 'conv-3',
    is_group: false,
    mode: 'pro',
    other_user: {
      id: 'u-marcus', full_name: 'Marcus Webb', initials: 'MW',
      avatar_color: 'bg-blue-600', headline: 'Senior Recruiter @ TechVentures', company: 'TechVentures', is_online: true,
    },
    last_message: "I've attached the full job description for your review",
    last_message_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    unread_count: 1, is_pinned: false, is_muted: false, job_inquiry: true,
    messages: [
      { id: 'm8', sender_id: 'u-marcus', message_type: 'text', status: 'read', created_at: new Date(Date.now() - 4 * 86400000).toISOString(), content: "Hi! I came across your profile and think you'd be a fantastic fit for a Senior Product Designer role at TechVentures. Would you be open to a quick chat?" },
      { id: 'm9', sender_id: ME_ID, message_type: 'text', status: 'read', created_at: new Date(Date.now() - 3.5 * 86400000).toISOString(), content: "Hi Marcus! Thanks for reaching out — I'd love to learn more about the opportunity." },
      { id: 'm10', sender_id: 'u-marcus', message_type: 'text', status: 'read', created_at: new Date(Date.now() - 3.2 * 86400000).toISOString(), content: "Great! I've attached the full job description for your review. Looking forward to connecting!" },
      { id: 'm11', sender_id: 'u-marcus', message_type: 'file', status: 'delivered', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), content: null, file_url: '#', file_name: 'Senior_Product_Designer_JD.pdf', file_size: 245760 },
    ],
  },
]

const PRO_TEMPLATES = [
  "Thanks for reaching out! I'd be happy to discuss this further. Could we schedule a call?",
  "I'm interested in this opportunity. What does your timeline look like?",
  "Thank you for the interview — I truly enjoyed our conversation and look forward to hearing back.",
  "I'd love to propose a collaboration. Here's what I'm thinking...",
  "Could you share more details about the role/project? I'd like to understand the scope better.",
]

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍']

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'creator', label: '🎨 Creator' },
  { key: 'pro', label: '💼 Pro' },
  { key: 'unread', label: 'Unread' },
  { key: 'requests', label: 'Requests' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatConvTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d)) return format(d, 'EEE')
  return format(d, 'MM/dd/yy')
}

function formatMsgTime(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'h:mm a')
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function getFileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📋'
  if (['zip', 'rar'].includes(ext)) return '📦'
  if (['mp3', 'wav', 'm4a'].includes(ext)) return '🎵'
  if (['mp4', 'mov'].includes(ext)) return '🎬'
  return '📎'
}

function groupMessagesByDate(messages) {
  const result = []
  let lastDate = null
  messages.forEach(m => {
    const d = new Date(m.created_at)
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
    if (label !== lastDate) { result.push({ type: 'date', label }); lastDate = label }
    result.push({ type: 'msg', msg: m })
  })
  return result
}

// ─── Sub-components (outside main to prevent re-creation) ─────────────────────
function Avatar({ user, size = 'md', showOnline = false }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size]
  const dot = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' }[size]
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full ${user?.avatar_color || 'bg-primary'} flex items-center justify-center text-white font-semibold overflow-hidden`}>
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          : (user?.initials || user?.full_name?.[0] || '?')}
      </div>
      {showOnline && user?.is_online && (
        <div className={`absolute bottom-0 right-0 ${dot} bg-green-500 rounded-full border-2 border-card`} />
      )}
    </div>
  )
}

function ModeTag({ mode }) {
  if (!mode) return null
  const isC = mode === 'creator'
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${isC ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'}`}>
      {isC ? '🎨' : '💼'} {isC ? 'Creator' : 'Pro'}
    </span>
  )
}

function StatusIcon({ status }) {
  if (status === 'sending') return <span className="text-[10px] text-muted-foreground">⏳</span>
  if (status === 'sent') return <Check className="w-3 h-3 text-muted-foreground" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-muted-foreground" />
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />
  if (status === 'failed') return <span className="text-[10px] text-destructive">⚠️</span>
  return null
}

function ConversationItem({ conv, isActive, onSelect }) {
  const other = conv.other_user
  return (
    <button
      onClick={() => onSelect(conv)}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/60 transition-colors border-b border-border/40 ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
    >
      <Avatar user={other} showOnline size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
            {other?.full_name || conv.title || 'Conversation'}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatConvTime(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs truncate flex-1 ${conv.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
            {conv.is_muted && '🔇 '}{conv.last_message || ''}
          </span>
          {conv.unread_count > 0 && (
            <span className="ml-2 min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold px-1 flex-shrink-0">
              {conv.unread_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <ModeTag mode={conv.mode} />
          {conv.collab_request && <span className="text-[9px] text-amber-400 font-semibold">Collab</span>}
          {conv.job_inquiry && <span className="text-[9px] text-sky-400 font-semibold">🔍 Job</span>}
          {conv.fan_message && <span className="text-[9px] text-pink-400 font-semibold">Fan</span>}
          {conv.is_pinned && <span className="text-[9px] text-muted-foreground">📌</span>}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isMine, showAvatar, conv, onReact, onReply }) {
  const [showPicker, setShowPicker] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  return (
    <div className={`flex items-end gap-2 group mb-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && showAvatar && <Avatar user={conv?.other_user} size="sm" />}
      {!isMine && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div className={`flex flex-col max-w-[68%] ${isMine ? 'items-end' : 'items-start'} relative`}>
        {/* Reply quote */}
        {msg.reply_to && (
          <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 max-w-full ${isMine ? 'bg-primary/20 border-primary/60 text-primary/80' : 'bg-muted border-border text-muted-foreground'}`}>
            <p className="font-semibold truncate">{msg.reply_to.sender_name}</p>
            <p className="truncate">{msg.reply_to.content}</p>
          </div>
        )}

        {/* Hover actions */}
        <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-0.5 z-10`}>
          <button onClick={() => onReply(msg)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground">
            <Reply className="w-3 h-3" />
          </button>
          <button onClick={() => setShowPicker(s => !s)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground">
            <Smile className="w-3 h-3" />
          </button>
        </div>

        {/* Reaction picker */}
        {showPicker && (
          <div className={`absolute bottom-full mb-1 ${isMine ? 'right-0' : 'left-0'} bg-card border border-border rounded-full shadow-xl flex items-center gap-1 px-2 py-1.5 z-20`}>
            {QUICK_REACTIONS.map(e => (
              <button key={e} onClick={() => { onReact(msg.id, e); setShowPicker(false) }}
                className="text-base hover:scale-125 transition-transform leading-none">{e}</button>
            ))}
          </div>
        )}

        {/* Bubble */}
        {msg.message_type === 'text' && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
            {msg.content}
          </div>
        )}

        {msg.message_type === 'image' && (
          <>
            {msg.content && (
              <div className={`px-4 py-2 rounded-t-2xl text-sm mb-0.5 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {msg.content}
              </div>
            )}
            <button onClick={() => setLightbox(true)} className="rounded-2xl overflow-hidden">
              <img src={msg.file_url} alt="" className="max-w-[240px] max-h-52 object-cover rounded-2xl" />
            </button>
            {lightbox && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
                <img src={msg.file_url} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
              </div>
            )}
          </>
        )}

        {msg.message_type === 'file' && (
          <div>
            {msg.content && (
              <div className={`px-4 py-2 rounded-t-2xl text-sm mb-0.5 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {msg.content}
              </div>
            )}
            <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border min-w-[220px] ${isMine ? 'bg-primary/80 border-primary/30 text-primary-foreground' : 'bg-muted border-border text-foreground'} hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{getFileIcon(msg.file_name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{msg.file_name}</p>
                {msg.file_size && <p className="text-[11px] opacity-60">{formatFileSize(msg.file_size)}</p>}
              </div>
              <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
            </a>
          </div>
        )}

        {msg.message_type === 'voice_note' && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px] ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
            <div className="flex-1 flex items-end gap-px">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-1 bg-current opacity-50 rounded-full flex-shrink-0"
                  style={{ height: `${[4,8,14,10,6,16,12,8,18,14,6,10,16,12,8,14,10,6,14,10,8,12,6,4][i]}px` }} />
              ))}
            </div>
            <span className="text-xs opacity-70">{msg.duration || '0:12'}</span>
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {Object.entries(msg.reactions).map(([emoji, users]) => (
              <span key={emoji} className="text-xs bg-muted border border-border rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-muted/80">
                {emoji}{users.length > 1 ? ` ${users.length}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Time + status */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px] text-muted-foreground">{formatMsgTime(msg.created_at)}</span>
          {isMine && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator({ user: other }) {
  return (
    <div className="flex items-end gap-2">
      <Avatar user={other} size="sm" />
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )
}

function RightPanel({ conv, onClose }) {
  const [tab, setTab] = useState('info')
  const other = conv?.other_user
  const msgs = conv?.messages || []
  const images = msgs.filter(m => m.message_type === 'image')
  const files = msgs.filter(m => m.message_type === 'file')

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Info</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {['info', 'media', 'files'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'info' && (
          <div className="p-4 space-y-4">
            <div className="text-center pt-2">
              <div className={`w-16 h-16 rounded-full ${other?.avatar_color || 'bg-primary'} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3`}>
                {other?.initials || '?'}
              </div>
              <p className="font-semibold text-foreground">{other?.full_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{other?.headline}</p>
              {other?.company && <p className="text-xs text-muted-foreground">{other.company}</p>}
              <div className="mt-2 flex justify-center"><ModeTag mode={conv?.mode} /></div>
            </div>
            <button className="w-full py-2 text-sm font-medium bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
              View Profile
            </button>
            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bell className="w-4 h-4" /> {conv?.is_muted ? 'Unmute' : 'Mute notifications'}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Archive className="w-4 h-4" /> Archive conversation
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Shield className="w-4 h-4" /> Block {other?.full_name?.split(' ')[0]}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" /> Delete conversation
              </button>
            </div>
          </div>
        )}

        {tab === 'media' && (
          <div className="p-3">
            {images.length === 0
              ? <p className="text-center text-muted-foreground text-sm py-10">No media shared yet</p>
              : <div className="grid grid-cols-3 gap-1">
                  {images.map(m => (
                    <img key={m.id} src={m.file_url} alt="" className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </div>}
          </div>
        )}

        {tab === 'files' && (
          <div className="p-3 space-y-2">
            {files.length === 0
              ? <p className="text-center text-muted-foreground text-sm py-10">No files shared yet</p>
              : files.map(m => (
                  <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                    <span className="text-xl">{getFileIcon(m.file_name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.file_name}</p>
                      {m.file_size && <p className="text-[10px] text-muted-foreground">{formatFileSize(m.file_size)}</p>}
                    </div>
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NewConversationModal({ onClose, onOpenConv }) {
  const [tab, setTab] = useState('dm')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users').select('id,full_name,email').ilike('full_name', `%${search}%`).limit(8)
        setResults(data || [])
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">New Message</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-border">
          {['dm', 'group'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'dm' ? 'Direct Message' : 'New Group'}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'group' && (
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..."
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..."
              className="w-full bg-muted rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {tab === 'group' && selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(u => (
                <span key={u.id} className="flex items-center gap-1 px-2.5 py-1 bg-primary/15 text-primary rounded-full text-xs font-medium">
                  {u.full_name}
                  <button onClick={() => setSelected(s => s.filter(x => x.id !== u.id))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searching && <div className="flex justify-center py-5"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
            {!searching && search && results.length === 0 && <p className="text-center text-muted-foreground text-sm py-5">No users found</p>}
            {!searching && !search && <p className="text-center text-muted-foreground text-xs py-4">Search for people to message</p>}
            {results.map(u => (
              <button key={u.id}
                onClick={() => {
                  if (tab === 'dm') { onOpenConv(u); onClose() }
                  else setSelected(s => s.find(x => x.id === u.id) ? s.filter(x => x.id !== u.id) : [...s, u])
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors ${tab === 'group' && selected.find(x => x.id === u.id) ? 'bg-primary/10' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {u.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>

          {tab === 'group' && selected.length > 0 && (
            <button onClick={onClose}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Create Group ({selected.length} people)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProTemplatesPanel({ onSelect }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl p-3 z-20">
      <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Quick Templates</p>
      <div className="space-y-0.5">
        {PRO_TEMPLATES.map((t, i) => (
          <button key={i} onClick={() => onSelect(t)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors">
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth()
  const { mode } = useMode()

  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS)
  const [activeConvId, setActiveConvId] = useState(SAMPLE_CONVERSATIONS[0].id)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [attachFile, setAttachFile] = useState(null)
  const [attachPreview, setAttachPreview] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showProTemplates, setShowProTemplates] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)

  const bottomRef = useRef()
  const fileInputRef = useRef()
  const textareaRef = useRef()
  const typingTimeout = useRef()

  const activeConv = conversations.find(c => c.id === activeConvId)
  const messages = activeConv?.messages || []

  // Load conversations from Supabase
  useEffect(() => {
    if (!user?.id) return
    supabase.from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          const mapped = data.map(c => ({
            ...c,
            other_user: { full_name: c.title || 'User', initials: (c.title || 'U')[0], avatar_color: 'bg-primary', is_online: false },
            last_message: '', messages: [],
          }))
          setConversations(prev => [
            ...prev,
            ...mapped.filter(c => !prev.find(p => p.id === c.id)),
          ])
        }
      })
  }, [user?.id])

  // Load messages + realtime for active conversation
  useEffect(() => {
    if (!activeConvId) return
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)

    supabase.from('messages').select('*').eq('conversation_id', activeConvId).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: data } : c))
        }
      })

    const msgChannel = supabase.channel(`msg-${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        ({ new: msg }) => {
          setConversations(prev => prev.map(c =>
            c.id === activeConvId ? { ...c, messages: [...(c.messages || []), msg] } : c
          ))
        })
      .subscribe()

    const typingChannel = supabase.channel(`typing-${activeConvId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id !== user?.id) {
          setIsTyping(true)
          clearTimeout(typingTimeout.current)
          typingTimeout.current = setTimeout(() => setIsTyping(false), 2500)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(msgChannel); supabase.removeChannel(typingChannel) }
  }, [activeConvId, user?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const broadcastTyping = useCallback(async () => {
    if (!activeConvId || !user?.id) return
    await supabase.channel(`typing-${activeConvId}`).send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } })
  }, [activeConvId, user?.id])

  const filteredConvs = conversations.filter(c => {
    if (filter === 'creator') return c.mode === 'creator'
    if (filter === 'pro') return c.mode === 'pro'
    if (filter === 'unread') return c.unread_count > 0
    if (filter === 'requests') return c.is_request
    if (search) {
      const q = search.toLowerCase()
      return c.other_user?.full_name?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)
    }
    return true
  })

  const pinnedConvs = filteredConvs.filter(c => c.is_pinned)
  const unpinnedConvs = filteredConvs.filter(c => !c.is_pinned)

  function handleSelectConv(conv) {
    setActiveConvId(conv.id)
    setShowMobileList(false)
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
  }

  async function handleSend() {
    if (!text.trim() && !attachFile) return
    const newMsg = {
      id: `local-${Date.now()}`,
      sender_id: ME_ID,
      content: text.trim() || null,
      message_type: attachFile ? (attachFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
      status: 'sending',
      created_at: new Date().toISOString(),
      reply_to: replyTo ? {
        sender_name: (replyTo.sender_id === ME_ID || replyTo.sender_id === user?.id) ? 'You' : activeConv?.other_user?.full_name,
        content: replyTo.content,
      } : null,
    }

    const msgText = text
    const file = attachFile
    setText(''); setReplyTo(null); setAttachFile(null); setAttachPreview(null)

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...(c.messages || []), newMsg], last_message: msgText || `📎 ${file?.name}`, last_message_at: newMsg.created_at }
        : c
    ))

    setSending(true)
    try {
      let fileUrl = null, fileName = null, fileSize = null
      if (file) {
        const path = `messages/${user?.id || 'anon'}/${Date.now()}-${file.name}`
        const { data } = await supabase.storage.from('uploads').upload(path, file)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
          fileUrl = publicUrl; fileName = file.name; fileSize = file.size
        }
      }
      const { data: saved } = await supabase.from('messages').insert({
        conversation_id: activeConvId,
        sender_id: user?.id,
        content: newMsg.content,
        message_type: newMsg.message_type,
        file_url: fileUrl, file_name: fileName, file_size: fileSize,
        reply_to_id: replyTo?.id,
      }).select().single()

      if (saved) {
        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? { ...c, messages: c.messages.map(m => m.id === newMsg.id ? { ...saved, status: 'sent' } : m) }
            : c
        ))
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConvId)
      }
    } catch {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.map(m => m.id === newMsg.id ? { ...m, status: 'failed' } : m) }
          : c
      ))
    }
    setSending(false)
  }

  function handleReact(msgId, emoji) {
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === msgId
                ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: [...((m.reactions || {})[emoji] || []), ME_ID] } }
                : m
            ),
          }
        : c
    ))
  }

  function handleFileSelect(file) {
    if (!file) return
    setAttachFile(file)
    setAttachPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  function handleOpenConvWithUser(u) {
    const existing = conversations.find(c => c.other_user?.id === u.id)
    if (existing) { handleSelectConv(existing); return }
    const newConv = {
      id: `new-${Date.now()}`, is_group: false, mode,
      other_user: { id: u.id, full_name: u.full_name, initials: u.full_name?.[0] || '?', avatar_color: 'bg-primary', is_online: false },
      last_message: '', last_message_at: new Date().toISOString(),
      unread_count: 0, is_pinned: false, is_muted: false, messages: [],
    }
    setConversations(prev => [newConv, ...prev])
    handleSelectConv(newConv)
  }

  const grouped = groupMessagesByDate(messages)
  const isProConv = activeConv?.mode === 'pro'

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background">
      {/* ── LEFT PANEL ────────────────────────────────── */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 flex-shrink-0 flex-col border-r border-border bg-card`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h1 className="font-bold text-foreground text-lg">Messages</h1>
          <button onClick={() => setShowNewConv(true)} className="p-2 rounded-xl hover:bg-muted transition-colors" title="New message">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
              className="w-full bg-muted rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 pb-2.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {pinnedConvs.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Pinned</p>
              {pinnedConvs.map(c => <ConversationItem key={c.id} conv={c} isActive={c.id === activeConvId} onSelect={handleSelectConv} />)}
            </>
          )}
          {unpinnedConvs.length > 0 && (
            <>
              {pinnedConvs.length > 0 && <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-1">Messages</p>}
              {unpinnedConvs.map(c => <ConversationItem key={c.id} conv={c} isActive={c.id === activeConvId} onSelect={handleSelectConv} />)}
            </>
          )}
          {filteredConvs.length === 0 && (
            <div className="text-center py-14 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL ──────────────────────────────── */}
      <div className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
              <button onClick={() => setShowMobileList(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Avatar user={activeConv.other_user} showOnline size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{activeConv.other_user?.full_name || activeConv.title}</p>
                  <ModeTag mode={activeConv.mode} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeConv.other_user?.is_online ? '🟢 Online' : activeConv.other_user?.headline || 'Offline'}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button className="p-2 rounded-xl hover:bg-muted transition-colors" title="Voice call"><Phone className="w-4 h-4 text-muted-foreground" /></button>
                <button className="p-2 rounded-xl hover:bg-muted transition-colors" title="Video call"><Video className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => setShowRightPanel(s => !s)}
                  className={`p-2 rounded-xl hover:bg-muted transition-colors ${showRightPanel ? 'bg-muted' : ''}`} title="Info">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-xl hover:bg-muted transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Pro context strip */}
            {isProConv && activeConv.other_user?.company && (
              <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-400">{activeConv.other_user.company} · {activeConv.other_user.headline}</span>
              </div>
            )}

            {/* Collab request banner */}
            {activeConv.collab_request && (
              <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
                <span className="text-xs text-amber-300 font-medium flex-1">🤝 Collab Request from {activeConv.other_user?.full_name?.split(' ')[0]}</span>
                <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold hover:bg-green-500/30 transition-colors">✅ Accept</button>
                <button className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-semibold hover:bg-destructive/20 transition-colors">❌ Decline</button>
              </div>
            )}

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
              {grouped.map((item, i) => {
                if (item.type === 'date') return (
                  <div key={`d${i}`} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] font-medium text-muted-foreground px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )
                const msg = item.msg
                const prev = i > 0 && grouped[i - 1]?.type === 'msg' ? grouped[i - 1].msg : null
                const showAv = !prev || prev.sender_id !== msg.sender_id
                return (
                  <MessageBubble key={msg.id} msg={msg}
                    isMine={msg.sender_id === ME_ID || msg.sender_id === user?.id}
                    showAvatar={showAv} conv={activeConv}
                    onReact={handleReact} onReply={setReplyTo} />
                )
              })}
              {isTyping && <TypingIndicator user={activeConv.other_user} />}
              <div ref={bottomRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 flex-shrink-0">
                <Reply className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    {(replyTo.sender_id === ME_ID || replyTo.sender_id === user?.id) ? 'You' : activeConv.other_user?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{replyTo.content || '📎 Attachment'}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Attachment preview */}
            {attachFile && (
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 flex-shrink-0">
                {attachPreview
                  ? <img src={attachPreview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">{getFileIcon(attachFile.name)}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{attachFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(attachFile.size)}</p>
                </div>
                <button onClick={() => { setAttachFile(null); setAttachPreview(null) }} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Composer */}
            <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
              <div className="relative">
                {showProTemplates && isProConv && (
                  <ProTemplatesPanel onSelect={t => { setText(t); setShowProTemplates(false); textareaRef.current?.focus() }} />
                )}
              </div>
              <div className="flex items-end gap-2">
                {/* Left actions */}
                <div className="flex items-center gap-0.5 pb-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Attach file">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
                  {isProConv && (
                    <button onClick={() => setShowProTemplates(s => !s)}
                      className={`p-2 rounded-xl hover:bg-muted transition-colors ${showProTemplates ? 'bg-primary/10' : ''}`} title="Templates">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => { setText(e.target.value); broadcastTyping() }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none max-h-32 leading-relaxed"
                />

                {/* Right actions */}
                <div className="flex items-center gap-0.5 pb-1">
                  <EmojiPickerButton
                    onEmojiSelect={(emoji) => insertAtCursor(text, setText, textareaRef, emoji)}
                    pickerSide="right"
                  />
                  <button onClick={handleSend} disabled={sending || (!text.trim() && !attachFile)}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1 opacity-60">Choose from your messages on the left</p>
              <button onClick={() => setShowNewConv(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                New Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────── */}
      {showRightPanel && activeConv && <RightPanel conv={activeConv} onClose={() => setShowRightPanel(false)} />}

      {/* ── MODALS ────────────────────────────────────── */}
      {showNewConv && <NewConversationModal onClose={() => setShowNewConv(false)} onOpenConv={handleOpenConvWithUser} />}
    </div>
  )
}
