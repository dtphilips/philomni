import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { Users, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function PresenceIndicator({ projectId }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPresence();
    const interval = setInterval(loadPresence, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [projectId]);

  const loadPresence = async () => {
    try {
      setLoading(true);
      const members = (await supabase.from('workspacePresences').select('*').eq('workspace_id', projectId)).data ?? [];

      // Filter out stale presences (older than 30 seconds)
      const now = new Date();
      const activeMembers = members.filter(member => {
        const lastSeen = new Date(member.last_seen);
        const diffSeconds = (now - lastSeen) / 1000;
        return diffSeconds < 30;
      });

      setTeamMembers(activeMembers);
    } catch (error) {
      console.error('Failed to load presence:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    editing: 'bg-green-500',
    viewing: 'bg-blue-500',
    idle: 'bg-gray-500'
  };

  const getStatusLabel = (status) => {
    const labels = {
      editing: 'Editing',
      viewing: 'Viewing',
      idle: 'Idle'
    };
    return labels[status] || status;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">{teamMembers.length} online</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Team Members</h3>
          </div>

          {teamMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No one else is editing right now</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user_avatar} />
                      <AvatarFallback className="text-xs">
                        {member.user_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background ${
                        statusColor[member.status] || statusColor.idle
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{member.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getStatusLabel(member.status)}
                      {member.current_section && ` • ${member.current_section}`}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {format(new Date(member.last_seen), 'p')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}