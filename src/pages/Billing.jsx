import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { toast } from 'sonner'

// WARNING: VITE_STRIPE_PUBLISHABLE_KEY must be a real key in production.
// Set to 'pk_live_...' or 'pk_test_...' — never the placeholder value.
const stripeReady =
  !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
  !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('your-')

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: [
      '10 AI generations/month',
      'Basic collaboration',
      'Public projects',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    description: 'Unlimited AI & priority support',
    features: [
      'Unlimited AI generations',
      'Priority processing',
      'Private collaboration workspaces',
      'Podcast hosting',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    description: 'Complete creator solution',
    features: [
      'Everything in Pro',
      'Advanced monetization tools',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
    ],
  },
]

function PaymentsComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleNotify = () => {
    if (!email.includes('@')) { toast.error('Enter a valid email'); return }
    setSubmitted(true)
    toast.success("You're on the list! We'll notify you when payments go live.")
  }

  return (
    <div className="text-center py-12 bg-card border border-border rounded-2xl px-6">
      <div className="text-4xl mb-4">💳</div>
      <h3 className="text-foreground text-xl font-bold mb-2">Payments Coming Soon</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        We're setting up secure payment processing. Join the waitlist to be first to know when
        Pro launches.
      </p>
      {submitted ? (
        <p className="text-primary font-semibold">✅ You're on the waitlist!</p>
      ) : (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="bg-muted text-foreground px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm w-56"
          />
          <button
            onClick={handleNotify}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
          >
            Notify Me
          </button>
        </div>
      )}
    </div>
  )
}

export default function Billing() {
  const { user } = useAuth()
  const [upgrading, setUpgrading] = useState(false)

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (error) return null
      return data
    },
    enabled: !!user?.id,
  })

  const handleUpgrade = async (planId) => {
    if (planId === 'free') { toast.info('You are already on the Free plan'); return }
    if (!stripeReady) { toast.info('Payment processing is coming soon — join the waitlist above!'); return }

    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: planId === 'pro' ? 'price_pro_monthly' : 'price_enterprise_monthly',
          userId: user?.id,
          userEmail: user?.email,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      toast.error(`Upgrade failed: ${err.message}`)
    }
    setUpgrading(false)
  }

  const currentPlan = subscription?.plan || 'free'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">Choose the perfect plan for your needs</p>
      </div>

      {!stripeReady && <PaymentsComingSoon />}

      {subscription && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You are currently on the</p>
                <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
                {subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscription.status === 'active' && <Badge className="h-fit">Active</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`relative ${currentPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-amber-500">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ${plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading || currentPlan === plan.id}
                className="w-full gap-2"
                variant={currentPlan === plan.id ? 'outline' : 'default'}
              >
                {currentPlan === plan.id ? (
                  'Current Plan'
                ) : (
                  <><Zap className="w-4 h-4" />{stripeReady ? 'Upgrade' : 'Join Waitlist'}</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
