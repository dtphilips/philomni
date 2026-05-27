import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  CheckCircle2, Circle, Play, Award, Star, ArrowLeft,
  Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react'

export default function CourseWatch() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course,      setCourse]      = useState(null)
  const [modules,     setModules]     = useState([])
  const [progress,    setProgress]    = useState({}) // { moduleId: true/false }
  const [enrollment,  setEnrollment]  = useState(null)
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [showReview,  setShowReview]  = useState(false)
  const [rating,      setRating]      = useState(0)
  const [reviewText,  setReviewText]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) { navigate('/login'); return }
      setLoading(true)

      const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single()
      const { data: m } = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('position')
      const { data: e } = await supabase.from('course_enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).single()

      if (!e) { navigate(`/learn/${courseId}`); return }

      const { data: prog } = await supabase.from('course_progress').select('module_id').eq('user_id', user.id)
      const progMap = {}
      prog?.forEach(p => { progMap[p.module_id] = true })

      setCourse(c)
      setModules(m || [])
      setEnrollment(e)
      setProgress(progMap)
      setLoading(false)
    }
    fetch()
  }, [courseId, user?.id])

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalModules   = modules.length
  const progressPct    = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0
  const allCompleted   = completedCount >= totalModules && totalModules > 0
  const activeModule   = modules[activeIdx]

  const markComplete = async (moduleId) => {
    if (progress[moduleId]) return
    await supabase.from('course_progress').upsert({ user_id: user.id, module_id: moduleId, completed: true })
    const newProg = { ...progress, [moduleId]: true }
    setProgress(newProg)

    // Update enrollment progress
    const newPct = Math.round((Object.values(newProg).filter(Boolean).length / totalModules) * 100)
    await supabase.from('course_enrollments').update({
      progress: newPct,
      completed: newPct >= 100,
    }).eq('user_id', user.id).eq('course_id', courseId)

    if (newPct >= 100) {
      toast.success('🎓 Congratulations! You completed the course!')
      setShowReview(true)
    } else {
      toast.success('Module marked complete!')
    }
  }

  const submitReview = async () => {
    if (!rating) return toast.error('Please select a rating')
    setSubmitting(true)
    try {
      await supabase.from('course_reviews').upsert({
        user_id: user.id, course_id: courseId, rating, review: reviewText
      })
      // Update course avg rating
      const { data: reviews } = await supabase.from('course_reviews').select('rating').eq('course_id', courseId)
      if (reviews?.length) {
        const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        await supabase.from('courses').update({ rating: avg, rating_count: reviews.length }).eq('id', courseId)
      }
      toast.success('Thank you for your review!')
      setShowReview(false)
    } catch { toast.error('Failed to submit review') }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/learn/${courseId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{course?.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-48">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progressPct}% complete</span>
          </div>
        </div>
        {allCompleted && (
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-medium">
            <Award className="w-3.5 h-3.5" /> Certificate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            {activeModule?.video_url ? (
              <iframe
                src={activeModule.video_url.includes('youtube') || activeModule.video_url.includes('youtu.be')
                  ? activeModule.video_url.replace('watch?v=', 'embed/')
                  : activeModule.video_url}
                className="w-full h-full"
                allowFullScreen
                title={activeModule.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                <Play className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Module title + complete button */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Module {activeIdx + 1} of {totalModules}</p>
              <h2 className="text-lg font-semibold text-foreground">{activeModule?.title}</h2>
            </div>
            <button
              onClick={() => activeModule && markComplete(activeModule.id)}
              disabled={progress[activeModule?.id]}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                progress[activeModule?.id]
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {progress[activeModule?.id] ? <><CheckCircle2 className="w-4 h-4" /> Done</> : 'Mark Complete'}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(totalModules - 1, i + 1))}
              disabled={activeIdx >= totalModules - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Module sidebar */}
        <div className="bg-card border border-border rounded-xl overflow-hidden h-fit lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Course Modules</p>
            <p className="text-xs text-muted-foreground">{completedCount}/{totalModules} completed</p>
          </div>
          <div className="divide-y divide-border">
            {modules.map((mod, i) => (
              <button
                key={mod.id}
                onClick={() => setActiveIdx(i)}
                className={`w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${activeIdx === i ? 'bg-primary/10' : ''}`}
              >
                {progress[mod.id]
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <Circle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${activeIdx === i ? 'text-primary' : 'text-muted-foreground/40'}`} />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug ${activeIdx === i ? 'text-primary' : 'text-foreground'}`}>{mod.title}</p>
                  {mod.duration > 0 && <p className="text-[10px] text-muted-foreground">{mod.duration} min</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review / Certificate modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReview(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-4">
              <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <h3 className="font-bold text-foreground text-lg">Course Completed! 🎉</h3>
              <p className="text-sm text-muted-foreground">Share your thoughts about this course</p>
            </div>
            <div className="flex justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-7 h-7 transition-colors ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Write a review (optional)…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReview(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Skip</button>
              <button onClick={submitReview} disabled={submitting || !rating}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
