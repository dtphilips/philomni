import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, UserPlus, Check, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { user: user } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => { if (!(user)) return []; const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); return data ?? []; },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => supabase.from('notifications').update(/* TODO */).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => { await supabase.from('notifications').delete().eq('id', notificationId); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => supabase.from('notifications').update(/* TODO */).eq('id', id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(notifications.map(n => supabase.from('notifications').delete().eq('id', n.id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'mention': return <MessageCircle className="w-5 h-5 text-amber-500" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'like': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900';
      case 'comment': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900';
      case 'follow': return 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900';
      case 'mention': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-900';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'like', 'comment', 'follow', 'mention'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <div className="flex gap-2 mb-6">
          {unreadCount > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => clearAllMutation.mutate()}
            disabled={clearAllMutation.isPending}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg border transition-all ${getColor(notification.type)} ${!notification.read ? 'ring-2 ring-primary/30' : ''}`}
            >
              <div className="flex gap-4">
                {notification.from_user_avatar && (
                  <img
                    src={notification.from_user_avatar}
                    alt={notification.from_user_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body || notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {getIcon(notification.type)}
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {notification.link && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = notification.link}
                        className="text-xs"
                      >
                        View
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        className="text-xs text-muted-foreground"
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}