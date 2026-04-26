import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, Clock, Users, TrendingUp, Heart, MessageSquare, Share2 } from 'lucide-react';

export default function VideoAnalyticsDashboard() {
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const { currentUser: user } = useAuth();

  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ['videoAnalytics'],
    queryFn: async () => {
      if (!currentUser) return [];
      return supabase.from('video_analytics').select('*') /* TODO filter: { creator_id: currentUser.id }, '-last_updated', 50 */;
    },
    enabled: !!currentUser
  });

  const selectedAnalytics = selectedVideoId
    ? analytics.find(a => a.video_id === selectedVideoId)
    : analytics[0];

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    views: Math.floor(Math.random() * 100) // Mock data
  }));

  const retentionData = selectedAnalytics?.audience_retention || [
    { percentage: 100, viewers: 1000 },
    { percentage: 75, viewers: 750 },
    { percentage: 50, viewers: 500 },
    { percentage: 25, viewers: 250 }
  ];

  const StatCard = ({ icon: IconComponent, label, value, change }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && <p className="text-xs text-green-600 mt-1">↑ {change}%</p>}
          </div>
          <IconComponent className="w-8 h-8 text-primary opacity-60" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  if (!selectedAnalytics) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No video analytics available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Video Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Track performance and engagement</p>
        </div>

        {/* Video Selector */}
        {analytics.length > 1 && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-card">
            <p className="text-sm font-medium mb-2">Select Video</p>
            <select
              value={selectedVideoId || ''}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full md:w-64 px-3 py-2 rounded border border-input bg-background"
            >
              {analytics.map(a => (
                <option key={a.video_id} value={a.video_id}>
                  Video {a.video_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Eye} label="Total Views" value={selectedAnalytics.total_views} />
          <StatCard icon={Users} label="Unique Viewers" value={selectedAnalytics.unique_viewers} />
          <StatCard icon={Clock} label="Avg Watch Time" value={`${Math.round(selectedAnalytics.average_watch_duration)}s`} />
          <StatCard icon={TrendingUp} label="CTR" value={`${Math.round(selectedAnalytics.click_through_rate || 0)}%`} />
        </div>

        {/* Engagement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Likes</p>
                  <p className="text-2xl font-bold">{selectedAnalytics.likes || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="text-2xl font-bold">{selectedAnalytics.comments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Share2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Shares</p>
                  <p className="text-2xl font-bold">{selectedAnalytics.shares || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="retention" className="space-y-6">
          <TabsList>
            <TabsTrigger value="retention">Audience Retention</TabsTrigger>
            <TabsTrigger value="playback">Peak Playback Times</TabsTrigger>
          </TabsList>

          <TabsContent value="retention">
            <Card>
              <CardHeader>
                <CardTitle>Audience Retention Curve</CardTitle>
                <CardDescription>How viewers watch throughout the video</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="percentage" label={{ value: 'Video Progress (%)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Viewers', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="viewers" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback">
            <Card>
              <CardHeader>
                <CardTitle>Peak Playback Times</CardTitle>
                <CardDescription>Views by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                {selectedAnalytics.peak_playback_hour !== undefined && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Peak time: {selectedAnalytics.peak_playback_hour}:00
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}