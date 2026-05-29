import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Star, Loader2, ChevronDown, ChevronUp, Search,
  Trophy, Edit2, Archive, CheckCircle2, Clock, Users,
  Upload, X, Save, Bell, Plus, Calendar, Hash,
  Zap, LayoutGrid, List, AlertCircle,
} from 'lucide-react'

const CATEGORIES = [
  'Rising Artist', 'Creator', 'Business', 'Tech Builder',
  'Social Impact', 'Musician', 'Educator', 'Entrepreneur', 'Filmmaker', 'Other',
]

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatMonth(yyyyMM) {
  if (!yyyyMM) return ''
  const [y, m] = yyyyMM.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length
}

function windowEffectiveStatus(w) {
  if (!w) return 'upcoming'
  const now = Date.now()
  if (w.status === 'winner_selected') return 'winner_selected'
  if ((w.nomination_count || 0) >= w.max_nominations) return 'closed'
  if (now < new Date(w.opens_at).getTime()) return 'upcoming'
  if (now >= new Date(w.opens_at).getTime() && now < new Date(w.closes_at).getTime()) return 'open'
  return 'closed'
}

const STATUS_CHIP = {
  upcoming:        { label: 'Upcoming',        cls: 'bg-blue-500/15 text-blue-400' },
  open:            { label: '🟢 Open',          cls: 'bg-green-500/15 text-green-400' },
  closed:          { label: 'Closed — Voting', cls: 'bg-amber-500/15 text-amber-400' },
  winner_selected: { label: 'Winner Selected', cls: 'bg-teal-500/15 text-teal-400' },
}

// ─── Select/Edit Winner Form ───────────────────────────────────────────────────
function SelectWinnerForm({ nomination, nomineeProfile, windowId, onPublish, onClose }) {
  const fileRef = useRef()
  const [story, setStory]         = useState('')
  const [tagline, setTagline]     = useState('')
  const [category, setCategory]   = useState(nomination?.category || '')
  const [month, setMonth]         = useState(new Date().toISOString().slice(0, 7))
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(nomineeProfile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)

  const displayName = nomineeProfile?.full_name || nomineeProfile?.username || 'Winner'

  const handleBannerFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handlePublish = async () => {
    if (!story.trim() || !category || !month) {
      toast.error('Please fill in story, category, and month.')
      return
    }
    setSaving(true)
    let bannerUrl = bannerPreview

    if (bannerFile) {
      setUploading(true)
      const ext = bannerFile.name.split('.').pop()
      const path = `spotlight/${nomination?.nominated_user_id || 'admin'}-${Date.now()}.${ext}`
      const { data: up, error: upErr } = await supabase.storage.from('uploads').upload(path, bannerFile, { upsert: true })
      if (upErr) { toast.error('Image upload failed.'); setSaving(false); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(up.path)
      bannerUrl = publicUrl
      setUploading(false)
    }

    await onPublish({
      user_id: nomination?.nominated_user_id,
      month,
      category,
      tagline: tagline.trim() || null,
      story: story.trim(),
      banner_image_url: bannerUrl || null,
      window_id: windowId || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-foreground">Publish Spotlight Winner</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {nomineeProfile && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              {nomineeProfile.avatar_url
                ? <img src={nomineeProfile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold flex-shrink-0">{displayName[0]}</div>
              }
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {nomineeProfile.headline && <p className="text-xs text-muted-foreground">{nomineeProfile.headline}</p>}
              </div>
            </div>
          )}

          {/* Banner */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Banner Photo</label>
            <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors group"
              onClick={() => fileRef.current?.click()}>
              {bannerPreview
                ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground"><Upload className="w-6 h-6" /><span className="text-xs">Click to upload</span></div>
              }
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Upload className="w-5 h-5 text-white" />
              </div>
              {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleBannerFile(e.target.files[0])} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Spotlight Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full" />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Short Tagline</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="e.g. Redefining what it means to create in Africa"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {/* Story */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Their Story <span className="text-muted-foreground normal-case font-normal">(displayed on spotlight page)</span>
            </label>
            {nomination?.reason && (
              <div className="bg-muted/50 rounded-xl p-3 mb-2 text-xs text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
                <p className="font-medium text-foreground mb-1">Nomination Reason:</p>
                {nomination.reason}
              </div>
            )}
            <textarea value={story} onChange={e => setStory(e.target.value)}
              placeholder="Write their full spotlight story…" rows={5}
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            <p className="text-xs text-muted-foreground mt-1">{countWords(story)} words</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handlePublish} disabled={saving || !story.trim() || !category}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Publish Spotlight
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Nomination Row ────────────────────────────────────────────────────────────
function NominationRow({ nom, profile, onSelectWinner }) {
  const [expanded, setExpanded] = useState(false)
  const displayName = profile?.full_name || profile?.username || 'Unknown'
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">{displayName[0]}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{nom.category}</span>
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
              ❤️ {nom.vote_count || 0} votes
            </span>
          </div>
          {profile?.headline && <p className="text-xs text-muted-foreground mt-0.5">{profile.headline}</p>}
        </div>
        <button onClick={() => onSelectWinner(nom, profile)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors">
          <Trophy className="w-3.5 h-3.5" /> Select Winner
        </button>
      </div>
      <div className="mt-3">
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{nom.reason}</p>
        {nom.reason?.length > 120 && (
          <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Window Form ──────────────────────────────────────────────────────────────
function WindowForm({ initial, onSave, onClose }) {
  const now = new Date()
  const defaultOpens = new Date(now.getTime() + 3600000).toISOString().slice(0, 16)
  const defaultCloses = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16)
  const defaultMonth = now.toISOString().slice(0, 7) + '-01'

  const [month, setMonth]       = useState(initial?.month?.slice(0, 7) || now.toISOString().slice(0, 7))
  const [category, setCategory] = useState(initial?.category || '')
  const [opensAt, setOpensAt]   = useState(initial?.opens_at?.slice(0, 16) || defaultOpens)
  const [closesAt, setClosesAt] = useState(initial?.closes_at?.slice(0, 16) || defaultCloses)
  const [maxNoms, setMaxNoms]   = useState(initial?.max_nominations || 20)
  const [saving, setSaving]     = useState(false)

  const valid = category && opensAt && closesAt && maxNoms > 0 && new Date(closesAt) > new Date(opensAt)

  const handleSave = async () => {
    if (!valid) return toast.error('Please fill all fields. Close time must be after open time.')
    setSaving(true)
    await onSave({
      month: month + '-01',
      category,
      opens_at: new Date(opensAt).toISOString(),
      closes_at: new Date(closesAt).toISOString(),
      max_nominations: parseInt(maxNoms),
      status: 'upcoming',
    })
    setSaving(false)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Spotlight Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Max Nominations</label>
          <input type="number" value={maxNoms} min={1} max={100} onChange={e => setMaxNoms(e.target.value)}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Opens At</label>
          <input type="datetime-local" value={opensAt} onChange={e => setOpensAt(e.target.value)}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Closes At</label>
          <input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      {closesAt && opensAt && new Date(closesAt) <= new Date(opensAt) && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Close time must be after open time
        </p>
      )}

      <div className="flex gap-3">
        {onClose && (
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        )}
        <button onClick={handleSave} disabled={!valid || saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initial ? 'Update Window' : 'Create Window'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSpotlight() {
  const { user } = useAuth()
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const currentMonth = new Date().toISOString().slice(0, 7)

  const [tab, setTab]             = useState('windows')
  const [nominations, setNominations] = useState([])
  const [nomProfiles, setNomProfiles] = useState({})
  const [windows, setWindows]     = useState([])
  const [winners, setWinners]     = useState([])
  const [winnerProfiles, setWinnerProfiles] = useState({})
  const [loading, setLoading]     = useState(true)
  const [autoRunning, setAutoRunning] = useState(false)
  const [winnerForm, setWinnerForm] = useState(null)
  const [editWindow, setEditWindow] = useState(null)
  const [sortNoms, setSortNoms]   = useState('votes')
  const [editingWinner, setEditingWinner] = useState(null)

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: noms }, { data: ws }, { data: wins }] = await Promise.all([
      supabase.from('spotlight_nominations').select('*').eq('month', currentMonth)
        .order(sortNoms === 'votes' ? 'vote_count' : 'created_at', { ascending: false }),
      supabase.from('spotlight_windows').select('*').order('opens_at', { ascending: false }),
      supabase.from('spotlight_winners').select('*').order('month', { ascending: false }),
    ])

    const nomIds    = [...new Set((noms  || []).map(n => n.nominated_user_id))]
    const winnerIds = [...new Set((wins  || []).map(w => w.user_id))]
    const allIds    = [...new Set([...nomIds, ...winnerIds])]

    const { data: ps } = allIds.length
      ? await supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', allIds)
      : { data: [] }

    const pMap = {}
    ;(ps || []).forEach(p => { pMap[p.id] = p })

    setNominations(noms || [])
    setNomProfiles(pMap)
    setWindows(ws || [])
    setWinners(wins || [])
    setWinnerProfiles(pMap)
    setLoading(false)
  }, [currentMonth, sortNoms])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Auto-select winner: runs on load ──────────────────────────────────────
  // Finds any closed window past the 24h voting period with no winner yet,
  // and automatically selects the top-voted nominee.
  useEffect(() => {
    const runAutoSelect = async () => {
      if (!user?.is_admin) return
      setAutoRunning(true)
      try {
        // Find windows: closed status, closes_at + 24h < now, no winner for that month
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        const { data: eligibleWindows } = await supabase
          .from('spotlight_windows')
          .select('*')
          .eq('status', 'closed')
          .lt('closes_at', cutoff)

        for (const w of (eligibleWindows || [])) {
          const wMonth = w.month.slice(0, 7)
          // Check if winner already exists for this month
          const { data: existingWinner } = await supabase
            .from('spotlight_winners')
            .select('id')
            .eq('month', wMonth)
            .maybeSingle()

          if (existingWinner) {
            // Mark window as winner_selected if needed
            if (w.status !== 'winner_selected') {
              await supabase.from('spotlight_windows').update({ status: 'winner_selected' }).eq('id', w.id)
            }
            continue
          }

          // Find top-voted nominee for this month
          const { data: topNom } = await supabase
            .from('spotlight_nominations')
            .select('*')
            .eq('month', wMonth)
            .order('vote_count', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!topNom) {
            console.log(`[Auto-select] No nominees for ${wMonth}, skipping.`)
            continue
          }

          // Insert winner
          const { data: newWinner, error: winError } = await supabase
            .from('spotlight_winners')
            .upsert({
              user_id: topNom.nominated_user_id,
              month: wMonth,
              category: topNom.category,
              story: topNom.reason,
              is_active: wMonth === currentMonth,
              window_id: w.id,
              created_by: user.id,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'month' })
            .select()
            .single()

          if (winError) {
            console.error('[Auto-select] Failed to insert winner:', winError)
            continue
          }

          // Update window status
          await supabase.from('spotlight_windows').update({ status: 'winner_selected' }).eq('id', w.id)

          // Add spotlight badge to user
          await supabase.from('users').update({
            spotlight_winner: true,
            spotlight_month: wMonth,
          }).eq('id', topNom.nominated_user_id)

          // Notify winner
          const winnerProfile = nomProfiles[topNom.nominated_user_id]
          await supabase.from('notifications').insert({
            user_id: topNom.nominated_user_id,
            type: 'system',
            actor_name: 'Philomni',
            message: `🎉 You've been selected as Philomni's ${topNom.category} Spotlight for ${formatMonth(wMonth)}! Your breakthrough moment is here. Your profile will be featured across the platform this month.`,
            read: false,
            created_at: new Date().toISOString(),
          })

          // Notify all users (batch — insert one platform-wide notification)
          // In production this would use an Edge Function; here we insert for logged-in user as a demo
          console.log(`[Auto-select] ✅ Winner selected: ${winnerProfile?.full_name || topNom.nominated_user_id} for ${wMonth}`)
          toast.success(`⭐ Auto-selected winner for ${formatMonth(wMonth)}!`)
        }
      } catch (err) {
        console.error('[Auto-select] Error:', err)
      } finally {
        setAutoRunning(false)
        loadAll()
      }
    }

    runAutoSelect()
  }, [user?.is_admin]) // runs once when admin page loads

  // ── Publish winner ─────────────────────────────────────────────────────────
  const handlePublish = async (payload) => {
    await supabase.from('spotlight_winners').update({ is_active: false }).eq('month', payload.month)

    const { error } = await supabase.from('spotlight_winners').upsert({
      ...payload,
      is_active: true,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'month' }).select().single()

    if (error) { toast.error('Failed to publish: ' + error.message); return }

    const winnerProfile = nomProfiles[payload.user_id] || winnerProfiles[payload.user_id]
    await supabase.from('notifications').insert({
      user_id: payload.user_id,
      type: 'system',
      actor_name: 'Philomni',
      message: `🎉 Congratulations! You've been selected as Philomni's ${payload.category} Spotlight for ${formatMonth(payload.month)}! Your profile will be featured this month.`,
      read: false,
      created_at: new Date().toISOString(),
    })
    await supabase.from('users').update({ spotlight_winner: true, spotlight_month: payload.month }).eq('id', payload.user_id)

    // If there's a window for this month, mark as winner_selected
    if (payload.window_id) {
      await supabase.from('spotlight_windows').update({ status: 'winner_selected' }).eq('id', payload.window_id)
    }

    toast.success(`🌟 Spotlight published for ${winnerProfile?.full_name || 'winner'}!`)
    setWinnerForm(null)
    setEditingWinner(null)
    loadAll()
  }

  // ── Create window ──────────────────────────────────────────────────────────
  const handleCreateWindow = async (data) => {
    const { error } = await supabase.from('spotlight_windows').insert({ ...data, created_by: user.id })
    if (error) { toast.error('Failed to create window: ' + error.message); return }
    toast.success('Nomination window created!')
    loadAll()
  }

  // ── Update window ──────────────────────────────────────────────────────────
  const handleUpdateWindow = async (data) => {
    const { error } = await supabase.from('spotlight_windows').update(data).eq('id', editWindow.id)
    if (error) { toast.error('Failed to update: ' + error.message); return }
    toast.success('Window updated!')
    setEditWindow(null)
    loadAll()
  }

  // ── Cancel window ──────────────────────────────────────────────────────────
  const handleCancelWindow = async (w) => {
    if (!window.confirm('Cancel this nomination window?')) return
    await supabase.from('spotlight_windows').delete().eq('id', w.id)
    toast.success('Window cancelled')
    loadAll()
  }

  // ── Deactivate winner ──────────────────────────────────────────────────────
  const handleDeactivate = async (winner) => {
    if (!window.confirm(`Deactivate spotlight for ${winnerProfiles[winner.user_id]?.full_name || 'this winner'}?`)) return
    await supabase.from('spotlight_winners').update({ is_active: false }).eq('id', winner.id)
    toast.success('Spotlight deactivated')
    loadAll()
  }

  const TABS = [
    { key: 'windows',     label: 'Create Window',     icon: Plus },
    { key: 'active',      label: 'Active Windows',     icon: Calendar },
    { key: 'nominees',    label: `Nominees (${nominations.length})`, icon: Users },
    { key: 'past',        label: `Past Spotlights (${winners.length})`, icon: Trophy },
  ]

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-xl font-bold text-foreground">Spotlight Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">Schedule nomination windows and select monthly spotlight winners</p>
        </div>
        {autoRunning && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            Auto-select running…
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'This Month Nominations', value: nominations.length, icon: <Users className="w-4 h-4 text-primary" /> },
          { label: 'Total Votes', value: nominations.reduce((s, n) => s + (n.vote_count || 0), 0), icon: <Star className="w-4 h-4 text-amber-400" /> },
          { label: 'Active Windows', value: windows.filter(w => ['open','upcoming'].includes(windowEffectiveStatus(w))).length, icon: <Calendar className="w-4 h-4 text-teal-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── TAB 1: Create Window ── */}
          {tab === 'windows' && (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-4">Schedule a New Nomination Window</h2>
              <WindowForm onSave={handleCreateWindow} />
            </div>
          )}

          {/* ── TAB 2: Active Windows ── */}
          {tab === 'active' && (
            <div className="space-y-3">
              {windows.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No windows created yet.</p>
                  <button onClick={() => setTab('windows')} className="mt-3 text-sm text-primary hover:underline">
                    Create your first window →
                  </button>
                </div>
              ) : windows.map(w => {
                const effStatus = windowEffectiveStatus(w)
                const chip = STATUS_CHIP[effStatus] || STATUS_CHIP.upcoming
                return (
                  <div key={w.id} className="bg-card border border-border rounded-xl p-4">
                    {editWindow?.id === w.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">Editing Window</p>
                          <button onClick={() => setEditWindow(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                        </div>
                        <WindowForm initial={w} onSave={handleUpdateWindow} onClose={() => setEditWindow(null)} />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${chip.cls}`}>{chip.label}</span>
                            <span className="text-sm font-semibold text-foreground">{w.category}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{formatMonth(w.month?.slice(0,7))}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Opens: {formatDateTime(w.opens_at)}</p>
                          <p className="text-xs text-muted-foreground">Closes: {formatDateTime(w.closes_at)}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[120px]">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, ((w.nomination_count||0)/w.max_nominations)*100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{w.nomination_count || 0}/{w.max_nominations} nominations</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {effStatus !== 'winner_selected' && (
                            <button onClick={() => setEditWindow(w)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {effStatus === 'winner_selected' ? (
                            <span className="text-[10px] text-teal-400 font-semibold px-2">✓ Done</span>
                          ) : (
                            <button onClick={() => handleCancelWindow(w)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TAB 3: Nominees ── */}
          {tab === 'nominees' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">{formatMonth(currentMonth)} Nominations</h2>
                <div className="flex gap-2">
                  <button onClick={() => setSortNoms('votes')}
                    className={`text-xs px-2.5 py-1 rounded-lg ${sortNoms === 'votes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                    By Votes
                  </button>
                  <button onClick={() => setSortNoms('recent')}
                    className={`text-xs px-2.5 py-1 rounded-lg ${sortNoms === 'recent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                    Recent
                  </button>
                </div>
              </div>

              {nominations.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No nominations yet for this month.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nominations.map(nom => (
                    <NominationRow key={nom.id} nom={nom} profile={nomProfiles[nom.nominated_user_id]}
                      onSelectWinner={(n, p) => setWinnerForm({ nomination: n, profile: p })} />
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs text-muted-foreground mb-3">Or select a winner manually (without a nomination):</p>
                <button onClick={() => setWinnerForm({ nomination: null, profile: null })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-500 text-sm font-semibold hover:bg-amber-500/25 border border-amber-500/20">
                  <Trophy className="w-4 h-4" /> Select Winner Manually
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 4: Past Spotlights ── */}
          {tab === 'past' && (
            <div className="space-y-3">
              {winners.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No spotlight winners yet.</p>
                </div>
              ) : winners.map(w => {
                const p = winnerProfiles[w.user_id]
                return (
                  <div key={w.id} className={`bg-card border rounded-xl p-4 flex items-center gap-3 ${w.is_active ? 'border-amber-500/40' : 'border-border'}`}>
                    {(w.banner_image_url || p?.avatar_url) ? (
                      <img src={w.banner_image_url || p.avatar_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold flex-shrink-0">
                        {(p?.full_name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{p?.full_name || p?.username || 'Unknown'}</p>
                        {w.is_active && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{w.category} · {formatMonth(w.month)}</p>
                      {w.tagline && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{w.tagline}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setEditingWinner({ winner: w, profile: p })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {w.is_active && (
                        <button onClick={() => handleDeactivate(w)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Deactivate">
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Select Winner Modal */}
      {winnerForm && (
        <SelectWinnerForm
          nomination={winnerForm.nomination}
          nomineeProfile={winnerForm.profile}
          windowId={windows.find(w => w.month?.slice(0,7) === currentMonth)?.id || null}
          onPublish={handlePublish}
          onClose={() => setWinnerForm(null)}
        />
      )}

      {/* Edit Winner Modal */}
      {editingWinner && (
        <SelectWinnerForm
          nomination={{ ...editingWinner.winner, nominated_user_id: editingWinner.winner.user_id, reason: editingWinner.winner.story }}
          nomineeProfile={editingWinner.profile}
          windowId={editingWinner.winner.window_id}
          onPublish={async (payload) => {
            const { error } = await supabase.from('spotlight_winners')
              .update({ ...payload, updated_at: new Date().toISOString() })
              .eq('id', editingWinner.winner.id)
            if (error) { toast.error('Update failed'); return }
            toast.success('Spotlight updated!')
            setEditingWinner(null)
            loadAll()
          }}
          onClose={() => setEditingWinner(null)}
        />
      )}
    </div>
  )
}
