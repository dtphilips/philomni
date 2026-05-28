import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, Search, Loader2, ChevronUp, ChevronDown,
  Heart, Check, ArrowLeft, Users,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

const CATEGORIES = [
  'Rising Artist', 'Creator', 'Business', 'Tech Builder',
  'Social Impact', 'Musician', 'Educator', 'Entrepreneur', 'Other',
]

const MIN_REASON_WORDS = 100

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function formatMonth(yyyyMM) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const [y, m] = yyyyMM.split('-')
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`
}

// ─── User Search ──────────────────────────────────────────────────────────────
function UserSearch({ onSelect, selected }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, headline')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(6)
      setResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card border border-primary/40 rounded-xl">
        {selected.avatar_url ? (
          <img src={selected.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
            {(selected.full_name || selected.username || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{selected.full_name || selected.username}</p>
          {selected.headline && <p className="text-xs text-muted-foreground truncate">{selected.headline}</p>}
        </div>
        <button onClick={() => onSelect(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-52 overflow-y-auto">
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => { onSelect(u); setQuery(''); setResults([]) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {(u.full_name || u.username || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.username}</p>
                {u.headline && <p className="text-xs text-muted-foreground truncate">{u.headline}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Nomination Card (for current month) ─────────────────────────────────────
function NominationCard({ nomination, profile, hasVoted, onVote, voteLoading }) {
  const [expanded, setExpanded] = useState(false)
  const wordCount = countWords(nomination.reason)
  const displayName = profile?.full_name || profile?.username || 'User'

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
            {displayName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {nomination.category}
            </span>
          </div>
          {profile?.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.headline}</p>}
        </div>
        {/* Vote button */}
        <button
          onClick={() => onVote(nomination)}
          disabled={hasVoted || voteLoading}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            hasVoted
              ? 'bg-green-500/20 text-green-500 cursor-default'
              : 'bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50'
          }`}
        >
          {voteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasVoted ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
          {hasVoted ? 'Voted' : 'Vote'} · {nomination.vote_count}
        </button>
      </div>

      {/* Reason */}
      <div>
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {nomination.reason}
        </p>
        {wordCount > 40 && (
          <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SpotlightNominate() {
  const { user } = useAuth()
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Nominate form
  const [selectedUser, setSelectedUser] = useState(null)
  const [category, setCategory]         = useState('')
  const [reason, setReason]             = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)

  // Nominations list
  const [nominations, setNominations]   = useState([])
  const [profiles, setProfiles]         = useState({})
  const [loadingNoms, setLoadingNoms]   = useState(true)
  const [votedId, setVotedId]           = useState(null)   // nomination_id user voted for
  const [voteLoading, setVoteLoading]   = useState(null)
  const [sortBy, setSortBy]             = useState('votes') // 'votes' | 'recent'

  const wordCount = countWords(reason)
  const wordsLeft = Math.max(0, MIN_REASON_WORDS - wordCount)
  const canSubmit = selectedUser && category && wordCount >= MIN_REASON_WORDS && !submitting

  // Load nominations
  const loadNominations = async () => {
    setLoadingNoms(true)
    const { data: noms } = await supabase
      .from('spotlight_nominations')
      .select('*')
      .eq('month', currentMonth)
      .order(sortBy === 'votes' ? 'vote_count' : 'created_at', { ascending: false })

    if (!noms) { setLoadingNoms(false); return }
    setNominations(noms)

    // Fetch nominated user profiles
    const ids = [...new Set(noms.map(n => n.nominated_user_id))]
    if (ids.length) {
      const { data: ps } = await supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', ids)
      const map = {}
      ;(ps || []).forEach(p => { map[p.id] = p })
      setProfiles(map)
    }

    // Check if current user has voted
    if (user) {
      const { data: vote } = await supabase
        .from('spotlight_votes')
        .select('nomination_id')
        .eq('voter_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle()
      setVotedId(vote?.nomination_id || null)
    }
    setLoadingNoms(false)
  }

  useEffect(() => { loadNominations() }, [sortBy, currentMonth])

  const handleSubmit = async () => {
    if (!canSubmit || !user) return
    setSubmitting(true)
    const { error } = await supabase.from('spotlight_nominations').insert({
      nominated_user_id: selectedUser.id,
      nominator_id: user.id,
      category,
      reason: reason.trim(),
      month: currentMonth,
    })
    if (error) {
      if (error.code === '23505') {
        toast.error('You already nominated this person for this month.')
      } else {
        toast.error('Could not submit nomination. Please try again.')
      }
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
    loadNominations()
    toast.success('🌟 Nomination submitted!')
  }

  const handleVote = async (nomination) => {
    if (!user || votedId) return
    setVoteLoading(nomination.id)
    const { error } = await supabase.from('spotlight_votes').insert({
      nomination_id: nomination.id, voter_id: user.id, month: currentMonth,
    })
    if (error?.code === '23505') {
      toast.error('You already voted this month.')
      setVoteLoading(null)
      return
    }
    // Increment vote_count
    await supabase.from('spotlight_nominations')
      .update({ vote_count: nomination.vote_count + 1 })
      .eq('id', nomination.id)
    setVotedId(nomination.id)
    setNominations(prev => prev.map(n => n.id === nomination.id ? { ...n, vote_count: n.vote_count + 1 } : n))
    setVoteLoading(null)
    toast.success('Vote cast! ❤️')
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/spotlight" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-xl font-bold text-foreground">Nominate for Spotlight</h1>
          </div>
          <p className="text-sm text-muted-foreground">{formatMonth(currentMonth)}</p>
        </div>
      </div>

      {/* Nomination Form */}
      {!submitted ? (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Who do you want to nominate?
            </label>
            <UserSearch onSelect={setSelectedUser} selected={selectedUser} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Why do they deserve it?
              </label>
              <span className={`text-xs font-medium ${wordsLeft > 0 ? 'text-muted-foreground' : 'text-green-500'}`}>
                {wordsLeft > 0 ? `${wordsLeft} more words needed` : `✓ ${wordCount} words`}
              </span>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Tell us their story — their achievements, impact, and why they deserve to be in the Spotlight. (minimum ${MIN_REASON_WORDS} words)`}
              rows={6}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-white" />}
            Submit Nomination
          </button>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Sign in</Link> to submit a nomination.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-amber-500/30 rounded-2xl p-8 mb-8 text-center">
          <div className="text-4xl mb-3">🌟</div>
          <h2 className="text-lg font-bold text-foreground mb-2">Nomination Submitted!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Thank you for nominating {selectedUser?.full_name || selectedUser?.username}. Our team reviews all nominations each month.
          </p>
          <button
            onClick={() => { setSubmitted(false); setSelectedUser(null); setCategory(''); setReason('') }}
            className="text-sm text-primary hover:underline"
          >
            Nominate someone else
          </button>
        </div>
      )}

      {/* Current Month Nominations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">This Month's Nominations</h2>
            {nominations.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{nominations.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('votes')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'votes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              Most Voted
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'recent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              Recent
            </button>
          </div>
        </div>

        {loadingNoms ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : nominations.length === 0 ? (
          <div className="text-center py-10 bg-card border border-border rounded-2xl">
            <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No nominations yet this month.</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to nominate!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nominations.map(nom => (
              <NominationCard
                key={nom.id}
                nomination={nom}
                profile={profiles[nom.nominated_user_id]}
                hasVoted={votedId === nom.id}
                onVote={handleVote}
                voteLoading={voteLoading === nom.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
