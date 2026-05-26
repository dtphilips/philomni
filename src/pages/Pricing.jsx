import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { PLAN_META, PRICE_IDS, annualSavingsPct } from '../lib/plans'
import {
  Check, X, Zap, Crown, Sparkles, Star, Users, Globe,
  ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

const TESTIMONIALS = [
  { name: 'Amara O.',    role: 'Content Creator',  text: 'The image generation alone doubled my content output. Worth every penny.' },
  { name: 'James C.',   role: 'Startup Founder',   text: 'Pitch Vault unlimited uploads let me iterate fast. Raised my first round through a SmartMatch.' },
  { name: 'Sofia R.',   role: 'Career Professional', text: 'Unlimited job applications + Priority SmartMatch — landed 3 interviews in the first week.' },
]

const FAQ = [
  { q: 'Can I cancel anytime?',    a: 'Yes. You can cancel at any time from your billing settings. Your plan stays active until the end of the billing period.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your content stays safe. You simply return to Free limits — no data is deleted.' },
  { q: 'Is there a free trial?',   a: 'The Free plan is yours forever with no credit card required. Upgrade whenever you\'re ready.' },
  { q: 'Do you offer refunds?',    a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with your Pro or Pro Max plan.' },
  { q: 'Can I switch between plans?', a: 'Yes, you can upgrade or downgrade at any time. Charges are prorated automatically by Stripe.' },
]

const stripeReady =
  !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
  !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('your-')

export default function Pricing() {
  const { user } = useAuth()
  const { plan: currentPlan } = useSubscription()
  const navigate = useNavigate()

  const [billing,   setBilling]   = useState('monthly') // 'monthly' | 'annual'
  const [loading,   setLoading]   = useState(null)       // planKey being processed
  const [openFaq,   setOpenFaq]   = useState(null)

  const handleUpgrade = async (planKey) => {
    if (!user) { navigate('/login'); return }
    if (planKey === 'free') { toast.info('You\'re already on the Free plan.'); return }
    if (planKey === currentPlan) { toast.info(`You\'re already on ${PLAN_META[planKey].name}.`); return }

    if (!stripeReady) {
      toast.info('Payments are coming soon — your interest has been noted!')
      return
    }

    const priceIdKey = `${planKey}_${billing === 'annual' ? 'annual' : 'monthly'}`
    const priceId    = PRICE_IDS[priceIdKey]

    setLoading(planKey)
    try {
      const res  = await fetch('/api/stripe-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          priceId,
          plan:      planKey,
          userId:    user?.id,
          userEmail: user?.email,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      toast.error(`Checkout failed: ${err.message}`)
    }
    setLoading(null)
  }

  const plans = [PLAN_META.free, PLAN_META.pro, PLAN_META.promax]

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-16">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
          Choose your plan
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free. Upgrade when you're ready to unlock the full power of Philomni.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center rounded-xl bg-muted border border-border p-1 gap-1 mt-2">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === 'annual'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span className="absolute -top-2.5 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              SAVE 17%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => {
          const isCurrentPlan = currentPlan === p.key
          const isHighlighted = p.highlight
          const price = billing === 'annual' ? p.price_annual_mo : p.price_monthly
          const savings = p.key !== 'free' ? annualSavingsPct(p.key) : 0

          return (
            <div
              key={p.key}
              className={[
                'relative flex flex-col rounded-2xl border p-6 transition-all duration-200',
                isHighlighted
                  ? 'border-primary/60 bg-gradient-to-b from-primary/5 to-card shadow-lg shadow-primary/10 scale-[1.02]'
                  : p.key === 'promax'
                  ? 'border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-card'
                  : 'border-border bg-card',
                isCurrentPlan ? 'ring-2 ring-primary' : '',
              ].join(' ')}
            >
              {/* Popular / current badges */}
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                    {p.badge}
                  </span>
                </div>
              )}
              {isCurrentPlan && !p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {p.key === 'pro' && <Crown className="w-4 h-4 text-primary" />}
                  {p.key === 'promax' && <Sparkles className="w-4 h-4 text-purple-400" />}
                  <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {p.key === 'free' ? (
                  <div>
                    <span className="text-4xl font-bold text-foreground">Free</span>
                    <span className="text-muted-foreground text-sm ml-2">forever</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-foreground">${price}</span>
                      <span className="text-muted-foreground text-sm mb-1">/month</span>
                    </div>
                    {billing === 'annual' && (
                      <p className="text-xs text-green-400 font-medium mt-0.5">
                        Billed ${p.annual_total}/year · Save {savings}%
                      </p>
                    )}
                    {billing === 'monthly' && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Or ${p.price_annual_mo}/mo billed annually
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={() => handleUpgrade(p.key)}
                disabled={!!loading || isCurrentPlan}
                className={[
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-6',
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : isHighlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md'
                    : p.key === 'promax'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                    : 'bg-muted text-foreground border border-border hover:bg-muted/80',
                ].join(' ')}
              >
                {loading === p.key
                  ? 'Processing…'
                  : isCurrentPlan
                  ? 'Current Plan'
                  : p.cta}
              </button>

              {/* Divider */}
              <div className="border-t border-border mb-5" />

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHighlighted ? 'text-primary' : p.key === 'promax' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                    <span className="text-foreground leading-snug">{f}</span>
                  </li>
                ))}
                {p.not_included.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/40" />
                    <span className="text-muted-foreground/50 line-through leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* ── Usage limits summary ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-center text-foreground mb-6">Usage limits at a glance</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Feature</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Free</th>
                <th className="text-center px-4 py-3 text-primary font-semibold">Pro</th>
                <th className="text-center px-4 py-3 text-purple-400 font-semibold">Pro Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Philo AI messages',       '20 / day',   '200 / day',   'Unlimited'],
                ['Image generation',        '—',          '10 / day',    'Unlimited'],
                ['Video generation',        '—',          '—',           '✓'],
                ['Voice AI (ElevenLabs)',   '—',          '—',           '✓'],
                ['Job applications',        '3 / month',  'Unlimited',   'Unlimited'],
                ['Pitch vault uploads',     '1 / month',  'Unlimited',   'Unlimited'],
                ['Analytics',               'Basic',      'Full',        'Advanced'],
                ['Rooms access',            '—',          '✓',           '✓'],
                ['Priority SmartMatch',     '—',          '✓',           'White-glove'],
                ['Business API access',     '—',          '—',           '✓'],
                ['Verified badge eligibility', '—',       '✓',           '✓'],
              ].map(([feature, free, pro, promax]) => (
                <tr key={feature} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-foreground font-medium">{feature}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{free}</td>
                  <td className="px-4 py-3 text-center text-foreground font-medium">{pro}</td>
                  <td className="px-4 py-3 text-center text-purple-300 font-medium">{promax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-center text-foreground mb-6">What our members say</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-card rounded-xl border border-border p-5">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, value: '50K+',  label: 'Members' },
          { icon: Globe, value: '120+',  label: 'Countries' },
          { icon: Star,  value: '4.9★',  label: 'Avg Rating' },
        ].map(s => (
          <div key={s.label} className="text-center bg-card rounded-xl border border-border p-5">
            <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-center text-foreground mb-6">Frequently asked questions</h2>
        <div className="max-w-2xl mx-auto space-y-2">
          {FAQ.map((faq, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium text-sm text-foreground">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <div className="text-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 rounded-2xl border border-primary/10 p-10">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Ready to level up?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Join thousands of creators and professionals accelerating their growth on Philomni.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={!!loading || currentPlan === 'pro'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </button>
          <button
            onClick={() => handleUpgrade('promax')}
            disabled={!!loading || currentPlan === 'promax'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold hover:bg-purple-500/25 transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            Go Pro Max
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Cancel anytime · Secure payment via Stripe · 7-day money-back guarantee</p>
      </div>
    </div>
  )
}
