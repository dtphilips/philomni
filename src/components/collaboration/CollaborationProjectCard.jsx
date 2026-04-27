import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  MessageCircle, UserPlus, Heart, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CollaborationProjectCard({ project, currentUserId }) {
  const [isLiking, setIsLiking] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const collaborationTypeLabels = {
    feedback: '💬 Feedback',
    freelance: '💼 Freelance',
    partnership: '🤝 Partnership',
    mentoring: '👨‍🏫 Mentoring',
    learning: '📚 Learning'
  };

  const handleSendConnectionRequest = async () => {
    setIsSendingRequest(true);
    try {
      // Create a follow/connection request
      /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);

      toast.success(`Connection request sent to ${project.owner_name}!`);
    } catch (error) {
      console.error('Failed to send request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      // Open/create conversation
      const conversations = (await supabase.from('conversations').select('*').eq('participant_ids', currentUserId)).data ?? [];

      let conversation = conversations.find(c =>
        c.participant_ids.includes(project.owner_id)
      );

      if (!conversation) {
        conversation = (await supabase.from('conversations').insert({
          participant_ids: [currentUserId, project.owner_id],
          participant_names: [currentUserId, project.owner_name],
          is_group: false
        }).select().single()).data;
      }

      // Navigate to messages would happen here in a real app
      window.location.href = '/messages';
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      setIsLiked(!isLiked);
      // Increment like count
      await supabase.from('portfolio_projects').update({
        like_count: (project.like_count || 0) + (isLiked ? -1 : 1)
      });
    } catch (error) {
      console.error('Failed to like project:', error);
      setIsLiked(!isLiked);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Project Image */}
      {project.thumbnail_url && (
        <div className="w-full h-48 bg-muted overflow-hidden">
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}

      <CardHeader className="flex-1 pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                by <span className="font-semibold">{project.owner_name}</span>
              </p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {project.category?.replace('-', ' ')}
            </Badge>
          </div>

          <CardDescription className="line-clamp-2 text-sm">
            {project.description}
          </CardDescription>

          {/* Collaboration Types */}
          {project.collaboration_types && project.collaboration_types.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {project.collaboration_types.map(type => (
                <Badge
                  key={type}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                >
                  {collaborationTypeLabels[type] || type}
                </Badge>
              ))}
            </div>
          )}

          {/* Project Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {project.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
            {project.completed_at && (
              <p>Completed {format(new Date(project.completed_at), 'MMM yyyy')}</p>
            )}
            <p>❤️ {project.like_count || 0} likes • 👁️ {project.view_count || 0} views</p>
          </div>
        </div>
      </CardHeader>

      {/* Actions */}
      <CardContent className="pt-3 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleSendConnectionRequest}
            disabled={isSendingRequest}
          >
            {isSendingRequest ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Connect
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={handleSendMessage}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="w-full gap-1.5"
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart
            className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-destructive' : ''}`}
          />
          {isLiked ? 'Liked' : 'Like'}
        </Button>
      </CardContent>
    </Card>
  );
}