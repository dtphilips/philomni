import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Megaphone, Upload, Eye, MousePointer, Zap, Star, Crown,
  Loader2, ExternalLink, ImageIcon, ChevronRight, Check,
  Rocket, TrendingUp, Users, Target,
} from 'lucide-react'
import {
  PAYMENT_CONFIG,
  PROVIDER_BADGES,
  getUserCountry,
  getPaymentProvider,
  loadPaystackScript,
  openPaystackPopup,
  loadFlutterwaveScript,
  openFlutterwaveCheckout,
  createPaymentIntent,
  recordPayment,
} from '../lib/payments'

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    period: '/month',
    impressions: '50,000',
    impressions_limit: 50000,
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
    features: ['50K impressions/month', 'Feed placement', 'Basic analytics', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 799,
    period: '/month',
    impressions: '200,000',
    impressions_limit: 200000,
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/40',
    popular: true,
    features: ['200K impressions/month', 'Feed + banner placement', 'Priority placement', 'Bi-weekly strategy calls', 'Advanced analytics'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    period: '/month',
    impressions: 'Unlimited',
    impressions_limit: null,
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/30',
    features: ['Unlimited impressions', 'All placements', 'Dedicated account manager', 'Custom reporting', 'Priority support'],
  },
]

const BOOST_OPTIONS = [
  { id: 'quick', label: 'Quick Boost', price: 10, impressions: 5000, days: 7 },
  { id: 'standard', label: 'Standard Boost', price: 25, impressions: 15000, days: 14 },
  { id: 'power', label: 'Power Boost', price: 50, impressions: 40000, days: 30 },
]

const REACH_OPTIONS = [
  { value: 'broad', label: 'Broad', desc: 'Reach everyone on Philomni' },
  { value: 'niche', label: 'Niche', desc: 'Similar creators & audiences' },
  { value: 'followers_of_followers', label: 'Followers of followers', desc: 'Extended network reach' },
]

async function uploadMedia(file) {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl
}

export default function Advertise() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'boost' ? 'boost' : 'campaign'
  const preselectedPostId = searchParams.get('postId') || null

  const [tab, setTab] = useState(initialTab)

  // — Campaign state —
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    title: '', description: '', cta_text: 'Learn More', cta_url: '',
    target_roles: 'all', start_date: '', end_date: '',
  })
  const [campaignMedia, setCampaignMedia] = useState(null)
  const [campaignPreview, setCampaignPreview] = useState(null)
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [campaignDone, setCampaignDone] = useState(false)

  // — Boost state —
  const [userPosts, setUserPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedBoost, setSelectedBoost] = useState(null)
  const [reachType, setReachType] = useState('broad')
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostDone, setBoostDone] = useState(false)

  // — Payment state —
  const [payLoading, setPayLoading] = useState(false)
  const [emailModalData, setEmailModalData] = useState(null) // { subject, pkg } → show email modal

  const setC = (k, v) => setCampaignForm(prev => ({ ...prev, [k]: v }))

  // ── Shared: launch whichever provider is right for the user's country ──────
  const launchProviderPayment = async ({ amount, currency, type, metadata, onSuccess, onEmailFallback }) => {
    const country  = await getUserCountry()
    const provider = getPaymentProvider(country)

    if (!provider) {
      // No active keys at all → email fallback
      onEmailFallback()
      return
    }

    if (provider === 'paystack') {
      setPayLoading(true)
      try {
        await loadPaystackScript()
        const amountKobo = Math.round(amount * 1500 * 100)
        const intent = await createPaymentIntent(supabase, {
          userId: user.id, amount: amountKobo, currency: 'ngn', type, metadata,
        })
        openPaystackPopup({
          email: user.email, amountKobo, currency: 'NGN',
          metadata: { ...metadata, payment_intent_id: intent.id },
          onSuccess: async (reference) => {
            await recordPayment(supabase, { paymentIntentId: intent.id, providerPaymentId: reference })
            setPayLoading(false)
            onSuccess()
          },
          onClose: () => setPayLoading(false),
        })
      } catch {
        toast.error('Payment failed. Please try again.')
        setPayLoading(false)
      }
      return
    }

    if (provider === 'flutterwave') {
      setPayLoading(true)
      try {
        await loadFlutterwaveScript()
        openFlutterwaveCheckout({
          email: user.email, name: user.full_name ?? user.email,
          amount, currency: currency.toUpperCase(),
          txRef: `phi-${type}-${Date.now()}`,
          metadata: { ...metadata, description: `Philomni ${type}` },
          onSuccess: async (reference) => {
            await supabase.from('payment_intents').insert({
              user_id: user.id, amount: Math.round(amount * 100),
              currency: currency.toLowerCase(), type, provider: 'flutterwave',
              status: 'completed', provider_payment_id: String(reference),
              metadata, created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
            })
            setPayLoading(false)
            onSuccess()
          },
          onClose: () => setPayLoading(false),
        })
      } catch {
        toast.error('Payment failed. Please try again.')
        setPayLoading(false)
      }
      return
    }

    // Stripe → email fallback for ad packages (no embedded form needed here)
    onEmailFallback()
  }

  // ── Campaign "Get Started" ────────────────────────────────────────────────
  const handleCampaignPayment = async () => {
    if (!selectedPkg) { toast.error('Select a package first'); return }
    const pkg = PACKAGES.find(p => p.id === selectedPkg)
    if (!pkg) return

    await launchProviderPayment({
      amount:   pkg.price,
      currency: 'usd',
      type:     'campaign',
      metadata: { package: pkg.id },
      onSuccess: () => {
        toast.success('Payment confirmed! Fill in your campaign details.')
        setShowCampaignForm(true)
      },
      onEmailFallback: () => setEmailModalData({
        subject: `Ad Campaign - ${pkg.name} Package ($${pkg.price}/mo)`,
        pkg,
      }),
    })
  }

  // ── Boost payment ─────────────────────────────────────────────────────────
  const handleBoostPayment = async () => {
    if (!selectedPost) { toast.error('Select a post to boost'); return }
    if (!selectedBoost) { toast.error('Select a boost option'); return }
    const opt = BOOST_OPTIONS.find(o => o.id === selectedBoost)
    if (!opt) return

    await launchProviderPayment({
      amount:   opt.price,
      currency: 'usd',
      type:     'boost',
      metadata: { post_id: selectedPost.id, boost_option: opt.id },
      onSuccess: async () => {
        toast.success('Payment confirmed! Submitting boost…')
        await handleBoostSubmit()
      },
      onEmailFallback: () => setEmailModalData({
        subject: `Post Boost - ${opt.label} ($${opt.price})`,
        pkg: { name: opt.label, price: opt.price },
      }),
    })
  }

  // Fetch user posts for boost tab
  useEffect(() => {
    if (tab !== 'boost' || !user?.id) return
    setPostsLoading(true)
    supabase.from('posts').select('id, content, media_urls, media_type, like_count, comment_count, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setUserPosts(data || []); setPostsLoading(false) })
  }, [tab, user?.id])

  // Pre-select post if postId in URL
  useEffect(() => {
    if (!preselectedPostId || !userPosts.length) return
    const post = userPosts.find(p => p.id === preselectedPostId)
    if (post) setSelectedPost(post)
  }, [preselectedPostId, userPosts])

  const handleCampaignSubmit = async (e) => {
    e.preventDefault()
    if (!campaignForm.title.trim()) { toast.error('Campaign title is required'); return }
    if (!campaignForm.cta_url.trim()) { toast.error('CTA URL is required'); return }
    if (!selectedPkg) { toast.error('Select a package'); return }
    setCampaignLoading(true)
    try {
      let imageUrl = null
      if (campaignMedia) imageUrl = await uploadMedia(campaignMedia)
      const pkg = PACKAGES.find(p => p.id === selectedPkg)
      await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        title: campaignForm.title,
        description: campaignForm.description,
        image_url: imageUrl,
        cta_text: campaignForm.cta_text,
        cta_url: campaignForm.cta_url,
        package_type: selectedPkg,
        budget: pkg.price,
        impressions_limit: pkg.impressions_limit,
        target_roles: campaignForm.target_roles !== 'all' ? [campaignForm.target_roles] : null,
        starts_at: campaignForm.start_date || null,
        ends_at: campaignForm.end_date || null,
        status: 'pending',
      })
      setCampaignDone(true)
    } catch (err) {
      toast.error(err.message)
    }
    setCampaignLoading(false)
  }

  const handleBoostSubmit = async () => {
    if (!selectedPost) { toast.error('Select a post to boost'); return }
    if (!selectedBoost) { toast.error('Select a boost option'); return }
    setBoostLoading(true)
    try {
      const opt = BOOST_OPTIONS.find(o => o.id === selectedBoost)
      const endsAt = new Date(Date.now() + opt.days * 86400000).toISOString()
      await supabase.from('boosted_posts').insert({
        post_id: selectedPost.id,
        creator_id: user.id,
        budget: opt.price,
        impressions_limit: opt.impressions,
        reach_type: reachType,
        ends_at: endsAt,
        status: 'pending',
      })
      setBoostDone(true)
    } catch (err) {
      toast.error(err.message)
    }
    setBoostLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Advertise on Philomni</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
        {[
          { id: 'campaign', label: 'Run a Campaign', icon: Megaphone },
          { id: 'boost', label: 'Boost a Post', icon: Rocket },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGN TAB ── */}
      {tab === 'campaign' && (
        <>
          {campaignDone ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Campaign Submitted!</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Your campaign has been submitted for review. We'll activate it within 24 hours and contact you to complete payment.
              </p>
              <button onClick={() => navigate('/my-ads')}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                View My Campaigns
              </button>
            </div>
          ) : !showCampaignForm ? (
            <>
              <p className="text-muted-foreground mb-6">Choose a package to reach Philomni's creator and professional audience.</p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {PACKAGES.map(pkg => (
                  <div key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${
                      selectedPkg === pkg.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : `${pkg.bg} hover:border-primary/50`
                    }`}>
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                        MOST POPULAR
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${pkg.bg} flex items-center justify-center mb-3`}>
                      <pkg.icon className={`w-5 h-5 ${pkg.color}`} />
                    </div>
                    <h3 className="font-bold text-foreground text-lg">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-bold text-foreground">${pkg.price}</span>
                      <span className="text-muted-foreground text-sm">{pkg.period}</span>
                    </div>
                    <p className={`text-sm font-semibold ${pkg.color} mb-3`}>{pkg.impressions} impressions</p>
                    <ul className="space-y-2">
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {selectedPkg === pkg.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCampaignPayment}
                disabled={payLoading || !selectedPkg}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {payLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  : <>{selectedPkg ? `Get Started — $${PACKAGES.find(p => p.id === selectedPkg)?.price}/mo` : 'Get Started'} <ChevronRight className="w-4 h-4" /></>
                }
              </button>
            </>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              <form onSubmit={handleCampaignSubmit} className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    {(() => { const pkg = PACKAGES.find(p => p.id === selectedPkg); return pkg ? <pkg.icon className={`w-4 h-4 ${pkg.color}`} /> : null })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{PACKAGES.find(p => p.id === selectedPkg)?.name} Package</p>
                    <p className="text-xs text-muted-foreground">${PACKAGES.find(p => p.id === selectedPkg)?.price}/month · {PACKAGES.find(p => p.id === selectedPkg)?.impressions} impressions</p>
                  </div>
                  <button type="button" onClick={() => setShowCampaignForm(false)} className="ml-auto text-xs text-primary hover:underline">Change</button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Title</label>
                  <input value={campaignForm.title} onChange={e => setC('title', e.target.value)}
                    placeholder="What's your campaign about?" required
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <textarea value={campaignForm.description} onChange={e => setC('description', e.target.value)}
                    placeholder="Tell your audience what you're offering…" rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ad Creative (image)</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-5 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/40 text-muted-foreground hover:text-foreground">
                    {campaignMedia ? (
                      <span className="text-sm">{campaignMedia.name}</span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Upload image (JPG, PNG)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setCampaignMedia(f); setCampaignPreview(URL.createObjectURL(f)) }
                    }} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">CTA Button</label>
                    <select value={campaignForm.cta_text} onChange={e => setC('cta_text', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      {['Learn More','Shop Now','Sign Up','Download','Get Started','Book Now','Contact Us'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Destination URL</label>
                    <input value={campaignForm.cta_url} onChange={e => setC('cta_url', e.target.value)}
                      placeholder="https://yoursite.com" type="url" required
                      className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target Audience</label>
                  <select value={campaignForm.target_roles} onChange={e => setC('target_roles', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="all">All users</option>
                    <option value="creator">Creators</option>
                    <option value="professional">Professionals</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
                    <input type="date" value={campaignForm.start_date} onChange={e => setC('start_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                    <input type="date" value={campaignForm.end_date} onChange={e => setC('end_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <button type="submit" disabled={campaignLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {campaignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  Submit Campaign for Review
                </button>
              </form>

              {/* Preview */}
              <div className="lg:sticky lg:top-20 h-fit space-y-4">
                <p className="text-sm font-semibold text-foreground">Ad Preview</p>
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <Megaphone className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{user?.full_name || 'Your Brand'}</p>
                        <p className="text-[10px] text-muted-foreground">Sponsored</p>
                      </div>
                    </div>
                  </div>
                  {campaignPreview
                    ? <img src={campaignPreview} className="w-full aspect-video object-cover mt-2" alt="" />
                    : <div className="w-full aspect-video bg-muted mt-2 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground/40" /></div>
                  }
                  <div className="p-4">
                    <p className="font-bold text-foreground text-sm mb-1">{campaignForm.title || 'Your campaign headline'}</p>
                    <p className="text-xs text-muted-foreground mb-3">{campaignForm.description || 'Your description will appear here.'}</p>
                    <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                      {campaignForm.cta_text} <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── BOOST TAB ── */}
      {tab === 'boost' && (
        <>
          {boostDone ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Boost Submitted!</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Your post boost is under review. It goes live within 24 hours. We'll contact you to complete payment.
              </p>
              <button onClick={() => navigate('/my-ads')}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                View My Boosts
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Select post */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">1. Select a post to boost</h2>
                {postsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-10 bg-card border border-border rounded-2xl">
                    <p className="text-muted-foreground text-sm">No posts yet. Create a post first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {userPosts.map(post => {
                      const img = Array.isArray(post.media_urls) ? post.media_urls[0] : null
                      const text = post.content?.replace(/<[^>]+>/g, '').slice(0, 60) || 'Text post'
                      return (
                        <button key={post.id} onClick={() => setSelectedPost(post)}
                          className={`relative rounded-xl border overflow-hidden aspect-square transition-all ${
                            selectedPost?.id === post.id
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-border hover:border-primary/50'
                          }`}>
                          {img
                            ? <img src={img} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-muted flex items-center justify-center p-2">
                                <p className="text-xs text-muted-foreground text-center leading-tight">{text}</p>
                              </div>
                          }
                          {selectedPost?.id === post.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Boost options */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">2. Choose a boost</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {BOOST_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setSelectedBoost(opt.id)}
                      className={`relative text-left p-4 rounded-xl border transition-all ${
                        selectedBoost === opt.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}>
                      {selectedBoost === opt.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="font-semibold text-foreground text-sm mb-1">{opt.label}</p>
                      <p className="text-2xl font-bold text-foreground mb-2">${opt.price}</p>
                      <p className="text-xs text-muted-foreground">{opt.impressions.toLocaleString()} extra impressions</p>
                      <p className="text-xs text-muted-foreground">{opt.days} days</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Reach type */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">3. Target audience</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {REACH_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setReachType(opt.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        reachType === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}>
                      <p className="font-medium text-foreground text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBoostPayment}
                disabled={boostLoading || !selectedPost || !selectedBoost}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {boostLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  : <><Rocket className="w-4 h-4" /> Boost Post — ${BOOST_OPTIONS.find(o => o.id === selectedBoost)?.price ?? ''}</>
                }
              </button>
            </div>
          )}
        </>
      )}
      {/* ── Email Instructions Modal (international users) ─────────────────── */}
      {emailModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEmailModalData(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-1">
              {emailModalData.pkg.name} — ${emailModalData.pkg.price}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              To get started, email us with the subject below. We'll send you payment instructions and activate your campaign within 24 hours.
            </p>
            <div className="bg-muted rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
              <p className="text-sm font-semibold text-foreground">{emailModalData.subject}</p>
            </div>
            <a
              href={`mailto:support@philomni.com?subject=${encodeURIComponent(emailModalData.subject)}&body=${encodeURIComponent(`Hi Philomni Team,\n\nI'd like to get started with the ${emailModalData.pkg.name} package.\n\nMy account email: ${user?.email}\n\nPlease send payment instructions.\n\nThank you!`)}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors mb-2"
            >
              <ExternalLink className="w-4 h-4" />
              Email support@philomni.com
            </a>
            <button
              onClick={() => setEmailModalData(null)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
