import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { format } from 'date-fns';

const BADGE_CATEGORIES = {
  posting: 'Posted Content',
  sharing: 'Shared & Spread',
  helping: 'Community Helper',
  engagement: 'Active Member',
  milestone: 'Milestone'
};

export default function BadgesDisplay({ badges = [] }) {
  const groupedByCategory = badges.reduce((acc, badge) => {
    const cat = badge.category || 'engagement';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {});

  if (badges.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Keep contributing to earn badges!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByCategory).map(([category, categoryBadges]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{BADGE_CATEGORIES[category]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryBadges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center text-center">
                  <div className="text-4xl mb-2">{badge.badge_icon}</div>
                  <p className="text-sm font-medium">{badge.badge_name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.earned_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(badge.earned_at), 'MMM d')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}