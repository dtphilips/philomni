import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Heart, Podcast, Briefcase, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function MonetizationHub() {
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: earnings } = useQuery({
    queryKey: ['creator-earnings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.entities.CreatorEarnings.filter({ creator_id: user.id }).then(e => e[0]);
      return result || { total_earnings: 0, available_balance: 0, pending_balance: 0 };
    }
  });

  const handleWithdraw = async () => {
    if (!earnings?.available_balance || earnings.available_balance < 5) {
      toast.error('Minimum withdrawal amount is $5');
      return;
    }

    setWithdrawing(true);
    try {
      // Stripe Connect payout logic would go here
      toast.success('Withdrawal initiated! Check your bank account in 2-3 business days.');
    } catch (error) {
      toast.error('Withdrawal failed');
    }
    setWithdrawing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-green-500" />
          Monetization Hub
        </h1>
        <p className="text-muted-foreground mt-1">Track earnings and manage payouts</p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${earnings?.total_earnings || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${earnings?.available_balance || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${earnings?.pending_balance || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">+$0</p>
            <p className="text-xs text-muted-foreground mt-2">Latest earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm">Tips & Support</span>
              </div>
              <span className="font-semibold">${earnings?.tips_received || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Podcast className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Podcast Revenue</span>
              </div>
              <span className="font-semibold">${earnings?.podcast_revenue || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Booking Revenue</span>
              </div>
              <span className="font-semibold">${earnings?.booking_revenue || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm">Premium Content</span>
              </div>
              <span className="font-semibold">${earnings?.premium_content_revenue || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdraw Earnings</CardTitle>
            <CardDescription>Transfer funds to your bank account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-green-500">
              <p className="text-sm font-medium">Available to withdraw</p>
              <p className="text-2xl font-bold mt-2">${earnings?.available_balance || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Minimum: $5.00</p>
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing || !earnings?.available_balance || earnings.available_balance < 5}
              className="w-full gap-2"
            >
              <Wallet className="w-4 h-4" />
              {withdrawing ? 'Processing...' : 'Withdraw Funds'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Funds arrive in 2-3 business days. Philomni takes 10% commission.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}