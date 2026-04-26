import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Briefcase, Lightbulb, Flag, Loader2, Shield } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/categories';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useOutletContext();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => supabase.from('users').select('*'),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => supabase.from('posts').select('*'),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => supabase.from('jobs').select('*'),
  });

  const { data: pitches = [] } = useQuery({
    queryKey: ['admin-pitches'],
    queryFn: () => supabase.from('pitches').select('*'),
  });

  if (user && user.role !== 'admin') return <Navigate to="/" />;

  const stats = [
    { icon: Users, label: 'Total Users', value: users.length, color: 'text-blue-600' },
    { icon: FileText, label: 'Total Posts', value: posts.length, color: 'text-green-600' },
    { icon: Briefcase, label: 'Active Jobs', value: jobs.filter(j => j.status === 'open').length, color: 'text-orange-600' },
    { icon: Lightbulb, label: 'Pitches', value: pitches.length, color: 'text-purple-600' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {usersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-sm font-medium text-muted-foreground">{u.full_name?.[0]}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">{ROLE_LABELS[u.role] || u.role || 'none'}</Badge>
                    <Badge variant={u.plan === 'pro' ? 'default' : 'outline'} className="text-xs">{u.plan || 'free'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{post.content?.slice(0, 80)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.like_count || 0} likes</span>
                  <Button variant="ghost" size="sm" className="text-destructive h-7">Flag</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.poster_name}</p>
                </div>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs capitalize">{job.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}