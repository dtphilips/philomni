import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InviteCollaboratorModal from './InviteCollaboratorModal';
import CollaboratorsList from './CollaboratorsList';

export default function CollaborationPanel({ itemId, itemType, isOwner, onCollaborationChange }) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Team Collaborators</h3>
        </div>
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Invite
          </Button>
        )}
      </div>

      <CollaboratorsList
        itemId={itemId}
        itemType={itemType}
        isOwner={isOwner}
      />

      {isOwner && (
        <InviteCollaboratorModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          itemId={itemId}
          itemType={itemType}
          onSuccess={onCollaborationChange}
        />
      )}
    </div>
  );
}