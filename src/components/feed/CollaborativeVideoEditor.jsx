import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Share2, Lock, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborativeVideoEditor({ isOpen, onClose, projectId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      (await supabase.from('projectCollaborators').insert({
        project_id: projectId,
        collaborator_email: inviteEmail,
        permission: invitePermission
      }).select().single()).data;
      setCollaborators([
        ...collaborators,
        { email: inviteEmail, permission: invitePermission, status: 'pending' }
      ]);
      setInviteEmail('');
      toast.success('Invitation sent');
    } catch (error) {
      toast.error('Failed to invite collaborator');
    }
    setIsInviting(false);
  };

  const updatePermission = async (email, newPermission) => {
    try {
      const updated = collaborators.map(c =>
        c.email === email ? { ...c, permission: newPermission } : c
      );
      setCollaborators(updated);
      toast.success('Permission updated');
    } catch (error) {
      toast.error('Failed to update permission');
    }
  };

  const removeCollaborator = async (email) => {
    try {
      setCollaborators(collaborators.filter(c => c.email !== email));
      toast.success('Collaborator removed');
    } catch (error) {
      toast.error('Failed to remove collaborator');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Collaborative Editing</DialogTitle>
          <DialogDescription>Share this video project with team members</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="manage">Collaborators</TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Permission Level</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  variant={invitePermission === 'viewer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInvitePermission('viewer')}
                  className="flex gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Viewer
                </Button>
                <Button
                  variant={invitePermission === 'editor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInvitePermission('editor')}
                  className="flex gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {invitePermission === 'viewer' ? 'Can view and comment only' : 'Can edit and modify the video'}
              </p>
            </div>

            <Button onClick={handleInvite} disabled={isInviting} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-4">
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No collaborators yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {collaborators.map((collab) => (
                  <div key={collab.email} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{collab.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {collab.permission} • {collab.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {collab.permission === 'viewer' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePermission(collab.email, 'editor')}
                          className="text-xs"
                        >
                          Make Editor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePermission(collab.email, 'viewer')}
                          className="text-xs"
                        >
                          Make Viewer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCollaborator(collab.email)}
                        className="text-xs text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}