import React, { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Link as LinkIcon, BadgeCheck, Calendar,
  Briefcase, DollarSign, MessageSquare, Edit, BookmarkPlus, Globe, Video
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/categories';
import PostCard from '@/components/feed/PostCard';
import CreatePost from '@/components/feed/CreatePost';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FollowButton from '@/components/profile/FollowButton';
import PortfolioSection from '@/components/profile/PortfolioSection';
import ApplicationsTab from '@/components/profile/ApplicationsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStartConversation } from '@/hooks/useStartConversation';
import ExpertiseSection from '@/components/profile/ExpertiseSection';
import UserReviewsSection, { UserRatingSummary } from '@/components/profile/UserReviewsSection';
import MemberReviewsSection from '@/components/profile/MemberReviewsSection';
import CreativeProjectsTab from '@/components/profile/CreativeProjectsTab';
import LikedFavoritesTab from '@/components/profile/LikedFavoritesTab';
import SharedMarketplaceTab from '@/components/profile/SharedMarketplaceTab';
import ScheduledPublicationsTab from '@/components/profile/ScheduledPublicationsTab';
import SavedPostsTab from '@/components/profile/SavedPostsTab';
import SkillEndorsements from '@/components/profile/SkillEndorsements';

export default function Profile() {
  const { user: currentUser } = useOutletContext();
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwnProfile = !userId || userId === currentUser?.id;
  const startConversation = useStartConversation(currentUser);
  const [uploading, setUploading] = useState(false);

  const { data: profileUser } = useQuery({
    queryKey: ['profile', userId || currentUser?.id],
    queryFn: async () => {
      if (isOwnProfile) return currentUser || null;
      const users = await base44.entities.User.filter({ id: userId });
      return users[0] || null;
    },
    enabled: isOwnProfile ? !!currentUser : !!userId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', profileUser?.id],
    queryFn: () => base44.entities.Post.filter({ author_id: profileUser.id }, '-created_date', 20),
    enabled: !!profileUser,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['likes', currentUser?.id],
    queryFn: () => base44.entities.Like.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', currentUser?.id],
    queryFn: () => base44.entities.Bookmark.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
  });

  const { data: userVideos = [] } = useQuery({
    queryKey: ['user-videos', profileUser?.id],
    queryFn: () => base44.entities.SharedVideo.filter({ owner_id: profileUser.id }),
    enabled: !!profileUser,
  });

  const { data: userProjects = [] } = useQuery({
    queryKey: ['user-projects', profileUser?.id],
    queryFn: () => base44.entities.SharedProject.filter({ owner_id: profileUser.id }),
    enabled: !!profileUser,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ['follower-count', profileUser?.id],
    queryFn: async () => {
      const results = await base44.entities.Follow.filter({ following_id: profileUser.id });
      return results.length;
    },
    enabled: !!profileUser,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['following-count', profileUser?.id],
    queryFn: async () => {
      const results = await base44.entities.Follow.filter({ follower_id: profileUser.id });
      return results.length;
    },
    enabled: !!profileUser,
  });

  const user = profileUser;
  if (!user) {
    if (isOwnProfile && !currentUser) {
      return (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground text-sm mb-6">Create posts, connect with creators, and build your presence.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            Sign In
          </Link>
        </div>
      );
    }
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const handleUploadProfilePic = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      const input = event.target;
      input.value = '';
    } catch (error) {
      console.error('Failed to upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const userLikePostIds = likes.map(l => l.post_id);
  const userBookmarkPostIds = bookmarks.map(b => b.post_id);

  return (
    <div>
      {/* Cover/Banner */}
      <div className="h-32 sm:h-44 rounded-xl bg-gradient-to-br from-primary/20 to-accent overflow-hidden -mx-4 -mt-6 lg:-mt-8 mb-0 relative">
        {user.banner_url ? (
          <img src={user.banner_url} className="w-full h-full object-cover" alt="" />
        ) : user.cover_url ? (
          <img src={user.cover_url} className="w-full h-full object-cover" alt="" />
        ) : null}
      </div>

      {/* Profile header */}
      <div className="relative -mt-12 sm:-mt-16 px-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-card border-4 border-background overflow-hidden flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {user.full_name?.[0]}
              </div>
            )}
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadProfilePic}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="text-white text-xs font-medium text-center px-2">
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </span>
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold">{user.full_name}</h1>
              {user.verified && <BadgeCheck className="w-5 h-5 text-primary" />}
              <Badge variant="secondary" className="text-xs capitalize">{ROLE_LABELS[user.role] || user.role}</Badge>
              {user.plan === 'pro' && <Badge className="bg-primary/10 text-primary border-0 text-xs">PRO</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{user.headline}</p>
          </div>
          <div className="flex gap-2 sm:pb-1">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" onClick={() => navigate('/profile/edit')}>
                <Edit className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            ) : (
              <>
                <FollowButton currentUser={currentUser} targetUserId={user.id} />
                <Button variant="outline" size="icon" className="h-9 w-9" title="Message" onClick={() => startConversation(user)}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Video call"
                  onClick={() => {
                    const slug = `philomni-${Date.now()}`;
                    const domain = import.meta.env.VITE_DAILY_DOMAIN || 'philomni';
                    window.open(`https://${domain}.daily.co/${slug}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Video className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {user.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{user.location}</span>}
        {user.website && (
          <a href={user.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
            <LinkIcon className="w-4 h-4" />{user.website.replace(/https?:\/\//, '')}
          </a>
        )}
        {user.created_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />Joined {format(new Date(user.created_date), 'MMM yyyy')}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-5 mt-3 text-sm flex-wrap items-center">
        <span><strong>{followerCount}</strong> <span className="text-muted-foreground">followers</span></span>
        <span><strong>{followingCount}</strong> <span className="text-muted-foreground">following</span></span>
        <UserRatingSummary userId={user.id} />
      </div>

      {/* Bio */}
      {user.bio && <p className="mt-4 text-sm leading-relaxed">{user.bio}</p>}

      {/* Role-specific info */}
      <div className="mt-4 flex flex-wrap gap-2">
        {user.primary_category && <Badge variant="secondary">{user.primary_category}</Badge>}
        {user.secondary_category && <Badge variant="secondary">{user.secondary_category}</Badge>}
        {user.hourly_rate && (
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />${user.hourly_rate}/hr
          </Badge>
        )}
        {user.availability && (
          <Badge className={user.availability === 'available' ? 'bg-green-500/10 text-green-600 border-0' : 'bg-muted text-muted-foreground border-0'}>
            {user.availability === 'available' ? 'Available' : user.availability === 'busy' ? 'Busy' : 'Not Available'}
          </Badge>
        )}
        {user.open_to_collabs && <Badge className="bg-primary/10 text-primary border-0">Open to Collabs</Badge>}
        {user.investment_focus && <Badge variant="secondary">{user.investment_focus}</Badge>}
        {user.company_name && <Badge variant="secondary"><Briefcase className="w-3 h-3 mr-1" />{user.company_name}</Badge>}
      </div>

      {/* Expertise */}
      <ExpertiseSection user={user} isOwnProfile={isOwnProfile} />

      {/* Skill Endorsements */}
      <div className="mt-6">
        <SkillEndorsements userId={user.id} isOwnProfile={isOwnProfile} userFullName={user.full_name} />
      </div>

      {/* Tabs: Posts / Portfolio / Applications */}
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList className="mb-4 h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="saved" className="flex items-center gap-1.5">
            <BookmarkPlus className="w-3.5 h-3.5" /> Saved
          </TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="drafts" className="flex items-center gap-1.5">
            <BookmarkPlus className="w-3.5 h-3.5" /> Drafts
          </TabsTrigger>}
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          {userVideos.length > 0 && <TabsTrigger value="videos">Videos</TabsTrigger>}
          {userProjects.length > 0 && <TabsTrigger value="projects">Projects</TabsTrigger>}
          {isOwnProfile && (
            <>
              <TabsTrigger value="creative">Creative Projects</TabsTrigger>
              <TabsTrigger value="liked">Liked & Saved</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="scheduled">📅 Scheduled</TabsTrigger>
            </>
          )}
          {isOwnProfile && <TabsTrigger value="applications">Applications</TabsTrigger>}
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {isOwnProfile && <CreatePost user={currentUser} onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['user-posts'] })} />}
          {(() => {
            const publicPosts = isOwnProfile ? posts.filter(p => p.visibility !== 'private') : posts.filter(p => p.visibility !== 'private');
            return publicPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No posts yet</p>
            ) : (
              <div className="space-y-4">
                {publicPosts.map(post => (
                  <PostCard key={post.id} post={post} user={currentUser} userLikes={userLikePostIds} userBookmarks={userBookmarkPostIds} />
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved">
            <SavedPostsTab userId={user.id} currentUser={currentUser} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="drafts">
            {(() => {
              const draftPosts = posts.filter(p => p.visibility === 'private');
              return draftPosts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <BookmarkPlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No draft posts</p>
                  <p className="text-xs text-muted-foreground mt-1">Save a post as draft to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftPosts.map(post => (
                    <div key={post.id} className="relative">
                      <div className="absolute top-3 right-3 z-10 flex gap-2">
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 bg-card">Draft</Badge>
                        <button
                          className="text-xs text-primary flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 hover:bg-muted transition-colors"
                          onClick={async () => {
                            await base44.entities.Post.update(post.id, { visibility: 'public' });
                            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
                          }}
                        >
                          <Globe className="w-3 h-3" /> Publish
                        </button>
                      </div>
                      <PostCard post={post} user={currentUser} userLikes={userLikePostIds} userBookmarks={userBookmarkPostIds} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>
        )}

        <TabsContent value="portfolio">
          <PortfolioSection userId={user.id} isOwnProfile={isOwnProfile} />
        </TabsContent>

        {userVideos.length > 0 && (
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userVideos.map(video => (
                <Link
                  key={video.id}
                  to={`/shared-video/${video.id}`}
                  className="group rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                >
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    {video.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/60 text-white text-xs border-0">
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.view_count || 0} views</p>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}

        {userProjects.length > 0 && (
          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/shared-project/${project.id}`}
                  className="group rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                >
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    {project.style_emoji && (
                      <Badge className="absolute top-2 left-2">{project.style_emoji} {project.style_label}</Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{project.title || 'Untitled'}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{project.view_count || 0} views</p>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="applications">
            <ApplicationsTab user={currentUser} isOwnProfile={isOwnProfile} currentUser={currentUser} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="creative">
            <CreativeProjectsTab userId={user.id} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="liked">
            <LikedFavoritesTab userId={user.id} currentUser={currentUser} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="marketplace">
            <SharedMarketplaceTab userId={user.id} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="scheduled">
            <ScheduledPublicationsTab userId={user.id} />
          </TabsContent>
        )}

        <TabsContent value="reviews">
          <div className="space-y-6">
            {/* Member Reviews */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Member Reviews</h3>
              <MemberReviewsSection
                userId={user.id}
                currentUserId={currentUser?.id}
                isOwnProfile={isOwnProfile}
              />
            </div>

            {/* Project Reviews */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Reviews</h3>
              <UserReviewsSection profileUserId={user.id} currentUser={currentUser} isOwnProfile={isOwnProfile} inTab />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}