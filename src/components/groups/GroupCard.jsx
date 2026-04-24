import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Lock } from 'lucide-react';

export default function GroupCard({ group, onJoin, isMember }) {
  return (
    <Link to={`/groups/${group.id}`} className="block">
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        {group.cover_image && (
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
            <img src={group.cover_image} alt={group.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground line-clamp-1">{group.name}</h3>
                {group.is_private && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{group.category}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>

          {/* Tags */}
          {group.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
            </div>
            {!isMember && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onJoin?.(group.id);
                }}
              >
                Join
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}