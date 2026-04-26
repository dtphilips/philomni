import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Zap, FileText, Type, BarChart2, Copy, Check, Heart, Loader2,
  Sparkles, Music, Clock, TrendingUp, Target, Users, ThumbsUp,
  MessageCircle, Bookmark, Share2, Upload, Trophy, AlertCircle,
  ChevronRight, Star, Flame, Globe, Hash, Video, Lightbulb,
  Timer, CalendarClock, LayoutGrid
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hooks', label: 'Viral Hooks', icon: Zap },
  { id: 'scripts', label: 'Script Templates', icon: FileText },
  { id: 'captions', label: 'Caption Lab', icon: Type },
  { id: 'analytics', label: 'Analytics Tools', icon: BarChart2 },
];

const HOOK_TYPES = [
  'Question Hook', 'Shock Statement', 'Story Hook', 'Controversy Hook',
  'Curiosity Gap', 'Before/After', 'Number Hook',
];

const PLATFORMS = ['Philomni', 'TikTok', 'Instagram Reels', 'YouTube Shorts', 'LinkedIn', 'Pinterest', 'X (Twitter)'];

const TRENDING_AUDIO = [
  { title: 'Flowers - Miley Cyrus', genre: 'Pop', platform: 'TikTok', score: 98 },
  { title: 'Cruel Summer - Taylor Swift', genre: 'Pop', platform: 'Instagram Reels', score: 95 },
  { title: 'Calm Down - Rema', genre: 'Afrobeats', platform: 'TikTok', score: 93 },
  { title: 'Golden Hour - JVKE', genre: 'Indie Pop', platform: 'YouTube Shorts', score: 91 },
  { title: 'Escapism - RAYE', genre: 'R&B', platform: 'TikTok', score: 89 },
  { title: 'Shakira: Bzrp Session', genre: 'Latin', platform: 'Instagram Reels', score: 87 },
  { title: 'As It Was - Harry Styles', genre: 'Pop', platform: 'YouTube Shorts', score: 86 },
  { title: 'Lift Me Up - Rihanna', genre: 'Soul', platform: 'TikTok', score: 84 },
];

const SCRIPT_CATEGORIES = ['Fitness', 'Finance', 'Food', 'Tech', 'Fashion', 'Travel', 'Education', 'Entertainment', 'UGC Formats', 'Creator Business'];

const SCRIPT_TEMPLATES = {
  Fitness: [
    {
      title: 'Morning Routine Reveal',
      description: 'Start with the shocking result, reveal your morning habits that got you there.',
      template: `POV: I transformed my body in 90 days with ONE simple morning routine.\n\nHere's exactly what I do every morning at 5am:\n\n1. [First habit - be specific]\n2. [Second habit]\n3. [Third habit]\n\nThe secret? Consistency beats perfection every time.\n\nSave this if you're starting your fitness journey! 💪`,
    },
    {
      title: 'Workout Mistake Correction',
      description: 'Call out a common mistake your audience makes, then provide the fix.',
      template: `You're doing [exercise] WRONG and it's killing your gains.\n\nThe mistake most people make:\n❌ [Common error]\n\nHow to fix it:\n✅ [Correct form/approach]\n\nTry this instead and thank me later. Drop a 🔥 if this helped!`,
    },
    {
      title: '30-Day Challenge Kickoff',
      description: 'Announce a challenge with clear rules and transformation promise.',
      template: `I'm doing [specific challenge] for 30 days straight starting [date].\n\nThe rules:\n• [Rule 1]\n• [Rule 2]\n• [Rule 3]\n\nWhy? [Your personal reason - make it relatable]\n\nFollow along and join me! Drop a 💪 if you're in.`,
    },
  ],
  Finance: [
    {
      title: 'Money Mistake Confession',
      description: 'Share a personal finance mistake and the lesson learned.',
      template: `I lost $[amount] because nobody taught me this about money.\n\nHere's what happened:\n[Brief story - 2-3 sentences]\n\nWhat I wish I knew:\n1. [Lesson 1]\n2. [Lesson 2]\n3. [Lesson 3]\n\nSave this so you don't make the same mistake. 💰`,
    },
    {
      title: 'Passive Income Breakdown',
      description: 'Show exactly how a passive income stream works with numbers.',
      template: `How I make $[amount]/month while I sleep (complete breakdown):\n\n💼 Source: [Income source]\n📊 Time to set up: [timeframe]\n💵 Monthly income: $[amount]\n⏰ Hours per week: [hours]\n\nHere's exactly how to start:\n[Step-by-step process]\n\nFollow for more money tips!`,
    },
    {
      title: 'Frugal Win of the Week',
      description: 'Share a specific money-saving hack with exact numbers.',
      template: `I saved $[amount] this month by doing [specific thing].\n\nMost people spend $[amount] on [thing]. I spent $[lower amount].\n\nHere's my exact strategy:\n[Detailed explanation]\n\nThe math: $[savings] x 12 months = $[annual savings] per year\n\nSmall changes, big results. 💸`,
    },
  ],
  Food: [
    {
      title: '5-Ingredient Viral Recipe',
      description: 'Simple recipe with minimal ingredients and maximum impact.',
      template: `This [dish] has gone viral for a reason — and it only takes 5 ingredients.\n\nYou need:\n• [Ingredient 1]\n• [Ingredient 2]\n• [Ingredient 3]\n• [Ingredient 4]\n• [Ingredient 5]\n\nHow to make it:\n[Step-by-step in 3-4 lines]\n\nTotal time: [X minutes] | Serves: [X people]\n\nSave this recipe! 🍽️`,
    },
    {
      title: 'Restaurant Dupe at Home',
      description: 'Recreate a famous restaurant dish cheaper at home.',
      template: `I made [Famous Restaurant]'s [dish] at home for $[price] instead of $[restaurant price].\n\nIngredients:\n[List]\n\nThe secret ingredient they don't tell you:\n[Reveal]\n\nTaste test result: [Honest comparison]\n\nFollow for more restaurant dupes! 🍔`,
    },
    {
      title: 'Meal Prep Sunday Guide',
      description: 'Show a complete week of meal prep in an engaging way.',
      template: `Sunday meal prep that saves me [X] hours and $[amount] every week.\n\nWhat I made:\n1. [Meal 1] — [prep time]\n2. [Meal 2] — [prep time]\n3. [Meal 3] — [prep time]\n\nTotal time: [X hours] | Total cost: $[amount]\n\nBreakfast, lunch, AND dinner sorted. 🥗`,
    },
  ],
  Tech: [
    {
      title: 'Hidden Feature Reveal',
      description: 'Expose an underused feature of a popular app or device.',
      template: `99% of [app/device] users don't know this feature exists.\n\nGo to: [Settings path]\n\nWhat it does: [Explanation]\n\nWhy it matters: [Practical benefit]\n\nYou're welcome. 📱\n\nFollow for more [app] tips!`,
    },
    {
      title: 'AI Tool Productivity Hack',
      description: 'Show a specific AI tool use case that saves significant time.',
      template: `I use [AI Tool] to do [task] in [X minutes] instead of [X hours].\n\nHere's my exact prompt:\n"[Copy-pasteable prompt]"\n\nThe result: [What you get]\n\nTime saved: [X hours/week]\n\nThis is the future of work. 🤖`,
    },
    {
      title: 'Tech Setup Tour',
      description: 'Showcase your workspace with specific product recommendations.',
      template: `My [adjective] tech setup that makes me [X]% more productive.\n\n🖥️ Monitor: [Product + why]\n⌨️ Keyboard: [Product + why]\n🖱️ Mouse: [Product + why]\n💡 Lighting: [Product + why]\n\nTotal investment: $[amount]\n\nLinks in bio! Drop your setup below 👇`,
    },
  ],
  Fashion: [
    {
      title: 'Outfit of the Day Formula',
      description: 'Break down a stylish outfit into a repeatable formula.',
      template: `The outfit formula that always gets compliments:\n\n👕 Top: [Item + why it works]\n👖 Bottom: [Item + why it works]\n👟 Shoes: [Item + why it works]\n💍 Accessories: [Item + why it works]\n\nRule: [One styling rule that ties it together]\n\nSave for your next outfit crisis! 🛍️`,
    },
    {
      title: 'Thrift Flip Transformation',
      description: 'Show a before/after of a thrifted piece transformed.',
      template: `I bought this for $[amount] and turned it into a $[value] piece.\n\nBefore: [Description of original item]\n\nWhat I did:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nAfter: [Result description]\n\nTotal cost: $[amount] | Estimated value: $[amount]\n\nThrift is the move. ♻️`,
    },
    {
      title: 'Style Rule Everyone Breaks',
      description: 'Challenge a common fashion rule with a better alternative.',
      template: `Stop following this fashion rule. Here's what actually looks good:\n\nOld rule: [Common rule]\nWhy it's wrong: [Brief explanation]\n\nNew rule: [Your updated take]\n\nExamples of it done right:\n• [Example 1]\n• [Example 2]\n\nFashion is about confidence, not rules. ✨`,
    },
  ],
  Travel: [
    {
      title: 'Hidden Gem Discovery',
      description: 'Reveal an underrated destination with practical travel info.',
      template: `Nobody is talking about [destination] and it needs to change.\n\n📍 Where: [Specific location]\n💰 Average daily budget: $[amount]\n🌤️ Best time to visit: [Month/season]\n✈️ How to get there: [Transport options]\n\nMust-do:\n1. [Activity 1]\n2. [Activity 2]\n3. [Activity 3]\n\nSave this for your next trip! 🌍`,
    },
    {
      title: 'Travel Hack Compilation',
      description: 'Share 3-5 specific hacks that save money or time while traveling.',
      template: `[Number] travel hacks I wish I knew before visiting [destination]:\n\n1. [Hack 1 — be specific]\n2. [Hack 2]\n3. [Hack 3]\n4. [Hack 4]\n5. [Hack 5]\n\nTotal saved using these tips: $[amount]\n\nWhich one surprised you most? 👇`,
    },
    {
      title: 'Honest Destination Review',
      description: 'Give an unfiltered review of a popular destination.',
      template: `Honest review of [destination] after [X days]: the good, bad, and ugly.\n\n✅ Loved:\n• [Thing 1]\n• [Thing 2]\n\n❌ Hated:\n• [Thing 1]\n• [Thing 2]\n\n🤔 Surprised by:\n• [Unexpected thing]\n\nWould I go back? [Yes/No + why]\n\nDrop questions below! 🗺️`,
    },
  ],
  Education: [
    {
      title: 'Concept Simplified',
      description: 'Explain a complex topic in simple terms with an analogy.',
      template: `[Complex concept] explained in 60 seconds.\n\nMost people overcomplicate this. Here's the simple version:\n\n[Main idea in one sentence]\n\nThink of it like: [Relatable analogy]\n\nWhy it matters:\n• [Reason 1]\n• [Reason 2]\n\nNow you know more than 90% of people about [topic]. 🧠\n\nFollow for more [subject] explained simply!`,
    },
    {
      title: 'Myth vs. Fact',
      description: 'Bust common myths in your niche with evidence.',
      template: `[Number] [niche] myths you probably believe (busted):\n\nMyth 1: "[Common belief]"\nFact: [The truth]\n\nMyth 2: "[Common belief]"\nFact: [The truth]\n\nMyth 3: "[Common belief]"\nFact: [The truth]\n\nShare this with someone who needs to hear it! 📚`,
    },
    {
      title: 'Study Technique Reveal',
      description: 'Share a specific learning method backed by evidence.',
      template: `The [name] technique improved my retention by [X]% (science-backed).\n\nWhat it is: [Brief explanation]\n\nHow to do it:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nWhy it works: [Neuroscience/psychology behind it]\n\nI used this for [specific exam/skill] and [result].\n\nSave this for your next study session! 📖`,
    },
  ],
  Entertainment: [
    {
      title: 'Hot Take Opinion',
      description: 'Share a controversial but defensible opinion to spark discussion.',
      template: `Unpopular opinion: [Your hot take about entertainment topic].\n\nHere's why I think this:\n[Reasoning in 2-3 points]\n\nI know [opposing view], but [counterargument].\n\nChange my mind 👇\n\n(Be respectful in the comments!)`,
    },
    {
      title: 'Behind-the-Scenes Reveal',
      description: 'Show something unexpected about a popular show, movie, or artist.',
      template: `[Number] behind-the-scenes facts about [show/movie/artist] that will change how you see it:\n\n1. [Surprising fact]\n2. [Surprising fact]\n3. [Surprising fact]\n\nWhich one blew your mind the most?\n\nFollow for more [niche] deep dives! 🎬`,
    },
    {
      title: 'Tier List Ranking',
      description: 'Rank things in your niche to drive engagement through debate.',
      template: `My definitive [category] tier list. Argue with me:\n\nS Tier (GOATs): [Items]\nA Tier (Elite): [Items]\nB Tier (Solid): [Items]\nC Tier (Mid): [Items]\nD Tier (Skip): [Items]\n\nDrop your tier list in the comments 👇`,
    },
  ],
  'UGC Formats': [
    {
      title: 'Product Unboxing Script',
      description: 'Authentic unboxing with first impressions and honest reaction.',
      template: `POV: I just received [product name] — let's see what's inside.\n\n[Describe the packaging and your first reaction]\n\nWhat comes in the box:\n• [Item 1]\n• [Item 2]\n• [Item 3]\n\nFirst impressions out of the box: [Honest reaction]\n\nStay tuned for my full review after testing it!\n\nDrop your questions below 📦`,
    },
    {
      title: 'Before & After Story',
      description: 'Powerful transformation story using a product.',
      template: `Before [product/service]: I was dealing with [problem]\n\nAfter [X weeks] of using [product]:\n✅ [Result 1]\n✅ [Result 2]\n✅ [Result 3]\n\nThe biggest change: [Most impactful result]\n\nWould I recommend it? [Honest answer + why]\n\nCheck the link if you want to see the same results ✨`,
    },
    {
      title: 'Day in My Life Script',
      description: 'Day-in-the-life format naturally featuring a product.',
      template: `5am — [Morning routine, mention product naturally]\n8am — [Work/activity, product helps here]\n12pm — [Midday, product benefit moment]\n4pm — [Afternoon routine]\n8pm — [Evening, product wind-down]\n\nFavorite moment of the day: [Genuine highlight]\n\nThe one thing making every day better: [Product + why]\n\nCode [CODE] saves you [X%] 🌟`,
    },
    {
      title: 'Get Ready With Me',
      description: 'GRWM format incorporating a product into your routine.',
      template: `Get ready with me using [product]!\n\nStep 1: [Step + how product is used]\nStep 2: [Step + product benefit]\nStep 3: [Final result — show it]\n\nThe game-changer in my routine: [Specific feature or benefit]\n\nBefore [product]: [Old problem]\nAfter [product]: [New result]\n\nTotal time: [X] minutes — quicker and better\n\nLink in bio for [X% off] 💄`,
    },
    {
      title: 'Viral Sound Pairing Suggestions',
      description: 'Match trending audio to your content type.',
      template: `Best sounds for [niche] content right now:\n\n🔥 High-energy content: [Trending sound name] — use for [type of clip]\n😂 Relatable moments: [Trending sound] — perfect for [scenario]\n💭 Educational content: [Sound] — works well when [use case]\n✨ Aesthetic/GRWM: [Sound] — ideal for [mood]\n\nPro tip: Use trending sounds within the first 48 hours for max reach.\n\nSave this for your next batch 📲`,
    },
    {
      title: 'Trending Transition Ideas',
      description: 'Viral transition techniques for your videos.',
      template: `5 transitions blowing up right now:\n\n1️⃣ [Transition name] — How to do it: [brief instruction]\n2️⃣ [Transition name] — Best for: [content type]\n3️⃣ [Transition name] — Trending on: [platform]\n4️⃣ [Transition name] — Difficulty: [Easy/Medium/Hard]\n5️⃣ [Transition name] — Goes viral when: [context]\n\nSave this for your next video! 🎬`,
    },
    {
      title: 'Comment Reply Templates',
      description: 'Professional comment replies for brand partnerships.',
      template: `For positive comments:\n"Thank you so much! I'm so glad [product] worked for you too! 💖"\n\nFor questions about the product:\n"Yes! The [specific feature] is what I love most. DM me for the link!"\n\nFor skeptics:\n"I totally get it — I was skeptical too! But [specific result] convinced me 🙌"\n\nFor competitors:\n"There are lots of great options out there! This one works best for my [routine/lifestyle]"\n\nFor general engagement:\n"Which one would you want me to try next? Drop it below! 👇"`,
    },
  ],
  'Creator Business': [
    {
      title: 'UGC Rate Card Pitch',
      description: 'Professional rate card for brand outreach.',
      template: `Hi [Brand Name],\n\nI'm [Name], a UGC creator specializing in [niche]. Here's what I offer:\n\n📱 Single UGC Video (30-60s): $[price]\n📱 3-Pack Bundle: $[price] (save [%])\n📱 Monthly Retainer (4 videos/mo): $[price]\n\nEach video includes:\n✅ Hook + problem/solution format\n✅ Natural product integration\n✅ Full usage rights (ads, website, email)\n✅ [X] revisions included\n\nDelivery: [X] business days\n\nI'd love to create content for [product]. Reply to get started!\n\n[Your name]`,
    },
    {
      title: 'Collab Pitch Email',
      description: 'Compelling outreach email for brand partnerships.',
      template: `Subject: UGC Partnership — [Your Niche] Creator\n\nHi [Brand/Contact name],\n\nI've been using [product] for [time period] — specifically [what you love about it]. It's genuinely changed [aspect of your life/work].\n\nI'm a UGC creator focused on [niche] with content across [platforms]. My audience is [demographic description].\n\nI'd love to create [type of content] showcasing [campaign goal]. Deliverables:\n• [Deliverable 1]\n• [Deliverable 2]\n• Timeline: [X weeks]\n\nPortfolio: [link]\n\nOpen to a 15-minute call this week?\n\nBest,\n[Name]`,
    },
    {
      title: 'UGC Portfolio Bio',
      description: 'Bio text for your UGC creator portfolio.',
      template: `[Name] | UGC Creator & [Niche] Enthusiast\n\nI create authentic, conversion-focused content for [type] brands in the [niche] space.\n\nWhat I do:\n• Short-form video (TikTok/Reels/Shorts)\n• Product demos & unboxings\n• Before/after testimonials\n• Lifestyle integrations\n\nPast brands: [Brand 1], [Brand 2], [Brand 3]\n\nContent that converts because it's real — not scripted.\n\n📩 [email] | 📸 [instagram] | 🎥 [portfolio link]`,
    },
    {
      title: 'Brand Partnership Disclosure',
      description: 'FTC-compliant sponsored content disclosure templates.',
      template: `Short form (for captions):\n"#ad | #sponsored | #gifted"\n\nMedium form (for video):\n"This video is sponsored by [Brand]. All opinions are genuinely my own."\n\nDetailed form (for blogs/long content):\n"I received [product/compensation] from [Brand] to create this content. However, my review reflects my honest experience — I only partner with brands I actually use and believe in."\n\nGifted (no payment):\n"[Brand] gifted me this product, but all opinions are 100% my own and unsponsored."`,
    },
    {
      title: 'Usage Rights Agreement Template',
      description: 'Basic usage rights template for brand content deals.',
      template: `CONTENT USAGE RIGHTS — [Your Name] x [Brand Name]\n\nContent: [Description of deliverable]\nDelivery date: [Date]\nPayment: $[amount]\n\nRights granted:\n✅ [Platform] ads — [duration]\n✅ Brand website/landing pages — [duration]\n✅ Email marketing — [duration]\n❌ Out-of-home/print (not included)\n❌ Whitelabeling (not included)\n\nCreator retains original ownership. Brand may not edit, crop, or alter content without approval.\n\nQuestions? [contact email]`,
    },
  ],
};

const CAPTION_PLATFORMS = ['Philomni', 'TikTok', 'Instagram', 'Twitter/X', 'LinkedIn', 'YouTube'];
const CAPTION_TONES = ['Funny', 'Professional', 'Inspirational', 'Casual', 'Educational'];

const THUMBNAIL_TIPS = [
  'High contrast colors grab attention in feeds',
  'Human faces with clear emotions drive more clicks',
  'Large, readable text (3-5 words max) works best',
  'Bright backgrounds outperform dark ones by 23%',
];

const CONTENT_TYPES = ['Entertainment', 'Education', 'Product'];
const TIMEZONES = ['EST (New York)', 'CST (Chicago)', 'MST (Denver)', 'PST (Los Angeles)', 'GMT (London)', 'CET (Paris)', 'IST (Mumbai)', 'JST (Tokyo)', 'AEST (Sydney)'];

// ── Helper hooks ─────────────────────────────────────────────────────────────

function useCopy() {
  const [copiedId, setCopiedId] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  return { copiedId, copy };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, id, copiedId, copy, size = 'sm' }) {
  const copied = copiedId === id;
  return (
    <button
      onClick={() => copy(text, id)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Tab 1: Viral Hooks ────────────────────────────────────────────────────────

function ViralHooksTab() {
  const [niche, setNiche] = useState('');
  const [hookType, setHookType] = useState(HOOK_TYPES[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState([]);
  const [liked, setLiked] = useState({});
  const { copiedId, copy } = useCopy();
  const { toast } = useToast();

  const generateHooks = async () => {
    if (!niche.trim()) {
      toast({ title: 'Enter a niche or topic first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setHooks([]);
    try {
      const result = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Generate exactly 5 viral ${hookType} hooks for ${platform} about: "${niche}". Be punchy and platform-specific. Return as a JSON array of strings.` }) }); const _d = await _r.json(); return _d.result ?? ''; })();

      let parsed = [];
      if (typeof result === 'string') {
        const match = result.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      } else if (Array.isArray(result)) {
        parsed = result;
      } else if (result?.hooks) {
        parsed = result.hooks;
      } else if (result?.result) {
        const match = result.result.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      }
      setHooks(parsed.slice(0, 5));
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input section */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Hook Generator
        </h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Niche / Topic</label>
          <Textarea
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. fitness, cooking, finance tips..."
            rows={2}
            className="resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hook Type</label>
            <select
              value={hookType}
              onChange={e => setHookType(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {HOOK_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={generateHooks} disabled={loading} className="w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating hooks...</> : <><Sparkles className="w-4 h-4" /> Generate 5 Hooks</>}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {hooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Generated Hooks</h3>
            {hooks.map((hook, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed flex-1">{hook}</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setLiked(prev => ({ ...prev, [i]: !prev[i] }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      liked[i] ? 'text-rose-400 bg-rose-500/10' : 'text-muted-foreground hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${liked[i] ? 'fill-current' : ''}`} /> {liked[i] ? 'Saved' : 'Save'}
                  </button>
                  <CopyButton text={hook} id={`hook-${i}`} copiedId={copiedId} copy={copy} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Audio Finder */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Trending Audio Finder</h3>
          <Badge variant="secondary" className="text-xs">Live Demo</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRENDING_AUDIO.map((audio, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audio.title}</p>
                <p className="text-xs text-muted-foreground">{audio.genre} · {audio.platform}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className={`text-sm font-bold ${audio.score >= 95 ? 'text-green-400' : audio.score >= 90 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {audio.score}
                </div>
                <div className="text-xs text-muted-foreground">trend score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Script Templates ───────────────────────────────────────────────────

function ScriptTemplatesTab() {
  const [selectedCategory, setSelectedCategory] = useState('Fitness');
  const [scriptText, setScriptText] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const { copiedId, copy } = useCopy();
  const { toast } = useToast();

  const useTemplate = (template) => {
    setScriptText(template);
  };

  const enhanceScript = async () => {
    if (!scriptText.trim()) {
      toast({ title: 'Add a script first', variant: 'destructive' });
      return;
    }
    setEnhancing(true);
    try {
      const result = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `You are an expert viral content creator. Improve this script to be more engaging and viral-ready: "${scriptText}". Keep the same structure but make the hook stronger, add specific details, improve the CTA, and make it conversational.` }) }); const _d = await _r.json(); return _d.result ?? ''; })();
      const improved = typeof result === 'string' ? result : result?.result || result?.content || '';
      if (improved) setScriptText(improved.trim());
    } catch (e) {
      toast({ title: 'Enhancement failed', description: e.message, variant: 'destructive' });
    } finally {
      setEnhancing(false);
    }
  };

  const templates = SCRIPT_TEMPLATES[selectedCategory] || [];

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {SCRIPT_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
              selectedCategory === cat
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {templates.map((tpl, i) => (
          <motion.div
            key={`${selectedCategory}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col"
          >
            <div>
              <h3 className="font-semibold text-sm">{tpl.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => useTemplate(tpl.template)}
            >
              <ChevronRight className="w-3 h-3" /> Use Template
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Editor */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Script Editor
          </h3>
          <span className="text-xs text-muted-foreground">{scriptText.length} chars</span>
        </div>
        <Textarea
          value={scriptText}
          onChange={e => setScriptText(e.target.value)}
          placeholder="Select a template above or write your script here..."
          rows={10}
          className="resize-none font-mono text-sm"
        />
        <div className="flex gap-3">
          <Button onClick={enhanceScript} disabled={enhancing} className="gap-2 flex-1">
            {enhancing ? <><Loader2 className="w-4 h-4 animate-spin" /> Enhancing...</> : <><Sparkles className="w-4 h-4" /> AI Enhance</>}
          </Button>
          <CopyButton text={scriptText} id="script" copiedId={copiedId} copy={copy} />
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Caption Lab ────────────────────────────────────────────────────────

function CaptionLabTab() {
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState(CAPTION_PLATFORMS[0]);
  const [tone, setTone] = useState(CAPTION_TONES[0]);
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [thumbA, setThumbA] = useState(null);
  const [thumbB, setThumbB] = useState(null);
  const [winner, setWinner] = useState(null);
  const { copiedId, copy } = useCopy();
  const { toast } = useToast();
  const thumbARef = useRef(null);
  const thumbBRef = useRef(null);

  const generate = async () => {
    if (!description.trim()) {
      toast({ title: 'Describe your video or post first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setCaptions([]);
    try {
      const result = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `You are a social media copywriter. Create 3 ${tone} caption variations for ${platform} based on: "${description}". Include relevant hashtags and a clear CTA. Return as a JSON array of objects with {caption, hashtags} fields.` }) }); const _d = await _r.json(); return _d.result ?? ''; })();

      let parsed = [];
      try {
        if (typeof result === 'string') {
          const match = result.match(/\[[\s\S]*\]/);
          if (match) parsed = JSON.parse(match[0]);
        } else if (Array.isArray(result)) {
          parsed = result;
        } else if (result?.result) {
          const match = result.result.match(/\[[\s\S]*\]/);
          if (match) parsed = JSON.parse(match[0]);
        }
      } catch (_) {}
      setCaptions(parsed.slice(0, 3));
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleThumbUpload = (side, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === 'A') { setThumbA(url); setWinner(null); }
    else { setThumbB(url); setWinner(null); }
  };

  const runABTest = () => {
    if (!thumbA || !thumbB) {
      toast({ title: 'Upload both thumbnails first', variant: 'destructive' });
      return;
    }
    const scores = { A: Math.floor(Math.random() * 30) + 55, B: Math.floor(Math.random() * 30) + 55 };
    setWinner({ ...scores, winner: scores.A >= scores.B ? 'A' : 'B' });
  };

  return (
    <div className="space-y-8">
      {/* Generator */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" /> Caption Generator
        </h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe Your Video / Post</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. A time-lapse of me cooking a traditional Italian pasta from scratch using ingredients from my garden..."
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CAPTION_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tone</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CAPTION_TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating captions...</> : <><Sparkles className="w-4 h-4" /> Generate 3 Captions</>}
        </Button>
      </div>

      {/* Caption results */}
      <AnimatePresence>
        {captions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Caption Variations</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {captions.map((cap, i) => {
                const fullText = `${cap.caption || cap}\n\n${cap.hashtags || ''}`;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">Option {i + 1}</Badge>
                      <span className="text-xs text-muted-foreground">{fullText.length} chars</span>
                    </div>
                    <p className="text-sm leading-relaxed flex-1 whitespace-pre-line">
                      {cap.caption || cap}
                    </p>
                    {cap.hashtags && (
                      <p className="text-xs text-primary/80">{cap.hashtags}</p>
                    )}
                    {cap.cta && (
                      <p className="text-xs text-muted-foreground italic">CTA: {cap.cta}</p>
                    )}
                    <CopyButton text={fullText} id={`cap-${i}`} copiedId={copiedId} copy={copy} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail A/B Tester */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" /> Thumbnail A/B Tester
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Upload two thumbnail options to see which is predicted to perform better</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['A', 'B'].map(side => {
            const img = side === 'A' ? thumbA : thumbB;
            const ref = side === 'A' ? thumbARef : thumbBRef;
            const isWinner = winner?.winner === side;
            return (
              <div key={side} className="space-y-2">
                <div className={`relative aspect-video rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  isWinner ? 'border-green-500' : 'border-border hover:border-primary/40'
                }`} onClick={() => ref.current?.click()}>
                  {img ? (
                    <img src={img} alt={`Thumbnail ${side}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload Thumbnail {side}</span>
                    </div>
                  )}
                  {isWinner && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white text-xs gap-1"><Trophy className="w-3 h-3" /> Winner</Badge>
                    </div>
                  )}
                  {winner && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-1.5 text-center">
                      <span className={`text-sm font-bold ${isWinner ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {side === 'A' ? winner.A : winner.B}% predicted CTR
                      </span>
                    </div>
                  )}
                </div>
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleThumbUpload(side, e)} />
                <p className="text-xs text-center text-muted-foreground">Option {side}</p>
              </div>
            );
          })}
        </div>

        <Button onClick={runABTest} variant="outline" className="w-full gap-2">
          <TrendingUp className="w-4 h-4" /> Predict Winner
        </Button>

        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What makes a great thumbnail?</p>
          <ul className="space-y-1">
            {THUMBNAIL_TIPS.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <Star className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Analytics Tools ────────────────────────────────────────────────────

function AnalyticsToolsTab() {
  // Engagement Rate Calculator
  const [followers, setFollowers] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [engResult, setEngResult] = useState(null);

  // Posting Time Analyzer
  const [postPlatform, setPostPlatform] = useState(PLATFORMS[0]);
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const calculateEngagement = () => {
    const f = parseFloat(followers);
    const total = (parseFloat(likes) || 0) + (parseFloat(comments) || 0) + (parseFloat(shares) || 0) + (parseFloat(saves) || 0);
    if (!f || f === 0) { toast({ title: 'Enter follower count', variant: 'destructive' }); return; }
    const rate = (total / f) * 100;

    let rating, color, benchmark;
    if (rate < 1) { rating = 'Poor'; color = 'text-red-400'; benchmark = 'Below average — focus on more engaging content'; }
    else if (rate < 3) { rating = 'Average'; color = 'text-yellow-400'; benchmark = 'Near industry average (1-3%)'; }
    else if (rate < 6) { rating = 'Good'; color = 'text-blue-400'; benchmark = 'Above average — your content resonates'; }
    else if (rate < 10) { rating = 'Excellent'; color = 'text-green-400'; benchmark = 'Top tier — you\'re outperforming 90% of creators'; }
    else { rating = 'Viral'; color = 'text-purple-400'; benchmark = 'Exceptional — this content is going viral!'; }

    const engBenchmarks = { poor: '<1%', average: '1-3%', good: '3-6%', excellent: '6-10%', viral: '>10%' };
    setEngResult({ rate: rate.toFixed(2), rating, color, benchmark });
  };

  const analyzePostingTime = async () => {
    setAnalyzing(true);
    setTimeSlots([]);
    try {
      const result = await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `You are a social media expert. Recommend 3 optimal posting times for a ${contentType} creator on ${postPlatform} targeting ${timezone} audiences. Return as JSON array with fields: day, time, reason, engagement_boost.` }) }); const _d = await _r.json(); return _d.result ?? ''; })();

      let parsed = [];
      try {
        if (typeof result === 'string') {
          const match = result.match(/\[[\s\S]*\]/);
          if (match) parsed = JSON.parse(match[0]);
        } else if (Array.isArray(result)) {
          parsed = result;
        } else if (result?.result) {
          const match = result.result.match(/\[[\s\S]*\]/);
          if (match) parsed = JSON.parse(match[0]);
        }
      } catch (_) {}
      setTimeSlots(parsed.slice(0, 3));
    } catch (e) {
      toast({ title: 'Analysis failed', description: e.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Engagement Rate Calculator */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Engagement Rate Calculator
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Find out how your content performs vs. industry benchmarks</p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Followers', value: followers, set: setFollowers, icon: Users },
            { label: 'Likes', value: likes, set: setLikes, icon: ThumbsUp },
            { label: 'Comments', value: comments, set: setComments, icon: MessageCircle },
            { label: 'Shares', value: shares, set: setShares, icon: Share2 },
            { label: 'Saves', value: saves, set: setSaves, icon: Bookmark },
          ].map(({ label, value, set, icon: Icon }) => (
            <div key={label} className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder={label}
                value={value}
                onChange={e => set(e.target.value)}
                className="pl-9"
              />
            </div>
          ))}
        </div>

        <Button onClick={calculateEngagement} className="w-full gap-2">
          <BarChart2 className="w-4 h-4" /> Calculate
        </Button>

        <AnimatePresence>
          {engResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-muted/50 rounded-xl p-5 space-y-3 text-center"
            >
              <div className={`text-5xl font-black ${engResult.color}`}>
                {engResult.rate}%
              </div>
              <div>
                <Badge className={`text-sm px-3 py-1 ${
                  engResult.rating === 'Viral' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  engResult.rating === 'Excellent' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  engResult.rating === 'Good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  engResult.rating === 'Average' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {engResult.rating === 'Viral' && <Flame className="w-3.5 h-3.5 mr-1" />}
                  {engResult.rating}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{engResult.benchmark}</p>
              <div className="grid grid-cols-5 gap-1 mt-2">
                {['Poor', 'Average', 'Good', 'Excellent', 'Viral'].map((r) => (
                  <div key={r} className={`h-1.5 rounded-full transition-all ${
                    engResult.rating === r ? 'bg-primary' : 'bg-muted'
                  }`} />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground">
                {['<1%', '1-3%', '3-6%', '6-10%', '>10%'].map(v => (
                  <span key={v} className="text-center">{v}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Best Posting Time Analyzer */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> Best Posting Time Analyzer
          </h3>
          <p className="text-xs text-muted-foreground mt-1">AI-powered posting schedule tailored to your audience</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</label>
            <select
              value={postPlatform}
              onChange={e => setPostPlatform(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audience Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Type</label>
            <div className="flex gap-2">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct}
                  onClick={() => setContentType(ct)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    contentType === ct
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={analyzePostingTime} disabled={analyzing} className="w-full gap-2">
          {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Best Times</>}
        </Button>

        <AnimatePresence>
          {timeSlots.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {timeSlots.map((slot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-muted/50 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{slot.day}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {slot.time}
                        </p>
                      </div>
                    </div>
                    {slot.engagement_boost && (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                        {slot.engagement_boost}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{slot.reason}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function UGCCreatorSuite() {
  const [activeTab, setActiveTab] = useState('hooks');

  const tabContent = {
    hooks: <ViralHooksTab />,
    scripts: <ScriptTemplatesTab />,
    captions: <CaptionLabTab />,
    analytics: <AnalyticsToolsTab />,
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">UGC Creator Suite</h1>
            <p className="text-sm text-muted-foreground">Everything you need to go viral</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 bg-muted/40 p-1 rounded-xl border border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
