import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Shield, Sparkles, Users, Globe, Star } from 'lucide-react';
import { toast } from 'sonner';

const FREE_FEATURES = [
  'Basic profile & feed',
  'Up to 3 posts per day',
  'Browse marketplace listings',
  'View public pitch teasers',
  'Basic community access',
  'Limited AI tool usage',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited posts & scheduling',
  'Priority marketplace placement',
  'Full Pitch Vault access + NDA tracking',
  'Advanced analytics & profile insights',
  'Unlimited AI tool access',
  'Verified Pro badge',
  'Early access to new features',
  'Priority support',
  'Export data & reports',
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 19,
    period: '/month',
    badge: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 12,
    period: '/month',
    badge: 'Save 37%',
    billed: 'Billed $144/year',
  },
];

const TESTIMONIALS = [
  { name: 'Amara O.', role: 'Creator', text: 'The AI tools alone are worth it. My reach tripled in 30 days.' },
  { name: 'James C.', role: 'Investor', text: 'Pitch Vault access let me discover deals I never would have found.' },
  { name: 'Sofia R.', role: 'Professional', text: 'Priority placement on the marketplace got me 5 new clients in a week.' },
];

export default function Upgrade() {
  const { user } = useOutletContext();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const isPro = user?.plan === 'pro';

  const handleUpgrade = async () => {
    setLoading(true);
    // Stripe integration placeholder — in production, invoke a backend function to create Stripe checkout session
    await new Promise(r => setTimeout(r, 1200));
    toast.info('Stripe payment integration coming soon. Stay tuned!');
    setLoading(false);
  };

  if (isPro) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">You're a Pro!</h1>
        <p className="text-muted-foreground mb-6">You have full access to all Philomni Pro features. Thank you for your support.</p>
        <Badge className="bg-primary/10 text-primary border-0 text-sm px-4 py-1.5"><Crown className="w-4 h-4 mr-1" />Pro Plan Active</Badge>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <Badge className="bg-primary/10 text-primary border-0 mb-4"><Crown className="w-3.5 h-3.5 mr-1" />Philomni Pro</Badge>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Unlock your full potential</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Join thousands of creators, professionals, and investors accelerating their growth with Pro.
        </p>
      </div>

      {/* Plan Toggle */}
      <div className="flex justify-center gap-4 mb-8">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all w-44 ${
              selectedPlan === plan.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 px-2.5 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                {plan.badge}
              </span>
            )}
            <span className="text-sm font-medium mb-1">{plan.label}</span>
            <span className="font-display text-3xl font-bold">${plan.price}</span>
            <span className="text-xs text-muted-foreground">{plan.period}</span>
            {plan.billed && <span className="text-xs text-muted-foreground mt-0.5">{plan.billed}</span>}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mb-10">
        <Button onClick={handleUpgrade} disabled={loading} size="lg" className="px-10 text-base h-12">
          {loading ? 'Processing...' : 'Upgrade to Pro'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Cancel anytime · Secure payment via Stripe</p>
      </div>

      {/* Comparison */}
      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {/* Free */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-lg mb-1">Free</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started on Philomni</p>
          <div className="space-y-2.5">
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pro */}
        <div className="bg-gradient-to-br from-primary/5 to-accent rounded-2xl border-2 border-primary/20 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">Pro</h3>
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Everything you need to grow</p>
          <div className="space-y-2.5">
            {PRO_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { icon: Users, value: '50K+', label: 'Pro Members' },
          { icon: Globe, value: '120+', label: 'Countries' },
          { icon: Star, value: '4.9', label: 'Avg Rating' },
        ].map(stat => (
          <div key={stat.label} className="text-center bg-card rounded-xl border border-border p-5">
            <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="bg-card rounded-xl border border-border p-4">
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <p className="text-sm italic text-muted-foreground mb-3">"{t.text}"</p>
            <div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="text-center bg-gradient-to-br from-primary/5 to-accent rounded-2xl border border-primary/10 p-8">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold mb-2">Ready to go Pro?</h2>
        <p className="text-sm text-muted-foreground mb-5">Join the fastest-growing professional network. Cancel anytime.</p>
        <Button onClick={handleUpgrade} disabled={loading} size="lg" className="px-10">
          {loading ? 'Processing...' : 'Get Pro Now'}
        </Button>
      </div>
    </div>
  );
}