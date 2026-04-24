import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Play, Pause, Loader2, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceNoteRecorder from './VoiceNoteRecorder';

export default function TimelineVoiceNotes({ projectId, currentTime = 0, duration = 100, onNoteAdded }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingAt, setRecordingAt] = useState(null);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadNotes();
    loadUser();
  }, [projectId]);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const voiceNotes = await base44.entities.AudioVoiceNote.filter({
        project_id: projectId,
      }, '-created_date');
      setNotes(voiceNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (audioUrl, duration) => {
    try {
      await base44.entities.AudioVoiceNote.create({
        project_id: projectId,
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        audio_url: audioUrl,
        timestamp: Math.round(recordingAt),
        duration: Math.round(duration),
      });
      setRecordingAt(null);
      loadNotes();
      if (onNoteAdded) onNoteAdded();
    } catch (error) {
      console.error('Failed to create voice note:', error);
    }
  };

  const handleToggleResolve = async (noteId, isResolved) => {
    try {
      await base44.entities.AudioVoiceNote.update(noteId, {
        is_resolved: !isResolved,
      });
      loadNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await base44.entities.AudioVoiceNote.delete(noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPositionPercent = (timestamp) => {
    return Math.min(100, (timestamp / duration) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Timeline Track */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Voice Note Comments
          </h3>
          <span className="text-xs text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {/* Timeline visualization */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="relative h-2 bg-background rounded-full overflow-hidden">
            {/* Progress bar */}
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${getPositionPercent(currentTime)}%` }}
            />

            {/* Voice note markers */}
            {notes.map(note => (
              <div
                key={note.id}
                className="absolute top-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${getPositionPercent(note.timestamp)}%` }}
              >
                <div className="w-3 h-3 bg-primary rounded-full -ml-1.5 border-2 border-background hover:scale-125 transition-transform" />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {note.author_name} @ {formatTime(note.timestamp)}
                </div>
              </div>
            ))}
          </div>

          {/* Current time display */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Record button */}
        {!recordingAt && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRecordingAt(currentTime)}
            className="w-full"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-2" />
            Add Voice Note at {formatTime(currentTime)}
          </Button>
        )}

        {/* Recording interface */}
        {recordingAt !== null && (
          <VoiceNoteRecorder
            timestamp={recordingAt}
            onRecordComplete={handleAddNote}
            onCancel={() => setRecordingAt(null)}
          />
        )}
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No voice notes yet. Add one to provide feedback!
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                note.is_resolved ? 'bg-muted/50 border-border/50' : 'bg-card border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
                  {note.author_avatar ? (
                    <img src={note.author_avatar} alt={note.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium">{note.author_name?.[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{note.author_name}</p>
                    <Badge variant="secondary" className="text-xs">
                      @ {formatTime(note.timestamp)}
                    </Badge>
                    {note.is_resolved && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                        Resolved
                      </Badge>
                    )}
                  </div>

                  {/* Audio player */}
                  <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPlayingNoteId(playingNoteId === note.id ? null : note.id)}
                      className="h-6 w-6 p-0"
                    >
                      {playingNoteId === note.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <audio
                      src={note.audio_url}
                      onPlay={() => setPlayingNoteId(note.id)}
                      onPause={() => setPlayingNoteId(null)}
                      onEnded={() => setPlayingNoteId(null)}
                      className="h-6 flex-1 rounded"
                      controls
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {note.duration}s
                    </span>
                  </div>

                  {note.text_summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {note.text_summary}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleResolve(note.id, note.is_resolved)}
                    className={cn(
                      'h-7 w-7 p-0',
                      note.is_resolved ? 'text-green-600' : 'text-muted-foreground'
                    )}
                    title={note.is_resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}