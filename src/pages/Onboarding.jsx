import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

const INTENTS = [
  { id: 'idea',        emoji: '🚀', label: 'I have a business idea',       desc: 'I want to develop and launch it',          tags: ['founder', 'pitch-vault', 'smartmatch'] },
  { id: 'investor',    emoji: '💰', label: "I'm looking to invest",        desc: 'Finding the right opportunities',           tags: ['investor', 'pitch-vault', 'smartmatch'] },
  { id: 'creator',     emoji: '🎨', label: "I'm a creator",                desc: 'Looking for work, collabs, and growth',     tags: ['creator', 'feed', 'smartmatch'] },
  { id: 'professional',emoji: '💼', label: "I'm a professional",           desc: 'Building my career and network',            tags: ['professional', 'jobs', 'pro-feed'] },
  { id: 'cofounder',   emoji: '🤝', label: 'Looking for a co-founder',     desc: 'I need the right partner to build with',    tags: ['founder', 'smartmatch', 'cofounder'] },
  { id: 'artist',      emoji: '🎵', label: "I'm an artist",                desc: 'Looking for my breakthrough moment',        tags: ['creator', 'music', 'feed'] },
  { id: 'brand',       emoji: '🏢', label: "I'm a brand",                  desc: 'Looking for creators and talent',           tags: ['brand', 'smartmatch', 'jobs'] },
  { id: 'network',     emoji: '🌍', label: 'Here to connect and grow',     desc: 'Building my network and community',         tags: ['community', 'network'] },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const handleContinue = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      const allTags = [...new Set(selected.flatMap(id => INTENTS.find(i => i.id === id)?.tags ?? []))]
      const primaryIntent = selected[0]
      const role = ['creator', 'artist'].some(x => selected.includes(x)) ? 'creator'
        : selected.includes('professional') ? 'professional'
        : selected.includes('investor')     ? 'investor'
        : selected.includes('brand')        ? 'business'
        : 'member'

      if (user?.id) {
        await supabase.from('users').update({
          role,
          intent_tags: allTags,
          primary_intent: primaryIntent,
        }).eq('id', user.id)
      }
      navigate('/onboarding/profile')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-5">P</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Welcome to Philomni 🎉
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Before we set up your profile, tell us what you're here for.
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">Select all that apply</p>
        </div>

        {/* Intent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {INTENTS.map(item => {
            const isSelected = selected.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                    : 'bg-card border-border hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <h3 className={`font-semibold text-base mb-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {item.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || loading}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Continue <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update your interests anytime in Settings
        </p>
      </div>
    </div>
  )
}
