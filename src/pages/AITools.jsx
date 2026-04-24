import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, FileText, MessageSquare, Image, Video, Calendar, UserCheck, Crown, TrendingUp, Music
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ToolModal from '@/components/ai-tools/ToolModal';
import AudioLibrary from '@/components/audio/AudioLibrary';

const TOOLS = [
  // Business & Marketing
  { id: 'pitch', icon: FileText, title: 'AI Pitch Builder', desc: 'Structure your idea into a compelling investor-ready pitch', price: '$4.99', prompt: 'Describe your business idea and I will create a structured investor-ready pitch with key sections, messages, and compelling language.', category: 'business' },
  { id: 'caption', icon: MessageSquare, title: 'AI Caption Generator', desc: 'Generate platform-specific social media captions', price: '$2.99', prompt: 'Describe your product/service or upload a photo description. I will generate social media captions for Instagram, Facebook, LinkedIn, and TikTok.', category: 'business' },
  { id: 'image', icon: Image, title: 'AI Marketing Image', desc: 'Generate branded marketing visuals from text', price: '$3.99', prompt: 'Describe what marketing visual you need. I will generate a branded promotional image or banner.', category: 'business' },
  { id: 'script', icon: Video, title: 'AI Video Script', desc: 'Generate short-form video scripts with hook, body, CTA', price: '$3.99', prompt: 'Describe your product/service. I will write a short-form video script with a compelling hook, informative body, and clear call to action.', category: 'business' },
  { id: 'planner', icon: Calendar, title: 'AI Post Planner', desc: 'Get a full 30-day content calendar', price: '$9.99', prompt: 'Tell me about your brand (industry, audience, goals, tone, products). I will create a 30-day content calendar with post ideas, captions, and image descriptions.', category: 'business' },
  { id: 'profile', icon: UserCheck, title: 'AI Profile Optimiser', desc: 'Get recommendations to improve your profile', price: '$1.99', prompt: 'I will analyse your profile and give specific recommendations to improve discoverability, match score, and connection quality.', category: 'business' },
  
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
];

export default function AITools() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState(null);
  const isPro = user?.plan === 'pro';
  const [activeTab, setActiveTab] = useState('tools');

  const currentTool = TOOLS.find(t => t.id === activeTool);

  const [selectedCategory, setSelectedCategory] = React.useState('all');
  
  const filteredTools = selectedCategory === 'all' 
    ? TOOLS 
    : TOOLS.filter(t => t.category === selectedCategory);

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
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => setSelectedCategory('business')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'business'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setSelectedCategory('creator')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'creator'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              Creator & UGC
            </button>
            <button
              onClick={() => setSelectedCategory('content')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'content'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              Content & Website
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  {isPro ? (
                    <Badge className="bg-primary/10 text-primary border-0 text-xs"><Crown className="w-3 h-3 mr-1" />Free with Pro</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{tool.price}</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
              </button>
            ))}
          </div>

          {currentTool && (
            <ToolModal
              isOpen={!!activeTool}
              onClose={() => setActiveTool(null)}
              tool={currentTool}
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