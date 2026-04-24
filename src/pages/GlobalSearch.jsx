import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Loader2, Search, Users, FileText, Zap, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('globalSearch', {
        searchQuery: query,
        category,
      });
      setResults(response.data);
      setSearchParams({ q: query, category });
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setSearchParams({ q: query, category: newCategory });
    if (query.trim()) {
      setLoading(true);
      base44.functions
        .invoke('globalSearch', {
          searchQuery: query,
          category: newCategory,
        })
        .then(response => {
          setResults(response.data);
        })
        .catch(error => console.error('Search failed:', error))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">Find members, posts, projects, and skills across the platform</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members, posts, projects, skills..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || query.length < 2}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </form>

        {/* Category Filter */}
        {results && (
          <div className="mb-6">
            <Tabs value={category} onValueChange={handleCategoryChange}>
              <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="border border-border data-[state=active]:border-primary"
                >
                  All ({results.total})
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="border border-border data-[state=active]:border-primary"
                >
                  <Users className="w-3 h-3 mr-1.5" />
                  Members ({results.members?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="posts"
                  className="border border-border data-[state=active]:border-primary"
                >
                  <FileText className="w-3 h-3 mr-1.5" />
                  Posts ({results.posts?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="border border-border data-[state=active]:border-primary"
                >
                  <Folder className="w-3 h-3 mr-1.5" />
                  Projects ({results.projects?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="border border-border data-[state=active]:border-primary"
                >
                  <Zap className="w-3 h-3 mr-1.5" />
                  Skills ({results.skills?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Members */}
              <TabsContent value="members" className="mt-6 space-y-3">
                {results.members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No members found</p>
                ) : (
                  results.members.map(member => (
                    <Link
                      key={member.id}
                      to={`/user/${member.id}`}
                      className="block p-4 border border-border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium">{member.name?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{member.name}</h3>
                            <Badge variant="outline" className="text-xs capitalize">{member.role}</Badge>
                          </div>
                          {member.headline && (
                            <p className="text-sm text-muted-foreground mt-0.5">{member.headline}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </TabsContent>

              {/* Posts */}
              <TabsContent value="posts" className="mt-6 space-y-3">
                {results.posts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No posts found</p>
                ) : (
                  results.posts.map(post => (
                    <Link
                      key={post.id}
                      to={`/`}
                      className="block p-4 border border-border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {post.image && (
                          <img src={post.image} alt="" className="w-24 h-24 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full flex-shrink-0 bg-muted flex items-center justify-center text-xs">
                              {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.author} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                post.author?.[0]
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{post.author}</span>
                          </div>
                          {post.hashtags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {post.hashtags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </TabsContent>

              {/* Projects */}
              <TabsContent value="projects" className="mt-6 space-y-3">
                {results.projects.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No projects found</p>
                ) : (
                  results.projects.map(project => (
                    <Link
                      key={project.id}
                      to={`/shared-project/${project.id}`}
                      className="block p-4 border border-border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {project.image && (
                          <img src={project.image} alt={project.title} className="w-24 h-24 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{project.title}</h3>
                          <Link
                            to={`/user/${project.ownerId}`}
                            className="text-xs text-muted-foreground hover:text-primary mt-1 block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            by {project.owner}
                          </Link>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills" className="mt-6 space-y-3">
                {results.skills.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No skills found</p>
                ) : (
                  results.skills.map((skillItem, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-primary/10 text-primary border-0 text-sm">
                          <Zap className="w-3 h-3 mr-1" />
                          {skillItem.skill}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {skillItem.count} expert{skillItem.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {skillItem.experts.map(expert => (
                          <Link
                            key={expert.userId}
                            to={`/user/${expert.userId}`}
                            className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                          >
                            <div className="w-5 h-5 rounded-full flex-shrink-0 bg-background flex items-center justify-center text-xs overflow-hidden">
                              {expert.avatar ? (
                                <img src={expert.avatar} alt={expert.userName} className="w-full h-full object-cover" />
                              ) : (
                                expert.userName?.[0]
                              )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground hover:text-foreground">
                              {expert.userName}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* All */}
              <TabsContent value="all" className="mt-6">
                {results.total === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No results found for "{query}"</p>
                ) : (
                  <div className="space-y-8">
                    {/* Members Section */}
                    {results.members.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Members ({results.members.length})
                        </h3>
                        <div className="space-y-2">
                          {results.members.slice(0, 3).map(member => (
                            <Link
                              key={member.id}
                              to={`/user/${member.id}`}
                              className="block p-3 border border-border rounded hover:border-primary hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
                                  {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-medium">{member.name?.[0]}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{member.name}</p>
                                  {member.headline && (
                                    <p className="text-xs text-muted-foreground truncate">{member.headline}</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posts Section */}
                    {results.posts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Posts ({results.posts.length})
                        </h3>
                        <div className="space-y-2">
                          {results.posts.slice(0, 3).map(post => (
                            <Link
                              key={post.id}
                              to={`/`}
                              className="block p-3 border border-border rounded hover:border-primary hover:bg-muted/50 transition-colors"
                            >
                              <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{post.author}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects Section */}
                    {results.projects.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          Projects ({results.projects.length})
                        </h3>
                        <div className="space-y-2">
                          {results.projects.slice(0, 3).map(project => (
                            <Link
                              key={project.id}
                              to={`/shared-project/${project.id}`}
                              className="block p-3 border border-border rounded hover:border-primary hover:bg-muted/50 transition-colors"
                            >
                              <p className="font-medium text-sm">{project.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">by {project.owner}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills Section */}
                    {results.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Skills ({results.skills.length})
                        </h3>
                        <div className="space-y-2">
                          {results.skills.slice(0, 3).map((skillItem, idx) => (
                            <div key={idx} className="p-3 border border-border rounded">
                              <Badge className="bg-primary/10 text-primary border-0 text-xs mb-2 inline-block">
                                {skillItem.skill}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{skillItem.count} experts</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Initial State */}
        {!results && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Start typing to search across the platform</p>
          </div>
        )}
      </div>
    </div>
  );
}