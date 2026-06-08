import React, { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PAYMENT_CONFIG } from '../lib/payments'
import {
  ChevronLeft, ChevronRight, Upload, X, Loader2, Check, CreditCard, Megaphone,
} from 'lucide-react'

const stripePromise = PAYMENT_CONFIG?.stripe?.active
  ? loadStripe(PAYMENT_CONFIG.stripe.publishableKey)
  : null

const DAILY_FEED_RATE = 10 // $/day for feed placement

const PLACEMENT_OPTIONS = [
  { id: 'feed', title: 'Feed Placement', icon: '📱',
    description: 'Your ad appears between posts in the Philomni feed. Reaches everyone browsing.',
    bestFor: 'Brand awareness, broad reach', pricing: '$10 / day',
    reachEstimate: '500–2,000 people/day', whoEarns: 'Platform only' },
  { id: 'in_video', title: 'Content Placement', icon: '🎬',
    description: 'Your ad plays on creator videos before, during or after content.',
    bestFor: 'Targeted niche audiences', pricing: '$5 CPM (per 1,000 views)',
    reachEstimate: 'Depends on creator audience', whoEarns: '55% creators / 45% Philomni',
    badge: 'COMING SOON', disabled: true },
  { id: 'both', title: 'Premium — Both', icon: '🚀',
    description: 'Maximum reach. Feed placement + creator video ads simultaneously.',
    bestFor: 'Product launches, max exposure', pricing: '$15 / day + $5 CPM',
    reachEstimate: '1,000–5,000+ people/day', whoEarns: 'Feed: Philomni · Video: 55% creators',
    badge: 'BEST VALUE', disabled: true },
]

const GOALS = ['Brand Awareness', 'Drive Website Traffic', 'App Downloads', 'Product Sales', 'Event Promotion', 'Other']

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

// ── Step 5 payment form ───────────────────────────────────────────────────────
function PaymentForm({ totalBudget, campaign, creative, onDone }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true); setError(null)
    try {
      // 1. PaymentIntent (manual capture — captured on admin approval)
      const { data, error: fnErr } = await supabase.functions.invoke('create-ad-payment', {
        body: {
          userId: user.id, userEmail: user.email, totalAmount: totalBudget,
          adType: 'campaign', captureMethod: 'manual',
          campaignData: { name: campaign.name, brand_name: campaign.brandName, placement_type: campaign.placementType, website_url: campaign.websiteUrl },
        },
      })
      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)

      // 2. Confirm card (authorizes, does not charge yet)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { email: user.email } },
      })
      if (stripeError) throw new Error(stripeError.message)

      // 3. Save campaign (status pending → admin queue). Write new + legacy columns.
      const { data: camp, error: dbErr } = await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        name: campaign.name, title: campaign.name,
        brand_name: campaign.brandName,
        description: `${campaign.brandName} — ${campaign.goal}`,
        website_url: campaign.websiteUrl, cta_url: campaign.websiteUrl, cta_text: 'Learn More',
        campaign_goal: campaign.goal, placement_type: campaign.placementType,
        image_url: creative.file_type === 'image' ? creative.file_url : null,
        start_date: campaign.startDate, end_date: campaign.endDate,
        starts_at: campaign.startDate, ends_at: campaign.endDate,
        total_budget: totalBudget, budget: totalBudget, daily_budget: DAILY_FEED_RATE,
        package_type: 'feed',
        stripe_payment_intent_id: paymentIntent.id, stripe_payment_status: paymentIntent.status,
        status: 'pending',
      }).select().single()
      if (dbErr) throw dbErr

      // 4. Save creative
      await supabase.from('ad_creatives').insert({
        campaign_id: camp.id, advertiser_id: user.id,
        file_url: creative.file_url, file_type: creative.file_type,
        file_name: creative.file_name, file_size: creative.file_size,
        duration_seconds: creative.duration ?? null,
        thumbnail_url: creative.file_type === 'image' ? creative.file_url : null,
      }).catch(e => console.error('creative insert', e))

      // 5. Confirmation email (also notifies admin)
      supabase.functions.invoke('send-campaign-email', {
        body: { type: 'received', campaignId: camp.id, advertiserEmail: user.email, campaignName: campaign.name },
      }).catch(() => {})

      onDone()
    } catch (err) {
      console.error('[CreateCampaign] payment', err)
      setError(err.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="p-3.5 bg-white rounded-xl border border-border/40">
        <CardElement options={{ style: { base: { fontSize: '15px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={!stripe || loading}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><CreditCard className="w-4 h-4" /> Authorize ${totalBudget.toFixed(2)}</>}
      </button>
      <p className="text-[10px] text-muted-foreground text-center">
        🔒 Your card is authorized now and only charged once our team approves your campaign (within 24 h). If rejected, the hold is released — no charge.
      </p>
    </form>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function CreateCampaign() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [step, setStep] = useState(1)

  const [placementType, setPlacementType] = useState(null)
  const [name, setName]             = useState('')
  const [brandName, setBrandName]   = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [goal, setGoal]             = useState('')
  const [startDate, setStartDate]   = useState(tomorrow())
  const [endDate, setEndDate]       = useState('')

  // Creative
  const [creative, setCreative]   = useState(null)  // { file_url, file_type, file_name, file_size, duration }
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const d = Math.ceil((new Date(endDate) - new Date(startDate)) / 86_400_000)
    return d > 0 ? d : 0
  }, [startDate, endDate])
  const totalBudget = Math.max(DAILY_FEED_RATE, durationDays * DAILY_FEED_RATE)

  const handleFile = async (file) => {
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return toast.error('Upload an image or video')
    if (isImage && file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    if (isVideo && file.size > 50 * 1024 * 1024) return toast.error('Video must be under 50MB')

    let duration = null
    if (isVideo) {
      duration = await new Promise(res => {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => res(v.duration)
        v.onerror = () => res(null)
        v.src = URL.createObjectURL(file)
      })
      if (duration && duration > 60) return toast.error('Video must be 60 seconds or less')
    }

    setUploading(true); setUploadPct(30)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('ad-creatives').upload(path, file, { upsert: true })
      setUploadPct(80)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('ad-creatives').getPublicUrl(data.path)
      setCreative({ file_url: publicUrl, file_type: isVideo ? 'video' : 'image', file_name: file.name, file_size: file.size, duration })
      setUploadPct(100)
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  const canNext = {
    1: !!placementType,
    2: name.trim() && brandName.trim() && websiteUrl.trim() && goal,
    3: !!creative,
    4: durationDays >= 1,
    5: true,
  }[step]

  const Progress = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">Step {step} of 5</p>
        <button onClick={() => navigate('/advertise')} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }} />
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-5">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Create Campaign</h1>
      </div>
      <Progress />

      {/* STEP 1 — Placement */}
      {step === 1 && (
        <div className="space-y-3">
          {PLACEMENT_OPTIONS.map(opt => (
            <button key={opt.id} disabled={opt.disabled}
              onClick={() => !opt.disabled && setPlacementType(opt.id)}
              className={`w-full text-left rounded-2xl border p-5 transition-all relative ${
                opt.disabled ? 'opacity-50 cursor-not-allowed border-border'
                : placementType === opt.id ? 'border-primary ring-1 ring-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
              }`}>
              {opt.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{opt.badge}</span>
              )}
              <div className="flex items-center gap-2 mb-1"><span className="text-2xl">{opt.icon}</span>
                <p className="font-bold text-foreground">{opt.title}</p></div>
              <p className="text-sm text-muted-foreground mb-2">{opt.description}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <p><span className="text-muted-foreground">Best for:</span> {opt.bestFor}</p>
                <p><span className="text-muted-foreground">Pricing:</span> {opt.pricing}</p>
                <p><span className="text-muted-foreground">Reach:</span> {opt.reachEstimate}</p>
                <p><span className="text-muted-foreground">Earnings:</span> {opt.whoEarns}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — Details */}
      {step === 2 && (
        <div className="space-y-4">
          {[
            { label: 'Campaign Name', val: name, set: setName, ph: 'Internal reference, e.g. Summer Launch' },
            { label: 'Brand / Company Name', val: brandName, set: setBrandName, ph: 'Shown on the ad' },
            { label: 'Website URL', val: websiteUrl, set: setWebsiteUrl, ph: 'https://yoursite.com', type: 'url' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
              <input type={f.type || 'text'} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select a goal…</option>
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* STEP 3 — Creative */}
      {step === 3 && (
        <div className="space-y-3">
          {!creative ? (
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
              className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Drag a file or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">Image: JPG/PNG, max 5MB · 1080×1080 recommended</p>
                  <p className="text-xs text-muted-foreground">Video: MP4/MOV, max 50MB / 60s · 1080×1080 recommended</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              {creative.file_type === 'video'
                ? <video src={creative.file_url} controls className="w-full max-h-72 bg-black object-contain" />
                : <img src={creative.file_url} alt="" className="w-full max-h-72 object-contain bg-black" />}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{creative.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(creative.file_size / 1024 / 1024).toFixed(1)}MB
                    {creative.duration ? ` · ${Math.round(creative.duration)}s` : ''}
                  </p>
                </div>
                <button onClick={() => setCreative(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Schedule & budget */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
              <input type="date" min={tomorrow()} value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
              <input type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-foreground mb-2">Campaign Summary</p>
            <Row label="Placement" value="Feed" />
            <Row label="Duration" value={`${durationDays} day${durationDays !== 1 ? 's' : ''}`} />
            <Row label="Daily reach" value="500–2,000" />
            <Row label="Daily cost" value={`$${DAILY_FEED_RATE.toFixed(2)}`} />
            <div className="border-t border-border my-2" />
            <Row label="Total" value={`$${totalBudget.toFixed(2)}`} bold />
          </div>
          {durationDays < 1 && <p className="text-xs text-amber-500">Select an end date at least 1 day after start (minimum budget $10).</p>}
        </div>
      )}

      {/* STEP 5 — Review & pay */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-foreground mb-2">Review</p>
            <Row label="Campaign" value={name} />
            <Row label="Brand" value={brandName} />
            <Row label="Website" value={websiteUrl} />
            <Row label="Goal" value={goal} />
            <Row label="Schedule" value={`${startDate} → ${endDate} (${durationDays}d)`} />
            <div className="border-t border-border my-2" />
            <Row label="Total to authorize" value={`$${totalBudget.toFixed(2)}`} bold />
          </div>
          {creative && (
            <div className="rounded-xl overflow-hidden border border-border">
              {creative.file_type === 'video'
                ? <video src={creative.file_url} muted className="w-full max-h-48 object-contain bg-black" />
                : <img src={creative.file_url} alt="" className="w-full max-h-48 object-contain bg-black" />}
            </div>
          )}
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                totalBudget={totalBudget}
                campaign={{ name, brandName, websiteUrl, goal, placementType, startDate, endDate }}
                creative={creative}
                onDone={() => navigate('/my-campaigns?submitted=true')}
              />
            </Elements>
          ) : (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">Stripe is not configured.</p>
          )}
        </div>
      )}

      {/* Nav buttons */}
      {step < 5 && (
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/advertise')}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {step === 5 && (
        <button onClick={() => setStep(4)} className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to budget
        </button>
      )}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-bold text-foreground text-base' : 'text-foreground'}>{value}</span>
    </div>
  )
}
