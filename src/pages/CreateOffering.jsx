import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Plus, X, TrendingUp, Info } from 'lucide-react'

export default function CreateOffering() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    total_slots: 10,
    price_per_slot: 50,
    currency: 'USD',
    percentage_share: 5,
    duration_months: 12,
    perks: [],
  })
  const [perkInput, setPerkInput] = useState('')
  const [saving, setSaving] = useState(false)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function addPerk() {
    const p = perkInput.trim()
    if (!p || form.perks.includes(p)) return
    set('perks', [...form.perks, p])
    setPerkInput('')
  }

  function removePerk(p) {
    set('perks', form.perks.filter(x => x !== p))
  }

  async function submit(e) {
    e.preventDefault()
    if (!user) { toast.error('Sign in first'); return }
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.description.trim()) { toast.error('Description is required'); return }

    setSaving(true)
    const { error } = await supabase.from('creator_offerings').insert({
      creator_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      total_slots: Number(form.total_slots),
      price_per_slot: Number(form.price_per_slot),
      currency: form.currency,
      percentage_share: Number(form.percentage_share),
      duration_months: Number(form.duration_months),
      perks: form.perks,
      status: 'open',
    })
    setSaving(false)

    if (error) { toast.error(error.message); return }
    toast.success('Offering created! 🚀')
    navigate('/creator-fund')
  }

  const totalRaise = form.total_slots * form.price_per_slot

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/creator-fund')} className="text-sm text-zinc-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
        ← Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Create a Revenue Share Offering</h1>
          <p className="text-sm text-zinc-500">Let your community back your creative journey</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Offering Title</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Back My Creator Journey"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tell backers what they're supporting</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="Describe what you're building, your audience, and why now is the right time…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600 resize-none"
          />
        </div>

        {/* Slot config */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Total Slots</label>
            <input
              type="number" min={1} max={1000}
              value={form.total_slots}
              onChange={e => set('total_slots', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Price per Slot (USD)</label>
            <input
              type="number" min={1}
              value={form.price_per_slot}
              onChange={e => set('price_per_slot', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
        </div>

        {/* Revenue share + duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Revenue Share %
              <span className="ml-1 text-zinc-500 text-xs">(total, split among all slots)</span>
            </label>
            <input
              type="number" min={1} max={50} step={0.5}
              value={form.percentage_share}
              onChange={e => set('percentage_share', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Duration (months)</label>
            <input
              type="number" min={1} max={60}
              value={form.duration_months}
              onChange={e => set('duration_months', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-600"
            />
          </div>
        </div>

        {/* Live preview of the deal */}
        <div className="bg-purple-500/10 border border-purple-800/30 rounded-2xl p-4">
          <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Deal Preview</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-white">${totalRaise.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">Max raise</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{form.percentage_share}%</p>
              <p className="text-xs text-zinc-500">Revenue shared</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{form.duration_months}mo</p>
              <p className="text-xs text-zinc-500">Agreement length</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 text-center">
            Each backer gets {form.total_slots > 0 ? (form.percentage_share / form.total_slots).toFixed(2) : '—'}% per slot for {form.duration_months} months
          </p>
        </div>

        {/* Perks */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Supporter Perks (optional)</label>
          <div className="flex gap-2 mb-2">
            <input
              value={perkInput}
              onChange={e => setPerkInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPerk())}
              placeholder="e.g. Monthly Q&A access"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-600"
            />
            <button
              type="button"
              onClick={addPerk}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm transition-colors border border-zinc-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.perks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.perks.map(p => (
                <span key={p} className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full">
                  {p}
                  <button onClick={() => removePerk(p)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Legal note */}
        <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500">
            By creating this offering you agree that this is a Revenue Share Agreement, not an equity
            or securities offering. Philomni will facilitate payments and deduct the agreed percentage
            from your monthly earnings for the agreed duration.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Publishing…' : 'Publish Offering'}
        </button>
      </form>
    </div>
  )
}
