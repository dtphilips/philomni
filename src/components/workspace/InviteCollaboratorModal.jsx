import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Send, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function InviteCollaboratorModal({ workspace, open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('editor');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.asServiceRole.entities.User.list('', 100),
    enabled: open,
  });

  const inviteMutation = useMutation({
    mutationFn: async (userId) => {
      const user = allUsers.find(u => u.id === userId);
      const updatedCollaborators = [
        ...workspace.collaborators,
        {
          user_id: userId,
          user_name: user.full_name,
          user_avatar: user.avatar_url || '',
          role: selectedRole,
          joined_at: new Date().toISOString(),
        },
      ];

      await base44.entities.CollaborativeWorkspace.update(workspace.id, {
        collaborators: updatedCollaborators,
      });

      // Send invitation notification
      await base44.entities.Notification.create({
        user_id: userId,
        type: 'message',
        title: `Invited to collaborate on "${workspace.name}"`,
        body: `You've been invited as a ${selectedRole}`,
        from_user_id: workspace.owner_id,
        link: `/collaborative/${workspace.id}`,
        read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setSelectedUserId(null);
      setSelectedRole('editor');
      setSearchQuery('');
      onOpenChange(false);
    },
  });

  const filteredUsers = allUsers.filter(u => {
    const isOwner = u.id === workspace.owner_id;
    const isAlreadyCollaborator = workspace.collaborators.some(c => c.user_id === u.id);
    return !isOwner && !isAlreadyCollaborator &&
      (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Search User</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {selectedUserId && (
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read only</SelectItem>
                  <SelectItem value="editor">Editor - Can edit</SelectItem>
                  <SelectItem value="owner">Owner - Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {searchQuery ? 'No users found' : 'Start typing to search'}
              </p>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    selectedUserId === u.id ? 'bg-primary/10 border-2 border-primary' : 'hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${u.avatar_url ? '' : 'bg-muted'}`}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{u.full_name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <Button
            onClick={() => inviteMutation.mutate(selectedUserId)}
            disabled={!selectedUserId || inviteMutation.isPending}
            className="w-full"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}