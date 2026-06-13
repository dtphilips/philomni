import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Building2, MapPin, Globe, Users, Briefcase, BadgeCheck,
  DollarSign, ExternalLink, Bell, BellOff, Settings, Loader2, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

export default function CompanyProfile() {
  const { id: handle } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [myCompanies, setMyCompanies] = useState([])
  const [showAsDropdown, setShowAsDropdown] = useState(false)

  // Load companies this user manages (for "Follow as Company" feature)
  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('company_pages').select('id, name, logo_url, handle').eq('owner_id', user.id),
      supabase.from('company_members').select('company_pages(id, name, logo_url, handle)').eq('user_id', user.id).in('role', ['admin', 'editor']),
    ]).then(([{ data: owned }, { data: membered }]) => {
      const merged = [
        ...(owned ?? []),
        ...(membered ?? []).map(m => m.company_pages).filter(Boolean),
      ]
      const seen = new Set()
      setMyCompanies(merged.filter(c => c && !seen.has(c.id) && seen.add(c.id)))
    })
  }, [user?.id])

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-profile', handle],
    queryFn: async () => {
      const { data } = await supabase.from('company_pages').select('*').eq('handle', handle).maybeSingle()
      return data
    },
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ['company-public-jobs', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase.from('company_jobs').select('*').eq('company_id', company.id).eq('status', 'open').order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: followRow, refetch: refetchFollow } = useQuery({
    queryKey: ['company-follow', company?.id, user?.id],
    enabled: !!company?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('company_follows').select('id').eq('company_id', company.id).eq('user_id', user.id).maybeSingle()
      return data
    },
  })

  // Which of my companies are already following this company
  const { data: companyFollowSet = new Set(), refetch: refetchCompanyFollows } = useQuery({
    queryKey: ['company-following-this', company?.id, myCompanies.map(c => c.id).join(',')],
    enabled: !!company?.id && myCompanies.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('company_following')
        .select('company_id')
        .eq('target_type', 'company')
        .eq('target_id', company.id)
        .in('company_id', myCompanies.map(c => c.id))
      return new Set((data ?? []).map(r => r.company_id))
    },
  })

  const { data: companyPosts = [] } = useQuery({
    queryKey: ['company-posts', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('id, content, media_urls, media_type, created_at, likes_count, comments_count').eq('company_id', company.id).order('created_at', { ascending: false }).limit(20)
      return data ?? []
    },
  })

  const { data: members = [] } = useQuery({
    queryKey: ['company-members', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase.from('company_members').select('user_id, role, profiles:user_id(id, username, full_name, avatar_url)').eq('company_id', company.id)
      return data ?? []
    },
  })

  const isOwner = user?.id === company?.owner_id
  const isMember = members.some(m => m.user_id === user?.id && ['owner', 'admin', 'editor'].includes(m.role))
  const canManage = isOwner || isMember
  const isFollowing = !!followRow

  const refresh = () => {
    refetchFollow()
    qc.invalidateQueries({ queryKey: ['company-profile', handle] })
  }

  const toggleFollow = async () => {
    if (!user) return toast.error('Sign in to follow companies')
    if (isFollowing) {
      await supabase.from('company_follows').delete().eq('id', followRow.id)
    } else {
      await supabase.from('company_follows').insert({ company_id: company.id, user_id: user.id })
    }
    refresh()
    toast.success(isFollowing ? `Unfollowed ${company.name}` : `Following ${company.name}`)
  }

  const toggleFollowAsCompany = async (myCompany) => {
    setShowAsDropdown(false)
    const isAlreadyFollowing = companyFollowSet.has(myCompany.id)
    if (isAlreadyFollowing) {
      await supabase.from('company_following').delete()
        .eq('company_id', myCompany.id).eq('target_type', 'company').eq('target_id', company.id)
      toast.success(`${myCompany.name} unfollowed ${company.name}`)
    } else {
      await supabase.from('company_following').insert({ company_id: myCompany.id, target_type: 'company', target_id: company.id })
      toast.success(`${myCompany.name} is now following ${company.name}`)
    }
    refetchCompanyFollows()
  }

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  )

  if (!company) return (
    <div className="text-center py-24">
      <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Company not found</h2>
      <p className="text-sm text-muted-foreground mt-1">@{handle} doesn't exist on Philomni</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden rounded-b-2xl">
        {company.cover_url && <img src={company.cover_url} className="w-full h-full object-cover" alt="" />}
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="w-20 h-20 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-md flex items-center justify-center">
            {company.logo_url
              ? <img src={company.logo_url} className="w-full h-full object-cover" alt="" />
              : <Building2 className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 mb-1">
            {canManage && (
              <Link to="/company-setup">
                <Button variant="outline" size="sm" className="gap-1.5"><Settings className="w-3.5 h-3.5" /> Manage</Button>
              </Link>
            )}
            <Button size="sm" variant={isFollowing ? 'outline' : 'default'} onClick={toggleFollow} className="gap-1.5">
              {isFollowing ? <><BellOff className="w-3.5 h-3.5" /> Following</> : <><Bell className="w-3.5 h-3.5" /> Follow</>}
            </Button>
            {/* Follow as one of my companies */}
            {myCompanies.filter(c => c.id !== company?.id).length > 0 && (
              <div className="relative">
                <Button size="sm" variant="outline" onClick={() => setShowAsDropdown(v => !v)} className="gap-1 px-2">
                  <Building2 className="w-3.5 h-3.5" /><ChevronDown className="w-3 h-3" />
                </Button>
                {showAsDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <p className="text-xs text-muted-foreground px-3 pt-2.5 pb-1 font-medium">Follow as company</p>
                    {myCompanies.filter(c => c.id !== company?.id).map(mc => (
                      <button key={mc.id} onClick={() => toggleFollowAsCompany(mc)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-sm text-left transition-colors">
                        <div className="w-6 h-6 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {mc.logo_url ? <img src={mc.logo_url} className="w-full h-full object-cover" alt="" /> : <Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <span className="flex-1 truncate">{mc.name}</span>
                        {companyFollowSet.has(mc.id) && <BellOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{company.name}</h1>
            {company.verified && <BadgeCheck className="w-5 h-5 text-primary" />}
            {company.industry && <Badge variant="secondary" className="text-xs">{company.industry}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">@{company.handle}</p>
          {company.tagline && <p className="text-sm mt-1 italic text-muted-foreground">"{company.tagline}"</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            {company.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</span>}
            {company.company_size && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.company_size} employees</span>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="w-3 h-3" />{company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.follower_count || 0} followers</span>
          </div>
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts {companyPosts.length > 0 ? `(${companyPosts.length})` : ''}</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="jobs">Jobs {jobs.length > 0 ? `(${jobs.length})` : ''}</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {companyPosts.length === 0
              ? <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                </div>
              : <div className="space-y-3">
                  {companyPosts.map(p => {
                    const text = p.content?.replace(/<[^>]+>/g, '') ?? ''
                    const img = p.media_urls?.[0]
                    return (
                      <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                        {text && <p className="text-sm whitespace-pre-wrap line-clamp-4">{text}</p>}
                        {img && p.media_type === 'image' && <img src={img} className="mt-2 rounded-lg max-h-48 object-cover w-full" alt="" />}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{p.likes_count || 0} likes</span>
                          <span>{p.comments_count || 0} comments</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>}
          </TabsContent>

          <TabsContent value="about">
            {company.bio
              ? <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold mb-2">About {company.name}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.bio}</p>
                </div>
              : <div className="text-center py-10 text-sm text-muted-foreground">No bio added yet.</div>}
          </TabsContent>

          <TabsContent value="jobs">
            {jobs.length === 0
              ? <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No open positions right now</p>
                </div>
              : <div className="space-y-3">{jobs.map(job => <PublicJobCard key={job.id} job={job} />)}</div>}
          </TabsContent>

          <TabsContent value="team">
            {members.length === 0
              ? <div className="text-center py-10 text-sm text-muted-foreground">No team members listed.</div>
              : <div className="space-y-3">
                  {members.map(m => {
                    const p = m.profiles
                    return (
                      <div key={m.user_id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {p?.avatar_url
                            ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />
                            : (p?.full_name || p?.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{p?.full_name || p?.username || 'Member'}</p>
                          {p?.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                      </div>
                    )
                  })}
                </div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function PublicJobCard({ job }) {
  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k/yr`
    : job.salary_min ? `From $${(job.salary_min / 1000).toFixed(0)}k/yr` : null
  const applyHref = job.apply_url || (job.apply_email ? `mailto:${job.apply_email}` : null)

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">{job.title}</h4>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type}</span>
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
            {salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{salary}</span>}
          </div>
          {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
        </div>
        {applyHref && (
          <a href={applyHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-1.5 flex-shrink-0">Apply <ExternalLink className="w-3 h-3" /></Button>
          </a>
        )}
      </div>
    </div>
  )
}
