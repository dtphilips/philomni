import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { addToWallet } from '../lib/wallet'
import { toast } from 'sonner'
import {
  GraduationCap, Plus, BookOpen, Users, DollarSign, Edit3,
  Loader2, Eye, EyeOff, Trash2, X, GripVertical, Video,
  FileText, AlignLeft, Upload, Link2, Star, Award, ChevronDown,
  CheckCircle2, ImageIcon,
} from 'lucide-react'

const CATEGORY_SUGGESTIONS = [
  'Business', 'Marketing', 'Design', 'Development', 'Finance',
  'Music', 'Photography', 'Writing', 'Health & Wellness', 'Fitness',
  'Career', 'Parenting', 'Cooking', 'Languages', 'Art & Creativity',
  'Tech & AI', 'Data Science', 'Social Media', 'Investing', 'Real Estate', 'Other',
]
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
const MODULE_TYPES = [
  { value: 'video',   label: 'Video',   icon: Video,    color: 'text-blue-400' },
  { value: 'pdf',     label: 'PDF',     icon: FileText, color: 'text-orange-400' },
  { value: 'article', label: 'Article', icon: AlignLeft, color: 'text-emerald-400' },
]

async function uploadToStorage(file, folder) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl
}

function TagInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        <button type="button" onClick={add}
          className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground">
          Add
        </button>
      </div>
    </div>
  )
}

function ModuleRow({ mod, idx, onChange, onRemove }) {
  const [videoTab, setVideoTab] = useState('url') // 'url' | 'upload'
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const folder = mod.type === 'pdf' ? 'course-pdfs' : 'course-videos'
      const url = await uploadToStorage(file, folder)
      if (mod.type === 'pdf') onChange(idx, 'attachment_url', url)
      else onChange(idx, 'video_url', url)
      toast.success('File uploaded!')
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  const typeInfo = MODULE_TYPES.find(t => t.value === (mod.type || 'video'))

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 flex-shrink-0 cursor-grab" />
        <div className="flex-1 space-y-3">
          {/* Title + type row */}
          <div className="flex items-center gap-2">
            <input
              value={mod.title}
              onChange={e => onChange(idx, 'title', e.target.value)}
              placeholder={`Module ${idx + 1} title`}
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {/* Type selector */}
            <div className="flex gap-1">
              {MODULE_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => onChange(idx, 'type', t.value)}
                  title={t.label}
                  className={`p-1.5 rounded-lg transition-colors ${(mod.type || 'video') === t.value ? 'bg-primary/15 ' + t.color : 'text-muted-foreground hover:bg-muted'}`}>
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Content based on type */}
          {(mod.type || 'video') === 'video' && (
            <div className="space-y-2">
              <div className="flex gap-1 border-b border-border pb-1">
                {['url', 'upload'].map(t => (
                  <button key={t} type="button" onClick={() => setVideoTab(t)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors capitalize ${videoTab === t ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {t === 'url' ? 'Paste URL' : 'Upload File'}
                  </button>
                ))}
              </div>
              {videoTab === 'url' ? (
                <input value={mod.video_url || ''} onChange={e => onChange(idx, 'video_url', e.target.value)}
                  placeholder="YouTube, Vimeo, or direct video URL…"
                  className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
                  {mod.video_url ? (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="truncate flex-1">Video uploaded</span>
                      <button type="button" onClick={() => onChange(idx, 'video_url', '')} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-colors">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading ? 'Uploading…' : 'Click to upload video'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {mod.type === 'pdf' && (
            <div>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleUpload} />
              {mod.attachment_url ? (
                <div className="flex items-center gap-2 text-xs text-orange-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate flex-1">PDF uploaded</span>
                  <a href={mod.attachment_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    <Link2 className="w-3 h-3" />
                  </a>
                  <button type="button" onClick={() => onChange(idx, 'attachment_url', '')} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-colors">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : 'Click to upload PDF'}
                </button>
              )}
            </div>
          )}

          {mod.type === 'article' && (
            <textarea
              value={mod.content || ''}
              onChange={e => onChange(idx, 'content', e.target.value)}
              rows={4}
              placeholder="Write your article content here…"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}

          {/* Duration + free preview */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input type="number" value={mod.duration_minutes || ''}
                onChange={e => onChange(idx, 'duration_minutes', e.target.value)}
                placeholder="0"
                className="w-16 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:outline-none text-center"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={!!mod.is_preview}
                onChange={e => onChange(idx, 'is_preview', e.target.checked)}
                className="w-3.5 h-3.5 rounded" />
              Free preview
            </label>
          </div>
        </div>

        <button type="button" onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-destructive mt-1 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function Teach() {
  const { user } = useAuth()
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('my-courses')
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState(null)

  // Category combobox
  const [catQuery, setCatQuery] = useState('')
  const [catOpen,  setCatOpen]  = useState(false)

  // Thumbnail upload
  const [thumbUploading, setThumbUploading] = useState(false)
  const thumbRef = useRef()

  const emptyForm = {
    title: '', subtitle: '', description: '', category: '', level: 'Beginner',
    price: '', thumbnail_url: '', promo_video_url: '',
    skills_gained: [], requirements: [], has_certificate: true,
    modules: [],
  }
  const [form, setForm] = useState(emptyForm)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); clearTimeout(timeout); return }
      try {
        const { data } = await supabase.from('courses').select('*')
          .eq('instructor_id', session.user.id)
          .order('created_at', { ascending: false })
        setCourses(data || [])
      } finally { setLoading(false); clearTimeout(timeout) }
    }
    init()
    return () => clearTimeout(timeout)
  }, [])

  const addModule = () => set('modules', [...form.modules, {
    title: '', type: 'video', video_url: '', attachment_url: '', content: '',
    duration_minutes: '', is_preview: false,
  }])

  const updateModule = (idx, key, val) => setForm(f => {
    const mods = [...f.modules]
    mods[idx] = { ...mods[idx], [key]: val }
    return { ...f, modules: mods }
  })

  const removeModule = (idx) => set('modules', form.modules.filter((_, i) => i !== idx))

  const uploadThumbnail = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbUploading(true)
    try {
      const url = await uploadToStorage(file, 'course-thumbnails')
      set('thumbnail_url', url)
    } catch (err) { toast.error('Thumbnail upload failed') }
    setThumbUploading(false)
  }

  const handleSave = async (status = 'draft') => {
    if (!form.title.trim()) return toast.error('Course title is required')
    if (form.modules.length === 0) return toast.error('Add at least one module')
    if (!user?.id) return toast.error('Not signed in')
    setSaving(true)

    try {
      const courseData = {
        instructor_id:   user.id,
        instructor_name: user.full_name || user.email?.split('@')[0] || 'Instructor',
        instructor_avatar: user.avatar_url || null,
        title:           form.title.trim(),
        subtitle:        form.subtitle.trim(),
        description:     form.description,
        category:        form.category || 'Other',
        level:           form.level,
        price:           parseFloat(form.price) || 0,
        thumbnail_url:   form.thumbnail_url,
        promo_video_url: form.promo_video_url,
        skills_gained:   form.skills_gained,
        requirements:    form.requirements,
        has_certificate: form.has_certificate,
        total_lessons:   form.modules.length,
        total_duration:  form.modules.reduce((s, m) => s + (parseInt(m.duration_minutes) || 0), 0),
        status,
      }

      let courseId = editId
      if (editId) {
        await supabase.from('courses').update(courseData).eq('id', editId)
        await supabase.from('course_modules').delete().eq('course_id', editId)
      } else {
        const { data, error } = await supabase.from('courses').insert(courseData).select().single()
        if (error) throw error
        courseId = data.id
      }

      const modulesData = form.modules.map((m, i) => ({
        course_id:        courseId,
        title:            m.title || `Module ${i + 1}`,
        type:             m.type || 'video',
        video_url:        m.video_url || null,
        attachment_url:   m.attachment_url || null,
        content:          m.content || null,
        duration_minutes: parseInt(m.duration_minutes) || 0,
        order_index:      i,
        is_preview:       !!m.is_preview,
      }))
      if (modulesData.length > 0) await supabase.from('course_modules').insert(modulesData)

      toast.success(status === 'published' ? '🎉 Course published!' : 'Saved as draft!')
      setForm(emptyForm); setCatQuery(''); setEditId(null); setTab('my-courses')

      const { data: updated } = await supabase.from('courses').select('*')
        .eq('instructor_id', user.id).order('created_at', { ascending: false })
      setCourses(updated || [])
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const toggleStatus = async (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await supabase.from('courses').update({ status: newStatus }).eq('id', course.id)
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: newStatus } : c))
    toast.success(newStatus === 'published' ? 'Course published!' : 'Course set to draft')
  }

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course and all its modules?')) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    toast.success('Course deleted')
  }

  const startEdit = async (course) => {
    const { data: mods } = await supabase.from('course_modules').select('*')
      .eq('course_id', course.id).order('order_index')
    setCatQuery(course.category || '')
    setForm({
      title:           course.title || '',
      subtitle:        course.subtitle || '',
      description:     course.description || '',
      category:        course.category || '',
      level:           course.level || 'Beginner',
      price:           course.price?.toString() || '',
      thumbnail_url:   course.thumbnail_url || '',
      promo_video_url: course.promo_video_url || '',
      skills_gained:   course.skills_gained || [],
      requirements:    course.requirements || [],
      has_certificate: course.has_certificate !== false,
      modules: (mods || []).map(m => ({
        title: m.title, type: m.type || 'video',
        video_url: m.video_url || '', attachment_url: m.attachment_url || '',
        content: m.content || '', duration_minutes: m.duration_minutes?.toString() || '',
        is_preview: !!m.is_preview,
      })),
    })
    setEditId(course.id)
    setTab('create')
  }

  const totalStudents = courses.reduce((s, c) => s + (c.enrollment_count || 0), 0)
  const avgRating = courses.length
    ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.filter(c => c.rating).length || 0).toFixed(1)
    : '—'

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Teach</h1>
        </div>
        <Link to="/learn" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          View marketplace →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Courses',   value: courses.length,       icon: BookOpen,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
          { label: 'Students',  value: totalStudents,        icon: Users,         color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Published', value: courses.filter(c => c.status === 'published').length, icon: Eye, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Avg Rating',value: avgRating,            icon: Star,          color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['my-courses', 'My Courses'], ['create', editId ? 'Edit Course' : 'Create Course']].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'create' && !editId) { setForm(emptyForm); setCatQuery('') } }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* MY COURSES */}
      {tab === 'my-courses' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No courses yet</p>
            <button onClick={() => setTab('create')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mx-auto">
              <Plus className="w-4 h-4" /> Create Your First Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {course.thumbnail_url
                      ? <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="" />
                      : <BookOpen className="w-5 h-5 text-muted-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${course.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {course.status === 'published' ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollment_count || 0}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.total_lessons || 0} modules</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{(course.rating || 0).toFixed(1)}</span>
                      <span className={`font-semibold ${(course.price || 0) === 0 ? 'text-green-400' : 'text-foreground'}`}>
                        {(course.price || 0) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleStatus(course)}
                      title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                      className={`p-1.5 rounded-lg transition-colors ${course.status === 'published' ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted'}`}>
                      {course.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(course)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCourse(course.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => { setTab('create'); setEditId(null); setForm(emptyForm); setCatQuery('') }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Plus className="w-4 h-4" /> Create New Course
            </button>
          </div>
        )
      )}

      {/* CREATE / EDIT */}
      {tab === 'create' && (
        <div className="space-y-5">
          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Cover Image</label>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => thumbRef.current?.click()}>
              {form.thumbnail_url ? (
                <>
                  <img src={form.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-medium">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  {thumbUploading ? <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> : <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />}
                  <p className="text-sm">{thumbUploading ? 'Uploading…' : 'Click to upload cover image'}</p>
                  <p className="text-xs opacity-60 mt-1">16:9 recommended · JPG, PNG, WebP</p>
                </div>
              )}
            </div>
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={uploadThumbnail} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Course Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. The Complete Social Media Marketing Guide"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subtitle</label>
              <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
                placeholder="Short summary shown on the course card"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} placeholder="What will students learn? Who is this for?"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            {/* Category combobox */}
            <div className="relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
              <input value={catQuery}
                onChange={e => { setCatQuery(e.target.value); set('category', e.target.value); setCatOpen(true) }}
                onFocus={() => setCatOpen(true)}
                onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                placeholder="Business, Design, Music…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              {catOpen && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-44 overflow-y-auto">
                  {CATEGORY_SUGGESTIONS.filter(c => c.toLowerCase().includes(catQuery.toLowerCase())).map(c => (
                    <button key={c} type="button"
                      onMouseDown={() => { setCatQuery(c); set('category', c); setCatOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price (USD) — blank = free</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {form.price && parseFloat(form.price) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">You keep <span className="text-green-400 font-semibold">80%</span> = ${(parseFloat(form.price || 0) * 0.8).toFixed(2)}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${form.has_certificate ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => set('has_certificate', !form.has_certificate)}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.has_certificate ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-yellow-400" /> Certificate on completion
                </span>
              </label>
            </div>
          </div>

          <TagInput label="What students will learn" values={form.skills_gained} onChange={v => set('skills_gained', v)} placeholder="e.g. Build a brand strategy…" />
          <TagInput label="Requirements" values={form.requirements} onChange={v => set('requirements', v)} placeholder="e.g. No experience needed…" />

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Course Modules * <span className="text-muted-foreground font-normal normal-case ml-1">({form.modules.length})</span>
              </label>
              <button type="button" onClick={addModule}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Module
              </button>
            </div>
            {form.modules.length === 0 ? (
              <button type="button" onClick={addModule}
                className="w-full py-10 border border-dashed border-border rounded-xl text-muted-foreground text-sm hover:border-primary/40 hover:text-primary transition-colors flex flex-col items-center gap-2">
                <Plus className="w-6 h-6 opacity-50" />
                Click to add your first module
              </button>
            ) : (
              <div className="space-y-3">
                {form.modules.map((mod, idx) => (
                  <ModuleRow key={idx} mod={mod} idx={idx} onChange={updateModule} onRemove={removeModule} />
                ))}
                <button type="button" onClick={addModule}
                  className="w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Another Module
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setTab('my-courses'); setEditId(null); setForm(emptyForm); setCatQuery('') }}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => handleSave('draft')} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors">
              Save Draft
            </button>
            <button type="button" onClick={() => handleSave('published')} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {editId ? 'Update Course' : 'Publish Course'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
