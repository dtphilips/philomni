import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, File, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function VideoMessages() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState({});
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['videoMessages'],
    queryFn: async () => {
      if (!currentUser) return [];
      return base44.entities.VideoMessage.filter({}, '-created_date', 200);
    },
    enabled: !!currentUser
  });

  // Group messages by conversation
  useEffect(() => {
    if (!currentUser) return;
    const grouped = {};
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id;
      if (!grouped[otherUserId]) grouped[otherUserId] = [];
      grouped[otherUserId].push(msg);
    });
    setConversations(grouped);
  }, [messages, currentUser]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser || !currentUser) return;
    try {
      await base44.entities.VideoMessage.create({
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar_url,
        recipient_id: selectedUser,
        content: messageInput
      });
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['videoMessages'] });
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const currentConversation = selectedUser ? conversations[selectedUser] || [] : [];
  const unreadCount = messages.filter(m => m.recipient_id === currentUser?.id && !m.is_read).length;

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading messages...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">Messages</h2>
          <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {Object.entries(conversations).map(([userId, msgs]) => {
            const lastMsg = msgs[msgs.length - 1];
            const isSelected = selectedUser === userId;
            return (
              <button
                key={userId}
                onClick={() => setSelectedUser(userId)}
                className={`w-full p-4 border-b border-border text-left hover:bg-muted transition-colors ${
                  isSelected ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lastMsg.sender_name || userId}</p>
                    <p className="text-xs text-muted-foreground truncate">{lastMsg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(lastMsg.created_date), { addSuffix: false })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
              <h3 className="font-semibold">{currentConversation[0]?.sender_name || selectedUser}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.map(msg => {
                const isOwn = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-lg p-3 ${
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.draft_id && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <p className="text-xs opacity-75 flex items-center gap-1">
                            <File className="w-3 h-3" /> Shared Draft
                          </p>
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(msg.created_date))}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="h-24 border-t border-border bg-card p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleSendMessage();
                  }}
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={handleSendMessage} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}