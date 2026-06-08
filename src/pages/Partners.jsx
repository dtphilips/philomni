import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Target, BarChart2, Shield, Zap, CheckCircle2, ChevronRight,
  ArrowRight, Loader2, Globe, Users, TrendingUp, Megaphone,
  Star, Mail, Building2,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '10,000+', label: 'Active Members'    },
  { value: '50+',     label: 'Countries'          },
  { value: '85%',     label: 'Engagement Rate'    },
  { value: '12+',     label: 'Creator Categories' },
]

const BENEFITS = [
  {
    icon: Target,
    title: 'Targeted Reach',
    desc:  'Reach creators and professionals by niche, location, follower count, and industry.',
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
  },
  {
    icon: Zap,
    title: 'High Engagement',
    desc:  'Philomni creators are active, ambitious, and highly engaged — not passive scrollers.',
    color: 'text-yellow-400',
    bg:    'bg-yellow-400/10',
  },
  {
    icon: BarChart2,
    title: 'Full Analytics',
    desc:  'Real-time dashboard showing views, clicks, CTR, and ROI for every campaign.',
    color: 'text-green-400',
    bg:    'bg-green-400/10',
  },
  {
    icon: Shield,
    title: 'Brand Safety',
    desc:  'Every ad manually reviewed before going live. Your brand only appears next to quality content.',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10',
  },
]

const PACKAGES = [
  {
    name:      'Starter',
    price:     '$299',
    period:    '/month',
    badge:     'Best for Small Business',
    badgeColor:'bg-muted text-muted-foreground',
    highlight: false,
    features: [
      'Featured posts in creator feed for 30 days',
      'Targeted to relevant niches',
      'Basic analytics dashboard',
      'Email performance report monthly',
      'Up to 50,000 impressions',
    ],
    cta:      'Get Started',
    ctaLink:  '#contact',
  },
  {
    name:      'Growth',
    price:     '$799',
    period:    '/month',
    badge:     'Most Popular',
    badgeColor:'bg-primary text-primary-foreground',
    highlight: true,
    features: [
      'Everything in Starter',
      'Banner placement on key pages',
      'Featured in Philomni weekly digest',
      'Priority ad placement',
      'Dedicated account manager',
      'Up to 200,000 impressions',
      'Bi-weekly performance calls',
    ],
    cta:      'Get Started',
    ctaLink:  '#contact',
  },
  {
    name:      'Premium',
    price:     '$1,999',
    period:    '/month',
    badge:     'Enterprise',
    badgeColor:'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    highlight: false,
    features: [
      'Everything in Growth',
      'Exclusive category sponsorship',
      'Co-branded content with verified creators',
      'Custom targeting strategy',
      'Unlimited impressions',
      'Weekly strategy calls',
      'Custom reporting dashboard',
    ],
    cta:      'Contact Us',
    ctaLink:  '#contact',
  },
]

const STEPS = [
  { n: '1', title: 'Choose Your Package',  desc: 'Select the package that fits your goals and budget.' },
  { n: '2', title: 'Submit Your Creative', desc: 'Upload your ad creative — we review within 24 hours.' },
  { n: '3', title: 'Go Live',              desc: 'Your ad goes live across the Philomni platform.' },
  { n: '4', title: 'Track Results',        desc: 'Monitor performance in real-time from your dashboard.' },
]

const BUDGET_RANGES = [
  'Under $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500 – $5,000', '$5,000+',
]
const GOALS = [
  'Brand Awareness', 'Lead Generation', 'Product Launch',
  'App Downloads', 'Creator Partnerships', 'Other',
]
const PACKAGES_SELECT = ['Starter ($299/mo)', 'Growth ($799/mo)', 'Premium ($1,999/mo)', 'Custom']

// ── Partners page ─────────────────────────────────────────────────────────────

export default function Partners() {
  const packagesRef = useRef(null)
  const contactRef  = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  const [form, setForm] = useState({
    brand_name:       '',
    contact_name:     '',
    contact_email:    '',
    website:          '',
    phone:            '',
    package_interest: '',
    budget_range:     '',
    campaign_goal:    '',
    message:          '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.brand_name.trim())   return toast.error('Brand name is required')
    if (!form.contact_name.trim()) return toast.error('Your name is required')
    if (!form.contact_email.trim()) return toast.error('Email address is required')

    setSubmitting(true)
    try {
      const { error } = await supabase.from('brand_inquiries').insert({
        brand_name:       form.brand_name.trim(),
        contact_name:     form.contact_name.trim(),
        contact_email:    form.contact_email.trim(),
        website:          form.website.trim() || null,
        phone:            form.phone.trim()   || null,
        package_interest: form.package_interest || null,
        budget_range:     form.budget_range   || null,
        campaign_goal:    form.campaign_goal  || null,
        message:          form.message.trim() || null,
        status:           'new',
      })
      if (error) throw error

      // Notify support via email — non-blocking, never fails the submission
      supabase.functions.invoke('send-inquiry-email', {
        body: {
          brandName:       form.brand_name.trim(),
          contactName:     form.contact_name.trim(),
          email:           form.contact_email.trim(),
          website:         form.website.trim(),
          phone:           form.phone.trim(),
          packageInterest: form.package_interest,
          budget:          form.budget_range,
          campaignGoal:    form.campaign_goal,
          message:         form.message.trim(),
        },
      }).catch(err => console.error('Inquiry email failed (non-blocking):', err))

      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Top nav bar ── */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-bold text-foreground">Philomni</span>
            <span className="text-muted-foreground/60 text-sm ml-1">· Advertise</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo(packagesRef)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Packages
            </button>
            <button onClick={() => scrollTo(contactRef)}
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Megaphone className="w-3.5 h-3.5" /> Brand Advertising &amp; Partnerships
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-5">
            Reach the World&apos;s Most<br />
            <span className="text-primary">Ambitious Creators</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Advertise on Philomni and connect your brand with creators, professionals, and innovators
            across 50+ countries.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => scrollTo(packagesRef)}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
              View Packages <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo(contactRef)}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
              <Mail className="w-4 h-4" /> Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ADVERTISE ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Why Advertise on Philomni?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Philomni is built for creators who take their craft seriously — and the brands that want to reach them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center mb-4`}>
                  <b.icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section ref={packagesRef} className="py-20 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Advertising Packages</h2>
            <p className="text-muted-foreground text-sm">
              Choose the plan that fits your goals. All prices in USD.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.name}
                className={`bg-card rounded-2xl border p-6 flex flex-col relative ${
                  pkg.highlight
                    ? 'border-primary shadow-lg shadow-primary/15 ring-1 ring-primary/30'
                    : 'border-border'
                }`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-foreground">{pkg.price}</span>
                    <span className="text-muted-foreground text-sm">{pkg.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => scrollTo(contactRef)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    pkg.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {pkg.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground text-sm">Launch your campaign in four simple steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(step => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-lg mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section ref={contactRef} id="contact" className="py-20 px-6 bg-muted/20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Start Your Campaign</h2>
            <p className="text-muted-foreground text-sm">
              Launch a self-serve campaign instantly, or contact our team for enterprise.
            </p>
          </div>

          {/* Self-serve CTA — instant campaign builder with card payment */}
          <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-foreground">Launch instantly — no waiting</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick a placement, upload your creative, set a budget, and pay by card. Live within 24 h of approval.
              </p>
            </div>
            <Link to="/advertise"
              className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
              Build a Campaign →
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Or, for enterprise / custom budgets, fill out the form below and our team will contact you within 24 hours.
          </p>

          {submitted ? (
            <div className="bg-card border border-green-500/30 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Thank you!</h3>
              <p className="text-sm text-muted-foreground">
                Our team will contact you within 24 hours at{' '}
                <span className="text-primary font-medium">{form.contact_email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-7 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Brand / Company Name *</label>
                  <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Your Name *</label>
                  <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Email Address *</label>
                  <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                    placeholder="jane@acme.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Website URL</label>
                  <input type="url" value={form.website} onChange={e => set('website', e.target.value)}
                    placeholder="https://acme.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Phone Number <span className="text-muted-foreground/60">(optional)</span></label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Package Interest</label>
                  <select value={form.package_interest} onChange={e => set('package_interest', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select a package…</option>
                    {PACKAGES_SELECT.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Monthly Budget Range</label>
                  <select value={form.budget_range} onChange={e => set('budget_range', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select budget…</option>
                    {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Campaign Goal</label>
                  <select value={form.campaign_goal} onChange={e => set('campaign_goal', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select goal…</option>
                    {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tell us about your campaign</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  rows={4}
                  placeholder="Describe your target audience, campaign objectives, timeline, and anything else we should know…"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Submit Inquiry
              </button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to be contacted by the Philomni partnerships team.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">P</div>
                <span className="font-bold text-foreground text-sm">Philomni</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The creator economy platform for ambitious professionals.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Company</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
                <li><Link to="/advertise" className="hover:text-foreground transition-colors">Advertise</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Platform</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/learn" className="hover:text-foreground transition-colors">Learn</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
                <li><Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Legal</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Cookie Policy</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Philomni. All rights reserved.</p>
            <p>
              Questions?{' '}
              <a href="mailto:partnerships@philomni.com" className="text-primary hover:underline">
                partnerships@philomni.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
