import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { differenceInHours, formatDistanceToNow } from 'date-fns';

export default function StatusStory({ statuses = [], currentIndex = 0, isOpen, onClose, onMarkViewed }) {
  const [index, setIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);

  const currentStatus = statuses[index];
  const isExpired = currentStatus && differenceInHours(new Date(), new Date(currentStatus.created_at)) >= 24;

  useEffect(() => {
    if (!isOpen || !currentStatus) return;

    // Mark as viewed
    onMarkViewed?.(currentStatus.id);

    // Progress bar animation (5 seconds per status)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + (100 / 50); // 5 seconds = 5000ms, update every 100ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentStatus, index]);

  const handleNext = () => {
    if (index < statuses.length - 1) {
      setIndex(index + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setProgress(0);
    }
  };

  if (!currentStatus) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm h-screen max-h-[600px] bg-black border-0 p-0 rounded-lg overflow-hidden flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 p-2 bg-black/50">
          {statuses.map((_, i) => (
            <Progress
              key={i}
              value={i === index ? progress : i < index ? 100 : 0}
              className="h-1 flex-1"
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/30 text-white text-sm">
          <div className="flex items-center gap-2">
            <img
              src={currentStatus.user_avatar}
              alt={currentStatus.user_name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{currentStatus.user_name}</p>
              <p className="text-xs opacity-75">{formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <p className="text-white text-center">Status expired (24 hours)</p>
            </div>
          )}

          {currentStatus.media_type === 'video' ? (
            <video
              src={currentStatus.media_url}
              className="w-full h-full object-cover"
              autoPlay
              controls={false}
            />
          ) : (
            <img
              src={currentStatus.media_url}
              alt="Status"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Caption */}
        {currentStatus.caption && (
          <div className="px-4 py-3 bg-black text-white text-sm">
            <p>{currentStatus.caption}</p>
            {currentStatus.hashtags?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {currentStatus.hashtags.map(tag => (
                  <span key={tag} className="text-primary text-xs">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Viewers count */}
        <div className="px-4 py-2 bg-black/30 text-white text-xs flex justify-between">
          <span>{currentStatus.viewer_count} views</span>
          <span>{index + 1} / {statuses.length}</span>
        </div>

        {/* Navigation */}
        {statuses.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={index === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}