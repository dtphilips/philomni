import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Search, Building2, Plus, Users, Briefcase, Star, Filter, X, ChevronRight } from 'lucide-react'

const SAMPLE_COMPANIES = [
  { id: 'c1', name: 'Spotify', tagline: 'Music for everyone', industry: 'Music & Audio', company_size: '1000+', headquarters: 'Stockholm, Sweden', follower_count: 89400, logo_url: null, logo_emoji: '🎵', review_rating: 4.3, job_count: 24, is_featured: true, banner_color: 'from-green-500 to-emerald-700' },
  { id: 'c2', name: 'Adobe', tagline: 'Creativity for all', industry: 'Technology', company_size: '1000+', headquarters: 'San Jose, CA', follower_count: 72100, logo_url: null, logo_emoji: '🎨', review_rating: 4.1, job_count: 38, is_featured: true, banner_color: 'from-red-500 to-rose-700' },
  { id: 'c3', name: 'Creator IQ', tagline: 'Influencer marketing intelligence', industry: 'Creator Economy', company_size: '201-500', headquarters: 'Los Angeles, CA', follower_count: 8900, logo_url: null, logo_emoji: '📊', review_rating: 4.0, job_count: 12, is_featured: true, banner_color: 'from-violet-500 to-purple-700' },
  { id: 'c4', name: 'Patreon', tagline: 'Fund what you love', industry: 'Creator Economy', company_size: '201-500', headquarters: 'San Francisco, CA', follower_count: 34200, logo_url: null, logo_emoji: '🧡', review_rating: 3.9, job_count: 9, is_featured: true, banner_color: 'from-orange-500 to-amber-700' },
  { id: 'c5', name: 'Canva', tagline: 'Design anything, publish anywhere', industry: 'Technology', company_size: '1000+', headquarters: 'Sydney, Australia', follower_count: 51000, logo_url: null, logo_emoji: '✏️', review_rating: 4.5, job_count: 31, is_featured: false, banner_color: 'from-cyan-500 to-teal-700' },
  { id: 'c6', name: 'Substack', tagline: 'A new economic engine for culture', industry: 'Media & Entertainment', company_size: '51-200', headquarters: 'San Francisco, CA', follower_count: 12300, logo_url: null, logo_emoji: '📰', review_rating: 4.2, job_count: 6, is_featured: false, banner_color: 'from-yellow-500 to-orange-600' },
  { id: 'c7', name: 'Twitch', tagline: 'You are live', industry: 'Media & Entertainment', company_size: '1000+', headquarters: 'San Francisco, CA', follower_count: 63800, logo_url: null, logo_emoji: '🎮', review_rating: 3.7, job_count: 19, is_featured: false, banner_color: 'from-purple-500 to-violet-700' },
  { id: 'c8', name: 'Notion', tagline: 'The all-in-one workspace', industry: 'Technology', company_size: '201-500', headquarters: 'San Francisco, CA', follower_count: 28700, logo_url: null, logo_emoji: '⬜', review_rating: 4.4, job_count: 15, is_featured: false, banner_color: 'from-gray-600 to-slate-800' },
  { id: 'c9', name: 'Anchor FM', tagline: 'Podcast creation for everyone', industry: 'Music & Audio', company_size: '51-200', headquarters: 'New York, NY', follower_count: 9100, logo_url: null, logo_emoji: '🎙️', review_rating: 3.8, job_count: 4, is_featured: false, banner_color: 'from-violet-600 to-indigo-700' },
  { id: 'c10', name: 'Gumroad', tagline: 'Sell what you know', industry: 'Creator Economy', company_size: '1-10', headquarters: 'San Francisco, CA', follower_count: 6400, logo_url: null, logo_emoji: '💰', review_rating: 4.0, job_count: 2, is_featured: false, banner_color: 'from-pink-500 to-rose-600' },
  { id: 'c11', name: 'Loom', tagline: 'Video messaging for work', industry: 'Technology', company_size: '201-500', headquarters: 'San Francisco, CA', follower_count: 18200, logo_url: null, logo_emoji: '🎬', review_rating: 4.3, job_count: 11, is_featured: false, banner_color: 'from-violet-500 to-fuchsia-600' },
  { id: 'c12', name: 'Linktree', tagline: 'Connect your audience to everything you create', industry: 'Creator Economy', company_size: '51-200', headquarters: 'Melbourne, Australia', follower_count: 14600, logo_url: null, logo_emoji: '🌳', review_rating: 4.1, job_count: 7, is_featured: false, banner_color: 'from-green-400 to-teal-600' },
]

const INDUSTRIES = ['All', 'Technology', 'Creator Economy', 'Media & Entertainment', 'Music & Audio', 'Design', 'Education', 'Finance', 'Healthcare', 'Retail', 'Other']
const SIZES = ['All', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

function formatFollowers(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span className="text-xs font-medium text-foreground">{rating?.toFixed(1)}</span>
    </span>
  )
}

function CompanyCard({ company, onNavigate, featured = false }) {
  return (
    <div
      onClick={() => onNavigate(company.id)}
      className={`bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group ${featured ? 'h-full' : ''}`}
    >
      {/* Banner */}
      <div className={`h-16 bg-gradient-to-r ${company.banner_color || 'from-primary/40 to-primary/60'} relative`}>
        {company.banner_url && <img src={company.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Logo overlap */}
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-3">
          <div className="w-12 h-12 rounded-xl bg-card border-2 border-border flex items-center justify-center text-2xl shadow-sm group-hover:border-primary/30 transition-colors">
            {company.logo_url
              ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
              : company.logo_emoji ?? '🏢'}
          </div>
        </div>

        <h3 className="font-semibold text-foreground text-sm leading-tight">{company.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{company.tagline}</p>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {company.industry && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{company.industry}</span>
          )}
          {company.company_size && (
            <span className="text-[10px] text-muted-foreground">{company.company_size} employees</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
          {company.review_rating > 0 && <StarRating rating={company.review_rating} />}
          {company.follower_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {formatFollowers(company.follower_count)}
            </span>
          )}
          {company.job_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Briefcase className="w-3 h-3" />
              {company.job_count} jobs
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Companies() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('All')
  const [sizeFilter, setSizeFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('companies').select('*').order('follower_count', { ascending: false }).limit(50)
      if (data && data.length > 0) {
        setCompanies(data)
      } else {
        setCompanies(SAMPLE_COMPANIES)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.tagline?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.headquarters?.toLowerCase().includes(q)
      const matchIndustry = industryFilter === 'All' || c.industry === industryFilter
      const matchSize = sizeFilter === 'All' || c.company_size === sizeFilter
      return matchSearch && matchIndustry && matchSize
    })
  }, [companies, search, industryFilter, sizeFilter])

  const featured = filtered.filter(c => c.is_featured)
  const all = filtered

  const hasActiveFilters = industryFilter !== 'All' || sizeFilter !== 'All'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Discover companies hiring creators & professionals</p>
        </div>
        <button
          onClick={() => navigate('/company/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies by name, industry, or location…"
            className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters ? 'Filtered' : 'Filter'}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Filters</p>
            {hasActiveFilters && (
              <button onClick={() => { setIndustryFilter('All'); setSizeFilter('All') }} className="text-xs text-primary hover:underline">Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Industry</label>
              <select
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company Size</label>
              <select
                value={sizeFilter}
                onChange={e => setSizeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No companies match your search</p>
          <button onClick={() => { setSearch(''); setIndustryFilter('All'); setSizeFilter('All') }} className="mt-3 text-sm text-primary hover:underline">Clear filters</button>
        </div>
      ) : (
        <>
          {/* Featured section */}
          {featured.length > 0 && !search && industryFilter === 'All' && sizeFilter === 'All' && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">Featured Companies</h2>
                <span className="text-xs text-muted-foreground">{featured.length} companies</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {featured.map(c => (
                  <CompanyCard key={c.id} company={c} onNavigate={id => navigate(`/company/${id}`)} featured />
                ))}
              </div>
            </section>
          )}

          {/* All companies */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {search || hasActiveFilters ? 'Results' : 'All Companies'}
              </h2>
              <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'company' : 'companies'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {all.map(c => (
                <CompanyCard key={c.id} company={c} onNavigate={id => navigate(`/company/${id}`)} />
              ))}
            </div>
          </section>

          {/* Create company CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-sm">Don't see your company?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a company page and start attracting top creator talent.</p>
            </div>
            <button
              onClick={() => navigate('/company/create')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0 ml-4"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
