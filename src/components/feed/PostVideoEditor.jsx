import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Type, Loader2, Zap, Gauge, Scissors, Smile, RotateCw, Square, Wand2, Users, Subtitles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import VideoTransitions from './VideoTransitions';
import CollaborativeVideoEditor from './CollaborativeVideoEditor';

export default function PostVideoEditor({ isOpen, onClose, videoUrl, onSave, projectId }) {
  const [activeTab, setActiveTab] = useState('text');
  const [textOverlays, setTextOverlays] = useState([]);
  const [musicUrl, setMusicUrl] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState('20');
  const [isSaving, setIsSaving] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [captions, setCaptions] = useState('');
  const [stickers, setStickers] = useState([]);
  const [flip, setFlip] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [isCollaborativeOpen, setIsCollaborativeOpen] = useState(false);
  const videoRef = useRef(null);

  const STICKER_EMOJIS = ['😂', '❤️', '🔥', '👌', '✨', '🎉', '💯', '😍', '🚀', '⭐', '👏', '💪'];

  const addSticker = (emoji) => {
    setStickers([
      ...stickers,
      { id: Date.now(), emoji, x: 50, y: 50 }
    ]);
  };

  const removeSticker = (id) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    setTextOverlays([
      ...textOverlays,
      { id: Date.now(), text: currentText, color: textColor, size: textSize, position: 'bottom' }
    ]);
    setCurrentText('');
  };

  const removeTextOverlay = (id) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setMusicUrl(response.file_url);
      toast.success('Music added');
    } catch (error) {
      toast.error('Failed to upload music');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        textOverlays,
        musicUrl,
        videoUrl,
        filters: { brightness, contrast, saturation },
        speed,
        stickers,
        flip,
        aspectRatio,
        transition: selectedTransition,
        trim: { start: trimStart, end: trimEnd },
        captions
      });
      setTextOverlays([]);
      setMusicUrl('');
      setCurrentText('');
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setSpeed(1);
      setStickers([]);
      setFlip('none');
      setAspectRatio('16:9');
      setSelectedTransition(null);
      onClose();
    } catch (error) {
      toast.error('Failed to save changes');
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>Add text overlays, music, and customize your video</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Video Preview */}
          <div className="space-y-3">
            <div className={`relative rounded-lg overflow-hidden bg-black ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
              <video
               ref={videoRef}
               src={videoUrl}
               crossOrigin="anonymous"
               controls
               onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
               style={{
                 filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                 transform: flip === 'horizontal' ? 'scaleX(-1)' : flip === 'vertical' ? 'scaleY(-1)' : 'none',
               }}
               className="w-full h-full object-cover"
              />
              {/* Text Overlays & Stickers Preview */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4">
                {textOverlays.map(overlay => (
                  <div
                    key={overlay.id}
                    style={{
                      color: overlay.color,
                      fontSize: `${overlay.size}px`,
                      fontWeight: 'bold',
                      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                      marginBottom: '8px'
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}
              </div>
              {stickers.map(sticker => (
                <div
                  key={sticker.id}
                  className="absolute text-4xl pointer-events-none"
                  style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Preview</p>
          </div>

          {/* Editor Controls */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7 text-xs">
                <TabsTrigger value="text" className="px-1">Text</TabsTrigger>
                <TabsTrigger value="filters" className="px-1">Filters</TabsTrigger>
                <TabsTrigger value="stickers" className="px-1">Stickers</TabsTrigger>
                <TabsTrigger value="transitions" className="px-1">FX</TabsTrigger>
                <TabsTrigger value="trim" className="px-1">Trim</TabsTrigger>
                <TabsTrigger value="captions" className="px-1">Caption</TabsTrigger>
                <TabsTrigger value="audio" className="px-1">Audio</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Add Text Overlay</Label>
                  <Textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder="Enter text..."
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 w-16 rounded cursor-pointer"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="text-xs flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Text Size: {textSize}px</Label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <Button onClick={addTextOverlay} className="w-full" variant="outline">
                  <Type className="w-4 h-4 mr-2" /> Add Text
                </Button>

                {textOverlays.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground">Text Overlays ({textOverlays.length})</p>
                    {textOverlays.map(overlay => (
                      <div key={overlay.id} className="p-2 rounded border border-border flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: overlay.color }}>
                            {overlay.text}
                          </p>
                          <p className="text-xs text-muted-foreground">{overlay.size}px</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextOverlay(overlay.id)}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transitions" className="space-y-4">
                <VideoTransitions
                  onSelect={setSelectedTransition}
                  selectedTransition={selectedTransition}
                />
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Brightness: {brightness}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Contrast: {contrast}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Saturation: {saturation}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                  }}
                >
                  Reset Filters
                </Button>
              </TabsContent>

              <TabsContent value="stickers" className="space-y-4">
                <Label className="text-sm font-medium">Add Stickers & Emojis</Label>
                <div className="grid grid-cols-4 gap-2">
                  {STICKER_EMOJIS.map(emoji => (
                    <Button
                      key={emoji}
                      variant="outline"
                      onClick={() => addSticker(emoji)}
                      className="text-xl p-2 h-auto"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>

                {stickers.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground">Stickers ({stickers.length})</p>
                    {stickers.map(sticker => (
                      <div key={sticker.id} className="p-2 rounded border border-border flex items-center justify-between">
                        <span className="text-2xl">{sticker.emoji}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSticker(sticker.id)}
                          className="text-destructive text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trim" className="space-y-4">
               <div>
                 <Label className="text-sm font-medium">Trim Video</Label>
                 <div className="space-y-3 mt-2">
                   <div>
                     <p className="text-xs text-muted-foreground mb-1">Start: {Math.round(trimStart)}s</p>
                     <input
                       type="range"
                       min="0"
                       max={videoDuration || 0}
                       step="0.1"
                       value={trimStart}
                       onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd || videoDuration))}
                       className="w-full"
                     />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground mb-1">End: {Math.round(trimEnd || videoDuration)}s</p>
                     <input
                       type="range"
                       min="0"
                       max={videoDuration || 0}
                       step="0.1"
                       value={trimEnd || videoDuration}
                       onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart))}
                       className="w-full"
                     />
                   </div>
                   <div className="p-2 rounded bg-muted text-xs text-muted-foreground">
                     Duration: {Math.round((trimEnd || videoDuration) - trimStart)}s
                   </div>
                 </div>
               </div>
              </TabsContent>

              <TabsContent value="captions" className="space-y-4">
               <div>
                 <Label className="text-sm font-medium">Add Captions</Label>
                 <Textarea
                   value={captions}
                   onChange={(e) => setCaptions(e.target.value)}
                   placeholder="Enter captions or press Ctrl+Space for line breaks..."
                   rows={4}
                   className="mt-1 text-sm"
                 />
               </div>
               {captions && (
                 <div className="p-3 rounded-lg bg-black text-white text-center text-sm whitespace-pre-wrap">
                   {captions}
                 </div>
               )}
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Speed: {speed}x</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.25"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                    <button onClick={() => setSpeed(0.5)} className="px-2 py-1 hover:bg-muted rounded">0.5x</button>
                    <button onClick={() => setSpeed(1)} className="px-2 py-1 hover:bg-muted rounded">Normal</button>
                    <button onClick={() => setSpeed(1.5)} className="px-2 py-1 hover:bg-muted rounded">1.5x</button>
                    <button onClick={() => setSpeed(2)} className="px-2 py-1 hover:bg-muted rounded">2x</button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Flip</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={flip === 'horizontal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFlip(flip === 'horizontal' ? 'none' : 'horizontal')}
                      className="text-xs"
                    >
                      ↔️ Horizontal
                    </Button>
                    <Button
                      variant={flip === 'vertical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFlip(flip === 'vertical' ? 'none' : 'vertical')}
                      className="text-xs"
                    >
                      ↕️ Vertical
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Aspect Ratio</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {['16:9', '9:16', '1:1'].map(ratio => (
                      <Button
                        key={ratio}
                        variant={aspectRatio === ratio ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAspectRatio(ratio)}
                        className="text-xs"
                      >
                        {ratio}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Add Background Music</Label>
                  <div className="relative mt-1">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="w-full gap-2">
                      <Music className="w-4 h-4" />
                      Choose Audio
                    </Button>
                  </div>
                </div>

                {musicUrl && (
                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <p className="text-sm text-muted-foreground">✓ Music added</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMusicUrl('')}
                      className="text-destructive mt-2"
                    >
                      Remove Music
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex gap-2 justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsCollaborativeOpen(true)}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Collaborate
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>

        {projectId && (
          <CollaborativeVideoEditor
            isOpen={isCollaborativeOpen}
            onClose={() => setIsCollaborativeOpen(false)}
            projectId={projectId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}