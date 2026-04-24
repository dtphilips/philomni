import React, { useState } from 'react';
import { Upload, Trash2, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MediaLibrary({ mediaItems, onAddMedia, onRemoveMedia, onDragStart }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          onAddMedia({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            src: evt.target?.result,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          onAddMedia({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            src: evt.target?.result,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-3 border-b border-border flex-shrink-0">
        <h3 className="text-xs font-semibold mb-2">Media Library</h3>
        <label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button size="sm" className="w-full text-xs" asChild>
            <span className="cursor-pointer">
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </span>
          </Button>
        </label>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex-1 overflow-y-auto p-2 transition-colors",
          dragOver && "bg-accent/20 border-2 border-primary"
        )}
      >
        {mediaItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Drag media here or click upload</p>
              <p className="text-xs text-muted-foreground/60">Supports images and videos</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  onDragStart(item);
                }}
                className="group p-2 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors border border-border hover:border-primary"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-black rounded flex items-center justify-center">
                    {item.type === 'video' ? (
                      <Video className="w-4 h-4 text-primary" />
                    ) : (
                      <Image className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => onRemoveMedia(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2 flex-shrink-0 bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag items to timeline
        </p>
      </div>
    </div>
  );
}