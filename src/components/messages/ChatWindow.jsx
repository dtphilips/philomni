import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2, Paperclip, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import FileUpload from '@/components/common/FileUpload';
import FilePreview from '@/components/common/FilePreview';

export default function ChatWindow({ user, conversation, onBack }) {
  const queryClient = useQueryClient();
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date', 200),
    enabled: !!conversation,
    refetchInterval: 2000,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.conversation_id === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      }
    });

    return unsubscribe;
  }, [conversation, queryClient]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    markMessagesAsRead();
  }, [conversation?.id]);

  const getOtherName = () => {
    if (conversation.is_group) return conversation.group_name || 'Group Chat';
    const idx = conversation.participant_ids?.indexOf(user?.id);
    return conversation.participant_names?.[idx === 0 ? 1 : 0] || 'User';
  };

  const getOtherAvatar = () => {
    if (conversation.is_group) return null;
    const idx = conversation.participant_ids?.indexOf(user?.id);
    return conversation.participant_avatars?.[idx === 0 ? 1 : 0];
  };

  const handleSend = async () => {
    if (!newMsg.trim() && attachedFiles.length === 0 || !conversation) return;
    setSending(true);

    const mediaUrls = attachedFiles.map(f => f.url || f.file_url);

    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url || '',
      content: newMsg.trim(),
      media_urls: mediaUrls,
      read: false,
    });

    await base44.entities.Conversation.update(conversation.id, {
      last_message: newMsg.trim() || `Shared ${attachedFiles.length} file(s)`,
      last_message_at: new Date().toISOString(),
      last_message_sender_id: user.id,
      unread_count: 0,
    });

    setNewMsg('');
    setAttachedFiles([]);
    setShowFileUpload(false);
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter(m => !m.read && m.sender_id !== user.id);
    for (const msg of unreadMessages) {
      await base44.entities.Message.update(msg.id, { read: true });
    }
    if (unreadMessages.length > 0) {
      await base44.functions.invoke('updateUnreadCount', {
        conversationId: conversation.id,
        userId: user.id,
      });
    }
  };

  const otherName = getOtherName();
  const otherAvatar = getOtherAvatar();

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="sm:hidden h-10 w-10 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${otherAvatar ? '' : 'bg-muted'}`}>
          {otherAvatar ? (
            <img src={otherAvatar} alt={otherName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{otherName[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{otherName}</p>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          title="Start video call"
          onClick={async () => {
            try {
              const slug = `philomni-dm-${Date.now()}`;
              const domain = import.meta.env.VITE_DAILY_DOMAIN || 'philomni';
              const roomUrl = `https://${domain}.daily.co/${slug}`;
              await base44.entities.Message.create({
                conversation_id: conversation.id,
                sender_id: user.id,
                sender_name: user.full_name,
                sender_avatar: user.avatar_url || '',
                content: `📹 Video call started — join here: ${roomUrl}`,
                read: false,
              });
              window.open(roomUrl, '_blank', 'noopener,noreferrer');
            } catch (_) {}
          }}
        >
          <Video className="w-4 h-4 text-primary" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75vw] sm:max-w-xs ${msg.sender_id === user?.id ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
                {msg.media_urls?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.media_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block max-w-xs">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={url} alt="Message attachment" className="rounded-lg max-h-48 max-w-full" />
                        ) : (
                          <div className="bg-muted rounded-lg p-2 text-xs text-muted-foreground hover:underline">
                            📎 View attachment
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                )}
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {msg.created_date && formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card space-y-2">
        {showFileUpload && (
          <FileUpload
            onFilesSelected={(files) => {
              setAttachedFiles(prev => [...prev, ...files]);
              setShowFileUpload(false);
            }}
            maxFiles={5}
            className="text-sm"
          />
        )}
        
        {attachedFiles.length > 0 && (
          <FilePreview
            files={attachedFiles}
            onRemove={(index) => {
              setAttachedFiles(prev => prev.filter((_, i) => i !== index));
            }}
          />
        )}

        <div className="flex gap-2">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message..."
            className="h-10 bg-muted/50"
            disabled={sending}
          />
          <Button
            onClick={() => setShowFileUpload(!showFileUpload)}
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button onClick={handleSend} disabled={sending || (!newMsg.trim() && attachedFiles.length === 0)} size="icon" className="h-10 w-10 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}