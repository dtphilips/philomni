import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Send, Mic, MicOff, Paperclip, RefreshCw, Copy,
  ThumbsUp, ThumbsDown, Plus, MessageSquare, X,
  ChevronLeft, Check, FileText, Image as ImageIcon,
} from 'lucide-react'

// ── Philo's system prompt ────────────────────────────────────────────────────
const PHILO_BASE_PROMPT = `You are Philo, Philomni's AI assistant. Philomni is a global creator and professional platform that connects talent, ideas, and opportunities — especially for African and diaspora creators and professionals.

Your personality:
- Warm, encouraging, and direct
- Expert in creator economy, content creation, business, careers, and professional development
- Knowledgeable about African markets, Nigerian creators, and global opportunities
- You speak like a smart friend, not a corporate bot
- You celebrate wins and help with challenges

You can help with:
- Writing captions, scripts, bios, proposals
- Career advice and interview prep
- Business ideas and pitch writing
- Content strategy and growth tips
- Explaining contracts and negotiations
- Brainstorming and creative ideas
- General questions on any topic

Always be helpful, specific, and actionable. When relevant, mention Philomni features that can help (SmartMatch for connections, Pitch Vault for ideas, Marketplace for selling skills etc).

Format your responses clearly using markdown when helpful — use **bold** for emphasis, bullet points for lists, and code blocks for code. Keep responses focused and practical.`

const QUICK_PROMPTS = [
  {
    emoji: '✍️',
    title: 'Write a caption',
    subtitle: 'for my next post',
    prompt: 'Help me write an engaging caption for my next social media post. Ask me what the post is about first.',
  },
  {
    emoji: '🚀',
    title: 'Review my pitch',
    subtitle: 'idea and give tips',
    prompt: 'I want to share a business or content pitch idea. Review it and give me actionable tips to make it stronger.',
  },
  {
    emoji: '💼',
    title: 'Help me prepare',
    subtitle: 'for a job interview',
    prompt: 'Help me prepare for a job interview. Ask me what role and company so you can give specific advice.',
  },
  {
    emoji: '🎯',
    title: 'Give me content',
    subtitle: 'ideas for my niche',
    prompt: 'Give me 10 creative content ideas for my niche. Ask me my niche and target audience first.',
  },
]

function buildSystemPrompt(user, mode) {
  if (!user) return PHILO_BASE_PROMPT
  const lines = [
    '\n\nCurrent user context:',
    `- Name: ${user.full_name || 'Creator'}`,
    `- Mode: ${mode === 'pro' ? 'Professional (Pro)' : 'Creator'}`,
    user.industry ? `- Industry: ${user.industry}` : '',
    Array.isArray(user.skills) && user.skills.length
      ? `- Skills: ${user.skills.join(', ')}`
      : '',
    user.bio ? `- Bio: ${user.bio}` : '',
    user.location ? `- Location: ${user.location}` : '',
  ].filter(Boolean)
  return PHILO_BASE_PROMPT + lines.join('\n')
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PhiloAvatar({ size = 'md' }) {
  const s = {
    sm: 'w-8 h-8 text-base',
    md: 'w-9 h-9 text-lg',
    lg: 'w-16 h-16 text-3xl',
  }[size] || 'w-9 h-9 text-lg'
  return (
    <div
      className={`${s} rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-md`}
    >
      <span>✨</span>
    </div>
  )
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      className="prose prose-sm prose-invert max-w-none"
      components={{
        // eslint-disable-next-line no-unused-vars
        code({ node, inline, className, children, ...props }) {
          if (inline) {
            return (
              <code
                className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <pre className="bg-muted rounded-lg p-3 overflow-x-auto mt-2 mb-2">
              <code className="text-xs font-mono text-foreground" {...props}>
                {children}
              </code>
            </pre>
          )
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 mb-2 space-y-1 text-sm">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm">{children}</ol>
        },
        li({ children }) {
          return <li className="text-sm leading-relaxed">{children}</li>
        },
        strong({ children }) {
          return <strong className="font-semibold text-foreground">{children}</strong>
        },
        h1({ children }) {
          return <h1 className="text-base font-bold mb-2 text-foreground">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-sm font-bold mb-2 text-foreground">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          )
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:opacity-80"
            >
              {children}
            </a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function detectQuickActions(content) {
  const lower = content.toLowerCase()
  const actions = []
  if (lower.includes('caption') || lower.includes('post for') || lower.includes('social media')) {
    actions.push({ label: '📋 Copy to Feed', action: 'feed' })
  }
  if (lower.includes('pitch') || lower.includes('startup') || lower.includes('business idea')) {
    actions.push({ label: '🚀 Pitch Vault', action: 'pitch-vault' })
  }
  if (lower.includes('connect') || lower.includes('network') || lower.includes('smartmatch')) {
    actions.push({ label: '✨ SmartMatch', action: 'match' })
  }
  if (lower.includes('bio') || lower.includes('your profile') || lower.includes('update your')) {
    actions.push({ label: '👤 Edit Profile', action: 'edit-profile' })
  }
  return actions.slice(0, 3)
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PhilomniAI() {
  const { user } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const saveTimerRef = useRef(null)
  const convIdRef = useRef(null)

  // Keep ref in sync so async callbacks have latest value
  useEffect(() => { convIdRef.current = currentConvId }, [currentConvId])

  // ── Load conversation list ─────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(40)
      .catch(() => ({ data: [] }))
    setConversations(data || [])
  }, [user])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // ── Load a saved conversation ──────────────────────────────────────────────
  const loadConversation = useCallback(async (id) => {
    const { data } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('id', id)
      .single()
      .catch(() => ({ data: null }))
    if (data?.messages) {
      setMessages(data.messages)
      setCurrentConvId(id)
      setAttachments([])
      setMobileSidebarOpen(false)
    }
  }, [])

  // ── Start a new chat ───────────────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([])
    setCurrentConvId(null)
    setInput('')
    setAttachments([])
    setMobileSidebarOpen(false)
  }

  // ── Persist conversation to Supabase ───────────────────────────────────────
  const saveConversation = useCallback(async (msgs) => {
    if (!user || msgs.length === 0) return
    const convId = convIdRef.current
    const title = (msgs[0]?.content || 'Chat').toString().slice(0, 60)
    if (convId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq('id', convId)
        .catch(() => {})
    } else {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title, messages: msgs })
        .select('id')
        .single()
        .catch(() => ({ data: null }))
      if (data?.id) {
        setCurrentConvId(data.id)
        convIdRef.current = data.id
      }
    }
    loadConversations()
  }, [user, loadConversations])

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText) => {
    const text = typeof overrideText === 'string'
      ? overrideText.trim()
      : input.trim()
    if (!text && attachments.length === 0) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      attachments: attachments.map(a => ({ name: a.name, type: a.type })),
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setAttachments([])
    setIsTyping(true)

    try {
      // Vision: build multipart content if image attachments present
      const imageAttachments = attachments.filter(a => a.type.startsWith('image/'))
      let userContent
      if (imageAttachments.length > 0) {
        userContent = [
          ...imageAttachments.map(a => ({
            type: 'image',
            source: { type: 'base64', media_type: a.type, data: a.base64 },
          })),
          { type: 'text', text: text || 'Please analyze this image.' },
        ]
      }

      // Build conversation history for context (cap at last 20 messages to stay within token limits)
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }))

      const body = {
        prompt: text || 'Please analyze the attached content.',
        system: buildSystemPrompt(user, mode),
        history,
        max_tokens: 2000,
      }
      if (userContent) body.content = userContent

      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const reply = data.content || data.result || 'Sorry, I had trouble with that. Please try again.'

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)

      // Debounced Supabase save
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveConversation(finalMessages), 1200)
    } catch (err) {
      console.error('[PhilomniAI] sendMessage:', err)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I ran into an issue connecting. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [input, attachments, messages, user, mode, saveConversation])

  // ── Regenerate last Philo response ─────────────────────────────────────────
  const regenerate = useCallback(async () => {
    const lastAssistantIdx = messages.map(m => m.role).lastIndexOf('assistant')
    if (lastAssistantIdx < 1) return
    const withoutLast = messages.slice(0, lastAssistantIdx)
    const lastUser = [...withoutLast].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(withoutLast)
    await sendMessage(lastUser.content)
  }, [messages, sendMessage])

  // ── Copy message text ──────────────────────────────────────────────────────
  const copyMessage = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard not available */ }
  }

  // ── File attachment ────────────────────────────────────────────────────────
  const handleFileAttach = async (e) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = await Promise.all(
      files.slice(0, 3).map(
        file => new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]
            resolve({
              name: file.name,
              type: file.type,
              base64,
              preview: file.type.startsWith('image/') ? reader.result : null,
            })
          }
          reader.readAsDataURL(file)
        })
      )
    )
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 3))
    e.target.value = ''
  }

  // ── Voice input ────────────────────────────────────────────────────────────
  const handleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) {
        alert('Voice input is not supported in this browser.')
        return
      }
      const recognition = new SR()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = e => {
        const t = e.results[0][0].transcript
        setInput(prev => (prev ? prev + ' ' + t : t))
        setIsRecording(false)
      }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)
      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
    } catch { setIsRecording(false) }
  }

  // ── Quick action navigation ────────────────────────────────────────────────
  const handleQuickAction = (action, content) => {
    if (action === 'feed') {
      navigate('/?compose=' + encodeURIComponent(content.slice(0, 300)))
    } else {
      navigate('/' + action)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const charCount = input.length
  const charColor =
    charCount > 2000 ? 'text-destructive' :
    charCount > 1500 ? 'text-amber-400' :
    'text-muted-foreground'

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-background">

      {/* ── History sidebar — mobile overlay + desktop permanent ─────────── */}
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'flex flex-col border-r border-border bg-card flex-shrink-0 transition-all duration-300',
          // Mobile: slide in as overlay
          mobileSidebarOpen
            ? 'fixed inset-y-0 left-0 w-64 z-40 shadow-2xl'
            : 'w-0 overflow-hidden',
          // Desktop: always visible at 200px
          'lg:relative lg:w-52 lg:overflow-visible lg:shadow-none lg:block',
        ].join(' ')}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <PhiloAvatar size="sm" />
            <span className="font-bold text-foreground text-sm">Philo</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-3">
              Your conversations will appear here
            </p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={[
                  'w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors',
                  currentConvId === conv.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-medium">{conv.title || 'Chat'}</span>
                </div>
                <span className="text-[10px] opacity-50 pl-4">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <PhiloAvatar size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-none">Philo ✨</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isTyping ? 'Thinking...' : 'Your AI assistant on Philomni'}
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">

          {messages.length === 0 ? (
            /* ── Welcome screen ─────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center min-h-full text-center py-8 px-4">
              <PhiloAvatar size="lg" />
              <h1 className="mt-6 text-2xl font-bold text-foreground">
                Hi, I&apos;m Philo ✨
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Your AI assistant on Philomni
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-8">
                I can help you create, grow, connect, and succeed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.map(qp => (
                  <button
                    key={qp.title}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/40 text-left transition-all group"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{qp.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {qp.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{qp.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat messages ──────────────────────────────────────────── */
            <>
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                const isLastMsg = idx === messages.length - 1
                const isLastAssistant = !isUser && isLastMsg
                const quickActions = isLastAssistant
                  ? detectQuickActions(msg.content)
                  : []

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    ) : (
                      <PhiloAvatar size="sm" />
                    )}

                    {/* Bubble + actions */}
                    <div className={`max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div
                        className={[
                          'group relative rounded-2xl px-4 py-3 text-sm',
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-card border border-border text-foreground rounded-tl-none',
                        ].join(' ')}
                      >
                        {isUser ? (
                          <div>
                            {msg.attachments?.length > 0 && (
                              <div className="flex gap-1.5 mb-2 flex-wrap">
                                {msg.attachments.map((a, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-primary-foreground/20 rounded-full px-2 py-0.5 flex items-center gap-1"
                                  >
                                    {a.type.startsWith('image/')
                                      ? <ImageIcon className="w-3 h-3" />
                                      : <FileText className="w-3 h-3" />
                                    }
                                    {a.name.slice(0, 24)}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        ) : (
                          <MarkdownContent content={msg.content} />
                        )}

                        {/* Hover actions */}
                        <div
                          className={[
                            'flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity',
                            isUser ? 'justify-end' : 'justify-start',
                          ].join(' ')}
                        >
                          <button
                            onClick={() => copyMessage(msg.content, msg.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy"
                          >
                            {copiedId === msg.id
                              ? <Check className="w-3.5 h-3.5 text-green-400" />
                              : <Copy className="w-3.5 h-3.5" />
                            }
                          </button>

                          {!isUser && (
                            <>
                              <button
                                onClick={() => setFeedbackMap(p => ({ ...p, [msg.id]: 'up' }))}
                                className={`p-1.5 rounded-lg hover:bg-muted/50 transition-colors ${
                                  feedbackMap[msg.id] === 'up' ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFeedbackMap(p => ({ ...p, [msg.id]: 'down' }))}
                                className={`p-1.5 rounded-lg hover:bg-muted/50 transition-colors ${
                                  feedbackMap[msg.id] === 'down' ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Bad response"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isLastAssistant && (
                            <button
                              onClick={regenerate}
                              disabled={isTyping}
                              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                              title="Regenerate response"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick action chips */}
                      {isLastAssistant && quickActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {quickActions.map(a => (
                            <button
                              key={a.action}
                              onClick={() => handleQuickAction(a.action, lastAssistantMsg?.content || '')}
                              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors font-medium"
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <PhiloAvatar size="sm" />
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-muted-foreground">Philo is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── Input area ───────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-border bg-card">

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 text-xs max-w-[180px]"
                >
                  {a.preview ? (
                    <img src={a.preview} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <span className="text-foreground truncate">{a.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                    className="flex-shrink-0 ml-1"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2 bg-muted rounded-2xl px-3 py-2.5">
            {/* Attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Attach file or image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.md,.doc,.docx"
              multiple
              className="hidden"
              onChange={handleFileAttach}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Philo anything..."
              rows={1}
              disabled={isTyping}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-0.5 min-h-[24px] max-h-[160px] leading-relaxed"
            />

            {/* Voice */}
            <button
              onClick={handleVoice}
              className={[
                'p-1.5 rounded-lg transition-colors flex-shrink-0',
                isRecording
                  ? 'text-red-400 bg-red-400/10 animate-pulse'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && attachments.length === 0) || isTyping}
              className={[
                'p-2 rounded-xl flex-shrink-0 transition-all',
                (input.trim() || attachments.length > 0) && !isTyping
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed',
              ].join(' ')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[11px] text-muted-foreground/50">
              Philo can make mistakes. Use judgment for important decisions.
            </p>
            {charCount > 500 && (
              <span className={`text-[11px] font-mono ${charColor}`}>{charCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
