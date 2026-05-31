import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchCourses } from '../lib/queries'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import {
  GraduationCap, Search, Star, Users, BookOpen, Loader2,
  Lock, Play, DollarSign, Filter,
} from 'lucide-react'

const CATEGORIES = ['All', 'Business', 'Design', 'Marketing', 'Development', 'Finance', 'Music', 'Photography', 'Writing']

function CourseCard({ course, enrollment }) {
  const isFree = !course.price || course.price === 0
  const isEnrolled = !!enrollment

  return (
    <Link to={`/learn/${course.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group flex flex-col">
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-muted-foreground/40" /></div>
        }
        {isFree && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
        )}
        {isEnrolled && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Enrolled</span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground mb-1">{course.category}</p>
        <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 flex-1">{course.title}</h3>

        {/* Creator */}
        <p className="text-xs text-muted-foreground mb-2">{course.users?.full_name || 'Unknown Creator'}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-foreground">{(course.rating || 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({course.rating_count || 0})</span>
          <span className="mx-1 text-muted-foreground/40">·</span>
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{course.total_enrolled || 0}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${isFree ? 'text-green-400' : 'text-foreground'}`}>
            {isFree ? 'Free' : `$${Number(course.price).toFixed(2)}`}
          </span>
          <span className="text-xs text-primary flex items-center gap-1">
            <Play className="w-3 h-3" /> {isEnrolled ? 'Continue' : 'Enroll'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Learn() {
  const { user } = useAuth()
  const { plan } = useSubscription()
  const [courses,     setCourses]     = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('All')

  // 5-second safety net
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Uses centralized fetchCourses from src/lib/queries.js; filters client-side
  useEffect(() => {
    setLoading(true)
    fetchCourses(100)
      .then(data => {
        let result = data
        if (category !== 'All') result = result.filter(c => c.category === category)
        if (search) result = result.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
        setCourses(result)
      })
      .finally(() => setLoading(false))

    // User enrollments (user-specific, kept inline)
    if (user?.id) {
      supabase.from('course_enrollments').select('course_id, progress, completed').eq('user_id', user.id)
        .then(({ data: enr }) => {
          const map = {}
          enr?.forEach(e => { map[e.course_id] = e })
          setEnrollments(map)
        })
    }
  }, [user?.id, search, category]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Learn</h1>
        </div>
        <Link to="/teach"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          🎓 Teach a Course
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Enrolled section */}
      {Object.keys(enrollments).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Continue Learning</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.filter(c => enrollments[c.id]).map(c => (
              <CourseCard key={c.id} course={c} enrollment={enrollments[c.id]} />
            ))}
          </div>
        </div>
      )}

      {/* All courses */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {category === 'All' ? 'All Courses' : category} · {courses.length}
        </h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No courses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <CourseCard key={c.id} course={c} enrollment={enrollments[c.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
