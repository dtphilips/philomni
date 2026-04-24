import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, Upload, Copy, Check, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

/** Extract text from whatever InvokeLLM returns */
function extractText(response) {
  if (!response) return '';
  if (typeof response === 'string') return response;
  if (typeof response === 'object') {
    return response.result ?? response.text ?? response.content ?? JSON.stringify(response, null, 2);
  }
  return String(response);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function ToolModal({ isOpen, onClose, tool, isPro }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');

  const [proFields, setProFields] = useState({
    businessName: '', industry: '', productDesc: '', logoUrl: '', productImageUrl: '',
    location: '', tone: 'professional', targetAudience: '', platforms: [], videoReference: '',
    ctaType: 'subscribe', brandVoice: '', contentStyle: '', investorType: '', fundingStage: '',
  });

  const llm = async (prompt) => {
    const r = await base44.integrations.Core.InvokeLLM({ prompt });
    return extractText(r);
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setProFields(prev => ({ ...prev, [fieldName]: res.file_url }));
    } catch { toast.error('Upload failed'); }
    setFileLoading(false);
  };

  const handleGeneratePro = async () => {
    setLoading(true);
    setResult('');
    setGeneratedImage('');
    try {
      const p = proFields;

      if (tool.id === 'image') {
        const promptText = await llm(`Create a detailed, cinematic prompt for a high-quality marketing image.
Business: ${p.businessName} | Industry: ${p.industry} | Product: ${p.productDesc}
Tone: ${p.tone}${p.location ? ` | Setting: ${p.location}` : ''}
${input ? `Notes: ${input}` : ''}
Return ONLY the image prompt (1–2 vivid sentences).`);
        const img = await base44.integrations.Core.GenerateImage({ prompt: promptText });
        setGeneratedImage(img.url);
        setResult('Image generated. Download below.');

      } else if (tool.id === 'caption') {
        const text = await llm(`Generate 3 social media captions for the following platforms: ${p.platforms.join(', ') || 'Instagram, TikTok, LinkedIn'}.
Brand voice: ${p.brandVoice || 'casual'}. Topic/product: ${input}.
For each platform, write a caption tailored to its style, length, and audience. Include relevant hashtags.
Format clearly with each platform on its own section.`);
        setResult(text);

      } else if (tool.id === 'script') {
        const text = await llm(`Write a compelling short-form video script with these specs:
Product/Topic: ${input}
Target Audience: ${p.targetAudience}
CTA: ${p.ctaType}${p.videoReference ? ` | Style: ${p.videoReference}` : ''}

Structure:
🎣 HOOK (0–3s): Attention-grabbing opener
📖 BODY (4–25s): Value proposition with 2–3 key points
🎯 CTA (last 3s): Clear call-to-action for "${p.ctaType}"

Keep it punchy, natural, and under 150 words total.`);
        setResult(text);

      } else if (tool.id === 'ugc-script') {
        const text = await llm(`Write a complete UGC (User Generated Content) product script with all 4 required sections:

Product: ${input}
Target Audience: ${p.targetAudience || 'general consumers'}

🎣 HOOK (2–3s): Relatable problem or surprising statement that stops the scroll
📱 DEMO (15–25s): Natural, authentic walkthrough of the product. Use real user language — NOT corporate speak. Show before/after.
💬 OBJECTION HANDLING (5–8s): Address the #1 thing holding someone back from buying
🏁 CTA (3–5s): Soft but clear call-to-action that feels genuine

Rules: Write as if a real person is speaking. No buzzwords. Sound authentic, slightly imperfect. Use "I" statements. Total under 60 seconds when read aloud.`);
        setResult(text);

      } else if (tool.id === 'pitch') {
        const text = await llm(`Create a structured investor pitch for the following:
Business Idea: ${input}
Investor Type: ${p.investorType || 'VC'}
Funding Stage: ${p.fundingStage || 'Seed'}

Include all standard pitch sections:
1. Problem (pain point)
2. Solution (your product)
3. Market Size (TAM/SAM/SOM)
4. Business Model (how you make money)
5. Traction (key metrics or milestones)
6. Team (why you'll win)
7. Ask (amount sought + use of funds)

Be specific, confident, and data-driven. Use bullet points within each section.`);
        setResult(text);

      } else if (tool.id === 'planner') {
        const text = await llm(`Create a 30-day social media content calendar.
Brand/Business: ${input}
Brand Voice: ${p.brandVoice || 'professional'}
Content Style: ${p.contentStyle || 'educational + entertaining'}

For each week, provide 5 post ideas (Mon–Fri). Each entry:
• Day & date slot
• Content type (Reel, Carousel, Story, Static, Live)
• Topic/hook
• Caption starter
• Hashtag theme

Make it varied, strategic, and genuinely actionable.`);
        setResult(text);

      } else if (tool.id === 'profile') {
        const text = await llm(`Analyse this creator/professional profile and give 8 specific, actionable recommendations to improve it:
Profile Info: ${input}
Role/Industry: ${p.industry || 'creator'}

For each recommendation:
✅ What to change
💡 Why it matters
📝 Example of the improved version

Focus on: bio, headline, keywords, content strategy, credibility signals, and discoverability.`);
        setResult(text);

      } else if (tool.id === 'trend-ideas') {
        const text = await llm(`Generate 8 viral content ideas for this creator:
Niche: ${p.brandVoice || input}
Platforms: ${p.platforms.join(', ') || 'TikTok, Instagram'}

For each idea:
📌 Title/Hook (the first line they'll see)
🎬 Format (Reel, Talking head, Duet, Tutorial, etc.)
📈 Why it's trending right now
⏱ Ideal length
🔑 Key angle that makes it shareable

Make each idea immediately filmable — no vague suggestions.`);
        setResult(text);

      } else if (tool.id === 'hashtag') {
        const text = await llm(`Generate a complete hashtag strategy for this post:
Topic: ${input}
Niche: ${p.brandVoice || 'general'}
Platforms: ${p.platforms.join(', ') || 'Instagram, TikTok'}

Provide 3 tiers:
🔥 5 Trending (high volume, competitive)
🎯 10 Niche (medium volume, highly relevant)
💎 5 Micro (low volume, highly engaged community)

For each hashtag, note the approx. post count and why to use it.
End with a ready-to-paste caption block of the top 20.`);
        setResult(text);

      } else if (tool.id === 'product-review') {
        const text = await llm(`Write an engaging product review script:
Product: ${input}
Audience: ${p.targetAudience || 'general consumers'}
Style: ${p.contentStyle || 'authentic, conversational'}

Structure:
🎬 Intro Hook (grab attention in 3s)
📦 Unboxing/First Impression
⚙️ Feature Breakdown (top 3 features)
✅ Pros & ❌ Cons (honest)
🏆 Who Is This For?
⭐ Final Verdict + Rating
📢 CTA

Sound like a real person who actually used the product.`);
        setResult(text);

      } else if (tool.id === 'thumbnail') {
        const text = await llm(`Generate thumbnail text and visual concept for this video:
Title/Topic: ${input}
Platform: ${p.platforms[0] || 'YouTube'}
Style: ${p.contentStyle || 'bold, high-contrast'}

Provide:
🖊 3 TEXT OVERLAY options (5 words max each — bold, punchy, curiosity-driven)
🎨 COLOR SCHEME: Primary + accent color hex codes
😮 FACIAL EXPRESSION suggestion (if creator appears in thumbnail)
📐 LAYOUT: What goes left/right, foreground/background
🔥 CTR SCORE (1–10) with reasoning for your top pick

Explain why each option works psychologically.`);
        setResult(text);

      } else if (tool.id === 'blog-writer') {
        const text = await llm(`Write a complete, SEO-optimized blog post:
Topic: ${input}
Audience: ${p.targetAudience || 'general readers'}
Length: ${p.contentStyle || 'Medium (1000–1500 words)'}
Tone: ${p.brandVoice || 'professional'}

Include:
- Compelling H1 title with primary keyword
- Meta description (155 chars)
- Introduction with hook
- 4–6 H2 sections with body paragraphs
- Bullet points or numbered lists where relevant
- Conclusion with takeaways
- 1 CTA at the end

Write the full article, not an outline.`);
        setResult(text);

      } else if (tool.id === 'content-calendar') {
        const text = await llm(`Create a 30-day social media content calendar:
Brand: ${p.businessName || input}
Brand Voice: ${p.brandVoice || 'professional'}
Platforms: ${p.platforms.join(', ') || 'Instagram, TikTok, LinkedIn'}
Content Focus: ${p.contentStyle || 'Education + Entertainment + Promotion'}

Format as a table:
Day | Platform | Content Type | Topic | Caption Hook | Hashtag Theme

Include a mix: 70% value content, 20% engagement, 10% promotional.
End with a weekly theme breakdown and posting time recommendations.`);
        setResult(text);

      } else if (tool.id === 'website-copy') {
        const text = await llm(`Write complete website copy for:
Business: ${p.businessName}
Industry: ${p.industry}
Unique Value: ${p.productDesc}
Audience: ${p.targetAudience}
Tone: ${p.tone}
${input ? `Additional context: ${input}` : ''}

Write all sections:
1. HERO: Headline + subheadline + CTA button text
2. PROBLEM: What pain they solve
3. SOLUTION: How the product/service solves it
4. FEATURES: 3 key features with benefits (not just specs)
5. SOCIAL PROOF: 2 testimonial templates
6. FAQ: 3 common objections answered
7. FINAL CTA: Closing statement + button text

Make every line conversion-focused.`);
        setResult(text);
      }
    } catch (err) {
      toast.error('Generation failed. Check your API key.');
      setResult(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleGenerateBasic = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const text = await llm(`${tool.prompt}\n\nUser input: ${input}`);
      setResult(text);
    } catch (err) {
      toast.error('Generation failed.');
      setResult(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const reset = () => {
    setInput(''); setResult(''); setGeneratedImage('');
    setProFields({ businessName: '', industry: '', productDesc: '', logoUrl: '', productImageUrl: '', location: '', tone: 'professional', targetAudience: '', platforms: [], videoReference: '', ctaType: 'subscribe', brandVoice: '', contentStyle: '', investorType: '', fundingStage: '' });
    onClose();
  };

  const PlatformPicker = ({ options = ['Instagram', 'TikTok', 'LinkedIn', 'Twitter', 'YouTube', 'Facebook'] }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(p => (
        <button key={p} onClick={() => setProFields(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }))}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${proFields.platforms.includes(p) ? 'bg-primary text-primary-foreground' : 'border border-border hover:border-primary'}`}>
          {p}
        </button>
      ))}
    </div>
  );

  const FileUploadBox = ({ fieldName, label }) => (
    <div className="border-2 border-dashed border-border rounded-lg p-3 text-center">
      {proFields[fieldName] ? (
        <div className="space-y-1">
          <img src={proFields[fieldName]} alt={label} className="w-14 h-14 mx-auto rounded object-cover" />
          <button onClick={() => setProFields(prev => ({ ...prev, [fieldName]: '' }))} className="text-xs text-destructive hover:underline">Remove</button>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, fieldName)} disabled={fileLoading} />
        </label>
      )}
    </div>
  );

  const renderProFields = () => {
    switch (tool.id) {
      case 'image':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Business Name *</Label><Input value={proFields.businessName} onChange={e => setProFields(p => ({ ...p, businessName: e.target.value }))} placeholder="TechFlow Inc" /></div>
              <div><Label className="text-xs mb-1 block">Industry *</Label><Input value={proFields.industry} onChange={e => setProFields(p => ({ ...p, industry: e.target.value }))} placeholder="SaaS, E-commerce…" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Product/Service *</Label><Textarea value={proFields.productDesc} onChange={e => setProFields(p => ({ ...p, productDesc: e.target.value }))} placeholder="Describe what you offer…" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Logo (optional)</Label><FileUploadBox fieldName="logoUrl" label="Upload logo" /></div>
              <div><Label className="text-xs mb-1 block">Product Image (optional)</Label><FileUploadBox fieldName="productImageUrl" label="Upload image" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Setting/Location</Label><Input value={proFields.location} onChange={e => setProFields(p => ({ ...p, location: e.target.value }))} placeholder="Modern studio, outdoor…" /></div>
              <div><Label className="text-xs mb-1 block">Visual Tone</Label>
                <select value={proFields.tone} onChange={e => setProFields(p => ({ ...p, tone: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                  <option value="professional">Professional</option><option value="modern">Modern/Tech</option><option value="creative">Creative</option><option value="minimalist">Minimalist</option><option value="vibrant">Vibrant</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'caption':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Platforms</Label><PlatformPicker /></div>
            <div><Label className="text-xs mb-1 block">Brand Voice</Label>
              <select value={proFields.brandVoice} onChange={e => setProFields(p => ({ ...p, brandVoice: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">Select…</option><option value="professional">Professional</option><option value="casual">Casual & Fun</option><option value="inspirational">Inspirational</option><option value="educational">Educational</option><option value="bold">Bold & Direct</option>
              </select>
            </div>
          </div>
        );

      case 'script':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Target Audience</Label><Input value={proFields.targetAudience} onChange={e => setProFields(p => ({ ...p, targetAudience: e.target.value }))} placeholder="Gen Z, small business owners…" /></div>
            <div><Label className="text-xs mb-1 block">Call-to-Action</Label>
              <select value={proFields.ctaType} onChange={e => setProFields(p => ({ ...p, ctaType: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="subscribe">Subscribe / Follow</option><option value="shop">Shop Now</option><option value="learn">Learn More</option><option value="download">Download</option><option value="signup">Sign Up Free</option><option value="dm">DM Me</option>
              </select>
            </div>
            <div><Label className="text-xs mb-1 block">Style Reference</Label><Input value={proFields.videoReference} onChange={e => setProFields(p => ({ ...p, videoReference: e.target.value }))} placeholder="TikTok talking head, YouTube tutorial…" /></div>
          </div>
        );

      case 'ugc-script':
      case 'product-review':
        return (
          <div><Label className="text-xs mb-1 block">Target Audience</Label><Input value={proFields.targetAudience} onChange={e => setProFields(p => ({ ...p, targetAudience: e.target.value }))} placeholder="Gen Z, parents, tech enthusiasts…" /></div>
        );

      case 'trend-ideas':
      case 'hashtag':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Your Niche</Label><Input value={proFields.brandVoice} onChange={e => setProFields(p => ({ ...p, brandVoice: e.target.value }))} placeholder="Fashion, fitness, finance…" /></div>
            <div><Label className="text-xs mb-1 block">Platforms</Label><PlatformPicker options={['TikTok', 'Instagram', 'YouTube', 'Reels', 'Shorts', 'LinkedIn']} /></div>
          </div>
        );

      case 'thumbnail':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Platform</Label><PlatformPicker options={['YouTube', 'TikTok', 'Shorts']} /></div>
            <div><Label className="text-xs mb-1 block">Visual Style</Label><Input value={proFields.contentStyle} onChange={e => setProFields(p => ({ ...p, contentStyle: e.target.value }))} placeholder="Dramatic, minimalist, bold colours…" /></div>
          </div>
        );

      case 'blog-writer':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Target Audience</Label><Input value={proFields.targetAudience} onChange={e => setProFields(p => ({ ...p, targetAudience: e.target.value }))} placeholder="Small business owners, developers…" /></div>
            <div><Label className="text-xs mb-1 block">Post Length</Label>
              <select value={proFields.contentStyle} onChange={e => setProFields(p => ({ ...p, contentStyle: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">Select…</option><option value="Short (500–800 words)">Short (500–800 words)</option><option value="Medium (1000–1500 words)">Medium (1000–1500 words)</option><option value="Long (2000+ words)">Long (2000+ words)</option>
              </select>
            </div>
            <div><Label className="text-xs mb-1 block">Tone</Label>
              <select value={proFields.brandVoice} onChange={e => setProFields(p => ({ ...p, brandVoice: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">Select…</option><option value="Professional">Professional</option><option value="Casual">Casual & Friendly</option><option value="Educational">Educational</option><option value="Inspirational">Inspirational</option>
              </select>
            </div>
          </div>
        );

      case 'content-calendar':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Brand Name</Label><Input value={proFields.businessName} onChange={e => setProFields(p => ({ ...p, businessName: e.target.value }))} placeholder="Your brand…" /></div>
              <div><Label className="text-xs mb-1 block">Brand Voice</Label><Input value={proFields.brandVoice} onChange={e => setProFields(p => ({ ...p, brandVoice: e.target.value }))} placeholder="Fun & quirky, professional…" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Platforms</Label><PlatformPicker /></div>
            <div><Label className="text-xs mb-1 block">Content Focus</Label><Input value={proFields.contentStyle} onChange={e => setProFields(p => ({ ...p, contentStyle: e.target.value }))} placeholder="Education, entertainment, sales…" /></div>
          </div>
        );

      case 'website-copy':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Business Name</Label><Input value={proFields.businessName} onChange={e => setProFields(p => ({ ...p, businessName: e.target.value }))} placeholder="Your company" /></div>
              <div><Label className="text-xs mb-1 block">Industry</Label><Input value={proFields.industry} onChange={e => setProFields(p => ({ ...p, industry: e.target.value }))} placeholder="SaaS, retail…" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Unique Value Proposition</Label><Textarea value={proFields.productDesc} onChange={e => setProFields(p => ({ ...p, productDesc: e.target.value }))} placeholder="What makes you different?" rows={2} /></div>
            <div><Label className="text-xs mb-1 block">Target Audience</Label><Input value={proFields.targetAudience} onChange={e => setProFields(p => ({ ...p, targetAudience: e.target.value }))} placeholder="Who are you selling to?" /></div>
            <div><Label className="text-xs mb-1 block">Tone</Label>
              <select value={proFields.tone} onChange={e => setProFields(p => ({ ...p, tone: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="professional">Professional</option><option value="friendly">Friendly & Approachable</option><option value="bold">Bold & Adventurous</option><option value="luxury">Luxury & Premium</option>
              </select>
            </div>
          </div>
        );

      case 'pitch':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Investor Type</Label>
              <select value={proFields.investorType} onChange={e => setProFields(p => ({ ...p, investorType: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">Select…</option><option value="VC">Venture Capital</option><option value="angel">Angel Investor</option><option value="corporate">Corporate</option><option value="bank">Bank / SBA</option>
              </select>
            </div>
            <div><Label className="text-xs mb-1 block">Funding Stage</Label>
              <select value={proFields.fundingStage} onChange={e => setProFields(p => ({ ...p, fundingStage: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">Select…</option><option value="Pre-seed">Pre-seed</option><option value="Seed">Seed</option><option value="Series A">Series A</option><option value="Series B">Series B</option><option value="Growth">Growth Stage</option>
              </select>
            </div>
          </div>
        );

      case 'planner':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Brand Voice</Label><Input value={proFields.brandVoice} onChange={e => setProFields(p => ({ ...p, brandVoice: e.target.value }))} placeholder="Professional, fun & quirky…" /></div>
            <div><Label className="text-xs mb-1 block">Content Style</Label><Input value={proFields.contentStyle} onChange={e => setProFields(p => ({ ...p, contentStyle: e.target.value }))} placeholder="Educational, entertainment, promotional…" /></div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Your Industry / Niche</Label><Input value={proFields.industry} onChange={e => setProFields(p => ({ ...p, industry: e.target.value }))} placeholder="Fashion creator, SaaS founder, freelance designer…" /></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={reset}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {tool?.title}
            {isPro && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Pro</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {isPro ? (
            <>
              {renderProFields()}
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">
                  {tool.id === 'image' ? 'Additional creative notes (optional)' : tool.id === 'profile' ? 'Paste your current bio / profile text *' : 'Describe what you need in detail *'}
                </Label>
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={tool.id === 'profile' ? 'Paste your bio, headline, or describe your profile…' : 'Add extra context, specific details, or examples…'}
                  rows={tool.id === 'profile' ? 4 : 3}
                />
              </div>
              <Button onClick={handleGeneratePro} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating…' : `Generate ${tool.id === 'image' ? 'Image' : 'Content'}`}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{tool?.desc}</p>
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe what you need in as much detail as possible…"
                rows={5}
              />
              <Button onClick={handleGenerateBasic} disabled={loading || !input.trim()} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            </>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Generated Image</p>
              <img src={generatedImage} alt="Generated" className="w-full rounded-xl shadow-md" />
              <a href={generatedImage} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <Download className="w-4 h-4" /> Download Image
                </Button>
              </a>
            </div>
          )}

          {/* Text Result */}
          {result && result !== 'Image generated. Download below.' && (
            <div className="bg-muted/50 rounded-xl border border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</span>
                <CopyButton text={result} />
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
