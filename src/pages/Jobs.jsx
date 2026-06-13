import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Briefcase, MapPin, DollarSign, Search, Building2, ExternalLink, Loader2
} from 'lucide-react'

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_jobs')
        .select('*, company:company_id(id, name, logo_url, handle)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchQ = !q || j.title?.toLowerCase().includes(q) || j.company?.name?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)
    const matchType = !typeFilter || j.type === typeFilter
    return matchQ && matchType
  })

  return (
    <div className="max-w-3xl mx-auto pb-16 px-4">
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-1">Jobs Board</h1>
        <p className="text-sm text-muted-foreground">Open positions from companies on Philomni</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs, companies, locations…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={typeFilter === '' ? 'default' : 'outline'} onClick={() => setTypeFilter('')} className="text-xs">All</Button>
          {JOB_TYPES.map(t => (
            <Button key={t} size="sm" variant={typeFilter === t ? 'default' : 'outline'} onClick={() => setTypeFilter(t === typeFilter ? '' : t)} className="text-xs">{t}</Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or check back later</p>
        </div>
      ) : (
        <div className="space-y-3">{filtered.map(job => <JobCard key={job.id} job={job} />)}</div>
      )}
    </div>
  )
}

function JobCard({ job }) {
  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k/yr`
    : job.salary_min ? `From $${(job.salary_min / 1000).toFixed(0)}k/yr` : null
  const applyHref = job.apply_url || (job.apply_email ? `mailto:${job.apply_email}` : null)
  const co = job.company

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <Link to={co ? `/company/${co.handle}` : '#'} className="flex-shrink-0">
          <div className="w-11 h-11 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center">
            {co?.logo_url
              ? <img src={co.logo_url} className="w-full h-full object-cover" alt="" />
              : <Building2 className="w-5 h-5 text-muted-foreground" />}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{job.title}</h3>
          {co && <Link to={`/company/${co.handle}`} className="text-xs text-primary hover:underline">{co.name}</Link>}
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{job.type}</Badge>
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
            {salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{salary}</span>}
          </div>
          {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
        </div>
        {applyHref && (
          <a href={applyHref} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <Button size="sm" className="gap-1.5">Apply <ExternalLink className="w-3 h-3" /></Button>
          </a>
        )}
      </div>
    </div>
  )
}
