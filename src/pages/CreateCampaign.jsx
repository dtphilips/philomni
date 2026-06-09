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

const DAILY_FEED_RATE = 10   // $/day for feed placement
const CPM_RATE        = 5    // $ per 1,000 video views
const MIN_CPM_BUDGET  = 50   // minimum in-video budget

const PLACEMENT_OPTIONS = [
  { id: 'feed', title: 'Feed Placement', icon: '📱',
    description: 'Your ad appears between posts in the Philomni feed. Reaches everyone browsing.',
    bestFor: 'Brand awareness, broad reach', pricing: '$10 / day',
    reachEstimate: '500–2,000 people/day', whoEarns: 'Platform only' },
  { id: 'in_video', title: 'Content Placement', icon: '🎬',
    description: 'Your ad plays on creator videos before, during or after content.',
    bestFor: 'Targeted niche audiences', pricing: '$5 CPM · $5 per 1,000 video views',
    reachEstimate: 'Depends on creator audience', whoEarns: '55% creators / 45% Philomni' },
  { id: 'both', title: 'Premium — Both', icon: '🚀',
    description: 'Maximum reach. Feed placement + creator video ads simultaneously.',
    bestFor: 'Product launches, max exposure', pricing: '$10/day feed + $5 CPM video',
    reachEstimate: '1,000–5,000+ people/day', whoEarns: 'Feed: Philomni · Video: 55% creators',
    badge: 'BEST VALUE' },
]

const GOALS = ['Brand Awareness', 'Drive Website Traffic', 'App Downloads', 'Product Sales', 'Event Promotion', 'Other']

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

/** Daily rate for feed portion: feed=$10/d, in_video=$0/d (CPM), both=$10/d */
const getDailyRate = (placement) => placement === 'in_video' ? 0 : DAILY_FEED_RATE

const isValidUrl = (url) => {
  try { return Boolean(new URL(url)) } catch { return false }
}

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
          campaignData: {
            name: campaign.name, brand_name: campaign.brandName,
            placement_type: campaign.placementType, website_url: campaign.websiteUrl,
          },
        },
      })
      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)

      // 2. Confirm card (authorizes, does not charge yet)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { email: user.email } },
      })
      if (stripeError) throw new Error(stripeError.message)

      // 3. Save campaign (status pending → admin queue)
      const { data: camp, error: dbErr } = await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        name: campaign.name, title: campaign.name,
        brand_name: campaign.brandName,
        description: `${campaign.brandName} — ${campaign.goal}`,
        website_url: campaign.websiteUrl,
        cta_url: campaign.websiteUrl,
        cta_text: 'Learn More',
        campaign_goal: campaign.goal,
        placement_type: campaign.placementType,
        // goal-specific URL columns
        ios_url:    campaign.iosUrl    || null,
        android_url: campaign.androidUrl || null,
        ticket_url: campaign.ticketUrl || null,
        image_url:  creative.file_type === 'image' ? creative.file_url : null,
        start_date: campaign.startDate || null,
        end_date:   campaign.endDate   || null,
        starts_at:  campaign.startDate || null,
        ends_at:    campaign.endDate   || null,
        total_budget:  totalBudget,
        budget:        totalBudget,
        daily_budget:  getDailyRate(campaign.placementType),
        package_type:  campaign.placementType,
        // CPM columns
        cpm_bid:    campaign.placementType !== 'feed' ? CPM_RATE : null,
        cpm_budget: campaign.placementType !== 'feed' ? campaign.cpmBudget : null,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status:    paymentIntent.status,
        status: 'under_review',
      }).select().single()
      if (dbErr) {
        console.error('[CreateCampaign] campaign insert:', dbErr)
        throw new Error(dbErr.message || 'Failed to save campaign. Please try again.')
      }

      // 4. Save creative
      const { error: creativeErr } = await supabase.from('ad_creatives').insert({
        campaign_id: camp.id, advertiser_id: user.id,
        file_url: creative.file_url, file_type: creative.file_type,
        file_name: creative.file_name, file_size: creative.file_size,
        duration_seconds: creative.duration ?? null,
        thumbnail_url: creative.file_type === 'image' ? creative.file_url : null,
      })
      if (creativeErr) console.error('[CreateCampaign] creative insert:', creativeErr)

      // 5. Confirmation email (fire-and-forget — don't block on this)
      supabase.functions.invoke('send-campaign-email', {
        body: { type: 'received', campaignId: camp.id, advertiserEmail: user.email, campaignName: campaign.name },
      }).then(({ error: emailErr }) => { if (emailErr) console.warn('campaign email:', emailErr) })

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
  const [iosUrl, setIosUrl]         = useState('')
  const [androidUrl, setAndroidUrl] = useState('')
  const [ticketUrl, setTicketUrl]   = useState('')
  const [goal, setGoal]             = useState('')
  const [startDate, setStartDate]   = useState(tomorrow())
  const [endDate, setEndDate]       = useState('')
  const [cpmBudget, setCpmBudget]   = useState(MIN_CPM_BUDGET)

  // Creative
  const [creative, setCreative]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const isInVideo  = placementType === 'in_video'
  const isFeed     = placementType === 'feed'
  const isBoth     = placementType === 'both'
  const hasFeedPart = isFeed || isBoth
  const hasCpmPart  = isInVideo || isBoth

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const d = Math.ceil((new Date(endDate) - new Date(startDate)) / 86_400_000)
    return d > 0 ? d : 0
  }, [startDate, endDate])

  // Placement-aware total budget
  const totalBudget = useMemo(() => {
    const feedCost  = hasFeedPart ? Math.max(DAILY_FEED_RATE, durationDays * DAILY_FEED_RATE) : 0
    const videoCost = hasCpmPart  ? (cpmBudget || 0) : 0
    return feedCost + videoCost
  }, [hasFeedPart, hasCpmPart, durationDays, cpmBudget])

  // Estimated video views from CPM budget
  const estimatedViews = useMemo(() => {
    if (!hasCpmPart || !cpmBudget) return 0
    return Math.round((cpmBudget / CPM_RATE) * 1000)
  }, [hasCpmPart, cpmBudget])

  // Step 2 URL validation
  const validateStep2 = () => {
    if (!name.trim())      { toast.error('Campaign name is required'); return false }
    if (!brandName.trim()) { toast.error('Brand name is required'); return false }
    if (!goal)             { toast.error('Please select a campaign goal'); return false }

    if (goal === 'App Downloads') {
      if (!iosUrl && !androidUrl) {
        toast.error('Add at least one app store URL (App Store or Google Play)')
        return false
      }
      if (iosUrl && !isValidUrl(iosUrl)) {
        toast.error('App Store URL is not valid — must start with https://')
        return false
      }
      if (androidUrl && !isValidUrl(androidUrl)) {
        toast.error('Google Play URL is not valid — must start with https://')
        return false
      }
    } else if (goal === 'Event Promotion') {
      if (!ticketUrl.trim()) { toast.error('Ticket URL is required for Event Promotion'); return false }
      if (!isValidUrl(ticketUrl)) { toast.error('Ticket URL is not valid — must start with https://'); return false }
    } else {
      if (!websiteUrl.trim()) { toast.error('Website URL is required'); return false }
      if (!isValidUrl(websiteUrl)) { toast.error('Website URL is not valid — must start with https://'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return
    setStep(step + 1)
  }

  const canNext = {
    1: !!placementType,
    2: true, // validated in handleNext → validateStep2
    3: !!creative,
    4: isInVideo ? cpmBudget >= MIN_CPM_BUDGET
       : isFeed  ? durationDays >= 1
       : /* both */ durationDays >= 1 && cpmBudget >= MIN_CPM_BUDGET,
    5: true,
  }[step]

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
            <button key={opt.id}
              onClick={() => setPlacementType(opt.id)}
              className={`w-full text-left rounded-2xl border p-5 transition-all relative ${
                placementType === opt.id ? 'border-primary ring-1 ring-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
              }`}>
              {opt.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">{opt.badge}</span>
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
          {/* Always-present fields */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Internal reference, e.g. Summer Launch"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Brand / Company Name</label>
            <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)}
              placeholder="Shown on the ad"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Goal selector — placed before URL fields so user picks goal first */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select a goal…</option>
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Goal-specific URL fields */}
          {goal === 'App Downloads' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">🍎 App Store URL (iOS)</label>
                <input type="url" value={iosUrl} onChange={e => setIosUrl(e.target.value)}
                  placeholder="https://apps.apple.com/…"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">🤖 Google Play URL (Android)</label>
                <input type="url" value={androidUrl} onChange={e => setAndroidUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=…"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">At least one store URL required. Users see the right store for their device.</p>
            </>
          )}

          {goal === 'Event Promotion' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">🎟️ Ticket / Registration URL</label>
                <input type="url" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)}
                  placeholder="https://eventbrite.com/… or your ticketing page"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">🌐 Event Website <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://myevent.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </>
          )}

          {goal && goal !== 'App Downloads' && goal !== 'Event Promotion' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">🌐 Website URL</label>
              <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}
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
          {/* Feed date pickers (not shown for in_video) */}
          {hasFeedPart && (
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
          )}

          {/* CPM budget input (for in_video and both) */}
          {hasCpmPart && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                🎬 In-Video Ad Budget
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (${CPM_RATE} CPM · minimum ${MIN_CPM_BUDGET})
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min={MIN_CPM_BUDGET}
                  step={10}
                  value={cpmBudget}
                  onChange={e => setCpmBudget(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {cpmBudget >= MIN_CPM_BUDGET && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  ≈ {estimatedViews.toLocaleString()} video views estimated
                </p>
              )}
              {cpmBudget > 0 && cpmBudget < MIN_CPM_BUDGET && (
                <p className="text-xs text-amber-500 mt-1.5">Minimum in-video budget is ${MIN_CPM_BUDGET}.</p>
              )}
            </div>
          )}

          {/* Summary card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-foreground mb-2">Campaign Summary</p>
            {hasFeedPart && (
              <>
                <Row label="Feed placement" value={durationDays > 0 ? `${durationDays} day${durationDays !== 1 ? 's' : ''}` : '—'} />
                <Row label="Feed daily cost" value={`$${DAILY_FEED_RATE.toFixed(2)}/day`} />
                <Row label="Feed subtotal" value={durationDays >= 1 ? `$${(durationDays * DAILY_FEED_RATE).toFixed(2)}` : '—'} />
              </>
            )}
            {hasCpmPart && (
              <>
                <Row label="In-video budget" value={`$${(cpmBudget || 0).toFixed(2)}`} />
                <Row label="CPM rate" value={`$${CPM_RATE.toFixed(2)} per 1k views`} />
                {estimatedViews > 0 && <Row label="Est. video views" value={estimatedViews.toLocaleString()} />}
              </>
            )}
            <div className="border-t border-border my-2" />
            <Row label="Total" value={`$${totalBudget.toFixed(2)}`} bold />
          </div>

          {hasFeedPart && durationDays < 1 && (
            <p className="text-xs text-amber-500">Select an end date at least 1 day after start date.</p>
          )}
        </div>
      )}

      {/* STEP 5 — Review & pay */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-foreground mb-2">Review</p>
            <Row label="Campaign" value={name} />
            <Row label="Brand" value={brandName} />
            <Row label="Goal" value={goal} />
            <Row label="Placement" value={
              isInVideo ? 'In-Video (CPM)' : isFeed ? 'Feed' : 'Feed + In-Video'
            } />
            {/* Goal-specific URL preview */}
            {goal === 'App Downloads' && (
              <>
                {iosUrl    && <Row label="App Store"    value={iosUrl.replace(/^https?:\/\//, '')} />}
                {androidUrl && <Row label="Google Play" value={androidUrl.replace(/^https?:\/\//, '')} />}
              </>
            )}
            {goal === 'Event Promotion' && ticketUrl && (
              <Row label="Ticket URL" value={ticketUrl.replace(/^https?:\/\//, '')} />
            )}
            {goal !== 'App Downloads' && websiteUrl && (
              <Row label="Website" value={websiteUrl.replace(/^https?:\/\//, '')} />
            )}
            {/* Schedule */}
            {hasFeedPart && startDate && endDate && (
              <Row label="Schedule" value={`${startDate} → ${endDate} (${durationDays}d)`} />
            )}
            <div className="border-t border-border my-2" />
            {/* Budget breakdown */}
            {hasFeedPart && <Row label="Feed cost" value={`$${(durationDays * DAILY_FEED_RATE).toFixed(2)}`} />}
            {hasCpmPart  && <Row label="In-video budget" value={`$${(cpmBudget || 0).toFixed(2)}`} />}
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
                campaign={{
                  name, brandName, goal, placementType,
                  websiteUrl: websiteUrl || ticketUrl || iosUrl || androidUrl || '',
                  iosUrl, androidUrl, ticketUrl,
                  startDate: hasFeedPart ? startDate : null,
                  endDate:   hasFeedPart ? endDate   : null,
                  cpmBudget: hasCpmPart  ? cpmBudget : 0,
                }}
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
          <button onClick={() => canNext && handleNext()} disabled={!canNext}
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
