import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Copy } from 'lucide-react';

export default function KeyframeAnimationEditor({ element, onKeyframesChange, duration }) {
  const [keyframes, setKeyframes] = useState(element?.keyframes || [
    { time: 0, x: element?.x || 0, y: element?.y || 0, scale: 100, opacity: 100 },
    { time: duration || 3, x: element?.x || 0, y: element?.y || 0, scale: 100, opacity: 100 }
  ]);
  const [selectedKeyframe, setSelectedKeyframe] = useState(0);

  const updateKeyframe = (index, field, value) => {
    const updated = keyframes.map((kf, i) => i === index ? { ...kf, [field]: value } : kf);
    setKeyframes(updated);
    onKeyframesChange?.(updated);
  };

  const addKeyframe = (atTime) => {
    const newKf = {
      time: atTime,
      x: keyframes[selectedKeyframe]?.x || 0,
      y: keyframes[selectedKeyframe]?.y || 0,
      scale: keyframes[selectedKeyframe]?.scale || 100,
      opacity: keyframes[selectedKeyframe]?.opacity || 100
    };
    const updated = [...keyframes, newKf].sort((a, b) => a.time - b.time);
    setKeyframes(updated);
    onKeyframesChange?.(updated);
  };

  const deleteKeyframe = (index) => {
    if (keyframes.length > 2) {
      const updated = keyframes.filter((_, i) => i !== index);
      setKeyframes(updated);
      onKeyframesChange?.(updated);
      setSelectedKeyframe(Math.min(selectedKeyframe, updated.length - 1));
    }
  };

  const currentKf = keyframes[selectedKeyframe];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-2 block">Keyframe Timeline</Label>
        <div className="space-y-2">
          {keyframes.map((kf, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedKeyframe(idx)}
              className={`p-2 rounded border cursor-pointer transition-all ${
                selectedKeyframe === idx
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-muted hover:bg-muted/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Frame @ {kf.time.toFixed(2)}s</span>
                {keyframes.length > 2 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); deleteKeyframe(idx); }}
                    className="h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentKf && (
        <div className="pt-3 border-t space-y-3">
          <Tabs defaultValue="transform" className="w-full">
            <TabsList className="grid w-full grid-cols-2 text-xs">
              <TabsTrigger value="transform">Transform</TabsTrigger>
              <TabsTrigger value="opacity">Opacity</TabsTrigger>
            </TabsList>

            <TabsContent value="transform" className="space-y-3">
              <div>
                <Label className="text-xs">X Position: {currentKf.x}%</Label>
                <Slider
                  value={[currentKf.x]}
                  onValueChange={([v]) => updateKeyframe(selectedKeyframe, 'x', v)}
                  min={-50}
                  max={150}
                  step={1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Y Position: {currentKf.y}%</Label>
                <Slider
                  value={[currentKf.y]}
                  onValueChange={([v]) => updateKeyframe(selectedKeyframe, 'y', v)}
                  min={-50}
                  max={150}
                  step={1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Scale: {currentKf.scale}%</Label>
                <Slider
                  value={[currentKf.scale]}
                  onValueChange={([v]) => updateKeyframe(selectedKeyframe, 'scale', v)}
                  min={10}
                  max={300}
                  step={5}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="opacity" className="space-y-3">
              <div>
                <Label className="text-xs">Opacity: {currentKf.opacity}%</Label>
                <Slider
                  value={[currentKf.opacity]}
                  onValueChange={([v]) => updateKeyframe(selectedKeyframe, 'opacity', v)}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => addKeyframe(currentKf.time + 1)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Keyframe
          </Button>
        </div>
      )}

      <div className="p-2 rounded bg-muted text-xs text-muted-foreground space-y-1">
        <p>• Select a keyframe to edit its properties</p>
        <p>• Properties animate smoothly between keyframes</p>
        <p>• First and last keyframes cannot be deleted</p>
      </div>
    </div>
  );
}