import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Loader, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CaptionsEditor({ videoUrl, onCaptionsChange, duration }) {
  const [captions, setCaptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState(null);
  const [newCaption, setNewCaption] = useState('');

  const generateCaptions = async () => {
    if (!videoUrl) return;
    
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCaptionsFromVideo', { videoUrl });
      setCaptions(response.data.captions || []);
      onCaptionsChange?.(response.data.captions || []);
    } catch (error) {
      console.error('Caption generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCaption = (index, field, value) => {
    const updated = captions.map((cap, i) => i === index ? { ...cap, [field]: value } : cap);
    setCaptions(updated);
    onCaptionsChange?.(updated);
  };

  const deleteCaption = (index) => {
    const updated = captions.filter((_, i) => i !== index);
    setCaptions(updated);
    onCaptionsChange?.(updated);
  };

  const addCaption = () => {
    if (newCaption.trim()) {
      const lastEnd = captions.length > 0 ? captions[captions.length - 1].end_time : 0;
      const updated = [...captions, {
        start_time: lastEnd,
        end_time: lastEnd + 3,
        text: newCaption
      }];
      setCaptions(updated);
      onCaptionsChange?.(updated);
      setNewCaption('');
    }
  };

  const currentCaption = selectedCaption !== null ? captions[selectedCaption] : null;

  return (
    <div className="space-y-4">
      <Button onClick={generateCaptions} disabled={isGenerating} className="w-full text-xs">
        {isGenerating ? (
          <>
            <Loader className="w-3 h-3 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Captions from Audio'
        )}
      </Button>

      <div>
        <Label className="text-xs font-semibold mb-2 block">Captions ({captions.length})</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {captions.map((cap, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedCaption(idx)}
              className={`p-2 rounded border cursor-pointer transition-all ${
                selectedCaption === idx
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-muted hover:bg-muted/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-muted-foreground">
                    {cap.start_time.toFixed(2)}s - {cap.end_time.toFixed(2)}s
                  </p>
                  <p className="truncate">{cap.text}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); deleteCaption(idx); }}
                  className="h-5 w-5 p-0 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentCaption && (
        <div className="pt-3 border-t space-y-3">
          <div>
            <Label className="text-xs">Text</Label>
            <Input
              value={currentCaption.text}
              onChange={(e) => updateCaption(selectedCaption, 'text', e.target.value)}
              className="mt-1 text-xs h-8"
            />
          </div>

          <div>
            <Label className="text-xs">Start: {currentCaption.start_time.toFixed(2)}s</Label>
            <Slider
              value={[currentCaption.start_time]}
              onValueChange={([v]) => updateCaption(selectedCaption, 'start_time', Math.min(v, currentCaption.end_time - 0.1))}
              min={0}
              max={duration || 100}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">End: {currentCaption.end_time.toFixed(2)}s</Label>
            <Slider
              value={[currentCaption.end_time]}
              onValueChange={([v]) => updateCaption(selectedCaption, 'end_time', Math.max(v, currentCaption.start_time + 0.1))}
              min={0}
              max={duration || 100}
              step={0.1}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="pt-3 border-t space-y-2">
        <Label className="text-xs font-semibold">Add Caption Manually</Label>
        <Input
          placeholder="Enter caption text..."
          value={newCaption}
          onChange={(e) => setNewCaption(e.target.value)}
          className="text-xs h-8"
          onKeyPress={(e) => e.key === 'Enter' && addCaption()}
        />
        <Button onClick={addCaption} variant="outline" size="sm" className="w-full text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Add Caption
        </Button>
      </div>
    </div>
  );
}