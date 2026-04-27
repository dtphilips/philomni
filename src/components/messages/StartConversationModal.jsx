import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';

export default function StartConversationModal({ user, open, onOpenChange, onConversationStart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabase.from('users').select('*').limit(100).then(r => r.data ?? []),
    enabled: open,
  });

  const filteredUsers = allUsers.filter(u =>
    u.id !== user?.id &&
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startConversationMutation = useMutation({
    mutationFn: async (selectedUser) => {
      // Check if conversation already exists
      const existing = (await supabase.from('conversations').select('*').eq('participant_ids', [user.id)).data ?? [];

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new conversation
      return (await supabase.from('conversations').insert({
        participant_ids: [user.id, selectedUser.id],
        participant_names: [user.full_name, selectedUser.full_name],
        participant_avatars: [user.avatar_url || '', selectedUser.avatar_url || ''],
        is_group: false,
        unread_count: 0,
      }).select().single()).data;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationStart(conversation);
      onOpenChange(false);
      setSearchQuery('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {searchQuery ? 'No users found' : 'Start typing to search'}
              </p>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => startConversationMutation.mutate(u)}
                  disabled={startConversationMutation.isPending}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}