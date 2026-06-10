import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, X, ChevronLeft, ChevronRight, Heart, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────
// Story Viewer (full-screen)
// ─────────────────────────────────────────────────────────
function StoryViewer({ stories, startIndex, onClose, currentUser }) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef(null);
  const DURATION = 5000;

  const story = stories[index];

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        if (index < stories.length - 1) {
          setIndex(i => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [index]);

  const markViewed = async () => {
    try {
      if (story.id && currentUser?.id !== story.created_by) {
        await supabase.from('statuses').update({ view_count: 1 }).eq('id', story.id);
      }
    } catch (_) {}
  };

  useEffect(() => { markViewed(); }, [index]);

  const prev = () => { if (index > 0) setIndex(i => i - 1); };
  const next = () => { if (index < stories.length - 1) setIndex(i => i + 1); else onClose(); };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      (await supabase.from('messages').insert({
        content: `Replied to your story: "${replyText}"`,
        story_id: story.id,
      }).select().single()).data;
      setReplyText('');
      toast.success('Reply sent');
    } catch (_) {
      toast.error('Could not send reply');
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-none rounded-full"
              style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-8 left-4 z-10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-2 ring-white">
          {story.author_avatar ? (
            <img src={story.author_avatar} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-white text-sm font-bold">{story.author_name?.[0] || 'U'}</span>
          )}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{story.author_name}</p>
          <p className="text-white/70 text-xs">{story.time_ago}</p>
        </div>
      </div>

      {/* Story content */}
      <div className="w-full max-w-sm h-screen max-h-[720px] relative rounded-2xl overflow-hidden">
        {story.media_url ? (
          story.media_type === 'video' ? (
            <video src={story.media_url} autoPlay muted loop className="w-full h-full object-cover" />
          ) : (
            <img src={story.media_url} className="w-full h-full object-cover" alt="" />
          )
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ background: story.bg_color || 'linear-gradient(135deg,#2E7C77,#1C1C1C)' }}
          >
            <p className="text-white text-2xl font-bold text-center leading-relaxed">
              {story.content}
            </p>
          </div>
        )}

        {/* Text overlay */}
        {story.text_overlay && story.media_url && (
          <div className="absolute inset-x-4 bottom-20 text-white text-center font-semibold text-xl drop-shadow-lg">
            {story.text_overlay}
          </div>
        )}

        {/* Tap zones */}
        <button onClick={prev} className="absolute left-0 top-0 w-1/3 h-full" />
        <button onClick={next} className="absolute right-0 top-0 w-1/3 h-full" />
      </div>

      {/* Reply bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 flex gap-2">
        <input
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReply()}
          placeholder="Reply to story…"
          className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white placeholder:text-white/50 text-sm outline-none"
        />
        <button onClick={handleReply} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Create Story Dialog
// ─────────────────────────────────────────────────────────
function CreateStoryDialog({ open, onClose, currentUser }) {
  const [tab, setTab] = useState('text'); // text | photo | video
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [bgColor, setBgColor] = useState('linear-gradient(135deg,#2E7C77,#1C1C1C)');
  const [textOverlay, setTextOverlay] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const BG_OPTIONS = [
    'linear-gradient(135deg,#2E7C77,#1C1C1C)',
    'linear-gradient(135deg,#6366f1,#ec4899)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#3b82f6)',
    'linear-gradient(135deg,#8b5cf6,#06b6d4)',
    'linear-gradient(135deg,#1C1C1C,#374151)',
  ];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (tab === 'text' && !text.trim()) return;
    if ((tab === 'photo' || tab === 'video') && !mediaFile) return;
    setLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;
      if (mediaFile) {
        const uploaded = await (async () => { const _uPath = `uploads/${Date.now()}-${mediaFile.name}`; const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, mediaFile, { upsert: true }); if (_uErr) throw _uErr; const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path); return { file_url: _uUrl }; })();
        mediaUrl = uploaded.file_url;
        mediaType = tab === 'video' ? 'video' : 'image';
      }
      (await supabase.from('statuses').insert({
        content: text || textOverlay || '',
        media_url: mediaUrl,
        media_type: mediaType,
        bg_color: bgColor,
        text_overlay: textOverlay,
        expires_at: new Date(Date.now().select().single()).data + 24 * 60 * 60 * 1000).toISOString(),
        is_archived: false,
      });
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['story-archive'] });
      toast.success('Story posted!');
      onClose();
      setText(''); setMediaFile(null); setMediaPreview(null); setTextOverlay('');
    } catch (_) {
      toast.error('Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          {['text', 'photo', 'video'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div
            className="w-full aspect-[9/16] max-h-60 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: bgColor }}
          >
            {mediaPreview ? (
              tab === 'video'
                ? <video src={mediaPreview} autoPlay muted loop className="w-full h-full object-cover" />
                : <img src={mediaPreview} className="w-full h-full object-cover" alt="" />
            ) : (
              <p className="text-white text-lg font-bold text-center px-4 leading-relaxed">
                {text || 'Your story will appear here'}
              </p>
            )}
          </div>

          {/* Text story controls */}
          {tab === 'text' && (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 rounded-lg border bg-background text-sm resize-none h-20 outline-none"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Background</p>
                <div className="flex gap-2">
                  {BG_OPTIONS.map(bg => (
                    <button
                      key={bg}
                      onClick={() => setBgColor(bg)}
                      className={`w-8 h-8 rounded-full ring-offset-2 ${bgColor === bg ? 'ring-2 ring-primary' : ''}`}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Photo / video upload */}
          {(tab === 'photo' || tab === 'video') && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={tab === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={handleFile}
              />
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2" />
                {mediaFile ? 'Change file' : `Upload ${tab}`}
              </Button>
              {mediaFile && (
                <input
                  value={textOverlay}
                  onChange={e => setTextOverlay(e.target.value)}
                  placeholder="Add text overlay…"
                  className="w-full p-3 rounded-lg border bg-background text-sm outline-none"
                />
              )}
            </>
          )}

          <Button onClick={handlePost} disabled={loading} className="w-full">
            {loading ? 'Posting…' : 'Share Story'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// Live Story Ring — shown before regular stories
// ─────────────────────────────────────────────────────────
function LiveStoryRing({ live, onClick }) {
  const host = live.users || {}
  const name = host.full_name || live.host_name || 'Creator'
  const avatar = host.avatar_url || live.host_avatar

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-shrink-0"
    >
      <style>{`
        @keyframes live-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); border-color: #ef4444; }
          50%  { box-shadow: 0 0 0 4px rgba(239,68,68,0);  border-color: #ff6b6b; }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0);    border-color: #ef4444; }
        }
      `}</style>
      <div className="relative" style={{ width: 56, height: 56 }}>
        {/* Pulsing red ring */}
        <div style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          border: '2.5px solid #ef4444',
          animation: 'live-pulse-ring 1.5s ease-in-out infinite',
        }} />
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary flex items-center justify-center">
          {avatar
            ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-lg">{name[0].toUpperCase()}</span>
          }
        </div>
        {/* LIVE badge */}
        <div style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
        }}>
          LIVE
        </div>
      </div>
      <span className="text-xs text-foreground/80 truncate w-14 text-center mt-1">
        {name.split(' ')[0]}
      </span>
      {live.viewer_count > 0 && (
        <span className="text-[10px] text-destructive -mt-0.5">
          {live.viewer_count} watching
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// Main StoryBar — rendered at top of Feed
// ─────────────────────────────────────────────────────────
export default function StoryBar({ currentUser }) {
  const navigate = useNavigate();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [liveUsers, setLiveUsers] = useState([]);

  // ── Fetch live users + realtime updates ──────────────────
  useEffect(() => {
    const fetchLives = async () => {
      const { data } = await supabase
        .from('lives')
        .select('*, users!host_id(id, full_name, avatar_url)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(10)
      setLiveUsers(data ?? [])
    }
    fetchLives()

    const channel = supabase
      .channel('story-bar-lives')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lives' }, fetchLives)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, []);

  const { data: rawStories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      return supabase.from('statuses').select('*') /* TODO filter: { is_archived: false } */;
    },
    refetchInterval: 60_000,
  });

  const { data: followData = [] } = useQuery({
    queryKey: ['my-follows'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('follows').select('*') /* TODO filter: { follower_id: user.id } */;
    },
  });

  const followedIds = new Set(followData.map(f => f.following_id));
  followedIds.add(currentUser?.id);

  // Filter to 24h window and enrich with author info
  const activeStories = rawStories.filter(s => {
    if (s.expires_at && new Date(s.expires_at) < new Date()) return false;
    return followedIds.has(s.created_by) || s.created_by === currentUser?.id;
  });

  // Group by user
  const grouped = activeStories.reduce((acc, s) => {
    const key = s.created_by;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  const openViewer = (groupIndex) => {
    // Flatten and find start index
    let flat = [];
    groups.forEach(g => { flat = flat.concat(g); });
    const start = groups.slice(0, groupIndex).reduce((sum, g) => sum + g.length, 0);
    setViewerStart(start);
    setViewerOpen(true);
  };

  const flatStories = groups.flat().map(s => ({
    ...s,
    author_name: s.author_name || 'User',
    author_avatar: s.author_avatar,
    time_ago: s.created_date
      ? new Date(s.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  }));

  return (
    <>
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* Add story button */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {currentUser?.full_name?.[0] || 'Y'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground truncate w-14 text-center">Your story</span>
          </button>

          {/* Live users — appear before regular stories with red pulsing ring */}
          {liveUsers.map(live => (
            <LiveStoryRing
              key={live.id}
              live={live}
              onClick={() => navigate(`/live/${live.id}`)}
            />
          ))}

          {/* Story bubbles */}
          {groups.map((group, i) => {
            const first = group[0];
            const hasNew = group.some(s => !s.viewed_by?.includes(currentUser?.id));
            return (
              <button
                key={first.created_by}
                onClick={() => openViewer(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-14 h-14 rounded-full overflow-hidden ring-[2.5px] ring-offset-2 ring-offset-background ${
                  hasNew ? 'ring-primary' : 'ring-muted'
                }`}>
                  {first.author_avatar ? (
                    <img src={first.author_avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {first.author_name?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-foreground/80 truncate w-14 text-center">
                  {first.author_name?.split(' ')[0] || 'User'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-screen viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={flatStories}
          startIndex={viewerStart}
          onClose={() => setViewerOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Create dialog */}
      <CreateStoryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
