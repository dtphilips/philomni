import React, { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MessageCircle, Share2 } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ContentPerformance() {
  const { data: assets = [] } = useQuery({
    queryKey: ['content-assets'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('content_assets').select('*') /* TODO filter: { user_id: user.id } */;
    }
  });

  const stats = useMemo(() => {
    return {
      totalAssets: assets.length,
      totalViews: assets.reduce((sum, a) => sum + (a.views || 0), 0),
      avgEngagement: assets.length > 0 ? 
        (assets.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / assets.length).toFixed(2) : 0,
      avgCTR: assets.length > 0 ?
        (assets.reduce((sum, a) => sum + (a.click_through_rate || 0), 0) / assets.length).toFixed(2) : 0
    };
  }, [assets]);

  const assetsByType = useMemo(() => {
    const grouped = {};
    assets.forEach(asset => {
      grouped[asset.asset_type] = (grouped[asset.asset_type] || 0) + 1;
    });
    return Object.entries(grouped).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').toUpperCase(),
      value: count
    }));
  }, [assets]);

  const topHashtags = useMemo(() => {
    const hashtagCounts = {};
    assets.forEach(asset => {
      (asset.hashtags || []).forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [assets]);

  const performanceData = useMemo(() => {
    return assets
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(asset => ({
        title: asset.title?.substring(0, 20) || 'Untitled',
        views: asset.views || 0,
        engagement: asset.engagement_rate || 0,
        ctr: asset.click_through_rate || 0
      }));
  }, [assets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Content Performance
        </h1>
        <p className="text-muted-foreground mt-1">Track performance of your reformatted content</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalAssets}</p>
            <p className="text-xs text-muted-foreground mt-2">Reformatted pieces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" /> Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalViews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Avg Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgEngagement}%</p>
            <p className="text-xs text-muted-foreground mt-2">Engagement rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Avg CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgCTR}%</p>
            <p className="text-xs text-muted-foreground mt-2">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="types">Asset Types</TabsTrigger>
          <TabsTrigger value="hashtags">Top Hashtags</TabsTrigger>
          <TabsTrigger value="assets">All Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Performing Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#10b981" name="Views" />
                  <Bar dataKey="engagement" fill="#f59e0b" name="Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assets by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {assetsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={assetsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Hashtags</CardTitle>
              <CardDescription>Most used hashtags in your content</CardDescription>
            </CardHeader>
            <CardContent>
              {topHashtags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hashtags yet</p>
              ) : (
                <div className="space-y-2">
                  {topHashtags.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium">{item.tag}</span>
                      <Badge variant="secondary">{item.count} used</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets created yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assets.map(asset => (
                    <div key={asset.id} className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{asset.title}</p>
                        <p className="text-xs text-muted-foreground">{asset.asset_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-semibold">{asset.views || 0}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold">{asset.engagement_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">eng</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold">{asset.click_through_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}