import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader2, ArrowLeft, Users, Paperclip, Smile,
  Mic, X, MoreVertical, Reply, Copy, Trash2,
  Download, Play, Pause, File as FileIcon, Image as ImageIcon,
  Video as VideoIcon, Settings, Plus, Lock, Globe,
  Crown, ShieldCheck, UserMinus, Edit3, Check, ChevronDown,
  MessageSquare, AlertTriangle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

function fmtDuration(s) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}

function fmtTime(ts) {
  const d = new Date(ts)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, h:mm a')
}

function dateDivider(ts) {
  const d = new Date(ts)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

function Avatar({ src, name, size = 9 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500','bg-pink-500','bg-indigo-500']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`
  return src
    ? <img src={src} alt={name} className={cls} />
    : <div className={`${cls} ${color} flex items-center justify-center text-white font-bold text-xs`}>{initials}</div>
}

const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','🎉','👏']

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file, folder = 'group-files') {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

// ─── Voice Recorder hook ──────────────────────────────────────────────────────

function useVoiceRecorder(onSend) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        onSend(file, seconds)
      }
      rec.start()
      recRef.current = rec
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch (e) { console.error('Mic error:', e) }
  }, [onSend, seconds])

  const stop = useCallback((cancel = false) => {
    clearInterval(timerRef.current)
    if (recRef.current && recRef.current.state !== 'inactive') {
      if (cancel) {
        chunksRef.current = []
        recRef.current.ondataavailable = null
        recRef.current.onstop = null
      }
      recRef.current.stop()
    }
    setRecording(false)
    setSeconds(0)
  }, [])

  return { recording, seconds, start, stop }
}

// ─── Audio Player component ───────────────────────────────────────────────────

function AudioPlayer({ src, duration }) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const audioRef = useRef(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
    setPlaying(p => !p)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setElapsed(audio.currentTime)
    const end = () => { setPlaying(false); setElapsed(0) }
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('ended', end)
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('ended', end) }
  }, [])

  return (
    <div className="flex items-center gap-3 bg-muted/60 rounded-xl px-3 py-2 min-w-[160px] max-w-[240px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="w-full h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${duration ? (elapsed / duration) * 100 : 0}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{fmtDuration(elapsed)} / {fmtDuration(duration)}</div>
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn, currentUserId, onReply, onDelete, onReact, reactions, group }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReactPicker, setShowReactPicker] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!showMenu) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  if (msg.is_deleted) {
    return (
      <div className={`flex gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8" />
        <div className="text-xs italic text-muted-foreground px-3 py-1.5">This message was deleted</div>
      </div>
    )
  }

  const grouped = reactions ? reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || []).concat(r.user_id)
    return acc
  }, {}) : {}

  return (
    <div className={`flex gap-2 mb-1 group/msg ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 self-end">
        <Avatar src={msg.sender_avatar} name={msg.sender_name} size={8} />
      </div>

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (not own messages) */}
        {!isOwn && <span className="text-xs font-semibold text-primary mb-0.5 px-1">{msg.sender_name}</span>}

        {/* Reply quote */}
        {msg.reply_preview && (
          <div className={`text-xs bg-muted/60 border-l-2 border-primary px-2 py-1 rounded mb-1 max-w-full ${isOwn ? 'text-right border-r-2 border-l-0 pr-2 pl-1' : ''}`}>
            <span className="font-semibold text-primary">{msg.reply_sender} </span>
            <span className="text-muted-foreground line-clamp-1">{msg.reply_preview}</span>
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          <div
            className={`rounded-2xl px-3 py-2 text-sm break-words ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border/60 text-foreground rounded-bl-sm'
            }`}
          >
            {msg.message_type === 'text' && <p className="whitespace-pre-wrap">{msg.content}</p>}

            {msg.message_type === 'image' && (
              <div>
                <img src={msg.file_url} alt="Image" className="max-w-[280px] rounded-xl cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                {msg.content && <p className="mt-1 text-sm whitespace-pre-wrap">{msg.content}</p>}
              </div>
            )}

            {msg.message_type === 'video' && (
              <video src={msg.file_url} controls className="max-w-[280px] rounded-xl" />
            )}

            {(msg.message_type === 'voice' || msg.message_type === 'audio') && (
              <AudioPlayer src={msg.file_url} duration={msg.duration_seconds} />
            )}

            {msg.message_type === 'file' && (
              <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 ${isOwn ? '' : 'text-foreground'}`} download={msg.file_name}>
                <FileIcon className="w-8 h-8 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold line-clamp-1">{msg.file_name}</div>
                  <div className="text-xs opacity-70">{fmtSize(msg.file_size)}</div>
                </div>
                <Download className="w-4 h-4 flex-shrink-0 ml-auto" />
              </a>
            )}

            {msg.message_type === 'gif' && (
              <img src={msg.file_url} alt="GIF" className="max-w-[240px] rounded-xl" />
            )}
          </div>

          {/* Action buttons (hover) */}
          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1`}>
            {group?.allow_reactions !== false && (
              <button onClick={() => setShowReactPicker(p => !p)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted text-base">
                😊
              </button>
            )}
            <button onClick={() => onReply(msg)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted">
              <Reply className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(p => !p)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted">
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showMenu && (
                <div className={`absolute top-8 ${isOwn ? 'right-0' : 'left-0'} z-50 bg-card border border-border rounded-xl shadow-xl min-w-[140px] overflow-hidden`}>
                  <button onClick={() => { onReply(msg); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                    <Reply className="w-4 h-4" /> Reply
                  </button>
                  {msg.message_type === 'text' && (
                    <button onClick={() => { navigator.clipboard.writeText(msg.content); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                  )}
                  {isOwn && (
                    <button onClick={() => { onDelete(msg.id); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emoji reaction picker */}
        {showReactPicker && (
          <div className={`flex gap-1 mt-1 p-1.5 bg-card border border-border rounded-xl shadow-lg ${isOwn ? 'flex-row-reverse' : ''}`}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => { onReact(msg.id, e); setShowReactPicker(false) }} className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(grouped).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {Object.entries(grouped).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors ${users.includes(currentUserId) ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted border-border hover:bg-muted/80'}`}
              >
                <span>{emoji}</span>
                <span className="font-semibold">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{fmtTime(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ─── Group Settings Modal ─────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function SectionHeader({ title }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-1 pb-1 border-b border-border">{title}</p>
}

function GroupSettingsModal({ group, myRole, onSaved, onClose, onDeleted }) {
  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
  const isOwner = myRole === 'owner'

  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [groupType, setGroupType] = useState(group.group_type || 'group')
  const [isPrivate, setIsPrivate] = useState(!!group.is_private)
  const [onlyAdminPost, setOnlyAdminPost] = useState(!!group.only_admin_can_post)
  const [allowReactions, setAllowReactions] = useState(group.allow_reactions !== false)
  const [allowFiles, setAllowFiles] = useState(group.allow_files !== false)
  const [allowVoice, setAllowVoice] = useState(group.allow_voice !== false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(group.avatar_url || '')
  const avatarInputRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const url = await uploadFile(file, 'group-avatars')
      setAvatarUrl(url)
    } catch (err) { console.error(err) }
    setAvatarUploading(false)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('groups').update({
      name: name.trim(),
      description: description.trim(),
      group_type: groupType,
      is_private: isPrivate,
      only_admin_can_post: onlyAdminPost,
      allow_reactions: allowReactions,
      allow_files: allowFiles,
      allow_voice: allowVoice,
      avatar_url: avatarUrl || null,
    }).eq('id', group.id)
    setSaving(false)
    if (!error) {
      showToast('Group settings updated')
      onSaved({
        ...group,
        name: name.trim(),
        description: description.trim(),
        group_type: groupType,
        is_private: isPrivate,
        only_admin_can_post: onlyAdminPost,
        allow_reactions: allowReactions,
        allow_files: allowFiles,
        allow_voice: allowVoice,
        avatar_url: avatarUrl || null,
      })
    }
  }

  const deleteGroup = async () => {
    setDeleting(true)
    await supabase.from('groups').update({ status: 'deleted' }).eq('id', group.id)
    setDeleting(false)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-base">Group Settings</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">

          {/* ── General ── */}
          <SectionHeader title="General" />

          {/* Avatar */}
          <div className="flex items-center gap-4 py-2">
            <div
              className="w-16 h-16 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0 cursor-pointer relative"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white text-2xl font-bold">{(name || 'G')[0]}</span>
              }
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <div className="min-w-0">
              <p className="text-sm font-medium">Group Avatar</p>
              <p className="text-xs text-muted-foreground">Click to upload a new photo</p>
            </div>
          </div>

          <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Group name" />
          <textarea className={`${inp} resize-none mt-2`} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />

          {/* Group type */}
          <div className="flex gap-2 mt-2">
            {['group', 'channel'].map(t => (
              <button
                key={t}
                onClick={() => setGroupType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${groupType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {t === 'group' ? '👥 Group' : '📢 Channel'}
              </button>
            ))}
          </div>

          {/* ── Posting ── */}
          <SectionHeader title="Posting" />
          <Toggle value={onlyAdminPost} onChange={setOnlyAdminPost} label="Only admins can post" />
          <Toggle value={allowReactions} onChange={setAllowReactions} label="Allow emoji reactions" />
          <Toggle value={allowFiles} onChange={setAllowFiles} label="Allow file sharing" />
          <Toggle value={allowVoice} onChange={setAllowVoice} label="Allow voice messages" />

          {/* ── Members ── */}
          <SectionHeader title="Members" />
          <Toggle value={isPrivate} onChange={setIsPrivate} label="Private group (invite only)" />

          {/* ── Danger Zone ── */}
          {isOwner && (
            <>
              <SectionHeader title="Danger Zone" />
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl border border-destructive text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Delete Group
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-3">
                  <p className="text-sm text-destructive font-semibold text-center">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Cancel</button>
                    <button onClick={deleteGroup} disabled={deleting} className="flex-1 py-2 rounded-xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          {toast && <p className="text-xs text-emerald-600 font-semibold text-center mb-2">{toast}</p>}
          <button
            onClick={save}
            disabled={saving || !name.trim() || avatarUploading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main GroupChat Page ──────────────────────────────────────────────────────

export default function GroupChat() {
  const { id: groupId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Group state
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState(null)   // 'owner'|'admin'|'member'|null
  const [isMember, setIsMember] = useState(false)

  // Messages state
  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState([])   // flat array of all reactions
  const [loadingMsgs, setLoadingMsgs] = useState(true)

  // Input state
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showMembers, setShowMembers] = useState(true)
  const [showEditGroup, setShowEditGroup] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Voice
  const sendVoice = useCallback(async (file, duration) => {
    if (!user || !isMember) return
    setUploading(true)
    try {
      const url = await uploadFile(file, 'voice-messages')
      await supabase.from('group_messages').insert({
        group_id: groupId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_avatar: user.avatar_url || null,
        message_type: 'voice',
        file_url: url,
        duration_seconds: duration,
        content: null,
      })
    } catch (e) { console.error(e) }
    setUploading(false)
  }, [user, isMember, groupId])

  const { recording, seconds, start: startRec, stop: stopRec } = useVoiceRecorder(sendVoice)

  // Load group and check membership
  useEffect(() => {
    const load = async () => {
      // Group info
      const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (!g) { navigate('/groups'); return }
      setGroup(g)

      // Members
      const { data: mems } = await supabase.from('group_members').select('*').eq('group_id', groupId).order('role')
      setMembers(mems || [])

      // My membership
      if (user?.id) {
        const me = (mems || []).find(m => m.user_id === user.id)
        if (me) { setIsMember(true); setMyRole(me.role) }
      }
    }
    load()
  }, [groupId, user?.id, navigate])

  // Load messages
  useEffect(() => {
    const load = async () => {
      setLoadingMsgs(true)
      const { data } = await supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at').limit(100)
      setMessages(data || [])

      // Load reactions for these messages
      if (data?.length) {
        const ids = data.map(m => m.id)
        const { data: rxns } = await supabase.from('group_reactions').select('*').in('message_id', ids)
        setReactions(rxns || [])
      }
      setLoadingMsgs(false)
    }
    load()
  }, [groupId])

  // Scroll to bottom
  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => { if (!loadingMsgs) scrollBottom() }, [loadingMsgs, scrollBottom])

  // Real-time new messages
  useEffect(() => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        scrollBottom()
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_reactions',
      }, payload => {
        setReactions(prev => {
          if (prev.find(r => r.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'group_reactions',
      }, payload => {
        setReactions(prev => prev.filter(r => r.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [groupId, scrollBottom])

  // Check if user can post
  const canPost = useMemo(() => {
    if (!isMember || !user) return false
    if (!group) return false
    if (group.only_admin_can_post && myRole === 'member') return false
    return true
  }, [isMember, user, group, myRole])

  const isAdmin = myRole === 'owner' || myRole === 'admin'

  // Send text message
  const sendMessage = useCallback(async () => {
    if (!text.trim() || !canPost || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const reply = replyTo
    setReplyTo(null)
    try {
      await supabase.from('group_messages').insert({
        group_id: groupId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_avatar: user.avatar_url || null,
        content,
        message_type: 'text',
        reply_to: reply?.id || null,
        reply_preview: reply ? (reply.content || '[media]').slice(0, 80) : null,
        reply_sender: reply?.sender_name || null,
      })
    } catch (e) { console.error(e) }
    setSending(false)
  }, [text, canPost, sending, groupId, user, replyTo])

  // Send file
  const sendFile = useCallback(async (file) => {
    if (!canPost) return
    setShowAttach(false)
    setUploading(true)
    try {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      const type = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'file'
      const url = await uploadFile(file, `group-${type}`)
      await supabase.from('group_messages').insert({
        group_id: groupId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_avatar: user.avatar_url || null,
        message_type: type,
        file_url: url,
        file_name: file.name,
        file_size: file.size,
        content: null,
      })
    } catch (e) { console.error(e) }
    setUploading(false)
  }, [canPost, groupId, user])

  // Delete message
  const deleteMessage = useCallback(async (msgId) => {
    await supabase.from('group_messages').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', msgId)
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m))
  }, [])

  // React to message
  const handleReact = useCallback(async (msgId, emoji) => {
    if (!user || !group?.allow_reactions) return
    const existing = reactions.find(r => r.message_id === msgId && r.user_id === user.id && r.emoji === emoji)
    if (existing) {
      await supabase.from('group_reactions').delete().eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase.from('group_reactions').insert({ message_id: msgId, user_id: user.id, emoji }).select().single()
      if (data) setReactions(prev => [...prev, data])
    }
  }, [user, reactions, group?.allow_reactions])

  // Join group
  const handleJoin = async () => {
    if (!user) { navigate('/login'); return }
    await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member', can_post: !group?.only_admin_can_post })
    await supabase.from('groups').update({ member_count: (group?.member_count || 0) + 1 }).eq('id', groupId)
    setIsMember(true)
    setMyRole('member')
  }

  // Kick member
  const kickMember = async (memberId) => {
    await supabase.from('group_members').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
    await supabase.from('groups').update({ member_count: Math.max(0, (group?.member_count || 1) - 1) }).eq('id', groupId)
  }

  // Date dividers between messages
  const withDividers = useMemo(() => {
    const result = []
    let lastDate = null
    messages.forEach(msg => {
      const d = new Date(msg.created_at)
      const dateStr = format(d, 'yyyy-MM-dd')
      if (dateStr !== lastDate) {
        result.push({ type: 'divider', date: msg.created_at, key: `div-${dateStr}` })
        lastDate = dateStr
      }
      result.push({ type: 'message', data: msg, key: msg.id })
    })
    return result
  }, [messages])

  const msgReactions = useMemo(() => {
    const map = {}
    reactions.forEach(r => {
      if (!map[r.message_id]) map[r.message_id] = []
      map[r.message_id].push(r)
    })
    return map
  }, [reactions])

  if (!group) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isChannel = group.group_type === 'channel'

  return (
    <div className="flex h-[calc(100vh-64px)] -mt-6 -mx-4 overflow-hidden">
      {/* ── Left sidebar ── */}
      <div className={`${showMembers ? 'w-72' : 'w-0'} transition-all duration-200 flex-shrink-0 border-r border-border bg-card overflow-hidden`}>
        {showMembers && (
          <div className="flex flex-col h-full">
            {/* Group info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-primary flex items-center justify-center">
                  {group.avatar_url
                    ? <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-lg font-bold">{group.name[0]}</span>
                  }
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm line-clamp-1">{group.name}</h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {group.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    <span>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
              {/* Invite link */}
              {group.invite_code && isMember && (
                <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Invite link</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs flex-1 truncate text-foreground">/join/{group.invite_code}</code>
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`)} className="text-primary text-xs font-semibold hover:underline flex-shrink-0">
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="px-4 py-3 border-b border-border space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Admin</p>
                <button onClick={() => setShowEditGroup(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-left">
                  <Edit3 className="w-4 h-4 text-muted-foreground" /> Edit Group Info
                </button>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted cursor-pointer" onClick={async () => {
                  const newVal = !group.only_admin_can_post
                  await supabase.from('groups').update({ only_admin_can_post: newVal }).eq('id', groupId)
                  setGroup(g => ({ ...g, only_admin_can_post: newVal }))
                }}>
                  <span className="text-sm">Only admins post</span>
                  <div className={`w-9 h-5 rounded-full relative ${group.only_admin_can_post ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${group.only_admin_can_post ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-3 pb-2">Members ({members.length})</p>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/50 group/member">
                  <div className="relative flex-shrink-0">
                    <Avatar src={null} name={`Member ${m.user_id?.slice(0, 4)}`} size={8} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">{m.user_id === user?.id ? 'You' : `Member`}</span>
                      {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      {m.role === 'admin' && <ShieldCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
                  </div>
                  {isAdmin && m.user_id !== user?.id && m.role !== 'owner' && (
                    <button onClick={() => kickMember(m.id)} className="opacity-0 group-hover/member:opacity-100 text-destructive hover:text-destructive/80">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Leave group */}
            {isMember && myRole !== 'owner' && (
              <div className="p-3 border-t border-border">
                <button
                  onClick={async () => {
                    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
                    navigate('/groups')
                  }}
                  className="w-full py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 font-medium"
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button onClick={() => navigate('/groups')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-primary flex items-center justify-center">
            {group.avatar_url
              ? <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{group.name[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm truncate">{group.name}</h1>
            <p className="text-xs text-muted-foreground">{group.member_count} member{group.member_count !== 1 ? 's' : ''}{isChannel ? ' · Channel' : ''}</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowEditGroup(true)} className="text-muted-foreground hover:text-foreground" title="Group Settings">
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowMembers(v => !v)} className={`text-muted-foreground hover:text-foreground ${showMembers ? 'text-primary' : ''}`}>
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {loadingMsgs ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="font-bold text-lg mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">Be the first to say something!</p>
            </div>
          ) : (
            withDividers.map(item => {
              if (item.type === 'divider') {
                return (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{dateDivider(item.date)}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )
              }
              const msg = item.data
              return (
                <MessageBubble
                  key={item.key}
                  msg={msg}
                  isOwn={msg.sender_id === user?.id}
                  currentUserId={user?.id}
                  onReply={setReplyTo}
                  onDelete={deleteMessage}
                  onReact={handleReact}
                  reactions={msgReactions[msg.id] || []}
                  group={group}
                />
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply bar */}
        {replyTo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-t border-border text-sm flex-shrink-0">
            <Reply className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-primary">{replyTo.sender_name}</span>
              <span className="text-muted-foreground ml-1 line-clamp-1">{replyTo.content || '[media]'}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Join banner for non-members */}
        {!isMember && (
          <div className="flex items-center gap-4 px-4 py-3 bg-card border-t border-border flex-shrink-0">
            <p className="flex-1 text-sm text-muted-foreground">Join this {isChannel ? 'channel' : 'group'} to participate</p>
            <button onClick={handleJoin} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Join {isChannel ? 'Channel' : 'Group'}
            </button>
          </div>
        )}

        {/* Input bar */}
        {isMember && (
          <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
            <div className="flex items-end gap-2">
              {/* Left buttons — hidden when canPost is false */}
              {canPost && (
                <div className="relative flex-shrink-0">
                  <button onClick={() => { setShowAttach(p => !p); setShowEmojiPicker(false) }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  {showAttach && (
                    <div className="absolute bottom-12 left-0 z-50 bg-card border border-border rounded-xl shadow-xl p-2 flex gap-2">
                      {[
                        { icon: ImageIcon, label: 'Photo/Video', accept: 'image/*,video/*' },
                        { icon: FileIcon, label: 'File', accept: '*' },
                      ].map(({ icon: Icon, label, accept }) => (
                        <button key={label} onClick={() => { fileInputRef.current.accept = accept; fileInputRef.current.click(); setShowAttach(false) }} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted text-sm">
                          <Icon className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {canPost && (
                <button onClick={() => { setShowEmojiPicker(p => !p); setShowAttach(false) }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground text-xl flex-shrink-0">
                  😊
                </button>
              )}

              {/* Text input — always visible but disabled when canPost is false */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => { if (!canPost) return; setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={canPost ? 'Type a message…' : 'Only admins can post in this group'}
                  rows={1}
                  className={`w-full resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none max-h-[120px] ${canPost ? 'focus:ring-2 focus:ring-primary/30' : 'cursor-not-allowed opacity-60 text-muted-foreground'}`}
                  disabled={!canPost || uploading || recording}
                />
              </div>

              {/* Right: voice or send — hidden when canPost is false */}
              {canPost && (
                text.trim() ? (
                  <button onClick={sendMessage} disabled={sending} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90">
                    {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                ) : group.allow_voice !== false && (
                  recording ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-destructive font-semibold animate-pulse">{fmtDuration(seconds)}</span>
                      <button onClick={() => stopRec(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => stopRec(false)} className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onMouseDown={startRec} disabled={uploading} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                      <Mic className="w-5 h-5" />
                    </button>
                  )
                )
              )}
            </div>

            {/* Restricted posting notice */}
            {!canPost && group.only_admin_can_post && (
              <p className="text-xs text-muted-foreground text-center mt-2">Only admins can post in this {isChannel ? 'channel' : 'group'}</p>
            )}

            {/* Emoji picker (simple) */}
            {showEmojiPicker && canPost && (
              <div className="mt-2 p-3 bg-card border border-border rounded-2xl shadow-xl grid grid-cols-8 gap-2">
                {['😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🥳','😅','🤣','😇','🙄','😤','🫠','👍','❤️','😮','🔥','🎉','💯','✨','🙌','👏','🤝','💪','🫶','❤️‍🔥','💕','🌟','🏆','🎵','🎶','🎤','🎬','📸','💡','🚀','⚡','🌍','🌈','🏖️','🍕','🍔','☕','🎂','🥑'].map(e => (
                  <button key={e} onClick={() => { setText(t => t + e); setShowEmojiPicker(false); inputRef.current?.focus() }} className="text-2xl hover:scale-125 transition-transform w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) sendFile(e.target.files[0]); e.target.value = '' }}
        />
      </div>

      {/* Group settings modal */}
      {showEditGroup && (
        <GroupSettingsModal
          group={group}
          myRole={myRole}
          onSaved={updated => { setGroup(updated); setShowEditGroup(false) }}
          onClose={() => setShowEditGroup(false)}
          onDeleted={() => navigate('/groups')}
        />
      )}
    </div>
  )
}
