import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_NAMES, CATEGORIES } from '@/lib/categories';
import {
  Search, Plus, MapPin, Clock, DollarSign, Briefcase, Loader2, Wifi, Zap
} from 'lucide-react';
import MatchScoreBadge from '@/components/marketplace/MatchScoreBadge';
import { computeMatchScore } from '@/lib/matchScore';
import JobAlertPanel from '@/components/marketplace/JobAlertPanel';
import ApplyButton from '@/components/marketplace/ApplyButton';
import { ALL_SKILLS } from '@/lib/categories';
import SkillsInput from '@/components/ui/SkillsInput';

const TYPE_LABELS = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', gig: 'Gig', internship: 'Internship'
};

export default function Marketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'full_time', category: '', location: '', remote: false, budget_min: '', budget_max: '', skills_required: [] });
  const [posting, setPosting] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => { const { data } = await supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(50); return data ?? []; },
  });

  const isMatchableRole = ['creator', 'professional'].includes(user?.role);

  const filtered = jobs
    .filter(j => {
      const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || j.category === categoryFilter;
      const matchSkill = !skillFilter || j.skills_required?.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
      return matchSearch && matchCat && matchSkill;
    })
    .sort((a, b) => {
      // For matchable roles, sort by match score descending, then by date
      if (isMatchableRole) {
        return computeMatchScore(user, b) - computeMatchScore(user, a);
      }
      return 0;
    });

  const handleCreate = async () => {
    setPosting(true);
    await supabase.from('jobs').insert({
      ...form,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : undefined,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
      poster_id: user.id,
      poster_name: user.full_name,
      poster_avatar: user.avatar_url || '',
      status: 'open',
    });
    setPosting(false);
    setShowCreate(false);
    setForm({ title: '', description: '', type: 'full_time', category: '', location: '', remote: false, budget_min: '', budget_max: '', skills_required: [] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  const updateForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Marketplace</h1>
          {isMatchableRole && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" /> Jobs ranked by your match score
            </p>
          )}
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Post Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Post a Job or Gig</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="e.g. Senior React Developer" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={4} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => updateForm('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => updateForm('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min Budget ($)</Label><Input type="number" value={form.budget_min} onChange={e => updateForm('budget_min', e.target.value)} /></div>
                <div><Label>Max Budget ($)</Label><Input type="number" value={form.budget_max} onChange={e => updateForm('budget_max', e.target.value)} /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => updateForm('location', e.target.value)} placeholder="City, Country" /></div>
              <div>
                <Label>Required Skills</Label>
                <div className="mt-1"><SkillsInput skills={form.skills_required} onChange={v => updateForm('skills_required', v)} placeholder="e.g. React, Figma..." max={10} /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remote" checked={form.remote} onChange={e => updateForm('remote', e.target.checked)} className="rounded" />
                <Label htmlFor="remote" className="mb-0">Remote friendly</Label>
              </div>
              <Button onClick={handleCreate} disabled={posting || !form.title} className="w-full">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Job'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isMatchableRole && <JobAlertPanel user={user} />}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs and gigs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-muted/50" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="pl-10 h-10 bg-muted/50"
          />
        </div>
      </div>
      {skillFilter && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ALL_SKILLS.filter(s => s.toLowerCase().includes(skillFilter.toLowerCase())).slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => setSkillFilter(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{job.poster_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">{TYPE_LABELS[job.type] || job.type}</Badge>
                  <MatchScoreBadge user={user} job={job} />
                  <ApplyButton job={job} user={user} />
                </div>
              </div>
              {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
              {job.skills_required?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.skills_required.slice(0, 5).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{s}</span>
                  ))}
                  {job.skills_required.length > 5 && <span className="text-xs text-muted-foreground py-0.5">+{job.skills_required.length - 5} more</span>}
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {job.category && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.category}</span>}
                {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                {job.remote && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" />Remote</span>}
                {(job.budget_min || job.budget_max) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {job.budget_min && `$${job.budget_min.toLocaleString()}`}
                    {job.budget_min && job.budget_max && ' – '}
                    {job.budget_max && `$${job.budget_max.toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}