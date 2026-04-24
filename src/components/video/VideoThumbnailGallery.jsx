import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';

export default function VideoThumbnailGallery({ videoRef, duration, onSeek, currentTime }) {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef?.current || !duration) return;

    const generateThumbnails = async () => {
      setLoading(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 160;
      canvas.height = 90;

      const frames = [];
      const interval = Math.max(1, Math.floor(duration / 12)); // Generate ~12 thumbnails
      let time = 0;

      while (time <= duration) {
        await new Promise((resolve) => {
          video.currentTime = time;
          video.onloadedmetadata = () => resolve();
          video.onseeked = () => {
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push({
                time,
                src: canvas.toDataURL('image/jpeg', 0.7)
              });
            } catch (e) {
              console.error('Failed to generate thumbnail:', e);
            }
            resolve();
          };
        });

        time += interval;
      }

      setThumbnails(frames);
      setLoading(false);
    };

    generateThumbnails();
  }, [videoRef, duration]);

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        <Label className="text-xs font-semibold">Frames</Label>
        <div className="flex items-center justify-center h-20 bg-muted rounded">
          <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <Label className="text-xs font-semibold">Jump to Scene</Label>
      <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-64">
        {thumbnails.map((thumb, idx) => (
          <button
            key={idx}
            onClick={() => onSeek(thumb.time)}
            className={`relative group overflow-hidden rounded border-2 transition-all ${
              Math.abs(currentTime - thumb.time) < 0.5
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <img
              src={thumb.src}
              alt={`Frame at ${Math.floor(thumb.time)}s`}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5">
              {Math.floor(thumb.time)}s
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}