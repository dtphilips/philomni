import React, { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Star, Loader2, ChevronDown, ChevronUp, Search,
  Trophy, Edit2, Archive, CheckCircle2, Clock, Users,
  Upload, X, Save, Bell,
} from 'lucide-react'

const CATEGORIES = [
  'Rising Artist', 'Creator', 'Business', 'Tech Builder',
  'Social Impact', 'Musician', 'Educator', 'Entrepreneur', 'Other',
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

function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length
}

// ─── Select Winner Form ───────────────────────────────────────────────────────
function SelectWinnerForm({ nomination, nomineeProfile, onPublish, onClose }) {
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

    // Upload banner if new file selected
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
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-foreground">Select Spotlight Winner</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nominee info */}
          {nomineeProfile && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              {nomineeProfile.avatar_url ? (
                <img src={nomineeProfile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold flex-shrink-0">
                  {displayName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {nomineeProfile.headline && <p className="text-xs text-muted-foreground">{nomineeProfile.headline}</p>}
              </div>
            </div>
          )}

          {/* Banner upload */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Spotlight Banner Photo
            </label>
            <div
              className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors group"
              onClick={() => fileRef.current?.click()}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Click to upload banner photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Upload className="w-5 h-5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
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
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Short Tagline</label>
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="e.g. Redefining what it means to create in Africa"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
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
            <textarea
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder="Write their full spotlight story here…"
              rows={5}
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{countWords(story)} words</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={saving || !story.trim() || !category}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Publish Spotlight
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── NominationRow ────────────────────────────────────────────────────────────
function NominationRow({ nom, profile, onSelectWinner }) {
  const [expanded, setExpanded] = useState(false)
  const displayName = profile?.full_name || profile?.username || 'Unknown'

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
            {displayName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{nom.category}</span>
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
              ❤️ {nom.vote_count} votes
            </span>
          </div>
          {profile?.headline && <p className="text-xs text-muted-foreground mt-0.5">{profile.headline}</p>}
        </div>
        <button
          onClick={() => onSelectWinner(nom, profile)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
        >
          <Trophy className="w-3.5 h-3.5" /> Select Winner
        </button>
      </div>

      {/* Reason */}
      <div className="mt-3">
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {nom.reason}
        </p>
        {nom.reason.length > 120 && (
          <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSpotlight() {
  const { user } = useAuth()
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const currentMonth = new Date().toISOString().slice(0, 7)

  const [nominations, setNominations]   = useState([])
  const [nomProfiles, setNomProfiles]   = useState({})
  const [winners, setWinners]           = useState([])
  const [winnerProfiles, setWinnerProfiles] = useState({})
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('nominations') // 'nominations' | 'winners'
  const [winnerForm, setWinnerForm]     = useState(null)  // { nomination, profile }
  const [editingWinner, setEditingWinner] = useState(null)
  const [sortNoms, setSortNoms]         = useState('votes')

  const loadAll = async () => {
    setLoading(true)
    const [{ data: noms }, { data: ws }] = await Promise.all([
      supabase.from('spotlight_nominations').select('*').eq('month', currentMonth)
        .order(sortNoms === 'votes' ? 'vote_count' : 'created_at', { ascending: false }),
      supabase.from('spotlight_winners').select('*').order('month', { ascending: false }),
    ])

    const nomIds    = [...new Set((noms || []).map(n => n.nominated_user_id))]
    const winnerIds = [...new Set((ws   || []).map(w => w.user_id))]
    const allIds    = [...new Set([...nomIds, ...winnerIds])]

    const { data: ps } = allIds.length
      ? await supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', allIds)
      : { data: [] }

    const pMap = {}
    ;(ps || []).forEach(p => { pMap[p.id] = p })

    setNominations(noms || [])
    setNomProfiles(pMap)
    setWinners(ws || [])
    setWinnerProfiles(pMap)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [sortNoms])

  const handlePublish = async (payload) => {
    // Deactivate any existing winner for this month
    await supabase.from('spotlight_winners').update({ is_active: false }).eq('month', payload.month)

    const { data: newWinner, error } = await supabase.from('spotlight_winners').upsert({
      ...payload,
      is_active: true,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'month' }).select().single()

    if (error) { toast.error('Failed to publish spotlight: ' + error.message); return }

    // Send notification to winner
    const winnerProfile = nomProfiles[payload.user_id]
    await supabase.from('notifications').insert({
      user_id: payload.user_id,
      type: 'system',
      actor_name: 'Philomni',
      message: `🎉 Congratulations! You've been selected as Philomni's ${payload.category} Spotlight for ${formatMonth(payload.month)}! Your profile will be featured across the platform for the entire month. Your breakthrough moment is here.`,
      read: false,
      created_at: new Date().toISOString(),
    })

    // Add spotlight badge to user profile
    await supabase.from('users').update({ spotlight_winner: true, spotlight_month: payload.month }).eq('id', payload.user_id)

    toast.success(`🌟 Spotlight published for ${winnerProfile?.full_name || 'winner'}! Notification sent.`)
    setWinnerForm(null)
    setEditingWinner(null)
    loadAll()
  }

  const handleDeactivate = async (winner) => {
    if (!window.confirm(`Deactivate spotlight for ${winnerProfiles[winner.user_id]?.full_name || 'this winner'}?`)) return
    await supabase.from('spotlight_winners').update({ is_active: false }).eq('id', winner.id)
    toast.success('Spotlight deactivated')
    loadAll()
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Spotlight Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">Review nominations and select the monthly spotlight winner</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'This Month Nominations', value: nominations.length, icon: <Users className="w-4 h-4 text-primary" /> },
          { label: 'Total Votes This Month', value: nominations.reduce((s, n) => s + n.vote_count, 0), icon: <Star className="w-4 h-4 text-amber-400" /> },
          { label: 'Past Spotlights', value: winners.length, icon: <Trophy className="w-4 h-4 text-teal-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-5">
        {[
          { key: 'nominations', label: `Nominations (${nominations.length})` },
          { key: 'winners', label: `Past Winners (${winners.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : tab === 'nominations' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">{formatMonth(currentMonth)} Nominations</h2>
            <div className="flex gap-2">
              <button onClick={() => setSortNoms('votes')}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortNoms === 'votes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                By Votes
              </button>
              <button onClick={() => setSortNoms('recent')}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortNoms === 'recent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
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
                <NominationRow
                  key={nom.id}
                  nom={nom}
                  profile={nomProfiles[nom.nominated_user_id]}
                  onSelectWinner={(n, p) => setWinnerForm({ nomination: n, profile: p })}
                />
              ))}
            </div>
          )}

          {/* Manual winner selection (without nomination) */}
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground mb-3">Or select a winner manually (without a nomination):</p>
            <button
              onClick={() => setWinnerForm({ nomination: null, profile: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-500 text-sm font-semibold hover:bg-amber-500/25 transition-colors border border-amber-500/20"
            >
              <Trophy className="w-4 h-4" /> Select Winner Manually
            </button>
          </div>
        </div>
      ) : (
        /* Past Winners */
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
                  <button
                    onClick={() => setEditingWinner({ winner: w, profile: p })}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {w.is_active && (
                    <button
                      onClick={() => handleDeactivate(w)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Deactivate"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Select Winner Form Modal */}
      {winnerForm && (
        <SelectWinnerForm
          nomination={winnerForm.nomination}
          nomineeProfile={winnerForm.profile}
          onPublish={handlePublish}
          onClose={() => setWinnerForm(null)}
        />
      )}

      {/* Edit Winner Form */}
      {editingWinner && (
        <SelectWinnerForm
          nomination={{ ...editingWinner.winner, nominated_user_id: editingWinner.winner.user_id, reason: editingWinner.winner.story }}
          nomineeProfile={editingWinner.profile}
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
