import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Zap, Plus, X, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['Career', 'Creator Economy', 'Tech', 'Business', 'Leadership', 'Culture', 'Finance', 'Other']

// ─── Create pulse modal ───────────────────────────────────────────────────────
function CreatePulseModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [question, setQuestion]   = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('Career')
  const [options, setOptions]     = useState(['', ''])
  const [saving, setSaving]       = useState(false)

  function setOption(i, val) {
    setOptions(opts => opts.map((o, idx) => idx === i ? val : o))
  }
  function addOption() { if (options.length < 6) setOptions(o => [...o, '']) }
  function removeOption(i) { setOptions(o => o.filter((_, idx) => idx !== i)) }

  async function submit(e) {
    e.preventDefault()
    if (!question.trim()) { toast.error('Question is required'); return }
    const validOpts = options.map(o => o.trim()).filter(Boolean)
    if (validOpts.length < 2) { toast.error('At least 2 options required'); return }

    setSaving(true)
    const { error } = await supabase.from('pulses').insert({
      question: question.trim(),
      description: description.trim() || null,
      category,
      options: validOpts,
      created_by: user.id,
      status: 'active',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Pulse published!')
    onCreated?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white">Create a Pulse</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Question</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What's on the community's mind?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Context (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Add context or background…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-zinc-500 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? 'Publishing…' : 'Publish Pulse'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Pulse card ───────────────────────────────────────────────────────────────
function PulseCard({ pulse, myResponse, onVote }) {
  const { user } = useAuth()
  const [voting, setVoting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const total = pulse.response_count ?? 0
  const hasVoted = !!myResponse

  async function vote(optionIndex) {
    if (!user) { toast.error('Sign in to vote'); return }
    if (hasVoted) return
    setVoting(true)
    const { error } = await supabase.from('pulse_responses').insert({
      pulse_id: pulse.id,
      user_id: user.id,
      answer: pulse.options[optionIndex],
      option_index: optionIndex,
    })
    setVoting(false)
    if (error) { toast.error(error.message); return }
    onVote?.()
  }

  // We don't have per-option counts without aggregation, so show simple voted state
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full">
              {pulse.category}
            </span>
            {pulse.is_featured && (
              <span className="text-xs text-yellow-400 font-medium bg-yellow-500/10 px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white">{pulse.question}</h3>
          {pulse.description && (
            <p className="text-xs text-zinc-500 mt-1">{pulse.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
          <Users className="w-3.5 h-3.5" />
          {total}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(pulse.options ?? []).map((opt, i) => {
          const isMyVote = hasVoted && myResponse.option_index === i
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={hasVoted || voting}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors border ${
                isMyVote
                  ? 'bg-purple-600 border-purple-500 text-white font-medium'
                  : hasVoted
                  ? 'bg-zinc-800/40 border-zinc-800 text-zinc-400 cursor-default'
                  : 'bg-zinc-800/60 border-zinc-800 text-zinc-300 hover:border-purple-600 hover:text-white'
              }`}
            >
              {opt}
              {isMyVote && <span className="ml-2 text-xs">✓ Your vote</span>}
            </button>
          )
        })}
      </div>

      {/* Creator */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/60">
        <img
          src={pulse.creator?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(pulse.creator?.full_name ?? 'P')}&background=7c3aed&color=fff&size=24`}
          className="w-5 h-5 rounded-full"
          alt=""
        />
        <span className="text-xs text-zinc-500">{pulse.creator?.full_name ?? 'Anonymous'}</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Pulse() {
  const { user } = useAuth()
  const [pulses, setPulses]       = useState([])
  const [myVotes, setMyVotes]     = useState({}) // pulse_id → response row
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => { load() }, [user])

  async function load() {
    const { data } = await supabase
      .from('pulses')
      .select(`*, creator:created_by (id, full_name, username, avatar_url)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setPulses(data ?? [])

    if (user && data?.length) {
      const ids = data.map(p => p.id)
      const { data: responses } = await supabase
        .from('pulse_responses')
        .select('pulse_id, option_index, answer')
        .eq('user_id', user.id)
        .in('pulse_id', ids)
      const map = {}
      ;(responses ?? []).forEach(r => { map[r.pulse_id] = r })
      setMyVotes(map)
    }

    setLoading(false)
  }

  const categories = ['All', ...CATEGORIES]
  const filtered = pulses.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {showCreate && (
        <CreatePulseModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h1 className="text-xl font-bold text-white">Community Pulse</h1>
          </div>
          <p className="text-sm text-zinc-500">What the Philomni community really thinks</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ask
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeCategory === c
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Pulses */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No pulses yet in this category.</p>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Be the first to ask
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <PulseCard
              key={p.id}
              pulse={p}
              myResponse={myVotes[p.id]}
              onVote={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}
