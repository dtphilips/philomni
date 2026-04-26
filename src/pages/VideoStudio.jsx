import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Sparkles, Film, Upload, Video, Edit } from 'lucide-react';
import ShareVideoButton from '@/components/video/ShareVideoButton';
import VideoEditor from '@/components/video/VideoEditor';

export default function VideoStudio() {
  const { user } = useOutletContext();

  // Text-to-video state
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  // Image-to-video state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageMotion, setImageMotion] = useState('slow-zoom');
  const [convertingVideo, setConvertingVideo] = useState(false);
  const fileInputRef = useRef(null);

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedUrl(null);

    const llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Generate a ${duration}s video concept: ${prompt}` }) });
    const llmData = await llmRes.json();
    // AI video generation not yet available — show placeholder
    setGeneratedUrl(null);
    setGenerating(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConvertToVideo = async () => {
    if (!imageFile) return;
    setConvertingVideo(true);
    setGeneratedUrl(null);

    // Upload image first
    const uploadRes = await (async () => {
  const _uPath = `uploads/${Date.now()}-${imageFile.name}`;
  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, imageFile, { upsert: true });
  if (_uErr) throw _uErr;
  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
  return { file_url: _uUrl };
})();

    // Use uploaded image URL for video conversion (AI video gen placeholder)
    setGeneratedUrl(uploadRes.file_url);
    setConvertingVideo(false);
  };

  const downloadVideo = async () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = 'ai-video.mp4';
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          Video Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Create AI videos from text or animate your images</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab('text-to-video')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'text-to-video'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Text to Video
        </button>
        <button
          onClick={() => setActiveTab('image-to-video')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'image-to-video'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Video className="w-4 h-4 inline mr-2" />
          Image to Video
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: Controls */}
        <div className="space-y-5">
          {activeTab === 'text-to-video' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Describe Your Video
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A serene forest with sunlight filtering through trees, birds flying overhead, peaceful nature ambience"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration: {duration}s
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Longer videos take more time to generate</p>
              </div>

              <Button
                onClick={handleGenerateVideo}
                disabled={generating || !prompt.trim()}
                size="lg"
                className="w-full gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating video...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Video</>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Upload Image
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 transition-colors text-center"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Motion Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'slow-zoom', label: 'Slow Zoom' },
                    { id: 'pan-left', label: 'Pan Left' },
                    { id: 'pan-right', label: 'Pan Right' },
                    { id: 'gentle-float', label: 'Gentle Float' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setImageMotion(style.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        imageMotion === style.id
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <p className="text-xs font-medium">{style.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration: {duration}s
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleConvertToVideo}
                disabled={convertingVideo || !selectedImage}
                size="lg"
                className="w-full gap-2"
              >
                {convertingVideo ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                ) : (
                  <><Video className="w-4 h-4" /> Convert to Video</>
                )}
              </Button>
            </>
          )}
        </div>

        {/* RIGHT: Preview */}
        <div className="space-y-5">
          {/* Video preview */}
          <div className="aspect-video rounded-2xl overflow-hidden bg-muted border border-border relative">
            {(generating || convertingVideo) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-medium">Creating your video...</p>
              </div>
            )}

            {!generating && !convertingVideo && !generatedUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Film className="w-12 h-12 opacity-20" />
                <p className="text-sm">Your video will appear here</p>
              </div>
            )}

            {generatedUrl && (
              <video
                src={generatedUrl}
                controls
                crossOrigin="anonymous"
                className="w-full h-full"
                style={{ background: '#000' }}
              />
            )}
          </div>

          {/* Image preview for image-to-video */}
          {activeTab === 'image-to-video' && selectedImage && !generatedUrl && (
            <div className="aspect-video rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Actions */}
          {generatedUrl && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditorOpen(true)}
                className="gap-2 flex-1"
              >
                <Edit className="w-4 h-4" /> Edit
              </Button>
              <Button variant="outline" onClick={downloadVideo} className="gap-2 flex-1">
                <Download className="w-4 h-4" /> Download
              </Button>
              <ShareVideoButton
                user={user}
                videoUrl={generatedUrl}
                prompt={prompt}
                videoType={activeTab}
              />
            </div>
          )}

          <VideoEditor
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            videoUrl={generatedUrl}
            onSave={async (edits) => {
              console.log('Video edits:', edits);
              setIsEditorOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}