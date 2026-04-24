import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, Users, MessageCircle, UserPlus, Loader2, Heart
} from 'lucide-react';
import CollaborationProjectCard from '@/components/collaboration/CollaborationProjectCard';

export default function CollaborationFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch collaborative projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['collaborativeProjects', searchQuery, selectedInterests],
    queryFn: async () => {
      try {
        // Fetch all projects marked as open to collaborate
        const allProjects = await base44.entities.PortfolioProject.filter({
          open_to_collaborate: true,
          status: 'published'
        });

        // Filter by search query and interests
        let filtered = allProjects.filter(project => {
          if (!currentUser || project.owner_id === currentUser.id) return false;

          const matchesSearch =
            !searchQuery ||
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.tags?.some(tag =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            );

          const matchesInterests =
            selectedInterests.length === 0 ||
            project.tags?.some(tag =>
              selectedInterests.some(interest =>
                tag.toLowerCase().includes(interest.toLowerCase())
              )
            );

          return matchesSearch && matchesInterests;
        });

        return filtered.sort(() => Math.random() - 0.5); // Shuffle for discovery
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    },
    enabled: !!currentUser
  });

  // Common interest tags
  const interestTags = [
    'web-design', 'mobile-app', 'graphic-design', 'video-production',
    'writing', 'photography', 'audio-production', '3d-modeling'
  ];

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-primary" />
          Discover Collaborators
        </h1>
        <p className="text-muted-foreground">
          Find creators open to collaboration matching your interests
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, skills, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>

        {/* Interest Filter Tags */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filter by interests
          </p>
          <div className="flex flex-wrap gap-2">
            {interestTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedInterests.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleInterest(tag)}
              >
                {tag.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground font-medium">No projects found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search or interests
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <CollaborationProjectCard
              key={project.id}
              project={project}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}