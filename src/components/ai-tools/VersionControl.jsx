import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Eye, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VersionControl({ contentId, contentType, currentTitle, onRevert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', contentId],
    queryFn: async () => {
      return supabase.from('contentVersions').select('*') /* TODO filter: {
        content_id: contentId,
        content_type: contentType
      }, '-created_date' */;
    },
    enabled: isOpen
  });

  const { data: previewContent } = useQuery({
    queryKey: ['version-preview', previewId],
    queryFn: async () => {
      if (!previewId) return null;
      const versionData = (await supabase.from('contentVersions').select('*').eq('id', previewId)).data ?? [];
      return versionData[0] || null;
    },
    enabled: !!previewId
  });

  const handleRevert = async (versionId) => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) return;

      // Mark all as non-current
      const allVersions = (await supabase.from('contentVersions').select('*').eq('content_id', contentId).eq('content_type', contentType)).data ?? [];
      
      for (const v of allVersions) {
        if (v.id !== versionId) {
          (await supabase.from('contentVersions').update({ is_current: false }).eq('id', v.id).select().single()).data;
        }
      }

      (await supabase.from('contentVersions').update({ is_current: true }).eq('id', versionId).select().single()).data;
      
      toast.success(`Reverted to version ${version.version_number}`);
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      onRevert?.(version);
    } catch (error) {
      toast.error('Failed to revert version');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <History className="w-4 h-4" />
        Versions ({versions.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>{currentTitle}</DialogDescription>
          </DialogHeader>

          {previewId && previewContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Preview: Version {previewContent.version_number}</h3>
                <Button variant="outline" size="sm" onClick={() => setPreviewId(null)}>
                  Back to History
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{previewContent.content}</p>
              </div>

              {previewContent.changes_summary && (
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground"><strong>Changes:</strong> {previewContent.changes_summary}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewId(null)}
                >
                  Close Preview
                </Button>
                {!previewContent.is_current && (
                  <Button
                    onClick={() => handleRevert(previewContent.id)}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revert to This Version
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No versions yet</p>
              ) : (
                versions.map(version => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg transition-all ${
                      version.is_current
                        ? 'bg-primary/5 border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Version {version.version_number}</span>
                          {version.is_current && (
                            <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                              <Check className="w-3 h-3" />
                              Current
                            </Badge>
                          )}
                        </div>
                        {version.changes_summary && (
                          <p className="text-xs text-muted-foreground">{version.changes_summary}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(version.created_date), 'PPp')}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewId(version.id)}
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                        {!version.is_current && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevert(version.id)}
                            className="gap-1 text-primary hover:text-primary"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}