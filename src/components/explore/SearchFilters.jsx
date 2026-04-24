import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const POST_TYPES = ['text', 'image', 'video', 'article'];
const CATEGORIES = ['tech', 'creative', 'business', 'lifestyle', 'education', 'entertainment'];
const USER_ROLES = ['admin', 'user', 'creator', 'influencer'];

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedPostTypes,
  onPostTypeToggle,
  selectedCategories,
  onCategoryToggle,
  selectedHashtags,
  onHashtagChange,
  selectedRoles,
  onRoleToggle,
  onClearFilters,
}) {
  const hasActiveFilters = selectedPostTypes.length > 0 || selectedCategories.length > 0 || selectedRoles.length > 0 || selectedHashtags.trim();

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* Search Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <Input
          placeholder="Search posts or creators..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Post Types */}
      <div>
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Post Types
        </label>
        <div className="flex flex-wrap gap-2">
          {POST_TYPES.map(type => (
            <Badge
              key={type}
              variant={selectedPostTypes.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => onPostTypeToggle(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <Badge
              key={category}
              variant={selectedCategories.includes(category) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => onCategoryToggle(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label className="text-sm font-medium mb-2 block">Hashtags</label>
        <Input
          placeholder="Enter hashtags (comma-separated, e.g. #design,#ui)"
          value={selectedHashtags}
          onChange={(e) => onHashtagChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* User Roles */}
      <div>
        <label className="text-sm font-medium mb-2 block">User Roles</label>
        <div className="flex flex-wrap gap-2">
          {USER_ROLES.map(role => (
            <Badge
              key={role}
              variant={selectedRoles.includes(role) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => onRoleToggle(role)}
            >
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}