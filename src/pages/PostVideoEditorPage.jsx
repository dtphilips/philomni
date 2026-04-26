import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CapCutStyleEditor from '@/components/video/CapCutStyleEditor';

export default function PostVideoEditorPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();



  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => { const { data } = await supabase.from('posts').select('*').eq('id', postId).single(); return data; }
  });

  const updatePostMutation = useMutation({
    mutationFn: async (edits) => { await supabase.from('posts').update(edits).eq('id', postId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const handleSave = async (edits) => {
    await updatePostMutation.mutateAsync({
      text_overlays: edits.textOverlays,
      video_filters: { brightness: edits.brightness, contrast: edits.contrast, saturation: edits.saturation, temperature: edits.temperature, vibrance: edits.vibrance, blur: edits.blur, hueRotate: edits.hueRotate, rotation: edits.rotation, scale: edits.scale },
      video_speed: edits.speed,
      aspect_ratio: edits.aspectRatio
    });
    navigate(-1);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  const videoUrl = post?.media_urls?.[0];
  if (!post || !videoUrl) return <div className="flex items-center justify-center h-screen">Post not found</div>;

  return <CapCutStyleEditor 
    key={post.id} 
    videoUrl={videoUrl} 
    onSave={handleSave} 
    onBack={() => navigate(-1)}
    initialData={{
      text_overlays: post.text_overlays,
      video_filters: post.video_filters,
      video_speed: post.video_speed,
      aspect_ratio: post.aspect_ratio,
      effects: post.effects
    }}
  />;
}