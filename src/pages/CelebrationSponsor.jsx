import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, Check, ArrowLeft } from 'lucide-react'
import { CELEBRATION_TYPES } from '../lib/celebrations'

const PACKAGES = [
  {
    key: 'category',
    label: 'Category Sponsor',
    price: '$299/month',
    description: 'Choose ONE celebration category to sponsor this month.',
    features: [
      'Your logo on all celebrations in chosen category',
      'Your message shown on each celebration page',
      'Estimated reach shown to you monthly',
    ],
  },
  {
    key: 'multi',
    label: 'Multi-Category',
    price: '$699/month',
    popular: true,
    description: 'Sponsor up to 3 celebration categories simultaneously.',
    features: [
      'Everything in Category Sponsor',
      'Featured placement on /celebrations homepage',
      'Priority brand placement across categories',
      'Sponsor up to 3 categories',
    ],
  },
  {
    key: 'platinum',
    label: 'Platinum Sponsor',
    price: '$1,499/month',
    description: 'Sponsor ALL celebration categories — maximum reach.',
    features: [
      'Everything in Multi-Category',
      'Sponsor ALL categories across Philomni',
      'Brand on digital celebration certificates',
      'Monthly engagement and reach report',
      'Dedicated celebration category named after brand',
    ],
  },
]

export default function CelebrationSponsor() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    brand_name:     '',
    contact_name:   '',
    contact_email:  '',
    categories:     [],
    package:        '',
    monthly_budget: '',
    campaign_goals: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (cat) =>
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))

  const submit = async () => {
    if (!form.brand_name.trim() || !form.contact_email.trim() || !form.package) return
    setSubmitting(true)
    try {
      await supabase.from('celebration_sponsors').insert({
        brand_name:     form.brand_name.trim(),
        contact_name:   form.contact_name.trim() || null,
        contact_email:  form.contact_email.trim(),
        categories:     form.categories,
        package:        form.package,
        monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : null,
        campaign_goals: form.campaign_goals.trim() || null,
        status:         'inquiry',
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl mx-auto mb-4">🎉</div>
        <h2 className="text-2xl font-black text-foreground mb-2">Inquiry Received!</h2>
        <p className="text-muted-foreground mb-6">Our team will contact you within 24 hours to discuss sponsoring Philomni Celebrations.</p>
        <button onClick={() => navigate('/celebrations')} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          Back to Celebrations
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <button onClick={() => navigate('/celebrations')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 pt-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-foreground mb-3">Sponsor Philomni Celebrations</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Put your brand in front of thousands of celebration moments every month — reaching audiences at their most emotionally engaged.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { n: '1', title: 'Choose a Category', desc: 'Pick birthday, memorial, achievement, or any type that fits your brand.' },
          { n: '2', title: 'Your Brand Appears', desc: 'Logo and message shown on every celebration in your sponsored category.' },
          { n: '3', title: 'Reach Engaged Audiences', desc: 'Connect with people at life\'s most meaningful moments.' },
        ].map(s => (
          <div key={s.n} className="bg-card border border-border/60 rounded-2xl p-4 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-black text-sm flex items-center justify-center mx-auto mb-2">{s.n}</div>
            <p className="font-bold text-sm text-foreground mb-1">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Packages */}
      <h2 className="text-lg font-black text-foreground mb-4">Sponsorship Packages</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {PACKAGES.map(pkg => (
          <button
            key={pkg.key}
            onClick={() => set('package', pkg.key)}
            className={`relative text-left rounded-2xl border p-5 transition-all ${
              form.package === pkg.key
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-border/60 bg-card hover:border-primary/40'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">POPULAR</span>
            )}
            <p className="font-bold text-foreground mb-0.5">{pkg.label}</p>
            <p className="text-xl font-black text-primary mb-2">{pkg.price}</p>
            <p className="text-xs text-muted-foreground mb-3">{pkg.description}</p>
            <ul className="space-y-1.5">
              {pkg.features.map(f => (
                <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Inquiry form */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-foreground mb-5">Sponsorship Inquiry</h2>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Brand name *</label>
            <input
              value={form.brand_name}
              onChange={e => set('brand_name', e.target.value)}
              placeholder="Acme Corp"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Contact name</label>
            <input
              value={form.contact_name}
              onChange={e => set('contact_name', e.target.value)}
              placeholder="Your name"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Contact email *</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
              placeholder="contact@brand.com"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Monthly budget (USD)</label>
            <input
              type="number"
              value={form.monthly_budget}
              onChange={e => set('monthly_budget', e.target.value)}
              placeholder="299"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-foreground mb-2 block">Categories interested in</label>
          <div className="flex flex-wrap gap-2">
            {CELEBRATION_TYPES.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => toggleCat(t.type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.categories.includes(t.type)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Campaign goals</label>
          <textarea
            value={form.campaign_goals}
            onChange={e => set('campaign_goals', e.target.value)}
            placeholder="What are you hoping to achieve? Brand awareness, product launches, audience growth..."
            rows={3}
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting || !form.brand_name.trim() || !form.contact_email.trim() || !form.package}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Sponsorship Inquiry
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">Our team responds within 24 hours.</p>
      </div>
    </div>
  )
}
