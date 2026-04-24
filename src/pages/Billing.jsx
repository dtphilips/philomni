import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

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
      'Community support'
    ]
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
      'Custom branding'
    ],
    badge: 'Most Popular'
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
      'SLA guarantee'
    ]
  }
];

export default function Billing() {
  const [upgrading, setUpgrading] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Subscription.filter({ user_id: user.id }).then(s => s[0]);
    }
  });

  const handleUpgrade = async (planId) => {
    if (planId === 'free') {
      toast.info('You are already on the Free plan');
      return;
    }

    setUpgrading(true);
    try {
      // In a real app, this would initiate Stripe Checkout
      toast.info(`Redirecting to payment for ${planId.toUpperCase()} plan...`);
      // Placeholder for Stripe integration
      console.log('Upgrade to:', planId);
    } catch (error) {
      toast.error('Upgrade failed');
    }
    setUpgrading(false);
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">Choose the perfect plan for your needs</p>
      </div>

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
              {subscription.status === 'active' && (
                <Badge className="h-fit">Active</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`relative ${
              currentPlan === plan.id ? 'ring-2 ring-primary' : ''
            }`}
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
                  <>Current Plan</>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Upgrade
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}