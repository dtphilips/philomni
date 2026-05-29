import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, Search, Loader2, ChevronUp, ChevronDown,
  Heart, Check, ArrowLeft, Users, Clock, Lock, AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

const CATEGORIES = [
  'Rising Artist', 'Creator', 'Business', 'Tech Builder',
  'Social Impact', 'Musician', 'Educator', 'Entrepreneur', 'Filmmaker', 'Other',
]

const MIN_REASON_WORDS = 50

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function formatMonth(yyyyMM) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  if (!yyyyMM) return ''
  const [y, m] = yyyyMM.split('-')
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function getTimeLeft(target) {
  const diff = new Date(target) - Date.now()
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true }
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    over: false,
  }
}

function CountdownTimer({ targetDate, label, onExpired }) {
  const [time, setTime] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => {
      const left = getTimeLeft(targetDate)
      setTime(left)
      if (left.over) { clearInterval(id); onExpired?.() }
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate, onExpired])

  if (time.over) return <span className="text-green-400 font-semibold text-sm">{label || 'Opening now!'}</span>

  return (
    <div className="flex items-center gap-2">
      {[
        { v: time.d, l: 'd' },
        { v: time.h, l: 'h' },
        { v: time.m, l: 'm' },
        { v: time.s, l: 's' },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center bg-muted rounded-xl px-3 py-1.5 min-w-[2.8rem]">
          <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
            {String(v).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase">{l}</span>
        </div>
      ))}
    </div>
  )
}

// ─── User Search ──────────────────────────────────────────────────────────────
function UserSearch({ onSelect, selected }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
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
        {selected.avatar_url
          ? <img src={selected.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">{(selected.full_name || selected.username || '?')[0].toUpperCase()}</div>
        }
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
            <button key={u.id} onClick={() => { onSelect(u); setQuery(''); setResults([]) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{(u.full_name || u.username || '?')[0].toUpperCase()}</div>
              }
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

// ─── Nomination Card ──────────────────────────────────────────────────────────
function NominationCard({ nomination, profile, hasVoted, votedThisMonth, onVote, voteLoading, windowStatus }) {
  const [expanded, setExpanded] = useState(false)
  const displayName = profile?.full_name || profile?.username || 'User'
  const canVote = windowStatus === 'closed' && !votedThisMonth

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 transition-all ${hasVoted ? 'border-amber-500/30' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">{displayName[0]}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{nomination.category}</span>
          </div>
          {profile?.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.headline}</p>}
        </div>
        {/* Vote button — only shown when voting is open (window closed, 24h voting window) */}
        {windowStatus === 'closed' && (
          <button
            onClick={() => onVote(nomination)}
            disabled={votedThisMonth || voteLoading || hasVoted}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              hasVoted
                ? 'bg-amber-500/20 text-amber-500 cursor-default'
                : votedThisMonth
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50'
            }`}
          >
            {voteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasVoted ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
            {hasVoted ? 'Voted' : 'Vote'} · {nomination.vote_count}
          </button>
        )}
        {windowStatus === 'open' && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            <Heart className="w-3 h-3" /> {nomination.vote_count}
          </span>
        )}
      </div>

      {/* Reason */}
      <div>
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {nomination.reason}
        </p>
        {nomination.reason.length > 120 && (
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

  // Window state
  const [window_,    setWindow_]    = useState(null)   // current spotlight_window row
  const [winLoading, setWinLoading] = useState(true)
  const [effectiveStatus, setEffectiveStatus] = useState('upcoming')

  // Nomination form
  const [selectedUser, setSelectedUser] = useState(null)
  const [category, setCategory]         = useState('')
  const [reason, setReason]             = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)

  // Nominations list
  const [nominations, setNominations] = useState([])
  const [profiles, setProfiles]       = useState({})
  const [loadingNoms, setLoadingNoms] = useState(true)
  const [votedId, setVotedId]         = useState(null)
  const [voteLoading, setVoteLoading] = useState(null)
  const [sortBy, setSortBy]           = useState('votes')

  const wordCount = countWords(reason)
  const wordsLeft = Math.max(0, MIN_REASON_WORDS - wordCount)
  const spotsRemaining = window_ ? Math.max(0, window_.max_nominations - (window_?.nomination_count || 0)) : 0
  const canSubmit = selectedUser && category && wordCount >= MIN_REASON_WORDS && !submitting && effectiveStatus === 'open'

  // ── Compute effective status from times ────────────────────────────────────
  const computeStatus = useCallback((w) => {
    if (!w) return 'upcoming'
    const now = Date.now()
    const opens = new Date(w.opens_at).getTime()
    const closes = new Date(w.closes_at).getTime()
    if (w.status === 'winner_selected') return 'winner_selected'
    if (w.nomination_count >= w.max_nominations) return 'closed'
    if (now < opens) return 'upcoming'
    if (now >= opens && now < closes) return 'open'
    return 'closed'
  }, [])

  // ── Load window ────────────────────────────────────────────────────────────
  const loadWindow = useCallback(async () => {
    setWinLoading(true)
    const monthStart = currentMonth + '-01'
    // Find a window for this month or the next upcoming one
    const { data: rows } = await supabase
      .from('spotlight_windows')
      .select('*')
      .gte('month', monthStart)
      .not('status', 'eq', 'winner_selected')
      .order('opens_at', { ascending: true })
      .limit(1)

    const w = rows?.[0] || null
    setWindow_(w)
    setEffectiveStatus(computeStatus(w))
    setWinLoading(false)
  }, [currentMonth, computeStatus])

  // ── Load nominations ───────────────────────────────────────────────────────
  const loadNominations = useCallback(async () => {
    setLoadingNoms(true)
    const { data: noms } = await supabase
      .from('spotlight_nominations')
      .select('*')
      .eq('month', currentMonth)
      .order(sortBy === 'votes' ? 'vote_count' : 'created_at', { ascending: false })

    if (!noms) { setLoadingNoms(false); return }
    setNominations(noms)

    const ids = [...new Set(noms.map(n => n.nominated_user_id))]
    if (ids.length) {
      const { data: ps } = await supabase.from('users').select('id, full_name, username, avatar_url, headline').in('id', ids)
      const map = {}
      ;(ps || []).forEach(p => { map[p.id] = p })
      setProfiles(map)
    }

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
  }, [sortBy, currentMonth, user])

  useEffect(() => { loadWindow() }, [loadWindow])
  useEffect(() => { loadNominations() }, [loadNominations])

  // ── Submit nomination ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || !user) return

    // Re-check window is still open and has space
    const { data: freshWindow } = await supabase
      .from('spotlight_windows')
      .select('*')
      .eq('id', window_.id)
      .single()

    const freshStatus = computeStatus(freshWindow)
    if (freshStatus !== 'open') {
      toast.error('Nominations have just closed. Try again next month.')
      await loadWindow()
      return
    }
    if (freshWindow.nomination_count >= freshWindow.max_nominations) {
      toast.error('All spots are filled!')
      await loadWindow()
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('spotlight_nominations').insert({
      nominated_user_id: selectedUser.id,
      nominator_id: user.id,
      category,
      reason: reason.trim(),
      month: currentMonth,
    })

    if (error) {
      if (error.code === '23505') toast.error('You already nominated this person for this month.')
      else toast.error('Could not submit nomination. Please try again.')
      setSubmitting(false)
      return
    }

    // Increment window nomination count
    const newCount = (freshWindow.nomination_count || 0) + 1
    const autoClose = newCount >= freshWindow.max_nominations
    await supabase.from('spotlight_windows').update({
      nomination_count: newCount,
      ...(autoClose ? { status: 'closed' } : {}),
    }).eq('id', freshWindow.id)

    if (autoClose) {
      toast.success('🌟 Nomination submitted! All spots are now filled — voting opens soon.')
    } else {
      toast.success('🌟 Nomination submitted!')
    }

    setSubmitted(true)
    setSubmitting(false)
    await Promise.all([loadWindow(), loadNominations()])
  }

  // ── Vote ───────────────────────────────────────────────────────────────────
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
    await supabase.from('spotlight_nominations')
      .update({ vote_count: nomination.vote_count + 1 })
      .eq('id', nomination.id)
    setVotedId(nomination.id)
    setNominations(prev => prev.map(n => n.id === nomination.id ? { ...n, vote_count: n.vote_count + 1 } : n))
    setVoteLoading(null)
    toast.success('Vote cast! ❤️')
  }

  // ─────────────────────────────────────────────────────────────────────────
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
            <h1 className="text-xl font-bold text-foreground">Spotlight Nominations</h1>
          </div>
          <p className="text-sm text-muted-foreground">{formatMonth(currentMonth)}</p>
        </div>
      </div>

      {/* Window status panel */}
      {winLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── UPCOMING ── */}
          {(effectiveStatus === 'upcoming' || !window_) && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Nominations Not Yet Open</h2>
                {window_ ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nominations open on {formatDateTime(window_.opens_at)}
                    </p>
                    <div className="flex justify-center">
                      <CountdownTimer
                        targetDate={window_.opens_at}
                        label="Nominations are now open!"
                        onExpired={() => setEffectiveStatus('open')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Category: <span className="text-foreground font-medium">{window_.category}</span>
                      {' · '}Up to <span className="text-foreground font-medium">{window_.max_nominations}</span> nominations
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No nomination window has been scheduled yet for this month.
                    Check back soon!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── OPEN ── */}
          {effectiveStatus === 'open' && window_ && (
            <>
              {/* Progress + Status */}
              <div className="bg-card border border-green-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-green-400">Nominations Open</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Closes {formatDateTime(window_.closes_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{window_.nomination_count} of {window_.max_nominations} spots filled</span>
                  <span className="font-semibold text-foreground">{spotsRemaining} remaining</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (window_.nomination_count / window_.max_nominations) * 100)}%` }}
                  />
                </div>
                {window_.category && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This month's category: <span className="text-foreground font-medium">{window_.category}</span>
                  </p>
                )}
              </div>

              {/* Nomination form */}
              {!submitted ? (
                <div className="bg-card border border-border rounded-2xl p-5 mb-8 space-y-5">
                  <h2 className="text-base font-bold text-foreground">Submit a Nomination</h2>

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
                        <button key={c} onClick={() => setCategory(c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
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
                      placeholder={`Tell us their story — achievements, impact, and why they deserve the Spotlight. (min ${MIN_REASON_WORDS} words)`}
                      rows={5}
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
                    Thank you for nominating {selectedUser?.full_name || selectedUser?.username}.
                    Our community votes after nominations close.
                  </p>
                  {spotsRemaining > 0 && (
                    <button
                      onClick={() => { setSubmitted(false); setSelectedUser(null); setCategory(''); setReason('') }}
                      className="text-sm text-primary hover:underline"
                    >
                      Nominate someone else ({spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} left)
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── CLOSED — Voting period ── */}
          {effectiveStatus === 'closed' && (
            <div className="bg-card border border-amber-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-400">Nominations Closed — Voting Open</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Community voting is now open for 24 hours. Vote for your favourite nominee below.
                The highest-voted creator wins the Spotlight!
              </p>
              {user && votedId && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> You've cast your vote for this month.
                </p>
              )}
            </div>
          )}

          {/* ── WINNER SELECTED ── */}
          {effectiveStatus === 'winner_selected' && (
            <div className="bg-card border border-amber-500/30 rounded-2xl p-6 mb-6 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="text-lg font-bold text-foreground mb-1">Winner Announced!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This month's Spotlight winner has been selected.
              </p>
              <Link
                to={`/spotlight/${currentMonth}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Star className="w-4 h-4 fill-white" />
                Meet This Month's Spotlight
              </Link>
            </div>
          )}
        </>
      )}

      {/* Nominations list (always show) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              {effectiveStatus === 'closed' ? 'Nominees — Vote Now' : "This Month's Nominations"}
            </h2>
            {nominations.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{nominations.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSortBy('votes')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'votes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <TrendingUp className="w-3 h-3 inline mr-0.5" /> Top
            </button>
            <button onClick={() => setSortBy('recent')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'recent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
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
            {effectiveStatus === 'open' && (
              <p className="text-xs text-muted-foreground mt-1">Be the first to nominate!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {nominations.map(nom => (
              <NominationCard
                key={nom.id}
                nomination={nom}
                profile={profiles[nom.nominated_user_id]}
                hasVoted={votedId === nom.id}
                votedThisMonth={!!votedId}
                onVote={handleVote}
                voteLoading={voteLoading === nom.id}
                windowStatus={effectiveStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
