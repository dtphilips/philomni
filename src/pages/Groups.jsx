import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Users, Plus, Search, Lock, Globe, Hash, Loader2,
  MessageSquare, X, ChevronRight, Megaphone, Check,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

function fmtCount(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function Avatar({ src, name, size = 10 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500','bg-pink-500','bg-indigo-500']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  return src
    ? <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{initials}</div>
}

// ─── Sample groups (shown if DB is empty) ─────────────────────────────────────

const SAMPLE_GROUPS = [
  { id: 's1', name: 'Video Creators Network', description: 'Connect with video creators worldwide. Share work, get feedback, find collabs.', group_type: 'group', is_private: false, member_count: 12430, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
  { id: 's2', name: 'African Creators Hub', description: 'The premier community for African and diaspora creators — building together.', group_type: 'group', is_private: false, member_count: 8720, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
  { id: 's3', name: 'Philomni Official', description: 'Official announcements, product updates, and platform news from the Philomni team.', group_type: 'channel', is_private: false, member_count: 45800, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
  { id: 's4', name: 'Music Producers', description: 'Producers, beatmakers, and musicians. Share tracks, find features, discuss the craft.', group_type: 'group', is_private: false, member_count: 9180, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
  { id: 's5', name: 'Brand Deals & UGC', description: 'Land brand deals, share rate cards, get contract advice. The business side of creating.', group_type: 'group', is_private: false, member_count: 6540, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
  { id: 's6', name: 'Tech & AI For Creators', description: 'AI tools, automation, tech setups. How to use technology to 10x your creative output.', group_type: 'channel', is_private: false, member_count: 5540, avatar_url: null, status: 'active', created_at: new Date().toISOString() },
]

// ─── Create Group Modal ───────────────────────────────────────────────────────

function CreateGroupModal({ user, onCreated, onClose }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupType, setGroupType] = useState('group')
  const [isPrivate, setIsPrivate] = useState(false)
  const [onlyAdminPost, setOnlyAdminPost] = useState(false)
  const [allowReactions, setAllowReactions] = useState(true)
  const [allowFiles, setAllowFiles] = useState(true)
  const [allowVoice, setAllowVoice] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const inviteCode = genInviteCode()
      const { data: group, error: gErr } = await supabase.from('groups').insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
        group_type: groupType,
        is_private: isPrivate,
        invite_code: inviteCode,
        only_admin_can_post: groupType === 'channel' ? true : onlyAdminPost,
        allow_reactions: allowReactions,
        allow_files: allowFiles,
        allow_voice: allowVoice,
        member_count: 1,
        status: 'active',
      }).select().single()
      if (gErr) throw gErr
      // Insert creator as owner
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
        can_post: true,
        can_invite: true,
      })
      onCreated(group)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
  const Toggle = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">Create {step === 1 ? 'Group or Channel' : 'Settings'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'group', icon: Users, label: 'Group', desc: 'Everyone can post' },
                  { type: 'channel', icon: Megaphone, label: 'Channel', desc: 'Only admins post' },
                ].map(({ type, icon: Icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => setGroupType(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${groupType === type ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`}
                  >
                    <Icon className={`w-7 h-7 ${groupType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${groupType === type ? 'text-primary' : ''}`}>{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{groupType === 'channel' ? 'Channel' : 'Group'} Name *</label>
                <input className={inp} placeholder={`e.g. ${groupType === 'channel' ? 'Philomni News' : 'Video Creators Hub'}`} value={name} onChange={e => setName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea className={`${inp} resize-none`} rows={3} placeholder="What's this about?" value={description} onChange={e => setDescription(e.target.value)} maxLength={300} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer" onClick={() => setIsPrivate(v => !v)}>
                {isPrivate ? <Lock className="w-5 h-5 text-primary flex-shrink-0" /> : <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                <div className="flex-1">
                  <div className="text-sm font-semibold">{isPrivate ? 'Private' : 'Public'}</div>
                  <div className="text-xs text-muted-foreground">{isPrivate ? 'People must be invited to join' : 'Anyone can find and join'}</div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-1 divide-y divide-border/50">
              {groupType === 'group' && (
                <Toggle checked={onlyAdminPost} onChange={setOnlyAdminPost} label="Only admins can post" />
              )}
              <Toggle checked={allowReactions} onChange={setAllowReactions} label="Allow emoji reactions" />
              <Toggle checked={allowFiles} onChange={setAllowFiles} label="Allow file sharing" />
              <Toggle checked={allowVoice} onChange={setAllowVoice} label="Allow voice messages" />
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Back</button>
            )}
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, isMember, isOwner, onJoin, onOpen, joining }) {
  const isChannel = group.group_type === 'channel'
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Banner / color strip */}
      <div className={`h-14 ${isChannel ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gradient-to-r from-primary/70 to-primary'} relative`}>
        {group.banner_url && <img src={group.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      </div>
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-5 mb-3">
          <div className="w-11 h-11 rounded-full border-2 border-card bg-card overflow-hidden flex-shrink-0">
            {group.avatar_url
              ? <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
              : <div className={`w-full h-full flex items-center justify-center text-white text-lg font-bold ${isChannel ? 'bg-violet-600' : 'bg-primary'}`}>
                  {isChannel ? <Megaphone className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
            }
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isChannel ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-primary/10 text-primary'}`}>
            {isChannel ? 'Channel' : 'Group'}
          </span>
        </div>
        <h3 className="font-bold text-foreground leading-tight line-clamp-1">{group.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 mb-2">
          {group.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
          <span>{fmtCount(group.member_count)} member{group.member_count !== 1 ? 's' : ''}</span>
        </div>
        {group.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>}
        {isMember ? (
          <button onClick={() => onOpen(group.id)} className="w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
            Open <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => onJoin(group)}
            disabled={joining === group.id}
            className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {joining === group.id ? <Loader2 className="w-4 h-4 animate-spin" /> : group.is_private ? 'Request to Join' : 'Join'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Groups Page ─────────────────────────────────────────────────────────

export default function Groups() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('my')
  const [groups, setGroups] = useState([])
  const [myGroupIds, setMyGroupIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    // Load all active groups
    const { data: allGroups } = await supabase.from('groups').select('*').eq('status', 'active').order('member_count', { ascending: false })
    const gs = allGroups || []
    // Fill with samples if empty
    setGroups(gs.length ? gs : SAMPLE_GROUPS)

    // Load user memberships
    if (user?.id) {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id)
      setMyGroupIds(new Set((memberships || []).map(m => m.group_id)))
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const handleJoin = async (group) => {
    if (!user) { navigate('/login'); return }
    if (joining) return
    setJoining(group.id)
    try {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'member', can_post: !group.only_admin_can_post })
      await supabase.from('groups').update({ member_count: (group.member_count || 0) + 1 }).eq('id', group.id)
      setMyGroupIds(prev => new Set([...prev, group.id]))
      if (!group.is_private) navigate(`/groups/${group.id}`)
    } catch { /* ignore duplicate */ }
    setJoining(null)
  }

  const handleCreated = (group) => {
    setShowCreate(false)
    navigate(`/groups/${group.id}`)
  }

  const q = search.toLowerCase()
  const filtered = groups.filter(g => !q || g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
  const myGroups = filtered.filter(g => myGroupIds.has(g.id))
  const discover = filtered.filter(g => !myGroupIds.has(g.id) && g.group_type === 'group')
  const channels = filtered.filter(g => g.group_type === 'channel')

  const tabs = [
    { id: 'my', label: 'My Groups', count: myGroups.length },
    { id: 'discover', label: 'Discover', count: discover.length },
    { id: 'channels', label: 'Channels', count: channels.length },
  ]
  const shown = tab === 'my' ? myGroups : tab === 'discover' ? discover : channels

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups & Channels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Collaborate with creators around shared interests</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search groups and channels…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label} {t.count > 0 && <span className="text-xs opacity-60 ml-1">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/60">
          {tab === 'my' ? (
            <>
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg font-bold mb-1">No groups yet</p>
              <p className="text-sm text-muted-foreground mb-4">Join a group or create your own</p>
              <button onClick={() => setTab('discover')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Discover Groups</button>
            </>
          ) : (
            <>
              <Hash className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg font-bold mb-1">No {tab === 'channels' ? 'channels' : 'groups'} found</p>
              {search && <p className="text-sm text-muted-foreground">Try a different search term</p>}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              isMember={myGroupIds.has(group.id)}
              onJoin={handleJoin}
              onOpen={id => navigate(`/groups/${id}`)}
              joining={joining}
            />
          ))}
        </div>
      )}

      {showCreate && user && (
        <CreateGroupModal user={user} onCreated={handleCreated} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
