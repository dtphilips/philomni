import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MessageButton({ profileUser, currentUser }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleMessage = async () => {
    setLoading(true);
    try {
      // Check if conversation already exists
      const existing = (await supabase.from('conversations').select('*').eq('participant_ids', [currentUser.id)).data ?? [];

      let conversation;
      if (existing.length > 0) {
        conversation = existing[0];
      } else {
        // Create new conversation
        conversation = (await supabase.from('conversations').insert({
          participant_ids: [currentUser.id, profileUser.id],
          participant_names: [currentUser.full_name, profileUser.full_name],
          participant_avatars: [currentUser.avatar_url || '', profileUser.avatar_url || ''],
          is_group: false,
          unread_count: 0,
        }).select().single()).data;
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate('/messages');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleMessage} disabled={loading} variant="outline" size="sm">
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      Message
    </Button>
  );
}