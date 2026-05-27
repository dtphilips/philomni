import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  GraduationCap, Plus, BookOpen, Users, DollarSign, Edit3,
  Loader2, Eye, EyeOff, Trash2, BarChart2, Upload, X, GripVertical,
} from 'lucide-react'

const CATEGORIES = ['Business', 'Design', 'Marketing', 'Development', 'Finance', 'Music', 'Photography', 'Writing', 'Other']

function ModuleRow({ mod, idx, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
      <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 flex-shrink-0 cursor-grab" />
      <div className="flex-1 space-y-2">
        <input
          value={mod.title}
          onChange={e => onChange(idx, 'title', e.target.value)}
          placeholder="Module title"
          className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          value={mod.video_url}
          onChange={e => onChange(idx, 'video_url', e.target.value)}
          placeholder="Video URL (YouTube, Vimeo, etc.)"
          className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={mod.duration}
            onChange={e => onChange(idx, 'duration', e.target.value)}
            placeholder="Duration (min)"
            className="w-28 px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={mod.is_free_preview}
              onChange={e => onChange(idx, 'is_free_preview', e.target.checked)}
              className="w-3.5 h-3.5"
            />
            Free preview
          </label>
        </div>
      </div>
      <button onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-destructive mt-1.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Teach() {
  const { user } = useAuth()
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('my-courses') // 'my-courses' | 'create'
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState(null)

  const emptyForm = { title: '', description: '', category: 'Business', price: '', thumbnail_url: '', modules: [] }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('courses').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setCourses(data || []); setLoading(false) })
  }, [user?.id])

  const addModule = () => setForm(f => ({
    ...f,
    modules: [...f.modules, { title: '', video_url: '', duration: '', is_free_preview: false }]
  }))

  const updateModule = (idx, key, val) => setForm(f => {
    const mods = [...f.modules]
    mods[idx] = { ...mods[idx], [key]: val }
    return { ...f, modules: mods }
  })

  const removeModule = (idx) => setForm(f => ({
    ...f, modules: f.modules.filter((_, i) => i !== idx)
  }))

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) return toast.error('Course title is required')
    if (form.modules.length === 0) return toast.error('Add at least one module')
    setSaving(true)

    try {
      const courseData = {
        creator_id:   user.id,
        title:        form.title.trim(),
        description:  form.description,
        category:     form.category,
        price:        parseFloat(form.price) || 0,
        thumbnail_url: form.thumbnail_url,
        is_published:  publish,
      }

      let courseId = editId
      if (editId) {
        await supabase.from('courses').update(courseData).eq('id', editId)
        await supabase.from('course_modules').delete().eq('course_id', editId)
      } else {
        const { data } = await supabase.from('courses').insert(courseData).select().single()
        courseId = data.id
      }

      // Insert modules
      const modulesData = form.modules.map((m, i) => ({
        course_id: courseId,
        title: m.title,
        video_url: m.video_url,
        duration: parseInt(m.duration) || 0,
        is_free_preview: m.is_free_preview,
        position: i,
      }))
      if (modulesData.length > 0) await supabase.from('course_modules').insert(modulesData)

      toast.success(publish ? '🎉 Course published!' : 'Course saved as draft!')
      setForm(emptyForm)
      setEditId(null)
      setTab('my-courses')

      // Refresh list
      const { data: updated } = await supabase.from('courses').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
      setCourses(updated || [])
    } catch (err) {
      toast.error(err.message || 'Failed to save course')
    }
    setSaving(false)
  }

  const togglePublish = async (course) => {
    const newVal = !course.is_published
    await supabase.from('courses').update({ is_published: newVal }).eq('id', course.id)
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: newVal } : c))
    toast.success(newVal ? 'Course published!' : 'Course unpublished')
  }

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    toast.success('Course deleted')
  }

  const startEdit = async (course) => {
    const { data: mods } = await supabase.from('course_modules').select('*').eq('course_id', course.id).order('position')
    setForm({
      title:        course.title,
      description:  course.description || '',
      category:     course.category || 'Business',
      price:        course.price?.toString() || '',
      thumbnail_url: course.thumbnail_url || '',
      modules:      mods || [],
    })
    setEditId(course.id)
    setTab('create')
  }

  const totalRevenue = courses.reduce((s, c) => s + (c.total_revenue || 0), 0)
  const totalStudents = courses.reduce((s, c) => s + (c.total_enrolled || 0), 0)

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Teach</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'My Courses',    value: courses.length,        icon: BookOpen,   color: 'text-blue-400' },
          { label: 'Total Students',value: totalStudents,         icon: Users,      color: 'text-purple-400' },
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['my-courses','My Courses'],['create', editId ? 'Edit Course' : 'Create Course']].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'create' && !editId) setForm(emptyForm) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'my-courses' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No courses yet</p>
            <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mx-auto">
              <Plus className="w-4 h-4" /> Create Your First Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="" />
                    : <BookOpen className="w-5 h-5 text-muted-foreground/40 m-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.total_enrolled}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${(course.total_revenue||0).toFixed(2)}</span>
                    <span>{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(course)} className={`p-1.5 rounded-lg transition-colors ${course.is_published ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted'}`}>
                    {course.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(course)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCourse(course.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => { setTab('create'); setEditId(null); setForm(emptyForm) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <Plus className="w-4 h-4" /> Create New Course
            </button>
          </div>
        )
      )}

      {tab === 'create' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Course Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Mastering Social Media Marketing"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="What will students learn?"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Price (USD) — leave blank for free</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Thumbnail URL</label>
              <input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modules *</label>
              <button onClick={addModule} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80">
                <Plus className="w-3.5 h-3.5" /> Add Module
              </button>
            </div>
            {form.modules.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                No modules yet — add one above
              </div>
            ) : (
              <div className="space-y-2">
                {form.modules.map((mod, idx) => (
                  <ModuleRow key={idx} mod={mod} idx={idx} onChange={updateModule} onRemove={removeModule} />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish Course
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
