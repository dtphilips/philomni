import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Heart, MessageCircle, Share2, Image as ImageIcon, Video as VideoIcon,
  Send, Loader2, MoreHorizontal, Trash2, Bold, Italic, List, Smile, X, Plus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const PAGE_SIZE = 10

const EMOJIS = {
  Smileys: ['😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🥳','😅','🤣','😇','🙄','😤'],
  Hearts:  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💝','💘'],
  Hands:   ['👏','🙌','👍','👎','🤝','🙏','👋','🤞','✌️','🤟','💪','🫶','👌','🤌','👀'],
  Animals: ['🐶','🐱','🦊','🐼','🦁','🐯','🦋','🐝','🦄','🐸','🦆','🐧','🦅','🐬','🦓'],
  Food:    ['🍕','🍔','🌮','🍜','🍣','🍩','🎂','🍓','🥑','🍊','☕','🧃','🍷','🥂','🍾'],
  Travel:  ['✈️','🚀','🌍','🏖️','🗼','🎡','🏔️','🌅','🗺️','🧳','🚗','🛳️','🎭','🏟️','🌃'],
  Objects: ['💻','📱','🎵','🎬','📸','💡','🔥','⚡','🎯','🏆','💎','🎁','📚','🔑','🪄'],
}

const MAX_CHARS = 2000

// ─── Utility ──────────────────────────────────────────────────────────────────

async function uploadToStorage(file) {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState('Smileys')
  const ref = useRef()

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  return (
    <div ref={ref} className="absolute bottom-8 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl w-72 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-border px-2 pt-2 gap-1 no-scrollbar">
        {Object.keys(EMOJIS).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap flex-shrink-0 transition-all ${cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0 p-2 max-h-44 overflow-y-auto">
        {EMOJIS[cat].map(e => (
          <button key={e} onClick={() => onSelect(e)}
            className="text-xl p-1 hover:bg-muted rounded-lg transition-all aspect-square flex items-center justify-center">
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Media Display ────────────────────────────────────────────────────────────

function MediaDisplay({ urls, type }) {
  const [portraits, setPortraits] = useState({})
  if (!urls?.length) return null
  const single = urls.length === 1

  return (
    <div className={`${!single ? 'grid grid-cols-2 gap-0.5' : ''} overflow-hidden`}>
      {urls.map((url, i) => {
        if (type === 'video') {
          return <video key={i} src={url} controls className="w-full max-h-[500px] object-contain bg-black" />
        }
        const isPortrait = portraits[i]
        return (
          <div key={i} className={`relative overflow-hidden bg-black ${single ? (isPortrait ? 'max-h-[600px]' : 'max-h-[450px]') : 'h-48'}`}>
            <img src={url} alt=""
              className={`w-full h-full ${isPortrait ? 'object-contain' : 'object-cover'}`}
              onLoad={e => {
                const img = e.target
                setPortraits(prev => ({ ...prev, [i]: img.naturalHeight > img.naturalWidth * 1.2 }))
              }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Stories Bar ──────────────────────────────────────────────────────────────

function StoriesBar({ currentUser }) {
  const [stories, setStories] = useState([])
  const [viewing, setViewing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    supabase.from('statuses').select('*').gte('created_at', cutoff)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setStories(data ?? []))
  }, [])

  const myStory = stories.find(s => s.user_id === currentUser?.id)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToStorage(file)
      const { data } = await supabase.from('statuses').insert({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_avatar: currentUser.avatar_url,
        media_url: url,
        type: file.type.startsWith('video') ? 'video' : 'image',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }).select().single()
      if (data) setStories(prev => [data, ...prev.filter(s => s.user_id !== currentUser.id)])
    } catch (err) {
      console.error('Story upload failed:', err)
    }
    setUploading(false)
    e.target.value = ''
  }

  const others = stories.filter(s => s.user_id !== currentUser?.id)

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {/* My story slot */}
        <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className={`relative w-14 h-14 rounded-full border-2 ${myStory ? 'border-primary p-0.5' : 'border-dashed border-border'} overflow-hidden flex items-center justify-center bg-muted transition-all`}>
            {currentUser?.avatar_url
              ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
              : <span className="text-lg font-bold text-primary">{currentUser?.full_name?.[0] ?? '?'}</span>}
            {uploading
              ? <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>
              : !myStory && (
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
          </div>
          <span className="text-xs text-muted-foreground w-14 text-center truncate">Your story</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        {/* Others */}
        {others.map(story => (
          <button key={story.id} onClick={() => setViewing(story)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full border-2 border-primary p-0.5 bg-gradient-to-tr from-purple-600 to-pink-500 overflow-hidden">
              <div className="w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {story.user_avatar
                  ? <img src={story.user_avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-primary">{story.user_name?.[0] ?? '?'}</span>}
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-14 text-center truncate">{story.user_name?.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Story viewer overlay */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setViewing(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full bg-primary/30 overflow-hidden flex items-center justify-center">
              {viewing.user_avatar
                ? <img src={viewing.user_avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{viewing.user_name?.[0]}</span>}
            </div>
            <span className="text-white font-medium text-sm">{viewing.user_name}</span>
          </div>
          {viewing.type === 'video'
            ? <video src={viewing.media_url} autoPlay controls className="max-h-[85vh] max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
            : <img src={viewing.media_url} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />}
        </div>
      )}
    </>
  )
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function CommentSection({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data ?? []); setLoaded(true) })
  }, [postId])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    const { data } = await supabase.from('comments').insert({
      post_id: postId,
      content: text.trim(),
      author_id: currentUser.id,
      author_name: currentUser.full_name ?? currentUser.email,
      author_avatar: currentUser.avatar_url ?? null,
    }).select().single()
    if (data) { setComments(c => [...c, data]); onCommentAdded?.() }
    setText('')
    setSending(false)
  }

  return (
    <div className="border-t border-border px-4 py-3 space-y-3">
      {!loaded
        ? <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        : comments.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
              {c.author_avatar
                ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                : (c.author_name?.[0] ?? '?')}
            </div>
            <div className="flex-1 bg-muted rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-foreground mb-0.5">{c.author_name}</p>
              <p className="text-sm text-foreground">{c.content}</p>
            </div>
          </div>
        ))}
      <form onSubmit={submit} className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
          {currentUser?.avatar_url
            ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
            : (currentUser?.full_name?.[0] ?? '?')}
        </div>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment…"
          className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        <button type="submit" disabled={sending || !text.trim()}
          className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [shareFeedback, setShareFeedback] = useState(false)
  const menuRef = useRef()
  const isOwner = currentUser?.id === post.author_id

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleLike = async () => {
    const next = !liked
    setLiked(next)
    const count = likeCount + (next ? 1 : -1)
    setLikeCount(count)
    await supabase.from('posts').update({ like_count: count }).eq('id', post.id)
  }

  const handleDelete = async () => {
    await supabase.from('posts').delete().eq('id', post.id)
    onDelete(post.id)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    setShareFeedback(true)
    setTimeout(() => setShareFeedback(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0 overflow-hidden">
            {post.author_avatar
              ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
              : (post.author_name?.[0]?.toUpperCase() ?? '?')}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{post.author_name ?? 'Creator'}</p>
            {(post.author_role || post.author_headline) && (
              <p className="text-xs text-primary leading-tight">{post.author_role ?? post.author_headline}</p>
            )}
            <p className="text-xs text-muted-foreground leading-tight">
              {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-popover border border-border rounded-xl shadow-lg py-1 z-10 min-w-[130px]">
                <button onClick={() => { setShowMenu(false); handleDelete() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <div className="text-sm text-foreground leading-relaxed post-content"
            dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      )}

      {/* Media */}
      <MediaDisplay urls={post.media_urls} type={post.media_type} />

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border mt-1">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${liked ? 'text-pink-500 bg-pink-500/10' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10'}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => setShowComments(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${showComments ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
          <MessageCircle className="w-4 h-4" />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all ml-auto">
          <Share2 className="w-4 h-4" />
          {shareFeedback && <span className="text-xs">Copied!</span>}
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          currentUser={currentUser}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
    </div>
  )
}

// ─── Post Composer ────────────────────────────────────────────────────────────

function PostComposer({ user, onCreated }) {
  const editorRef = useRef()
  const imgInputRef = useRef()
  const vidInputRef = useRef()
  const [mediaFiles, setMediaFiles] = useState([]) // [{ file, preview, type }]
  const [charCount, setCharCount] = useState(0)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const execCmd = (cmd) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, null)
  }

  const insertEmoji = useCallback((emoji) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(emoji))
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    setCharCount(el.innerText?.length ?? 0)
    setShowEmoji(false)
  }, [])

  const handleFile = (e, mediaType) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const preview = URL.createObjectURL(file)
      setMediaFiles(prev => [...prev, { file, preview, type: mediaType }])
    })
    setExpanded(true)
    e.target.value = ''
  }

  const removeMedia = (i) => {
    setMediaFiles(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const reset = () => {
    if (editorRef.current) editorRef.current.innerHTML = ''
    setMediaFiles([])
    setCharCount(0)
    setExpanded(false)
    setError('')
    setShowEmoji(false)
  }

  const handlePost = async () => {
    const html = editorRef.current?.innerHTML?.trim() ?? ''
    const text = editorRef.current?.innerText?.trim() ?? ''
    if (!text && mediaFiles.length === 0) return
    if (text.length > MAX_CHARS) { setError(`Too long — max ${MAX_CHARS} characters`); return }
    setPosting(true)
    setError('')
    try {
      const mediaUrls = []
      for (const { file } of mediaFiles) {
        const url = await uploadToStorage(file)
        mediaUrls.push(url)
      }
      const mediaType = mediaFiles[0]?.type ?? 'none'
      const payload = {
        content: html,
        author_id: user.id,
        author_name: user.full_name ?? user.email,
        author_avatar: user.avatar_url ?? null,
        author_role: user.role ?? null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaUrls.length > 0 ? mediaType : 'none',
        like_count: 0,
        comment_count: 0,
        visibility: 'public',
      }
      console.log('=== SUPABASE INSERT ===', payload)
      const { data, error: err } = await supabase.from('posts').insert(payload).select().single()
      if (err) { console.error('POST ERROR:', err); setError(err.message); return }
      reset()
      onCreated(data)
    } catch (err) {
      console.error('Post failed:', err)
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  const hasContent = charCount > 0 || mediaFiles.length > 0

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div className="p-4 flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0 overflow-hidden">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : (user?.full_name?.[0]?.toUpperCase() ?? '?')}
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!expanded ? (
            <div onClick={() => setExpanded(true)}
              className="min-h-[42px] bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-text select-none flex items-center">
              What's on your mind, {user?.full_name?.split(' ')[0] ?? 'Creator'}?
            </div>
          ) : (
            <>
              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 mb-2 flex-wrap">
                <button onClick={() => execCmd('bold')} title="Bold"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCmd('italic')} title="Italic"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => execCmd('insertUnorderedList')} title="Bullet list"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <List className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowEmoji(v => !v)} title="Emoji"
                    className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${showEmoji ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                </div>
              </div>

              {/* ContentEditable */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Share an idea, update, or insight…"
                onInput={() => setCharCount(editorRef.current?.innerText?.length ?? 0)}
                className="composer-editor min-h-[80px] bg-muted rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ wordBreak: 'break-word' }}
              />
            </>
          )}
        </div>
      </div>

      {/* Media previews */}
      {mediaFiles.length > 0 && (
        <div className={`px-4 pb-3 ${mediaFiles.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
          {mediaFiles.map(({ preview, type }, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-black group">
              {type === 'video'
                ? <video src={preview} className="max-h-48 w-full object-contain" />
                : <img src={preview} alt="" className="max-h-48 w-full object-cover" />}
              <button onClick={() => removeMedia(i)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {expanded && (
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between gap-2 flex-wrap bg-muted/20">
          <div className="flex items-center gap-0.5">
            <label title="Add photo" className="cursor-pointer">
              <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFile(e, 'image')} />
              <div className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-emerald-500">
                <ImageIcon className="w-4 h-4" />
              </div>
            </label>
            <label title="Add video" className="cursor-pointer">
              <input ref={vidInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => handleFile(e, 'video')} />
              <div className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-blue-500">
                <VideoIcon className="w-4 h-4" />
              </div>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${charCount > MAX_CHARS ? 'text-destructive font-semibold' : charCount > MAX_CHARS * 0.8 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {charCount}/{MAX_CHARS}
            </span>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted">
              Cancel
            </button>
            <button onClick={handlePost} disabled={posting || !hasContent || charCount > MAX_CHARS}
              className="px-5 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const sentinelRef = useRef()
  const pageRef = useRef(0)

  const loadPosts = useCallback(async (pageNum) => {
    if (pageNum > 0) setLoadingMore(true)
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (data) {
      setPosts(prev => pageNum === 0 ? data : [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { loadPosts(0) }, [loadPosts])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        pageRef.current += 1
        setPage(pageRef.current)
        loadPosts(pageRef.current)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadPosts])

  const handleCreated = (post) => setPosts(prev => [post, ...prev])
  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div className="max-w-2xl mx-auto">
      <StoriesBar currentUser={user} />
      <PostComposer user={user} onCreated={handleCreated} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No posts yet</p>
          <p className="text-sm">Be the first to share something!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUser={user} onDelete={handleDelete} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            {!hasMore && posts.length >= PAGE_SIZE && (
              <p className="text-xs text-muted-foreground">You're all caught up ✓</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
