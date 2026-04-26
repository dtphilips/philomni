import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Image, Video, X, Loader2, BookmarkPlus, Edit2,
  MapPin, Tag, Palette, Wand2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import VideoEditor from '@/components/video/VideoEditor';
import RichTextEditor from '@/components/feed/RichTextEditor';
import HashtagSuggestions from '@/components/feed/HashtagSuggestions';
import { toast } from 'sonner';

const BG_OPTIONS = [
  { id: 'none', label: 'None', style: {} },
  { id: 'blue', label: 'Blue', style: { background: 'linear-gradient(135deg,#667eea,#764ba2)' } },
  { id: 'sunset', label: 'Sunset', style: { background: 'linear-gradient(135deg,#f093fb,#f5576c)' } },
  { id: 'ocean', label: 'Ocean', style: { background: 'linear-gradient(135deg,#4facfe,#00f2fe)' } },
  { id: 'forest', label: 'Forest', style: { background: 'linear-gradient(135deg,#43e97b,#38f9d7)' } },
  { id: 'fire', label: 'Fire', style: { background: 'linear-gradient(135deg,#fa709a,#fee140)' } },
  { id: 'midnight', label: 'Midnight', style: { background: 'linear-gradient(135deg,#0c0c0c,#1a1a2e)' } },
  { id: 'gold', label: 'Gold', style: { background: 'linear-gradient(135deg,#f7971e,#ffd200)' } },
];

const REWRITE_ACTIONS = [
  { id: 'shorten', label: '✂ Shorten', prompt: (t) => `Shorten this to about half its length, keeping the core message:\n\n"${t}"\n\nReturn only the shortened text.` },
  { id: 'elaborate', label: '📝 Elaborate', prompt: (t) => `Expand this with more detail and depth:\n\n"${t}"\n\nReturn only the expanded text.` },
  { id: 'professional', label: '💼 Pro Tone', prompt: (t) => `Rewrite in a professional, business-appropriate tone:\n\n"${t}"\n\nReturn only the rewritten text.` },
  { id: 'casual', label: '😊 Casual', prompt: (t) => `Rewrite in a friendly, casual conversational tone:\n\n"${t}"\n\nReturn only the rewritten text.` },
  { id: 'emojify', label: '🎉 Emojify', prompt: (t) => `Add relevant emojis throughout to make it more engaging:\n\n"${t}"\n\nReturn only the text with emojis.` },
];

function extractPlainText(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

export default function CreatePost({ user }) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteAction, setRewriteAction] = useState(null);
  const [showRewrite, setShowRewrite] = useState(false);
  const queryClient = useQueryClient();

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const startIdx = mediaFiles.length;
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(file => setMediaPreviews(prev => [...prev, URL.createObjectURL(file)]));
    setExpanded(true);
    // Auto-open editor for the first uploaded video
    const firstVideo = files.findIndex(f => f.type?.startsWith('video'));
    if (firstVideo !== -1) {
      setEditingIndex(startIdx + firstVideo);
      setEditorOpen(true);
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const extractHashtags = (text) => {
    const plain = extractPlainText(text);
    const matches = plain.match(/#\w+/g);
    return matches ? [...new Set(matches.map(t => t.slice(1)))] : [];
  };

  const handleRewrite = async (action) => {
    const plain = extractPlainText(content).trim();
    if (!plain) { toast.error('Write something first!'); return; }
    setRewriting(true);
    setRewriteAction(action.id);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: action.prompt(plain) });
      const newText = typeof res === 'string' ? res : (res?.result ?? res?.text ?? '');
      if (newText) setContent(newText);
    } catch {
      toast.error('Rewrite failed — check your API connection.');
    }
    setRewriting(false);
    setRewriteAction(null);
  };

  const buildPostData = (visibility, fullUser) => Promise.race([
    (async () => {
    let mediaUrls = [];
    let thumbnailUrl = null;
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        mediaUrls.push(res.file_url);
        if (file.type?.startsWith('video') && !thumbnailUrl) {
          try {
            const canvas = document.createElement('canvas');
            const video = document.createElement('video');
            video.src = mediaPreviews[i];
            video.crossOrigin = 'anonymous';
            await new Promise((resolve) => {
              video.addEventListener('loadedmetadata', () => {
                video.currentTime = Math.min(1, video.duration / 2);
                video.addEventListener('seeked', () => {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  canvas.getContext('2d').drawImage(video, 0, 0);
                  canvas.toBlob(async (blob) => {
                    if (blob) {
                      const t = await base44.integrations.Core.UploadFile({ file: blob });
                      thumbnailUrl = t.file_url;
                    }
                    resolve();
                  }, 'image/jpeg', 0.8);
                }, { once: true });
              }, { once: true });
            });
          } catch { /* thumbnail optional */ }
        }
      } catch (err) {
        toast.error(`Upload failed: ${err.message}`);
      }
    }
    const mediaType = mediaUrls.length > 0
      ? (mediaFiles[0]?.type?.startsWith('video') ? 'video' : 'image')
      : 'none';
    const mentionedUserIds = [];
    return {
      content: extractPlainText(content).trim(),
      author_id: fullUser.id,
      author_name: fullUser.full_name,
      author_avatar: fullUser.avatar_url || '',
      author_headline: fullUser.headline || '',
      author_role: fullUser.role,
      author_verified: fullUser.verified || false,
      media_urls: mediaUrls,
      media_type: mediaType,
      thumbnail_url: thumbnailUrl,
      hashtags: extractHashtags(content),
      mentioned_user_ids: mentionedUserIds,
      tagged_users: taggedPeople,
      location: location.trim() || null,
      bg_style: selectedBg.id !== 'none' ? selectedBg.id : null,
      like_count: 0, comment_count: 0, share_count: 0, bookmark_count: 0,
      visibility,
    };
    })(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('buildPostData timed out after 5s')), 5000)),
  ]);

  const reset = () => {
    setContent(''); setMediaFiles([]); setMediaPreviews([]); setExpanded(false);
    setSelectedBg(BG_OPTIONS[0]); setLocation(''); setShowLocation(false);
    setTaggedPeople([]); setShowTagPeople(false); setShowBgPicker(false); setShowRewrite(false);
  };

  const handlePost = async () => {
    console.log('=== POST SUBMIT STARTED ===');
    console.log('User:', user);
    console.log('isAuthenticated:', !!user);
    if (!content.trim() && mediaFiles.length === 0) return;
    setPosting(true);
    try {
      // Ensure we have a full user with id — context may have only { email } during initial load
      let fullUser = user;
      if (!user?.id) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          fullUser = { ...authUser, ...(profile || {}) };
        }
      }
      console.log('Full user for post:', fullUser);

      const postData = await buildPostData('public', fullUser);
      console.log('=== CALLING SUPABASE INSERT ===');
      console.log('Payload:', JSON.stringify(postData));
      const post = await base44.entities.Post.create(postData);
      for (const uid of (postData.mentioned_user_ids || [])) {
        base44.entities.Notification.create({
          user_id: uid, type: 'mention',
          title: `${user.full_name} mentioned you`,
          message: postData.content.substring(0, 100),
          related_id: post.id, read: false,
        }).catch(() => {});
      }
      reset();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Posted!');
    } catch (err) {
      console.error('=== POST CREATE ERROR ===', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      toast.error('Post failed: ' + err.message);
    }
    setPosting(false);
  };

  const handleSaveDraft = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setSavingDraft(true);
    try {
      await base44.entities.Post.create(await buildPostData('private', user));
      reset();
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Draft saved!');
    } catch (err) {
      toast.error('Draft failed: ' + err.message);
    }
    setSavingDraft(false);
  };

  const addTag = () => {
    const name = tagInput.trim().replace(/^@/, '');
    if (name && !taggedPeople.includes(name)) setTaggedPeople(prev => [...prev, name]);
    setTagInput('');
  };

  const hasContent = extractPlainText(content).trim() || mediaFiles.length > 0;
  const isTextOnly = mediaFiles.length === 0;

  if (!user) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-sm font-bold">?</div>
        <div className="flex-1 min-h-[42px] border border-border rounded-xl px-4 py-2.5 bg-muted/30 text-muted-foreground/50 text-sm flex items-center select-none">
          Share something with the community...
        </div>
        <Link
          to="/login"
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(109,40,217,0.15)', color: 'hsl(var(--primary))', border: '1px solid rgba(109,40,217,0.25)' }}
        >
          Sign in to post
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 overflow-hidden" id="create-post-composer">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden ring-2 ring-border/50">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                  {user?.full_name?.[0] || 'U'}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            {!expanded ? (
              <div
                onClick={() => setExpanded(true)}
                className="min-h-[42px] border border-border rounded-xl px-4 py-2.5 bg-muted/30 text-muted-foreground/60 text-sm cursor-text hover:bg-muted/50 transition-colors select-none"
              >
                What's on your mind, {user?.full_name?.split(' ')[0] || 'Creator'}?
              </div>
            ) : (
              <div
                className="relative rounded-xl overflow-hidden transition-all duration-300"
                style={isTextOnly && selectedBg.id !== 'none' ? { ...selectedBg.style, padding: '2px' } : {}}
              >
                <div style={isTextOnly && selectedBg.id !== 'none' ? { background: 'rgba(0,0,0,0.15)', borderRadius: '10px' } : {}}>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Share an idea, update, or insight..."
                    className={isTextOnly && selectedBg.id !== 'none' ? 'min-h-[120px] text-white' : 'min-h-[100px]'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chips */}
        {(taggedPeople.length > 0 || location) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pl-13" style={{ paddingLeft: '52px' }}>
            {location && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-2 py-0.5 border border-blue-500/20">
                <MapPin className="w-3 h-3" />{location}
                <button onClick={() => setLocation('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {taggedPeople.map(p => (
              <span key={p} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 border border-primary/20">
                @{p}
                <button onClick={() => setTaggedPeople(prev => prev.filter(x => x !== p))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media previews */}
      <AnimatePresence>
        {mediaPreviews.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`px-4 pb-3 ${mediaPreviews.length > 1 ? 'grid grid-cols-2 gap-1.5' : ''}`}>
            {mediaPreviews.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden bg-black group max-h-[480px] flex items-center justify-center">
                {mediaFiles[i]?.type?.startsWith('video')
                  ? <video src={url} className="max-w-full max-h-[480px] w-auto h-auto object-contain" style={{ display: 'block' }} />
                  : <img src={url} className="max-w-full max-h-[480px] w-auto h-auto object-contain" alt="" style={{ display: 'block' }} />
                }
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => { setEditingIndex(i); setEditorOpen(true); }}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeMedia(i)}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart hashtag suggestions */}
      {expanded && (
        <HashtagSuggestions
          content={content}
          onAdd={(tag) => {
            const plain = extractPlainText(content);
            if (!plain.includes('#' + tag)) {
              setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + '#' + tag);
            }
          }}
        />
      )}

      {editorOpen && editingIndex !== null && mediaFiles[editingIndex]?.type?.startsWith('video') && (
        <VideoEditor videoUrl={mediaPreviews[editingIndex]} isOpen={editorOpen}
          onClose={() => setEditorOpen(false)} onSave={() => setEditorOpen(false)} />
      )}

      {/* Location input */}
      <AnimatePresence>
        {showLocation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <Input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Add location..." autoFocus
                className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 h-auto"
                onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && setShowLocation(false)} />
              <button onClick={() => setShowLocation(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag people */}
      <AnimatePresence>
        {showTagPeople && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <Tag className="w-4 h-4 text-primary flex-shrink-0" />
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                placeholder="Type name + Enter to tag..." autoFocus
                className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 h-auto"
                onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagPeople(false); }} />
              <button onClick={() => setShowTagPeople(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background picker */}
      <AnimatePresence>
        {showBgPicker && isTextOnly && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-muted-foreground font-medium mr-1">Background:</span>
              {BG_OPTIONS.map(bg => (
                <button key={bg.id}
                  onClick={() => { setSelectedBg(bg); setExpanded(true); }}
                  title={bg.label}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${selectedBg.id === bg.id ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'} ${bg.id === 'none' ? 'bg-muted' : ''}`}
                  style={bg.id !== 'none' ? bg.style : {}}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI rewrite bar */}
      <AnimatePresence>
        {showRewrite && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap bg-primary/5 border border-primary/20 rounded-xl p-2.5">
              <Wand2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-primary mr-1">AI Rewrite:</span>
              {REWRITE_ACTIONS.map(action => (
                <button key={action.id} onClick={() => handleRewrite(action)} disabled={rewriting}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted hover:border-primary/40 transition-all disabled:opacity-50 inline-flex items-center gap-1 font-medium">
                  {rewriting && rewriteAction === action.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom toolbar */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-3 py-2.5 border-t border-border flex items-center justify-between gap-2 flex-wrap bg-muted/20">
            <div className="flex items-center gap-0.5">
              <label className="cursor-pointer" title="Add photo">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                <div className="p-2 rounded-lg hover:bg-muted transition-colors"><Image className="w-[18px] h-[18px] text-green-500" /></div>
              </label>
              <label className="cursor-pointer" title="Add video">
                <input type="file" accept="video/*" className="hidden" onChange={handleMediaUpload} />
                <div className="p-2 rounded-lg hover:bg-muted transition-colors"><Video className="w-[18px] h-[18px] text-blue-500" /></div>
              </label>
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={() => { setShowLocation(v => !v); setShowTagPeople(false); setShowBgPicker(false); }}
                title="Add location"
                className={`p-2 rounded-lg hover:bg-muted transition-colors ${location ? 'text-blue-500' : 'text-muted-foreground'}`}>
                <MapPin className="w-[18px] h-[18px]" />
              </button>
              <button onClick={() => { setShowTagPeople(v => !v); setShowLocation(false); setShowBgPicker(false); }}
                title="Tag people"
                className={`p-2 rounded-lg hover:bg-muted transition-colors ${taggedPeople.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                <Tag className="w-[18px] h-[18px]" />
              </button>
              {isTextOnly && (
                <button onClick={() => { setShowBgPicker(v => !v); setShowLocation(false); setShowTagPeople(false); }}
                  title="Background color"
                  className={`p-2 rounded-lg hover:bg-muted transition-colors ${selectedBg.id !== 'none' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Palette className="w-[18px] h-[18px]" />
                </button>
              )}
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={() => setShowRewrite(v => !v)}
                title="AI rewrite"
                className={`p-2 rounded-lg hover:bg-muted transition-colors ${showRewrite ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <Wand2 className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground h-8">Cancel</Button>
              <Button onClick={handleSaveDraft} disabled={savingDraft || posting || !hasContent}
                size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                {savingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                Draft
              </Button>
              <Button onClick={handlePost} disabled={posting || savingDraft || !hasContent}
                size="sm" className="gap-1 px-5 h-8">
                {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {posting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
