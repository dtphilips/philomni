import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader2, MessageSquare, Paperclip, X, File,
  Search, Edit3, Phone, Video, Info, MoreVertical, ArrowLeft,
  Smile, Download, Reply, Check, CheckCheck, Bell,
  Archive, Trash2, Shield, Users, Briefcase, Play, Pause,
} from 'lucide-react'
import EmojiPickerButton, { insertAtCursor } from '../components/EmojiPickerButton'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'

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

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500']
function avatarColor(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍']

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
]

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md', showOnline = false }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size]
  const dot = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' }[size]
  const name = user?.full_name || user?.name || ''
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full ${avatarColor(name)} flex items-center justify-center text-white font-semibold overflow-hidden`}>
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials(name)}
      </div>
      {showOnline && user?.is_online && (
        <div className={`absolute bottom-0 right-0 ${dot} bg-green-500 rounded-full border-2 border-card`} />
      )}
    </div>
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

// ─── ConversationItem ─────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onSelect, onDelete }) {
  const other = conv.other_user
  return (
    <div className={`group/conv relative border-b border-border/40 ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/60'} transition-colors`}>
      <button onClick={() => onSelect(conv)} className="w-full text-left px-4 py-3 flex items-center gap-3">
        <Avatar user={other} showOnline size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
              {conv.is_group ? (conv.name || 'Group') : (other?.full_name || 'User')}
            </span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatConvTime(conv.last_message_at || conv.updated_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs truncate flex-1 ${conv.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
              {conv.last_message || 'No messages yet'}
            </span>
            {conv.unread_count > 0 && (
              <span className="ml-2 min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold px-1 flex-shrink-0">
                {conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </button>
      <button
        onClick={() => onDelete(conv)}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/conv:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, showAvatar, otherUser, onReact, onReply, onDelete }) {
  const [showPicker, setShowPicker] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const reactions = msg.reactions || {}

  return (
    <div className={`flex items-end gap-2 group mb-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && showAvatar && <Avatar user={otherUser} size="sm" />}
      {!isMine && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div className={`flex flex-col max-w-[68%] ${isMine ? 'items-end' : 'items-start'} relative`}>
        {/* Reply quote */}
        {msg.reply_preview && (
          <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 max-w-full ${isMine ? 'bg-primary/20 border-primary/60 text-primary/80' : 'bg-muted border-border text-muted-foreground'}`}>
            <p className="font-semibold truncate">{msg.reply_sender || 'Message'}</p>
            <p className="truncate">{msg.reply_preview}</p>
          </div>
        )}

        {/* Hover actions */}
        <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? '-left-20' : '-right-20'} hidden group-hover:flex items-center gap-0.5 z-10`}>
          <button onClick={() => onReply(msg)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground">
            <Reply className="w-3 h-3" />
          </button>
          <button onClick={() => setShowPicker(s => !s)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted text-muted-foreground">
            <Smile className="w-3 h-3" />
          </button>
          {isMine && (
            <button onClick={() => onDelete(msg)} className="p-1.5 rounded-full bg-card border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
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
        {(msg.message_type === 'text' || !msg.message_type) && (
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
              <img src={msg.file_url || msg.media_url} alt="" className="max-w-[240px] max-h-52 object-cover rounded-2xl" />
            </button>
            {lightbox && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
                <img src={msg.file_url || msg.media_url} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
              </div>
            )}
          </>
        )}

        {msg.message_type === 'file' && (
          <a href={msg.file_url || msg.media_url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border min-w-[220px] ${isMine ? 'bg-primary/80 border-primary/30 text-primary-foreground' : 'bg-muted border-border text-foreground'} hover:opacity-90 transition-opacity`}>
            <span className="text-2xl">{getFileIcon(msg.file_name)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.file_name}</p>
              {msg.file_size && <p className="text-[11px] opacity-60">{formatFileSize(msg.file_size)}</p>}
            </div>
            <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
          </a>
        )}

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className="text-xs bg-muted border border-border rounded-full px-1.5 py-0.5 hover:bg-muted/80">
                {emoji}{Array.isArray(users) && users.length > 1 ? ` ${users.length}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px] text-muted-foreground">{formatMsgTime(msg.created_at)}</span>
          {isMine && <StatusIcon status={msg._status} />}
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

// ─── Right Info Panel ─────────────────────────────────────────────────────────

function RightPanel({ conv, onClose }) {
  const [tab, setTab] = useState('info')
  const other = conv?.other_user
  const msgs = conv?.messages || []
  const images = msgs.filter(m => m.message_type === 'image' && (m.file_url || m.media_url))
  const files = msgs.filter(m => m.message_type === 'file' && (m.file_url || m.media_url))

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Info</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
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
              <div className="mx-auto mb-3"><Avatar user={other} size="lg" /></div>
              <p className="font-semibold text-foreground">{conv?.is_group ? (conv?.name || 'Group') : other?.full_name}</p>
              {other?.headline && <p className="text-xs text-muted-foreground mt-1">{other.headline}</p>}
              {other?.username && <p className="text-xs text-muted-foreground">@{other.username}</p>}
            </div>
            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bell className="w-4 h-4" /> Mute notifications
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Archive className="w-4 h-4" /> Archive conversation
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Shield className="w-4 h-4" /> Block {other?.full_name?.split(' ')[0]}
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
                    <img key={m.id} src={m.file_url || m.media_url} alt=""
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(m.file_url || m.media_url, '_blank')} />
                  ))}
                </div>}
          </div>
        )}

        {tab === 'files' && (
          <div className="p-3 space-y-2">
            {files.length === 0
              ? <p className="text-center text-muted-foreground text-sm py-10">No files shared yet</p>
              : files.map(m => (
                  <a key={m.id} href={m.file_url || m.media_url} target="_blank" rel="noopener noreferrer"
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

// ─── New Conversation Modal ───────────────────────────────────────────────────

function NewConversationModal({ onClose, onOpenConv, currentUserId }) {
  const [tab, setTab] = useState('dm')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users')
          .select('id,full_name,username,avatar_url,headline')
          .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
          .neq('id', currentUserId)
          .limit(8)
        setResults(data || [])
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search, currentUserId])

  const handleCreateGroup = async () => {
    if (!selected.length || !groupName.trim()) return
    setCreating(true)
    const { data: conv } = await supabase.from('conversations').insert({
      name: groupName.trim(),
      is_group: true,
      participant_ids: [currentUserId, ...selected.map(u => u.id)],
      last_message: null,
      created_by: currentUserId,
    }).select().single()
    setCreating(false)
    if (conv) { onOpenConv(conv, selected); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">New Message</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-border">
          {[['dm','Direct Message'],['group','New Group']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'group' && (
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name…"
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @username…"
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
                  if (tab === 'dm') { onOpenConv(null, [u]); onClose() }
                  else setSelected(s => s.find(x => x.id === u.id) ? s.filter(x => x.id !== u.id) : [...s, u])
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors ${tab === 'group' && selected.find(x => x.id === u.id) ? 'bg-primary/10' : ''}`}>
                <div className={`w-9 h-9 rounded-full ${avatarColor(u.full_name)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden`}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(u.full_name)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
                {tab === 'group' && selected.find(x => x.id === u.id) && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>

          {tab === 'group' && selected.length > 0 && (
            <button onClick={handleCreateGroup} disabled={!groupName.trim() || creating}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : `Create Group (${selected.length + 1} people)`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Messages() {
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [profiles, setProfiles] = useState({})   // userId → user object
  const [loading, setLoading] = useState(true)
  const [activeConvId, setActiveConvId] = useState(null)
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
  const [showMobileList, setShowMobileList] = useState(true)

  const bottomRef = useRef()
  const fileInputRef = useRef()
  const textareaRef = useRef()
  const typingTimeout = useRef()

  const activeConv = conversations.find(c => c.id === activeConvId)
  const messages = activeConv?.messages || []

  // Fetch profiles for a list of user IDs
  const fetchProfiles = useCallback(async (ids) => {
    const missing = ids.filter(id => id && id !== user?.id && !profiles[id])
    if (!missing.length) return
    const { data } = await supabase.from('users').select('id,full_name,username,avatar_url,headline').in('id', missing)
    if (data) setProfiles(prev => {
      const next = { ...prev }
      data.forEach(u => { next[u.id] = u })
      return next
    })
  }, [profiles, user?.id])

  // Enrich conversations with other_user
  const enrichConv = useCallback((conv) => {
    if (!user?.id) return conv
    if (conv.is_group) {
      return { ...conv, other_user: { full_name: conv.name || 'Group', is_online: false } }
    }
    const otherId = (conv.participant_ids || []).find(id => id !== user.id)
    const other = profiles[otherId] || { full_name: 'User', is_online: false }
    return { ...conv, other_user: other }
  }, [user?.id, profiles])

  // Load conversations
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(50)

      const convs = data || []

      // Gather all participant IDs (not self)
      const allIds = [...new Set(convs.flatMap(c => (c.participant_ids || []).filter(id => id !== user.id)))]
      if (allIds.length) {
        const { data: users } = await supabase.from('users').select('id,full_name,username,avatar_url,headline').in('id', allIds)
        if (users) {
          const map = {}
          users.forEach(u => { map[u.id] = u })
          setProfiles(map)
        }
      }

      setConversations(convs.map(c => ({ ...c, messages: [], unread_count: c.unread_count || 0 })))
      setLoading(false)
    }
    load()
  }, [user?.id])

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)

    supabase.from('messages').select('*')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: data } : c))
          // Mark unread as read
          setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unread_count: 0 } : c))
          // Fetch sender profiles
          const senderIds = [...new Set(data.map(m => m.created_by).filter(Boolean))]
          fetchProfiles(senderIds)
        }
      })

    // Real-time: new messages
    const msgChannel = supabase.channel(`msg-${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        ({ new: msg }) => {
          if (msg.created_by !== user?.id) {
            setConversations(prev => prev.map(c =>
              c.id === activeConvId ? { ...c, messages: [...(c.messages || []), msg] } : c
            ))
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        ({ new: msg }) => {
          setConversations(prev => prev.map(c =>
            c.id === activeConvId ? { ...c, messages: (c.messages || []).map(m => m.id === msg.id ? msg : m) } : c
          ))
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        ({ old: msg }) => {
          setConversations(prev => prev.map(c =>
            c.id === activeConvId ? { ...c, messages: (c.messages || []).filter(m => m.id !== msg.id) } : c
          ))
        })
      .subscribe()

    // Real-time: typing indicator
    const typingChannel = supabase.channel(`typing-${activeConvId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id !== user?.id) {
          setIsTyping(true)
          clearTimeout(typingTimeout.current)
          typingTimeout.current = setTimeout(() => setIsTyping(false), 2500)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [activeConvId, user?.id])

  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const broadcastTyping = useCallback(async () => {
    if (!activeConvId || !user?.id) return
    await supabase.channel(`typing-${activeConvId}`).send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } })
  }, [activeConvId, user?.id])

  // Open or create a conversation with a user
  async function handleOpenConvWithUser(existingConv, participants) {
    if (existingConv) {
      // Group conv that was just created in DB
      setConversations(prev => {
        if (prev.find(c => c.id === existingConv.id)) return prev
        return [{ ...existingConv, messages: [], unread_count: 0 }, ...prev]
      })
      setActiveConvId(existingConv.id)
      setShowMobileList(false)
      return
    }

    const otherUser = participants[0]
    if (!otherUser) return

    // Check if DM already exists
    const existing = conversations.find(c =>
      !c.is_group &&
      (c.participant_ids || []).includes(user.id) &&
      (c.participant_ids || []).includes(otherUser.id)
    )
    if (existing) {
      setActiveConvId(existing.id)
      setShowMobileList(false)
      return
    }

    // Create new DM conversation
    const { data: conv } = await supabase.from('conversations').insert({
      is_group: false,
      participant_ids: [user.id, otherUser.id],
      last_message: null,
      created_by: user.id,
    }).select().single()

    if (conv) {
      setProfiles(prev => ({ ...prev, [otherUser.id]: otherUser }))
      setConversations(prev => [{ ...conv, messages: [], unread_count: 0 }, ...prev])
      setActiveConvId(conv.id)
      setShowMobileList(false)
    }
  }

  function handleSelectConv(conv) {
    setActiveConvId(conv.id)
    setShowMobileList(false)
  }

  async function handleDeleteConv(conv) {
    setConversations(prev => prev.filter(c => c.id !== conv.id))
    if (activeConvId === conv.id) { setActiveConvId(null); setShowMobileList(true) }
    // Remove from participant_ids (soft leave) or delete if only participant
    const remaining = (conv.participant_ids || []).filter(id => id !== user?.id)
    if (remaining.length === 0) {
      await supabase.from('messages').delete().eq('conversation_id', conv.id)
      await supabase.from('conversations').delete().eq('id', conv.id)
    } else {
      await supabase.from('conversations').update({ participant_ids: remaining }).eq('id', conv.id)
    }
  }

  async function handleSend() {
    if (!text.trim() && !attachFile) return
    if (!activeConvId || !user?.id) return

    const content = text.trim() || null
    const file = attachFile
    const msgType = file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text'
    const tempId = `temp-${Date.now()}`

    const tempMsg = {
      id: tempId,
      conversation_id: activeConvId,
      created_by: user.id,
      content,
      message_type: msgType,
      file_url: attachPreview || null,
      file_name: file?.name || null,
      file_size: file?.size || null,
      reply_to_id: replyTo?.id || null,
      reply_preview: replyTo ? (replyTo.content || '[media]').slice(0, 80) : null,
      reply_sender: replyTo ? (replyTo.created_by === user.id ? 'You' : (activeConv?.other_user?.full_name || 'User')) : null,
      created_at: new Date().toISOString(),
      _status: 'sending',
    }

    setText('')
    setReplyTo(null)
    setAttachFile(null)
    setAttachPreview(null)

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...(c.messages || []), tempMsg], last_message: content || `📎 ${file?.name}`, last_message_at: tempMsg.created_at }
        : c
    ))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    setSending(true)
    try {
      let fileUrl = null, fileName = null, fileSize = null
      if (file) {
        const path = `messages/${user.id}/${Date.now()}-${file.name}`
        const { data: uploaded } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
        if (uploaded) {
          const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(uploaded.path)
          fileUrl = publicUrl; fileName = file.name; fileSize = file.size
        }
      }

      const { data: saved } = await supabase.from('messages').insert({
        conversation_id: activeConvId,
        created_by: user.id,
        content,
        message_type: msgType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyTo?.id || null,
      }).select().single()

      if (saved) {
        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...saved, _status: 'sent' } : m) }
            : c
        ))
        await supabase.from('conversations').update({
          last_message: content || `📎 ${fileName}`,
          last_message_at: saved.created_at,
        }).eq('id', activeConvId)
      }
    } catch {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...m, _status: 'failed' } : m) }
          : c
      ))
    }
    setSending(false)
  }

  async function handleReact(msgId, emoji) {
    if (!user?.id) return
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const reactions = { ...(msg.reactions || {}) }
    const existing = reactions[emoji] || []
    if (existing.includes(user.id)) {
      reactions[emoji] = existing.filter(id => id !== user.id)
      if (!reactions[emoji].length) delete reactions[emoji]
    } else {
      reactions[emoji] = [...existing, user.id]
    }
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, reactions } : m) }
        : c
    ))
    await supabase.from('messages').update({ reactions }).eq('id', msgId)
  }

  async function handleDeleteMsg(msg) {
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: c.messages.filter(m => m.id !== msg.id) }
        : c
    ))
    await supabase.from('messages').delete().eq('id', msg.id).eq('created_by', user?.id)
  }

  const enriched = conversations.map(enrichConv)
  const activeEnriched = enriched.find(c => c.id === activeConvId)

  const filteredConvs = enriched.filter(c => {
    if (filter === 'unread') return (c.unread_count || 0) > 0
    if (filter === 'groups') return c.is_group
    if (search) {
      const q = search.toLowerCase()
      return c.other_user?.full_name?.toLowerCase().includes(q) ||
             c.name?.toLowerCase().includes(q) ||
             c.last_message?.toLowerCase().includes(q)
    }
    return true
  })

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background">
      {/* ── LEFT PANEL ── */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 flex-shrink-0 flex-col border-r border-border bg-card`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h1 className="font-bold text-foreground text-lg">Messages</h1>
          <button onClick={() => setShowNewConv(true)} className="p-2 rounded-xl hover:bg-muted transition-colors" title="New message">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
              className="w-full bg-muted rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div className="flex gap-1 px-3 pb-2.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">{search ? 'No results' : 'No conversations yet'}</p>
              {!search && (
                <button onClick={() => setShowNewConv(true)}
                  className="mt-3 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium">
                  Start one
                </button>
              )}
            </div>
          ) : (
            filteredConvs.map(c => (
              <ConversationItem key={c.id} conv={c} isActive={c.id === activeConvId}
                onSelect={handleSelectConv} onDelete={handleDeleteConv} />
            ))
          )}
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}>
        {activeEnriched ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
              <button onClick={() => { setShowMobileList(true); setActiveConvId(null) }} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Avatar user={activeEnriched.other_user} showOnline size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  {activeEnriched.is_group ? (activeEnriched.name || 'Group') : activeEnriched.other_user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeEnriched.other_user?.is_online ? '🟢 Online' : (activeEnriched.other_user?.headline || 'Offline')}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button className="p-2 rounded-xl hover:bg-muted" title="Voice call"><Phone className="w-4 h-4 text-muted-foreground" /></button>
                <button className="p-2 rounded-xl hover:bg-muted" title="Video call"><Video className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => setShowRightPanel(s => !s)}
                  className={`p-2 rounded-xl hover:bg-muted ${showRightPanel ? 'bg-muted' : ''}`} title="Info">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-xl hover:bg-muted"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
              {grouped.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1 opacity-60">Send a message to start the conversation</p>
                </div>
              )}
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
                const showAv = !prev || prev.created_by !== msg.created_by
                const isMine = msg.created_by === user?.id
                const senderProfile = isMine ? user : (profiles[msg.created_by] || activeEnriched.other_user)
                return (
                  <MessageBubble key={msg.id} msg={msg}
                    isMine={isMine}
                    showAvatar={showAv}
                    otherUser={senderProfile}
                    onReact={handleReact}
                    onReply={setReplyTo}
                    onDelete={handleDeleteMsg}
                  />
                )
              })}
              {isTyping && <TypingIndicator user={activeEnriched.other_user} />}
              <div ref={bottomRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 flex-shrink-0">
                <Reply className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    {replyTo.created_by === user?.id ? 'You' : activeEnriched.other_user?.full_name}
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
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-0.5 pb-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-muted" title="Attach file">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      setAttachFile(f)
                      setAttachPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
                      e.target.value = ''
                    }} />
                </div>

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => { setText(e.target.value); broadcastTyping(); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none max-h-32 leading-relaxed"
                />

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
              <p className="text-xs mt-1 opacity-60">Or start a new one</p>
              <button onClick={() => setShowNewConv(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                New Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      {showRightPanel && activeEnriched && <RightPanel conv={activeEnriched} onClose={() => setShowRightPanel(false)} />}

      {/* ── MODALS ── */}
      {showNewConv && (
        <NewConversationModal
          onClose={() => setShowNewConv(false)}
          onOpenConv={handleOpenConvWithUser}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
