import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wand2, Image as ImageIcon, FileText, Calendar, Send,
  Copy, Check, Loader2, Sparkles, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

const CAPTION_TONES = ['Professional', 'Casual', 'Inspirational', 'Humorous', 'Urgent', 'Educational'];
const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook', 'TikTok', 'YouTube'];
const SCRIPT_TYPES = ['Product promo', 'Tutorial', 'Brand story', 'Testimonial', 'Explainer', 'Interview'];
const IMAGE_STYLES = ['Photorealistic', 'Cinematic', 'Illustration', 'Minimalist', '3D render', 'Flat design'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-muted transition-colors">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

// ─── AI Captions ────────────────────────────────────────────────
function CaptionGenerator({ user }) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('Casual');
  const [hashtags, setHashtags] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await (async () => { const _llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Generate 3 ${tone.toLowerCase()} social media captions for ${platform} about: "${topic}". ${hashtags ? 'Include relevant hashtags.' : ''} Return as JSON array: [{"caption": "...", "hashtags": [...]}]` }) }); const _llmData = await _llmRes.json(); return JSON.parse(_llmData.result ?? '{}'); })();
      setResults(res?.captions ?? []);
    } catch (_) {
      // Fallback mock
      setResults([
        { caption: `${topic} is transforming the way we think about content. Swipe to see how. ✨`, hashtags: ['contentcreator', 'inspiration'] },
        { caption: `Discover the power of ${topic}. Your audience is waiting. 🚀`, hashtags: ['growth', 'socialmedia'] },
        { caption: `Behind every great ${topic} is a great story. Here's mine. 👇`, hashtags: ['storytelling', 'brand'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Topic or Product</Label>
        <Input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. My new coaching programme, product launch, event..."
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CAPTION_TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="hashtags" checked={hashtags} onChange={e => setHashtags(e.target.checked)} className="rounded" />
        <Label htmlFor="hashtags" className="cursor-pointer">Include hashtags</Label>
      </div>
      <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Generate Captions
      </Button>

      {results.length > 0 && (
        <div className="space-y-3 mt-4">
          {results.map((r, i) => (
            <div key={i} className="bg-muted/50 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1 leading-relaxed">{r.caption}</p>
                <CopyButton text={r.caption + (r.hashtags?.length ? '\n\n' + r.hashtags.map(h => `#${h}`).join(' ') : '')} />
              </div>
              {r.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.hashtags.map(h => <Badge key={h} variant="secondary" className="text-xs">#{h}</Badge>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Image Generator ─────────────────────────────────────────
function ImageGenerator({ user }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Photorealistic');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (data.url) setImages(prev => [data.url, ...prev.slice(0, 5)]);
    } catch (_) {
      toast.error('Image generation failed. Check your Ideogram API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Image Description</Label>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe the image you want to create..."
          className="mt-1"
        />
      </div>
      <div>
        <Label>Style</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {IMAGE_STYLES.map(s => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                style === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50 text-muted-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={generate} disabled={loading || !prompt.trim()} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        Generate Image
      </Button>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {images.map((url, i) => (
            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
              <img src={url} className="w-full h-full object-cover" alt={`Generated ${i + 1}`} loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                <a
                  href={url}
                  download={`philomni-image-${i}.jpg`}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur"
                >
                  <Download className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Script Writer ────────────────────────────────────────────────
function ScriptWriter({ user }) {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('Product promo');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Write a ${duration}-second ${type?.toLowerCase?.() ?? "video"} script about: "${topic}". Format with HOOK, BODY, CTA. Be engaging and natural-sounding.` }) }); const _d = await _r.json(); return _d.result ?? ''; })();
      setScript(typeof res === 'string' ? res : (res?.result ?? res?.response ?? res ?? ''));
    } catch (_) {
      setScript(`[HOOK - 0-5s]\nHey, quick question — are you struggling with ${topic}?\n\n[BODY - 5-${parseInt(duration) - 15}s]\nHere's what you need to know: [add your key points here]. The secret is to focus on consistency and value.\n\n[CTA - last 15s]\nIf this helped you, follow for more. Drop a comment below — I read every single one!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Topic</Label>
        <Input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="What is the video about?"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Script Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{SCRIPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Duration (seconds)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['15', '30', '60', '90', '120', '180'].map(d => (
                <SelectItem key={d} value={d}>{d}s</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Write Script
      </Button>

      {script && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <Label>Your Script</Label>
            <div className="flex gap-2">
              <CopyButton text={script} />
              <button onClick={generate} className="p-1.5 rounded hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <Textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={14}
            className="font-mono text-xs leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}

// ─── 30-Day Content Planner ───────────────────────────────────────
function ContentPlanner({ user }) {
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('Grow audience');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState([]);

  const generate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    try {
      const res = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Create a 30-day social media plan for a ${niche} creator with goal: "${goal}". Return JSON array with fields: day, theme, content_type, topic, caption_hook` }) }); const _d = await _r.json(); return _d.result ?? ''; })();
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      setPlan(parsed.days || []);
    } catch (_) {
      const types = ['Post', 'Reel', 'Story', 'Carousel', 'Live', 'Poll'];
      const themes = ['Education', 'Behind the scenes', 'Motivation', 'Engagement', 'Promotion', 'Community'];
      setPlan(Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        theme: themes[i % themes.length],
        content_type: types[i % types.length],
        topic: `${niche} tip #${i + 1}`,
        caption_hook: `Did you know this about ${niche}?`,
      })));
    } finally {
      setLoading(false);
    }
  };

  const TYPE_COLORS = {
    Post: 'bg-blue-500/10 text-blue-600',
    Reel: 'bg-purple-500/10 text-purple-600',
    Story: 'bg-pink-500/10 text-pink-600',
    Carousel: 'bg-orange-500/10 text-orange-600',
    Live: 'bg-red-500/10 text-red-600',
    Poll: 'bg-green-500/10 text-green-600',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Your Niche</Label>
          <Input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. fitness coaching, design, finance..."
            className="mt-1"
          />
        </div>
        <div>
          <Label>Primary Goal</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Grow audience', 'Drive sales', 'Build authority', 'Increase engagement', 'Launch product'].map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={generate} disabled={loading || !niche.trim()} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        Generate 30-Day Plan
      </Button>

      {plan.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Your 30-Day Plan</p>
            <button
              onClick={() => {
                const csv = ['Day,Theme,Type,Topic,Hook', ...plan.map(d =>
                  `${d.day},"${d.theme}","${d.content_type}","${d.topic}","${d.caption_hook}"`
                )].join('\n');
                const a = document.createElement('a');
                a.href = 'data:text/csv,' + encodeURIComponent(csv);
                a.download = '30-day-content-plan.csv';
                a.click();
              }}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {plan.map(day => (
              <div key={day.day} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[day.content_type] || 'bg-muted text-muted-foreground'}`}>
                      {day.content_type}
                    </span>
                    <span className="text-xs text-muted-foreground">{day.theme}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{day.topic}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 italic">"{day.caption_hook}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function BusinessContentSuite() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Business Content Suite</h1>
        </div>
        <p className="text-sm text-muted-foreground">AI-powered tools to create, plan, and publish content at scale</p>
      </div>

      <Tabs defaultValue="captions">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="captions" className="gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Captions
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Images
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Scripts
          </TabsTrigger>
          <TabsTrigger value="planner" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> 30-Day Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="captions">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <CaptionGenerator user={user} />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <ImageGenerator user={user} />
          </div>
        </TabsContent>

        <TabsContent value="scripts">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <ScriptWriter user={user} />
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <ContentPlanner user={user} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
