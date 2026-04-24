import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Loader2, BadgeCheck, Sparkles, FolderOpen, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS, CATEGORY_NAMES } from '@/lib/categories';
import { computeCollaboratorScore, getMatchReasons } from '@/lib/collaboratorMatch';
import CollaboratorCard from '@/components/discover/CollaboratorCard';

export default function Discover() {
  const { user } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('foryou');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['discover-users'],
    queryFn: () => base44.entities.User.list('-created_date', 50),
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['discover-posts'],
    queryFn: () => base44.entities.Post.list('-like_count', 20),
  });

  const { data: portfolioProjects = [], isLoading: portfolioLoading } = useQuery({
    queryKey: ['discover-portfolio'],
    queryFn: () => base44.entities.PortfolioProject.list('-created_date', 50),
  });

  const [activeCategory, setActiveCategory] = useState('');

  const filteredUsers = users.filter(u =>
    u.id !== user?.id &&
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.headline?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPortfolio = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return portfolioProjects.filter(p => {
      if (p.status === 'draft') return false;
      const matchesQuery = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [portfolioProjects, searchQuery, activeCategory]);

  const filteredTrending = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return posts.filter(p => p.visibility !== 'private');
    return posts.filter(p =>
      p.visibility !== 'private' && (
        p.content?.toLowerCase().includes(q) ||
        p.hashtags?.some(h => h.toLowerCase().includes(q)) ||
        p.author_name?.toLowerCase().includes(q)
      )
    );
  }, [posts, searchQuery]);

  // Compute and sort collaboration matches for "For You" tab
  const suggestedMatches = useMemo(() => {
    if (!user) return [];
    return users
      .filter(u => u.id !== user.id)
      .map(u => ({
        candidate: u,
        score: computeCollaboratorScore(user, u),
        reasons: getMatchReasons(user, u),
      }))
      .filter(m => m.score >= 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [user, users]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Discover</h1>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search people, posts, portfolio, hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-muted/50"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category chips — shown on portfolio tab */}
      {tab === 'portfolio' && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <button
            onClick={() => setActiveCategory('')}
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            All
          </button>
          {CATEGORY_NAMES.slice(0, 14).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="foryou" className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> For You
          </TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'foryou' && (
        <div className="space-y-3">
          {usersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : suggestedMatches.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No matches yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add skills and a category to your profile to see suggestions</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-1">Showing {suggestedMatches.length} suggested collaborators based on your skills, category, and availability.</p>
              {suggestedMatches.map(({ candidate, score, reasons }) => (
                <CollaboratorCard
                  key={candidate.id}
                  candidate={candidate}
                  score={score}
                  reasons={reasons}
                  currentUser={user}
                />
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'people' && (
        <div className="space-y-2">
          {usersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found</p>
          ) : (
            filteredUsers.map(u => (
              <Link
                key={u.id}
                to={`/user/${u.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-medium text-muted-foreground">
                      {u.full_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{u.full_name}</span>
                    {u.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.headline}</p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
                  {ROLE_LABELS[u.role] || u.role}
                </Badge>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'portfolio' && (
        <div>
          {portfolioLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredPortfolio.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No portfolio projects found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPortfolio.map(p => (
                <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {p.image_urls?.length > 0 ? (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{p.title}</h3>
                      {p.project_url && (
                        <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                      {p.tags?.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                    {p.client_name && <p className="text-xs text-muted-foreground mt-1.5">For {p.client_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'trending' && (
        <div className="space-y-3">
          {postsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredTrending.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No trending posts found</p>
          ) : (
            filteredTrending.map(post => (
              <div key={post.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{post.author_name}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{post.like_count || 0} likes</span>
                  <span>{post.comment_count || 0} comments</span>
                </div>
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.slice(0, 4).map(h => (
                      <button key={h} onClick={() => setSearchQuery('#' + h)} className="text-xs text-primary hover:underline">#{h}</button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}