import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Zap, Flame } from 'lucide-react';
import Leaderboard from '@/components/gamification/Leaderboard';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import PointsBreakdown from '@/components/gamification/PointsBreakdown';

export default function Gamification() {
  const { data: userPoints } = useQuery({
    queryKey: ['user-points'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('user_points').select('*') /* TODO filter: { user_id: user.id } */.then(p => p[0]);
    }
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('user_badges').select('*') /* TODO filter: { user_id: user.id } */;
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-points'],
    queryFn: () => supabase.from('user_points').select('*')
  });

  const nextLevelPoints = (userPoints?.level || 1) * 1000;
  const progressPercent = ((userPoints?.total_points || 0) % nextLevelPoints) / nextLevelPoints * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          Gamification & Achievements
        </h1>
        <p className="text-muted-foreground mt-1">Earn badges and points for your contributions</p>
      </div>

      {/* User Stats */}
      {userPoints && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userPoints.total_points}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {progressPercent.toFixed(0)}% to level {(userPoints.level || 1) + 1}
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⭐</span> Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userPoints.level || 1}</p>
              <p className="text-xs text-muted-foreground mt-2">Keep contributing to level up!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userPoints.streak_days || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Days of active participation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userBadges.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Achievements unlocked</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Your Badges</TabsTrigger>
          <TabsTrigger value="points">Points Breakdown</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <BadgesDisplay badges={userBadges} />
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <PointsBreakdown userPoints={userPoints} />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Leaderboard allUsers={allUsers} currentUserId={userPoints?.user_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}