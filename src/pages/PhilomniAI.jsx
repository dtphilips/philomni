import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Send, Mic, MicOff, Paperclip, RefreshCw, Copy,
  ThumbsUp, ThumbsDown, Plus, MessageSquare, X,
  ChevronLeft, ChevronRight, ChevronDown, Check,
  FileText, Image as ImageIcon, Trash2, FolderPlus,
  Folder, FolderOpen, MoreHorizontal, GitBranch, Download,
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
      ? `- Skills: ${user.skills.join(', ')}` : '',
    user.bio ? `- Bio: ${user.bio}` : '',
    user.location ? `- Location: ${user.location}` : '',
  ].filter(Boolean)
  return PHILO_BASE_PROMPT + lines.join('\n')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanMsgsForStorage(msgs) {
  return msgs.map(m => ({
    ...m,
    attachments: (m.attachments || []).map(a => ({ name: a.name, type: a.type })),
  }))
}

function detectQuickActions(content) {
  const lower = content.toLowerCase()
  const actions = []
  if (lower.includes('caption') || lower.includes('post for') || lower.includes('social media'))
    actions.push({ label: '📋 Copy to Feed', action: 'feed' })
  if (lower.includes('pitch') || lower.includes('startup') || lower.includes('business idea'))
    actions.push({ label: '🚀 Pitch Vault', action: 'pitch-vault' })
  if (lower.includes('connect') || lower.includes('network') || lower.includes('smartmatch'))
    actions.push({ label: '✨ SmartMatch', action: 'match' })
  if (lower.includes('bio') || lower.includes('your profile') || lower.includes('update your'))
    actions.push({ label: '👤 Edit Profile', action: 'edit-profile' })
  return actions.slice(0, 3)
}

/**
 * Returns true when the user's message is asking Philo to generate an image.
 * Requires both an action verb AND an image-type noun to avoid false positives
 * (e.g. "create a post" should NOT trigger image generation).
 */
function detectImageIntent(text) {
  const lower = text.toLowerCase()
  const actionWords = [
    'generate', 'create', 'make', 'draw', 'design',
    'generate me', 'create me', 'make me', 'draw me', 'design me',
    'can you generate', 'can you create', 'can you make', 'can you draw', 'can you design',
    'please generate', 'please create', 'please make', 'please draw',
  ]
  const imageWords = [
    'image', 'photo', 'picture', 'logo', 'banner',
    'illustration', 'artwork', 'portrait', 'poster', 'thumbnail',
    'graphic', 'visual', 'icon',
  ]
  const hasAction = actionWords.some(w => lower.includes(w))
  const hasImageWord = imageWords.some(w => lower.includes(w))
  return hasAction && hasImageWord
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PhiloAvatar({ size = 'md' }) {
  const s = { sm: 'w-8 h-8 text-base', md: 'w-9 h-9 text-lg', lg: 'w-16 h-16 text-3xl' }[size]
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-md`}>
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
          if (inline) return <code className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>{children}</code>
          return (
            <pre className="bg-muted rounded-lg p-3 overflow-x-auto mt-2 mb-2">
              <code className="text-xs font-mono text-foreground" {...props}>{children}</code>
            </pre>
          )
        },
        p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p> },
        ul({ children }) { return <ul className="list-disc pl-5 mb-2 space-y-1 text-sm">{children}</ul> },
        ol({ children }) { return <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm">{children}</ol> },
        li({ children }) { return <li className="text-sm leading-relaxed">{children}</li> },
        strong({ children }) { return <strong className="font-semibold text-foreground">{children}</strong> },
        h1({ children }) { return <h1 className="text-base font-bold mb-2 text-foreground">{children}</h1> },
        h2({ children }) { return <h2 className="text-sm font-bold mb-2 text-foreground">{children}</h2> },
        h3({ children }) { return <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3> },
        blockquote({ children }) {
          return <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">{children}</blockquote>
        },
        a({ children, href }) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">{children}</a>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PhilomniAI() {
  const { user, loading: authLoading } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()

  // Derive a stable primitive so useCallback / useEffect deps don't thrash.
  // The full `user` object is recreated on every AuthContext render (spread),
  // but user?.id is a plain string — React's Object.is comparison stays stable.
  const userId = user?.id || null

  // ── Core chat state ────────────────────────────────────────────────────────
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

  // ── Feature state ──────────────────────────────────────────────────────────
  const [folders, setFolders] = useState([])
  const [collapsedFolders, setCollapsedFolders] = useState(new Set())
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)   // conv awaiting delete
  const [folderMenuConvId, setFolderMenuConvId] = useState(null) // conv showing folder picker
  const [folderError, setFolderError] = useState('')             // folder create error message
  const [draggingConvId, setDraggingConvId] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)     // folder id or 'unfiled'
  const [msgMenuId, setMsgMenuId] = useState(null)               // message id showing "..." menu
  const [branchingIdx, setBranchingIdx] = useState(null)         // message index being branched

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const saveTimerRef = useRef(null)
  const convIdRef = useRef(null)
  const folderMenuRef = useRef(null)
  const msgMenuRef = useRef(null)
  const newFolderInputRef = useRef(null)

  // Keep ref in sync with state so async callbacks always have latest convId
  useEffect(() => { convIdRef.current = currentConvId }, [currentConvId])

  // Close folder picker when clicking outside
  useEffect(() => {
    if (!folderMenuConvId) return
    const handler = e => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target))
        setFolderMenuConvId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [folderMenuConvId])

  // Close message "..." menu when clicking outside
  useEffect(() => {
    if (!msgMenuId) return
    const handler = e => {
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target))
        setMsgMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [msgMenuId])

  // Focus new folder input when it appears
  useEffect(() => {
    if (creatingFolder) setTimeout(() => newFolderInputRef.current?.focus(), 50)
  }, [creatingFolder])

  // ── Scroll + textarea resize ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // ── Load folders ───────────────────────────────────────────────────────────
  const loadFolders = useCallback(async () => {
    if (!userId) return
    console.log('[PhilomniAI] loadFolders → userId:', userId)
    const { data, error } = await supabase
      .from('ai_folders')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at')
    if (error) {
      console.error('[PhilomniAI] loadFolders error:', error.message, error.code)
      return
    }
    console.log('[PhilomniAI] loadFolders got', data?.length ?? 0, 'folders')
    setFolders(data || [])
  }, [userId])

  // ── Load conversation list (includes all fields) ──────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) return
    console.log('[PhilomniAI] loadConversations → userId:', userId)
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(60)
    if (error) {
      console.error('[PhilomniAI] loadConversations error:', error.message, error.code)
      return
    }
    console.log('[PhilomniAI] loadConversations got', data?.length ?? 0, 'conversations')
    setConversations(data || [])
  }, [userId])

  // Fire on every mount once auth is confirmed (authLoading = false).
  // Calls Supabase directly — does NOT rely on local state — so a page
  // refresh always re-fetches fresh data from the database.
  useEffect(() => {
    if (authLoading || !userId) {
      console.log('[PhilomniAI] init effect: waiting for auth… authLoading:', authLoading, 'userId:', userId)
      return
    }
    console.log('[PhilomniAI] init effect: auth confirmed, userId →', userId)

    const init = async () => {
      // BUG 1 FIX: always fetch directly from Supabase on every mount/refresh
      console.log('[PhilomniAI] init: fetching conversations from Supabase...')
      const { data: convData, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (convError) {
        console.error('[PhilomniAI] init conversations fetch error:', convError.message, convError.code)
      } else {
        console.log('[PhilomniAI] init: loaded', convData?.length ?? 0, 'conversations')
        setConversations(convData || [])
      }

      console.log('[PhilomniAI] init: fetching folders from Supabase...')
      const { data: folderData, error: folderError } = await supabase
        .from('ai_folders')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at')
      if (folderError) {
        console.error('[PhilomniAI] init folders fetch error:', folderError.message, folderError.code)
      } else {
        console.log('[PhilomniAI] init: loaded', folderData?.length ?? 0, 'folders')
        setFolders(folderData || [])
      }

      // Restore the last open conversation across page refreshes
      const savedId = localStorage.getItem('philo_last_conv_id')
      if (savedId) {
        console.log('[PhilomniAI] init: restoring conversation from localStorage:', savedId)
        loadConversation(savedId)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading])

  // ── Load a saved conversation ──────────────────────────────────────────────
  const loadConversation = useCallback(async (id) => {
    console.log('[PhilomniAI] loadConversation → id:', id)
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('id', id)
      .single()
    if (error) {
      console.error('[PhilomniAI] loadConversation error:', error.message, error.code)
      // If the saved id no longer exists (was deleted), clear it
      if (error.code === 'PGRST116') localStorage.removeItem('philo_last_conv_id')
      return
    }
    if (data?.messages) {
      console.log('[PhilomniAI] loadConversation: loaded', data.messages.length, 'messages')
      setMessages(data.messages)
      setCurrentConvId(id)
      convIdRef.current = id
      setAttachments([])
      setMobileSidebarOpen(false)
    }
  }, [])

  // Persist last-open conversation ID so page refresh restores it
  useEffect(() => {
    if (currentConvId) {
      localStorage.setItem('philo_last_conv_id', currentConvId)
    }
  }, [currentConvId])

  // ── Persist conversation to Supabase ───────────────────────────────────────
  // Defined BEFORE startNewChat so startNewChat can depend on it.
  const saveConversation = useCallback(async (msgs) => {
    if (!userId || msgs.length === 0) return
    const convId = convIdRef.current
    const safe = cleanMsgsForStorage(msgs)
    const title = (msgs[0]?.content || 'Chat').toString().slice(0, 60)
    console.log('[PhilomniAI] saveConversation → convId:', convId, 'msgs:', msgs.length)

    if (convId) {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ messages: safe, updated_at: new Date().toISOString() })
        .eq('id', convId)
      if (error) {
        console.error('[PhilomniAI] update error:', error.message, error.code)
        return
      }
      console.log('[PhilomniAI] saveConversation: updated row', convId)
    } else {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title, messages: safe })
        .select('id')
        .single()
      if (error) {
        console.error('[PhilomniAI] insert error:', error.message, error.code)
        return
      }
      if (data?.id) {
        console.log('[PhilomniAI] saveConversation: inserted new row', data.id)
        setCurrentConvId(data.id)
        convIdRef.current = data.id
      }
    }
    loadConversations()
  }, [userId, loadConversations])

  // ── Start a new chat ───────────────────────────────────────────────────────
  // BUG 2 FIX: save current conversation to Supabase BEFORE clearing the chat
  // so the previous chat still appears in the sidebar after clicking New Chat.
  // Pass shouldSave=false when called from deleteConversation (conv already gone).
  const startNewChat = useCallback(async (shouldSave = true) => {
    console.log('[PhilomniAI] startNewChat → shouldSave:', shouldSave)
    const currentMsgs = messagesRef.current
    if (shouldSave && currentMsgs.length > 0 && userId) {
      console.log('[PhilomniAI] startNewChat: saving', currentMsgs.length, 'messages before clearing')
      await saveConversation(currentMsgs)
    }
    setMessages([])
    setCurrentConvId(null)
    convIdRef.current = null
    setInput('')
    setAttachments([])
    setMobileSidebarOpen(false)
    localStorage.removeItem('philo_last_conv_id')
  }, [userId, saveConversation])

  // ── DELETE conversation ────────────────────────────────────────────────────
  const deleteConversation = useCallback(async (id) => {
    console.log('[PhilomniAI] deleteConversation → id:', id)
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('[PhilomniAI] delete error:', error.message, error.code)
      return
    }
    // Remove from local list immediately (optimistic)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (convIdRef.current === id) {
      localStorage.removeItem('philo_last_conv_id')
      startNewChat(false)  // don't save — conversation was just deleted
    }
    setDeleteConfirmId(null)
    console.log('[PhilomniAI] deleteConversation: done')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CREATE folder ──────────────────────────────────────────────────────────
  // BUG 3 FIX: validate name, show UI error on failure, add to state on success.
  // NOTE: If folder creation silently fails even with this code, run in Supabase:
  //   CREATE TABLE IF NOT EXISTS ai_folders (
  //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  //     user_id UUID REFERENCES users(id),
  //     name TEXT NOT NULL,
  //     created_at TIMESTAMPTZ DEFAULT NOW()
  //   );
  //   ALTER TABLE ai_folders DISABLE ROW LEVEL SECURITY;
  const createFolder = useCallback(async () => {
    const name = newFolderName.trim()
    console.log('[PhilomniAI] createFolder called → name:', JSON.stringify(name), 'userId:', userId)

    if (!name) {
      console.warn('[PhilomniAI] createFolder: empty name, aborting')
      setFolderError('Please enter a folder name')
      return
    }
    if (!userId) {
      console.warn('[PhilomniAI] createFolder: no userId, aborting')
      setFolderError('Not logged in — please refresh')
      return
    }

    setFolderError('')
    console.log('[PhilomniAI] createFolder: inserting into ai_folders...')
    const { data, error } = await supabase
      .from('ai_folders')
      .insert({ user_id: userId, name })
      .select('id, name')
      .single()

    if (error) {
      console.error('[PhilomniAI] createFolder error:', error.message, error.code, error.details, error.hint)
      setFolderError(error.message || 'Failed to create folder — check console')
      return
    }
    console.log('[PhilomniAI] createFolder success:', data)
    if (data) setFolders(prev => [...prev, data])
    setNewFolderName('')
    setFolderError('')
    setCreatingFolder(false)
  }, [userId, newFolderName])

  // ── DELETE folder (moves its conversations to unfiled) ─────────────────────
  const deleteFolder = useCallback(async (folderId) => {
    console.log('[PhilomniAI] deleteFolder → folderId:', folderId)
    // Move all conversations in this folder to unfiled first
    const { error: moveErr } = await supabase
      .from('ai_conversations')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
    if (moveErr) console.error('[PhilomniAI] deleteFolder move error:', moveErr.message)

    const { error } = await supabase
      .from('ai_folders')
      .delete()
      .eq('id', folderId)
    if (error) {
      console.error('[PhilomniAI] deleteFolder error:', error.message)
      return
    }
    setFolders(prev => prev.filter(f => f.id !== folderId))
    setConversations(prev =>
      prev.map(c => c.folder_id === folderId ? { ...c, folder_id: null } : c)
    )
  }, [])

  // ── MOVE conversation to folder ────────────────────────────────────────────
  const moveToFolder = useCallback(async (convId, folderId) => {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ folder_id: folderId })
      .eq('id', convId)
    if (error) {
      console.error('[PhilomniAI] moveToFolder error:', error.message)
      return
    }
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, folder_id: folderId } : c)
    )
    setFolderMenuConvId(null)
  }, [])

  // Keep live refs so branchChat always reads latest values without
  // needing messages/conversations as useCallback deps (avoids stale closures).
  const messagesRef = useRef(messages)
  const conversationsRef = useRef(conversations)
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  // ── BRANCH chat from a message index ──────────────────────────────────────
  const branchChat = useCallback(async (upToIdx) => {
    console.log('[PhilomniAI] branchChat called → upToIdx:', upToIdx, 'userId:', userId)
    if (!userId) { console.warn('[PhilomniAI] branchChat: no userId'); return }

    const currentMsgs = messagesRef.current
    const currentConvs = conversationsRef.current

    setBranchingIdx(upToIdx)
    const branchMsgs = currentMsgs.slice(0, upToIdx + 1)
    console.log('[PhilomniAI] branchChat: slicing', branchMsgs.length, 'messages from', currentMsgs.length, 'total')

    // FIX 2: Use actual conversation title — prefer sidebar entry, fall back to
    // the first user message content (same source saveConversation uses for titles).
    // This prevents "Branch: Chat" when the conv isn't yet in conversationsRef.
    const originConv = currentConvs.find(c => c.id === convIdRef.current)
    console.log('[PhilomniAI] branchChat: originConv from ref:', originConv)
    const originTitle = originConv?.title
      || (currentMsgs.find(m => m.role === 'user')?.content || 'Chat').toString().slice(0, 60)
    const title = `Branch: ${originTitle.slice(0, 45)}`
    console.log('[PhilomniAI] branchChat: title =', title, '(from conv entry:', !!originConv, ')')

    const safe = cleanMsgsForStorage(branchMsgs)
    console.log('[PhilomniAI] branchChat: inserting new conversation...')

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: userId, title, messages: safe })
      .select('id')
      .single()

    setBranchingIdx(null)
    setMsgMenuId(null)

    if (error) {
      console.error('[PhilomniAI] branchChat insert error:', error.message, error.code, error.details)
      return
    }
    console.log('[PhilomniAI] branchChat: new conversation created →', data?.id)
    if (data?.id) {
      setMessages(branchMsgs)
      setCurrentConvId(data.id)
      convIdRef.current = data.id
      loadConversations()
    }
  }, [userId, loadConversations])

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText.trim() : input.trim()
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
      // ── Image generation path ──────────────────────────────────────────────
      // Intercept before the LLM call when the user is asking to generate an image.
      if (text && detectImageIntent(text)) {
        console.log('[PhilomniAI] image intent detected → calling /api/image')
        const imgRes = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        })
        const imgData = await imgRes.json()
        console.log('[PhilomniAI] /api/image response:', imgData.imageUrl ? '✓ got URL' : imgData.error)

        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          timestamp: new Date().toISOString(),
          ...(imgData.imageUrl
            ? {
                content: "Here's your generated image! ✨",
                imageUrl: imgData.imageUrl,
                imagePrompt: text,
              }
            : {
                content: `I had trouble generating that image. ${imgData.error || 'Please try again.'}`,
              }
          ),
        }
        const finalMessages = [...newMessages, assistantMsg]
        setMessages(finalMessages)
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveConversation(finalMessages), 1200)
        return  // skip LLM call entirely
      }

      // ── Normal LLM path ────────────────────────────────────────────────────
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

      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveConversation(finalMessages), 1200)
    } catch (err) {
      console.error('[PhilomniAI] sendMessage:', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I ran into an issue connecting. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setIsTyping(false)
    }
  }, [input, attachments, messages, user, mode, saveConversation])

  // ── Regenerate ─────────────────────────────────────────────────────────────
  const regenerate = useCallback(async () => {
    const lastAssistantIdx = messages.map(m => m.role).lastIndexOf('assistant')
    if (lastAssistantIdx < 1) return
    const withoutLast = messages.slice(0, lastAssistantIdx)
    const lastUser = [...withoutLast].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(withoutLast)
    await sendMessage(lastUser.content)
  }, [messages, sendMessage])

  // ── Copy / voice / file ────────────────────────────────────────────────────
  const copyMessage = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard not available */ }
  }

  const handleFileAttach = async (e) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = await Promise.all(
      files.slice(0, 3).map(file => new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          resolve({ name: file.name, type: file.type, base64, preview: file.type.startsWith('image/') ? reader.result : null })
        }
        reader.readAsDataURL(file)
      }))
    )
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 3))
    e.target.value = ''
  }

  const handleVoice = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return }
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) { alert('Voice input is not supported in this browser.'); return }
      const recognition = new SR()
      recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US'
      recognition.onresult = e => { setInput(prev => prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript); setIsRecording(false) }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)
      recognitionRef.current = recognition
      recognition.start(); setIsRecording(true)
    } catch { setIsRecording(false) }
  }

  const handleQuickAction = (action, content) => {
    if (action === 'feed') navigate('/?compose=' + encodeURIComponent(content.slice(0, 300)))
    else navigate('/' + action)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Drag & drop helpers ────────────────────────────────────────────────────
  const handleDragStart = (e, convId) => {
    setDraggingConvId(convId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragEnd = () => { setDraggingConvId(null); setDragOverTarget(null) }
  const handleDragOver = (e, targetId) => { e.preventDefault(); setDragOverTarget(targetId) }
  const handleDrop = (e, targetFolderId) => {
    e.preventDefault()
    if (draggingConvId) moveToFolder(draggingConvId, targetFolderId)
    setDraggingConvId(null); setDragOverTarget(null)
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const charCount = input.length
  const charColor = charCount > 2000 ? 'text-destructive' : charCount > 1500 ? 'text-amber-400' : 'text-muted-foreground'
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const filedConvIds = new Set(conversations.filter(c => c.folder_id).map(c => c.id))
  const unfiledConvs = conversations.filter(c => !c.folder_id)

  // ── Conversation row renderer (used in sidebar) ────────────────────────────
  const renderConvRow = (conv) => {
    const isActive = currentConvId === conv.id
    const isPendingDelete = deleteConfirmId === conv.id
    const isFolderMenuOpen = folderMenuConvId === conv.id

    if (isPendingDelete) {
      return (
        <div key={conv.id} className="mx-1 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-xs text-destructive font-medium mb-2">Delete this chat?</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => deleteConversation(conv.id)}
              className="flex-1 text-xs px-2 py-1 rounded bg-destructive text-white hover:bg-destructive/90 transition-colors font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={conv.id}
        draggable
        onDragStart={e => handleDragStart(e, conv.id)}
        onDragEnd={handleDragEnd}
        className={[
          'group relative mx-1 rounded-lg transition-colors cursor-grab active:cursor-grabbing',
          isActive ? 'bg-primary/15' : 'hover:bg-muted',
          draggingConvId === conv.id ? 'opacity-40' : '',
        ].join(' ')}
      >
        {/* Main clickable area */}
        <button
          onClick={() => loadConversation(conv.id)}
          className="w-full text-left px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 pr-12">
            <MessageSquare className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`truncate text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {conv.title || 'Chat'}
            </span>
          </div>
          <span className="text-[10px] opacity-40 pl-4">
            {new Date(conv.updated_at).toLocaleDateString()}
          </span>
        </button>

        {/* Hover action buttons */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
          {/* Folder picker */}
          <div className="relative" ref={isFolderMenuOpen ? folderMenuRef : null}>
            <button
              onClick={e => { e.stopPropagation(); setFolderMenuConvId(isFolderMenuOpen ? null : conv.id) }}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Move to folder"
            >
              <Folder className="w-3 h-3" />
            </button>
            {isFolderMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]">
                {folders.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-2">No folders yet</p>
                )}
                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => moveToFolder(conv.id, f.id)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                  >
                    <Folder className="w-3 h-3 text-primary" />
                    <span className="truncate">{f.name}</span>
                    {conv.folder_id === f.id && <Check className="w-3 h-3 text-primary ml-auto flex-shrink-0" />}
                  </button>
                ))}
                {conv.folder_id && (
                  <>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => moveToFolder(conv.id, null)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-muted-foreground transition-colors"
                    >
                      Remove from folder
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); setDeleteConfirmId(conv.id); setFolderMenuConvId(null) }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            title="Delete chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-background">

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={[
        'flex flex-col border-r border-border bg-card flex-shrink-0 transition-all duration-300',
        mobileSidebarOpen ? 'fixed inset-y-0 left-0 w-64 z-40 shadow-2xl' : 'w-0 overflow-hidden',
        'lg:relative lg:w-56 lg:overflow-visible lg:shadow-none lg:block',
      ].join(' ')}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <PhiloAvatar size="sm" />
            <span className="font-bold text-foreground text-sm">Philo</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons: New Chat + New Folder */}
        <div className="px-3 py-2.5 flex gap-2 flex-shrink-0 border-b border-border/60">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
          <button
            onClick={() => { setCreatingFolder(true); setNewFolderName('') }}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable conversation + folder list */}
        <div className="flex-1 overflow-y-auto py-2">

          {/* New folder creation input */}
          {creatingFolder && (
            <div className="mx-2 mb-2 p-2 rounded-xl border border-primary/40 bg-primary/5">
              <input
                ref={newFolderInputRef}
                type="text"
                value={newFolderName}
                onChange={e => { setNewFolderName(e.target.value); setFolderError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); setFolderError('') }
                }}
                placeholder="Folder name..."
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none mb-2"
              />
              {/* BUG 3 FIX: show error message in UI */}
              {folderError && (
                <p className="text-[10px] text-destructive mb-1.5 leading-tight">{folderError}</p>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 text-xs py-1 px-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => { setCreatingFolder(false); setNewFolderName(''); setFolderError('') }}
                  className="text-xs py-1 px-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Folders */}
          {folders.map(folder => {
            const folderConvs = conversations.filter(c => c.folder_id === folder.id)
            const isCollapsed = collapsedFolders.has(folder.id)
            const isDragTarget = dragOverTarget === folder.id

            return (
              <div
                key={folder.id}
                onDragOver={e => handleDragOver(e, folder.id)}
                onDrop={e => handleDrop(e, folder.id)}
                onDragLeave={() => setDragOverTarget(null)}
                className={`mb-1 rounded-lg mx-1 transition-colors ${isDragTarget ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
              >
                {/* Folder header */}
                <div className="group flex items-center gap-1 px-2 py-1.5">
                  <button
                    onClick={() => setCollapsedFolders(prev => {
                      const next = new Set(prev)
                      if (next.has(folder.id)) next.delete(folder.id)
                      else next.add(folder.id)
                      return next
                    })}
                    className="flex-1 flex items-center gap-1.5 text-left"
                  >
                    {isCollapsed
                      ? <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    }
                    {isCollapsed
                      ? <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      : <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    }
                    <span className="text-xs font-semibold text-foreground truncate">{folder.name}</span>
                    {folderConvs.length > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                        {folderConvs.length}
                      </span>
                    )}
                  </button>
                  {/* Delete folder button */}
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Folder conversations */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pb-1 pl-2">
                    {folderConvs.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/50 px-3 py-1">
                        Drop chats here
                      </p>
                    ) : (
                      folderConvs.map(renderConvRow)
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Unfiled conversations */}
          {unfiledConvs.length > 0 && (
            <div
              onDragOver={e => handleDragOver(e, 'unfiled')}
              onDrop={e => handleDrop(e, null)}
              onDragLeave={() => setDragOverTarget(null)}
              className={`space-y-0.5 rounded-lg transition-colors ${dragOverTarget === 'unfiled' ? 'bg-primary/10 ring-1 ring-primary/30 mx-1 p-1' : ''}`}
            >
              {folders.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-4 py-1">
                  Other
                </p>
              )}
              {unfiledConvs.map(renderConvRow)}
            </div>
          )}

          {/* Empty state */}
          {conversations.length === 0 && !creatingFolder && (
            <p className="text-xs text-muted-foreground text-center py-6 px-4">
              Your conversations will appear here
            </p>
          )}
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground">
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
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center min-h-full text-center py-8 px-4">
              <PhiloAvatar size="lg" />
              <h1 className="mt-6 text-2xl font-bold text-foreground">Hi, I&apos;m Philo ✨</h1>
              <p className="text-muted-foreground mt-1 text-sm">Your AI assistant on Philomni</p>
              <p className="text-sm text-muted-foreground mt-1 mb-8">I can help you create, grow, connect, and succeed.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.map(qp => (
                  <button
                    key={qp.title}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/40 text-left transition-all group"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{qp.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{qp.title}</p>
                      <p className="text-xs text-muted-foreground">{qp.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                const isLastMsg = idx === messages.length - 1
                const isLastAssistant = !isUser && isLastMsg
                const quickActions = isLastAssistant ? detectQuickActions(msg.content) : []
                const isThisMsgMenuOpen = msgMenuId === msg.id
                const isBranching = branchingIdx === idx

                return (
                  <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
                      <div className={[
                        'group relative rounded-2xl px-4 py-3 text-sm',
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-card border border-border text-foreground rounded-tl-none',
                      ].join(' ')}>

                        {/* Content */}
                        {isUser ? (
                          <div>
                            {msg.attachments?.length > 0 && (
                              <div className="flex gap-1.5 mb-2 flex-wrap">
                                {msg.attachments.map((a, i) => (
                                  <span key={i} className="text-xs bg-primary-foreground/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    {a.type?.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {a.name.slice(0, 24)}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        ) : (
                          <>
                            <MarkdownContent content={msg.content} />
                            {/* Generated image — persisted in messages JSONB via imageUrl field */}
                            {msg.imageUrl && (
                              <div className="mt-3 space-y-2">
                                <img
                                  src={msg.imageUrl}
                                  alt={msg.imagePrompt || 'Generated image'}
                                  className="rounded-xl w-full max-w-sm object-cover border border-border"
                                  onError={e => { e.currentTarget.style.display = 'none' }}
                                />
                                <a
                                  href={msg.imageUrl}
                                  download={`philo-image-${msg.id}.jpg`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download image
                                </a>
                              </div>
                            )}
                          </>
                        )}

                        {/* Action bar — visible on hover, always rendered for branch/copy access */}
                        <div className={[
                          'flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                          isUser ? 'justify-end' : 'justify-start',
                        ].join(' ')}>
                          <button
                            onClick={() => copyMessage(msg.content, msg.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {!isUser && (
                            <>
                              <button
                                onClick={() => setFeedbackMap(p => ({ ...p, [msg.id]: 'up' }))}
                                className={`p-1.5 rounded-lg hover:bg-muted/50 transition-colors ${feedbackMap[msg.id] === 'up' ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Good response"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFeedbackMap(p => ({ ...p, [msg.id]: 'down' }))}
                                className={`p-1.5 rounded-lg hover:bg-muted/50 transition-colors ${feedbackMap[msg.id] === 'down' ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Bad response"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>

                              {/* "..." menu with Branch */}
                              <div className="relative" ref={isThisMsgMenuOpen ? msgMenuRef : null}>
                                <button
                                  onClick={() => setMsgMenuId(isThisMsgMenuOpen ? null : msg.id)}
                                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                  title="More options"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {isThisMsgMenuOpen && (
                                  <div className="absolute left-0 bottom-full mb-1 z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]">
                                    <button
                                      onClick={() => branchChat(idx)}
                                      disabled={isBranching}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                                    >
                                      <GitBranch className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                      {isBranching ? 'Branching...' : 'Branch from here'}
                                    </button>
                                  </div>
                                )}
                              </div>
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

          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 text-xs max-w-[180px]">
                  {a.preview
                    ? <img src={a.preview} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    : <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  }
                  <span className="text-foreground truncate">{a.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="flex-shrink-0 ml-1">
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-muted rounded-2xl px-3 py-2.5">
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Attach file or image">
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md,.doc,.docx" multiple className="hidden" onChange={handleFileAttach} />

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

            <button
              onClick={handleVoice}
              className={['p-1.5 rounded-lg transition-colors flex-shrink-0', isRecording ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-muted-foreground hover:text-foreground'].join(' ')}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && attachments.length === 0) || isTyping}
              className={['p-2 rounded-xl flex-shrink-0 transition-all', (input.trim() || attachments.length > 0) && !isTyping ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'].join(' ')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[11px] text-muted-foreground/50">Philo can make mistakes. Use judgment for important decisions.</p>
            {charCount > 500 && <span className={`text-[11px] font-mono ${charColor}`}>{charCount}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
