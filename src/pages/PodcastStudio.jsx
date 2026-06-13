import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Square, Circle, Sparkles, FileText, BarChart3, Wand2, Rss, Copy,
  ExternalLink, TrendingUp, Users, Radio, CheckCircle2, Image, Globe,
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext';
import { addToWallet } from '@/lib/wallet';

const PODCAST_CATEGORIES = [
  // Business & Career
  'Business', 'Entrepreneurship', 'Leadership', 'Management', 'Career Development',
  'Productivity', 'Remote Work', 'Freelancing', 'Startup',
  // Marketing & Sales
  'Marketing', 'Digital Marketing', 'Social Media', 'Content Creation',
  'SEO & Analytics', 'Copywriting', 'Sales', 'Brand Strategy', 'Advertising',
  // Finance & Investing
  'Finance', 'Personal Finance', 'Investing', 'Crypto & Web3',
  'Stock Market', 'Real Estate', 'Accounting',
  // Tech
  'Technology', 'Web Development', 'Mobile Development', 'Tech & AI',
  'Machine Learning', 'Data Science', 'Cybersecurity', 'Cloud Computing',
  'Game Development',
  // Media & Entertainment
  'Comedy', 'True Crime', 'Sports', 'Music', 'TV & Film', 'Pop Culture',
  'Arts', 'Fiction', 'Storytelling',
  // Education & Growth
  'Education', 'History', 'Science', 'News', 'Politics', 'Government',
  'Society & Culture', 'Philosophy', 'Psychology', 'Spirituality',
  'Languages', 'Public Speaking', 'Mindset & Personal Growth',
  // Health & Lifestyle
  'Health & Fitness', 'Mental Health', 'Nutrition', 'Yoga & Meditation',
  'Parenting', 'Relationships', 'Kids & Family', 'Leisure', 'Travel',
  // Religion & Culture
  'Religion & Spirituality', 'African Culture', 'History & Culture',
  // Other
  'Other',
];

const DISTRIBUTION_PLATFORMS = [
  { name: 'Spotify', icon: '🎵', url: 'https://podcasters.spotify.com/submit', color: 'text-green-500' },
  { name: 'Apple Podcasts', icon: '🍎', url: 'https://podcastsconnect.apple.com', color: 'text-blue-500' },
  { name: 'Amazon Music', icon: '🎶', url: 'https://podcasters.amazon.com', color: 'text-orange-500' },
  { name: 'Google Podcasts', icon: '🔵', url: 'https://podcastsmanager.google.com', color: 'text-yellow-500' },
  { name: 'iHeartRadio', icon: '📻', url: 'https://www.iheartmedia.com/podcasters', color: 'text-red-500' },
  { name: 'Pocket Casts', icon: '📲', url: 'https://pocketcasts.com/submit', color: 'text-purple-500' },
];

function fmtDuration(secs) {
  if (!secs) return '--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// ── In-app Recorder ─────────────────────────────────────────────────────────
function InAppRecorder({ onRecorded }) {
  const [state, setState] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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

  const stop = () => { clearInterval(timerRef.current); mediaRef.current?.stop(); };
  const reset = () => { setAudioUrl(null); setSeconds(0); setState('idle'); onRecorded(null, null); };
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-center gap-0.5 h-12">
        {Array(24).fill(0).map((_, i) => (
          <div key={i} className="w-1 rounded-full bg-primary/60 transition-all"
            style={{
              height: state === 'recording' ? `${8 + Math.random() * 32}px` : state === 'done' ? '8px' : '4px',
              animation: state === 'recording' ? `waveBar ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            }} />
        ))}
      </div>
      <style>{`@keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && <Button onClick={start} className="gap-2"><Circle className="w-3.5 h-3.5 fill-current" /> Start Recording</Button>}
        {state === 'recording' && (
          <>
            <span className="text-sm font-mono text-primary animate-pulse">● {fmt(seconds)}</span>
            <Button variant="destructive" onClick={stop} className="gap-2"><Square className="w-3.5 h-3.5 fill-current" /> Stop</Button>
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

// ── AI Tools ─────────────────────────────────────────────────────────────────
function PodcastAITools() {
  const [activeTool, setActiveTool] = useState('title');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const tools = [
    { id: 'title', icon: Sparkles, label: 'Title Generator' },
    { id: 'shownotes', icon: FileText, label: 'Show Notes' },
    { id: 'description', icon: BarChart3, label: 'Description' },
  ];

  const run = async () => {
    if (!topic.trim()) { toast.error('Enter a topic first'); return; }
    setLoading(true); setOutput('');
    try {
      let prompt = '';
      if (activeTool === 'title') {
        prompt = `Generate 7 compelling podcast episode titles for: "${topic}". Make them curiosity-driven, SEO-friendly. Numbered list.`;
      } else if (activeTool === 'shownotes') {
        prompt = `Write comprehensive podcast show notes for: "${topic}".\nContext: ${notes || 'none'}\nInclude: summary, key topics, takeaways, resources, CTA. Use clear headers.`;
      } else {
        prompt = `Write a compelling podcast episode description for: "${topic}".\nNotes: ${notes || 'none'}\nHook, what listeners learn, why it matters, who it's for, CTA. Under 200 words, optimized for Spotify/Apple search.`;
      }
      const res = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setOutput(data.result ?? '');
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
          <button key={t.id} onClick={() => { setActiveTool(t.id); setOutput(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeTool === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>
      <div>
        <Label>Episode Topic</Label>
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. How I grew to 10k subscribers in 6 months" className="mt-1" />
      </div>
      {activeTool !== 'title' && (
        <div>
          <Label>Additional Notes (optional)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Key points, guest name, topics..." className="mt-1" />
        </div>
      )}
      <Button onClick={run} disabled={loading} className="gap-2 w-full sm:w-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        {loading ? 'Generating…' : 'Generate'}
      </Button>
      {output && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Result</span>
            <button onClick={() => { navigator.clipboard.writeText(output); toast.success('Copied!'); }} className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
}

// ── Episode card (studio view) ────────────────────────────────────────────────
function EpisodeCard({ episode, podcast, onEdit, onDelete }) {
  const { play, pause, episode: current, isPlaying } = usePodcastPlayer();
  const active = current?.id === episode.id && isPlaying;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => episode.audio_url && (active ? pause() : play({ ...episode, podcast_name: podcast?.title, cover_image_url: podcast?.cover_url }))}
            disabled={!episode.audio_url}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-primary' : 'bg-primary/10 hover:bg-primary/20'} disabled:opacity-40`}>
            {active ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-primary ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">S{episode.season_number || 1} · Ep. {episode.episode_number || '—'}</span>
              {episode.is_premium && <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-600"><Lock className="w-2.5 h-2.5" /> ${episode.premium_price || '—'}</Badge>}
              {episode.status === 'scheduled' && <Badge variant="secondary" className="text-xs">Scheduled</Badge>}
              {episode.status === 'draft' && <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>}
            </div>
            <h3 className="font-semibold text-sm mt-0.5 truncate">{episode.title}</h3>
            {episode.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{episode.description}</p>}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(episode)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(episode.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {episode.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(episode.duration)}</span>}
        <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{(episode.play_count || 0).toLocaleString()} plays</span>
        {(episode.tips_total || 0) > 0 && <span className="flex items-center gap-1 text-amber-600"><DollarSign className="w-3 h-3" />${episode.tips_total?.toFixed(2)} tips</span>}
        {episode.published_at && <span>{formatDistanceToNow(new Date(episode.published_at), { addSuffix: true })}</span>}
      </div>
    </div>
  );
}

// ── RSS + Distribution panel ─────────────────────────────────────────────────
function DistributionPanel({ podcast }) {
  const rssUrl = `https://philomni.com/api/jamendo?action=rss&id=${podcast.id}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(rssUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('RSS URL copied!');
  };

  return (
    <div className="space-y-5">
      {/* RSS Feed URL */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Rss className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-sm">Your RSS Feed</h3>
        </div>
        <p className="text-xs text-muted-foreground">Submit this URL to any podcast platform to distribute your show automatically. Every new episode you publish will be picked up within 24 hours.</p>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-foreground flex-1 truncate">{rssUrl}</span>
          <button onClick={copy} className="flex-shrink-0 p-1 hover:text-primary transition-colors">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Distribution platforms */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Submit to Platforms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DISTRIBUTION_PLATFORMS.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all group">
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{p.name}</p>
                <p className="text-xs text-muted-foreground">Paste RSS URL to submit</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">How distribution works</span>
        </div>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Copy your RSS feed URL above</li>
          <li>Click a platform and create a free account</li>
          <li>Paste your RSS URL when prompted during submission</li>
          <li>Platform reviews your podcast (usually 24–72 hours)</li>
          <li>Once approved, new episodes sync automatically</li>
        </ol>
      </div>
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ podcast, episodes }) {
  const totalPlays = episodes.reduce((s, e) => s + (e.play_count || 0), 0);
  const totalTips = episodes.reduce((s, e) => s + (e.tips_total || 0), 0);
  const topEpisodes = [...episodes].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5);

  const stats = [
    { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Headphones, color: 'text-blue-500' },
    { label: 'Subscribers', value: (podcast.subscriber_count || 0).toLocaleString(), icon: Users, color: 'text-purple-500' },
    { label: 'Episodes', value: episodes.length, icon: Radio, color: 'text-primary' },
    { label: 'Tips Earned', value: `$${totalTips.toFixed(2)}`, icon: DollarSign, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {topEpisodes.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Top Episodes</h3>
          <div className="space-y-2">
            {topEpisodes.map((ep, i) => (
              <div key={ep.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ep.title}</p>
                  <p className="text-xs text-muted-foreground">Ep. {ep.episode_number}</p>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <p className="font-semibold">{(ep.play_count || 0).toLocaleString()}</p>
                  <p className="text-muted-foreground">plays</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPlays === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Analytics will appear once your episodes get plays</p>
        </div>
      )}
    </div>
  );
}

// ── Main PodcastStudio ────────────────────────────────────────────────────────
export default function PodcastStudio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showNewPodcast, setShowNewPodcast] = useState(false);
  const [managingPodcast, setManagingPodcast] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [epInputMode, setEpInputMode] = useState('upload');
  const [coverFile, setCoverFile] = useState(null);
  const coverRef = useRef();
  const audioRef = useRef();

  const [podcastForm, setPodcastForm] = useState({
    title: '', description: '', category: '',
    language: 'en', explicit: false, website: '',
    monetization_enabled: false,
  });
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef();

  const [epForm, setEpForm] = useState({
    title: '', description: '', episode_number: '', season_number: '1',
    is_premium: false, premium_price: '', show_notes: '',
    audio_file: null, audio_url: '',
    status: 'published', scheduled_at: '',
  });

  const { data: myPodcasts = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my-podcasts', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('podcasts').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: allPodcasts = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-podcasts'],
    queryFn: async () => {
      const { data } = await supabase.from('podcasts').select('*').order('total_plays', { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: managingEpisodes = [], refetch: refetchEpisodes } = useQuery({
    queryKey: ['episodes', managingPodcast?.id],
    queryFn: async () => {
      const { data } = await supabase.from('podcast_episodes').select('*')
        .eq('podcast_id', managingPodcast.id)
        .order('episode_number', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    enabled: !!managingPodcast?.id,
  });

  const uploadCover = async () => {
    if (!coverFile) return null;
    const path = `podcast-covers/${user.id}/${Date.now()}-${coverFile.name}`;
    const { data, error } = await supabase.storage.from('uploads').upload(path, coverFile);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleCreatePodcast = async () => {
    if (!podcastForm.title.trim()) return;
    setSaving(true);
    try {
      const coverUrl = await uploadCover();
      const { error } = await supabase.from('podcasts').insert({
        ...podcastForm,
        created_by: user.id,
        creator_name: user.full_name || user.email,
        creator_avatar: user.avatar_url || '',
        cover_url: coverUrl || null,
        total_episodes: 0,
        subscriber_count: 0,
        total_plays: 0,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['my-podcasts', user?.id] });
      qc.invalidateQueries({ queryKey: ['all-podcasts'] });
      // Auto-open the manage tab so user can upload episodes immediately
      const { data: newPod } = await supabase.from('podcasts').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (newPod) setManaging(newPod);
      toast.success('Podcast created! Now upload your first episode below.');
      setShowNewPodcast(false);
      setPodcastForm({ title: '', description: '', category: '', language: 'en', explicit: false, website: '', monetization_enabled: false });
      setCatQuery('');
      setCoverFile(null);
      setShowNewEpisode(true); // open episode dialog immediately
    } catch {
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
        const path = `podcasts/${user.id}/${Date.now()}-${epForm.audio_file.name}`;
        const { data, error } = await supabase.storage.from('uploads').upload(path, epForm.audio_file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path);
        audioUrl = publicUrl;
        setUploading(false);
      }

      const isScheduled = epForm.status === 'scheduled' && epForm.scheduled_at;
      const payload = {
        podcast_id: managingPodcast.id,
        title: epForm.title,
        description: epForm.description,
        show_notes: epForm.show_notes || null,
        episode_number: epForm.episode_number ? parseInt(epForm.episode_number) : managingEpisodes.length + 1,
        season_number: epForm.season_number ? parseInt(epForm.season_number) : 1,
        is_premium: epForm.is_premium,
        premium_price: epForm.is_premium && epForm.premium_price ? parseFloat(epForm.premium_price) : null,
        audio_url: audioUrl || null,
        status: isScheduled ? 'scheduled' : epForm.status,
        scheduled_at: isScheduled ? epForm.scheduled_at : null,
        published_at: isScheduled ? null : (editingEpisode?.published_at || new Date().toISOString()),
        publish_date: isScheduled ? null : (editingEpisode?.publish_date || new Date().toISOString()),
        play_count: editingEpisode?.play_count || 0,
        tips_total: editingEpisode?.tips_total || 0,
        created_by: user.id,
      };

      if (editingEpisode) {
        const { error } = await supabase.from('podcast_episodes').update(payload).eq('id', editingEpisode.id);
        if (error) throw error;
        toast.success('Episode updated');
      } else {
        const { error } = await supabase.from('podcast_episodes').insert(payload);
        if (error) throw error;
        await supabase.from('podcasts').update({ total_episodes: managingEpisodes.length + 1 }).eq('id', managingPodcast.id);
        toast.success('Episode published!');
      }

      refetchEpisodes();
      qc.invalidateQueries({ queryKey: ['my-podcasts', user?.id] });
      setShowNewEpisode(false);
      setEditingEpisode(null);
      setEpForm({ title: '', description: '', episode_number: '', season_number: '1', is_premium: false, premium_price: '', show_notes: '', audio_file: null, audio_url: '', status: 'published', scheduled_at: '' });
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

  const handleDeletePodcast = async (podcast) => {
    if (!window.confirm(`Delete "${podcast.title}"? This will also delete all its episodes and cannot be undone.`)) return;
    await supabase.from('podcast_episodes').delete().eq('podcast_id', podcast.id);
    await supabase.from('podcasts').delete().eq('id', podcast.id);
    if (managingPodcast?.id === podcast.id) { setManagingPodcast(null); setActiveTab('mine'); }
    qc.invalidateQueries({ queryKey: ['my-podcasts', user?.id] });
    qc.invalidateQueries({ queryKey: ['all-podcasts'] });
    toast.success('Podcast deleted');
  };

  const openEditEpisode = (ep) => {
    setEpForm({
      title: ep.title || '', description: ep.description || '',
      episode_number: String(ep.episode_number || ''), season_number: String(ep.season_number || '1'),
      is_premium: ep.is_premium || false, premium_price: String(ep.premium_price || ''),
      show_notes: ep.show_notes || '', audio_file: null, audio_url: ep.audio_url || '',
      status: ep.status || 'published', scheduled_at: ep.scheduled_at || '',
    });
    setEditingEpisode(ep);
    setShowNewEpisode(true);
  };

  const setManaging = (podcast) => { setManagingPodcast(podcast); if (podcast) setActiveTab('manage'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6" /> Podcast Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, manage and monetize your podcast</p>
        </div>
        <Button size="sm" onClick={() => setShowNewPodcast(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Podcast
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 flex-wrap h-auto">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="mine">My Podcasts{myPodcasts.length > 0 ? ` (${myPodcasts.length})` : ''}</TabsTrigger>
          <TabsTrigger value="ai-tools" className="gap-1.5"><Wand2 className="w-3.5 h-3.5" /> AI Tools</TabsTrigger>
          {managingPodcast && (
            <TabsTrigger value="manage" className="gap-1.5 max-w-[140px]">
              <Mic className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{managingPodcast.title}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Discover */}
        <TabsContent value="discover">
          {loadingAll ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : allPodcasts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No podcasts yet — be the first!</p>
              <Button variant="outline" className="mt-4" size="sm" onClick={() => setShowNewPodcast(true)}>Start a podcast</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allPodcasts.map(p => (
                <DiscoverCard key={p.id} podcast={p} currentUser={user} onManage={setManaging} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Tools */}
        <TabsContent value="ai-tools">
          <div className="max-w-2xl">
            <div className="mb-5">
              <h2 className="font-semibold text-lg">Podcast AI Tools</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Generate titles, show notes, and descriptions with AI</p>
            </div>
            <PodcastAITools />
          </div>
        </TabsContent>

        {/* My Podcasts */}
        <TabsContent value="mine">
          {loadingMine ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : myPodcasts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No podcasts yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start your first podcast and distribute it to Spotify, Apple Podcasts, and more</p>
              <Button size="sm" onClick={() => setShowNewPodcast(true)}>Create Podcast</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myPodcasts.map(p => (
                <MyPodcastCard key={p.id} podcast={p} onManage={setManaging} onDelete={handleDeletePodcast} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manage podcast */}
        {managingPodcast && (
          <TabsContent value="manage">
            <Tabs defaultValue="episodes">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Managing</p>
                  <h2 className="font-semibold">{managingPodcast.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <TabsList>
                    <TabsTrigger value="episodes">Episodes</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  </TabsList>
                  <Button size="sm" onClick={() => setShowNewEpisode(true)} className="gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Add Episode
                  </Button>
                </div>
              </div>

              <TabsContent value="episodes">
                {managingEpisodes.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <Headphones className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">No episodes yet</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewEpisode(true)}>Upload first episode</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {managingEpisodes.map(ep => (
                      <EpisodeCard key={ep.id} episode={ep} podcast={managingPodcast} onEdit={openEditEpisode} onDelete={handleDeleteEpisode} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsPanel podcast={managingPodcast} episodes={managingEpisodes} />
              </TabsContent>

              <TabsContent value="distribution">
                <DistributionPanel podcast={managingPodcast} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>

      {/* New Podcast Dialog */}
      <Dialog open={showNewPodcast} onOpenChange={setShowNewPodcast}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Podcast</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Cover image */}
            <div>
              <Label>Cover Image</Label>
              <div
                onClick={() => coverRef.current?.click()}
                className="mt-1 relative cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors overflow-hidden"
                style={{ aspectRatio: '1', maxWidth: 160 }}>
                {coverFile ? (
                  <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Image className="w-8 h-8 opacity-40" />
                    <span className="text-xs">Upload cover</span>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files[0])} />
            </div>

            <div>
              <Label>Podcast Title *</Label>
              <Input value={podcastForm.title} onChange={e => setPodcastForm(p => ({ ...p, title: e.target.value }))} placeholder="My Awesome Podcast" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={podcastForm.description} onChange={e => setPodcastForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" placeholder="What is your podcast about?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative" ref={catRef}>
                <Label>Category</Label>
                <input
                  value={catQuery}
                  onChange={e => { setCatQuery(e.target.value); setPodcastForm(p => ({ ...p, category: e.target.value })); setCatOpen(true); }}
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                  placeholder="e.g. Business"
                  className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                />
                {catOpen && PODCAST_CATEGORIES.filter(c => c.toLowerCase().includes(catQuery.toLowerCase())).length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl max-h-44 overflow-y-auto">
                    {PODCAST_CATEGORIES.filter(c => c.toLowerCase().includes(catQuery.toLowerCase())).map(c => (
                      <button key={c} type="button"
                        onMouseDown={() => { setCatQuery(c); setPodcastForm(p => ({ ...p, category: c })); setCatOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Language</Label>
                <Select value={podcastForm.language} onValueChange={v => setPodcastForm(p => ({ ...p, language: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Website (optional)</Label>
              <Input value={podcastForm.website} onChange={e => setPodcastForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourpodcast.com" className="mt-1" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={podcastForm.explicit} onChange={e => setPodcastForm(p => ({ ...p, explicit: e.target.checked }))} className="rounded" />
                <span className="text-sm">Explicit content</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={podcastForm.monetization_enabled} onChange={e => setPodcastForm(p => ({ ...p, monetization_enabled: e.target.checked }))} className="rounded" />
                <span className="text-sm">Enable monetization</span>
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowNewPodcast(false); setCoverFile(null); }}>Cancel</Button>
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
                <Label>Episode Title *</Label>
                <Input value={epForm.title} onChange={e => setEpForm(p => ({ ...p, title: e.target.value }))} placeholder="Episode title" className="mt-1" />
              </div>
              <div>
                <Label>Ep. #</Label>
                <Input type="number" value={epForm.episode_number} onChange={e => setEpForm(p => ({ ...p, episode_number: e.target.value }))} placeholder="Auto" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Season</Label>
                <Input type="number" value={epForm.season_number} onChange={e => setEpForm(p => ({ ...p, season_number: e.target.value }))} placeholder="1" className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={epForm.status} onValueChange={v => setEpForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {epForm.status === 'scheduled' && (
              <div>
                <Label>Schedule Date & Time</Label>
                <Input type="datetime-local" value={epForm.scheduled_at} onChange={e => setEpForm(p => ({ ...p, scheduled_at: e.target.value }))} className="mt-1" />
              </div>
            )}

            <div>
              <Label>Description</Label>
              <Textarea value={epForm.description} onChange={e => setEpForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1" placeholder="What is this episode about?" />
            </div>

            <div>
              <Label>Show Notes (optional)</Label>
              <Textarea value={epForm.show_notes} onChange={e => setEpForm(p => ({ ...p, show_notes: e.target.value }))} rows={3} className="mt-1" placeholder="Links, timestamps, resources mentioned..." />
            </div>

            {/* Bonus/Exclusive label */}
            <div className="rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={epForm.is_premium} onChange={e => setEpForm(p => ({ ...p, is_premium: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Mark as Bonus / Exclusive episode</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">Shows a "Bonus" badge. Listeners can tip or support your show — episodes are always free to play.</p>
            </div>

            {/* Audio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Audio</Label>
                <div className="flex gap-1 border border-border rounded-lg p-0.5">
                  <button onClick={() => setEpInputMode('upload')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${epInputMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    <Upload className="w-3 h-3 inline mr-1" />Upload
                  </button>
                  <button onClick={() => setEpInputMode('record')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${epInputMode === 'record' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    <Mic className="w-3 h-3 inline mr-1" />Record
                  </button>
                </div>
              </div>

              {epInputMode === 'upload' ? (
                <div
                  onClick={() => audioRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${epForm.audio_file ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => setEpForm(p => ({ ...p, audio_file: e.target.files[0], audio_url: '' }))} />
                  {epForm.audio_file ? (
                    <div className="flex items-center gap-2 justify-center text-sm">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="font-medium truncate max-w-[200px]">{epForm.audio_file.name}</span>
                      <span className="text-muted-foreground text-xs">{(epForm.audio_file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ) : epForm.audio_url ? (
                    <div className="text-sm text-primary flex items-center gap-2 justify-center">
                      <CheckCircle2 className="w-4 h-4" />Existing audio file
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm font-medium">Click or drop audio file</p>
                      <p className="text-xs text-muted-foreground mt-0.5">MP3, WAV, M4A, OGG · Max 500 MB</p>
                    </>
                  )}
                </div>
              ) : (
                <InAppRecorder onRecorded={(file) => setEpForm(p => ({ ...p, audio_file: file, audio_url: '' }))} />
              )}
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading audio…
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowNewEpisode(false); setEditingEpisode(null); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveEpisode} disabled={saving || uploading || !epForm.title.trim()}>
                {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {editingEpisode ? 'Save Changes' : epForm.status === 'scheduled' ? 'Schedule Episode' : 'Publish Episode'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Discover card ─────────────────────────────────────────────────────────────
function DiscoverCard({ podcast, currentUser, onManage }) {
  const isOwner = podcast.created_by === currentUser?.id;
  const { play, pause, episode: currentEp, isPlaying } = usePodcastPlayer();

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', podcast.id],
    queryFn: async () => {
      const { data } = await supabase.from('podcast_episodes').select('*')
        .eq('podcast_id', podcast.id).order('episode_number', { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!podcast.id,
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
            {podcast.cover_url
              ? <img src={podcast.cover_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center"><Mic className="w-6 h-6 text-muted-foreground" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{podcast.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{podcast.creator_name || 'Creator'}</p>
            {podcast.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{podcast.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {podcast.category && <Badge variant="secondary" className="text-xs">{podcast.category}</Badge>}
              {podcast.explicit && <Badge variant="outline" className="text-xs text-red-500 border-red-200">Explicit</Badge>}
              <span className="text-xs text-muted-foreground">{podcast.total_episodes || 0} episodes</span>
              {(podcast.subscriber_count || 0) > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />{podcast.subscriber_count}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <Button size="sm" variant="outline" onClick={() => onManage(podcast)} className="flex-shrink-0">Manage</Button>
          )}
        </div>
      </div>

      {episodes.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {episodes.slice(0, 3).map(ep => {
            const active = currentEp?.id === ep.id && isPlaying;
            return (
              <button key={ep.id}
                onClick={() => ep.audio_url && (active ? pause() : play({ ...ep, podcast_name: podcast.title, cover_image_url: podcast.cover_url }))}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
                disabled={!ep.audio_url}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary' : 'bg-primary/10'}`}>
                  {active ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-primary ml-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ep.duration ? fmtDuration(ep.duration) : 'Audio'} · {ep.is_premium ? `🔒 $${ep.premium_price}` : 'Free'}
                  </p>
                </div>
              </button>
            );
          })}
          {episodes.length > 3 && (
            <div className="px-4 py-2 text-xs text-center text-muted-foreground">+{episodes.length - 3} more episodes</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── My Podcast card ───────────────────────────────────────────────────────────
function MyPodcastCard({ podcast, onManage, onDelete }) {
  const rssUrl = `https://philomni.com/api/jamendo?action=rss&id=${podcast.id}`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
          {podcast.cover_url
            ? <img src={podcast.cover_url} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><Mic className="w-5 h-5 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{podcast.title}</h3>
          {podcast.category && <Badge variant="secondary" className="text-xs mt-0.5">{podcast.category}</Badge>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span>{podcast.total_episodes || 0} episodes</span>
            <span><Users className="w-3 h-3 inline mr-0.5" />{podcast.subscriber_count || 0} subscribers</span>
            <span><Headphones className="w-3 h-3 inline mr-0.5" />{podcast.total_plays || 0} plays</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={() => onManage(podcast)}>Manage</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(podcast)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Podcast
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* RSS shortcut */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <Rss className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
        <span className="text-xs text-muted-foreground font-mono truncate flex-1">{rssUrl}</span>
        <button onClick={() => { navigator.clipboard.writeText(rssUrl); toast.success('RSS URL copied!'); }} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
