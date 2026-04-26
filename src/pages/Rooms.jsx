import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Radio, Plus, Users, PhoneOff, Loader2, Lock, Globe } from 'lucide-react'

function RoomIframe({ url, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-black/80 border-b border-white/10">
        <span className="text-white font-semibold text-sm">Philomni Room</span>
        <button onClick={onLeave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
          <PhoneOff className="w-4 h-4" /> Leave
        </button>
      </div>
      <iframe
        src={url}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        style={{ flex: 1, border: 'none' }}
        title="Room"
      />
    </div>
  )
}

export default function Rooms() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeRoom, setActiveRoom] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', is_private: false })

  useEffect(() => {
    supabase.from('rooms').select('*').eq('status', 'live').order('created_at', { ascending: false })
      .then(({ data }) => { setRooms(data ?? []); setLoading(false) })
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40)
    const roomName = `${slug}-${Date.now()}`
    const dailyDomain = import.meta.env.VITE_DAILY_DOMAIN || 'philomni'
    let roomUrl = `https://${dailyDomain}.daily.co/${roomName}`

    try {
      const res = await Promise.race([
        fetch('/api/daily-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roomName, properties: { max_participants: 50 } }),
        }).then(r => r.json()),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ])
      if (res?.url) roomUrl = res.url
    } catch (err) {
      console.error('[Rooms] Daily.co failed, using fallback:', err)
    }

    const { data } = await supabase.from('rooms').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      host_id: user.id,
      host_name: user.full_name,
      daily_url: roomUrl,
      daily_room_name: roomName,
      status: 'live',
      is_private: form.is_private,
      participant_count: 1,
    }).select().single()

    if (data) {
      setRooms(prev => [data, ...prev])
      setActiveRoom({ ...data, url: roomUrl })
      setShowForm(false)
      setForm({ name: '', description: '', is_private: false })
    }
    setCreating(false)
  }

  if (activeRoom) return <RoomIframe url={activeRoom.daily_url} onLeave={() => setActiveRoom(null)} />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Live audio & video rooms</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New Room
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground">Create a Room</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Room name" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))}
              className="rounded" />
            Private room
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {creating ? 'Creating…' : 'Start Room'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No live rooms</p>
          <p className="text-sm mt-1">Start one and invite your audience</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{room.name}</p>
                  {room.is_private ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Globe className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">LIVE</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Hosted by {room.host_name} · <Users className="w-3 h-3 inline" /> {room.participant_count ?? 1}</p>
              </div>
              <button
                onClick={() => setActiveRoom(room)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
