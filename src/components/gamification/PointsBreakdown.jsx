import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function PointsBreakdown({ userPoints }) {
  if (!userPoints) return null;

  const categories = [
    { label: 'Posting', points: userPoints.posting_points, color: 'bg-blue-500' },
    { label: 'Sharing', points: userPoints.sharing_points, color: 'bg-green-500' },
    { label: 'Helping', points: userPoints.helping_points, color: 'bg-purple-500' },
    { label: 'Engagement', points: userPoints.engagement_points, color: 'bg-orange-500' }
  ];

  const total = categories.reduce((sum, cat) => sum + (cat.points || 0), 0);

  return (
    <div className="space-y-4">
      {categories.map(cat => {
        const percentage = total > 0 ? ((cat.points || 0) / total) * 100 : 0;
        return (
          <Card key={cat.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{cat.label}</CardTitle>
                <span className="text-2xl font-bold">{cat.points || 0}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={percentage} />
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% of your total points
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}