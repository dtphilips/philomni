import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, ArrowLeft, ArrowRight, Check, Upload, ChevronLeft, Search, X, Gift } from 'lucide-react'
import {
  CELEBRATION_TYPES, TIERS, RELATIONSHIPS, getExpiresAt,
} from '../lib/celebrations'

const STEPS = ['Who', 'Message', 'Tier', 'Preview']

const generateCode = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase()

async function uploadPhoto(file) {
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const { error } = await supabase.storage
    .from('philomni-music')
    .upload(`celebrations/${fileName}`, file, { contentType: file.type, upsert: true })
  if (error) { console.error('Photo upload error:', error); return null }
  const { data: { publicUrl } } = supabase.storage
    .from('philomni-music')
    .getPublicUrl(`celebrations/${fileName}`)
  return publicUrl
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current  ? 'bg-primary text-primary-foreground' :
              i === current ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${i === current ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px mx-2 mb-3 transition-colors ${i < current ? 'bg-primary' : 'bg-muted'}`} style={{ width: 28 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function TierCard({ tier, selected, onSelect, locked }) {
  const t = TIERS[tier]
  return (
    <button
      onClick={() => !locked && onSelect(tier)}
      disabled={locked && selected !== tier}
      className={`relative flex-1 min-w-[130px] rounded-2xl border p-4 text-left transition-all ${
        selected === tier
          ? 'border-primary bg-primary/10 ring-2 ring-primary'
          : locked
            ? 'border-border/30 bg-card/50 opacity-40 cursor-not-allowed'
            : 'border-border/60 bg-card hover:border-primary/40'
      }`}
    >
      {t.popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">MOST POPULAR</span>
      )}
      <div className="flex items-center gap-1.5 mb-2">
        {t.badge && <span className="text-lg">{t.badge}</span>}
        <span className="font-bold text-sm text-foreground">{t.label}</span>
      </div>
      <div className={`text-xl font-black mb-3 ${t.color}`}>
        {t.price === 0 ? 'FREE' : `$${t.price}`}
      </div>
      <ul className="space-y-1">
        {t.features.map(f => (
          <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1">
            <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      {selected === tier && (
        <div className="mt-3 w-full py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold text-center">Selected ✓</div>
      )}
    </button>
  )
}

function HonoreeSearch({ honoreeName, onSelectUser, onClear, selectedUser }) {
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!honoreeName || honoreeName.length < 2) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, headline, role')
        .ilike('full_name', `%${honoreeName}%`)
        .limit(5)
      setResults(data || [])
      setSearching(false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [honoreeName])

  if (selectedUser) {
    return (
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl p-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
          {selectedUser.avatar_url
            ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">{selectedUser.full_name?.[0]}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{selectedUser.full_name}</p>
          <p className="text-xs text-primary">✓ Linked to Philomni profile</p>
        </div>
        <button onClick={onClear} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (!honoreeName || honoreeName.length < 2) return null

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <Search className="w-3 h-3" /> Is <strong>{honoreeName}</strong> on Philomni?
      </p>
      {searching && <div className="text-xs text-muted-foreground py-2">Searching...</div>}
      {!searching && results.length > 0 && (
        <div className="space-y-1.5">
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">{u.full_name?.[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                {u.headline && <p className="text-xs text-muted-foreground truncate">{u.headline}</p>}
              </div>
              <span className="text-xs text-primary font-medium">Select →</span>
            </button>
          ))}
        </div>
      )}
      {!searching && results.length === 0 && honoreeName.length >= 2 && (
        <p className="text-xs text-muted-foreground py-1">Not found — that's OK, continue without linking</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CelebrationCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep]             = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef               = useRef(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Custom celebration types added by the user
  const [customTypes, setCustomTypes] = useState([])
  const [customTypeInput, setCustomTypeInput] = useState('')

  const addCustomType = () => {
    const label = customTypeInput.trim()
    if (!label) return
    const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (customTypes.some(t => t.type === key)) { setCustomTypeInput(''); return }
    const newType = { type: key, emoji: '🎊', label, gradient: 'from-purple-500 to-pink-500' }
    setCustomTypes(prev => [...prev, newType])
    set('celebration_type', key)
    setCustomTypeInput('')
  }

  const allTypes = [...CELEBRATION_TYPES, ...customTypes]

  // Sponsorship state
  const [activeSponsor, setActiveSponsor]   = useState(null)   // celebration_category_sponsorships row
  const [useSponsorship, setUseSponsorship] = useState(true)
  const [sponsorLoading, setSponsorLoading] = useState(false)

  const [form, setForm] = useState({
    honoree_name:      '',
    honoree_photo_url: '',
    honoree_user_id:   null,
    honoree_user:      null,
    honoree_email:     '',
    celebration_type:  '',
    relationship:      '',
    title:             '',
    message:           '',
    tier:              'featured',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ── Check for active sponsorship when type changes ─────────────────────────
  useEffect(() => {
    if (!form.celebration_type) { setActiveSponsor(null); return }
    setSponsorLoading(true)
    const now = new Date().toISOString()
    supabase
      .from('celebration_category_sponsorships')
      .select('*, company:company_id(id, name, logo_url)')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .or(`category_id.eq.${form.celebration_type},category_id.is.null`)
      .order('category_id', { ascending: false, nullsFirst: false }) // prefer specific over all-categories
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        // Check cap
        if (data && (data.cap_count == null || data.count_used < data.cap_count)) {
          setActiveSponsor(data)
          setUseSponsorship(true)
        } else {
          setActiveSponsor(null)
        }
        setSponsorLoading(false)
      })
  }, [form.celebration_type])

  const canAdvance = () => {
    if (step === 0) return form.honoree_name.trim().length > 0 && !!form.celebration_type
    if (step === 1) return form.title.trim().length > 0 && form.message.trim().length > 0
    if (step === 2) return !!form.tier
    return true
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setPhotoUploading(true)
    setUploadProgress(30)
    const url = await uploadPhoto(file)
    setUploadProgress(100)
    if (url) set('honoree_photo_url', url)
    setTimeout(() => setUploadProgress(0), 600)
    setPhotoUploading(false)
  }

  const handleSelectHonoreeUser = (u) => {
    set('honoree_user_id', u.id)
    set('honoree_user', u)
    if (u.avatar_url) set('honoree_photo_url', u.avatar_url)
  }

  const handleClearHonoreeUser = () => {
    set('honoree_user_id', null)
    set('honoree_user', null)
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  const publish = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const isSponsored = !!(activeSponsor && useSponsorship)
      // Sponsored celebrations get 'featured' tier for free
      const effectiveTier = isSponsored ? 'featured' : form.tier
      const tier = TIERS[effectiveTier]

      const payload = {
        creator_id:               user.id,
        honoree_name:             form.honoree_name.trim(),
        honoree_photo_url:        form.honoree_photo_url || null,
        honoree_user_id:          form.honoree_user_id || null,
        honoree_email:            form.honoree_email.trim() || null,
        celebration_type:         form.celebration_type,
        celebration_type_label:   typeInfo?.label || null,
        title:                    form.title.trim(),
        message:                  form.message.trim(),
        tier:                     effectiveTier,
        amount_paid:              isSponsored ? 0 : tier.price,
        status:                   'active',
        expires_at:               getExpiresAt(effectiveTier),
        shareable_code:           generateCode(),
        is_sponsored:             isSponsored,
        payment_status:           isSponsored ? 'sponsored' : (tier.price === 0 ? 'free' : 'pending'),
        category_sponsorship_id:  isSponsored ? activeSponsor.id : null,
        opted_out_of_sponsorship: activeSponsor ? !useSponsorship : false,
      }

      const { data, error } = await supabase
        .from('celebrations')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('CELEBRATION INSERT ERROR:', JSON.stringify(error))
        alert(`Error: ${error.message}\nDetails: ${error.details || '—'}\nHint: ${error.hint || '—'}`)
        return
      }

      // Update sponsorship usage counters
      if (isSponsored) {
        await supabase
          .from('celebration_category_sponsorships')
          .update({
            count_used:       (activeSponsor.count_used || 0) + 1,
            budget_used_usd:  (activeSponsor.budget_used_usd || 0) + (TIERS.featured.price),
          })
          .eq('id', activeSponsor.id)
      }

      // Notify honoree if Philomni user
      if (form.honoree_user_id) {
        supabase.from('notifications').insert({
          user_id:    form.honoree_user_id,
          type:       'celebration',
          title:      '🎉 Someone celebrated you!',
          message:    `${user.full_name || 'Someone'} created a celebration for you! ${form.title.trim()}`,
          link:       `/celebrations/${data.id}`,
          created_at: new Date().toISOString(),
          is_read:    false,
        }).then(null, () => null)
      }

      // Platform-wide notification for Grand / Spotlight tier
      if (effectiveTier === 'grand' || effectiveTier === 'spotlight') {
        supabase.from('notifications').insert({
          type:       'grand_celebration',
          title:      '🎉 Grand Celebration!',
          message:    `${form.title.trim()} — Join the celebration`,
          link:       `/celebrations/${data.id}`,
          is_global:  true,
          created_at: new Date().toISOString(),
        }).then(null, () => null)
      }

      navigate(`/celebrations/${data.id}`)
    } catch (err) {
      console.error('Unexpected publish error:', err)
      alert(`Unexpected error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const typeInfo = allTypes.find(t => t.type === form.celebration_type)
  const isSponsored = !!(activeSponsor && useSponsorship)
  const effectiveTier = isSponsored ? 'featured' : form.tier
  const tierInfo = TIERS[effectiveTier]
  const maxMsg = 1000
  const photoSrc = form.honoree_photo_url

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/celebrations')}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Create a Celebration</h1>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ─── STEP 0: WHO ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Who are we celebrating? *</label>
            <input
              value={form.honoree_name}
              onChange={e => set('honoree_name', e.target.value)}
              placeholder="Honoree's full name"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              maxLength={80}
            />
            {!form.honoree_user_id && (
              <HonoreeSearch
                honoreeName={form.honoree_name}
                onSelectUser={handleSelectHonoreeUser}
                onClear={handleClearHonoreeUser}
                selectedUser={form.honoree_user}
              />
            )}
            {form.honoree_user && (
              <HonoreeSearch
                honoreeName=""
                onSelectUser={handleSelectHonoreeUser}
                onClear={handleClearHonoreeUser}
                selectedUser={form.honoree_user}
              />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Their photo
              {form.honoree_user_id && <span className="text-xs text-primary ml-2">(auto-filled from profile)</span>}
            </label>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {photoSrc ? (
              <div className="relative w-24 h-24">
                <img src={photoSrc} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                {!form.honoree_user_id && (
                  <button
                    onClick={() => set('honoree_photo_url', '')}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
                  >×</button>
                )}
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                {photoUploading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-[9px]">{uploadProgress}%</span></>
                  : <><Upload className="w-5 h-5" /><span className="text-[10px]">Upload</span></>
                }
              </button>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">
              Type of celebration *
              {sponsorLoading && form.celebration_type && <span className="text-xs text-muted-foreground ml-2">Checking sponsorships…</span>}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allTypes.map(t => (
                <button
                  key={t.type}
                  onClick={() => set('celebration_type', t.type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    form.celebration_type === t.type
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border/60 bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
            {/* Custom type input */}
            <div className="mt-3 flex gap-2">
              <input
                value={customTypeInput}
                onChange={e => setCustomTypeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomType()}
                placeholder="Can't find yours? Type it here..."
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                maxLength={40}
              />
              <button
                onClick={addCustomType}
                disabled={!customTypeInput.trim()}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex-shrink-0"
              >
                + Add
              </button>
            </div>
            {/* Show sponsor teaser on step 0 if found */}
            {activeSponsor && !sponsorLoading && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                <Gift className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <strong>{activeSponsor.company?.name}</strong> is sponsoring {activeSponsor.category_id ? typeInfo?.label : 'all'} celebrations this period — you may get this free!
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Your relationship to them</label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map(r => (
                <button
                  key={r}
                  onClick={() => set('relationship', r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.relationship === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">
              Honoree's email <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="email"
              value={form.honoree_email}
              onChange={e => set('honoree_email', e.target.value)}
              placeholder="their@email.com"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">We'll send them a link to their celebration 🎉</p>
          </div>
        </div>
      )}

      {/* ─── STEP 1: MESSAGE ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Celebration title *</label>
              <span className="text-xs text-muted-foreground">{form.title.length}/80</span>
            </div>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value.slice(0, 80))}
              placeholder={`e.g. Happy 30th Birthday, ${form.honoree_name || 'Alex'}!`}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Your heartfelt message *</label>
              <span className={`text-xs ${form.message.length > maxMsg * 0.9 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {form.message.length}/{maxMsg}
              </span>
            </div>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value.slice(0, maxMsg))}
              placeholder="Write your message here... 🎉"
              rows={6}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 2: TIER ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          {/* Sponsorship banner */}
          {activeSponsor && (
            <div className={`mb-5 rounded-2xl border p-4 ${useSponsorship ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border/40 bg-muted/50'}`}>
              <div className="flex items-start gap-3">
                {activeSponsor.company?.logo_url
                  ? <img src={activeSponsor.company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><Gift className="w-5 h-5 text-emerald-500" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">
                    🎁 {activeSponsor.company?.name} is covering this celebration!
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeSponsor.company?.name} has sponsored {activeSponsor.category_id ? typeInfo?.label : 'all'} celebrations this period.
                    {useSponsorship ? ' Your celebration is FREE and gets the Featured tier.' : ' You\'ve opted out and will pay normally.'}
                  </p>
                  {activeSponsor.brand_message && (
                    <p className="text-xs italic text-muted-foreground mt-1.5 border-l-2 border-emerald-500/40 pl-2">"{activeSponsor.brand_message}"</p>
                  )}
                  {useSponsorship ? (
                    <button
                      onClick={() => setUseSponsorship(false)}
                      className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      I'd prefer not to have brand attribution — opt out and pay myself
                    </button>
                  ) : (
                    <button
                      onClick={() => setUseSponsorship(true)}
                      className="mt-2 text-xs text-primary underline underline-offset-2"
                    >
                      Actually, use sponsorship (get Featured free)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <h2 className="text-base font-bold text-foreground mb-4">
            {isSponsored ? 'Your tier (sponsored — Featured is free!)' : 'Choose your tier'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {Object.keys(TIERS).map(t => (
              <TierCard
                key={t}
                tier={t}
                selected={effectiveTier}
                onSelect={v => set('tier', v)}
                locked={isSponsored}
              />
            ))}
          </div>
          {isSponsored && (
            <p className="text-xs text-muted-foreground mt-3 text-center">Tier is locked to Featured while sponsorship is applied. Opt out above to choose any tier.</p>
          )}
        </div>
      )}

      {/* ─── STEP 3: PREVIEW & PAY ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-foreground">Preview</h2>

          {/* Preview card */}
          <div className={`rounded-2xl border overflow-hidden shadow-lg ${effectiveTier === 'grand' || effectiveTier === 'sponsored' ? 'border-yellow-400/60' : effectiveTier === 'featured' ? 'border-amber-400/60' : 'border-border/60'}`}>
            {photoSrc ? (
              <div className="relative h-48 overflow-hidden">
                <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-xl font-black">{form.title || 'Your title here'}</p>
                </div>
              </div>
            ) : (
              <div className={`h-32 bg-gradient-to-br ${typeInfo?.gradient || 'from-purple-500 to-blue-500'} flex items-center justify-center`}>
                <span className="text-5xl">{typeInfo?.emoji || '🎉'}</span>
              </div>
            )}
            <div className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <span>{typeInfo?.emoji}</span>
                <span>{typeInfo?.label}</span>
                {tierInfo.badge && <span className={`font-bold ${tierInfo.color}`}>{tierInfo.badge} {tierInfo.label}</span>}
                {isSponsored && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full ml-1">
                    Brought to you by {activeSponsor.company?.name}
                  </span>
                )}
              </div>
              <p className="font-bold text-foreground mb-1">{form.title || 'Your title'}</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{form.message || 'Your message...'}</p>
              <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                <p className="text-xs text-muted-foreground">Celebrating: <span className="font-medium text-foreground">{form.honoree_name}</span>
                  {form.honoree_user && <span className="text-primary ml-1">• Philomni user</span>}
                </p>
                <p className="text-xs text-muted-foreground">Posted by: <span className="font-medium text-foreground">{user?.full_name}</span></p>
              </div>
            </div>
          </div>

          {/* Payment / Summary */}
          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground">{tierInfo.badge} {tierInfo.label} Tier</p>
                <p className="text-sm text-muted-foreground">Duration: {tierInfo.duration} {tierInfo.duration === 1 ? 'day' : 'days'}</p>
              </div>
              <p className={`text-2xl font-black ${isSponsored ? 'text-emerald-500' : tierInfo.color}`}>
                {isSponsored ? 'FREE' : (tierInfo.price === 0 ? 'FREE' : `$${tierInfo.price}`)}
              </p>
            </div>

            {isSponsored && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                {activeSponsor.company?.logo_url
                  ? <img src={activeSponsor.company.logo_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  : <Gift className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                }
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <strong>{activeSponsor.company?.name}</strong> is covering this celebration. Featured tier at no cost to you. ✓
                </p>
              </div>
            )}

            {!isSponsored && tierInfo.price > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-xs text-amber-600 dark:text-amber-400">
                💳 Payment is processed securely. Your celebration goes live immediately after payment.
              </div>
            )}

            {form.honoree_email && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-xs text-primary">
                📧 A notification will be sent to {form.honoree_email}
              </div>
            )}
            {form.honoree_user_id && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-xs text-primary">
                🔔 {form.honoree_user?.full_name} will be notified on Philomni
              </div>
            )}

            <button
              onClick={publish}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: isSponsored ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #14b8a6, #f59e0b)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSponsored
                ? '🎁 Publish Free (Sponsored)'
                : tierInfo.price === 0
                  ? '🎉 Publish for Free'
                  : `💳 Pay $${tierInfo.price} & Publish`
              }
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={() => canAdvance() && setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
