import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import PublishContentDialog from '@/components/marketplace/PublishContentDialog';

const CONTENT_TYPES = ['template', 'script', 'blog_post', 'social_pack', 'video', 'asset'];

export default function CreatorMarketplace() {
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: async () => {
      return supabase.from('creator_content').select('*') /* TODO filter: { status: 'published' } */;
    }
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const user = user /* useAuth() */;
      return supabase.from('creator_content').select('*') /* TODO filter: { creator_id: user.id } */;
    }
  });

  const filteredListings = listings.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.content_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handlePurchase = async (listing) => {
    try {
      // Stripe payment will be integrated here
      toast.success('Purchase request received! You\'ll be contacted to complete payment.');
      // For now, just log
      console.log('Purchasing:', listing);
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Creator Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">Buy and sell top-performing content from creators</p>
        </div>
        <Button onClick={() => setIsPublishOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Publish Content
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-col md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, scripts, videos..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All Types
          </Button>
          {CONTENT_TYPES.map(type => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No content found matching your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(listing => (
            <Card key={listing.id} className="flex flex-col hover:shadow-lg transition-all">
              {listing.thumbnail_url && (
                <div className="h-40 overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={listing.thumbnail_url}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}

              <CardHeader className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {listing.content_type.replace(/_/g, ' ')}
                  </Badge>
                  {listing.is_featured && (
                    <Badge className="bg-amber-500">Featured</Badge>
                  )}
                </div>

                <CardTitle className="text-base">{listing.title}</CardTitle>
                <CardDescription className="line-clamp-2">{listing.description}</CardDescription>

                {/* Tags */}
                {listing.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {listing.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Rating */}
                {listing.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(listing.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({listing.review_count} reviews)
                    </span>
                  </div>
                )}

                {/* Creator */}
                <div className="flex items-center gap-2 text-sm">
                  {listing.creator_avatar && (
                    <img
                      src={listing.creator_avatar}
                      alt={listing.creator_name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-muted-foreground">{listing.creator_name}</span>
                </div>

                {/* Purchase */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-2xl font-bold">${listing.price}</span>
                  <Button
                    onClick={() => handlePurchase(listing)}
                    className="gap-2"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy
                  </Button>
                </div>

                {/* Stats */}
                <p className="text-xs text-muted-foreground">
                  {listing.purchase_count} purchased
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* My Listings Section */}
      {myListings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Listings ({myListings.length})</CardTitle>
            <CardDescription>Your published content on the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myListings.map(listing => (
                <div
                  key={listing.id}
                  className="p-3 rounded-lg border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      ${listing.price} • {listing.purchase_count} sold
                    </p>
                  </div>
                  <Badge variant={listing.status === 'published' ? 'default' : 'secondary'}>
                    {listing.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PublishContentDialog isOpen={isPublishOpen} onClose={() => setIsPublishOpen(false)} />
    </div>
  );
}