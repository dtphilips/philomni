import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Check, Lock, Play, FileText, BookOpen, Award, ChevronRight,
  ChevronDown, ArrowLeft, Loader2, X, CheckCircle,
} from 'lucide-react'

function LessonIcon({ type, free_preview, enrolled }) {
  if (!enrolled && !free_preview) return <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  if (type === 'video')  return <Play className="w-4 h-4 text-primary flex-shrink-0" />
  if (type === 'pdf')    return <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
  return <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
}

function CertificateModal({ course, user, onClose }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-xl p-8 shadow-2xl text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Certificate of Completion</p>
        <h2 className="text-2xl font-bold text-foreground mb-1">{user?.full_name ?? 'Student'}</h2>
        <p className="text-muted-foreground text-sm mb-4">has successfully completed</p>
        <h3 className="text-xl font-bold text-primary mb-4">{course?.title}</h3>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground mb-6 flex-wrap">
          <div><p className="text-xs uppercase tracking-wide mb-0.5">Instructor</p><p className="font-semibold text-foreground">{course?.seller_name ?? 'Instructor'}</p></div>
          <div><p className="text-xs uppercase tracking-wide mb-0.5">Completed</p><p className="font-semibold text-foreground">{today}</p></div>
        </div>
        <div className="border-t border-border pt-5 flex gap-3 justify-center">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Download / Print
          </button>
          <button
            onClick={() => { navigator.share?.({ title: `Completed: ${course?.title}`, text: `I just completed ${course?.title} on Philomni!` }).catch(() => {}) }}
            className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Share Achievement
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CourseViewer() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [course, setCourse]             = useState(null)
  const [progress, setProgress]         = useState(null)
  const [enrolled, setEnrolled]         = useState(false)
  const [activeLesson, setActiveLesson] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [loading, setLoading]           = useState(true)
  const [showCertificate, setShowCertificate] = useState(false)
  const [markingComplete, setMarkingComplete]  = useState(false)
  const [notes, setNotes]               = useState('')

  const loadCourse = useCallback(async () => {
    try {
      const { data: courseData } = await supabase
        .from('creator_content')
        .select('*')
        .eq('id', id)
        .single()

      if (!courseData) { setLoading(false); return }
      setCourse(courseData)

      // Expand all sections by default
      const sections = courseData.metadata?.sections ?? []
      const expanded = {}
      sections.forEach((s, i) => { expanded[s.id ?? i] = true })
      setExpandedSections(expanded)

      // Set first lesson as active
      if (sections[0]?.lessons?.[0]) setActiveLesson(sections[0].lessons[0])

      // Check enrollment via orders
      if (user?.id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, status')
          .eq('listing_id', id)
          .eq('buyer_id', user.id)
          .in('status', ['completed', 'delivered', 'in_progress'])
          .limit(1)
          .maybeSingle()
        setEnrolled(!!orderData)

        // Load progress
        const { data: prog } = await supabase
          .from('course_progress')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
        setProgress(prog)

        // Load notes from localStorage
        const savedNotes = localStorage.getItem(`course-notes-${id}`) ?? ''
        setNotes(savedNotes)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [id, user?.id])

  useEffect(() => { loadCourse() }, [loadCourse])

  const sections = course?.metadata?.sections ?? []
  const allLessons = sections.flatMap(s => s.lessons ?? [])
  const completedLessons = progress?.completed_lessons ?? []
  const totalLessons = allLessons.length
  const completedCount = completedLessons.length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const isLessonCompleted = (lessonId) => completedLessons.includes(lessonId)

  const getNextLesson = useCallback(() => {
    if (!activeLesson) return null
    let found = false
    for (const sec of sections) {
      for (const lesson of (sec.lessons ?? [])) {
        if (found) return lesson
        if (lesson.id === activeLesson.id) found = true
      }
    }
    return null
  }, [activeLesson, sections])

  const markComplete = async () => {
    if (!activeLesson || !user?.id || !enrolled) return
    setMarkingComplete(true)
    try {
      const newCompleted = [...new Set([...completedLessons, activeLesson.id])]
      const pct = totalLessons > 0 ? Math.round((newCompleted.length / totalLessons) * 100) : 0

      if (progress) {
        await supabase.from('course_progress').update({
          completed_lessons: newCompleted,
          progress_percent: pct,
          last_lesson_id: activeLesson.id,
        }).eq('id', progress.id)
        setProgress(p => ({ ...p, completed_lessons: newCompleted, progress_percent: pct }))
      } else {
        const { data } = await supabase.from('course_progress').insert({
          course_id: id,
          user_id: user.id,
          completed_lessons: newCompleted,
          progress_percent: pct,
          last_lesson_id: activeLesson.id,
        }).select().single()
        setProgress(data)
      }

      if (pct === 100) setShowCertificate(true)
    } catch (e) { console.error(e) }
    setMarkingComplete(false)
  }

  const toggleSection = (sId) => setExpandedSections(p => ({ ...p, [sId]: !p[sId] }))

  const canAccessLesson = (lesson) => enrolled || lesson.free_preview

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Course not found.</p>
        <button onClick={() => navigate('/marketplace')} className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">Back to Marketplace</button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Course header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground line-clamp-2">{course.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{course.seller_name}</p>
            {enrolled && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{completedCount}/{totalLessons} lessons</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Curriculum */}
          <div className="flex-1 overflow-y-auto p-2">
            {sections.map((sec, sIdx) => (
              <div key={sec.id ?? sIdx} className="mb-2">
                <button
                  onClick={() => toggleSection(sec.id ?? sIdx)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left">
                  <p className="text-xs font-semibold text-foreground">{sec.title}</p>
                  {expandedSections[sec.id ?? sIdx]
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  }
                </button>
                {expandedSections[sec.id ?? sIdx] && (
                  <div className="ml-2 space-y-0.5">
                    {(sec.lessons ?? []).map((lesson, lIdx) => {
                      const accessible  = canAccessLesson(lesson)
                      const completed   = isLessonCompleted(lesson.id)
                      const isActive    = activeLesson?.id === lesson.id
                      return (
                        <button
                          key={lesson.id ?? lIdx}
                          onClick={() => accessible && setActiveLesson(lesson)}
                          disabled={!accessible}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                            isActive ? 'bg-primary/15 text-primary' :
                            accessible ? 'hover:bg-muted text-foreground' :
                            'text-muted-foreground cursor-not-allowed opacity-60'
                          }`}>
                          {completed
                            ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            : <LessonIcon type={lesson.type} free_preview={lesson.free_preview} enrolled={enrolled} />
                          }
                          <span className="flex-1 line-clamp-1">{lesson.title || `Lesson ${lIdx + 1}`}</span>
                          {lesson.free_preview && !enrolled && (
                            <span className="text-xs text-emerald-400 flex-shrink-0">Free</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Certificate button */}
          {enrolled && progressPct === 100 && (
            <div className="p-3 border-t border-border">
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold hover:bg-amber-500/30 transition-colors">
                <Award className="w-4 h-4" /> View Certificate
              </button>
            </div>
          )}
        </aside>

        {/* ── MAIN PLAYER AREA ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {activeLesson ? (
            <>
              {/* Lesson player */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {!canAccessLesson(activeLesson) ? (
                  <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-4">
                    <Lock className="w-12 h-12 text-muted-foreground" />
                    <p className="text-foreground font-semibold">Enroll to Access This Lesson</p>
                    <button onClick={() => navigate('/marketplace')} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                      Enroll Now
                    </button>
                  </div>
                ) : activeLesson.type === 'video' ? (
                  <div className="aspect-video bg-black">
                    {activeLesson.video_url ? (
                      <video
                        key={activeLesson.id}
                        src={activeLesson.video_url}
                        controls
                        className="w-full h-full"
                        onEnded={() => { if (!isLessonCompleted(activeLesson.id)) markComplete() }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Play className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                  </div>
                ) : activeLesson.type === 'pdf' && activeLesson.video_url ? (
                  <div className="aspect-video">
                    <iframe src={activeLesson.video_url} className="w-full h-full border-0" title={activeLesson.title} />
                  </div>
                ) : (
                  <div className="p-6 prose prose-sm max-w-none">
                    <p className="text-foreground">{activeLesson.content ?? 'Text content coming soon.'}</p>
                  </div>
                )}

                <div className="p-4 border-t border-border">
                  <h3 className="text-base font-bold text-foreground mb-3">{activeLesson.title || 'Untitled Lesson'}</h3>
                  <div className="flex gap-3 flex-wrap">
                    {enrolled && !isLessonCompleted(activeLesson.id) && (
                      <button
                        onClick={markComplete}
                        disabled={markingComplete || !canAccessLesson(activeLesson)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold hover:bg-emerald-600/30 disabled:opacity-50 transition-colors">
                        {markingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Mark as Complete
                      </button>
                    )}
                    {isLessonCompleted(activeLesson.id) && (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}
                    {getNextLesson() && enrolled && (
                      <button
                        onClick={() => setActiveLesson(getNextLesson())}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
                        Next Lesson <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {enrolled && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">📝 My Notes</p>
                  <textarea
                    value={notes}
                    onChange={e => {
                      setNotes(e.target.value)
                      localStorage.setItem(`course-notes-${id}`, e.target.value)
                    }}
                    rows={4}
                    placeholder="Take notes as you learn..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Notes are saved automatically to your browser.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              {course.cover && (
                <img src={course.cover} alt={course.title} className="w-full h-48 object-cover rounded-xl mb-5" />
              )}
              <h2 className="text-xl font-bold text-foreground mb-2">{course.title}</h2>
              <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
              {!enrolled ? (
                <button onClick={() => navigate('/marketplace')} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                  Enroll to Access Full Course
                </button>
              ) : (
                <p className="text-muted-foreground text-sm">Select a lesson from the sidebar to begin.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal course={course} user={user} onClose={() => setShowCertificate(false)} />
      )}
    </div>
  )
}
