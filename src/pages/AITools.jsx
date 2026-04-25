import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, FileText, MessageSquare, Image, Video, Calendar, UserCheck, Crown, TrendingUp, Music, Download, Loader2, Save, X, Edit2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ToolModal from '@/components/ai-tools/ToolModal';
import AudioLibrary from '@/components/audio/AudioLibrary';

const TOOLS = [
  // Business & Marketing
  { id: 'pitch', icon: FileText, title: 'AI Pitch Builder', desc: 'Structure your idea into a compelling investor-ready pitch', price: '$4.99', prompt: 'Describe your business idea and I will create a structured investor-ready pitch with key sections, messages, and compelling language.', category: 'business' },
  { id: 'caption', icon: MessageSquare, title: 'AI Caption Generator', desc: 'Generate platform-specific social media captions', price: '$2.99', prompt: 'Describe your product/service or upload a photo description. I will generate social media captions for Philomni, Instagram, Facebook, LinkedIn, and TikTok.', category: 'business' },
  { id: 'image', icon: Image, title: 'AI Marketing Image', desc: 'Generate branded marketing visuals from text', price: '$3.99', prompt: 'Describe what marketing visual you need. I will generate a branded promotional image or banner.', category: 'business' },
  { id: 'script', icon: Video, title: 'AI Video Script', desc: 'Generate short-form video scripts with hook, body, CTA', price: '$3.99', prompt: 'Describe your product/service. I will write a short-form video script with a compelling hook, informative body, and clear call to action.', category: 'business' },
  { id: 'planner', icon: Calendar, title: 'AI Post Planner', desc: 'Get a full 30-day content calendar', price: '$9.99', prompt: 'Tell me about your brand (industry, audience, goals, tone, products). I will create a 30-day content calendar with post ideas, captions, and image descriptions.', category: 'business' },
  { id: 'profile', icon: UserCheck, title: 'AI Profile Optimiser', desc: 'Get recommendations to improve your profile', price: '$1.99', prompt: 'I will analyse your profile and give specific recommendations to improve discoverability, match score, and connection quality.', category: 'business' },
  // Video generation tools
  { id: 'product-video', icon: Video, title: 'AI Product Video', desc: 'Generate a 10-second product showcase video', price: '$9.99', isVideoTool: true, videoType: 'product', prompt: 'I will generate a cinematic product showcase video. Describe your product, its key features, and the vibe you want.', category: 'business' },
  { id: 'ad-video', icon: Video, title: 'AI Ad Video', desc: 'Create a 10-second video ad for any platform', price: '$9.99', isVideoTool: true, videoType: 'ad', prompt: 'I will create a compelling video advertisement. Describe your product/service, target audience, and key message.', category: 'business' },
  { id: 'testimonial-video', icon: Video, title: 'AI Testimonial Video', desc: 'Generate an avatar testimonial video', price: '$7.99', isVideoTool: true, videoType: 'avatar', prompt: 'I will create an AI avatar testimonial video. Provide the testimonial script and any style preferences.', category: 'business' },

  // Creator & UGC Tools
  { id: 'ugc-script', icon: Video, title: 'UGC Script Generator', desc: 'Create authentic UGC product demo scripts', price: '$2.99', prompt: 'I will create natural, authentic UGC scripts that feel like genuine user reviews. Include problem-solution-benefit flow, authentic language, and clear call-to-action for the product.', category: 'creator' },
  { id: 'trend-ideas', icon: Sparkles, title: 'Trending Content Ideas', desc: 'Get viral content ideas based on current trends', price: '$1.99', prompt: 'I will analyze current trends and suggest 5-10 viral content ideas tailored to your niche with hooks, formats, and posting strategies.', category: 'creator' },
  { id: 'hashtag', icon: MessageSquare, title: 'Hashtag Optimizer', desc: 'Generate trending hashtags for maximum reach', price: '$1.99', prompt: 'I will generate a mix of trending, high-volume, and niche hashtags optimized for discoverability and engagement.', category: 'creator' },
  { id: 'product-review', icon: FileText, title: 'Product Review Script', desc: 'Write engaging product review scripts for any product', price: '$2.99', prompt: 'I will create an engaging product review script with intro hook, features breakdown, honest pros/cons, personal experience, and compelling call-to-action.', category: 'creator' },
  { id: 'thumbnail', icon: Image, title: 'Thumbnail Text Generator', desc: 'Generate attention-grabbing thumbnail text overlays', price: '$1.99', prompt: 'I will suggest bold, punchy text overlays and visual elements for YouTube/TikTok thumbnails that increase click-through rates.', category: 'creator' },

  // Content & Website Tools
  { id: 'blog-writer', icon: FileText, title: 'AI Blog Post Writer', desc: 'Generate SEO-optimized blog posts on any topic', price: '$4.99', prompt: 'I will write a comprehensive, SEO-optimized blog post with engaging introduction, well-structured sections, actionable insights, and compelling conclusion.', category: 'content' },
  { id: 'content-calendar', icon: Calendar, title: 'Content Calendar Generator', desc: 'Create a full month of social media content ideas', price: '$5.99', prompt: 'I will create a detailed 30-day social media content calendar with specific post ideas, captions, posting times, content formats, and engagement strategies.', category: 'content' },
  { id: 'website-copy', icon: FileText, title: 'Website Copy Generator', desc: 'Generate compelling website copy from business details', price: '$3.99', prompt: 'I will create persuasive, conversion-focused website copy including headline, hero section, features, benefits, social proof, and CTA.', category: 'content' },
  { id: 'email-newsletter', icon: FileText, title: 'Email Newsletter Writer', desc: 'Write engaging email newsletters that get opened and read', price: '$3.99', prompt: 'Write a compelling email newsletter with attention-grabbing subject line, engaging intro, valuable main content, and clear CTA. Include subscriber value and a personal tone.', category: 'content' },
  { id: 'press-release', icon: FileText, title: 'Press Release Generator', desc: 'Create professional press releases for announcements', price: '$3.99', prompt: 'Write a professional press release with headline, dateline, lead paragraph (who/what/when/where/why), supporting quotes, boilerplate, and media contact info.', category: 'content' },
  { id: 'linkedin-article', icon: FileText, title: 'LinkedIn Article Writer', desc: 'Write thought leadership articles for LinkedIn', price: '$3.99', prompt: 'Write a compelling LinkedIn article with a strong hook, expert insights, personal story elements, actionable takeaways, and a discussion-provoking conclusion.', category: 'content' },
  { id: 'sales-page', icon: FileText, title: 'Sales Page Copy', desc: 'Generate high-converting sales page copy', price: '$4.99', prompt: 'Write persuasive sales page copy with headline, subheadline, problem statement, solution positioning, features/benefits, social proof placeholders, objection handling, and strong CTA.', category: 'content' },
  { id: 'product-desc', icon: FileText, title: 'Product Description Writer', desc: 'Write compelling product descriptions that sell', price: '$2.99', prompt: 'Write a compelling product description that highlights key benefits, uses sensory language, addresses customer pain points, and includes a clear value proposition.', category: 'content' },
  { id: 'brand-story', icon: FileText, title: 'Brand Story Generator', desc: 'Craft your brand origin story and mission narrative', price: '$3.99', prompt: 'Write an authentic brand story covering the founding moment, problem we solve, our mission/vision/values, what makes us different, and where we are going.', category: 'content' },
  { id: 'faq', icon: MessageSquare, title: 'FAQ Generator', desc: 'Generate comprehensive FAQ pages for your business', price: '$2.99', prompt: 'Generate 10-15 common customer questions with detailed, helpful answers. Cover product/service details, pricing, process, support, and trust-building questions.', category: 'content' },
  { id: 'bio-writer', icon: UserCheck, title: 'Bio Writer', desc: 'Write professional bios for any platform', price: '$2.99', prompt: 'Write a compelling professional bio in three versions: short (50 words for social media), medium (150 words for website), and long (300 words for press/speaker pages).', category: 'content' },
  { id: 'pitch-deck', icon: FileText, title: 'Pitch Deck Outline', desc: 'Structure your investor pitch deck slide by slide', price: '$4.99', prompt: 'Create a complete pitch deck outline with 12-15 slides: problem, solution, market size, product, business model, traction, team, financials, ask. Include talking points for each slide.', category: 'content' },
  { id: 'grant-proposal', icon: FileText, title: 'Grant Proposal Writer', desc: 'Write compelling grant proposals for funding', price: '$4.99', prompt: 'Write a grant proposal including executive summary, organizational background, problem statement, project description, goals/objectives, evaluation plan, and budget narrative.', category: 'content' },

  // Growth & Optimization Tools
  { id: 'social-audit', icon: TrendingUp, title: 'Social Media Audit Tool', desc: 'Audit your social profiles and get an actionable improvement report', price: '$3.99', prompt: 'Perform a social media audit. I will analyze your profile details, posting consistency, content mix, engagement strategy, and bio copy, then provide an actionable improvement plan with priority scores.', category: 'content' },
  { id: 'competitor-analysis', icon: TrendingUp, title: 'Competitor Analysis Writer', desc: 'Analyze competitor positioning and find your edge', price: '$4.99', prompt: 'Write a competitor analysis covering their messaging, content strategy, strengths, weaknesses, and gaps you can exploit. I will help you identify your unique positioning opportunity.', category: 'content' },
  { id: 'instagram-bio', icon: UserCheck, title: 'Instagram Bio Optimizer', desc: 'Craft a high-converting Instagram bio with keywords and CTA', price: '$1.99', prompt: 'Write 3 versions of an optimized Instagram bio: a keyword-rich version for discoverability, a personality-forward version for engagement, and a business-focused version with a strong CTA. Max 150 characters each.', category: 'content' },
  { id: 'tiktok-profile', icon: UserCheck, title: 'TikTok Profile Optimizer', desc: 'Optimize your TikTok profile for maximum follows', price: '$1.99', prompt: 'Write an optimized TikTok profile including bio text (max 80 chars), username suggestions, profile link CTA, and pinned video strategy. Focus on first-impression hooks that convert viewers to followers.', category: 'content' },
  { id: 'youtube-channel-desc', icon: FileText, title: 'YouTube Channel Description', desc: 'Write a keyword-rich YouTube channel description', price: '$2.99', prompt: 'Write a compelling YouTube channel description with primary keywords in the first 100 characters, clear value proposition, upload schedule, what viewers will learn, and subscriber CTA. Optimize for YouTube search.', category: 'content' },
  { id: 'podcast-episode-desc', icon: FileText, title: 'Podcast Episode Description', desc: 'Write SEO-optimized podcast episode show notes', price: '$2.99', prompt: 'Write a podcast episode description with a hook opening, key topics covered, guest bio (if applicable), timestamps outline, key takeaways, and links section. Optimize for Apple Podcasts and Spotify search.', category: 'content' },
  { id: 'newsletter-subject', icon: MessageSquare, title: 'Newsletter Subject Line Generator', desc: 'Generate open-rate-boosting email subject lines', price: '$1.99', prompt: 'Generate 10 email subject line variations for the given newsletter topic: curiosity-gap, benefit-led, question, urgency, numbered list, personalized, and power word styles. Include predicted open rate rationale.', category: 'content' },
  { id: 'ab-test-copy', icon: FileText, title: 'A/B Test Copy Generator', desc: 'Create two distinct copy variations to split test', price: '$2.99', prompt: 'Create two distinct A/B test copy variations for the given asset (headline, CTA, email, ad). Version A should be direct and benefit-focused; Version B should be curiosity or emotion-driven. Explain the hypothesis for each.', category: 'content' },
  { id: 'landing-page-copy', icon: FileText, title: 'Landing Page Copy', desc: 'Write high-converting landing page copy end-to-end', price: '$4.99', prompt: 'Write complete landing page copy including: headline + subheadline, hero value proposition, 3 key benefits (with icons), social proof section, features breakdown, FAQ (5 questions), and a high-converting CTA section. Optimize for conversion.', category: 'content' },
  { id: 'testimonial-request', icon: MessageSquare, title: 'Testimonial Request Email', desc: 'Write emails that get glowing customer testimonials', price: '$1.99', prompt: 'Write 3 testimonial request email templates: a post-purchase follow-up, a long-term customer appreciation request, and a re-engagement message. Each should make it easy to respond with guiding prompts.', category: 'content' },
  { id: 'referral-program', icon: Sparkles, title: 'Referral Program Copy', desc: 'Write copy for a referral program that converts', price: '$2.99', prompt: 'Write a complete referral program copy kit: program name and tagline, hero headline, how-it-works section (3 steps), reward description, share message templates for email/social, and FAQ. Make the incentive feel irresistible.', category: 'content' },
];

const TONE_OPTIONS = ['Professional', 'Conversational', 'Playful', 'Bold', 'Inspirational'];

const DEFAULT_PROFILE = {
  companyName: '',
  industry: '',
  toneOfVoice: 'Professional',
  targetAudience: '',
  brandColors: '',
  tagline: '',
  website: '',
};

function loadProfile() {
  try {
    const raw = localStorage.getItem('philomni_biz_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem('philomni_biz_profile', JSON.stringify(profile));
}

function BusinessProfilePanel({ profile, onSave }) {
  const [editing, setEditing] = useState(!profile);
  const [form, setForm] = useState(profile || DEFAULT_PROFILE);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveProfile(form);
    onSave(form);
    setEditing(false);
  };

  const handleCancel = () => {
    if (profile) {
      setForm(profile);
      setEditing(false);
    }
  };

  if (!editing && profile) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{profile.companyName || 'Your Business'}</span>
            {profile.industry && (
              <Badge variant="secondary" className="text-xs">{profile.industry}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            {profile.toneOfVoice && <span>Tone: {profile.toneOfVoice}</span>}
            {profile.targetAudience && <span>Audience: {profile.targetAudience}</span>}
            {profile.tagline && <span className="italic">"{profile.tagline}"</span>}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="shrink-0 gap-1">
          <Edit2 className="w-3 h-3" />
          Edit
        </Button>
      </div>
    );
  }

  if (!editing && !profile) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-dashed border-border bg-accent/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Set up your Business Profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">Personalize all AI generations with your brand details</p>
        </div>
        <Button size="sm" onClick={() => setEditing(true)}>Set up</Button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Business Profile</h3>
        {profile && (
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name</label>
          <input
            value={form.companyName}
            onChange={e => handleChange('companyName', e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
          <input
            value={form.industry}
            onChange={e => handleChange('industry', e.target.value)}
            placeholder="E-commerce, SaaS, Fashion..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone of Voice</label>
          <select
            value={form.toneOfVoice}
            onChange={e => handleChange('toneOfVoice', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {TONE_OPTIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Audience</label>
          <input
            value={form.targetAudience}
            onChange={e => handleChange('targetAudience', e.target.value)}
            placeholder="Small business owners aged 25-45"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand Colors</label>
          <input
            value={form.brandColors}
            onChange={e => handleChange('brandColors', e.target.value)}
            placeholder="Navy blue, gold, white"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tagline</label>
          <input
            value={form.tagline}
            onChange={e => handleChange('tagline', e.target.value)}
            placeholder="Your brand's tagline"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
          <input
            value={form.website}
            onChange={e => handleChange('website', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="w-3 h-3" />
          Save Profile
        </Button>
        {profile && (
          <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
        )}
      </div>
    </div>
  );
}

function VideoGeneratorSection({ tool, onClose }) {
  const [videoPrompt, setVideoPrompt] = useState(tool.prompt);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', prompt: videoPrompt, duration: 10 }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setVideoUrl(data.video_url || data.url || data.videoUrl || null);
      if (!data.video_url && !data.url && !data.videoUrl) throw new Error('No video URL returned');
    } catch (err) {
      setError(err.message || 'Failed to generate video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 p-4 rounded-xl border border-primary/20 bg-accent/20 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{tool.title}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={videoPrompt}
        onChange={e => setVideoPrompt(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        placeholder="Describe your video..."
      />
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading || !videoPrompt.trim()}
        className="gap-2 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating video…
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            Generate Video
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {videoUrl && (
        <div className="space-y-2">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg border border-border"
          />
          <a
            href={videoUrl}
            download={`${tool.id}-video.mp4`}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}

export default function AITools() {
  let user = null;
  try {
    ({ user } = useOutletContext() || {});
  } catch {}

  const isPro = user?.plan === 'pro';
  const [activeTool, setActiveTool] = useState(null);
  const [activeTab, setActiveTab] = useState('tools');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [activeVideoTool, setActiveVideoTool] = useState(null);
  const [bizProfile, setBizProfile] = useState(() => loadProfile());

  const currentTool = TOOLS.find(t => t.id === activeTool);

  const filteredTools = selectedCategory === 'all'
    ? TOOLS
    : TOOLS.filter(t => t.category === selectedCategory);

  const buildToolPrompt = (tool) => {
    if (!bizProfile || !bizProfile.companyName) return tool.prompt;
    const ctx = `Business context: ${bizProfile.companyName}${bizProfile.industry ? ` (${bizProfile.industry})` : ''}. Tone: ${bizProfile.toneOfVoice}. Audience: ${bizProfile.targetAudience || 'general'}. Tagline: "${bizProfile.tagline || ''}".`;
    return `${ctx}\n\n${tool.prompt}`;
  };

  const handleToolClick = (tool) => {
    if (tool.isVideoTool) {
      setActiveVideoTool(activeVideoTool === tool.id ? null : tool.id);
      return;
    }
    setActiveTool(tool.id);
  };

  const CATEGORIES = [
    { id: 'all', label: 'All Tools' },
    { id: 'business', label: 'Business' },
    { id: 'creator', label: 'Creator & UGC' },
    { id: 'content', label: 'Content & Website' },
  ];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">AI Tools & Assets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Powered by AI to help you create, grow, and succeed
              {!isPro && <span className="text-primary ml-1">• Pay-per-use or upgrade to Pro for unlimited</span>}
            </p>
          </div>
        </div>

        <TabsList className="mb-6">
          <TabsTrigger value="tools" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="audio-library" className="gap-2">
            <Music className="w-4 h-4" />
            Audio Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:border-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {(selectedCategory === 'all' || selectedCategory === 'business') && (
            <BusinessProfilePanel
              profile={bizProfile}
              onSave={(p) => setBizProfile(p)}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <div key={tool.id} className="flex flex-col">
                <button
                  onClick={() => handleToolClick(tool)}
                  className={`text-left p-5 rounded-xl border transition-all group ${
                    activeVideoTool === tool.id
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tool.isVideoTool && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-0 text-xs">Video</Badge>
                      )}
                      {isPro ? (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs"><Crown className="w-3 h-3 mr-1" />Free with Pro</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{tool.price}</Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                </button>

                {tool.isVideoTool && activeVideoTool === tool.id && (
                  <VideoGeneratorSection
                    tool={tool}
                    onClose={() => setActiveVideoTool(null)}
                  />
                )}
              </div>
            ))}
          </div>

          {currentTool && !currentTool.isVideoTool && (
            <ToolModal
              isOpen={!!activeTool}
              onClose={() => setActiveTool(null)}
              tool={{ ...currentTool, prompt: buildToolPrompt(currentTool) }}
              isPro={isPro}
            />
          )}
        </TabsContent>

        <TabsContent value="audio-library">
          <AudioLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
