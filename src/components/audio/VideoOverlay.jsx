import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Play, Pause, Volume2, VolumeX, Film, Music,
  Mic, Loader2, Check, X, RefreshCw
} from 'lucide-react';

export default function VideoOverlay() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLabel, setAudioLabel] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [audioVolume, setAudioVolume] = useState([0.8]);
  const [videoVolume, setVideoVolume] = useState([0.3]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const videoDragRef = useRef(null);
  const audioDragRef = useRef(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [videoUrl, audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume[0];
    }
  }, [audioVolume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = videoMuted ? 0 : videoVolume[0];
    }
  }, [videoVolume, videoMuted]);

  const handleVideoDrop = (e) => {
    e.preventDefault();
    videoDragRef.current = false;
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioDrop = (e) => {
    e.preventDefault();
    audioDragRef.current = false;
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setAudioLabel(file.name.replace(/\.[^/.]+$/, ''));
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
      if (aud) aud.pause();
      setIsPlaying(false);
    } else {
      vid.play();
      if (aud) {
        aud.currentTime = vid.currentTime;
        aud.play();
      }
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleSeek = (val) => {
    const t = val[0];
    if (videoRef.current) videoRef.current.currentTime = t;
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const clearVideo = () => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; }
    if (audioRef.current) { audioRef.current.pause(); }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null); setVideoUrl(null); setIsPlaying(false); setCurrentTime(0); setDuration(0);
  };

  const clearAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null); setAudioUrl(null); setAudioLabel('');
    if (isPlaying && videoRef.current) { videoRef.current.pause(); setIsPlaying(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Video + Audio Preview</p>
        <p className="text-xs text-muted-foreground">Upload a video clip and overlay any audio track — your music, TTS, or any audio file.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Video upload */}
        <div>
          <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5"><Film className="w-3.5 h-3.5 text-muted-foreground" /> Video Clip</p>
          {!videoFile ? (
            <label
              onDragOver={e => e.preventDefault()}
              onDrop={handleVideoDrop}
              className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center">Drop video or <span className="text-primary font-medium">browse</span></span>
              <span className="text-xs text-muted-foreground/60">MP4, MOV, WebM</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoDrop} />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl border border-border">
              <Film className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium truncate flex-1">{videoFile.name}</span>
              <button onClick={clearVideo} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Audio upload */}
        <div>
          <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-muted-foreground" /> Audio Track</p>
          {!audioFile ? (
            <label
              onDragOver={e => e.preventDefault()}
              onDrop={handleAudioDrop}
              className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center">Drop audio or <span className="text-primary font-medium">browse</span></span>
              <span className="text-xs text-muted-foreground/60">MP3, WAV, OGG, M4A</span>
              <input type="file" accept="audio/*" className="hidden" onChange={handleAudioDrop} />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl border border-border">
              <Music className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium truncate flex-1">{audioLabel || audioFile.name}</span>
              <button onClick={clearAudio} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video player */}
      {videoUrl && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              muted={videoMuted || !videoVolume[0]}
              playsInline
            />
            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} />
            )}
            {/* Overlay badge */}
            {audioFile && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm gap-1">
                  <Music className="w-3 h-3" /> {audioLabel}
                </Badge>
              </div>
            )}
            {/* Big play button overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-black ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* Transport controls */}
          <div className="bg-card border border-border rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={togglePlayback} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  min={0}
                  max={duration || 1}
                  step={0.1}
                />
              </div>
              <span className="text-xs text-muted-foreground w-20 text-right flex-shrink-0">
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            {/* Volume controls */}
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-border">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Film className="w-3 h-3" /> Video Audio
                  </span>
                  <button onClick={() => setVideoMuted(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Slider
                  value={videoMuted ? [0] : videoVolume}
                  onValueChange={(v) => { setVideoVolume(v); setVideoMuted(false); }}
                  min={0} max={1} step={0.01}
                  disabled={videoMuted}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Music className="w-3 h-3" /> Overlay Audio
                  </span>
                  <span className="font-medium">{Math.round(audioVolume[0] * 100)}%</span>
                </div>
                <Slider
                  value={audioVolume}
                  onValueChange={setAudioVolume}
                  min={0} max={1} step={0.01}
                  disabled={!audioFile}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This is a live browser preview. For a final export, use a video editor with the downloaded audio track.
          </p>
        </div>
      )}

      {!videoUrl && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <Film className="w-10 h-10 opacity-20" />
          <p className="text-sm">Upload a video to preview your audio overlay</p>
        </div>
      )}
    </div>
  );
}