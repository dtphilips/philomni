import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Clock, RotateCcw, Download, Trash2, Copy, Save, Loader2, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function AudioRevisionHistory({ projectId, isOpen, onClose, onRevisionRestored }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [savingAs, setSavingAs] = useState(null);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadRevisions();
    }
  }, [isOpen, projectId]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const items = (await supabase.from('audioRevisions').select('*').eq('project_id', projectId).order('revision_number', { ascending: false })).data ?? [];
      setRevisions(items);
    } catch (error) {
      console.error('Failed to load revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (revisionId) => {
    if (!confirm('Restore this version? Your current work will be saved first.')) return;

    setRestoring(revisionId);
    try {
      // Create a snapshot of current state first
      /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);

      // Restore the selected revision
      const response = /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);

      await loadRevisions();
      if (onRevisionRestored) {
        onRevisionRestored(response.revision);
      }
    } catch (error) {
      console.error('Failed to restore:', error);
    } finally {
      setRestoring(null);
    }
  };

  const handleSaveAsSnapshot = async () => {
    if (!newSnapshotName.trim()) return;

    setSavingAs(true);
    try {
      /* TODO: migrate base44.functions.invoke */ Promise.resolve(null),
        description: 'Manually saved snapshot',
        is_auto_save: false
      });

      setNewSnapshotName('');
      setShowSaveDialog(false);
      await loadRevisions();
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    } finally {
      setSavingAs(false);
    }
  };

  const handleDelete = async (revisionId) => {
    if (!confirm('Delete this revision? This cannot be undone.')) return;

    try {
      await supabase.from('audioRevisions').delete().eq('id', revisionId);
      await loadRevisions();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleDownload = (revision) => {
    if (!revision.audio_url || revision.audio_url === 'current-state-backup' || revision.audio_url === 'current-state') {
      alert('This revision does not have a downloadable audio file.');
      return;
    }

    const link = document.createElement('a');
    link.href = revision.audio_url;
    link.download = `${revision.snapshot_name || 'revision'}.wav`;
    link.click();
  };

  const currentRevision = revisions.find(r => r.is_current);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Audio Revision History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save Current State Button */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <Button
              onClick={() => setShowSaveDialog(true)}
              className="w-full gap-2"
            >
              <Save className="w-4 h-4" />
              Save Current Version as Snapshot
            </Button>
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
              <h4 className="font-semibold text-sm">Name this snapshot</h4>
              <Input
                placeholder="e.g., Final Mix, Before Effects, Clean Version"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAsSnapshot}
                  disabled={!newSnapshotName.trim() || savingAs}
                  className="flex-1 gap-2"
                >
                  {savingAs ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Snapshot'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewSnapshotName('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Revisions List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No revisions yet. Save a snapshot to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {revisions.map((revision, index) => (
                <div
                  key={revision.id}
                  className={`border rounded-lg p-4 space-y-2 transition-all ${
                    revision.is_current
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-muted/20 border-border hover:border-primary/30'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {revision.snapshot_name}
                        </h4>
                        {revision.is_current && (
                          <Badge className="text-xs gap-1 bg-primary/20 text-primary border-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Current
                          </Badge>
                        )}
                        {revision.is_auto_save && (
                          <Badge variant="outline" className="text-xs">
                            Auto-save
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Revision {revision.revision_number} • {format(new Date(revision.created_date), 'MMM d, yyyy h:mm a')}
                      </p>
                      {revision.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {revision.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {revision.metadata && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {revision.metadata.duration && (
                        <span>Duration: {revision.metadata.duration}s</span>
                      )}
                      {revision.metadata.total_comments && (
                        <span>Comments: {revision.metadata.total_comments}</span>
                      )}
                      {revision.metadata.has_effects && (
                        <Badge variant="outline" className="text-xs">
                          Effects Applied
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Timeline Comments Preview */}
                  {revision.timeline_comments && revision.timeline_comments.length > 0 && (
                    <div className="bg-muted/30 rounded p-2 mt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Timeline Comments ({revision.timeline_comments.length})
                      </p>
                      {revision.timeline_comments.slice(0, 2).map((comment, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium">{comment.author_name}</span>
                          {' at '}{comment.timestamp}s: {comment.text_summary}
                        </div>
                      ))}
                      {revision.timeline_comments.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{revision.timeline_comments.length - 2} more comments
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    {!revision.is_current && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(revision.id)}
                        disabled={restoring === revision.id}
                        className="gap-1.5 text-xs flex-1"
                      >
                        {restoring === revision.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                    <button
                      onClick={() => handleDownload(revision)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title="Download audio file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(revision.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive ml-auto"
                      title="Delete revision"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}