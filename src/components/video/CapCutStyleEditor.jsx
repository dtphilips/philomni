import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit3, Music, Type, Zap, Image, Subtitles, Filter, Settings,
  Play, Pause, RotateCcw, Volume2, VolumeX, Download, ChevronLeft,
  Trash2, Copy, Plus, X, Loader, Share2, Link2, Move, Eye,
  Lightbulb, Layers
} from 'lucide-react';
import TransitionsGallery from './TransitionsGallery';
import KeyframeEditor from './KeyframeEditor';
import VideoThumbnailGallery from './VideoThumbnailGallery';
import MediaLibrary from './MediaLibrary';

export default function CapCutStyleEditor({ videoUrl, onSave, onBack, initialData }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(true);

  // Video effects
  const [brightness, setBrightness] = useState(initialData?.video_filters?.brightness ?? 100);
  const [contrast, setContrast] = useState(initialData?.video_filters?.contrast ?? 100);
  const [saturation, setSaturation] = useState(initialData?.video_filters?.saturation ?? 100);
  const [hueRotate, setHueRotate] = useState(initialData?.video_filters?.hueRotate ?? 0);
  const [blur, setBlur] = useState(initialData?.video_filters?.blur ?? 0);
  const [temperature, setTemperature] = useState(initialData?.video_filters?.temperature ?? 0);
  const [vibrance, setVibrance] = useState(initialData?.video_filters?.vibrance ?? 0);

  // Transform
  const [rotation, setRotation] = useState(initialData?.video_filters?.rotation ?? 0);
  const [scale, setScale] = useState(initialData?.video_filters?.scale ?? 100);
  const [speed, setSpeed] = useState(initialData?.video_speed ?? 1);
  const [aspectRatio, setAspectRatio] = useState(initialData?.aspect_ratio ?? null);

  // Overlays
  const [textOverlays, setTextOverlays] = useState(initialData?.text_overlays ?? []);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(32);
  
  // AI Effects
  const [removeBackground, setRemoveBackground] = useState(initialData?.effects?.removeBackground ?? false);
  const [upscaleQuality, setUpscaleQuality] = useState(initialData?.effects?.upscaleQuality ?? 1);

  // Audio
  const [audioTracks, setAudioTracks] = useState([]);
  const [captionTracks, setCaptionTracks] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState(null);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  // Animations & Transitions
  const [elementKeyframes, setElementKeyframes] = useState({});
  const [selectedTransition, setSelectedTransition] = useState('fade');

  // UI
  const [activeTab, setActiveTab] = useState('edit');
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [thumbnails, setThumbnails] = useState([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [draggedMedia, setDraggedMedia] = useState(null);

  // Detect video aspect ratio on load
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const ratio = videoRef.current.videoWidth / videoRef.current.videoHeight;
      
      // Determine closest aspect ratio
      if (ratio > 1.2) {
        setAspectRatio('16:9');
      } else if (ratio < 0.85) {
        setAspectRatio('9:16');
      } else if (Math.abs(ratio - 1) < 0.1) {
        setAspectRatio('1:1');
      } else {
        setAspectRatio('4:3');
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => console.log('Play failed:', err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(err => console.log('Play error:', err));
        setIsPlaying(true);
      }
    }
  };

  const handleAddText = () => {
    if (newText.trim()) {
      setTextOverlays([...textOverlays, {
        id: Date.now(),
        text: newText,
        color: textColor,
        size: textSize,
        time: currentTime,
        duration: 3
      }]);
      setNewText('');
    }
  };

  const handleGenerateCaptions = async () => {
    setGeneratingCaptions(true);
    try {
      const response = /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);
      setCaptionTracks(response.data.captions || []);
    } catch (error) {
      console.error('Caption generation failed:', error);
    }
    setGeneratingCaptions(false);
  };

  const timeToPixels = (time) => time * 80 * timelineZoom;
  const pixelsToTime = (pixels) => pixels / (80 * timelineZoom);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-background overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header - Fixed */}
      <div className="bg-card border-b border-border px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center flex-shrink-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 sm:h-10 sm:w-10">
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold truncate">Video Editor</h1>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="text-xs h-8 sm:h-9">Upscale</Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-xs sm:text-sm h-8 sm:h-9" size="sm">Export</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-h-0">
        {/* Main Video Preview */}
        <div className="lg:flex-1 bg-black flex flex-col min-w-0 order-1 lg:order-none" style={{ flex: window.innerWidth < 768 ? '0 0 50vh' : window.innerWidth < 1024 ? '0 0 45vh' : '1' }}>
          <div className="flex-1 flex items-center justify-center overflow-hidden p-1 sm:p-3">
            <div 
              className={`bg-black rounded-lg overflow-hidden border border-border h-full flex items-center justify-center relative group max-h-full ${
                aspectRatio === '9:16' ? 'aspect-[9/16]' : 
                aspectRatio === '1:1' ? 'aspect-square' : 
                aspectRatio === '4:3' ? 'aspect-[4/3]' : 
                'aspect-video'
              }`}
              style={{ pointerEvents: 'none', zIndex: 1 }}
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                    handleVideoLoadedMetadata();
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                  crossOrigin="anonymous"
                  playsInline
                  muted={isMuted}
                  controlsList="nodownload"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px) ${temperature > 0 ? `sepia(${temperature / 100})` : ''} ${removeBackground ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' : ''} ${upscaleQuality > 1 ? 'brightness(105%)' : ''}`,
                    transform: `rotate(${rotation}deg) scale(${scale / 100})`,
                    backdropFilter: removeBackground ? 'blur(2px)' : 'none',
                    pointerEvents: 'auto'
                  }}
                />
              ) : (
                <div className="text-white text-center">
                  <p className="text-sm">No video loaded</p>
                </div>
              )}
              
              {/* Image/Video Overlays */}
              {overlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="absolute cursor-move border border-cyan-500 bg-black/30 hover:bg-black/50 transition-colors"
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    width: `${overlay.width}%`,
                    height: `${overlay.height}%`,
                    zIndex: overlay.zIndex || 1
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedOverlay(overlay.id); }}
                >
                  <img src={overlay.src} className="w-full h-full object-contain" alt="overlay" />
                </div>
              ))}

              {/* Text Overlays - Real-time render */}
              {textOverlays.map((text) => {
                const isVisible = currentTime >= text.time && currentTime < (text.time + text.duration);
                return isVisible ? (
                  <div
                    key={text.id}
                    className="absolute cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      left: '50%',
                      top: '75%',
                      transform: 'translateX(-50%)',
                      color: text.color,
                      fontSize: `${text.size}px`,
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    {text.text}
                  </div>
                ) : null;
              })}

              {/* AI Captions - Real-time render */}
              {captionTracks.map((caption, idx) => {
                const isVisible = currentTime >= caption.startTime && currentTime < caption.endTime;
                return isVisible ? (
                  <div
                    key={idx}
                    className="absolute bottom-12 left-0 right-0 text-center pointer-events-none"
                    style={{
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: '600',
                      textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '8px 16px',
                      margin: '0 auto',
                      width: 'fit-content',
                      borderRadius: '4px',
                      zIndex: 20
                    }}
                  >
                    {caption.text}
                  </div>
                ) : null;
              })}

              {/* Click hint */}
              <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                <span className="text-white/0 group-hover:text-white/50 text-sm transition-colors">Click for tools</span>
              </div>
            </div>
          </div>

          {/* Playback Controls - Minimal on mobile */}
          <div className="bg-card border-t border-border px-2 sm:px-3 py-2 flex-shrink-0 z-30">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button size="sm" variant="outline" onClick={handlePlayPause} className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0">
                {isPlaying ? <Pause className="w-3 sm:w-4 h-3 sm:h-4" /> : <Play className="w-3 sm:w-4 h-3 sm:h-4" />}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
              >
                {isMuted ? <VolumeX className="w-3 sm:w-4 h-3 sm:h-4" /> : <Volume2 className="w-3 sm:w-4 h-3 sm:h-4" />}
              </Button>
              <span className="text-xs text-muted-foreground w-9 sm:w-10 flex-shrink-0">
                {Math.floor(currentTime)}s
              </span>
              <Slider
                value={[currentTime]}
                onValueChange={([v]) => {
                  setCurrentTime(v);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                max={duration || 100}
                step={0.1}
                className="flex-1 min-w-0"
              />
              <span className="text-xs text-muted-foreground w-9 text-right flex-shrink-0">
                {Math.floor(duration)}s
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Toolbar - Grid of all tools */}
        <div className="lg:hidden w-full bg-card border-t border-border order-2 flex flex-col z-40" style={{ flex: '0 1 auto', minHeight: 0 }}>
          <div className="flex gap-2 p-2 flex-shrink-0 overflow-x-auto" style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
            <Button size="sm" variant={activeTab === 'edit' ? 'default' : 'outline'} onClick={() => setActiveTab('edit')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Edit3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Edit</span>
            </Button>
            <Button size="sm" variant={activeTab === 'text' ? 'default' : 'outline'} onClick={() => setActiveTab('text')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Type className="w-5 h-5 mb-1" />
              <span className="text-xs">Text</span>
            </Button>
            <Button size="sm" variant={activeTab === 'effects' ? 'default' : 'outline'} onClick={() => setActiveTab('effects')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 mb-1" />
              <span className="text-xs">FX</span>
            </Button>
            <Button size="sm" variant={activeTab === 'captions' ? 'default' : 'outline'} onClick={() => setActiveTab('captions')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Subtitles className="w-5 h-5 mb-1" />
              <span className="text-xs">Cap</span>
            </Button>
            <Button size="sm" variant={activeTab === 'audio' ? 'default' : 'outline'} onClick={() => setActiveTab('audio')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 mb-1" />
              <span className="text-xs">Audio</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*';
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setOverlays([...overlays, {
                      id: Date.now(),
                      src: evt.target?.result,
                      x: 25,
                      y: 25,
                      width: 35,
                      height: 35,
                      zIndex: 1
                    }]);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Image className="w-5 h-5 mb-1" />
              <span className="text-xs">Overlay</span>
            </Button>
            <Button size="sm" variant={activeTab === 'animate' ? 'default' : 'outline'} onClick={() => setActiveTab('animate')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 mb-1" />
              <span className="text-xs">Animate</span>
            </Button>
            <Button size="sm" variant={activeTab === 'transitions' ? 'default' : 'outline'} onClick={() => setActiveTab('transitions')} className="h-16 min-w-16 flex flex-col items-center justify-center flex-shrink-0">
              <Filter className="w-5 h-5 mb-1" />
              <span className="text-xs">Trans</span>
            </Button>
          </div>

          {/* Tool Panels - Show selected tab content */}
          <div className="border-t border-border p-3 flex-1 overflow-y-auto z-30">
            {activeTab === 'edit' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Speed: {speed}x</Label>
                  <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={0.25} max={2} step={0.25} className="mt-2" />
                </div>
                <div>
                  <Label className="text-xs">Brightness: {brightness}%</Label>
                  <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} min={0} max={200} step={5} className="mt-2" />
                </div>
              </div>
            )}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <Input placeholder="Enter text..." value={newText} onChange={(e) => setNewText(e.target.value)} className="text-sm" />
                <div>
                  <Label className="text-xs">Color</Label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-8 rounded mt-2 cursor-pointer" />
                </div>
                <Button onClick={handleAddText} className="w-full text-sm">Add Text</Button>
              </div>
            )}
            {activeTab === 'effects' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Contrast: {contrast}%</Label>
                  <Slider value={[contrast]} onValueChange={([v]) => setContrast(v)} min={0} max={200} step={5} className="mt-2" />
                </div>
                <div>
                  <Label className="text-xs">Saturation: {saturation}%</Label>
                  <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={0} max={200} step={5} className="mt-2" />
                </div>
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="space-y-3">
                <Button className="w-full text-xs" variant="outline">Add Audio</Button>
              </div>
            )}
            {activeTab === 'captions' && (
              <div className="space-y-3">
                <Button onClick={handleGenerateCaptions} disabled={generatingCaptions} className="w-full text-sm">
                  {generatingCaptions && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Captions
                </Button>
              </div>
            )}
            {activeTab === 'animate' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Select an overlay to animate</p>
              </div>
            )}
            {activeTab === 'transitions' && (
              <div className="grid grid-cols-2 gap-2">
                {['Fade', 'Slide Left', 'Slide Right', 'Zoom In', 'Zoom Out', 'Dissolve'].map(t => (
                  <button key={t} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Tools (Desktop Only) */}
        <div className="hidden lg:flex w-80 bg-card border-l border-border flex flex-col overflow-hidden gap-1 p-1">
          {/* Media Library Panel */}
          <div className="h-64 flex-shrink-0">
            <MediaLibrary
              mediaItems={mediaItems}
              onAddMedia={(item) => setMediaItems([...mediaItems, item])}
              onRemoveMedia={(id) => setMediaItems(mediaItems.filter(m => m.id !== id))}
              onDragStart={(item) => setDraggedMedia(item)}
            />
          </div>

          {/* Tools Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden rounded-lg border border-border">
            <TabsList className="grid grid-cols-7 w-full border-b border-border sticky top-0 bg-card rounded-none">
              <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
              <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
              <TabsTrigger value="captions" className="text-xs">Captions</TabsTrigger>
              <TabsTrigger value="animate" className="text-xs">Animate</TabsTrigger>
              <TabsTrigger value="transitions" className="text-xs">Transitions</TabsTrigger>
              <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Edit Tab */}
              <TabsContent value="edit" className="p-4 space-y-4 overflow-y-auto">
                <VideoThumbnailGallery 
                  videoRef={videoRef} 
                  duration={duration} 
                  onSeek={(time) => {
                    setCurrentTime(time);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  currentTime={currentTime}
                />

                <div className="space-y-3 border-t pt-4">
                   <div>
                    <Label className="text-xs">Speed: {speed}x</Label>
                    <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={0.25} max={2} step={0.25} className="mt-2" />
                  </div>

                  <div>
                    <Label className="text-xs">Rotation: {rotation}°</Label>
                    <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={0} max={360} step={15} className="mt-2" />
                  </div>

                  <div>
                    <Label className="text-xs">Scale: {scale}%</Label>
                    <Slider value={[scale]} onValueChange={([v]) => setScale(v)} min={50} max={200} step={5} className="mt-2" />
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <div>
                      <Label className="text-xs mb-2 block">Aspect Ratio</Label>
                      <div className="grid grid-cols-2 gap-1">
                        {['16:9', '9:16', '1:1', '4:3'].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`p-2 rounded text-xs font-medium transition-all ${
                              aspectRatio === ratio
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full text-xs" variant="outline">Trim</Button>
                      <Button className="w-full text-xs" variant="outline">Crop</Button>
                      <Button className="w-full text-xs" variant="outline">Flip</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Captions Tab */}
              <TabsContent value="captions" className="p-4 space-y-4">
                <Button onClick={handleGenerateCaptions} disabled={generatingCaptions} className="w-full">
                  {generatingCaptions && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  {generatingCaptions ? 'Generating...' : 'Generate AI Captions'}
                </Button>

                {captionTracks.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium">Captions ({captionTracks.length})</p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {captionTracks.map((caption, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedCaption === idx ? 'bg-primary/20 border border-primary' : 'bg-muted border border-border'
                          }`}
                          onClick={() => {
                            setSelectedCaption(idx);
                            setCurrentTime(caption.startTime);
                            if (videoRef.current) videoRef.current.currentTime = caption.startTime;
                          }}
                        >
                          <div className="font-medium">{Math.floor(caption.startTime)}s - {Math.floor(caption.endTime)}s</div>
                          <div className="text-muted-foreground">{caption.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Animation/Keyframes Tab */}
              <TabsContent value="animate" className="p-4 space-y-4">
                <KeyframeEditor
                  elementId={selectedOverlay || 'text'}
                  keyframes={elementKeyframes[selectedOverlay || 'text'] || []}
                  currentTime={currentTime}
                  onAddKeyframe={(kf) => {
                    const id = selectedOverlay || 'text';
                    setElementKeyframes({
                      ...elementKeyframes,
                      [id]: [...(elementKeyframes[id] || []), { ...kf, id: Date.now() }]
                    });
                  }}
                  onUpdateKeyframe={(kfId, updated) => {
                    const id = selectedOverlay || 'text';
                    setElementKeyframes({
                      ...elementKeyframes,
                      [id]: (elementKeyframes[id] || []).map(k => k.id === kfId ? updated : k)
                    });
                  }}
                  onDeleteKeyframe={(kfId) => {
                    const id = selectedOverlay || 'text';
                    setElementKeyframes({
                      ...elementKeyframes,
                      [id]: (elementKeyframes[id] || []).filter(k => k.id !== kfId)
                    });
                  }}
                />
              </TabsContent>

              {/* Transitions Tab */}
              <TabsContent value="transitions" className="p-4">
                <TransitionsGallery onSelectTransition={setSelectedTransition} selected={selectedTransition} />
              </TabsContent>

              {/* Audio Tab */}
              <TabsContent value="audio" className="p-4 space-y-4">
                <div>
                  <Label className="text-xs mb-2 block">Add Audio</Label>
                  <Button className="w-full text-xs" variant="outline">Browse Music</Button>
                </div>

                {audioTracks.length > 0 && (
                  <div className="space-y-2">
                    {audioTracks.map((track) => (
                      <div key={track.id} className="p-2 bg-muted rounded">
                        <p className="text-xs font-medium truncate">{track.name}</p>
                        <Slider value={[track.volume]} onValueChange={([v]) => {}} max={100} className="mt-2" />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="p-4 space-y-4">
                <Input placeholder="Enter text..." value={newText} onChange={(e) => setNewText(e.target.value)} className="text-sm" />

                <div>
                  <Label className="text-xs mb-2 block">Quick Emoji</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '🎬', '⭐', '🎯'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewText(newText + emoji)}
                        className="p-2 hover:bg-accent rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Color</Label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-8 rounded mt-2 cursor-pointer" />
                </div>

                <div>
                  <Label className="text-xs">Size: {textSize}px</Label>
                  <Slider value={[textSize]} onValueChange={([v]) => setTextSize(v)} min={12} max={96} step={2} className="mt-2" />
                </div>

                <Button onClick={handleAddText} className="w-full">Add Text</Button>

                {textOverlays.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium">Text Overlays</p>
                    {textOverlays.map((overlay) => (
                      <div key={overlay.id} className="p-2 bg-muted rounded flex items-center justify-between text-xs">
                        <span className="truncate">{overlay.text}</span>
                        <Button variant="ghost" size="sm" onClick={() => setTextOverlays(textOverlays.filter(o => o.id !== overlay.id))} className="h-5 w-5 p-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="p-4 space-y-3">
                <div>
                  <Label className="text-xs">Brightness: {brightness}%</Label>
                  <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} min={0} max={200} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Contrast: {contrast}%</Label>
                  <Slider value={[contrast]} onValueChange={([v]) => setContrast(v)} min={0} max={200} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Saturation: {saturation}%</Label>
                  <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={0} max={200} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Hue Rotate: {hueRotate}°</Label>
                  <Slider value={[hueRotate]} onValueChange={([v]) => setHueRotate(v)} min={-180} max={180} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Temperature: {temperature}</Label>
                  <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={-50} max={50} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Vibrance: {vibrance}</Label>
                  <Slider value={[vibrance]} onValueChange={([v]) => setVibrance(v)} min={-100} max={100} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs">Blur: {blur}px</Label>
                  <Slider value={[blur]} onValueChange={([v]) => setBlur(v)} min={0} max={20} step={1} className="mt-2" />
                </div>

                <div className="pt-2 border-t space-y-2">
                  <Button 
                    className="w-full text-xs" 
                    variant={removeBackground ? "default" : "outline"}
                    onClick={() => setRemoveBackground(!removeBackground)}
                  >
                    {removeBackground ? '✓ BG Removed' : 'Remove Background'}
                  </Button>
                  
                  <div>
                    <Label className="text-xs">Upscale Quality: {upscaleQuality}x</Label>
                    <Slider value={[upscaleQuality]} onValueChange={([v]) => setUpscaleQuality(v)} min={1} max={4} step={1} className="mt-2" />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Timeline with drag zone */}
      <div className="hidden lg:flex bg-card border-t border-border h-32 overflow-hidden flex-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        e.preventDefault();
        if (draggedMedia) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newTime = pixelsToTime(x);
          setOverlays([...overlays, {
            id: Date.now(),
            src: draggedMedia.src,
            x: 20,
            y: 20,
            width: draggedMedia.type === 'video' ? 40 : 30,
            height: draggedMedia.type === 'video' ? 40 : 30,
            zIndex: 1,
            time: Math.max(0, newTime),
            duration: draggedMedia.type === 'video' ? 3 : 5
          }]);
          setDraggedMedia(null);
        }
      }}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Label className="text-xs font-semibold">Timeline</Label>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}>−</Button>
            <Button size="sm" variant="outline" onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}>+</Button>
          </div>
        </div>

        <div ref={timelineRef} className="flex-1 overflow-x-auto bg-black/50">
          <div className="relative h-full" style={{ width: `${timeToPixels(duration)}px`, minWidth: '100%' }}>
            {/* Grid lines */}
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(90deg, #333 0px, #333 1px, transparent 1px, transparent ${80 * timelineZoom}px)`,
            }} />

            {/* Video track */}
            <div className="absolute top-0 left-0 right-0 h-16 border-b border-border bg-gradient-to-b from-primary/20 to-primary/5" />

            {/* Audio track */}
            {audioTracks.length > 0 && (
              <div className="absolute left-0 right-0 h-12 border-b border-border bg-accent/10" style={{ top: '64px' }} />
            )}

            {/* Text overlays on timeline */}
            {textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="absolute h-6 bg-accent/60 rounded text-xs px-2 flex items-center truncate"
                style={{
                  left: `${timeToPixels(overlay.time)}px`,
                  width: `${timeToPixels(overlay.duration)}px`,
                  top: `${audioTracks.length > 0 ? 80 : 64}px`
                }}
                title={overlay.text}
              >
                {overlay.text}
              </div>
            ))}

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-1 bg-destructive" style={{ left: `${timeToPixels(currentTime)}px` }} />
          </div>
        </div>
      </div>

      {/* Context Menu - Hidden */}
      {false && (
        <div className="hidden fixed inset-0 z-50 items-center justify-center bg-black/50" onClick={() => setShowContextMenu(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-3 sm:p-4 max-w-2xl w-[95%] sm:w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Share2 className="w-5 h-5 mb-1" />
                <span className="text-xs">Share</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Edit3 className="w-5 h-5 mb-1" />
                <span className="text-xs">Edit</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Link2 className="w-5 h-5 mb-1" />
                <span className="text-xs">Link</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Type className="w-5 h-5 mb-1" />
                <span className="text-xs">Transcript</span>
              </Button>

              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Volume2 className="w-5 h-5 mb-1" />
                <span className="text-xs">Noise</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Music className="w-5 h-5 mb-1" />
                <span className="text-xs">Audio</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Enhance</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Music className="w-5 h-5 mb-1" />
                <span className="text-xs">Music</span>
              </Button>

              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Sync</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Move className="w-5 h-5 mb-1" />
                <span className="text-xs">Transform</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Auto Frame</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Stabilize</span>
              </Button>

              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">AI BG</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Trash2 className="w-5 h-5 mb-1" />
                <span className="text-xs">Remove</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Expand</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Remix</span>
              </Button>

              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Eye className="w-5 h-5 mb-1" />
                <span className="text-xs">Eye</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Lightbulb className="w-5 h-5 mb-1" />
                <span className="text-xs">Relight</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Layers className="w-5 h-5 mb-1" />
                <span className="text-xs">Opacity</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Blur</span>
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-20 flex flex-col items-center justify-center"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,video/*';
                  input.onchange = (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setOverlays([...overlays, {
                          id: Date.now(),
                          src: evt.target?.result,
                          x: 20,
                          y: 20,
                          width: 40,
                          height: 40
                        }]);
                        setShowContextMenu(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <Copy className="w-5 h-5 mb-1" />
                <span className="text-xs">Overlay</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Settings className="w-5 h-5 mb-1" />
                <span className="text-xs">Adjust</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Filter className="w-5 h-5 mb-1" />
                <span className="text-xs">Filters</span>
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-16 sm:h-20 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Speed</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Controls */}
      {selectedOverlay && (
        <div className="absolute bottom-20 sm:bottom-48 right-2 sm:right-4 bg-card border border-border rounded-lg shadow-xl z-50 p-3 sm:p-4 w-56 sm:w-64 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold">Overlay Controls</Label>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setOverlays(overlays.filter(o => o.id !== selectedOverlay))}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div>
            <Label className="text-xs">Position X</Label>
            <Slider value={[overlays.find(o => o.id === selectedOverlay)?.x || 0]} onValueChange={([v]) => setOverlays(overlays.map(o => o.id === selectedOverlay ? {...o, x: v} : o))} min={0} max={100} step={1} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Position Y</Label>
            <Slider value={[overlays.find(o => o.id === selectedOverlay)?.y || 0]} onValueChange={([v]) => setOverlays(overlays.map(o => o.id === selectedOverlay ? {...o, y: v} : o))} min={0} max={100} step={1} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Width</Label>
            <Slider value={[overlays.find(o => o.id === selectedOverlay)?.width || 40]} onValueChange={([v]) => setOverlays(overlays.map(o => o.id === selectedOverlay ? {...o, width: v} : o))} min={5} max={100} step={1} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Height</Label>
            <Slider value={[overlays.find(o => o.id === selectedOverlay)?.height || 40]} onValueChange={([v]) => setOverlays(overlays.map(o => o.id === selectedOverlay ? {...o, height: v} : o))} min={5} max={100} step={1} className="mt-1" />
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="hidden lg:flex bg-card border-t border-border px-4 py-3 items-center justify-between overflow-x-auto gap-2 flex-shrink-0 z-30">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowContextMenu(!showContextMenu)}>
            <Edit3 className="w-4 h-4 mr-1" />
            Tools
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setActiveTab('audio')}>
            <Music className="w-4 h-4 mr-1" />
            Audio
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setActiveTab('text')}>
            <Type className="w-4 h-4 mr-1" />
            Text
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setActiveTab('effects')}>
            <Zap className="w-4 h-4 mr-1" />
            Effects
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*';
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setOverlays([...overlays, {
                      id: Date.now(),
                      src: evt.target?.result,
                      x: 25,
                      y: 25,
                      width: 35,
                      height: 35,
                      zIndex: 1
                    }]);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            <Image className="w-4 h-4 mr-1" />
            Overlay
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            <Settings className="w-4 h-4 mr-1" />
            Adjust
          </Button>
        </div>
        <Button onClick={async () => {
          try {
            await onSave?.({ 
              brightness, contrast, saturation, hueRotate, blur, temperature, vibrance, rotation, scale, speed, 
              textOverlays, overlays, captionTracks, elementKeyframes, selectedTransition,
              removeBackground, upscaleQuality, aspectRatio,
              filters: { brightness, contrast, saturation, hueRotate, blur, temperature, vibrance, rotation, scale },
              effects: { removeBackground, upscaleQuality }
            });
          } catch (error) {
            console.error('Save failed:', error);
          }
        }}>
          <Download className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}