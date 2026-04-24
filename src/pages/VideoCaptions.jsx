import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Play, Pause, Download, Zap } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function VideoCaptions() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: draft } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const drafts = await base44.entities.VideoDraft.filter({});
      return drafts.find(d => d.id === draftId);
    },
    enabled: !!draftId
  });

  const { data: captions } = useQuery({
    queryKey: ['captions', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const result = await base44.entities.VideoCaption.filter({ draft_id: draftId });
      return result[0];
    },
    enabled: !!draftId
  });

  const handleGenerateCaptions = async () => {
    if (!draft?.video_url) {
      toast.error('No video to analyze');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCaptions', { draft_id: draftId });
      queryClient.invalidateQueries({ queryKey: ['captions', draftId] });
      toast.success('Captions generated');
    } catch (error) {
      toast.error('Failed to generate captions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditCaption = (caption) => {
    setEditingId(caption.id);
    setEditingText(caption.text);
  };

  const handleSaveCaption = async (captionId) => {
    if (!editingText.trim()) {
      toast.error('Caption text cannot be empty');
      return;
    }
    try {
      const updated = {
        ...captions,
        captions: captions.captions.map(c =>
          c.id === captionId ? { ...c, text: editingText, edited: true } : c
        )
      };
      await base44.entities.VideoCaption.update(captions.id, updated);
      queryClient.invalidateQueries({ queryKey: ['captions', draftId] });
      setEditingId(null);
      toast.success('Caption updated');
    } catch (error) {
      toast.error('Failed to save caption');
    }
  };

  const handleDeleteCaption = async (captionId) => {
    try {
      const updated = {
        ...captions,
        captions: captions.captions.filter(c => c.id !== captionId)
      };
      await base44.entities.VideoCaption.update(captions.id, updated);
      queryClient.invalidateQueries({ queryKey: ['captions', draftId] });
      toast.success('Caption deleted');
    } catch (error) {
      toast.error('Failed to delete caption');
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  if (!draft) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!captions) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Auto Captions</h1>
          <p className="text-muted-foreground text-sm mb-6">{draft?.title}</p>

          <Card className="text-center py-12">
            <CardContent>
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No captions yet. Generate them using AI.</p>
              <Button onClick={handleGenerateCaptions} disabled={isGenerating} className="gap-2">
                {isGenerating ? 'Generating...' : 'Generate Captions'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Captions</h1>
          <p className="text-muted-foreground text-sm mt-1">{draft?.title}</p>
        </div>

        {/* Video Preview */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                {draft.video_url ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                  >
                    <source src={draft.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <p className="text-muted-foreground">No video URL found</p>
                )}
              </div>

              {/* Current Caption Display */}
              {captions.captions && (
                <div className="p-3 rounded-lg bg-black text-white text-center min-h-12 flex items-center justify-center">
                  {captions.captions.find(c => currentTime >= c.start_time && currentTime <= c.end_time)?.text || 'No caption'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Full Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={captions.transcript}
              readOnly
              className="h-24 resize-none"
            />
          </CardContent>
        </Card>

        {/* Captions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Captions ({captions.captions?.length || 0})</CardTitle>
              <Button size="sm" onClick={handleGenerateCaptions} disabled={isGenerating} className="gap-1">
                <Zap className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {captions.captions?.map(caption => (
                <div key={caption.id} className="p-4 rounded-lg border border-border hover:bg-muted/50">
                  {editingId === caption.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Start (s)</label>
                          <Input type="number" value={caption.start_time} readOnly />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">End (s)</label>
                          <Input type="number" value={caption.end_time} readOnly />
                        </div>
                      </div>
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveCaption(caption.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {caption.start_time.toFixed(2)}s - {caption.end_time.toFixed(2)}s
                        </p>
                        <p className="text-sm">{caption.text}</p>
                        {caption.edited && (
                          <p className="text-xs text-blue-600 mt-1">✓ Edited</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCaption(caption)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCaption(caption.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export SRT
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export VTT
          </Button>
        </div>
      </div>
    </div>
  );
}