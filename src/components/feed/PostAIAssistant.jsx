import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wand2, Loader2, Copy, Check, ChevronDown, X,
  Zap, BookOpen, Type, Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostAIAssistant({ content, onApply, hashtags = [] }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const actions = [
    { id: 'draft', label: 'Draft', icon: Zap, desc: 'Generate a new post' },
    { id: 'rewrite', label: 'Rewrite', icon: Type, desc: 'Improve your post' },
    { id: 'expand', label: 'Expand', icon: BookOpen, desc: 'Add more detail' },
    { id: 'summarize', label: 'Summarize', icon: Volume2, desc: 'Create a preview' },
    { id: 'tone', label: 'Tone', icon: Wand2, desc: 'Make it professional' },
  ];

  const audiences = [
    'Developers',
    'Designers',
    'Entrepreneurs',
    'Investors',
    'Students',
    'Executives',
    'Creatives',
  ];

  const handleGenerate = async () => {
    if (!action || !content?.trim()) return;
    
    setLoading(true);
    try {
      const response = /* TODO: migrate base44.functions.invoke */ Promise.resolve(null)),
        audience: audience || null,
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setOpen(false);
      setResult(null);
      setAction(null);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 text-muted-foreground hover:text-primary"
      >
        <Wand2 className="w-4 h-4" />
        AI Assistant
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 z-50 bg-card border border-border rounded-xl shadow-lg p-4 w-80 space-y-4"
          >
            {!result ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">AI Post Assistant</h3>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setAction(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {actions.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAction(a.id)}
                      className={cn(
                        'p-3 rounded-lg border transition-all text-left',
                        action === a.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/40'
                      )}
                    >
                      <a.icon className="w-4 h-4 text-primary mb-1" />
                      <p className="text-xs font-semibold">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </button>
                  ))}
                </div>

                {action && (
                  <>
                    {/* Audience Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Target Audience (optional)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {audiences.map(aud => (
                          <Badge
                            key={aud}
                            variant={audience === aud ? 'default' : 'outline'}
                            className="cursor-pointer text-xs"
                            onClick={() => setAudience(audience === aud ? '' : aud)}
                          >
                            {aud}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Hashtags Display */}
                    {hashtags.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Hashtags ({hashtags.length})
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || !content?.trim()}
                      className="w-full gap-2"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          Generate
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Result Preview */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Generated Content</h3>
                  <button
                    onClick={() => {
                      setResult(null);
                      setAction(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-background border border-border rounded-lg p-3 text-sm text-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {result}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleApply}
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setResult(null);
                    setAction(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Try Another
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}