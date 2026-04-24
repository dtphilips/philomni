import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Mic, Square, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VoiceNoteRecorder({ timestamp, onRecordComplete, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Failed to access microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadVoiceNote = async (blob) => {
    try {
      setUploading(true);
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const response = await base44.integrations.Core.UploadFile({ file });
      onRecordComplete(response.file_url, blob.size);
    } catch (error) {
      console.error('Failed to upload voice note:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground mb-2">
          Record at {new Date(timestamp * 1000).toISOString().substr(11, 8)}
        </p>
        <div className="flex items-center gap-2">
          {recording && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-600 font-medium">Recording...</span>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-xs text-primary font-medium">Uploading...</span>
            </div>
          )}
          {!recording && !uploading && (
            <span className="text-xs text-muted-foreground">Click to record feedback</span>
          )}
        </div>
      </div>

      {!recording && !uploading && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={startRecording}
            className="h-8 px-2.5"
          >
            <Mic className="w-3.5 h-3.5 mr-1.5" />
            Record
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-8 px-2"
          >
            Cancel
          </Button>
        </>
      )}

      {recording && (
        <Button
          size="sm"
          variant="destructive"
          onClick={stopRecording}
          className="h-8 px-2.5"
        >
          <Square className="w-3 h-3 mr-1.5" />
          Stop
        </Button>
      )}
    </div>
  );
}