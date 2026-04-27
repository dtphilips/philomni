import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'repost': return <Share2 className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-96 max-h-96 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Notifications</h2>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-accent/20' : ''}`}
                        onClick={() => {
                          if (!notification.read) markAsReadMutation.mutate(notification.id);
                          if (notification.link) window.location.href = notification.link;
                        }}
                      >
                        <div className="flex gap-3">
                          {notification.from_user_avatar && (
                            <img
                              src={notification.from_user_avatar}
                              alt={notification.from_user_name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
                              </div>
                              {getIcon(notification.type)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30 text-center">
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}