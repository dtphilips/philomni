import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Heart, MessageCircle, Share2, Music2, Plus, Volume2, VolumeX,
  ChevronUp, ChevronDown, Upload, X, Play, Pause, Clapperboard
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────
// Single Reel Card
// ─────────────────────────────────────────────────────────
function ReelCard({ reel, isActive, currentUser }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleLike = async () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try {
      if (!liked) {
        (await supabase.from('likes').insert({ post_id: reel.id, user_id: currentUser?.id }).select().single()).data;
      }
    } catch (_) {}
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      (await supabase.from('comments').insert({ post_id: reel.id, content: comment }).select().single()).data;
      setComment('');
      qc.invalidateQueries({ queryKey: ['reel-comments', reel.id] });
      toast.success('Comment posted');
    } catch (_) {
      toast.error('Failed to post comment');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/reels/${reel.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Video */}
      {reel.video_url ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
          onClick={togglePlay}
        />
      ) : reel.media_url ? (
        <img src={reel.media_url} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-black flex items-center justify-center p-8">
          <p className="text-white text-xl font-bold text-center">{reel.content}</p>
        </div>
      )}

      {/* Play/pause overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
        <Link to={`/user/${reel.created_by}`} className="flex items-center gap-2 mb-2 pointer-events-auto">
          <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden ring-2 ring-white/40">
            {reel.author_avatar
              ? <img src={reel.author_avatar} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{reel.author_name?.[0]}</div>}
          </div>
          <span className="text-white font-semibold text-sm">{reel.author_name}</span>
        </Link>
        <p className="text-white/90 text-sm leading-relaxed line-clamp-2">{reel.content}</p>
        {reel.hashtags?.length > 0 && (
          <p className="text-white/70 text-xs mt-1">{reel.hashtags.map(h => `#${h}`).join(' ')}</p>
        )}
        {reel.music_track && (
          <div className="flex items-center gap-1.5 mt-2">
            <Music2 className="w-3.5 h-3.5 text-white/80" />
            <span className="text-white/80 text-xs">{reel.music_track}</span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/30 ${liked ? 'text-red-500' : 'text-white'}`}>
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-white text-xs font-medium">{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 text-white">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-white text-xs font-medium">{reel.comments_count || 0}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 text-white">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
        <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 text-white">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
        </button>
      </div>

      {/* Comments drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl p-4 max-h-[60%] flex flex-col z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Comments</h3>
              <button onClick={() => setShowComments(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              <p className="text-sm text-muted-foreground text-center py-4">Be the first to comment</p>
            </div>
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Add a comment…"
                className="flex-1 rounded-full border px-4 py-2 text-sm bg-background outline-none"
              />
              <Button size="sm" onClick={handleComment}>Post</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Upload Reel Dialog
// ─────────────────────────────────────────────────────────
function UploadReelDialog({ open, onClose, currentUser }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type.startsWith('video/') || f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      toast.error('Please select a video or image file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const _uPath = `uploads/${Date.now()}-${file.name}`;
      const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, file, { upsert: true });
      if (_uErr) throw _uErr;
      const { data: { publicUrl: fileUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
      await supabase.from('posts').insert({
        content: caption,
        post_type: 'reel',
        video_url: file.type.startsWith('video/') ? fileUrl : null,
        media_url: file.type.startsWith('image/') ? fileUrl : null,
        visibility: 'public',
      });
      qc.invalidateQueries({ queryKey: ['reels'] });
      toast.success('Reel posted!');
      onClose();
      setFile(null); setPreview(null); setCaption('');
    } catch (_) {
      toast.error('Failed to upload reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleFile} />
          {preview ? (
            <div className="relative aspect-[9/16] max-h-64 mx-auto rounded-xl overflow-hidden bg-black">
              {file?.type.startsWith('video/')
                ? <video src={preview} controls className="w-full h-full object-cover" />
                : <img src={preview} className="w-full h-full object-cover" alt="" />}
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[9/16] max-h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="w-8 h-8" />
              <p className="text-sm font-medium">Upload video or photo</p>
              <p className="text-xs">Up to 3 minutes</p>
            </button>
          )}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption, add hashtags…"
            className="w-full p-3 rounded-lg border bg-background text-sm resize-none h-20 outline-none"
          />
          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? 'Uploading…' : 'Share Reel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// Main Reels Page
// ─────────────────────────────────────────────────────────
export default function Reels() {
  const { user } = useOutletContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const containerRef = useRef(null);

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn: async () => { const { data } = await supabase.from('posts').select('*').eq('post_type', 'reel').eq('visibility', 'public'); return data ?? []; },
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const idx = Math.round(scrollTop / clientHeight);
    setActiveIndex(idx);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (direction) => {
    if (!containerRef.current) return;
    const { clientHeight } = containerRef.current;
    containerRef.current.scrollBy({ top: direction * clientHeight, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-20">
      {/* Scrollable reel container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white gap-4">
            <Clapperboard className="w-16 h-16 opacity-30" />
            <p className="text-lg font-semibold opacity-60">No reels yet</p>
            <p className="text-sm opacity-40">Be the first to share a reel</p>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="mt-2 border-white/30 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Upload Reel
            </Button>
          </div>
        ) : (
          reels.map((reel, i) => (
            <div key={reel.id} className="h-screen w-full snap-start flex-shrink-0">
              <ReelCard reel={reel} isActive={i === activeIndex} currentUser={user} />
            </div>
          ))
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Up/Down nav */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        <button
          onClick={() => scrollTo(-1)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollTo(1)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Upload dialog */}
      <UploadReelDialog open={uploadOpen} onClose={() => setUploadOpen(false)} currentUser={user} />
    </div>
  );
}
