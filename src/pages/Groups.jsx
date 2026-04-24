import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import SuggestedConnections from '@/components/discover/SuggestedConnections';
import { Users, Plus, Search } from 'lucide-react';

export default function Groups() {
  const { user: currentUser } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, '-created_date'),
  });

  const { data: userGroups = [] } = useQuery({
    queryKey: ['user-groups', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const members = await base44.entities.GroupMember.filter({ user_id: currentUser.id });
      const groupIds = members.map(m => m.group_id);
      const groups = await Promise.all(
        groupIds.map(id => base44.entities.Group.filter({ id }))
      );
      return groups.flat();
    },
    enabled: !!currentUser,
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const group = allGroups.find(g => g.id === groupId);
      await base44.entities.GroupMember.create({
        group_id: groupId,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_avatar: currentUser.avatar_url || '',
        user_email: currentUser.email,
        role: 'member',
        status: group.is_private ? 'pending' : 'active',
        joined_at: new Date().toISOString(),
      });

      await base44.entities.Group.update(groupId, {
        member_count: (group.member_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    },
  });

  const filteredGroups = allGroups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userGroupIds = new Set(userGroups.map(g => g.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            Groups
          </h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="discover" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups ({userGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No groups found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={userGroupIds.has(group.id)}
                  onJoin={(groupId) => joinGroupMutation.mutate(groupId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          {userGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="mb-4">You haven't joined any groups yet</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Group
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGroups.map(group => (
                <GroupCard key={group.id} group={group} isMember={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

        {/* Modal */}
        <CreateGroupModal user={currentUser} open={showCreateModal} onOpenChange={setShowCreateModal} />
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block">
        <SuggestedConnections variant="compact" />
      </aside>
    </div>
  );
}