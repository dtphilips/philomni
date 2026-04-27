import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, Loader2 } from 'lucide-react';

export default function FollowButton({ currentUser, targetUserId }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: followRecord } = useQuery({
    queryKey: ['follow', currentUser?.id, targetUserId],
    queryFn: async () => {
      const results = (await supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', targetUserId)).data ?? [];
      return results[0] || null;
    },
    enabled: !!currentUser && !!targetUserId,
  });

  const isFollowing = !!followRecord;

  const handleToggle = async () => {
    setLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('id', followRecord.id);
    } else {
      (await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: targetUserId,
      }).select().single()).data;
    }
    queryClient.invalidateQueries({ queryKey: ['follow', currentUser?.id, targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['follower-count', targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['following-count', currentUser?.id] });
    setLoading(false);
  };

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleToggle}
      disabled={loading}
      className="min-w-[90px]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <><UserCheck className="w-4 h-4 mr-1" />Following</>
      ) : (
        <><UserPlus className="w-4 h-4 mr-1" />Follow</>
      )}
    </Button>
  );
}