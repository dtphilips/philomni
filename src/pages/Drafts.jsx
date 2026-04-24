import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Trash2, Share2, Edit, Play, Plus, Search, Filter, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Drafts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.VideoDraft.filter({ creator_id: user.id }, '-updated_date', 100);
    }
  });

  const categories = [...new Set(drafts.map(d => d.category).filter(Boolean))];
  const statuses = ['editing', 'in_review', 'ready_to_publish'];

  const filteredDrafts = drafts.filter(draft => {
    const matchSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       draft.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'all' || draft.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || draft.status === selectedStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const handleCreateDraft = async () => {
    if (!newDraftTitle.trim()) return;
    try {
      const user = await base44.auth.me();
      await base44.entities.VideoDraft.create({
        creator_id: user.id,
        title: newDraftTitle,
        status: 'editing'
      });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setNewDraftTitle('');
      setIsCreateOpen(false);
      toast.success('Draft created');
    } catch (error) {
      toast.error('Failed to create draft');
    }
  };

  const handleDeleteDraft = async (id) => {
    try {
      await base44.entities.VideoDraft.delete(id);
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft deleted');
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await base44.entities.VideoDraft.update(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'editing': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'ready_to_publish': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading drafts...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Video Drafts</h1>
            <p className="text-muted-foreground text-sm mt-1">{filteredDrafts.length} draft(s)</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Draft
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs"
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className="text-xs"
              >
                All
              </Button>
              {statuses.map(status => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className="text-xs"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Drafts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrafts.map(draft => (
            <div key={draft.id} className="rounded-lg border border-border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {draft.thumbnail_url ? (
                  <img src={draft.thumbnail_url} alt={draft.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-12 h-12 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2">{draft.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(draft.updated_date))} ago
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(draft.status)}`}>
                    {draft.status.replace('_', ' ')}
                  </span>
                  {draft.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {draft.category}
                    </span>
                  )}
                </div>

                {/* Collaborators */}
                {draft.collaborators?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {draft.collaborators.length} collaborator(s)
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/quality-review/${draft.id}`}
                    className="flex-1 text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="text-destructive text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDrafts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No drafts found</p>
          </div>
        )}
      </div>

      {/* Create Draft Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Draft title"
              value={newDraftTitle}
              onChange={(e) => setNewDraftTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDraft}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}