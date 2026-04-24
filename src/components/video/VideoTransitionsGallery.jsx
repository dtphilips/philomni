import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check } from 'lucide-react';

const TRANSITIONS = {
  dissolve: { name: 'Dissolve', duration: 0.5, description: 'Smooth fade between clips' },
  fade: { name: 'Fade', duration: 0.3, description: 'Quick fade to black' },
  slide: { name: 'Slide', duration: 0.4, description: 'Slide transition' },
  wipeRight: { name: 'Wipe Right', duration: 0.4, description: 'Wipe from left to right' },
  wipeLeft: { name: 'Wipe Left', duration: 0.4, description: 'Wipe from right to left' },
  zoom: { name: 'Zoom', duration: 0.5, description: 'Zoom in/out transition' },
  blur: { name: 'Blur', duration: 0.4, description: 'Blur transition effect' },
  flipH: { name: 'Flip H', duration: 0.5, description: 'Horizontal flip' },
  flipV: { name: 'Flip V', duration: 0.5, description: 'Vertical flip' },
  rotateOut: { name: 'Rotate Out', duration: 0.5, description: 'Rotate outward' },
  bounce: { name: 'Bounce', duration: 0.6, description: 'Bouncy transition' },
  shutter: { name: 'Shutter', duration: 0.4, description: 'Shutter effect' }
};

export default function VideoTransitionsGallery({ selectedTransition, duration, onSelect, onDurationChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-3 block">Transition Gallery</Label>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {Object.entries(TRANSITIONS).map(([key, trans]) => (
            <button
              key={key}
              onClick={() => onSelect(key, trans.duration)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedTransition === key
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-muted hover:bg-muted/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold">{trans.name}</p>
                  <p className="text-xs text-muted-foreground">{trans.description}</p>
                </div>
                {selectedTransition === key && <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTransition && (
        <div className="pt-3 border-t space-y-3">
          <div>
            <Label className="text-xs">Duration: {duration.toFixed(2)}s</Label>
            <Slider
              value={[duration]}
              onValueChange={([v]) => onDurationChange(v)}
              min={0.1}
              max={2}
              step={0.1}
              className="mt-2"
            />
          </div>
          <div className="p-2 rounded bg-muted text-xs text-muted-foreground">
            Transition will be applied between clips
          </div>
        </div>
      )}
    </div>
  );
}