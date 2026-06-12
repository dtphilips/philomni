import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, Video, FileText, AlignLeft, ChevronLeft,
  ChevronRight, Send, Heart, Loader2, MessageCircle, StickyNote,
  Star, Award, Play, Download, ChevronDown, X,
} from 'lucide-react'

function isYouTube(url) { return /youtube\.com|youtu\.be/.test(url || '') }
function isVimeo(url)   { return /vimeo\.com/.test(url || '') }

function VideoPlayer({ url }) {
  if (!url) return <div className="w-full aspect-video bg-black flex items-center justify-center text-muted-foreground text-sm">No video provided</div>
  if (isYouTube(url)) {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
    const vid = match?.[1]
    return <iframe src={`https://www.youtube.com/embed/${vid}?autoplay=1`} className="w-full aspect-video" allowFullScreen allow="autoplay; encrypted-media" />
  }
  if (isVimeo(url)) {
    const match = url.match(/vimeo\.com\/(\d+)/)
    const vid = match?.[1]
    return <iframe src={`https://player.vimeo.com/video/${vid}?autoplay=1`} className="w-full aspect-video" allowFullScreen allow="autoplay; encrypted-media" />
  }
  return <video src={url} controls autoPlay className="w-full aspect-video bg-black" />
}

function Comment({ c, onLike, onReply, userId }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)

  const sendReply = async () => {
    if (!replyText.trim()) return
    setReplySending(true)
    await onReply(c.id, replyText.trim())
    setReplyText(''); setShowReply(false); setReplySending(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0 overflow-hidden">
          {c.users?.avatar_url
            ? <img src={c.users.avatar_url} className="w-full h-full object-cover" alt="" />
            : (c.users?.full_name || 'U')[0]}
        </div>
        <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
          <p className="text-xs font-medium text-foreground">{c.users?.full_name || 'Student'}</p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={() => onLike(c.id, c.liked_by_user)}
              className={`flex items-center gap-1 text-xs transition-colors ${c.liked_by_user ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}>
              <Heart className={`w-3 h-3 ${c.liked_by_user ? 'fill-red-400' : ''}`} />
              {c.likes_count || 0}
            </button>
            <button onClick={() => setShowReply(v => !v)} className="text-xs text-muted-foreground hover:text-primary">
              Reply
            </button>
          </div>
        </div>
      </div>
      {/* Replies */}
      {c.replies?.map(r => (
        <div key={r.id} className="flex gap-2 ml-9">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0 overflow-hidden">
            {r.users?.avatar_url
              ? <img src={r.users.avatar_url} className="w-full h-full object-cover" alt="" />
              : (r.users?.full_name || 'U')[0]}
          </div>
          <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
            <p className="text-xs font-medium text-foreground">{r.users?.full_name || 'Student'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{r.content}</p>
          </div>
        </div>
      ))}
      {showReply && (
        <div className="flex gap-2 ml-9">
          <input value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
            placeholder="Write a reply…"
            className="flex-1 px-3 py-1.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={sendReply} disabled={replySending || !replyText.trim()}
            className="p-1.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
            {replySending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}

function SidebarCurriculum({ modules, sections, activeId, completed, onSelect }) {
  const [openSections, setOpenSections] = useState(() => {
    const init = {}
    sections.forEach(s => { init[s.id] = true })
    return init
  })
  const toggleSection = (sid) => setOpenSections(p => ({ ...p, [sid]: !p[sid] }))

  if (sections.length === 0) {
    return (
      <div className="p-2 space-y-1">
        {modules.map((mod, idx) => {
          const isActive = mod.id === activeId
          const isDone = completed.includes(mod.id)
          return (
            <button key={mod.id} onClick={() => onSelect(mod.id)}
              className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {isDone ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <span className="w-4 h-4 text-xs flex items-center justify-center font-mono">{idx + 1}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight truncate">{mod.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{mod.type || 'video'}{mod.duration_minutes ? ` · ${mod.duration_minutes}m` : ''}</p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  let lessonIdx = 0
  return (
    <div className="p-2 space-y-1">
      {sections.map(sec => {
        const secMods = modules.filter(m => m.section_id === sec.id)
        const secDone = secMods.filter(m => completed.includes(m.id)).length
        const isOpen = openSections[sec.id] !== false
        return (
          <div key={sec.id}>
            <button onClick={() => toggleSection(sec.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <span className="text-xs font-semibold text-foreground flex-1 truncate">{sec.title}</span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{secDone}/{secMods.length}</span>
            </button>
            {isOpen && secMods.map(mod => {
              const num = ++lessonIdx
              const isActive = mod.id === activeId
              const isDone = completed.includes(mod.id)
              return (
                <button key={mod.id} onClick={() => onSelect(mod.id)}
                  className={`w-full text-left flex items-start gap-2.5 pl-7 pr-3 py-2 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      : <span className="w-3.5 h-3.5 text-[10px] flex items-center justify-center font-mono opacity-60">{num}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">{mod.title}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 capitalize">{mod.type || 'video'}{mod.duration_minutes ? ` · ${mod.duration_minutes}m` : ''}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )
      })}
      {/* Unsectioned modules */}
      {modules.filter(m => !m.section_id).map(mod => {
        const num = ++lessonIdx
        const isActive = mod.id === activeId
        const isDone = completed.includes(mod.id)
        return (
          <button key={mod.id} onClick={() => onSelect(mod.id)}
            className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <div className="flex-shrink-0 mt-0.5">
              {isDone ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <span className="w-4 h-4 text-xs flex items-center justify-center font-mono">{num}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-tight truncate">{mod.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{mod.type || 'video'}{mod.duration_minutes ? ` · ${mod.duration_minutes}m` : ''}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function CertificateModal({ course, user, completedAt, onClose }) {
  const certId = `CERT-${course?.id?.slice(0, 8).toUpperCase()}-${user?.id?.slice(0, 6).toUpperCase()}`
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const name = user?.full_name || user?.email?.split('@')[0] || 'Student'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {/* Certificate */}
        <div id="certificate-content" className="p-10 text-center space-y-6 border-4 border-primary/20 m-4 rounded-xl bg-gradient-to-b from-card to-muted/30">
          <div className="flex justify-center mb-2">
            <Award className="w-14 h-14 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Certificate of Completion</p>
            <p className="text-xs text-muted-foreground">This certifies that</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{name}</p>
          <div>
            <p className="text-sm text-muted-foreground">has successfully completed</p>
            <p className="text-xl font-bold text-foreground mt-1">{course?.title}</p>
            {course?.subtitle && <p className="text-sm text-muted-foreground mt-1">{course.subtitle}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="text-sm font-semibold text-foreground">{course?.instructor_name || 'Instructor'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold text-foreground">{date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Certificate ID</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{certId}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold">Philomni</span>
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>

        <div className="flex gap-3 p-4 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Close
          </button>
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CourseWatch() {
  const { courseId: id } = useParams()
  const navigate   = useNavigate()
  const [search]   = useSearchParams()
  const { user }   = useAuth()

  const [course,     setCourse]     = useState(null)
  const [modules,    setModules]    = useState([])
  const [sections,   setSections]   = useState([])
  const [activeId,   setActiveId]   = useState(search.get('module') || null)
  const [showCert,   setShowCert]   = useState(false)
  const [progress,   setProgress]   = useState(null)
  const [tab,        setTab]        = useState('discussion')
  const [comments,   setComments]   = useState([])
  const [newComment, setNewComment] = useState('')
  const [sending,    setSending]    = useState(false)
  const [notes,      setNotes]      = useState('')
  const [rating,     setRating]     = useState(0)
  const [ratingText, setRatingText] = useState('')
  const [rated,      setRated]      = useState(false)
  const [loading,    setLoading]    = useState(true)
  const notesKey = `course-notes-${id}-${activeId}`

  const active = modules.find(m => m.id === activeId) || modules[0]
  const activeIndex = modules.findIndex(m => m.id === active?.id)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: mods }, { data: secs }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('course_modules').select('*').eq('course_id', id).order('order_index'),
        supabase.from('course_sections').select('*').eq('course_id', id).order('order_index'),
      ])
      setCourse(c)
      setModules(mods || [])
      setSections(secs || [])
      if (!activeId && mods?.length > 0) setActiveId(mods[0].id)

      if (user?.id) {
        const { data: prog } = await supabase.from('course_progress').select('*')
          .eq('course_id', id).eq('user_id', user.id).maybeSingle()
        setProgress(prog)

        const { data: rev } = await supabase.from('course_ratings').select('*')
          .eq('course_id', id).eq('user_id', user.id).maybeSingle()
        if (rev) { setRated(true); setRating(rev.rating || 0); setRatingText(rev.review || '') }
      }
    } finally { setLoading(false) }
  }, [id, user?.id])

  useEffect(() => { load() }, [load])

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(notesKey)
    setNotes(saved || '')
  }, [notesKey])

  const saveNotes = (text) => {
    setNotes(text)
    localStorage.setItem(notesKey, text)
  }

  // Load comments for active module
  useEffect(() => {
    if (!active?.id) return
    const fetchComments = async () => {
      const { data: topLevel } = await supabase.from('course_comments').select('*, users(full_name, avatar_url)')
        .eq('course_id', id).eq('module_id', active.id).is('parent_id', null)
        .order('created_at', { ascending: false })

      if (!topLevel?.length) { setComments([]); return }

      const { data: replies } = await supabase.from('course_comments').select('*, users(full_name, avatar_url)')
        .eq('course_id', id).eq('module_id', active.id).not('parent_id', 'is', null)
        .order('created_at')

      const withReplies = topLevel.map(c => ({
        ...c,
        replies: replies?.filter(r => r.parent_id === c.id) || [],
        liked_by_user: false,
      }))
      setComments(withReplies)
    }
    fetchComments()
  }, [active?.id, id])

  // Realtime comments
  useEffect(() => {
    if (!active?.id) return
    const channel = supabase.channel(`comments-${active.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'course_comments', filter: `module_id=eq.${active.id}` },
        (payload) => {
          const newRow = payload.new
          if (!newRow.parent_id) {
            setComments(prev => [{ ...newRow, replies: [], liked_by_user: false, users: { full_name: user?.full_name || 'You' } }, ...prev])
          } else {
            setComments(prev => prev.map(c =>
              c.id === newRow.parent_id
                ? { ...c, replies: [...(c.replies || []), { ...newRow, users: { full_name: user?.full_name || 'You' } }] }
                : c
            ))
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [active?.id, user?.full_name])

  const sendComment = async () => {
    if (!newComment.trim() || !user?.id) return
    setSending(true)
    const { error } = await supabase.from('course_comments').insert({
      course_id: id,
      module_id: active?.id,
      user_id:   user.id,
      content:   newComment.trim(),
    })
    if (error) toast.error(error.message)
    else setNewComment('')
    setSending(false)
  }

  const sendReply = async (parentId, text) => {
    if (!user?.id) return
    await supabase.from('course_comments').insert({
      course_id: id, module_id: active?.id,
      user_id: user.id, content: text, parent_id: parentId,
    })
  }

  const toggleCommentLike = async (commentId, alreadyLiked) => {
    if (!user?.id) return
    if (alreadyLiked) {
      await supabase.from('course_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
    } else {
      await supabase.from('course_comment_likes').insert({ comment_id: commentId, user_id: user.id })
    }
    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, liked_by_user: !alreadyLiked, likes_count: (c.likes_count || 0) + (alreadyLiked ? -1 : 1) }
      : c
    ))
  }

  const markComplete = async () => {
    if (!user?.id || !active?.id) return
    const existing = progress?.completed_lessons || []
    if (existing.includes(active.id)) return
    const updated = [...existing, active.id]
    const pct = Math.round((updated.length / modules.length) * 100)

    if (progress) {
      await supabase.from('course_progress').update({
        completed_lessons: updated,
        last_lesson_id:    active.id,
        progress_percent:  pct,
        ...(pct === 100 ? { completed_at: new Date().toISOString() } : {}),
      }).eq('course_id', id).eq('user_id', user.id)
    } else {
      await supabase.from('course_progress').insert({
        course_id: id, user_id: user.id,
        completed_lessons: updated, last_lesson_id: active.id, progress_percent: pct,
        ...(pct === 100 ? { completed_at: new Date().toISOString() } : {}),
      })
    }
    setProgress(p => ({ ...(p || {}), completed_lessons: updated, progress_percent: pct }))
    toast.success(pct === 100 ? '🎉 Course complete!' : 'Module marked complete!')

    // Auto-advance to next
    if (activeIndex < modules.length - 1) {
      setTimeout(() => setActiveId(modules[activeIndex + 1].id), 400)
    }
  }

  const submitRating = async () => {
    if (!user?.id || !rating) return
    const data = { course_id: id, user_id: user.id, rating, review: ratingText }
    if (rated) {
      await supabase.from('course_ratings').update(data).eq('course_id', id).eq('user_id', user.id)
    } else {
      await supabase.from('course_ratings').insert(data)
    }
    setRated(true)
    toast.success('Rating saved!')
  }

  const completed = progress?.completed_lessons || []
  const pct = progress?.progress_percent || 0

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="lg:w-72 xl:w-80 border-r border-border bg-card flex-shrink-0 overflow-y-auto lg:h-screen lg:sticky lg:top-0">
        <div className="p-4 border-b border-border">
          <button onClick={() => navigate(`/learn/${id}`)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to course
          </button>
          <h2 className="text-sm font-semibold text-foreground leading-tight">{course?.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completed.length}/{modules.length} completed</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {pct === 100 && course?.has_certificate && (
            <button onClick={() => setShowCert(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-yellow-400/10 text-yellow-400 text-xs font-semibold hover:bg-yellow-400/20 transition-colors border border-yellow-400/20">
              <Award className="w-3.5 h-3.5" /> Get Certificate
            </button>
          )}
        </div>
        <SidebarCurriculum modules={modules} sections={sections} activeId={active?.id}
          completed={completed} onSelect={setActiveId} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Video / Content */}
        <div className="bg-black">
          {active?.type === 'video' && <VideoPlayer url={active.video_url} />}
          {active?.type === 'pdf' && active.attachment_url && (
            <div className="aspect-video">
              <iframe src={active.attachment_url} className="w-full h-full" title={active.title} />
            </div>
          )}
          {active?.type === 'article' && (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-white mb-4">{active.title}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">{active.content || 'No content for this module.'}</div>
            </div>
          )}
          {!active && (
            <div className="aspect-video flex items-center justify-center text-muted-foreground">
              <Play className="w-12 h-12 opacity-30" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
          {/* Module title + actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-foreground">{active?.title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{active?.type || 'video'} · Module {activeIndex + 1} of {modules.length}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => activeIndex > 0 && setActiveId(modules[activeIndex - 1].id)}
                disabled={activeIndex === 0}
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => activeIndex < modules.length - 1 && setActiveId(modules[activeIndex + 1].id)}
                disabled={activeIndex === modules.length - 1}
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={markComplete} disabled={completed.includes(active?.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${completed.includes(active?.id) ? 'bg-green-500/10 text-green-400 cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                <CheckCircle2 className="w-4 h-4" />
                {completed.includes(active?.id) ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
          </div>

          {/* PDF download if available */}
          {active?.type === 'pdf' && active.attachment_url && (
            <a href={active.attachment_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <FileText className="w-4 h-4" /> Download PDF
            </a>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {[
              { id: 'discussion', label: 'Discussion', icon: MessageCircle },
              { id: 'notes',      label: 'My Notes',  icon: StickyNote },
              { id: 'rate',       label: 'Rate',       icon: Star },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Discussion */}
          {tab === 'discussion' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
                  placeholder="Ask a question or leave a comment…"
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={sendComment} disabled={sending || !newComment.trim()}
                  className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to ask!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <Comment key={c.id} c={c} onLike={toggleCommentLike} onReply={sendReply} userId={user?.id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Notes are saved locally per module.</p>
              <textarea value={notes} onChange={e => saveNotes(e.target.value)}
                rows={12} placeholder="Take notes while watching…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}

          {/* Rating */}
          {tab === 'rate' && (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-muted-foreground">How would you rate this course?</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)}
                    className={`p-1 transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-muted'}`}>
                    <Star className={`w-7 h-7 ${n <= rating ? 'fill-yellow-400' : ''}`} />
                  </button>
                ))}
              </div>
              <textarea value={ratingText} onChange={e => setRatingText(e.target.value)}
                rows={3} placeholder="Share your experience (optional)…"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={submitRating} disabled={!rating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
                <Award className="w-4 h-4" />
                {rated ? 'Update Rating' : 'Submit Rating'}
              </button>
            </div>
          )}
        </div>
      </main>

      {showCert && (
        <CertificateModal course={course} user={user} completedAt={progress?.completed_at} onClose={() => setShowCert(false)} />
      )}
    </div>
  )
}
