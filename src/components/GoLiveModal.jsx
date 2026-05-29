import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Loader2, Radio, Upload } from 'lucide-react'

async function uploadThumb(file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `live-thumbnails/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

export default function GoLiveModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const thumbRef = useRef()

  const handleThumbPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailPreview(URL.createObjectURL(file))
    try {
      const url = await uploadThumb(file)
      setThumbnailUrl(url)
    } catch (err) { setError('Thumbnail upload failed') }
  }

  const handleStart = async () => {
    if (!title.trim()) { setError('Please enter a title for your live'); return }
    if (!user) { setError('Not logged in'); return }
    setStarting(true)
    setError('')
    try {
      const { data, error: insertErr } = await supabase.from('lives').insert({
        host_id: user.id,
        host_name: user.full_name || user.email,
        host_avatar: user.avatar_url || null,
        title: title.trim(),
        thumbnail_url: thumbnailUrl || null,
        status: 'live',
        started_at: new Date().toISOString(),
      }).select().single()
      if (insertErr) throw insertErr
      navigate(`/live/${data.id}/host`)
    } catch (err) {
      setError(err.message || 'Failed to start live')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <h3 className="font-bold text-base">Go Live</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Thumbnail */}
          <div
            className="relative w-full h-40 rounded-xl bg-muted overflow-hidden cursor-pointer flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors"
            onClick={() => thumbRef.current?.click()}
          >
            {thumbnailPreview
              ? <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
              : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs font-medium">Upload thumbnail (optional)</span>
                </div>
              )
            }
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbPick} />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Live Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="What are you streaming today?"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/120</p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={starting || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {starting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Radio className="w-4 h-4" />
              }
              {starting ? 'Starting…' : 'Start Live'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
