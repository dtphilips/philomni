import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, ArrowLeft, ArrowRight, Check, Upload, ChevronLeft } from 'lucide-react'
import {
  CELEBRATION_TYPES, TIERS, RELATIONSHIPS,
  getExpiresAt, makeShareableCode,
} from '../lib/celebrations'

const STEPS = ['Who', 'Message', 'Tier', 'Preview']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex flex-col items-center ${i > 0 ? 'ml-0' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? 'bg-primary text-primary-foreground' :
              i === current ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${i === current ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 mx-2 mb-3 transition-colors ${i < current ? 'bg-primary' : 'bg-muted'}`} style={{ width: 32 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function TierCard({ tier, selected, onSelect }) {
  const t = TIERS[tier]
  return (
    <button
      onClick={() => onSelect(tier)}
      className={`flex-1 min-w-[140px] rounded-2xl border p-4 text-left transition-all relative ${
        selected === tier
          ? 'border-primary bg-primary/10 ring-2 ring-primary'
          : 'border-border/60 bg-card hover:border-primary/40'
      } ${t.popular ? 'shadow-lg' : ''}`}
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

export default function CelebrationCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef(null)
  const mediaInputRef = useRef(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    honoree_name:       '',
    honoree_photo_url:  '',
    celebration_type:   '',
    relationship:       '',
    title:              '',
    message:            '',
    media_url:          '',
    tier:               'basic',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Step validation
  const canAdvance = () => {
    if (step === 0) return form.honoree_name.trim() && form.celebration_type
    if (step === 1) return form.title.trim() && form.message.trim()
    if (step === 2) return !!form.tier
    return true
  }

  // Upload honoree photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setPhotoUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `celebrations/${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      set('honoree_photo_url', publicUrl)
    }
    setPhotoUploading(false)
  }

  // Publish
  const publish = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const tier = TIERS[form.tier]
      const payload = {
        creator_id:       user.id,
        creator_name:     user.full_name || user.email,
        creator_avatar:   user.avatar_url || null,
        honoree_name:     form.honoree_name.trim(),
        honoree_photo_url:form.honoree_photo_url || null,
        celebration_type: form.celebration_type,
        relationship:     form.relationship || null,
        title:            form.title.trim(),
        message:          form.message.trim(),
        media_url:        form.media_url || null,
        tier:             form.tier,
        tier_price:       tier.price,
        payment_status:   tier.price === 0 ? 'free' : 'pending',
        shareable_code:   makeShareableCode(),
        status:           'active',
        is_pinned:        form.tier === 'featured' || form.tier === 'grand' || form.tier === 'sponsored',
        expires_at:       getExpiresAt(form.tier),
      }
      const { data, error } = await supabase.from('celebrations').insert(payload).select().single()
      if (error) throw error

      // Send platform notification for Grand / Sponsored
      if (form.tier === 'grand' || form.tier === 'sponsored') {
        await supabase.from('notifications').insert({
          type:    'grand_celebration',
          title:   `🎉 Grand Celebration!`,
          message: `${form.title} — Join the celebration`,
          link:    `/celebrations/${data.id}`,
          is_global: true,
          created_at: new Date().toISOString(),
        }).catch(() => null) // Non-fatal
      }

      navigate(`/celebrations/${data.id}`)
    } catch (err) {
      console.error(err)
      alert('Failed to publish. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const typeInfo = CELEBRATION_TYPES.find(t => t.type === form.celebration_type)
  const tierInfo = TIERS[form.tier]
  const maxMessage = form.tier === 'basic' ? 500 : 1000

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/celebrations')} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Create a Celebration</h1>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── STEP 0: WHO ── */}
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
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Their photo</label>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {form.honoree_photo_url ? (
              <div className="relative w-24 h-24">
                <img src={form.honoree_photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                <button onClick={() => set('honoree_photo_url', '')} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center">×</button>
              </div>
            ) : (
              <button onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                {photoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-[10px]">Upload</span></>}
              </button>
            )}
          </div>

          {/* Type selector */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">Type of celebration *</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CELEBRATION_TYPES.map(t => (
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
          </div>

          {/* Relationship */}
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
        </div>
      )}

      {/* ── STEP 1: MESSAGE ── */}
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
              <span className={`text-xs ${form.message.length > maxMessage * 0.9 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {form.message.length}/{maxMessage}
              </span>
            </div>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value.slice(0, maxMessage))}
              placeholder="Write your message here... 🎉"
              rows={6}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
            {form.tier === 'basic' && (
              <p className="text-xs text-muted-foreground mt-1">Upgrade to a paid tier for up to 1,000 characters.</p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: TIER ── */}
      {step === 2 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Choose your tier</h2>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {Object.keys(TIERS).map(t => (
              <TierCard key={t} tier={t} selected={form.tier} onSelect={v => set('tier', v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: PREVIEW & PAY ── */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-foreground">Preview</h2>

          {/* Preview card */}
          <div className={`rounded-2xl border overflow-hidden shadow-lg ${form.tier === 'grand' || form.tier === 'sponsored' ? 'border-yellow-400/60' : 'border-border/60'}`}>
            {form.honoree_photo_url ? (
              <div className="relative h-48 overflow-hidden">
                <img src={form.honoree_photo_url} alt="" className="w-full h-full object-cover" />
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
              </div>
              <p className="font-bold text-foreground mb-1">{form.title || 'Your title'}</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{form.message || 'Your message...'}</p>
              <p className="text-xs text-muted-foreground mt-2">Celebrating: <span className="font-medium text-foreground">{form.honoree_name}</span></p>
              <p className="text-xs text-muted-foreground">Posted by: <span className="font-medium text-foreground">{user?.full_name}</span></p>
            </div>
          </div>

          {/* Payment section */}
          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground">{tierInfo.badge} {tierInfo.label} Tier</p>
                <p className="text-sm text-muted-foreground">Duration: {tierInfo.duration} {tierInfo.duration === 1 ? 'day' : 'days'}</p>
              </div>
              <p className={`text-2xl font-black ${tierInfo.color}`}>
                {tierInfo.price === 0 ? 'FREE' : `$${tierInfo.price}`}
              </p>
            </div>
            {tierInfo.price > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-xs text-amber-600 dark:text-amber-400">
                💳 Payment processing coming soon. Your celebration will be saved as pending and published once payment is set up.
              </div>
            )}
            <button
              onClick={publish}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {tierInfo.price === 0 ? '🎉 Publish for Free' : `💳 Pay $${tierInfo.price} & Publish`}
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
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
