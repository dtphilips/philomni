import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Edit2, Trash2, ExternalLink, Users, Eye, Heart,
  Loader2, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PortfolioProjectModal from './PortfolioProjectModal';

export default function PortfolioSection({ userId, isOwnProfile }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const items = await base44.entities.PortfolioProject.filter(
        { owner_id: userId, status: 'published' },
        '-created_date'
      );
      setProjects(items);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await base44.entities.PortfolioProject.delete(projectId);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleProjectSaved = () => {
    loadProjects();
    setModalOpen(false);
    setEditingProject(null);
  };

  const categories = {
    'web-design': 'Web Design',
    'mobile-app': 'Mobile App',
    'graphic-design': 'Graphic Design',
    'video-production': 'Video Production',
    'writing': 'Writing',
    'photography': 'Photography',
    'audio-production': 'Audio Production',
    '3d-modeling': '3D Modeling',
    'illustration': 'Illustration',
    'other': 'Other',
  };

  const collaborationTypes = {
    feedback: 'Feedback',
    freelance: 'Freelance',
    partnership: 'Partnership',
    mentoring: 'Mentoring',
    learning: 'Learning',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Portfolio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        {isOwnProfile && (
          <Button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <PortfolioProjectModal
          project={editingProject}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleProjectSaved}
        />
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
          <p className="text-muted-foreground mb-3">
            {isOwnProfile ? 'No projects yet. Create your first portfolio item!' : 'No projects yet.'}
          </p>
          {isOwnProfile && (
            <Button
              onClick={() => setModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
            >
              {/* Image */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground">
                    <Users className="w-8 h-8" />
                  </div>
                )}

                {/* Overlay Actions */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingProject(project);
                        setModalOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(project.id)}
                      className="gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Category */}
                {project.category && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {categories[project.category] || project.category}
                  </Badge>
                )}

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Collaboration Status */}
                {project.open_to_collaborate && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 space-y-1.5">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Open to Collaborate
                    </p>
                    {project.collaboration_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.collaboration_types.map((type, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-primary/5"
                          >
                            {collaborationTypes[type]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {project.view_count || 0} views
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    {project.like_count || 0} likes
                  </div>
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}