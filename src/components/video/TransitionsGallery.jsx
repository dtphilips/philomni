import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TRANSITIONS = [
  { id: 'fade', label: 'Fade', icon: '◐' },
  { id: 'slide-left', label: 'Slide Left', icon: '→' },
  { id: 'slide-right', label: 'Slide Right', icon: '←' },
  { id: 'slide-up', label: 'Slide Up', icon: '↑' },
  { id: 'slide-down', label: 'Slide Down', icon: '↓' },
  { id: 'zoom-in', label: 'Zoom In', icon: '⊙' },
  { id: 'zoom-out', label: 'Zoom Out', icon: '⊕' },
  { id: 'blur-zoom', label: 'Blur Zoom', icon: '◎' },
  { id: 'rotate', label: 'Rotate', icon: '⟲' },
  { id: 'flip', label: 'Flip', icon: '⇄' },
  { id: 'wipe', label: 'Wipe', icon: '⊲' },
  { id: 'bounce', label: 'Bounce', icon: '⟿' },
];

export default function TransitionsGallery({ onSelectTransition, selected }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {TRANSITIONS.map((transition) => (
          <Button
            key={transition.id}
            variant={selected === transition.id ? 'default' : 'outline'}
            className="h-24 flex flex-col items-center justify-center gap-2 text-xs"
            onClick={() => onSelectTransition(transition.id)}
          >
            <span className="text-2xl">{transition.icon}</span>
            <span className="text-xs text-center">{transition.label}</span>
          </Button>
        ))}
      </div>

      <div className="p-3 bg-muted rounded-lg space-y-2">
        <div className="text-xs font-semibold">Transition Settings</div>
        <div className="space-y-2">
          <div>
            <label className="text-xs">Duration (ms)</label>
            <input type="range" min="100" max="2000" step="100" defaultValue="300" className="w-full mt-1" />
          </div>
          <div className="text-xs text-muted-foreground">
            Applied between clips on timeline
          </div>
        </div>
      </div>
    </div>
  );
}