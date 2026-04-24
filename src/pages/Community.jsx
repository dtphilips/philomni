import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DiscussionBoard from '@/components/community/DiscussionBoard';
import CommunityEvents from '@/components/community/CommunityEvents';
import { MessageSquare, Calendar } from 'lucide-react';

export default function Community() {
  const { user } = useOutletContext();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Discuss, connect, and grow together</p>
      </div>

      <Tabs defaultValue="discussions">
        <TabsList className="mb-6">
          <TabsTrigger value="discussions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Discussions
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Events
          </TabsTrigger>
        </TabsList>
        <TabsContent value="discussions">
          <DiscussionBoard user={user} />
        </TabsContent>
        <TabsContent value="events">
          <CommunityEvents user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}