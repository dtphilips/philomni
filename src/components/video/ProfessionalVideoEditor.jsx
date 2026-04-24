import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit3, Music, Type, Zap, Image, Subtitles, Filter, Settings,
  Wand2, Layers, Play, Pause, RotateCcw, Volume2, Download,
  MoreVertical, Trash2, Copy, Lock
} from 'lucide-react';

export default function ProfessionalVideoEditor({ videoUrl, onSave }) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Video edits
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [temperature, setTemperature] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);

  // Timeline tracks
  const [videoClips, setVideoClips] = useState([{ id: 1, type: 'video', start: 0, duration: duration }]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [effectsList, setEffectsList] = useState([]);

  // UI
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const timeToPixels = (time) => time * 100 * zoom;
  const pixelsToTime = (pixels) => pixels / (100 * zoom);

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Brightness</Label>
          <span className="text-xs text-muted-foreground">{brightness}%</span>
        </div>
        <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} min={0} max={200} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Contrast</Label>
          <span className="text-xs text-muted-foreground">{contrast}%</span>
        </div>
        <Slider value={[contrast]} onValueChange={([v]) => setContrast(v)} min={0} max={200} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Saturation</Label>
          <span className="text-xs text-muted-foreground">{saturation}%</span>
        </div>
        <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={0} max={200} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Temperature</Label>
          <span className="text-xs text-muted-foreground">{temperature > 0 ? '+' : ''}{temperature}</span>
        </div>
        <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={-50} max={50} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Vibrance</Label>
          <span className="text-xs text-muted-foreground">{vibrance}</span>
        </div>
        <Slider value={[vibrance]} onValueChange={([v]) => setVibrance(v)} min={-100} max={100} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Hue Rotate</Label>
          <span className="text-xs text-muted-foreground">{hueRotate}°</span>
        </div>
        <Slider value={[hueRotate]} onValueChange={([v]) => setHueRotate(v)} min={-180} max={180} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Blur</Label>
          <span className="text-xs text-muted-foreground">{blur}px</span>
        </div>
        <Slider value={[blur]} onValueChange={([v]) => setBlur(v)} min={0} max={20} step={1} />
      </div>
    </div>
  );

  const TransformControls = () => (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Rotation</Label>
          <span className="text-xs text-muted-foreground">{rotation}°</span>
        </div>
        <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={0} max={360} step={15} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Scale</Label>
          <span className="text-xs text-muted-foreground">{scale}%</span>
        </div>
        <Slider value={[scale]} onValueChange={([v]) => setScale(v)} min={50} max={200} step={5} />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <Label className="text-xs">Speed</Label>
          <span className="text-xs text-muted-foreground">{speed}x</span>
        </div>
        <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={0.25} max={2} step={0.25} />
      </div>
    </div>
  );

  const TextControls = () => {
    const [text, setText] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [fontSize, setFontSize] = useState(24);

    return (
      <div className="space-y-4">
        <Input placeholder="Enter text..." value={text} onChange={(e) => setText(e.target.value)} />
        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2 mt-2">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-8 rounded" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs">Font Size</Label>
            <span className="text-xs">{fontSize}px</span>
          </div>
          <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={96} step={2} />
        </div>

        <Button className="w-full" onClick={() => {
          if (text) {
            setTextOverlays([...textOverlays, { id: Date.now(), text, color: textColor, size: fontSize, time: currentTime }]);
            setText('');
          }
        }}>Add Text</Button>

        {textOverlays.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium">Text Overlays ({textOverlays.length})</p>
            {textOverlays.map((overlay) => (
              <div key={overlay.id} className="p-2 bg-muted rounded flex justify-between items-center text-xs">
                <span>{overlay.text}</span>
                <Button variant="ghost" size="sm" onClick={() => setTextOverlays(textOverlays.filter(o => o.id !== overlay.id))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-4 flex justify-between items-center">
        <h2 className="font-semibold">Professional Video Editor</h2>
        <Button onClick={() => onSave?.({ filters: { brightness, contrast, saturation, temperature, vibrance, hueRotate, blur }, transform: { rotation, scale, speed }, textOverlays, audioTracks })}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-card border-r border-border overflow-y-auto p-4">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="adjust" className="text-xs">Adjust</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
              <TabsTrigger value="text" className="text-xs col-span-2">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="adjust">
              <FilterControls />
            </TabsContent>

            <TabsContent value="effects">
              <TransformControls />
            </TabsContent>

            <TabsContent value="text">
              <TextControls />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`,
                transform: `rotate(${rotation}deg) scale(${scale / 100})`,
              }}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration);
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          </div>

          {/* Playback Controls */}
          <div className="bg-card border-t border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <span className="text-sm text-muted-foreground w-20">
                {Math.floor(currentTime)}s / {Math.floor(duration)}s
              </span>
              <Slider value={[currentTime]} onValueChange={([v]) => { setCurrentTime(v); if (videoRef.current) videoRef.current.currentTime = v; }} max={duration || 100} step={0.1} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border-t border-border p-4 max-h-48 overflow-auto">
        <div className="mb-2 flex justify-between items-center">
          <Label className="text-xs font-semibold">Timeline</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>−</Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>+</Button>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div ref={timelineRef} className="space-y-2 border rounded bg-muted/50 p-2">
          {/* Video Track */}
          <div className="bg-card border border-border rounded p-2">
            <p className="text-xs font-medium mb-2">Video</p>
            <div className="relative h-12 bg-black rounded overflow-hidden" style={{ width: `${timeToPixels(duration)}px` }}>
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #333 0px, #333 1px, transparent 1px, transparent 40px)' }} />
              <div className="absolute h-full bg-primary/60" style={{ width: `${timeToPixels(duration)}px` }} />
              <div className="absolute top-0 bg-destructive w-1 h-full" style={{ left: `${timeToPixels(currentTime)}px` }} />
            </div>
          </div>

          {/* Audio Track */}
          {audioTracks.length > 0 && (
            <div className="bg-card border border-border rounded p-2">
              <p className="text-xs font-medium mb-2">Audio ({audioTracks.length})</p>
              <div className="relative h-8 bg-muted rounded" style={{ width: `${timeToPixels(duration)}px` }} />
            </div>
          )}

          {/* Text Track */}
          {textOverlays.length > 0 && (
            <div className="bg-card border border-border rounded p-2">
              <p className="text-xs font-medium mb-2">Text ({textOverlays.length})</p>
              <div className="relative h-8 space-y-1">
                {textOverlays.map((overlay) => (
                  <div key={overlay.id} className="bg-accent/60 h-5 rounded text-xs px-1 flex items-center truncate" style={{ width: `${Math.max(60, timeToPixels(2))}px`, marginLeft: `${timeToPixels(overlay.time)}px` }}>
                    {overlay.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}