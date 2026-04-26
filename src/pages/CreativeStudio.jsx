import React, { useState } from 'react'
import { Palette, Image, Loader2, Download, Wand2 } from 'lucide-react'

const STYLES = ['Photorealistic', 'Cinematic', 'Illustration', 'Anime', '3D Render', 'Abstract', 'Neon', 'Portrait']

export default function CreativeStudio() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Photorealistic')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('image')

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${prompt}, ${style} style`, style: style.toLowerCase() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.url)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Creative Studio</h1>
      <p className="text-muted-foreground text-sm mb-6">AI image generation and creative tools</p>

      <div className="flex bg-muted rounded-xl p-1 mb-6">
        {['image', 'avatar'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t === 'image' ? 'AI Image' : 'AI Avatar'}
          </button>
        ))}
      </div>

      {tab === 'image' ? (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${style === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate…" rows={3}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate Image'}
            </button>
          </div>

          {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">{error}</div>}

          {result && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <img src={result} alt="Generated" className="w-full" />
              <div className="p-3 flex justify-end">
                <a href={result} download target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">AI Avatar Generator</h3>
          <p className="text-muted-foreground text-sm">Upload a photo to generate a custom AI avatar in different styles.</p>
          <p className="text-xs text-muted-foreground mt-3">Powered by HeyGen — coming soon</p>
        </div>
      )}
    </div>
  )
}
