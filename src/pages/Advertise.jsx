import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  Megaphone, Upload, Eye, MousePointer, DollarSign,
  Calendar, Target, Loader2, ExternalLink, ImageIcon, ArrowRight,
} from 'lucide-react'

const INDUSTRIES = [
  'Technology', 'Fashion & Lifestyle', 'Finance', 'Healthcare', 'Education',
  'Media & Entertainment', 'Food & Beverage', 'Real Estate', 'Marketing',
  'E-commerce', 'Gaming', 'Travel', 'Sports & Fitness', 'Beauty', 'Other',
]
const FOLLOWER_RANGES = ['1–10K', '10K–100K', '100K–1M', '1M+', 'Any']

const CPV   = 0.001 // cost per view
const MIN_BUDGET = 50

function estimateReach(budget) {
  return Math.round((budget / CPV) * 0.7)
}

async function uploadMedia(file) {
  const ext  = file.name.split('.').pop() || 'bin'
  const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl
}

export default function Advertise() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading] = useState(false)
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)

  const [form, setForm] = useState({
    title:           '',
    content:         '',
    cta_text:        'Learn More',
    cta_url:         '',
    budget:          '',
    industry:        '',
    follower_range:  'Any',
    country:         '',
    start_date:      '',
    end_date:        '',
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Ad headline is required'); return }
    if (!form.cta_url.trim()) { toast.error('CTA URL is required'); return }
    const budget = parseFloat(form.budget)
    if (!budget || budget < MIN_BUDGET) { toast.error(`Minimum budget is $${MIN_BUDGET}`); return }

    setLoading(true)
    try {
      let imageUrl = null, videoUrl = null
      if (mediaFile) {
        const url = await uploadMedia(mediaFile)
        const isVid = mediaFile.type.startsWith('video/')
        if (isVid) videoUrl = url; else imageUrl = url
      }

      await supabase.from('ads').insert({
        advertiser_id: user.id,
        title:         form.title,
        content:       form.content,
        cta_text:      form.cta_text || 'Learn More',
        cta_url:       form.cta_url,
        image_url:     imageUrl,
        video_url:     videoUrl,
        budget,
        cost_per_view: CPV,
        target_audience: {
          industry:       form.industry || null,
          follower_range: form.follower_range || 'Any',
          country:        form.country || null,
        },
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
        status:     'pending',
      })

      toast.success('Ad submitted for review! We\'ll activate it within 24 hours.')
      navigate('/my-ads')
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  const budget = parseFloat(form.budget) || 0

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Create an Ad</h1>
      </div>

      {/* Managed campaign callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20 mb-6">
        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Running a campaign over $500?</span>{' '}
          Contact our partnerships team for custom pricing, priority placement, and a dedicated account manager.{' '}
          <Link to="/partners" className="text-primary hover:underline font-medium">
            View Packages &rarr;
          </Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ad Headline <span className="text-muted-foreground font-normal">({form.title.length}/60)</span>
            </label>
            <input value={form.title} onChange={e => set('title', e.target.value.slice(0, 60))}
              placeholder="Short, punchy headline…"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground font-normal">({form.content.length}/150)</span>
            </label>
            <textarea value={form.content} onChange={e => set('content', e.target.value.slice(0, 150))}
              placeholder="Tell your audience what you're offering…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ad Creative (image or video)</label>
            <label className="flex items-center justify-center gap-2 px-4 py-5 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/40 text-muted-foreground hover:text-foreground">
              {mediaFile ? (
                <span className="text-sm">{mediaFile.name}</span>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Upload image or video (JPG, PNG, MP4)</span>
                </>
              )}
              <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleMediaChange} />
            </label>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">CTA Button Text</label>
              <select value={form.cta_text} onChange={e => set('cta_text', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {['Learn More','Shop Now','Sign Up','Download','Get Started','Book Now','Contact Us'].map(t =>
                  <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Destination URL</label>
              <input value={form.cta_url} onChange={e => set('cta_url', e.target.value)}
                placeholder="https://yoursite.com" type="url"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Budget (USD · minimum ${MIN_BUDGET})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input value={form.budget} onChange={e => set('budget', e.target.value)} type="number" min={MIN_BUDGET}
                placeholder="100"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {budget >= MIN_BUDGET && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimated reach: ~{estimateReach(budget).toLocaleString()} views · ${CPV}/view
              </p>
            )}
          </div>

          {/* Targeting */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Target Audience (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Industry / Niche</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Any Industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Follower Range</label>
                <select value={form.follower_range} onChange={e => set('follower_range', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {FOLLOWER_RANGES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Country / Region (optional)</label>
              <input value={form.country} onChange={e => set('country', e.target.value)}
                placeholder="e.g. Nigeria, Global, West Africa"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            Submit for Review
          </button>
          <p className="text-xs text-muted-foreground text-center">Ads are reviewed within 24 hours. You will only be charged for confirmed views.</p>
        </form>

        {/* Live preview */}
        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          <p className="text-sm font-semibold text-foreground">Live Preview</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Sponsored label */}
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{user?.full_name || 'Your Brand'}</p>
                  <p className="text-[10px] text-muted-foreground">Sponsored</p>
                </div>
              </div>
            </div>

            {/* Creative */}
            {mediaPreview ? (
              mediaFile?.type?.startsWith('video/')
                ? <video src={mediaPreview} className="w-full aspect-video object-cover mt-3" muted loop autoPlay />
                : <img src={mediaPreview} className="w-full aspect-video object-cover mt-3" alt="" />
            ) : (
              <div className="w-full aspect-video bg-muted mt-3 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}

            <div className="p-4">
              <p className="font-bold text-foreground text-sm mb-1">{form.title || 'Your ad headline'}</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{form.content || 'Your ad description will appear here.'}</p>
              <a href={form.cta_url || '#'} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                {form.cta_text || 'Learn More'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {budget >= MIN_BUDGET && (
            <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">${budget}</p>
                <p className="text-xs text-muted-foreground">Budget</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">~{(estimateReach(budget) / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Est. Views</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">${CPV}</p>
                <p className="text-xs text-muted-foreground">Per View</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
