import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PostCard from '@/components/feed/PostCard';
import SearchFilters from '@/components/explore/SearchFilters';
import { Flame, TrendingUp, Users, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Explore() {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostTypes, setSelectedPostTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  const { user: user } = useAuth();

  const { data: allPosts = [] } = useQuery({
    queryKey: ['allPosts'],
    queryFn: () => supabase.from('posts').select('*'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => { const { data } = await supabase.from('users').select('*').limit(50); return data ?? []; },
  });

  const { data: userFollows = [] } = useQuery({
    queryKey: ['userFollows', user?.id],
    queryFn: async () => { if (!(user)) return []; const { data } = await supabase.from('follows').select('*').eq('follower_id', user.id); return data ?? []; },
    enabled: !!user,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ['userLikes', user?.id],
    queryFn: async () => { if (!(user)) return []; const { data } = await supabase.from('likes').select('*').eq('user_id', user.id); return data ?? []; },
    enabled: !!user,
  });

  const { data: userBookmarks = [] } = useQuery({
    queryKey: ['userBookmarks', user?.id],
    queryFn: async () => { if (!(user)) return []; const { data } = await supabase.from('bookmarks').select('*').eq('user_id', user.id); return data ?? []; },
    enabled: !!user,
  });

  // Extract trending hashtags from posts
  const trendingHashtags = useMemo(() => {
    const hashtagMap = {};
    allPosts.forEach(post => {
      const hashtags = post.content?.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        hashtagMap[tag] = (hashtagMap[tag] || 0) + 1;
      });
    });

    return Object.entries(hashtagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [allPosts]);

  // Get popular posts
  const popularPosts = useMemo(() => {
    return allPosts
      .map(post => ({
        ...post,
        engagement: (post.likes_count || 0) + (post.comments_count || 0) * 2,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 20);
  }, [allPosts]);

  // Get recommended users
  const recommendedUsers = useMemo(() => {
    const followedIds = new Set(userFollows.map(f => f.followed_user_id));
    return allUsers
      .filter(u => u.id !== user?.id && !followedIds.has(u.id))
      .slice(0, 8);
  }, [allUsers, userFollows, user?.id]);

  // Filter posts by all criteria
  const filteredPosts = useMemo(() => {
    let posts = popularPosts;

    // Filter by search query
    if (searchQuery.trim()) {
      posts = posts.filter(post =>
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by post types
    if (selectedPostTypes.length > 0) {
      posts = posts.filter(post => selectedPostTypes.includes(post.media_type || 'text'));
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      posts = posts.filter(post => {
        const postCategory = post.category?.toLowerCase();
        return selectedCategories.some(cat => postCategory?.includes(cat));
      });
    }

    // Filter by hashtags
    if (selectedHashtags.trim()) {
      const hashtags = selectedHashtags
        .split(',')
        .map(h => h.trim().toLowerCase().replace('#', ''))
        .filter(h => h);
      posts = posts.filter(post => {
        const postHashtags = (post.hashtags || []).map(h => h.toLowerCase());
        return hashtags.some(tag => postHashtags.includes(tag));
      });
    }

    // Filter by user roles
    if (selectedRoles.length > 0) {
      posts = posts.filter(post => {
        const author = allUsers.find(u => u.id === post.author_id);
        return selectedRoles.includes(author?.role || 'user');
      });
    }

    return posts;
  }, [popularPosts, searchQuery, selectedPostTypes, selectedCategories, selectedHashtags, selectedRoles, allUsers]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedPostTypes([]);
    setSelectedCategories([]);
    setSelectedHashtags('');
    setSelectedRoles([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            Explore
          </h1>
          <p className="text-muted-foreground">Discover trending content and new creators</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedPostTypes={selectedPostTypes}
              onPostTypeToggle={(type) => {
                setSelectedPostTypes(prev =>
                  prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                );
              }}
              selectedCategories={selectedCategories}
              onCategoryToggle={(category) => {
                setSelectedCategories(prev =>
                  prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                );
              }}
              selectedHashtags={selectedHashtags}
              onHashtagChange={setSelectedHashtags}
              selectedRoles={selectedRoles}
              onRoleToggle={(role) => {
                setSelectedRoles(prev =>
                  prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                );
              }}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Popular Posts
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Creators
            </TabsTrigger>
          </TabsList>

          {/* Trending Hashtags */}
          <TabsContent value="trending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingHashtags.map((item, idx) => (
                <motion.div
                  key={item.tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">{item.tag}</div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.count} post{item.count !== 1 ? 's' : ''}
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Popular Posts */}
          <TabsContent value="popular" className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No posts found matching your search</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      user={user}
                      userLikes={userLikes.map(l => l.post_id)}
                      userBookmarks={userBookmarks.map(b => b.post_id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recommended Creators */}
          <TabsContent value="creators" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedUsers.map((creator, idx) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`}
                          alt={creator.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {creator.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">@{creator.email?.split('@')[0]}</p>
                      </div>
                      <Button size="sm" className="w-full">
                        Follow
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {recommendedUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No more creators to discover</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}