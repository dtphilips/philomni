import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Plus, X, ChevronLeft, ChevronRight, Heart, Send,
  Image, Video, Type, Archive, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stories() {
  const { currentUser: user } = useAuth();

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return supabase.from('statuses').select('*') /* TODO filter: { is_archived: false } */;
    },
  });

  const { data: myArchive = [] } = useQuery({
    queryKey: ['story-archive'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('statuses').select('*') /* TODO filter: { created_by: user.id } */;
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stories</h1>
          <p className="text-muted-foreground text-sm mt-1">Stories disappear after 24 hours · Your archive is permanent</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Archive className="w-3.5 h-3.5" />
          {myArchive.length} archived
        </Badge>
      </div>

      {/* Story grid with archive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {myArchive.map(story => (
          <div key={story.id} className="aspect-[9/16] rounded-xl overflow-hidden relative bg-muted">
            {story.media_url ? (
              <img src={story.media_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/5">
                <p className="text-sm text-center text-foreground/80">{story.content}</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-xs">
                {formatDistanceToNow(new Date(story.created_date), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
