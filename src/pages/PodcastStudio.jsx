import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Loader2, Mic, Upload, Play, Pause, Lock, DollarSign,
  Star, MoreHorizontal, Edit, Trash2, Clock, Headphones, ChevronRight,
  Square, Circle, Sparkles, FileText, BarChart3, Wand2
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext';

// ── In-app Recorder ────────────────────────────────────────────────────────────
function InAppRecorder({ onRecorded }) {
  const [state, setState] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const barsRef = useRef(Array(20).fill(4));

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        onRecorded(file, url);
        setState('done');
      };
      mediaRef.current = mr;
      mr.start(100);
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const reset = () => {
    setAudioUrl(null);
    setSeconds(0);
    setState('idle');
    onRecorded(null, null);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-0.5 h-12">
        {Array(24).fill(0).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-primary/60 transition-all"
            style={{
              height: state === 'recording'
                ? `${8 + Math.random() * 32}px`
                : state === 'done' ? '8px' : '4px',
              animation: state === 'recording' ? `waveBar ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            }}
          />
        ))}
      </div>
      <style>{`@keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>

      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <Button onClick={start} className="gap-2">
            <Circle className="w-3.5 h-3.5 fill-current" /> Start Recording
          </Button>
        )}
        {state === 'recording' && (
          <>
            <span className="text-sm font-mono text-primary">{fmt(seconds)}</span>
            <Button variant="destructive" onClick={stop} className="gap-2">
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </Button>
          </>
        )}
        {state === 'done' && (
          <>
            <audio src={audioUrl} controls className="h-8 flex-1 min-w-0" />
            <Button variant="outline" size="sm" onClick={reset}>Re-record</Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── AI Tools Tab ───────────────────────────────────────────────────────────────
function PodcastAITools() {
  const [activeTool, setActiveTool] = useState('title');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const tools = [
    { id: 'title', icon: Sparkles, label: 'Title Generator' },
    { id: 'shownotes', icon: FileText, label: 'Show Notes Writer' },
    { id: 'transcript', icon: BarChart3, label: 'Description Writer' },
  ];

  const run = async () => {
    if (!topic.trim()) { toast.error('Enter a topic first'); return; }
    setLoading(true);
    setOutput('');
    try {
      let prompt = '';
      if (activeTool === 'title') {
        prompt = `Generate 7 compelling podcast episode titles for this topic: "${topic}". Make them curiosity-driven, SEO-friendly, and click-worthy. Format as a numbered list.`;
      } else if (activeTool === 'shownotes') {
        prompt = `Write comprehensive podcast show notes for an episode about: "${topic}".\n\nAdditional context: ${notes || 'none'}\n\nInclude: Episode summary (2-3 sentences), Key topics covered (bullet points), Key takeaways (3-5 points), Resources mentioned section, Guest bio section (placeholder), Subscribe/review CTA. Format with clear headers.`;
      } else {
        prompt = `Write a compelling podcast episode description for: "${topic}".\n\nAdditional notes: ${notes || 'none'}\n\nInclude: Hook opening sentence, What listeners will learn, Why this matters now, Who this episode is for, A compelling CTA. Keep it under 200 words and optimized for Apple Podcasts and Spotify search.`;
      }
      const res = await (async () => {
  const _llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: { prompt } }) });
  const _llmData = await _llmRes.json();
  return { result: _llmData.result ?? '' };
})();
      setOutput(typeof res === 'string' ? res : (res?.result ?? res?.text ?? JSON.stringify(res)));
    } catch {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTool(t.id); setOutput(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              activeTool === t.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Episode Topic / Title</Label>
          <Input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. How I grew to 10k subscribers in 6 months"
            className="mt-1"
          />
        </div>
        {activeTool !== 'title' && (
          <div>
            <Label>Additional Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Key points, guest name, topics covered..."
              className="mt-1"
            />
          </div>
        )}
        <Button onClick={run} disabled={loading} className="gap-2 w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      {output && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Result</span>
            <button
              onClick={() => { navigator.clipboard.writeText(output); toast.success('Copied!'); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Copy
            </button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
}

const PODCAST_CATEGORIES = [
  'Business', 'Technology', 'Comedy', 'Education', 'Health & Fitness',
  'Arts', 'True Crime', 'News', 'Sports', 'Society & Culture', 'Science'
];

// Episode play button wired to global persistent player
function AudioPlayer({ src, title, episodeId, podcastTitle, podcastCover }) {
  const { play, pause, episode: current, isPlaying } = usePodcastPlayer();
  const active = current?.id === episodeId && isPlaying;

  const handleClick = () => {
    if (active) {
      pause();
    } else {
      play({ id: episodeId, audio_url: src, title, podcast_name: podcastTitle, cover_image_url: podcastCover });
    }
  };

  if (!src) return null;
  return (
    <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
      <button onClick={handleClick} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        {active ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
      </button>
      <span className="text-xs text-muted-foreground flex-1 truncate">{title}</span>
      <span className="text-xs text-primary font-medium flex-shrink-0">
        {active ? 'Playing ▸' : 'Play in player'}
      </span>
    </div>
  );
}

// Episode card
function EpisodeCard({ episode, podcast, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">
              Ep. {episode.episode_number || '—'}
            </span>
            {episode.is_premium && (
              <Badge variant="outline" className="text-xs gap-1 border-amber-200 text-amber-600">
                <Lock className="w-2.5 h-2.5" /> Premium
              </Badge>
            )}
            {episode.status === 'scheduled' && (
              <Badge variant="secondary" className="text-xs">Scheduled</Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm mt-0.5 truncate">{episode.title}</h3>
          {episode.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{episode.description}</p>
          )}
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(episode)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(episode.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {episode.audio_url && (
        <AudioPlayer
          src={episode.audio_url}
          title={episode.title}
          episodeId={episode.id}
          podcastTitle={podcast?.title}
          podcastCover={podcast?.cover_image_url}
        />
      )}

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {episode.duration_seconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(episode.duration_seconds / 60)}m {episode.duration_seconds % 60}s
            </span>
          )}
          {episode.play_count > 0 && (
            <span className="flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              {episode.play_count.toLocaleString()} plays
            </span>
          )}
          {episode.tips_total > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <DollarSign className="w-3 h-3" />
              ${episode.tips_total.toFixed(2)} tips
            </span>
          )}
        </div>
        {episode.published_at && (
          <span>{formatDistanceToNow(new Date(episode.published_at), { addSuffix: true })}</span>
        )}
      </div>
    </div>
  );
}

// Podcast card with expand
function PodcastCard({ podcast, currentUser, onManage }) {
  const isOwner = podcast.creator_id === currentUser?.id;
  const { play, pause, episode: currentEpisode, isPlaying } = usePodcastPlayer();

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', podcast.id],
    queryFn: async () => { const { data } = await supabase.from('podcast_episodes').select('*').eq('podcast_id', podcast.id).order('episode_number', { ascending: false }).limit(50); return data ?? []; },
    enabled: !!podcast.id,
  });

  const handlePlayEp = (ep) => {
    if (currentEpisode?.id === ep.id && isPlaying) {
      pause();
    } else {
      play({ ...ep, podcast_name: podcast.title, cover_image_url: podcast.cover_image_url });
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
            {podcast.cover_image_url
              ? <img src={podcast.cover_image_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center"><Mic className="w-6 h-6 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{podcast.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{podcast.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs">{podcast.category}</Badge>
              <span className="text-xs text-muted-foreground">{episodes.length} episodes</span>
              {podcast.average_rating > 0 && (
                <span className="text-xs flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {podcast.average_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <Button size="sm" variant="outline" onClick={() => onManage(podcast)} className="flex-shrink-0">
              Manage
            </Button>
          )}
        </div>
      </div>

      {episodes.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {episodes.slice(0, 3).map(ep => {
            const active = currentEpisode?.id === ep.id && isPlaying;
            return (
              <button
                key={ep.id}
                onClick={() => ep.audio_url && handlePlayEp(ep)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
                disabled={!ep.audio_url}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary' : 'bg-primary/10'}`}>
                  {active
                    ? <Pause className="w-3 h-3 text-white" />
                    : <Play className="w-3 h-3 text-primary ml-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m` : 'Audio'} ·{' '}
                    {ep.is_premium ? '🔒 Premium' : 'Free'}
                  </p>
                </div>
              </button>
            );
          })}
          {episodes.length > 3 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
              +{episodes.length - 3} more episodes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PodcastStudio() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [showNewPodcast, setShowNewPodcast] = useState(false);
  const [managingPodcast, setManagingPodcast] = useState(null);
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [epInputMode, setEpInputMode] = useState('upload'); // 'upload' | 'record'

  const [podcastForm, setPodcastForm] = useState({ title: '', description: '', category: 'Business' });
  const [epForm, setEpForm] = useState({
    title: '', description: '', episode_number: '',
    is_premium: false, premium_price: '',
    audio_file: null, audio_url: '',
    scheduled_at: '',
  });

  const { data: myPodcasts = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my-podcasts'],
    queryFn: async () => {
      const u = user /* useAuth() */;
      return supabase.from('podcasts').select('*') /* TODO filter: { creator_id: u.id }, '-created_date', 20 */;
    },
    enabled: !!user,
  });

  const { data: allPodcasts = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-podcasts'],
    queryFn: () => supabase.from('podcasts').select('*'),
  });

  const { data: managingEpisodes = [], refetch: refetchEpisodes } = useQuery({
    queryKey: ['episodes', managingPodcast?.id],
    queryFn: async () => { const { data } = await supabase.from('podcast_episodes').select('*').eq('podcast_id', managingPodcast.id).order('episode_number', { ascending: false }).limit(50); return data ?? []; },
    enabled: !!managingPodcast,
  });

  const handleCreatePodcast = async () => {
    if (!podcastForm.title.trim()) return;
    setSaving(true);
    try {
      (await supabase.from('podcasts').insert({
        ...podcastForm,
        creator_id: user.id,
        creator_name: user.full_name,
        creator_avatar: user.avatar_url || '',
        total_episodes: 0,
        subscriber_count: 0,
      }).select().single()).data;
      qc.invalidateQueries({ queryKey: ['my-podcasts'] });
      qc.invalidateQueries({ queryKey: ['all-podcasts'] });
      toast.success('Podcast created!');
      setShowNewPodcast(false);
      setPodcastForm({ title: '', description: '', category: 'Business' });
    } catch (_) {
      toast.error('Failed to create podcast');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEpisode = async () => {
    if (!epForm.title.trim() || !managingPodcast) return;
    setSaving(true);
    try {
      let audioUrl = epForm.audio_url;
      if (epForm.audio_file) {
        setUploading(true);
        const res = await (async () => {
  const _uPath = `uploads/${Date.now()}-${epForm.audio_file.name}`;
  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, epForm.audio_file, { upsert: true });
  if (_uErr) throw _uErr;
  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
  return { file_url: _uUrl };
})();
        audioUrl = res.file_url;
        setUploading(false);
      }

      const data = {
        podcast_id: managingPodcast.id,
        title: epForm.title,
        description: epForm.description,
        episode_number: epForm.episode_number ? parseInt(epForm.episode_number) : managingEpisodes.length + 1,
        is_premium: epForm.is_premium,
        premium_price: epForm.premium_price ? parseFloat(epForm.premium_price) : null,
        audio_url: audioUrl,
        status: epForm.scheduled_at ? 'scheduled' : 'published',
        scheduled_at: epForm.scheduled_at || null,
        published_at: epForm.scheduled_at ? null : new Date().toISOString(),
        play_count: 0,
        tips_total: 0,
      };

      if (editingEpisode) {
        (await supabase.from('podcast_episodes').update(data).eq('id', editingEpisode.id).select().single()).data;
        toast.success('Episode updated');
      } else {
        (await supabase.from('podcast_episodes').insert(data).select().single()).data;
        (await supabase.from('podcasts').update({
          total_episodes: managingEpisodes.length + 1,
        }).eq('id', managingPodcast.id).select().single()).data;
        toast.success('Episode published!');
      }

      refetchEpisodes();
      qc.invalidateQueries({ queryKey: ['my-podcasts'] });
      setShowNewEpisode(false);
      setEditingEpisode(null);
      setEpForm({ title: '', description: '', episode_number: '', is_premium: false, premium_price: '', audio_file: null, audio_url: '', scheduled_at: '' });
    } catch (err) {
      toast.error('Failed to save episode');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteEpisode = async (id) => {
    await supabase.from('podcast_episodes').delete().eq('id', id);
    refetchEpisodes();
    toast.success('Episode deleted');
  };

  const openEditEpisode = (ep) => {
    setEpForm({
      title: ep.title || '',
      description: ep.description || '',
      episode_number: String(ep.episode_number || ''),
      is_premium: ep.is_premium || false,
      premium_price: String(ep.premium_price || ''),
      audio_file: null,
      audio_url: ep.audio_url || '',
      scheduled_at: ep.scheduled_at || '',
    });
    setEditingEpisode(ep);
    setShowNewEpisode(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6" />
            Podcast Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, manage and monetize your podcast</p>
        </div>
        <Button size="sm" onClick={() => setShowNewPodcast(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Podcast
        </Button>
      </div>

      <Tabs defaultValue={managingPodcast ? 'mine' : 'discover'}>
        <TabsList className="mb-5">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="mine">My Podcasts ({myPodcasts.length})</TabsTrigger>
          <TabsTrigger value="ai-tools" className="gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> AI Tools
          </TabsTrigger>
          {managingPodcast && (
            <TabsTrigger value="episodes" className="gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              {managingPodcast.title}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Discover */}
        <TabsContent value="discover">
          {loadingAll ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {allPodcasts.map(p => (
                <PodcastCard key={p.id} podcast={p} currentUser={user} onManage={setManagingPodcast} />
              ))}
              {allPodcasts.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                  <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No podcasts yet — be the first!</p>
                  <Button variant="outline" className="mt-4" size="sm" onClick={() => setShowNewPodcast(true)}>
                    Start a podcast
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI Tools */}
        <TabsContent value="ai-tools">
          <div className="max-w-2xl">
            <div className="mb-5">
              <h2 className="font-semibold text-lg">Podcast AI Tools</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Generate titles, show notes, and episode descriptions with AI</p>
            </div>
            <PodcastAITools />
          </div>
        </TabsContent>

        {/* My Podcasts */}
        <TabsContent value="mine">
          {loadingMine ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : myPodcasts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No podcasts yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first podcast to get started</p>
              <Button size="sm" onClick={() => setShowNewPodcast(true)}>Create Podcast</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myPodcasts.map(p => (
                <PodcastCard key={p.id} podcast={p} currentUser={user} onManage={(pod) => setManagingPodcast(pod)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Episode Management */}
        {managingPodcast && (
          <TabsContent value="episodes">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Managing episodes for</p>
                <h2 className="font-semibold">{managingPodcast.title}</h2>
              </div>
              <Button size="sm" onClick={() => setShowNewEpisode(true)} className="gap-1.5">
                <Upload className="w-4 h-4" /> Upload Episode
              </Button>
            </div>

            {managingEpisodes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Headphones className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No episodes yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewEpisode(true)}>
                  Upload your first episode
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {managingEpisodes.map(ep => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    podcast={managingPodcast}
                    isOwner
                    onEdit={openEditEpisode}
                    onDelete={handleDeleteEpisode}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* New Podcast Dialog */}
      <Dialog open={showNewPodcast} onOpenChange={setShowNewPodcast}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create New Podcast</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Podcast Title</Label>
              <Input value={podcastForm.title} onChange={e => setPodcastForm(p => ({ ...p, title: e.target.value }))} placeholder="My Awesome Podcast" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={podcastForm.description} onChange={e => setPodcastForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" placeholder="What is your podcast about?" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={podcastForm.category} onValueChange={v => setPodcastForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PODCAST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewPodcast(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreatePodcast} disabled={saving || !podcastForm.title.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Podcast'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New/Edit Episode Dialog */}
      <Dialog open={showNewEpisode} onOpenChange={(open) => { if (!open) { setShowNewEpisode(false); setEditingEpisode(null); } }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEpisode ? 'Edit Episode' : 'Upload Episode'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Episode Title</Label>
                <Input value={epForm.title} onChange={e => setEpForm(p => ({ ...p, title: e.target.value }))} placeholder="Episode title" className="mt-1" />
              </div>
              <div>
                <Label>Ep. #</Label>
                <Input type="number" value={epForm.episode_number} onChange={e => setEpForm(p => ({ ...p, episode_number: e.target.value }))} placeholder="Auto" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={epForm.description} onChange={e => setEpForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" placeholder="What is this episode about?" />
            </div>

            {/* Audio — upload or record */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Audio</Label>
                <div className="flex gap-1 border border-border rounded-lg p-0.5">
                  <button
                    onClick={() => setEpInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${epInputMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />Upload
                  </button>
                  <button
                    onClick={() => setEpInputMode('record')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${epInputMode === 'record' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    <Mic className="w-3 h-3 inline mr-1" />Record
                  </button>
                </div>
              </div>
              {epInputMode === 'upload' ? (
                <label className="flex items-center gap-3 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    {epForm.audio_file
                      ? <p className="text-sm truncate">{epForm.audio_file.name}</p>
                      : epForm.audio_url
                      ? <p className="text-sm text-primary truncate">Audio uploaded ✓</p>
                      : <p className="text-sm text-muted-foreground">Click to upload MP3, WAV, M4A...</p>
                    }
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={e => setEpForm(p => ({ ...p, audio_file: e.target.files[0] }))}
                  />
                </label>
              ) : (
                <InAppRecorder
                  onRecorded={(file, url) => setEpForm(p => ({ ...p, audio_file: file || null, audio_url: file ? '' : p.audio_url }))}
                />
              )}
            </div>

            {/* Premium toggle */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                id="is_premium"
                checked={epForm.is_premium}
                onChange={e => setEpForm(p => ({ ...p, is_premium: e.target.checked }))}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="is_premium" className="cursor-pointer flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Premium Episode
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">Subscribers-only or paid access</p>
              </div>
              {epForm.is_premium && (
                <div className="w-24">
                  <Input
                    type="number"
                    value={epForm.premium_price}
                    onChange={e => setEpForm(p => ({ ...p, premium_price: e.target.value }))}
                    placeholder="$0.00"
                    className="text-sm h-8"
                  />
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={epForm.scheduled_at}
                onChange={e => setEpForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank to publish immediately</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowNewEpisode(false); setEditingEpisode(null); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveEpisode}
                disabled={saving || uploading || !epForm.title.trim()}
              >
                {(saving || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEpisode ? 'Save Changes' : 'Publish Episode'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
