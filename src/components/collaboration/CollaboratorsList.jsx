import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaboratorsList({ itemId, itemType, isOwner }) {
  const entityName = itemType === 'project' ? 'ProjectCollaborator' : 'ScheduledPublicationCollaborator';
  const projectField = itemType === 'project' ? 'project_id' : 'scheduled_publication_id';

  const { data: collaborators = [], isLoading, refetch } = useQuery({
    queryKey: [entityName, itemId],
    queryFn: async () => {
      const query = {};
      query[projectField] = itemId;
      return base44.entities[entityName].filter(query);
    }
  });

  const handleRemove = async (collaboratorId) => {
    try {
      await base44.entities[entityName].delete(collaboratorId);
      toast.success('Collaborator removed');
      refetch();
    } catch (error) {
      toast.error('Failed to remove collaborator');
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading collaborators...</div>;
  }

  if (!collaborators.length) {
    return <div className="text-sm text-muted-foreground">No collaborators yet</div>;
  }

  return (
    <div className="space-y-3">
      {collaborators.map(collab => (
        <div key={collab.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{collab.collaborator_email}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {collab.role}
              </Badge>
              {collab.status === 'pending' ? (
                <Badge className="bg-yellow-500/10 text-yellow-700 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </Badge>
              ) : (
                <Badge className="bg-green-500/10 text-green-700 text-xs flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Accepted
                </Badge>
              )}
            </div>
          </div>

          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRemove(collab.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}