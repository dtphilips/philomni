import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, Eye, Copy as CopyIcon, Download, GitFork } from 'lucide-react';
import RatingStars from '@/components/creative/RatingStars';

const ANIMATION_PRESETS = [
  { id: 'slow_zoom', label: 'Slow Zoom', css: '@keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.18); } } .anim-img { animation: slowZoom 8s ease-in-out infinite alternate; }' },
  { id: 'pan_right', label: 'Cinematic Pan', css: '@keyframes panRight { from { transform: scale(1.15) translateX(-5%); } to { transform: scale(1.15) translateX(5%); } } .anim-img { animation: panRight 9s ease-in-out infinite alternate; }' },
  { id: 'drift', label: 'Dreamlike Drift', css: '@keyframes drift { 0% { transform: scale(1.08) translate(0, 0); } 25% { transform: scale(1.1) translate(1.5%, -1%); } 50% { transform: scale(1.08) translate(0, 1.5%); } 75% { transform: scale(1.1) translate(-1.5%, -0.5%); } 100% { transform: scale(1.08) translate(0, 0); } } .anim-img { animation: drift 12s ease-in-out infinite; }' },
];

export default function SharedProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      const { data: proj } = await supabase.from('shared_projects').select('*').eq('id', projectId).single();
      if (proj) {
        setProject(proj);
        // Increment view count
        await supabase.from('shared_projects').update({ view_count: (proj?.view_count || 0) + 1 }).eq('id', projectId);
        // Load comments
        const cmts = (await supabase.from('project_comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(100)).data ?? [];
        setComments(cmts);
        // Load ratings
        const rtgs = (await supabase.from('template_ratings').select('*').eq('project_id', projectId)).data ?? [];
        setRatings(rtgs);
        if (rtgs.length > 0) {
          const avg = rtgs.reduce((sum, r) => sum + r.rating, 0) / rtgs.length;
          setAverageRating(avg);
        }
        // Find user's rating
        if (user) {
          const myRating = rtgs.find(r => r.user_id === user.id);
          setUserRating(myRating);
        }
      }
      setLoading(false);
    };
    loadProject();
  }, [projectId, user]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !user) return;
    setPostingComment(true);
    const newComment = (await supabase.from('project_comments').insert({
      project_id: projectId,
      author_id: user.id,
      author_name: user.full_name || 'Anonymous',
      author_avatar: user.avatar_url || '',
      content: commentText,
    }).select().single()).data;
    if (newComment) {
      setComments([newComment, ...comments]);
      setCommentText('');
    }
    setPostingComment(false);
  };

  const handleFork = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    // Create a new shared project copy with incremented fork count
    await supabase.from('shared_projects').insert({
      owner_id: user.id,
      owner_name: user.full_name || 'Anonymous',
      owner_avatar: user.avatar_url || '',
      title: `${project.title} (Forked)`,
      prompt: project.prompt,
      enhanced_prompt: project.enhanced_prompt,
      style_id: project.style_id,
      style_label: project.style_label,
      style_emoji: project.style_emoji,
      image_url: project.image_url,
      animation_id: project.animation_id,
      animation_label: project.animation_label,
    });
    // Update fork count on original
    await supabase.from('shared_projects').update({ fork_count: (project.fork_count || 0) + 1 }).eq('id', projectId);
    // Redirect to creative studio with prefilled values
    navigate('/creative-studio', { state: { forkedFrom: projectId, template: project } });
  };

  const handleRate = async (rating) => {
    if (!user) return;
    if (userRating) {
      // Update existing rating
      (await supabase.from('template_ratings').update({ rating }).eq('id', userRating.id).select().single()).data;
      setUserRating({ ...userRating, rating });
    } else {
      // Create new rating
      const newRating = (await supabase.from('template_ratings').insert({
        project_id: projectId,
        user_id: user.id,
        rating,
      }).select().single()).data;
      setUserRating(newRating);
      setRatings([...ratings, newRating]);
    }
    // Recalculate average
    const allRatings = userRating ? ratings.map(r => r.id === userRating.id ? { ...r, rating } : r) : [...ratings, { rating }];
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    setAverageRating(avg);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/shared-project/${projectId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted" style={{ backgroundImage: project.owner_avatar ? `url(${project.owner_avatar})` : undefined, backgroundSize: 'cover' }} />
              <span>{project.owner_name}</span>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {project.view_count || 0}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
            {copied ? 'Copied' : 'Share'}
          </Button>
          {project.marketplace_type !== 'none' && (
            <Button onClick={handleFork} className="gap-2">
              <GitFork className="w-4 h-4" /> Fork
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Image */}
        <div className="lg:col-span-2">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            <style>{project.animation_id && ANIMATION_PRESETS.find(a => a.id === project.animation_id)?.css || ''}</style>
            <img
              src={project.image_url}
              alt={project.title}
              className={`w-full h-full object-cover ${project.animation_id ? 'anim-img' : ''}`}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {project.style_emoji && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Style</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{project.style_emoji}</span>
                <span className="font-medium">{project.style_label}</span>
              </div>
            </div>
          )}

          {project.animation_label && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Animation</p>
              <p className="font-medium text-sm">{project.animation_label}</p>
            </div>
          )}

          {project.marketplace_type !== 'none' && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Marketplace</p>
              <Badge className="capitalize mb-3">
                {project.marketplace_type === 'template' ? '🎨 Template' : '🔧 Asset'}
              </Badge>
              <p className="text-xs text-muted-foreground mb-3">{project.marketplace_description}</p>
              
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Rating</p>
                  <RatingStars
                    rating={averageRating}
                    count={ratings.length}
                    onRate={handleRate}
                    interactive={user !== null}
                    size="md"
                  />
                  {user && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {userRating ? `Your rating: ${userRating.rating}★` : 'Click to rate'}
                    </p>
                  )}
                </div>
                
                {project.fork_count > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <GitFork className="w-3.5 h-3.5" />
                    <span>{project.fork_count} forks</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt */}
      {project.enhanced_prompt && (
        <div className="rounded-xl border border-border bg-card p-4 mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Enhanced Prompt</p>
          <p className="text-sm leading-relaxed">{project.enhanced_prompt}</p>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Comments</h2>

        {user ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <Textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="resize-none text-sm"
            />
            <Button
              onClick={handlePostComment}
              disabled={postingComment || !commentText.trim()}
              className="mt-3 w-full"
            >
              {postingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Comment
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sign in to comment</p>
        )}

        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-muted" style={{ backgroundImage: comment.author_avatar ? `url(${comment.author_avatar})` : undefined, backgroundSize: 'cover' }} />
                <span className="font-medium text-sm">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}