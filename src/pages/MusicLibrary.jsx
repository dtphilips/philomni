import React, { useState, useRef } from 'react'
import { Play, Pause, Download, Search } from 'lucide-react'

const MX = (slug) => `https://assets.mixkit.co/sfx/preview/${slug}.mp3`
const SJ = (path) => `https://www.soundjay.com/${path}`

const SOUNDS = [
  { id: 1,  category: 'UI Sounds',   name: 'Button Click',      icon: '🖱️', audio_url: MX('mixkit-interface-click-1126') },
  { id: 2,  category: 'UI Sounds',   name: 'Success Chime',     icon: '✅', audio_url: MX('mixkit-correct-answer-tone-2870') },
  { id: 3,  category: 'UI Sounds',   name: 'Error Buzz',        icon: '❌', audio_url: MX('mixkit-wrong-answer-fail-notification-946') },
  { id: 4,  category: 'UI Sounds',   name: 'Notification Ding', icon: '🔔', audio_url: MX('mixkit-software-interface-start-2574') },
  { id: 5,  category: 'UI Sounds',   name: 'Pop',               icon: '💥', audio_url: MX('mixkit-bubble-pop-up-alert-notification-2357') },
  { id: 6,  category: 'Nature',      name: 'Ocean Waves',       icon: '🌊', audio_url: MX('mixkit-ocean-waves-loop-1196') },
  { id: 7,  category: 'Nature',      name: 'Rain Shower',       icon: '🌧️', audio_url: MX('mixkit-light-rain-loop-2393') },
  { id: 8,  category: 'Nature',      name: 'Thunder Crack',     icon: '⛈️', audio_url: MX('mixkit-thunder-and-rain-2403') },
  { id: 9,  category: 'Nature',      name: 'Forest Birds',      icon: '🐦', audio_url: MX('mixkit-morning-forest-birds-2472') },
  { id: 10, category: 'Nature',      name: 'Campfire',          icon: '🔥', audio_url: MX('mixkit-campfire-crackles-1330') },
  { id: 11, category: 'Electronic',  name: 'Laser Zap',         icon: '⚡', audio_url: MX('mixkit-sci-fi-laser-short-pulse-854') },
  { id: 12, category: 'Electronic',  name: 'Synth Sweep',       icon: '🎛️', audio_url: MX('mixkit-synth-pop-hit-2300') },
  { id: 13, category: 'Electronic',  name: 'Power Up',          icon: '🚀', audio_url: MX('mixkit-game-bonus-reached-2065') },
  { id: 14, category: 'Electronic',  name: 'Glitch',            icon: '📡', audio_url: MX('mixkit-fast-glitch-effect-2369') },
  { id: 15, category: 'Electronic',  name: 'Alarm',             icon: '🚨', audio_url: MX('mixkit-classic-short-alarm-993') },
  { id: 16, category: 'Foley',       name: 'Door Knock',        icon: '🚪', audio_url: SJ('door/sounds/door-knock-1.mp3') },
  { id: 17, category: 'Foley',       name: 'Keyboard Typing',   icon: '⌨️', audio_url: MX('mixkit-typewriter-soft-note-1125') },
  { id: 18, category: 'Foley',       name: 'Camera Shutter',    icon: '📷', audio_url: MX('mixkit-camera-shutter-click-1133') },
  { id: 19, category: 'Foley',       name: 'Footsteps',         icon: '👟', audio_url: MX('mixkit-footsteps-in-grass-2476') },
  { id: 20, category: 'Foley',       name: 'Paper Rustle',      icon: '📄', audio_url: SJ('paper/sounds/paper-1.mp3') },
  { id: 21, category: 'Music',       name: 'Drum Hit',          icon: '🥁', audio_url: MX('mixkit-drum-snare-2140') },
  { id: 22, category: 'Music',       name: 'Guitar Strum',      icon: '🎸', audio_url: MX('mixkit-acoustic-guitar-strum-2367') },
  { id: 23, category: 'Music',       name: 'Piano Chord',       icon: '🎹', audio_url: MX('mixkit-piano-chord-2369') },
  { id: 24, category: 'Music',       name: 'Trumpet Fanfare',   icon: '🎺', audio_url: MX('mixkit-trumpet-fanfare-2335') },
  { id: 25, category: 'Music',       name: 'Crowd Applause',    icon: '👏', audio_url: MX('mixkit-crowd-applause-2211') },
]

const CATEGORIES = ['All', ...new Set(SOUNDS.map(s => s.category))]
const COLORS = { 'UI Sounds': 'text-blue-400', Nature: 'text-emerald-400', Electronic: 'text-purple-400', Foley: 'text-amber-400', Music: 'text-pink-400' }

export default function MusicLibrary() {
  const [playing, setPlaying] = useState(null)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const audioRef = useRef(new Audio())

  const togglePlay = (sound) => {
    const audio = audioRef.current
    if (playing === sound.id) { audio.pause(); setPlaying(null); return }
    audio.src = sound.audio_url
    audio.play().catch(console.error)
    audio.onended = () => setPlaying(null)
    setPlaying(sound.id)
  }

  const filtered = SOUNDS.filter(s =>
    (category === 'All' || s.category === category) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Music Library</h1>
      <p className="text-muted-foreground text-sm mb-6">Royalty-free sound effects for your content</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sounds…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Sound grid */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No sounds found</div>
        ) : filtered.map(sound => (
          <div key={sound.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
            <button onClick={() => togglePlay(sound)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${playing === sound.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-primary/20 hover:text-primary'}`}>
              {playing === sound.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-xl flex-shrink-0">{sound.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{sound.name}</p>
              <p className={`text-xs ${COLORS[sound.category] ?? 'text-muted-foreground'}`}>{sound.category}</p>
            </div>
            {playing === sound.id && (
              <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-0.5 bg-primary rounded-full animate-pulse" style={{ height: `${50 + i * 15}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
