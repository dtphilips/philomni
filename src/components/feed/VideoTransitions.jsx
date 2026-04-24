import React from 'react';
import { Button } from '@/components/ui/button';

const TRANSITIONS = [
  { id: 'fade', name: 'Fade', duration: 300, css: 'opacity' },
  { id: 'slide-left', name: 'Slide Left', duration: 500, css: 'transform' },
  { id: 'slide-right', name: 'Slide Right', duration: 500, css: 'transform' },
  { id: 'slide-up', name: 'Slide Up', duration: 500, css: 'transform' },
  { id: 'slide-down', name: 'Slide Down', duration: 500, css: 'transform' },
  { id: 'zoom-in', name: 'Zoom In', duration: 400, css: 'transform' },
  { id: 'zoom-out', name: 'Zoom Out', duration: 400, css: 'transform' },
  { id: 'rotate', name: 'Rotate', duration: 500, css: 'transform' },
  { id: 'blur', name: 'Blur', duration: 400, css: 'filter' },
  { id: 'flip', name: 'Flip', duration: 400, css: 'transform' },
];

export default function VideoTransitions({ onSelect, selectedTransition }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Select Transition Effect</p>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {TRANSITIONS.map(transition => (
          <Button
            key={transition.id}
            variant={selectedTransition?.id === transition.id ? 'default' : 'outline'}
            onClick={() => onSelect(transition)}
            className="text-xs flex flex-col h-auto py-2"
          >
            <span className="font-medium">{transition.name}</span>
            <span className="text-xs opacity-70">{transition.duration}ms</span>
          </Button>
        ))}
      </div>
      {selectedTransition && (
        <div className="p-2 rounded-lg bg-muted">
          <p className="text-xs"><strong>Selected:</strong> {selectedTransition.name} ({selectedTransition.duration}ms)</p>
        </div>
      )}
    </div>
  );
}