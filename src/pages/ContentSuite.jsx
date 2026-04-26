import React, { useState } from 'react'
import { Wand2, Copy, Loader2, Check } from 'lucide-react'

const TEMPLATES = [
  { id: 'caption', label: 'Social Caption', prompt: (topic) => `Write 3 engaging social media captions for: "${topic}". Include relevant emojis and hashtags. Format as numbered list.` },
  { id: 'hook', label: 'Video Hook', prompt: (topic) => `Write 3 compelling video hooks (first 5 seconds) for a video about: "${topic}". Make them attention-grabbing.` },
  { id: 'bio', label: 'Creator Bio', prompt: (topic) => `Write a professional creator bio for: "${topic}". Keep it under 150 characters, make it memorable.` },
  { id: 'title', label: 'YouTube Title', prompt: (topic) => `Write 5 clickable YouTube video titles for: "${topic}". Use power words, numbers where relevant.` },
  { id: 'thread', label: 'Twitter Thread', prompt: (topic) => `Write a 5-tweet Twitter/X thread about: "${topic}". Number each tweet, make them informative and engaging.` },
  { id: 'email', label: 'Email Subject', prompt: (topic) => `Write 5 high-converting email subject lines about: "${topic}". Focus on curiosity and value.` },
]

export default function ContentSuite() {
  const [topic, setTopic] = useState('')
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult('')
    setError('')
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: template.prompt(topic) }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result ?? '')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Content Suite</h1>
      <p className="text-muted-foreground text-sm mb-6">AI-powered content generation for creators</p>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Template picker */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Template</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${template.id === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Topic / Subject</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. 'My morning skincare routine for beginners'"
            rows={2}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">{error}</div>
      )}

      {result && (
        <div className="mt-4 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{template.label}</h3>
            <button onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  )
}
