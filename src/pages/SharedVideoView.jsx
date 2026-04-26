import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, GitFork, Eye, Edit } from 'lucide-react';
import RatingStars from '@/components/creative/RatingStars';
import VideoEditor from '@/components/video/VideoEditor';
import ShareButton from '@/components/feed/ShareButton';

export default function SharedVideoView() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      const { data: vid } = await supabase.from('shared_videos').select('*').eq('id', videoId).single();
      if (vid) {
        setVideo(vid);
        // Increment view count
        await supabase.from('shared_videos').update({ view_count: (vid?.view_count || 0) + 1 }).eq('id', videoId);
        // Load ratings
        const rtgs = (await supabase.from('video_ratings').select('*').eq('video_id', videoId)).data ?? [];
        setRatings(rtgs);
        if (rtgs.length > 0) {
          const avg = rtgs.reduce((sum, r) => sum + r.rating, 0) / rtgs.length;
          setAverageRating(avg);
        }
        if (user) {
          const myRating = rtgs.find(r => r.user_id === user.id);
          setUserRating(myRating);
          setIsOwner(vid.owner_id === user.id);
        }
      }
      setLoading(false);
    };
    loadVideo();
  }, [videoId, user]);

  const handleRate = async (rating) => {
    if (!user) return;
    if (userRating) {
      (await supabase.from('video_ratings').update({ rating }).eq('id', userRating.id).select().single()).data;
      setUserRating({ ...userRating, rating });
    } else {
      const newRating = (await supabase.from('video_ratings').insert({
        video_id: videoId,
        user_id: user.id,
        rating,
      }).select().single()).data;
      setUserRating(newRating);
      setRatings([...ratings, newRating]);
    }
    const allRatings = userRating ? ratings.map(r => r.id === userRating.id ? { ...r, rating } : r) : [...ratings, { rating }];
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    setAverageRating(avg);
  };

  const handleFork = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    await supabase.from('shared_videos').insert({
      owner_id: user.id,
      owner_name: user.full_name || 'Anonymous',
      owner_avatar: user.avatar_url || '',
      title: `${video.title} (Forked)`,
      description: video.description,
      prompt: video.prompt,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      video_type: video.video_type,
    });
    await supabase.from('shared_videos').update({ fork_count: (video.fork_count || 0) + 1 }).eq('id', videoId);
    navigate('/video-studio');
  };

  const downloadVideo = async () => {
    if (!video?.video_url) return;
    const a = document.createElement('a');
    a.href = video.video_url;
    a.download = `${video.title}.mp4`;
    a.target = '_blank';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Video not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Video Player */}
      <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-8">
        <video
          src={video.video_url}
          controls
          autoPlay
          className="w-full h-full"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Info */}
          <div>
            <h1 className="font-display text-3xl font-bold mb-3">{video.title}</h1>
            <p className="text-muted-foreground mb-4">{video.description}</p>

            {/* Creator */}
            <div className="flex items-center gap-3 mb-4">
              {video.owner_avatar && (
                <img src={video.owner_avatar} alt={video.owner_name} className="w-10 h-10 rounded-full" />
              )}
              <div className="text-sm">
                <p className="font-medium">{video.owner_name}</p>
                <p className="text-xs text-muted-foreground">{video.video_type === 'text_to_video' ? 'Text to Video' : 'Image to Video'}</p>
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground mb-4">
              <p className="font-medium text-foreground mb-2">Prompt</p>
              {video.prompt}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{video.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-muted-foreground" />
                <span>{video.fork_count || 0} forks</span>
              </div>
              {video.duration && (
                <div className="text-muted-foreground">
                  {video.duration}s duration
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
         <div className="space-y-4">
           {/* Actions */}
           <div className="flex gap-2 flex-col">
             {isOwner && (
               <Button
                 onClick={() => setIsEditorOpen(true)}
                 variant="outline"
                 className="gap-2 w-full"
               >
                 <Edit className="w-4 h-4" /> Edit
               </Button>
             )}
             <Button onClick={downloadVideo} variant="outline" className="gap-2 w-full">
               <Download className="w-4 h-4" /> Download
             </Button>
             {!isOwner && (
               <Button onClick={handleFork} className="gap-2 w-full">
                 <GitFork className="w-4 h-4" /> Fork Video
               </Button>
             )}
             <ShareButton video={video} />
           </div>

          {/* Rating */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">Rating</p>
            <RatingStars
              rating={averageRating}
              count={ratings.length}
              onRate={handleRate}
              interactive={user !== null}
              size="md"
            />
            {user && (
              <p className="text-xs text-muted-foreground mt-2">
                {userRating ? `Your rating: ${userRating.rating}★` : 'Click to rate'}
              </p>
            )}
          </div>
        </div>
        </div>

        {isOwner && (
        <VideoEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          videoUrl={video?.video_url}
          onSave={async (edits) => {
            // Update video metadata
            (await supabase.from('shared_videos').update({
              title: video.title,
              ...edits
            }).eq('id', video.id).select().single()).data;
            setIsEditorOpen(false);
          }}
        />
        )}
        </div>
        );
        }