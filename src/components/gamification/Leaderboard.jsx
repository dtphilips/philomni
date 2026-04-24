import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard({ allUsers = [], currentUserId }) {
  const sorted = useMemo(() => {
    return [...allUsers].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }, [allUsers]);

  const getMedalIcon = (rank) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Leaderboard</CardTitle>
        <CardDescription>Top contributors in the community</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sorted.slice(0, 50).map((user, idx) => {
            const isCurrentUser = user.user_id === currentUserId;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isCurrentUser ? 'bg-primary/10 border-primary' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                    {idx < 3 ? getMedalIcon(idx) : <span>#{idx + 1}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {user.user_name || 'Anonymous'} {isCurrentUser && <span className="text-xs text-muted-foreground">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Level {user.level || 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{user.total_points || 0}</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}