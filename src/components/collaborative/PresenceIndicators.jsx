import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default function PresenceIndicators({ collaborators = [], activeUsers = [] }) {
  const activeUserIds = activeUsers.map(u => u.user_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Active Collaborators
        </CardTitle>
        <CardDescription>Who's currently working on this project</CardDescription>
      </CardHeader>
      <CardContent>
        {collaborators && collaborators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No collaborators yet</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {collaborators.map((col, i) => {
              const isActive = activeUserIds.includes(col.user_id);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative">
                    {col.user_avatar ? (
                      <img
                        src={col.user_avatar}
                        alt={col.user_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {col.user_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{col.user_name}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {col.role}
                    </Badge>
                  </div>
                  {isActive && (
                    <Badge className="text-xs">Active</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}