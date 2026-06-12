import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, Play, FileText, AlignLeft, Clock, Users, Star,
  Heart, Award, BookOpen, ChevronRight, Loader2,
  Video, CheckCircle2, Lock, BarChart2,
} from 'lucide-react'

function typeIcon(type) {
  if (type === 'pdf')     return <FileText className="w-3.5 h-3.5 text-orange-400" />
  if (type === 'article') return <AlignLeft className="w-3.5 h-3.5 text-emerald-400" />
  return <Video className="w-3.5 h-3.5 text-blue-400" />
}

export default function CourseDetail() {
  const { courseId: id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course,    setCourse]    = useState(null)
  const [modules,   setModules]   = useState([])
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [enrolled,  setEnrolled]  = useState(false)
  const [liked,     setLiked]     = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: mods }, { data: revs }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('course_modules').select('*').eq('course_id', id).order('order_index'),
        supabase.from('course_ratings').select('*, users(full_name, avatar_url)').eq('course_id', id).order('created_at', { ascending: false }).limit(20),
      ])
      setCourse(c)
      setModules(mods || [])
      setReviews(revs || [])
      setLikeCount(c?.likes_count || 0)

      if (user?.id) {
        const [{ data: enroll }, { data: like }] = await Promise.all([
          supabase.from('course_enrollments').select('id').eq('course_id', id).eq('user_id', user.id).maybeSingle(),
          supabase.from('course_likes').select('id').eq('course_id', id).eq('user_id', user.id).maybeSingle(),
        ])
        setEnrolled(!!enroll)
        setLiked(!!like)
      }
    } finally { setLoading(false) }
  }, [id, user?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase.channel(`course-${id}-enroll`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_enrollments', filter: `course_id=eq.${id}` }, () => {
        supabase.from('courses').select('enrollment_count').eq('id', id).single().then(({ data }) => {
          if (data) setCourse(prev => prev ? { ...prev, enrollment_count: data.enrollment_count } : prev)
        })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const handleEnroll = async () => {
    if (!user?.id) return navigate('/login')
    if (enrolled) return navigate(`/learn/${id}/watch`)
    setEnrolling(true)
    try {
      if (course?.price > 0) {
        toast.info('Payment flow coming soon!')
        setEnrolling(false); return
      }
      const { error } = await supabase.from('course_enrollments').insert({ course_id: id, user_id: user.id })
      if (error) throw error
      setEnrolled(true)
      toast.success('Enrolled! Start learning.')
      navigate(`/learn/${id}/watch`)
    } catch (err) {
      toast.error(err.message || 'Enrollment failed')
    }
    setEnrolling(false)
  }

  const handleLike = async () => {
    if (!user?.id) return navigate('/login')
    if (liked) {
      await supabase.from('course_likes').delete().eq('course_id', id).eq('user_id', user.id)
      const newCount = Math.max(0, likeCount - 1)
      setLiked(false); setLikeCount(newCount)
      await supabase.from('courses').update({ likes_count: newCount }).eq('id', id)
    } else {
      await supabase.from('course_likes').insert({ course_id: id, user_id: user.id })
      const newCount = likeCount + 1
      setLiked(true); setLikeCount(newCount)
      await supabase.from('courses').update({ likes_count: newCount }).eq('id', id)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )
  if (!course) return (
    <div className="max-w-2xl mx-auto py-20 text-center text-muted-foreground">
      Course not found. <Link to="/learn" className="text-primary hover:underline">Back to Learn</Link>
    </div>
  )

  const totalDuration = modules.reduce((s, m) => s + (m.duration_minutes || 0), 0)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <button onClick={() => navigate('/learn')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      {/* Hero */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {course.thumbnail_url ? (
          <div className="aspect-video relative">
            <img src={course.thumbnail_url} className="w-full h-full object-cover" alt={course.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={() => navigate(`/learn/${id}/watch`)}
              className="absolute inset-0 flex items-center justify-center group">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 text-black fill-black ml-0.5" />
              </div>
            </button>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/30" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{course.title}</h1>
              {course.subtitle && <p className="text-muted-foreground mt-1">{course.subtitle}</p>}
            </div>
            <button onClick={handleLike}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${liked ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground hover:text-red-400'}`}>
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.enrollment_count || 0} enrolled</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{modules.length} modules</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{totalDuration}m total</span>
            {avgRating && <span className="flex items-center gap-1 text-yellow-400 font-medium"><Star className="w-4 h-4 fill-yellow-400" />{avgRating}</span>}
            <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" />{course.level || 'All Levels'}</span>
            {course.has_certificate && <span className="flex items-center gap-1.5 text-yellow-400"><Award className="w-4 h-4" />Certificate</span>}
          </div>

          <div className="flex items-center gap-2">
            {course.instructor_avatar
              ? <img src={course.instructor_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
              : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">{(course.instructor_name || 'I')[0]}</div>}
            <div>
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="text-sm font-medium text-foreground">{course.instructor_name || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleEnroll} disabled={enrolling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : enrolled ? <Play className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {enrolled ? 'Continue Learning' : course.price > 0 ? `Enroll — $${Number(course.price).toFixed(2)}` : 'Enroll Free'}
            </button>
          </div>

          {(course.skills_gained?.length > 0 || course.requirements?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              {course.skills_gained?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">What you'll learn</p>
                  <ul className="space-y-1">
                    {course.skills_gained.map(s => (
                      <li key={s} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {course.requirements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Requirements</p>
                  <ul className="space-y-1">
                    {course.requirements.map(r => (
                      <li key={r} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {course.description && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">About this course</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{course.description}</p>
        </div>
      )}

      {/* Module list */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Course Content</h2>
        <div className="space-y-2">
          {modules.map((mod, idx) => (
            <div key={mod.id}
              onClick={() => { if (mod.is_preview || enrolled) navigate(`/learn/${id}/watch?module=${mod.id}`) }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${(mod.is_preview || enrolled) ? 'border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer' : 'border-transparent bg-muted/30 cursor-default'}`}>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-mono flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{mod.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {typeIcon(mod.type)}
                  <span className="capitalize">{mod.type || 'video'}</span>
                  {mod.duration_minutes > 0 && <><span>·</span><span>{mod.duration_minutes}m</span></>}
                </div>
              </div>
              {mod.is_preview ? (
                <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 flex-shrink-0">Preview</span>
              ) : !enrolled ? (
                <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-foreground">Reviews</h2>
            {avgRating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="text-sm font-semibold">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {reviews.map(rev => (
              <div key={rev.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0 overflow-hidden">
                  {rev.users?.avatar_url
                    ? <img src={rev.users.avatar_url} className="w-full h-full object-cover" alt="" />
                    : (rev.users?.full_name || 'U')[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{rev.users?.full_name || 'Student'}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-3 h-3 ${n <= (rev.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  {rev.review && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rev.review}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
