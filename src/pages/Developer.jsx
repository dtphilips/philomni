import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Code2, Key, Plus, Copy, Trash2, Eye, EyeOff, BarChart2, Zap, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const PLANS = {
  starter:    { label: 'Starter',    rate: 100,   price: 'Free',    color: 'text-zinc-400' },
  growth:     { label: 'Growth',     rate: 1000,  price: '$99/mo',  color: 'text-blue-400' },
  enterprise: { label: 'Enterprise', rate: 10000, price: 'Custom',  color: 'text-purple-400' },
}

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/creators/:id/valuation',
    desc: 'Get creator valuation score — Philomni score, follower growth, earnings trend, suggested pricing.',
    example: `curl https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/creators/USER_ID/valuation \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "data": {
    "philomni_score": 427,
    "follower_count": 8420,
    "follower_growth_30d": 3.2,
    "avg_monthly_earnings": 1240.00,
    "earnings_trend": 18.5,
    "suggested_slot_price": 68,
    "suggested_share_pct": 8,
    "reliability_score": 100
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/offerings',
    desc: 'List all creator offerings. Filter by status or creator_id. Supports limit + offset pagination.',
    example: `curl "https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/offerings?status=open&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "data": [ { "id": "...", "title": "Back My Journey", "percentage_share": 5, ... } ],
  "meta": { "limit": 10, "offset": 0, "total": 42 }
}`,
  },
  {
    method: 'GET',
    path: '/v1/offerings/:id',
    desc: 'Get a single offering with full creator details.',
    example: `curl https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/offerings/OFFERING_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{ "data": { "id": "...", "creator": { "full_name": "..." }, ... } }`,
  },
  {
    method: 'POST',
    path: '/v1/offerings',
    desc: 'Create a new revenue share offering on behalf of a creator.',
    example: `curl -X POST https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/offerings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "creator_id": "USER_ID",
    "title": "Back My Creator Journey",
    "total_slots": 20,
    "price_per_slot": 75,
    "percentage_share": 8,
    "duration_months": 12,
    "early_bird_slots": 5,
    "early_bird_price": 50,
    "ends_at": "2026-08-01T00:00:00Z"
  }'`,
    response: `{ "data": { "id": "...", "status": "open", ... } }`,
  },
  {
    method: 'POST',
    path: '/v1/offerings/:id/pledge',
    desc: 'Back a creator — creates a pledge on behalf of a supporter. Automatically applies early-bird pricing if eligible.',
    example: `curl -X POST https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/offerings/OFFERING_ID/pledge \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "supporter_id": "USER_ID", "slots": 2 }'`,
    response: `{
  "data": { "id": "...", "status": "pending", "amount": 100 },
  "meta": { "price_per_slot": 50, "is_early_bird": true, "total_amount": 100 }
}`,
  },
  {
    method: 'GET',
    path: '/v1/portfolio/:user_id',
    desc: "Get a backer's full investment portfolio — all pledges, earnings per cycle, total ROI.",
    example: `curl https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/portfolio/USER_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "data": {
    "summary": { "total_invested": 300, "total_earned": 47.20, "roi_pct": "15.73" },
    "pledges": [...],
    "earnings": [...]
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/payouts/:offering_id',
    desc: 'Get full payout history for an offering — all monthly cycles, amounts, statuses.',
    example: `curl https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api/v1/payouts/OFFERING_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `[ { "period_month": "2026-07-01", "payout_pool": 62.40, "status": "completed" }, ... ]`,
  },
]

const METHOD_COLORS = {
  GET:  'bg-blue-500/20 text-blue-400',
  POST: 'bg-green-500/20 text-green-400',
}

// ─── Endpoint row ─────────────────────────────────────────────────────────────
function EndpointRow({ ep }) {
  const [open, setOpen] = useState(false)

  function copy(text) {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm text-white font-mono flex-1">{ep.path}</code>
        <span className="text-xs text-zinc-500 hidden sm:block flex-1">{ep.desc.split('—')[0]}</span>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800 p-4 space-y-4 bg-zinc-950/60">
          <p className="text-sm text-zinc-400">{ep.desc}</p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Example Request</p>
              <button onClick={() => copy(ep.example)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{ep.example}</pre>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Response</p>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-green-400/80 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{ep.response}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Developer() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [keys,       setKeys]       = useState([])
  const [logs,       setLogs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPlan, setNewKeyPlan] = useState('starter')
  const [showForm,   setShowForm]   = useState(false)
  const [revealedKey, setRevealedKey] = useState(null) // shown once after creation
  const [visibleKeys, setVisibleKeys] = useState({})

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  async function load() {
    const [{ data: k }, { data: l }] = await Promise.all([
      supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('api_request_log')
        .select('*, api_key:api_key_id(name, key_prefix)')
        .in('api_key_id',
          (await supabase.from('api_keys').select('id').eq('user_id', user.id)).data?.map(k => k.id) ?? []
        )
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setKeys(k ?? [])
    setLogs(l ?? [])
    setLoading(false)
  }

  async function createKey() {
    if (!newKeyName.trim()) { toast.error('Give your key a name'); return }
    setCreating(true)

    // Generate a random API key
    const rawKey = 'pk_' + newKeyPlan.slice(0, 4) + '_' + crypto.randomUUID().replace(/-/g, '')

    // Hash it (we store hash, never the raw key)
    const msgBuffer = new TextEncoder().encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray  = Array.from(new Uint8Array(hashBuffer))
    const keyHash    = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase.from('api_keys').insert({
      user_id:     user.id,
      name:        newKeyName.trim(),
      key_hash:    keyHash,
      key_prefix:  rawKey.slice(0, 20) + '…',
      plan:        newKeyPlan,
      rate_limit:  PLANS[newKeyPlan].rate,
    })

    setCreating(false)
    if (error) { toast.error(error.message); return }

    setRevealedKey(rawKey)
    setNewKeyName('')
    setShowForm(false)
    toast.success('API key created — copy it now, it won\'t be shown again')
    load()
  }

  async function revokeKey(id) {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id)
    toast.success('Key revoked')
    load()
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const todayRequests = logs.filter(l => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  }).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 text-sm font-medium">Creator Fund API</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Developer Portal</h1>
        <p className="text-zinc-400 max-w-xl">
          Integrate Philomni's Creator Fund infrastructure into your platform.
          Creator valuation, revenue share offerings, backer portfolios — all via REST API.
        </p>
      </div>

      {/* One-time key reveal */}
      {revealedKey && (
        <div className="mb-6 bg-green-500/10 border border-green-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm font-semibold text-green-400">Your API key — copy it now</p>
          </div>
          <p className="text-xs text-zinc-400 mb-3">This is the only time we'll show the full key. Store it securely.</p>
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
            <code className="text-sm text-white font-mono flex-1 break-all">{revealedKey}</code>
            <button onClick={() => copy(revealedKey)} className="text-purple-400 hover:text-purple-300 transition-colors shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-3 text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
            I've saved it — dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* API Keys */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">API Keys</h2>
            <button
              onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Key
            </button>
          </div>

          {showForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
              />
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PLANS).map(([k, p]) => (
                  <button
                    key={k}
                    onClick={() => setNewKeyPlan(k)}
                    className={`p-3 rounded-xl border text-left transition-colors ${newKeyPlan === k ? 'border-purple-600 bg-purple-600/10' : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600'}`}
                  >
                    <p className={`text-xs font-semibold ${p.color}`}>{p.label}</p>
                    <p className="text-xs text-zinc-500">{p.rate}/day</p>
                    <p className="text-xs text-white font-medium mt-1">{p.price}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={createKey}
                disabled={creating}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {creating ? 'Generating…' : 'Generate Key'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-16 animate-pulse" />)}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-2xl">
              No API keys yet — create one to start integrating
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Key className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{k.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLANS[k.plan]?.color} bg-zinc-800`}>
                        {PLANS[k.plan]?.label}
                      </span>
                      {!k.is_active && <span className="text-xs text-red-400">Revoked</span>}
                    </div>
                    <code className="text-xs text-zinc-500 font-mono">{k.key_prefix}</code>
                    <span className="text-xs text-zinc-600 ml-2">· {k.requests_today}/{k.rate_limit} today</span>
                  </div>
                  {k.is_active && (
                    <button onClick={() => revokeKey(k.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Usage</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Requests today</p>
            <p className="text-2xl font-bold text-white">{todayRequests}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-2">Recent calls</p>
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-600">No requests yet</p>
            ) : (
              <div className="space-y-1.5">
                {logs.slice(0, 8).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <code className="text-zinc-400 truncate flex-1">{l.endpoint}</code>
                    <span className={`ml-2 shrink-0 font-medium ${l.status_code < 300 ? 'text-green-400' : 'text-red-400'}`}>
                      {l.status_code}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-white">API Reference</h2>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">v1</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-xs text-zinc-500 mb-1">Base URL</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-purple-300 font-mono">
              https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api
            </code>
            <button
              onClick={() => copy('https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/creator-fund-api')}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {ENDPOINTS.map(ep => <EndpointRow key={ep.path + ep.method} ep={ep} />)}
        </div>
      </div>

      {/* Rate limits */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {Object.entries(PLANS).map(([k, p]) => (
          <div key={k} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className={`text-sm font-bold mb-1 ${p.color}`}>{p.label}</p>
            <p className="text-lg font-bold text-white">{p.price}</p>
            <p className="text-xs text-zinc-500 mt-1">{p.rate.toLocaleString()} req/day</p>
          </div>
        ))}
      </div>
    </div>
  )
}
