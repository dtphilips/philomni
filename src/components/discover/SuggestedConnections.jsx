import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Loader2, UserPlus, LogIn, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SuggestedConnections({ variant = 'compact' }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [joinedGroupIds, setJoinedGroupIds] = useState(new Set());

  useEffect(() => {
    loadSuggestions();
    loadUserConnections();
  }, []);

  const loadUserConnections = async () => {
    try {
      const [follows, groupMembers] = await Promise.all([
        supabase.from('follows').select('*').eq('follower_id', user?.id ?? '').then(r => r.data ?? []),
        supabase.from('group_members').select('*').eq('user_id', user?.id ?? '').then(r => r.data ?? []),
      ]);

      setFollowingIds(new Set(follows.map(f => f.following_id)));
      setJoinedGroupIds(new Set(groupMembers.map(gm => gm.group_id)));
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await supabase.from('follows').insert({
        follower_id: user?.id,
        following_id: userId,
      });
      setFollowingIds(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const user = user /* useAuth() */;
      (await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url,
        user_email: user.email,
        role: 'member',
      }).select().single()).data;
      setJoinedGroupIds(prev => new Set([...prev, groupId]));
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!suggestions || (suggestions.users.length === 0 && suggestions.groups.length === 0)) {
    return null;
  }

  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Suggested Connections</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on your interests & collaborations
            </p>
          </div>
          <Zap className="w-4 h-4 text-primary" />
        </div>

        <div className="space-y-2">
          {/* Users */}
          {suggestions.users.slice(0, 3).map(user => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">{user.name?.[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${user.id}`} className="text-xs font-medium hover:text-primary truncate block">
                  {user.name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFollow(user.id)}
                disabled={followingIds.has(user.id)}
                className="h-7 px-2 text-xs flex-shrink-0"
              >
                {followingIds.has(user.id) ? 'Following' : <UserPlus className="w-3 h-3" />}
              </Button>
            </div>
          ))}

          {/* Groups */}
          {suggestions.groups.slice(0, 2).map(group => (
            <div key={group.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
                {group.cover ? (
                  <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">{group.name?.[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/groups`} className="text-xs font-medium hover:text-primary truncate block">
                  {group.name}
                </Link>
                <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleJoinGroup(group.id)}
                disabled={joinedGroupIds.has(group.id)}
                className="h-7 px-2 text-xs flex-shrink-0"
              >
                {joinedGroupIds.has(group.id) ? 'Joined' : <LogIn className="w-3 h-3" />}
              </Button>
            </div>
          ))}
        </div>

        <Link
          to="/search?category=members"
          className="text-xs text-primary hover:underline block mt-3 text-center font-medium"
        >
          View all suggestions →
        </Link>
      </Card>
    );
  }

  // Full variant
  return (
    <div className="space-y-8">
      {/* Users Section */}
      {suggestions.users.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Suggested People</span>
            <Badge variant="secondary">{suggestions.users.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.users.map(user => (
              <Card key={user.id} className="p-4 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <Link to={`/user/${user.id}`} className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-medium">{user.name?.[0]}</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${user.id}`} className="font-semibold text-sm hover:text-primary block">
                      {user.name}
                    </Link>
                    {user.headline && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{user.headline}</p>
                    )}
                  </div>
                </div>

                {user.skills.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {user.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => handleFollow(user.id)}
                  disabled={followingIds.has(user.id)}
                  className="w-full mt-auto"
                  variant={followingIds.has(user.id) ? 'outline' : 'default'}
                >
                  {followingIds.has(user.id) ? 'Following' : 'Follow'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Groups Section */}
      {suggestions.groups.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Suggested Groups</span>
            <Badge variant="secondary">{suggestions.groups.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.groups.map(group => (
              <Card key={group.id} className="p-4 flex flex-col overflow-hidden">
                {group.cover && (
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-sm mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Badge variant="outline" className="text-xs capitalize">
                    {group.category}
                  </Badge>
                  <span>•</span>
                  <span>{group.memberCount} members</span>
                </div>

                <Button
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={joinedGroupIds.has(group.id)}
                  className="w-full mt-auto"
                  variant={joinedGroupIds.has(group.id) ? 'outline' : 'default'}
                >
                  {joinedGroupIds.has(group.id) ? 'Joined' : 'Join Group'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}