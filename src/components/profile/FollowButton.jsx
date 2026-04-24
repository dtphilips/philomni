import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, Loader2 } from 'lucide-react';

export default function FollowButton({ currentUser, targetUserId }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: followRecord } = useQuery({
    queryKey: ['follow', currentUser?.id, targetUserId],
    queryFn: async () => {
      const results = await base44.entities.Follow.filter({
        follower_id: currentUser.id,
        following_id: targetUserId,
      });
      return results[0] || null;
    },
    enabled: !!currentUser && !!targetUserId,
  });

  const isFollowing = !!followRecord;

  const handleToggle = async () => {
    setLoading(true);
    if (isFollowing) {
      await base44.entities.Follow.delete(followRecord.id);
    } else {
      await base44.entities.Follow.create({
        follower_id: currentUser.id,
        following_id: targetUserId,
      });
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