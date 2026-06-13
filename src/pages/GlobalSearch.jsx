import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, Loader2, Users, FileText, Building2, UserPlus, UserCheck, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

export default function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [posts, setPosts] = useState([])
  const [follows, setFollows] = useState(new Set())         // user ids this user follows
  const [companyFollows, setCompanyFollows] = useState(new Set()) // company ids

  const totalResults = users.length + companies.length + posts.length

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setUsers([]); setCompanies([]); setPosts([]); return }
    setLoading(true)
    const like = `%${q.trim()}%`
    const [{ data: u }, { data: co }, { data: p }] = await Promise.all([
      supabase.from('users').select('id, full_name, username, avatar_url, headline').or(`full_name.ilike.${like},username.ilike.${like}`).limit(15),
      supabase.from('company_pages').select('id, name, handle, logo_url, industry, company_size, follower_count, tagline').or(`name.ilike.${like},handle.ilike.${like},industry.ilike.${like}`).limit(10),
      supabase.from('posts').select('id, content, author_name, author_avatar, author_id, created_at, likes_count').ilike('content', like).limit(10),
    ])
    setUsers(u ?? [])
    setCompanies(co ?? [])
    setPosts(p ?? [])
    setLoading(false)
  }, [])

  // Load follow state once we have results
  useEffect(() => {
    if (!user?.id) return
    if (users.length === 0 && companies.length === 0) return
    const userIds = users.map(u => u.id)
    const coIds = companies.map(c => c.id)
    Promise.all([
      userIds.length > 0 ? supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', userIds) : Promise.resolve({ data: [] }),
      coIds.length > 0 ? supabase.from('company_follows').select('company_id').eq('user_id', user.id).in('company_id', coIds) : Promise.resolve({ data: [] }),
    ]).then(([{ data: f }, { data: cf }]) => {
      setFollows(new Set((f ?? []).map(x => x.following_id)))
      setCompanyFollows(new Set((cf ?? []).map(x => x.company_id)))
    })
  }, [users, companies, user?.id])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); search(q) }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ q: query })
    search(query)
  }

  const handleInputChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (v.length >= 2) {
      setSearchParams({ q: v })
      search(v)
    }
  }

  const toggleFollowUser = async (targetUser) => {
    if (!user) return toast.error('Sign in to follow')
    if (follows.has(targetUser.id)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUser.id)
      setFollows(prev => { const s = new Set(prev); s.delete(targetUser.id); return s })
      toast.success(`Unfollowed ${targetUser.full_name || targetUser.username}`)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUser.id })
      setFollows(prev => new Set([...prev, targetUser.id]))
      toast.success(`Following ${targetUser.full_name || targetUser.username}`)
    }
  }

  const toggleFollowCompany = async (company) => {
    if (!user) return toast.error('Sign in to follow')
    if (companyFollows.has(company.id)) {
      await supabase.from('company_follows').delete().eq('company_id', company.id).eq('user_id', user.id)
      setCompanyFollows(prev => { const s = new Set(prev); s.delete(company.id); return s })
      // Update local result so follower count reflects immediately
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, follower_count: Math.max(0, (c.follower_count || 1) - 1) } : c))
      toast.success(`Unfollowed ${company.name}`)
    } else {
      await supabase.from('company_follows').insert({ company_id: company.id, user_id: user.id })
      setCompanyFollows(prev => new Set([...prev, company.id]))
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, follower_count: (c.follower_count || 0) + 1 } : c))
      toast.success(`Following ${company.name}`)
    }
  }

  const hasResults = totalResults > 0
  const searched = query.length >= 2

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 pt-6">
      <h1 className="text-2xl font-bold mb-4">Search</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={handleInputChange}
              placeholder="Search people, companies, posts…"
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || query.length < 2}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </form>

      {!searched && (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      )}

      {searched && !loading && !hasResults && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-medium">No results for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      )}

      {searched && hasResults && (
        <Tabs defaultValue="all">
          <TabsList className="mb-5">
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="people"><Users className="w-3.5 h-3.5 mr-1" />People ({users.length})</TabsTrigger>
            <TabsTrigger value="companies"><Building2 className="w-3.5 h-3.5 mr-1" />Companies ({companies.length})</TabsTrigger>
            <TabsTrigger value="posts"><FileText className="w-3.5 h-3.5 mr-1" />Posts ({posts.length})</TabsTrigger>
          </TabsList>

          {/* ALL */}
          <TabsContent value="all" className="space-y-6">
            {users.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">People</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => <UserRow key={u.id} u={u} isMe={user?.id === u.id} following={follows.has(u.id)} onFollow={() => toggleFollowUser(u)} onNavigate={() => navigate(`/profile/${u.id}`)} />)}
                </div>
              </section>
            )}
            {companies.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Companies</h3>
                <div className="space-y-2">
                  {companies.slice(0, 4).map(c => <CompanyRow key={c.id} company={c} following={companyFollows.has(c.id)} onFollow={() => toggleFollowCompany(c)} onNavigate={() => navigate(`/company/${c.handle}`)} />)}
                </div>
              </section>
            )}
            {posts.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Posts</h3>
                <div className="space-y-2">
                  {posts.slice(0, 5).map(p => <PostRow key={p.id} post={p} />)}
                </div>
              </section>
            )}
          </TabsContent>

          {/* PEOPLE */}
          <TabsContent value="people" className="space-y-2">
            {users.length === 0
              ? <Empty label="No people found" />
              : users.map(u => <UserRow key={u.id} u={u} isMe={user?.id === u.id} following={follows.has(u.id)} onFollow={() => toggleFollowUser(u)} onNavigate={() => navigate(`/profile/${u.id}`)} />)}
          </TabsContent>

          {/* COMPANIES */}
          <TabsContent value="companies" className="space-y-2">
            {companies.length === 0
              ? <Empty label="No companies found" />
              : companies.map(c => <CompanyRow key={c.id} company={c} following={companyFollows.has(c.id)} onFollow={() => toggleFollowCompany(c)} onNavigate={() => navigate(`/company/${c.handle}`)} />)}
          </TabsContent>

          {/* POSTS */}
          <TabsContent value="posts" className="space-y-2">
            {posts.length === 0
              ? <Empty label="No posts found" />
              : posts.map(p => <PostRow key={p.id} post={p} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function UserRow({ u, isMe, following, onFollow, onNavigate }) {
  const initials = (u.full_name || u.username || '?')[0].toUpperCase()
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors">
      <button onClick={onNavigate} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : initials}
        </div>
      </button>
      <div className="flex-1 min-w-0" onClick={onNavigate} role="button">
        <p className="font-semibold text-sm leading-tight cursor-pointer hover:underline">{u.full_name || u.username || 'User'}</p>
        {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
        {u.headline && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.headline}</p>}
      </div>
      {!isMe && (
        <Button size="sm" variant={following ? 'outline' : 'default'} onClick={onFollow} className="gap-1.5 flex-shrink-0 text-xs">
          {following ? <><UserCheck className="w-3 h-3" /> Following</> : <><UserPlus className="w-3 h-3" /> Follow</>}
        </Button>
      )}
    </div>
  )
}

function CompanyRow({ company, following, onFollow, onNavigate }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors">
      <button onClick={onNavigate} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center">
          {company.logo_url ? <img src={company.logo_url} className="w-full h-full object-cover" alt="" /> : <Building2 className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>
      <div className="flex-1 min-w-0" onClick={onNavigate} role="button">
        <p className="font-semibold text-sm leading-tight cursor-pointer hover:underline">{company.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {company.industry && <Badge variant="secondary" className="text-xs py-0">{company.industry}</Badge>}
          <span className="text-xs text-muted-foreground">{company.follower_count || 0} followers</span>
        </div>
        {company.tagline && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{company.tagline}</p>}
      </div>
      <Button size="sm" variant={following ? 'outline' : 'default'} onClick={onFollow} className="gap-1.5 flex-shrink-0 text-xs">
        {following ? <><BellOff className="w-3 h-3" /> Following</> : <><Bell className="w-3 h-3" /> Follow</>}
      </Button>
    </div>
  )
}

function PostRow({ post }) {
  const text = post.content?.replace(/<[^>]+>/g, '').slice(0, 160) ?? ''
  return (
    <Link to="/" className="block bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
          {post.author_avatar ? <img src={post.author_avatar} className="w-full h-full object-cover" alt="" /> : (post.author_name || '?')[0]}
        </div>
        <span className="text-xs font-medium">{post.author_name || 'User'}</span>
        <span className="text-xs text-muted-foreground ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{text}</p>
      {(post.likes_count > 0) && <p className="text-xs text-muted-foreground mt-1">{post.likes_count} likes</p>}
    </Link>
  )
}

function Empty({ label }) {
  return <div className="text-center py-12 text-sm text-muted-foreground">{label}</div>
}
