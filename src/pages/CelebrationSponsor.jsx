import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, Check, ArrowLeft, ArrowRight, Gift, Building2, Calendar, Target, CreditCard } from 'lucide-react'
import { CELEBRATION_TYPES } from '../lib/celebrations'

const STEPS = ['Package', 'Categories', 'Details', 'Review & Pay']

const PACKAGES = [
  {
    key: 'category',
    label: 'Category Sponsor',
    price: 299,
    maxCats: 1,
    description: 'Sponsor ONE celebration category this month.',
    features: [
      'Your logo on all celebrations in chosen category',
      'Your message shown on each celebration page',
      'Up to 1 category',
      'Monthly reach report',
    ],
  },
  {
    key: 'multi',
    label: 'Multi-Category',
    price: 699,
    maxCats: 3,
    popular: true,
    description: 'Sponsor up to 3 celebration categories simultaneously.',
    features: [
      'Everything in Category Sponsor',
      'Featured placement on /celebrations page',
      'Priority brand placement',
      'Up to 3 categories',
    ],
  },
  {
    key: 'platinum',
    label: 'Platinum',
    price: 1499,
    maxCats: null,
    description: 'Sponsor ALL celebration categories — maximum reach.',
    features: [
      'Everything in Multi-Category',
      'All categories covered',
      'Brand on digital certificates',
      'Priority support',
      'Dedicated account manager',
    ],
  },
]

const PAYMENT_METHODS = [
  { id: 'stripe',      label: 'Stripe',      desc: 'Card / bank via Stripe' },
  { id: 'paystack',    label: 'Paystack',    desc: 'Card, bank, USSD' },
  { id: 'flutterwave', label: 'Flutterwave', desc: 'Card, mobile money' },
]

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

export default function CelebrationSponsor() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep]             = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)  // holds the created sponsorship row
  const [company, setCompany]       = useState(null)
  const [companyLoading, setCompanyLoading] = useState(true)

  const [form, setForm] = useState({
    package:        '',
    categories:     [],   // empty = all categories (platinum)
    brand_message:  '',
    cap_count:      '',
    starts_at:      '',
    ends_at:        '',
    payment_method: 'stripe',
    payment_ref:    '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedPkg = PACKAGES.find(p => p.key === form.package)

  useEffect(() => {
    if (!user) return
    setCompanyLoading(true)
    supabase
      .from('company_pages')
      .select('id, name, logo_url')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data: owned }) => {
        if (owned) { setCompany(owned); setCompanyLoading(false); return }
        supabase
          .from('company_members')
          .select('*, company_pages(*)')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
          .then(({ data: mem }) => {
            setCompany(mem?.company_pages || null)
            setCompanyLoading(false)
          })
      })
  }, [user])

  const toggleCat = (cat) => {
    if (!selectedPkg) return
    setForm(f => {
      const has = f.categories.includes(cat)
      if (has) return { ...f, categories: f.categories.filter(c => c !== cat) }
      const max = selectedPkg.maxCats
      if (max && f.categories.length >= max) return f  // cap reached
      return { ...f, categories: [...f.categories, cat] }
    })
  }

  const canAdvance = () => {
    if (step === 0) return !!form.package
    if (step === 1) {
      if (selectedPkg?.key === 'platinum') return true
      return form.categories.length > 0
    }
    if (step === 2) return form.starts_at && form.ends_at && new Date(form.ends_at) > new Date(form.starts_at)
    return true
  }

  const submit = async () => {
    if (!user || !company) return
    setSubmitting(true)
    try {
      const pkg = PACKAGES.find(p => p.key === form.package)
      const isPlatinum = form.package === 'platinum'

      // Insert one row per category (or one row with category_id=null for platinum/all)
      const categoryIds = isPlatinum || form.categories.length === 0
        ? [null]
        : form.categories

      const rows = categoryIds.map(cat => ({
        company_id:      company.id,
        category_id:     cat,
        budget_usd:      pkg.price,
        cap_count:       form.cap_count ? parseInt(form.cap_count) : null,
        brand_message:   form.brand_message.trim() || null,
        starts_at:       form.starts_at,
        ends_at:         form.ends_at,
        status:          'active',
        payment_ref:     form.payment_ref.trim() || null,
      }))

      const { data, error } = await supabase
        .from('celebration_category_sponsorships')
        .insert(rows)
        .select('*, company:company_id(id, name, logo_url)')

      if (error) {
        console.error('Sponsorship insert error:', error)
        alert(`Error: ${error.message}`)
        return
      }

      setSubmitted(data[0])
    } catch (err) {
      console.error(err)
      alert(`Unexpected error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-4xl mx-auto mb-5">🎉</div>
        <h2 className="text-2xl font-black text-foreground mb-2">Sponsorship Active!</h2>
        <p className="text-muted-foreground mb-1">Your brand will appear on all matching celebrations.</p>
        <p className="text-sm text-muted-foreground mb-6">
          Categories: {submitted.category_id
            ? CELEBRATION_TYPES.find(t => t.type === submitted.category_id)?.label
            : 'All categories'
          } · {new Date(submitted.starts_at).toLocaleDateString()} – {new Date(submitted.ends_at).toLocaleDateString()}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/celebrations')} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            View Celebrations
          </button>
          <button onClick={() => { setSubmitted(null); setStep(0); setForm({ package: '', categories: [], brand_message: '', cap_count: '', starts_at: '', ends_at: '', payment_method: 'stripe', payment_ref: '' }) }}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted">
            Add Another
          </button>
        </div>
      </div>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-black text-foreground mb-2">Sign in to Sponsor</h2>
        <p className="text-muted-foreground mb-5">You need a Philomni account with a company profile to create a sponsorship.</p>
        <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Sign In</button>
      </div>
    )
  }

  if (companyLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  if (!company) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-black text-foreground mb-2">Company Profile Required</h2>
        <p className="text-muted-foreground mb-5">You need a company profile on Philomni to create a celebration sponsorship.</p>
        <button onClick={() => navigate('/company/create')} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create Company Profile</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/celebrations')}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Sponsor Celebrations</h1>
          <p className="text-xs text-muted-foreground">as {company.name} · Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ─── STEP 0: PACKAGE ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground mb-2">Choose your sponsorship package</h2>
          {PACKAGES.map(pkg => (
            <button
              key={pkg.key}
              onClick={() => {
                set('package', pkg.key)
                // Reset categories if switching to platinum
                if (pkg.key === 'platinum') set('categories', [])
                // Trim categories to new max if switching down
                if (pkg.maxCats) setForm(f => ({ ...f, package: pkg.key, categories: f.categories.slice(0, pkg.maxCats) }))
              }}
              className={`relative w-full text-left rounded-2xl border p-5 transition-all ${
                form.package === pkg.key
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border/60 bg-card hover:border-primary/40'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">POPULAR</span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{pkg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                  <ul className="mt-3 space-y-1">
                    {pkg.features.map(f => (
                      <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-primary">${pkg.price}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── STEP 1: CATEGORIES ───────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          {selectedPkg?.key === 'platinum' ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-lg font-black text-foreground mb-2">All Categories Included</h2>
              <p className="text-muted-foreground text-sm">Your Platinum sponsorship covers every celebration category on Philomni automatically.</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold text-foreground mb-1">
                Select categories to sponsor
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedPkg?.maxCats === 1
                  ? 'Choose 1 category'
                  : `Choose up to ${selectedPkg?.maxCats} categories`
                } · {form.categories.length} selected
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CELEBRATION_TYPES.map(t => {
                  const selected = form.categories.includes(t.type)
                  const maxed = !selected && selectedPkg?.maxCats && form.categories.length >= selectedPkg.maxCats
                  return (
                    <button
                      key={t.type}
                      onClick={() => toggleCat(t.type)}
                      disabled={maxed}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : maxed
                            ? 'border-border/30 opacity-40 cursor-not-allowed'
                            : 'border-border/60 bg-card hover:border-primary/40'
                      }`}
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
                      {selected && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── STEP 2: DETAILS ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-base font-bold text-foreground">Campaign details</h2>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1 block">
                <Calendar className="w-3 h-3" /> Start date *
              </label>
              <input
                type="date"
                value={form.starts_at}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('starts_at', e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1 block">
                <Calendar className="w-3 h-3" /> End date *
              </label>
              <input
                type="date"
                value={form.ends_at}
                min={form.starts_at || new Date().toISOString().split('T')[0]}
                onChange={e => set('ends_at', e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Cap count */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1 block">
              <Target className="w-3 h-3" /> Max celebrations to cover <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="number"
              value={form.cap_count}
              onChange={e => set('cap_count', e.target.value)}
              placeholder="e.g. 100 (leave blank for unlimited)"
              min={1}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Set a cap to control budget exposure. Once reached, the sponsorship pauses automatically.</p>
          </div>

          {/* Brand message */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Brand message <span className="font-normal text-muted-foreground">(shown on sponsored celebrations)</span>
            </label>
            <textarea
              value={form.brand_message}
              onChange={e => set('brand_message', e.target.value.slice(0, 200))}
              placeholder="e.g. Flutterwave wishes you a wonderful celebration!"
              rows={3}
              maxLength={200}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.brand_message.length}/200</p>
          </div>
        </div>
      )}

      {/* ─── STEP 3: REVIEW & PAY ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-base font-bold text-foreground">Review & Pay</h2>

          {/* Summary card */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border/40">
              {company.logo_url
                ? <img src={company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                : <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
              }
              <div>
                <p className="font-bold text-foreground">{company.name}</p>
                <p className="text-xs text-muted-foreground">Sponsoring as</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package</span>
                <span className="font-semibold text-foreground">{selectedPkg?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-semibold text-foreground text-right">
                  {form.package === 'platinum' || form.categories.length === 0
                    ? 'All categories'
                    : form.categories.map(c => CELEBRATION_TYPES.find(t => t.type === c)?.label).join(', ')
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period</span>
                <span className="font-semibold text-foreground">
                  {form.starts_at && form.ends_at
                    ? `${new Date(form.starts_at).toLocaleDateString()} – ${new Date(form.ends_at).toLocaleDateString()}`
                    : '—'
                  }
                </span>
              </div>
              {form.cap_count && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cap</span>
                  <span className="font-semibold text-foreground">{parseInt(form.cap_count).toLocaleString()} celebrations</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border/40">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-primary text-lg">${selectedPkg?.price.toLocaleString()}/mo</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1 block">
              <CreditCard className="w-3 h-3" /> Payment method
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => set('payment_method', m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    form.payment_method === m.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.payment_method === m.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment ref */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Payment reference / transaction ID <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              value={form.payment_ref}
              onChange={e => set('payment_ref', e.target.value)}
              placeholder="e.g. TXN_abc123"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Your sponsorship activates immediately. Our team will confirm payment within 24 hours.</p>
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b)' }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            🎁 Activate Sponsorship — ${selectedPkg?.price.toLocaleString()}/mo
          </button>
          <p className="text-xs text-muted-foreground text-center">
            All celebration revenue goes to Philomni. Brands sponsor reach, not individual creators.
          </p>
        </div>
      )}

      {/* Navigation */}
      {step < STEPS.length - 1 && (
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={() => canAdvance() && setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
