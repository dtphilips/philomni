import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Heart, MessageCircle, Share2, Image, Send, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function Avatar({ user, size = 10 }) {
  const cls = `w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0 overflow-hidden`
  return (
    <div className={cls}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        : <span className="text-sm">{user?.full_name?.[0] ?? '?'}</span>}
    </div>
  )
}

function PostCard({ post, currentUser, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isOwner = currentUser?.id === post.author_id

  const handleLike = async () => {
    const next = !liked
    setLiked(next)
    setLikeCount(c => c + (next ? 1 : -1))
    await supabase
      .from('posts')
      .update({ like_count: likeCount + (next ? 1 : -1) })
      .eq('id', post.id)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data ?? [])
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(v => !v)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    const { data } = await supabase.from('comments').insert({
      post_id: post.id,
      author_id: currentUser.id,
      author_name: currentUser.full_name,
      author_avatar: currentUser.avatar_url || null,
      content: commentText.trim(),
    }).select().single()
    if (data) {
      setComments(c => [...c, data])
      setCommentText('')
      await supabase.from('posts').update({ comment_count: (post.comment_count ?? 0) + 1 }).eq('id', post.id)
    }
    setSubmittingComment(false)
  }

  const handleDelete = async () => {
    await supabase.from('posts').delete().eq('id', post.id)
    onDelete(post.id)
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar user={{ full_name: post.author_name, avatar_url: post.author_avatar }} />
          <div>
            <p className="text-sm font-semibold text-foreground">{post.author_name ?? 'Creator'}</p>
            <p className="text-xs text-muted-foreground">
              {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-popover border border-border rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => { setShowMenu(false); handleDelete() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className={`${post.media_urls.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
          {post.media_urls.map((url, i) => (
            post.media_type === 'video'
              ? <video key={i} src={url} controls className="w-full max-h-96 object-cover bg-black" />
              : <img key={i} src={url} alt="" className="w-full max-h-96 object-cover" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            liked ? 'text-pink-500 bg-pink-500/10' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          {likeCount > 0 && likeCount}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          {post.comment_count > 0 && post.comment_count}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar user={{ full_name: c.author_name, avatar_url: c.author_avatar }} size={7} />
              <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground mb-0.5">{c.author_name}</p>
                <p className="text-sm text-foreground">{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <Avatar user={currentUser} size={7} />
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function CreatePost({ user, onCreated }) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    setError('')
    console.log('=== POST SUBMIT STARTED ===')
    console.log('User:', user)
    console.log('User id:', user?.id)

    const payload = {
      content: content.trim(),
      author_id: user.id,
      author_name: user.full_name ?? user.email,
      author_avatar: user.avatar_url ?? null,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      visibility: 'public',
    }
    console.log('=== CALLING SUPABASE INSERT ===')
    console.log('Payload:', JSON.stringify(payload))

    const { data, error: err } = await supabase.from('posts').insert(payload).select().single()
    if (err) {
      console.error('=== POST CREATE ERROR ===', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(err.message)
    } else {
      setContent('')
      onCreated(data)
    }
    setPosting(false)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <Avatar user={user} />
        <form onSubmit={handlePost} className="flex-1 flex flex-col gap-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user?.full_name?.split(' ')[0] ?? 'Creator'}?`}
            rows={content.length > 80 ? 4 : 2}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Image className="w-4 h-4" />
              Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" />
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="px-5 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPosts = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (err) setError(err.message)
    else setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadPosts() }, [])

  const handleCreated = (post) => setPosts(prev => [post, ...prev])
  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Feed</h1>

      <CreatePost user={user} onCreated={handleCreated} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No posts yet</p>
          <p className="text-sm">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
