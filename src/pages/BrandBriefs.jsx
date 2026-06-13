import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Briefcase, Plus, X, DollarSign, Clock, Users, Search, ChevronRight } from 'lucide-react'

const CONTENT_TYPES = ['Video', 'Short-form', 'Blog', 'Podcast', 'Photo', 'Reel', 'Story', 'Newsletter']
const STATUSES = ['open', 'in_review', 'closed']

// ─── Apply modal ──────────────────────────────────────────────────────────────
function ApplyModal({ brief, onClose, onApplied }) {
  const { user } = useAuth()
  const [pitch, setPitch]       = useState('')
  const [quote, setQuote]       = useState('')
  const [portUrl, setPortUrl]   = useState('')
  const [portUrls, setPortUrls] = useState([])
  const [saving, setSaving]     = useState(false)

  function addUrl() {
    const u = portUrl.trim()
    if (!u) return
    setPortUrls(urls => [...urls, u])
    setPortUrl('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!pitch.trim()) { toast.error('Tell the brand why you\'re a fit'); return }
    setSaving(true)
    const { error } = await supabase.from('brief_applications').insert({
      brief_id: brief.id,
      creator_id: user.id,
      pitch: pitch.trim(),
      quote: quote ? Number(quote) : null,
      portfolio_urls: portUrls,
      status: 'pending',
    })
    setSaving(false)
    if (error) {
      if (error.code === '23505') toast.error('You already applied to this brief')
      else toast.error(error.message)
      return
    }
    toast.success('Application submitted!')
    onApplied?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Apply to Brief</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-white">{brief.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Budget: ${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()} {brief.currency}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Pitch</label>
            <textarea
              value={pitch}
              onChange={e => setPitch(e.target.value)}
              rows={4}
              placeholder="Why are you the right creator for this? What's your angle?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Quote (USD, optional)</label>
            <input
              type="number" min={0}
              value={quote}
              onChange={e => setQuote(e.target.value)}
              placeholder="Enter your rate"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Portfolio Links (optional)</label>
            <div className="flex gap-2 mb-2">
              <input
                value={portUrl}
                onChange={e => setPortUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="https://…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
              />
              <button type="button" onClick={addUrl} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm transition-colors border border-zinc-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {portUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <span className="truncate flex-1">{u}</span>
                <button type="button" onClick={() => setPortUrls(urls => urls.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Brief card ───────────────────────────────────────────────────────────────
function BriefCard({ brief, hasApplied, onApply }) {
  const statusColor = {
    open: 'text-green-400 bg-green-500/20',
    in_review: 'text-yellow-400 bg-yellow-500/20',
    closed: 'text-zinc-400 bg-zinc-500/20',
  }[brief.status] ?? 'text-zinc-400 bg-zinc-500/20'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor}`}>
              {brief.status?.replace('_', ' ')}
            </span>
            {(brief.content_types ?? []).map(ct => (
              <span key={ct} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {ct}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-white">{brief.title}</h3>
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{brief.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          ${brief.budget_min?.toLocaleString()}–${brief.budget_max?.toLocaleString()} {brief.currency}
        </div>
        {brief.deadline && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            Due {new Date(brief.deadline).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          {brief.application_count ?? 0} applicants
        </div>
      </div>

      {brief.target_audience && (
        <p className="text-xs text-zinc-500 mb-3">
          <span className="text-zinc-400 font-medium">Audience: </span>
          {brief.target_audience}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          {brief.company?.logo_url ? (
            <img src={brief.company.logo_url} className="w-5 h-5 rounded object-cover" alt="" />
          ) : (
            <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
              {brief.company?.name?.[0] ?? 'B'}
            </div>
          )}
          <span className="text-xs text-zinc-500">{brief.company?.name ?? 'Brand'}</span>
        </div>

        {brief.status === 'open' && (
          hasApplied ? (
            <span className="text-xs text-purple-400 font-medium">Applied ✓</span>
          ) : (
            <button
              onClick={() => onApply(brief)}
              className="flex items-center gap-1 text-xs text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl font-medium transition-colors"
            >
              Apply <ChevronRight className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BrandBriefs() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [briefs, setBriefs]           = useState([])
  const [myApplications, setMyApps]   = useState(new Set())
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [applying, setApplying]       = useState(null) // brief to apply to
  const [filterType, setFilterType]   = useState('All')

  useEffect(() => { load() }, [user])

  async function load() {
    const { data } = await supabase
      .from('brand_briefs')
      .select(`
        *,
        company:company_id (id, name, logo_url, handle)
      `)
      .order('created_at', { ascending: false })
    setBriefs(data ?? [])

    if (user) {
      const { data: apps } = await supabase
        .from('brief_applications')
        .select('brief_id')
        .eq('creator_id', user.id)
      setMyApps(new Set((apps ?? []).map(a => a.brief_id)))
    }

    setLoading(false)
  }

  const allTypes = ['All', ...CONTENT_TYPES]
  const filtered = briefs.filter(b => {
    const matchSearch = !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.company?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'All' || (b.content_types ?? []).includes(filterType)
    return matchSearch && matchType
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {applying && (
        <ApplyModal
          brief={applying}
          onClose={() => setApplying(null)}
          onApplied={load}
        />
      )}

      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-blue-900/50 via-violet-900/30 to-zinc-900 border border-blue-800/30 p-8">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Brand × Creator</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Brand Briefs</h1>
        <p className="text-zinc-400 max-w-lg">
          Brands post what they need. Creators pitch for it. Find paid brand deals that match your style.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search briefs or brands…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content type filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {allTypes.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterType === t
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {briefs.length === 0 ? 'No brand briefs yet.' : 'No briefs match your filter.'}
          </p>
          <p className="text-xs mt-1">Brands will post briefs here when they're ready to work with creators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(b => (
            <BriefCard
              key={b.id}
              brief={b}
              hasApplied={myApplications.has(b.id)}
              onApply={setApplying}
            />
          ))}
        </div>
      )}
    </div>
  )
}
