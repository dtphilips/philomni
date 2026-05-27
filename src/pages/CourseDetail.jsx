import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { addToWallet } from '../lib/wallet'
import { toast } from 'sonner'
import {
  GraduationCap, Star, Users, Clock, Lock, Play, CheckCircle2,
  Loader2, ArrowLeft, BookOpen, Award,
} from 'lucide-react'

export default function CourseDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { plan, isAdmin } = useSubscription()
  const navigate = useNavigate()

  const [course,     setCourse]     = useState(null)
  const [modules,    setModules]    = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [enrolling,  setEnrolling]  = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: c } = await supabase
        .from('courses')
        .select('*, users!courses_creator_id_fkey(id,full_name,avatar_url,bio)')
        .eq('id', courseId)
        .single()
      setCourse(c)

      const { data: m } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position')
      setModules(m || [])

      if (user?.id) {
        const { data: e } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single()
        setEnrollment(e || null)
      }
      setLoading(false)
    }
    fetch()
  }, [courseId, user?.id])

  const handleEnroll = async () => {
    if (!user?.id) return toast.error('Sign in to enroll')
    const isFree = !course.price || course.price === 0
    if (!isFree && plan === 'free' && !isAdmin) {
      return toast.error('Upgrade to Pro to enroll in paid courses')
    }

    setEnrolling(true)
    try {
      // Insert enrollment
      const { error } = await supabase.from('course_enrollments').insert({
        user_id: user.id,
        course_id: courseId,
        paid_amount: isFree ? 0 : course.price,
      })
      if (error) throw error

      // Update course enrollment count
      await supabase.from('courses').update({
        total_enrolled: (course.total_enrolled || 0) + 1,
        total_revenue: (course.total_revenue || 0) + (isFree ? 0 : course.price),
      }).eq('id', courseId)

      // Add 80% to creator wallet
      if (!isFree && course.price > 0) {
        const creatorShare = course.price * 0.80
        await addToWallet(
          course.creator_id,
          creatorShare,
          'course_sale',
          `Course sale: ${course.title}`,
          courseId
        )
      }

      toast.success(isFree ? '🎉 Enrolled successfully!' : '🎉 Enrolled! Starting your learning journey.')
      setEnrollment({ user_id: user.id, course_id: courseId, progress: 0 })
      navigate(`/learn/${courseId}/watch`)
    } catch (err) {
      toast.error(err.message || 'Enrollment failed')
    }
    setEnrolling(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  if (!course) return (
    <div className="text-center py-20 text-muted-foreground">Course not found</div>
  )

  const isFree = !course.price || course.price === 0

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <Link to="/learn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course header */}
          <div>
            {course.thumbnail_url && (
              <div className="aspect-video rounded-xl overflow-hidden mb-4">
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs text-primary mb-1">{course.category}</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{(course.rating || 0).toFixed(1)} ({course.rating_count || 0})</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.total_enrolled || 0} students</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{modules.length} modules</span>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">About this course</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Modules list */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Course Content</h2>
            <div className="space-y-2">
              {modules.map((mod, i) => {
                const isLocked = !mod.is_free_preview && !enrollment
                return (
                  <div key={mod.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isLocked ? 'border-border bg-card/50 opacity-70' : 'border-border bg-card'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}>
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{mod.title}</p>
                      {mod.duration > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{mod.duration} min</p>
                      )}
                    </div>
                    {mod.is_free_preview && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Preview</span>
                    )}
                    {enrollment && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar CTA */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-6">
            {/* Creator */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                {course.users?.avatar_url
                  ? <img src={course.users.avatar_url} className="w-full h-full object-cover" alt="" />
                  : <span className="text-sm font-bold text-primary">{course.users?.full_name?.[0]}</span>
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{course.users?.full_name}</p>
                <p className="text-xs text-muted-foreground">Instructor</p>
              </div>
            </div>

            <p className={`text-2xl font-bold mb-1 ${isFree ? 'text-green-400' : 'text-foreground'}`}>
              {isFree ? 'Free' : `$${Number(course.price).toFixed(2)}`}
            </p>
            {!isFree && (
              <p className="text-xs text-muted-foreground mb-4">80% goes to the creator</p>
            )}

            {enrollment ? (
              <Link to={`/learn/${courseId}/watch`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Play className="w-4 h-4" /> Continue Learning
              </Link>
            ) : (
              <button onClick={handleEnroll} disabled={enrolling}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {isFree ? 'Enroll Free' : 'Enroll Now'}
              </button>
            )}

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" />{modules.length} modules</div>
              <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5" />Certificate on completion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
