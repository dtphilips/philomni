import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Users, MapPin, Smartphone, Link2, Download, Share2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function CreatorAnalytics() {
  const [dateRange, setDateRange] = useState(30); // days

  const { data: analyticsEvents = [] } = useQuery({
    queryKey: ['analytics-events', dateRange],
    queryFn: async () => {
      const user = user /* useAuth() */;
      const startDate = subDays(new Date(), dateRange);
      
      return supabase.from('analytics_events').select('*') /* TODO filter: {
        creator_id: user.id
      } */.then(events => 
        events.filter(e => new Date(e.timestamp) >= startDate)
      );
    }
  });

  // Process data for charts
  const eventsByDay = useMemo(() => {
    const grouped = {};
    analyticsEvents.forEach(event => {
      const day = format(new Date(event.timestamp), 'MMM dd');
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return Object.entries(grouped).map(([day, count]) => ({ day, events: count }));
  }, [analyticsEvents]);

  const eventsByType = useMemo(() => {
    const grouped = {};
    analyticsEvents.forEach(event => {
      grouped[event.event_type] = (grouped[event.event_type] || 0) + 1;
    });
    return Object.entries(grouped).map(([type, count]) => ({ 
      name: type.charAt(0).toUpperCase() + type.slice(1), 
      value: count 
    }));
  }, [analyticsEvents]);

  const deviceBreakdown = useMemo(() => {
    const grouped = {};
    analyticsEvents.forEach(event => {
      const device = event.visitor_device || 'unknown';
      grouped[device] = (grouped[device] || 0) + 1;
    });
    return Object.entries(grouped).map(([device, count]) => ({ 
      name: device.charAt(0).toUpperCase() + device.slice(1), 
      value: count 
    }));
  }, [analyticsEvents]);

  const locationBreakdown = useMemo(() => {
    const grouped = {};
    analyticsEvents.forEach(event => {
      if (event.visitor_country) {
        grouped[event.visitor_country] = (grouped[event.visitor_country] || 0) + 1;
      }
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, visits: count }));
  }, [analyticsEvents]);

  const conversionRate = useMemo(() => {
    const conversions = analyticsEvents.filter(e => e.conversion).length;
    return analyticsEvents.length > 0 ? ((conversions / analyticsEvents.length) * 100).toFixed(2) : 0;
  }, [analyticsEvents]);

  const stats = {
    totalEvents: analyticsEvents.length,
    views: analyticsEvents.filter(e => e.event_type === 'view').length,
    clicks: analyticsEvents.filter(e => e.event_type === 'click').length,
    shares: analyticsEvents.filter(e => e.event_type === 'share').length,
    conversions: analyticsEvents.filter(e => e.conversion).length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Content Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track performance and audience engagement</p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setDateRange(days)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              dateRange === days
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary'
            }`}
          >
            {days === 7 ? 'Last 7 days' : days === 30 ? 'Last 30 days' : 'Last 90 days'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalEvents}</p>
            <p className="text-xs text-muted-foreground mt-2">Total interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.views}</p>
            <p className="text-xs text-muted-foreground mt-2">Page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.clicks}</p>
            <p className="text-xs text-muted-foreground mt-2">Link clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.shares}</p>
            <p className="text-xs text-muted-foreground mt-2">Times shared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">{stats.conversions} conversions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Types</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {eventsByType.map((event, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></div>
                      <span className="text-sm">{event.name}</span>
                    </div>
                    <Badge variant="secondary">{event.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {locationBreakdown.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{loc.country}</span>
                    <Badge>{loc.visits}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}