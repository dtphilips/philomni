import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteCollaboratorModal({ isOpen, onClose, itemId, itemType, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const entityName = itemType === 'project' ? 'ProjectCollaborator' : 'ScheduledPublicationCollaborator';
      const projectField = itemType === 'project' ? 'project_id' : 'scheduled_publication_id';

      await base44.entities[entityName].create({
        [projectField]: itemId,
        owner_id: user.id,
        collaborator_email: email,
        role: role,
        status: 'pending'
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('viewer');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(`Failed to send invitation: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Team Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm"
            >
              <option value="viewer">Viewer (Read-only)</option>
              <option value="editor">Editor (Can edit)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Viewers can only see the project. Editors can make changes.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Invite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}