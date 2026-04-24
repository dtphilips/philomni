import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Copy } from 'lucide-react';

export default function KeyframeEditor({ elementId, keyframes = [], onAddKeyframe, onUpdateKeyframe, onDeleteKeyframe, currentTime }) {
  const [selectedKeyframe, setSelectedKeyframe] = useState(null);

  const currentKeyframe = keyframes.find(k => Math.abs(k.time - currentTime) < 0.5);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-semibold">Keyframes</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddKeyframe?.({ time: currentTime, position: { x: 0, y: 0 }, scale: 100, opacity: 100 })}
          className="h-6 px-2 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add at {Math.floor(currentTime)}s
        </Button>
      </div>

      {/* Keyframe Timeline */}
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {keyframes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No keyframes yet</p>
        ) : (
          <div className="space-y-2">
            {keyframes.map((kf, idx) => (
              <div
                key={kf.id || idx}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedKeyframe?.id === kf.id ? 'bg-primary/20 border border-primary' : 'bg-background border border-border'
                }`}
                onClick={() => setSelectedKeyframe(kf)}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium">{Math.floor(kf.time)}s</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onDeleteKeyframe?.(kf.id); }}
                      className="h-5 w-5 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyframe Properties */}
      {selectedKeyframe && (
        <div className="bg-card border border-border rounded-lg p-3 space-y-3">
          <div className="text-xs font-semibold">Position: {Math.floor(selectedKeyframe.time)}s</div>

          <div>
            <Label className="text-xs">X Position: {selectedKeyframe.position?.x || 0}%</Label>
            <Slider
              value={[selectedKeyframe.position?.x || 0]}
              onValueChange={([v]) =>
                onUpdateKeyframe?.(selectedKeyframe.id, {
                  ...selectedKeyframe,
                  position: { ...selectedKeyframe.position, x: v }
                })
              }
              min={-50}
              max={150}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Y Position: {selectedKeyframe.position?.y || 0}%</Label>
            <Slider
              value={[selectedKeyframe.position?.y || 0]}
              onValueChange={([v]) =>
                onUpdateKeyframe?.(selectedKeyframe.id, {
                  ...selectedKeyframe,
                  position: { ...selectedKeyframe.position, y: v }
                })
              }
              min={-50}
              max={150}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Scale: {selectedKeyframe.scale || 100}%</Label>
            <Slider
              value={[selectedKeyframe.scale || 100]}
              onValueChange={([v]) =>
                onUpdateKeyframe?.(selectedKeyframe.id, { ...selectedKeyframe, scale: v })
              }
              min={10}
              max={200}
              step={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Opacity: {selectedKeyframe.opacity || 100}%</Label>
            <Slider
              value={[selectedKeyframe.opacity || 100]}
              onValueChange={([v]) =>
                onUpdateKeyframe?.(selectedKeyframe.id, { ...selectedKeyframe, opacity: v })
              }
              min={0}
              max={100}
              step={5}
              className="mt-1"
            />
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            Frame-by-frame interpolation between keyframes
          </div>
        </div>
      )}
    </div>
  );
}