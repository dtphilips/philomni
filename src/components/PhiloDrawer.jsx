import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, ExternalLink, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { useMusic } from '../context/MusicContext'

const PHILO_MINI_PROMPT = `You are Philo, Philomni's AI assistant. You are warm, encouraging, and expert in creator economy, content creation, careers, and business. You speak like a smart friend, not a corporate bot. Be helpful and specific. Keep responses concise since this is a mini chat window — aim for 2-4 sentences unless more detail is truly needed.`

function buildMiniSystem(user, mode) {
  if (!user) return PHILO_MINI_PROMPT
  return (
    PHILO_MINI_PROMPT +
    `\n\nUser: ${user.full_name || 'Creator'}, Mode: ${mode === 'pro' ? 'Professional' : 'Creator'}.`
  )
}

export default function PhiloDrawer() {
  const { user } = useAuth()
  const { mode } = useMode()
  const { currentTrack } = useMusic()
  const navigate = useNavigate()
  const playerVisible = !!currentTrack // music player occupies the bottom 72px

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          system: buildMiniSystem(user, mode),
          history,
          max_tokens: 600,
        }),
      })
      const data = await res.json()
      const reply =
        data.content || data.result || 'Something went wrong. Try again!'
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I ran into an error. Please try again.',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [input, messages, user, mode, isTyping])

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const openFullChat = () => {
    setOpen(false)
    navigate('/ai')
  }

  const clearChat = () => {
    setMessages([])
    setInput('')
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-6 z-[110] w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center ${
            playerVisible ? 'bottom-[88px]' : 'bottom-6'
          }`}
          title="Ask Philo"
          aria-label="Open Philo AI assistant"
        >
          <span className="text-2xl leading-none">✨</span>
        </button>
      )}

      {/* ── Mini chat drawer ─────────────────────────────────────────────── */}
      {/* Mobile: full-screen (with notch/home-bar safe areas).
          Desktop: floating card, lifted above the music player when it's visible.
          z-[60] keeps it below the player (z-100) so the player stays visible at
          the bottom and the input is padded up above it on mobile. */}
      {open && (
        <div
          className={`fixed z-[60] flex flex-col bg-card overflow-hidden shadow-2xl
            inset-0 w-full h-full
            sm:inset-auto sm:right-6 sm:w-96 sm:h-[460px] sm:rounded-2xl sm:border sm:border-border
            ${playerVisible ? 'sm:bottom-[88px]' : 'sm:bottom-6'}`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-gradient-to-r from-purple-900/30 to-violet-900/30 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-lg flex-shrink-0">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-none">Philo</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isTyping ? 'Thinking...' : 'AI assistant'}
              </p>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                title="New chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={openFullChat}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              title="Open full Philo chat"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm font-semibold text-foreground">Hi, I&apos;m Philo!</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Ask me anything about your creator journey, content strategy, career, or business.
                </p>
                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  {[
                    'Help me write a caption',
                    'Give me content ideas',
                    'Review my pitch idea',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus() }}
                      className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:bg-muted hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        ✨
                      </div>
                    )}
                    <div
                      className={[
                        'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted text-foreground rounded-tl-none',
                      ].join(' ')}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-xs flex-shrink-0">
                      ✨
                    </div>
                    <div className="bg-muted rounded-xl rounded-tl-none px-3 py-2.5">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input — on mobile, lift above the music player + home bar so the
              send button is always tappable. Desktop resets to normal padding
              since the whole drawer already floats above the player. */}
          <div className={`flex-shrink-0 px-3 pt-2 border-t border-border sm:pb-3 ${
            playerVisible
              ? 'pb-[calc(72px+env(safe-area-inset-bottom)+0.75rem)]'
              : 'pb-[calc(env(safe-area-inset-bottom)+0.75rem)]'
          }`}>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Philo..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className={[
                  'p-1.5 rounded-lg transition-all flex-shrink-0',
                  input.trim() && !isTyping
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-muted-foreground cursor-not-allowed',
                ].join(' ')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
              Philo can make mistakes.{' '}
              <button
                onClick={openFullChat}
                className="underline hover:text-muted-foreground transition-colors"
              >
                Open full chat
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
