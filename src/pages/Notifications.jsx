import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageCircle, UserPlus, Briefcase, BookOpen, Settings, CheckCheck, Trash2, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SAMPLE_NOTIFICATIONS = [
  { id: 'n1',  type: 'like',    actor_name: 'Sarah Kim',    actor_avatar: null, message: 'liked your post',                                              created_at: new Date(Date.now() - 7200000).toISOString(),    read: false },
  { id: 'n2',  type: 'follow',  actor_name: 'Marcus Osei',  actor_avatar: null, message: 'started following you',                                        created_at: new Date(Date.now() - 18000000).toISOString(),   read: false },
  { id: 'n3',  type: 'comment', actor_name: 'Priya Sharma', actor_avatar: null, message: 'commented on your post: "This is fire 🔥"',                    created_at: new Date(Date.now() - 86400000).toISOString(),   read: true  },
  { id: 'n4',  type: 'job',     actor_name: null,           actor_avatar: null, message: 'Your job application was viewed by Canva',                     created_at: new Date(Date.now() - 172800000).toISOString(),  read: true  },
  { id: 'n5',  type: 'system',  actor_name: null,           actor_avatar: null, message: 'Course enrollment confirmed: "Social Media Growth Masterclass"',created_at: new Date(Date.now() - 259200000).toISOString(),  read: true  },
  { id: 'n6',  type: 'like',    actor_name: 'Tyler Osei',   actor_avatar: null, message: 'liked your photo',                                             created_at: new Date(Date.now() - 345600000).toISOString(),  read: true  },
  { id: 'n7',  type: 'comment', actor_name: 'Emma Laurent',  actor_avatar: null, message: 'replied to your comment',                                      created_at: new Date(Date.now() - 432000000).toISOString(),  read: true  },
  { id: 'n8',  type: 'follow',  actor_name: 'Jordan Blake',  actor_avatar: null, message: 'started following you',                                        created_at: new Date(Date.now() - 518400000).toISOString(),  read: true  },
  { id: 'n9',  type: 'job',     actor_name: null,           actor_avatar: null, message: 'New job match: "UGC Creator" at Adobe',                        created_at: new Date(Date.now() - 604800000).toISOString(),  read: true  },
  { id: 'n10', type: 'system',  actor_name: null,           actor_avatar: null, message: 'Welcome to Philomni Pro! Your upgrade is active.',             created_at: new Date(Date.now() - 691200000).toISOString(),  read: true  },
];

const FILTER_TABS = [
  { key: 'all',     label: 'All' },
  { key: 'like',    label: 'Likes' },
  { key: 'comment', label: 'Comments' },
  { key: 'follow',  label: 'Follows' },
  { key: 'job',     label: 'Jobs' },
  { key: 'system',  label: 'System' },
];

function getTypeConfig(type) {
  switch (type) {
    case 'like':    return { Icon: Heart,         bg: 'bg-pink-500/20',   iconColor: 'text-pink-400' };
    case 'comment': return { Icon: MessageCircle, bg: 'bg-blue-500/20',   iconColor: 'text-blue-400' };
    case 'follow':  return { Icon: UserPlus,      bg: 'bg-violet-500/20', iconColor: 'text-violet-400' };
    case 'job':     return { Icon: Briefcase,     bg: 'bg-amber-500/20',  iconColor: 'text-amber-400' };
    case 'system':  return { Icon: Bell,          bg: 'bg-gray-500/20',   iconColor: 'text-gray-400' };
    default:        return { Icon: Bell,          bg: 'bg-gray-500/20',   iconColor: 'text-gray-400' };
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const channelRef = useRef(null);

  // Load notifications — no auth dependency, get session inside
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setNotifications(SAMPLE_NOTIFICATIONS);
        setLoading(false);
        clearTimeout(timeout);
        return;
      }
      const uid = session.user.id;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications(data && data.length > 0 ? data : SAMPLE_NOTIFICATIONS);
      } catch {
        setNotifications(SAMPLE_NOTIFICATIONS);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }

      // Realtime subscription
      channelRef.current = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          (payload) => { setNotifications((prev) => [payload.new, ...prev]); }
        )
        .subscribe();
    }

    load();

    return () => {
      clearTimeout(timeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []); // runs once — session fetched inside

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  function markRead(id) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (user && !id.startsWith('n')) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {});
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      } catch {
        // optimistic update already applied
      }
    }
    setMarkingAll(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
          >
            {markingAll
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCheck className="w-4 h-4" />
            }
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Check back later for updates
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const { Icon, bg, iconColor } = getTypeConfig(notification.type);
            const hasAvatar = !!notification.actor_avatar;
            const hasActor = !!notification.actor_name;

            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markRead(notification.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-card border-border hover:bg-muted/30'
                    : 'bg-card border-primary/20 hover:bg-muted/30'
                }`}
              >
                {/* Avatar or Icon */}
                <div className="flex-shrink-0">
                  {hasAvatar ? (
                    <img
                      src={notification.actor_avatar}
                      alt={notification.actor_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : hasActor ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                      <span className={`text-sm font-semibold ${iconColor}`}>
                        {getInitials(notification.actor_name)}
                      </span>
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    {notification.actor_name && (
                      <span className="font-semibold">{notification.actor_name} </span>
                    )}
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread dot */}
                <div className="flex-shrink-0 flex items-center self-center pl-1">
                  {!notification.read ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  ) : (
                    <div className="w-2.5 h-2.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
