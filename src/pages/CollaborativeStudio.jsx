import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen, UserPlus, Settings, Share2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WorkspaceSelector from '@/components/workspace/WorkspaceSelector';
import InviteCollaboratorModal from '@/components/workspace/InviteCollaboratorModal';
import TaskBoard from '@/components/workspace/TaskBoard';

export default function CollaborativeStudio() {
  const { user: currentUser } = useOutletContext();
  const { workspaceId } = useParams();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', currentUser?.id],
    queryFn: async () => {
      const all = await base44.entities.CollaborativeWorkspace.list('-created_at', 50);
      return all.filter(w =>
        w.owner_id === currentUser?.id ||
        w.collaborators?.some(c => c.user_id === currentUser?.id)
      );
    },
    enabled: !!currentUser,
  });

  const activeWorkspace = workspaceId
    ? workspaces.find(w => w.id === workspaceId)
    : workspaces[0];

  const isOwner = activeWorkspace?.owner_id === currentUser?.id;
  const userRole = activeWorkspace?.collaborators?.find(c => c.user_id === currentUser?.id)?.role || 'viewer';
  const canEdit = isOwner || userRole === 'editor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Collaborative Workspace</h1>
        <Button onClick={() => setShowCreateWorkspace(true)}>
          <FolderOpen className="w-4 h-4 mr-2" /> New Workspace
        </Button>
      </div>

      {/* Workspace Tabs */}
      {workspaces.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-2">
            {workspaces.map(w => (
              <a
                key={w.id}
                href={`/collaborative/${w.id}`}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeWorkspace?.id === w.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {w.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {activeWorkspace ? (
        <div className="space-y-6">
          {/* Workspace Info */}
          <div className="p-6 bg-card rounded-lg border border-border space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{activeWorkspace.name}</h2>
                {activeWorkspace.description && (
                  <p className="text-muted-foreground mt-1">{activeWorkspace.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{activeWorkspace.project_type}</Badge>
                <Badge className={isOwner ? 'bg-primary/10 text-primary' : 'bg-muted'}>{userRole}</Badge>
              </div>
            </div>

            {/* Collaborators Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators ({activeWorkspace.collaborators?.length || 0})
                </h3>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Invite
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeWorkspace.collaborators?.map(collab => (
                  <div key={collab.user_id} className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {collab.user_avatar ? (
                        <img src={collab.user_avatar} alt={collab.user_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium">{collab.user_name?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{collab.user_name}</p>
                      <Badge variant="outline" className="text-xs mt-1">{collab.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <TaskBoard workspaceId={activeWorkspace.id} collaborators={activeWorkspace.collaborators} />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <div className="p-6 bg-card rounded-lg border border-border text-center">
                <Share2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Drop files here to share with collaborators</p>
              </div>
            </TabsContent>

            {isOwner && (
              <TabsContent value="settings" className="mt-4">
                <div className="p-6 bg-card rounded-lg border border-border space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Workspace Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">Manage workspace name, permissions, and member roles.</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-4">No workspaces yet</p>
          <Button onClick={() => setShowCreateWorkspace(true)}>
            Create Your First Workspace
          </Button>
        </div>
      )}

      {/* Modals */}
      <WorkspaceSelector user={currentUser} open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace} />
      {activeWorkspace && (
        <InviteCollaboratorModal workspace={activeWorkspace} open={showInvite} onOpenChange={setShowInvite} />
      )}
    </div>
  );
}