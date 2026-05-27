import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  TrendingUp, Lock, Search, Filter, ExternalLink, DollarSign,
  Loader2, Building2, Mail, Globe, ChevronRight, Lightbulb,
  AlertCircle,
} from 'lucide-react'

const STAGES = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth']
const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Finance', 'EdTech', 'Media', 'Retail', 'Other']

function PitchCard({ pitch, onContact }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {pitch.users?.avatar_url
            ? <img src={pitch.users.avatar_url} className="w-full h-full object-cover" alt="" />
            : <Building2 className="w-6 h-6 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">{pitch.title}</h3>
          <p className="text-xs text-muted-foreground">{pitch.users?.full_name} · {pitch.industry}</p>
        </div>
        {pitch.funding_stage && (
          <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            {pitch.funding_stage}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{pitch.description}</p>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        {pitch.funding_ask > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <DollarSign className="w-3 h-3" />
            Raising ${pitch.funding_ask?.toLocaleString()}
          </span>
        )}
        {pitch.industry && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{pitch.industry}</span>
        )}
      </div>

      <div className="flex gap-2">
        {pitch.pitch_url && (
          <a href={pitch.pitch_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> View Deck
          </a>
        )}
        <button onClick={() => onContact(pitch)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Mail className="w-3.5 h-3.5" /> Contact Founder
        </button>
      </div>
    </div>
  )
}

export default function Investors() {
  const { user } = useAuth()
  const { plan, isAdmin } = useSubscription()

  // Gate: Pro Max only (or investor role, or admin)
  const hasAccess = plan === 'promax' || user?.is_investor || isAdmin

  const [pitches,  setPitches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [stage,    setStage]    = useState('All')
  const [industry, setIndustry] = useState('All')
  const [contact,  setContact]  = useState(null)

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return }
    const fetch = async () => {
      setLoading(true)
      let q = supabase
        .from('pitches')
        .select('*, users!pitches_creator_id_fkey(id,full_name,email,avatar_url)')
        .eq('is_investor_only', true)
        .order('created_at', { ascending: false })

      if (stage !== 'All') q = q.eq('funding_stage', stage)
      if (industry !== 'All') q = q.eq('industry', industry)
      if (search) q = q.ilike('title', `%${search}%`)

      const { data } = await q
      setPitches(data || [])
      setLoading(false)
    }
    fetch()
  }, [hasAccess, search, stage, industry])

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Investor Access</h1>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          Access exclusive pitch decks and connect directly with Philomni founders.
          This area is reserved for <strong>Pro Max</strong> members and verified investors.
        </p>
        <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left space-y-3">
          {[
            'Browse verified startup pitches',
            'Filter by funding stage, industry, and ask size',
            'Contact founders directly',
            'Access full pitch decks and financials',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <Link to="/upgrade" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
          <TrendingUp className="w-4 h-4" /> Upgrade to Pro Max
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Investor Pitch Vault</h1>
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Pro Max</span>
        </div>
        <Link to="/pitch-vault"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <Lightbulb className="w-4 h-4" /> Submit Your Pitch
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-300">Investment pitches are for informational purposes only. Always conduct your own due diligence before investing.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search pitches…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center">Stage:</span>
          {STAGES.map(s => (
            <button key={s} onClick={() => setStage(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${stage === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center">Industry:</span>
          {INDUSTRIES.map(ind => (
            <button key={ind} onClick={() => setIndustry(ind)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${industry === ind ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : pitches.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No pitches found</p>
          <p className="text-xs mt-1">Check back soon — new pitches are added regularly</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pitches.map(p => (
            <PitchCard key={p.id} pitch={p} onContact={setContact} />
          ))}
        </div>
      )}

      {/* Contact modal */}
      {contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContact(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                {contact.users?.avatar_url
                  ? <img src={contact.users.avatar_url} className="w-full h-full object-cover" alt="" />
                  : <span className="text-lg font-bold text-primary">{contact.users?.full_name?.[0]}</span>}
              </div>
              <div>
                <p className="font-semibold text-foreground">{contact.users?.full_name}</p>
                <p className="text-xs text-muted-foreground">{contact.title}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${contact.users?.email}`} className="text-primary hover:underline">{contact.users?.email}</a>
              </p>
            </div>
            <button onClick={() => setContact(null)} className="w-full px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
