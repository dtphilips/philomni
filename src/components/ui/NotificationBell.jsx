import React from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function NotificationBell({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => { if (!(user)) return []; const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50); return data ?? []; },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Link to="/notifications" className="relative">
      <Bell className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          variant="default"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Link>
  );
}