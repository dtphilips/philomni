import React, { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2, Plus, Upload, Loader2, Users, Briefcase, Globe, MapPin,
  Edit, Trash2, ExternalLink, Copy, CheckCircle2, Image, MoreHorizontal,
  BadgeCheck, ChevronRight, Mail, Link2, DollarSign, Eye
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Media & Entertainment',
  'Retail & E-commerce', 'Food & Beverage', 'Fashion & Beauty', 'Real Estate',
  'Travel & Hospitality', 'Marketing & Advertising', 'Legal', 'Manufacturing',
  'Non-profit', 'Sports & Fitness', 'Music & Arts', 'Gaming', 'Automotive',
  'Energy', 'Agriculture', 'Other',
]

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,000+']

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote']

const emptyCompanyForm = {
  handle: '', name: '', tagline: '', bio: '', website: '',
  industry: '', company_size: '', location: '',
}

const emptyJobForm = {
  title: '', type: 'Full-time', location: '', salary_min: '', salary_max: '',
  description: '', requirements: '', apply_url: '', apply_email: '', status: 'open',
}

export default function CompanySetup() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('mine')
  const [managingCompany, setManagingCompany] = useState(null)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [showEditCompany, setShowEditCompany] = useState(false)
  const [showNewJob, setShowNewJob] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm)
  const [editCompanyForm, setEditCompanyForm] = useState(emptyCompanyForm)
  const [jobForm, setJobForm] = useState(emptyJobForm)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [editLogoFile, setEditLogoFile] = useState(null)
  const [editCoverFile, setEditCoverFile] = useState(null)
  const [handleTaken, setHandleTaken] = useState(false)
  const logoRef = useRef()
  const coverRef = useRef()
  const editLogoRef = useRef()
  const editCoverRef = useRef()

  const openEditCompany = (company) => {
    setEditCompanyForm({
      name: company.name || '', handle: company.handle || '', tagline: company.tagline || '',
      bio: company.bio || '', website: company.website || '', industry: company.industry || '',
      company_size: company.company_size || '', location: company.location || '',
    })
    setEditLogoFile(null)
    setEditCoverFile(null)
    setShowEditCompany(true)
  }

  const handleUpdateCompany = async () => {
    if (!editCompanyForm.name.trim()) return toast.error('Company name is required')
    setSaving(true)
    try {
      let updates = { ...editCompanyForm }
      if (editLogoFile) updates.logo_url = await uploadFile(editLogoFile, `companies/${user.id}/${Date.now()}-logo`)
      if (editCoverFile) updates.cover_url = await uploadFile(editCoverFile, `companies/${user.id}/${Date.now()}-cover`)
      const { error } = await supabase.from('company_pages').update(updates).eq('id', managingCompany.id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['my-companies', user.id] })
      // Update local managingCompany state so ManagePanel reflects changes immediately
      setManagingCompany(prev => ({ ...prev, ...updates }))
      setShowEditCompany(false)
      toast.success('Company updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const setManaging = (company) => { setManagingCompany(company); if (company) setActiveTab('manage') }

  // My companies — owned + those where user is admin/editor member
  const { data: myCompanies = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my-companies', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: owned }, { data: membered }] = await Promise.all([
        supabase.from('company_pages').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('company_members').select('role, company_pages(*)').eq('user_id', user.id).in('role', ['admin', 'editor']),
      ])
      const owned_ = owned ?? []
      const membered_ = (membered ?? []).map(m => m.company_pages).filter(Boolean)
      const all = [...owned_, ...membered_.filter(m => !owned_.find(o => o.id === m.id))]
      return all
    },
  })

  // Jobs for managed company
  const { data: companyJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['company-jobs', managingCompany?.id],
    enabled: !!managingCompany,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_jobs')
        .select('*')
        .eq('company_id', managingCompany.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  // Members for managed company
  const { data: companyMembers = [], refetch: refetchMembers } = useQuery({
    queryKey: ['company-members-manage', managingCompany?.id],
    enabled: !!managingCompany,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_members')
        .select('id, user_id, role, profiles:user_id(id, full_name, username, avatar_url)')
        .eq('company_id', managingCompany.id)
      return data ?? []
    },
  })

  const checkHandle = async (handle) => {
    if (!handle || handle.length < 2) return
    const { data } = await supabase.from('company_pages').select('id').eq('handle', handle).maybeSingle()
    setHandleTaken(!!data)
  }

  const uploadFile = async (file, path) => {
    const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
    return publicUrl
  }

  const handleCreateCompany = async () => {
    if (!companyForm.name.trim()) return toast.error('Company name is required')
    if (!companyForm.handle.trim()) return toast.error('Handle is required')
    if (handleTaken) return toast.error('That handle is already taken')
    setSaving(true)
    try {
      let logo_url = null, cover_url = null
      if (logoFile) logo_url = await uploadFile(logoFile, `companies/${user.id}/${Date.now()}-logo`)
      if (coverFile) cover_url = await uploadFile(coverFile, `companies/${user.id}/${Date.now()}-cover`)

      const { data, error } = await supabase.from('company_pages').insert({
        ...companyForm,
        handle: companyForm.handle.toLowerCase().replace(/\s+/g, ''),
        owner_id: user.id,
        logo_url,
        cover_url,
      }).select().single()
      if (error) throw error

      // Auto-add owner as member
      await supabase.from('company_members').insert({ company_id: data.id, user_id: user.id, role: 'owner' })

      qc.invalidateQueries({ queryKey: ['my-companies', user.id] })
      toast.success('Company page created!')
      setShowNewCompany(false)
      setCompanyForm(emptyCompanyForm)
      setLogoFile(null)
      setCoverFile(null)
      setManaging(data)
    } catch (e) {
      toast.error(e.message || 'Failed to create company')
    } finally { setSaving(false) }
  }

  const handleDeleteCompany = async (company) => {
    if (!window.confirm(`Delete "${company.name}"? This cannot be undone.`)) return
    await supabase.from('company_jobs').delete().eq('company_id', company.id)
    await supabase.from('company_members').delete().eq('company_id', company.id)
    await supabase.from('company_pages').delete().eq('id', company.id)
    if (managingCompany?.id === company.id) { setManagingCompany(null); setActiveTab('mine') }
    qc.invalidateQueries({ queryKey: ['my-companies', user.id] })
    toast.success('Company deleted')
  }

  const handleSaveJob = async () => {
    if (!jobForm.title.trim()) return toast.error('Job title is required')
    if (!jobForm.apply_url && !jobForm.apply_email) return toast.error('Add an apply URL or email')
    setSaving(true)
    try {
      const payload = {
        ...jobForm,
        company_id: managingCompany.id,
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      }
      if (editingJob) {
        const { error } = await supabase.from('company_jobs').update(payload).eq('id', editingJob.id)
        if (error) throw error
        toast.success('Job updated')
      } else {
        const { error } = await supabase.from('company_jobs').insert(payload)
        if (error) throw error
        toast.success('Job posted!')
      }
      refetchJobs()
      setShowNewJob(false)
      setEditingJob(null)
      setJobForm(emptyJobForm)
    } catch (e) {
      toast.error(e.message || 'Failed to save job')
    } finally { setSaving(false) }
  }

  const handleDeleteJob = async (id) => {
    await supabase.from('company_jobs').delete().eq('id', id)
    refetchJobs()
    toast.success('Job removed')
  }

  // ── Team management ─────────────────────────────────────────────────────────
  const [memberSearch, setMemberSearch] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState([])
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)
  const [addingRole, setAddingRole] = useState('editor')

  const searchUsers = async (q) => {
    setMemberSearch(q)
    if (q.trim().length < 2) { setMemberSearchResults([]); return }
    setMemberSearchLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name, username, avatar_url').or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(8)
    setMemberSearchResults(data ?? [])
    setMemberSearchLoading(false)
  }

  const addMember = async (profile, role) => {
    const existing = companyMembers.find(m => m.user_id === profile.id)
    if (existing) return toast.error(`${profile.full_name || profile.username} is already a team member`)
    if (profile.id === user.id) return toast.error('You are already the owner')
    const { error } = await supabase.from('company_members').insert({ company_id: managingCompany.id, user_id: profile.id, role })
    if (error) return toast.error(error.message)
    refetchMembers()
    setMemberSearch('')
    setMemberSearchResults([])
    toast.success(`${profile.full_name || profile.username} added as ${role}`)
  }

  const updateMemberRole = async (memberId, role) => {
    await supabase.from('company_members').update({ role }).eq('id', memberId)
    refetchMembers()
    toast.success('Role updated')
  }

  const removeMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from the team?`)) return
    await supabase.from('company_members').delete().eq('id', memberId)
    refetchMembers()
    toast.success('Member removed')
  }

  const openEditJob = (job) => {
    setJobForm({
      title: job.title, type: job.type, location: job.location || '',
      salary_min: job.salary_min || '', salary_max: job.salary_max || '',
      description: job.description || '', requirements: job.requirements || '',
      apply_url: job.apply_url || '', apply_email: job.apply_email || '',
      status: job.status,
    })
    setEditingJob(job)
    setShowNewJob(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Company Pages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage your brand presence on Philomni</p>
        </div>
        <Button onClick={() => setShowNewCompany(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Company
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 flex-wrap h-auto">
          <TabsTrigger value="mine">My Companies {myCompanies.length > 0 ? `(${myCompanies.length})` : ''}</TabsTrigger>
          {managingCompany && (
            <TabsTrigger value="manage" className="gap-1.5 max-w-[160px]">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{managingCompany.name}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Companies */}
        <TabsContent value="mine">
          {loadingMine ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : myCompanies.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No company pages yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create a page for your brand, startup, or business</p>
              <Button size="sm" onClick={() => setShowNewCompany(true)}>Create Company Page</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myCompanies.map(c => (
                <CompanyCard key={c.id} company={c} onManage={setManaging} onDelete={handleDeleteCompany} onView={() => navigate(`/company/${c.handle}`)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manage */}
        {managingCompany && (
          <TabsContent value="manage">
            <ManagePanel
              company={managingCompany}
              jobs={companyJobs}
              members={companyMembers}
              ownerId={user?.id}
              memberSearch={memberSearch}
              memberSearchResults={memberSearchResults}
              memberSearchLoading={memberSearchLoading}
              addingRole={addingRole}
              onAddingRoleChange={setAddingRole}
              onMemberSearch={searchUsers}
              onAddMember={addMember}
              onUpdateMemberRole={updateMemberRole}
              onRemoveMember={removeMember}
              onAddJob={() => { setEditingJob(null); setJobForm(emptyJobForm); setShowNewJob(true) }}
              onEditJob={openEditJob}
              onDeleteJob={handleDeleteJob}
              onViewProfile={() => navigate(`/company/${managingCompany.handle}`)}
              onEditCompany={() => openEditCompany(managingCompany)}
              onDeleteCompany={() => handleDeleteCompany(managingCompany)}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Create Company Dialog */}
      <Dialog open={showNewCompany} onOpenChange={setShowNewCompany}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Company Page</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Cover + Logo */}
            <div className="relative">
              <div
                onClick={() => coverRef.current?.click()}
                className="h-24 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors overflow-hidden bg-muted flex items-center justify-center">
                {coverFile
                  ? <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="" />
                  : <span className="text-xs text-muted-foreground flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Cover image</span>}
              </div>
              <div
                onClick={() => logoRef.current?.click()}
                className="absolute -bottom-5 left-4 w-14 h-14 rounded-xl border-2 border-background bg-muted cursor-pointer overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center">
                {logoFile
                  ? <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" alt="" />
                  : <Building2 className="w-6 h-6 text-muted-foreground" />}
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files[0])} />
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
            </div>

            <div className="pt-6">
              <Label>Company Name *</Label>
              <Input value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Inc." className="mt-1" />
            </div>

            <div>
              <Label>Handle * <span className="text-muted-foreground font-normal">(your @username for the company)</span></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  value={companyForm.handle}
                  onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); setCompanyForm(p => ({ ...p, handle: v })); checkHandle(v) }}
                  placeholder="acmeinc"
                  className={`pl-7 ${handleTaken ? 'border-destructive' : ''}`}
                />
              </div>
              {handleTaken && <p className="text-xs text-destructive mt-1">Handle already taken</p>}
            </div>

            <div>
              <Label>Tagline</Label>
              <Input value={companyForm.tagline} onChange={e => setCompanyForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Building the future of..." className="mt-1" maxLength={120} />
            </div>

            <div>
              <Label>About</Label>
              <Textarea value={companyForm.bio} onChange={e => setCompanyForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="mt-1" placeholder="What does your company do?" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Select value={companyForm.industry} onValueChange={v => setCompanyForm(p => ({ ...p, industry: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Select value={companyForm.company_size} onValueChange={v => setCompanyForm(p => ({ ...p, company_size: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="# employees" /></SelectTrigger>
                  <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input value={companyForm.location} onChange={e => setCompanyForm(p => ({ ...p, location: e.target.value }))} placeholder="Lagos, Nigeria" className="mt-1" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={companyForm.website} onChange={e => setCompanyForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="mt-1" />
              </div>
            </div>

            <Button onClick={handleCreateCompany} disabled={saving || handleTaken} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Company Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={showEditCompany} onOpenChange={setShowEditCompany}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Company Page</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <div onClick={() => editCoverRef.current?.click()} className="h-24 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors overflow-hidden bg-muted flex items-center justify-center">
                {editCoverFile
                  ? <img src={URL.createObjectURL(editCoverFile)} className="w-full h-full object-cover" alt="" />
                  : managingCompany?.cover_url
                    ? <img src={managingCompany.cover_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xs text-muted-foreground flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Cover image</span>}
              </div>
              <div onClick={() => editLogoRef.current?.click()} className="absolute -bottom-5 left-4 w-14 h-14 rounded-xl border-2 border-background bg-muted cursor-pointer overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center">
                {editLogoFile
                  ? <img src={URL.createObjectURL(editLogoFile)} className="w-full h-full object-cover" alt="" />
                  : managingCompany?.logo_url
                    ? <img src={managingCompany.logo_url} className="w-full h-full object-cover" alt="" />
                    : <Building2 className="w-6 h-6 text-muted-foreground" />}
              </div>
              <input ref={editCoverRef} type="file" accept="image/*" className="hidden" onChange={e => setEditCoverFile(e.target.files[0])} />
              <input ref={editLogoRef} type="file" accept="image/*" className="hidden" onChange={e => setEditLogoFile(e.target.files[0])} />
            </div>
            <div className="pt-6">
              <Label>Company Name *</Label>
              <Input value={editCompanyForm.name} onChange={e => setEditCompanyForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={editCompanyForm.tagline} onChange={e => setEditCompanyForm(p => ({ ...p, tagline: e.target.value }))} maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label>About</Label>
              <Textarea value={editCompanyForm.bio} onChange={e => setEditCompanyForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Select value={editCompanyForm.industry} onValueChange={v => setEditCompanyForm(p => ({ ...p, industry: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Select value={editCompanyForm.company_size} onValueChange={v => setEditCompanyForm(p => ({ ...p, company_size: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="# employees" /></SelectTrigger>
                  <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input value={editCompanyForm.location} onChange={e => setEditCompanyForm(p => ({ ...p, location: e.target.value }))} placeholder="Lagos, Nigeria" className="mt-1" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={editCompanyForm.website} onChange={e => setEditCompanyForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="mt-1" />
              </div>
            </div>
            <Button onClick={handleUpdateCompany} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New / Edit Job Dialog */}
      <Dialog open={showNewJob} onOpenChange={v => { setShowNewJob(v); if (!v) { setEditingJob(null); setJobForm(emptyJobForm) } }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingJob ? 'Edit Job' : 'Post a Job'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Job Title *</Label>
              <Input value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="Senior Product Designer" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={jobForm.type} onValueChange={v => setJobForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} placeholder="Remote / Lagos" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salary Min ($/yr)</Label>
                <Input type="number" value={jobForm.salary_min} onChange={e => setJobForm(p => ({ ...p, salary_min: e.target.value }))} placeholder="50000" className="mt-1" />
              </div>
              <div>
                <Label>Salary Max ($/yr)</Label>
                <Input type="number" value={jobForm.salary_max} onChange={e => setJobForm(p => ({ ...p, salary_max: e.target.value }))} placeholder="80000" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} rows={4} className="mt-1" placeholder="What will this person do?" />
            </div>
            <div>
              <Label>Requirements</Label>
              <Textarea value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))} rows={3} className="mt-1" placeholder="Skills, experience, qualifications..." />
            </div>
            <div>
              <Label>Apply URL</Label>
              <Input value={jobForm.apply_url} onChange={e => setJobForm(p => ({ ...p, apply_url: e.target.value }))} placeholder="https://careers.company.com/..." className="mt-1" />
            </div>
            <div>
              <Label>Or Apply Email</Label>
              <Input value={jobForm.apply_email} onChange={e => setJobForm(p => ({ ...p, apply_email: e.target.value }))} placeholder="jobs@company.com" className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={jobForm.status} onValueChange={v => setJobForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveJob} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingJob ? 'Save Changes' : 'Post Job'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CompanyCard({ company, onManage, onDelete, onView }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {company.cover_url && <div className="h-16 overflow-hidden"><img src={company.cover_url} className="w-full h-full object-cover" alt="" /></div>}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden border border-border">
          {company.logo_url
            ? <img src={company.logo_url} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{company.name}</h3>
            {company.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">@{company.handle}</p>
          {company.industry && <Badge variant="secondary" className="text-xs mt-1">{company.industry}</Badge>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {company.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.follower_count || 0} followers</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={() => onManage(company)}>Manage</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}><Eye className="w-4 h-4 mr-2" /> View Page</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(company)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function ManagePanel({ company, jobs, members, ownerId, memberSearch, memberSearchResults, memberSearchLoading, addingRole, onAddingRoleChange, onMemberSearch, onAddMember, onUpdateMemberRole, onRemoveMember, onAddJob, onEditJob, onDeleteJob, onViewProfile, onEditCompany, onDeleteCompany }) {
  return (
    <div className="space-y-6">
      {/* Company summary */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border">
          {company.logo_url
            ? <img src={company.logo_url} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{company.name}</h2>
            {company.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">@{company.handle} · {company.industry || 'No industry set'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onViewProfile} className="gap-1.5">
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={onEditCompany} className="gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDeleteCompany} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Followers', value: company.follower_count || 0, icon: Users },
          { label: 'Open Jobs', value: jobs.filter(j => j.status === 'open').length, icon: Briefcase },
          { label: 'Total Jobs', value: jobs.length, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Company info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm">
        <h3 className="font-semibold mb-3">Company Info</h3>
        {company.tagline && <p className="text-muted-foreground italic">"{company.tagline}"</p>}
        {company.bio && <p className="text-muted-foreground">{company.bio}</p>}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
          {company.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</span>}
          {company.company_size && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.company_size} employees</span>}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="w-3 h-3" />{company.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Job Listings</h3>
          <Button size="sm" onClick={onAddJob} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Post Job</Button>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No jobs posted yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onAddJob}>Post your first job</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onEdit={onEditJob} onDelete={onDeleteJob} />
            ))}
          </div>
        )}
      </div>

      {/* Team */}
      <div>
        <h3 className="font-semibold mb-1">Team Members</h3>
        <p className="text-xs text-muted-foreground mb-3">
          <strong>Admin</strong> — can post, edit company info, manage jobs &amp; members.&nbsp;
          <strong>Editor</strong> — can post and manage jobs only.&nbsp;
          <strong>Member</strong> — listed on the public page only.
        </p>

        {/* Add member search */}
        <div className="bg-muted/50 border border-border rounded-xl p-3 mb-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add a team member</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={memberSearch}
                onChange={e => onMemberSearch(e.target.value)}
                placeholder="Search by name or @username…"
                className="text-sm"
              />
              {memberSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
            <Select value={addingRole} onValueChange={onAddingRoleChange}>
              <SelectTrigger className="w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {memberSearchResults.length > 0 && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              {memberSearchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => onAddMember(p, addingRole)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" /> : (p.full_name || p.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{p.full_name || p.username}</p>
                    {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                  </div>
                  <span className="text-xs text-primary font-medium">Add as {addingRole}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current members */}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No team members added yet</p>
        ) : (
          <div className="space-y-2">
            {members.map(m => {
              const p = m.profiles
              const isOwnerRow = m.user_id === ownerId
              return (
                <div key={m.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" /> : (p?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{p?.full_name || p?.username || 'Member'}</p>
                    {p?.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                  </div>
                  {isOwnerRow ? (
                    <Badge variant="secondary" className="text-xs">Owner</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select value={m.role} onValueChange={role => onUpdateMemberRole(m.id, role)}>
                        <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onRemoveMember(m.id, p?.full_name || p?.username || 'this member')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, onEdit, onDelete }) {
  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k/yr`
    : job.salary_min ? `From $${(job.salary_min / 1000).toFixed(0)}k/yr` : null

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm">{job.title}</h4>
          <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs">{job.status}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type}</span>
          {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
          {salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{salary}</span>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(job)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(job.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
