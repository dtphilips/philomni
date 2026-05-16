import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, Briefcase, FileText, BarChart2,
  Plus, Eye, Edit2, Trash2, ExternalLink, UserPlus, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SAMPLE_JOBS = [
  { id: 'j1', title: 'Senior Video Editor', type: 'Full-time', location: 'Remote', applicant_count: 14, status: 'active' },
  { id: 'j2', title: 'Social Media Manager', type: 'Contract', location: 'New York, NY', applicant_count: 27, status: 'active' },
  { id: 'j3', title: 'Brand Partnerships Lead', type: 'Full-time', location: 'Los Angeles, CA', applicant_count: 8, status: 'closed' },
]

const SAMPLE_POSTS = [
  { id: 'p1', content: "We're thrilled to announce the launch of our new creator accelerator program! Applications are now open for Q3 cohort. If you're a creator looking to scale your brand, apply now.", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), view_count: 1240 },
  { id: 'p2', content: "Shoutout to our amazing team for hitting 10K followers on our company page! We're just getting started. Stay tuned for some exciting announcements.", created_at: new Date(Date.now() - 7 * 86400000).toISOString(), view_count: 890 },
]

const SAMPLE_TEAM = [
  { id: 't1', user_id: 'u1', role: 'owner', users: { full_name: 'You', avatar_url: null, email: 'you@example.com' } },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  const w = Math.floor(d / 7)
  return `${w}w ago`
}

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [companyData, setCompanyData] = useState(null)

  // Jobs
  const [jobs, setJobs] = useState([])

  // Posts
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  // Team
  const [team, setTeam] = useState([])
  const [addAdminEmail, setAddAdminEmail] = useState('')
  const [addAdminError, setAddAdminError] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)

  useEffect(() => {
    loadCompany()
  }, [])

  async function loadCompany() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('company_admins')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data?.companies) {
        setCompanyData(data)
        await Promise.all([
          loadJobs(data.companies.id),
          loadPosts(data.companies.id),
          loadTeam(data.companies.id),
        ])
      }
    } catch (err) {
      console.error('Failed to load company:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadJobs(companyId) {
    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setJobs(data?.length ? data : SAMPLE_JOBS)
  }

  async function loadPosts(companyId) {
    const { data } = await supabase
      .from('company_posts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setPosts(data?.length ? data : SAMPLE_POSTS)
  }

  async function loadTeam(companyId) {
    const { data } = await supabase
      .from('company_admins')
      .select('*, users(full_name, avatar_url, email)')
      .eq('company_id', companyId)
    setTeam(data?.length ? data : SAMPLE_TEAM)
  }

  async function handlePostUpdate() {
    if (!newPostContent.trim()) return
    setPostingUpdate(true)
    try {
      const { data, error } = await supabase
        .from('company_posts')
        .insert({
          company_id: companyData.companies.id,
          content: newPostContent.trim(),
          created_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      setPosts([data, ...posts])
      setNewPostContent('')
    } catch (err) {
      console.error('Failed to post update:', err)
    } finally {
      setPostingUpdate(false)
    }
  }

  async function handleDeletePost(postId) {
    await supabase.from('company_posts').delete().eq('id', postId)
    setPosts(posts.filter(p => p.id !== postId))
  }

  async function handleAddAdmin() {
    if (!addAdminEmail.trim()) return
    setAddAdminError('')
    setAddingAdmin(true)
    try {
      const { data: foundUser, error: findError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('email', addAdminEmail.trim().toLowerCase())
        .maybeSingle()

      if (findError || !foundUser) {
        setAddAdminError('No user found with that email address.')
        return
      }

      const { error: insertError } = await supabase
        .from('company_admins')
        .insert({
          company_id: companyData.companies.id,
          user_id: foundUser.id,
          role: 'admin',
        })

      if (insertError) {
        setAddAdminError('Could not add admin. They may already be a team member.')
        return
      }

      setAddAdminEmail('')
      setShowAddAdmin(false)
      await loadTeam(companyData.companies.id)
    } catch (err) {
      setAddAdminError(err.message || 'Failed to add admin.')
    } finally {
      setAddingAdmin(false)
    }
  }

  async function handleRemoveAdmin(memberId, memberUserId) {
    if (memberUserId === user.id) return
    await supabase.from('company_admins').delete().eq('id', memberId)
    setTeam(team.filter(m => m.id !== memberId))
  }

  const isOwner = companyData?.role === 'owner'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!companyData?.companies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Company Page Yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You haven't created a company page. Set one up to post jobs, share updates, and build your brand.
          </p>
          <button
            onClick={() => navigate('/company/create')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create Company Page
          </button>
        </div>
      </div>
    )
  }

  const company = companyData.companies

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
              <p className="text-sm text-muted-foreground">{company.industry} · {companyData.role}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/company/${company.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Page
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Followers" value={company.follower_count?.toLocaleString() ?? '0'} icon={Users} />
              <StatCard label="Job Applications" value="—" sub="loading..." icon={Briefcase} />
              <StatCard label="Post Views" value="12,400" sub="Last 30 days" icon={Eye} />
              <StatCard label="Profile Views" value="3,280" sub="Last 30 days" icon={BarChart2} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/jobs/create')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Briefcase className="w-4 h-4" />
                  Post a Job
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Post an Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Posted Jobs</h2>
              <button
                onClick={() => navigate('/jobs/create')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Post New Job
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No jobs posted yet</p>
                <p className="text-sm text-muted-foreground mt-1">Post your first job to start receiving applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{job.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border
                          ${job.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          {job.status}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full border border-border text-muted-foreground">{job.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{job.location}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-foreground">{job.applicant_count ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Applicants</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
                        View Applicants
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {/* Composer */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground">New Update</h2>
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                rows={3}
                placeholder="Share a company update, announcement, or news with your followers..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePostUpdate}
                  disabled={!newPostContent.trim() || postingUpdate}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postingUpdate ? 'Posting...' : 'Post Update'}
                </button>
              </div>
            </div>

            {/* Post list */}
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{timeAgo(post.created_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count?.toLocaleString() ?? 0} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Team Members</h2>
              {isOwner && (
                <button
                  onClick={() => setShowAddAdmin(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Admin
                </button>
              )}
            </div>

            {/* Add admin form */}
            {showAddAdmin && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Add a Team Member</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={addAdminEmail}
                    onChange={e => setAddAdminEmail(e.target.value)}
                    placeholder="Enter their email address"
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    onClick={handleAddAdmin}
                    disabled={addingAdmin || !addAdminEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {addingAdmin ? '...' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setShowAddAdmin(false); setAddAdminEmail(''); setAddAdminError('') }}
                    className="px-3 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {addAdminError && <p className="text-xs text-red-400">{addAdminError}</p>}
              </div>
            )}

            {/* Team list */}
            <div className="space-y-3">
              {team.map(member => {
                const memberUser = member.users || {}
                const initials = memberUser.full_name
                  ? memberUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '?'
                return (
                  <div key={member.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {memberUser.avatar_url ? (
                        <img src={memberUser.avatar_url} alt={memberUser.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold text-foreground">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">{memberUser.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{memberUser.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border
                        ${member.role === 'owner' ? 'bg-primary/10 text-primary border-primary/20'
                          : member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-muted text-muted-foreground border-border'}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      {isOwner && member.role !== 'owner' && member.user_id !== user.id && (
                        <button
                          onClick={() => handleRemoveAdmin(member.id, member.user_id)}
                          className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
