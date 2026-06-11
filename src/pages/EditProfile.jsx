import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronLeft, Camera, Upload, X, Loader2, Plus, Trash2,
  Building2, User, Globe, Lock, Eye, EyeOff,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function uploadToStorage(file, folder = 'uploads') {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Australia','Austria','Azerbaijan',
  'Bangladesh','Belgium','Bolivia','Brazil','Cameroon','Canada','Chile','China','Colombia',
  'Congo','Côte d\'Ivoire','Croatia','Czech Republic','Denmark','Egypt','Ethiopia',
  'Finland','France','Germany','Ghana','Greece','Guatemala','Hungary','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya',
  'Malaysia','Mexico','Morocco','Mozambique','Netherlands','New Zealand','Nigeria','Norway',
  'Pakistan','Peru','Philippines','Poland','Portugal','Romania','Russia','Rwanda',
  'Saudi Arabia','Senegal','Serbia','Singapore','South Africa','South Korea','Spain',
  'Sudan','Sweden','Switzerland','Tanzania','Thailand','Turkey','Uganda','Ukraine',
  'United Kingdom','United States','Venezuela','Vietnam','Zimbabwe',
]

function Toggle({ label, sublabel, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground'

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // Fields
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')

  // Privacy
  const [emailPublic, setEmailPublic] = useState(false)
  const [showFollowerCount, setShowFollowerCount] = useState(true)
  const [showOnline, setShowOnline] = useState(true)

  // Photos
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')
  const [bannerFile, setBannerFile] = useState(null)

  // Work experience
  const [workExp, setWorkExp] = useState([])
  const [companySearch, setCompanySearch] = useState({})
  const [companySuggestions, setCompanySuggestions] = useState({})

  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name || '')
    setUsername(user.username || '')
    setHeadline(user.headline || '')
    setBio(user.bio || '')
    setWebsite(user.website || '')
    setCountry(user.country || '')
    setEmailPublic(user.email_public || false)
    setShowFollowerCount(user.show_follower_count !== false)
    setShowOnline(user.show_online !== false)
    setAvatarUrl(user.avatar_url || '')
    setAvatarPreview(user.avatar_url || '')
    setBannerUrl(user.banner_url || '')
    setBannerPreview(user.banner_url || '')
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('work_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
      .then(({ data }) => { if (data?.length) setWorkExp(data) })
  }, [user?.id])

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = evt => setAvatarPreview(evt.target.result)
    reader.readAsDataURL(file)
  }

  const handleBannerFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    const reader = new FileReader()
    reader.onload = evt => setBannerPreview(evt.target.result)
    reader.readAsDataURL(file)
  }

  // Work exp helpers
  const addPosition = () => setWorkExp(prev => [...prev, {
    id: `new-${Date.now()}`, company_id: null, company_name: '', company_logo: null,
    title: '', employment_type: 'Full-time', start_date: '', end_date: '', is_current: false, description: '',
  }])

  const updatePos = (idx, field, val) => setWorkExp(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))

  const removePos = async (idx) => {
    const pos = workExp[idx]
    if (pos.id && !String(pos.id).startsWith('new-')) {
      await supabase.from('work_experience').delete().eq('id', pos.id)
    }
    setWorkExp(prev => prev.filter((_, i) => i !== idx))
  }

  const searchCompanies = async (idx, query) => {
    if (!query || query.length < 2) { setCompanySuggestions(p => ({ ...p, [idx]: [] })); return }
    const { data } = await supabase.from('companies').select('id, name, logo_url').ilike('name', `%${query}%`).limit(5)
    setCompanySuggestions(p => ({ ...p, [idx]: data || [] }))
  }

  const saveWorkExp = async () => {
    for (const pos of workExp) {
      const payload = {
        user_id: user.id, company_id: pos.company_id || null, company_name: pos.company_name,
        company_logo: pos.company_logo || null, title: pos.title, employment_type: pos.employment_type,
        start_date: pos.start_date || null, end_date: pos.is_current ? null : (pos.end_date || null),
        is_current: pos.is_current, description: pos.description || null,
      }
      if (String(pos.id).startsWith('new-')) {
        await supabase.from('work_experience').insert(payload)
      } else {
        await supabase.from('work_experience').update(payload).eq('id', pos.id)
      }
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    setUsernameError('')

    // Username format check
    if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
      setUsernameError('Username must be 3–30 characters: lowercase letters, numbers, underscores only.')
      return
    }

    setSaving(true)
    try {
      let newAvatarUrl = avatarUrl
      let newBannerUrl = bannerUrl

      if (avatarFile) newAvatarUrl = await uploadToStorage(avatarFile, 'avatars')
      if (bannerFile) newBannerUrl = await uploadToStorage(bannerFile, 'banners')

      const { error } = await supabase.from('users').update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        website: website.trim() || null,
        country: country || null,
        email_public: emailPublic,
        show_follower_count: showFollowerCount,
        show_online: showOnline,
        avatar_url: newAvatarUrl || null,
        banner_url: newBannerUrl || null,
      }).eq('id', user.id)

      if (error) {
        if (error.message?.includes('username')) {
          setUsernameError('That username is already taken.')
        } else {
          throw error
        }
        return
      }

      await saveWorkExp()
      toast.success('Profile updated!')
      navigate('/profile')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <div className="space-y-5">

        {/* ── Photos ── */}
        <Section title="Photos">
          {/* Banner */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Profile Banner</p>
            <div className="relative h-36 rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden">
              {bannerPreview
                ? <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="w-7 h-7" />
                    <p className="text-xs">No banner yet</p>
                  </div>
              }
              <label className="absolute bottom-2 right-2 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
                <div className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Upload className="w-4 h-4" />
                </div>
              </label>
              {bannerPreview && (
                <button onClick={() => { setBannerFile(null); setBannerPreview(''); setBannerUrl('') }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
                    {user?.full_name?.[0] || '?'}
                  </div>
              }
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click the circle to upload. JPG or PNG.</p>
              <button onClick={() => avatarInputRef.current?.click()}
                className="mt-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted">
                Choose Photo
              </button>
            </div>
          </div>
        </Section>

        {/* ── Basic Info ── */}
        <Section title="Basic Info">
          <Field label="Full Name">
            <input className={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" maxLength={80} />
          </Field>

          <Field label="Username" hint="3–30 characters. Letters, numbers, underscores. Used in your profile link.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input className={`${inp} pl-7`} value={username} onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setUsernameError('') }}
                placeholder="yourhandle" maxLength={30} />
            </div>
            {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
          </Field>

          <Field label="Headline" hint="Shown under your name. e.g. Creator · Educator · Speaker">
            <input className={inp} value={headline} onChange={e => setHeadline(e.target.value)} placeholder="What you do in a few words" maxLength={120} />
          </Field>

          <Field label="Bio">
            <textarea className={`${inp} resize-none`} rows={4} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell people about yourself…" maxLength={500} />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
          </Field>

          <Field label="Country">
            <select className={inp} value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Website">
            <input className={inp} type="url" value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com" />
          </Field>
        </Section>

        {/* ── Privacy ── */}
        <Section title="Privacy">
          <p className="text-xs text-muted-foreground -mt-1">Control what other people can see on your profile.</p>
          <div className="divide-y divide-border/50">
            <Toggle
              label="Show email address"
              sublabel="Your email will be visible on your public profile"
              value={emailPublic}
              onChange={setEmailPublic}
            />
            <Toggle
              label="Show follower count"
              sublabel="Let others see how many followers you have"
              value={showFollowerCount}
              onChange={setShowFollowerCount}
            />
            <Toggle
              label="Show online status"
              sublabel="Let others see when you are active"
              value={showOnline}
              onChange={setShowOnline}
            />
          </div>
        </Section>

        {/* ── Work Experience ── */}
        <Section title="Work Experience">
          <div className="flex justify-end -mt-2">
            <button onClick={addPosition}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted">
              <Plus className="w-3.5 h-3.5" /> Add Position
            </button>
          </div>

          {workExp.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No work experience added yet.</p>
          )}

          {workExp.map((pos, idx) => (
            <div key={pos.id} className="border border-border rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removePos(idx)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Company */}
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Company Name</label>
                <input className={inp}
                  value={companySearch[idx] ?? pos.company_name}
                  onChange={e => {
                    const val = e.target.value
                    setCompanySearch(p => ({ ...p, [idx]: val }))
                    updatePos(idx, 'company_name', val)
                    updatePos(idx, 'company_id', null)
                    searchCompanies(idx, val)
                  }}
                  placeholder="Search or enter company name…"
                />
                {companySuggestions[idx]?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-xl shadow-xl mt-1 overflow-hidden">
                    {companySuggestions[idx].map(co => (
                      <button key={co.id} onClick={() => {
                        updatePos(idx, 'company_id', co.id)
                        updatePos(idx, 'company_name', co.name)
                        updatePos(idx, 'company_logo', co.logo_url)
                        setCompanySearch(p => ({ ...p, [idx]: co.name }))
                        setCompanySuggestions(p => ({ ...p, [idx]: [] }))
                      }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs overflow-hidden">
                          {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-cover" /> : co.name[0]}
                        </div>
                        {co.name}
                        {pos.company_id === co.id && <span className="ml-auto text-xs text-primary">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Job Title</label>
                <input className={inp} value={pos.title} onChange={e => updatePos(idx, 'title', e.target.value)} placeholder="e.g. Senior Video Editor" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Employment Type</label>
                <select className={inp} value={pos.employment_type} onChange={e => updatePos(idx, 'employment_type', e.target.value)}>
                  {['Full-time','Part-time','Contract','Freelance','Internship','Self-employed'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
                  <input className={inp} type="month" value={pos.start_date} onChange={e => updatePos(idx, 'start_date', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
                  <input className={inp} type="month" value={pos.end_date} onChange={e => updatePos(idx, 'end_date', e.target.value)} disabled={pos.is_current} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={pos.is_current}
                  onChange={e => { updatePos(idx, 'is_current', e.target.checked); if (e.target.checked) updatePos(idx, 'end_date', '') }}
                  className="w-4 h-4 accent-primary" />
                I currently work here
              </label>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea className={`${inp} resize-none`} rows={2} value={pos.description}
                  onChange={e => updatePos(idx, 'description', e.target.value)}
                  placeholder="Describe your role…" />
              </div>
            </div>
          ))}
        </Section>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate('/profile')} disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
