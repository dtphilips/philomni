import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Share2, Download, Trash2, Plus, Loader2, FileAudio, Users, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SharedProjectDashboard({ projectId, isOpen, onClose }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('editor');

  useEffect(() => {
    if (isOpen && projectId) {
      loadProject();
    }
  }, [isOpen, projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projects = await base44.entities.SharedAudioProject.filter({
        id: projectId
      });

      if (projects.length > 0) {
        setProject(projects[0]);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareFile = async () => {
    // This would integrate with file upload functionality
    alert('File sharing feature - integrate with file upload');
  };

  const handleRemoveMember = async (userId) => {
    if (!project) return;

    const updatedMembers = project.team_members.filter(m => m.user_id !== userId);
    try {
      await base44.entities.SharedAudioProject.update(projectId, {
        team_members: updatedMembers
      });
      await loadProject();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDownloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
    link.click();
  };

  const handleDeleteFile = async (fileId) => {
    if (!project) return;

    const updatedFiles = project.shared_files.filter(f => f.id !== fileId);
    try {
      await base44.entities.SharedAudioProject.update(projectId, {
        shared_files: updatedFiles
      });
      await loadProject();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {project.project_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Team Members ({project.team_members?.length || 0})</h3>
            </div>

            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              {project.team_members && project.team_members.length > 0 ? (
                project.team_members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No team members yet</p>
              )}
            </div>
          </div>

          {/* Shared Files Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Shared Files ({project.shared_files?.length || 0})</h3>
              </div>
              <Button
                size="sm"
                onClick={handleShareFile}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Share File
              </Button>
            </div>

            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              {project.shared_files && project.shared_files.length > 0 ? (
                project.shared_files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Shared by {file.uploaded_by_name} • {format(new Date(file.uploaded_at), 'MMM d, p')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No files shared yet</p>
              )}
            </div>
          </div>
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