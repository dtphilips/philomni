import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ChatList({ user, activeConvo, onSelectConvo, onStartNew }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Conversation.list('-last_message_at', 100);
      return all.filter(c => c.participant_ids?.includes(user?.id));
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const filteredConvos = conversations.filter(c => {
    const otherName = getOtherParticipantName(c);
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipantName = (convo) => {
    if (convo.is_group) return convo.group_name || 'Group Chat';
    const idx = convo.participant_ids?.indexOf(user?.id);
    return convo.participant_names?.[idx === 0 ? 1 : 0] || 'User';
  };

  const getOtherParticipantAvatar = (convo) => {
    if (convo.is_group) return null;
    const idx = convo.participant_ids?.indexOf(user?.id);
    return convo.participant_avatars?.[idx === 0 ? 1 : 0];
  };

  return (
    <div className="w-full border-r border-border flex flex-col bg-card h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Messages</h2>
          <Button size="icon" variant="ghost" onClick={onStartNew} className="h-8 w-8">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm bg-muted/50"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConvos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredConvos.map(convo => {
              const otherName = getOtherParticipantName(convo);
              const otherAvatar = getOtherParticipantAvatar(convo);
              const isActive = activeConvo?.id === convo.id;
              const hasUnread = convo.unread_count > 0;

              return (
                <button
                  key={convo.id}
                  onClick={() => onSelectConvo(convo)}
                  className={`w-full text-left p-3 min-h-[64px] hover:bg-muted/70 transition-colors ${
                    isActive ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${otherAvatar ? '' : 'bg-muted'}`}>
                      {otherAvatar ? (
                        <img src={otherAvatar} alt={otherName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{otherName[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                          {otherName}
                        </p>
                        {convo.last_message_at && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {convo.last_message}
                        </p>
                        {hasUnread && (
                          <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center flex-shrink-0 text-xs">
                            {convo.unread_count > 9 ? '9+' : convo.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}