import { supabase } from './supabase'

// ─── Canonical count columns ──────────────────────────────────────────────────
// The posts table historically carried duplicate count columns (likes_count vs
// like_count, etc.). A DB trigger now keeps each twin in sync, and ALL app code
// should read/write the canonical `*s_count` columns through these helpers so
// there is a single source of truth for every count mutation.

/**
 * Atomically read-then-increment a numeric column on a post.
 * Returns the new value (clamped to >= 0).
 */
export const incrementCount = async (postId, column, amount = 1) => {
  const { data: post } = await supabase
    .from('posts')
    .select(column)
    .eq('id', postId)
    .single()

  const current = post?.[column] ?? 0
  const next = Math.max(0, current + amount)
  await supabase.from('posts').update({ [column]: next }).eq('id', postId)
  return next
}

/** Is this post currently liked by this user? */
export const checkLiked = async (postId, userId) => {
  if (!userId) return false
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

/**
 * Toggle a like for (postId, userId). Updates the likes table AND likes_count.
 * `currentCount` is the caller's optimistic count; returns the resolved state.
 */
export const toggleLike = async (postId, userId, currentlyLiked, currentCount) => {
  if (currentlyLiked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
    const count = await incrementCount(postId, 'likes_count', -1)
    return { liked: false, count }
  }
  // Guard against an existing row so we never double-count (likes has a
  // UNIQUE(post_id, user_id) constraint — a duplicate insert returns an error).
  const already = await checkLiked(postId, userId)
  if (already) return { liked: true, count: currentCount }

  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
  if (error) {
    // Unique violation = already liked elsewhere; reconcile state, don't bump count.
    return { liked: true, count: currentCount }
  }
  const count = await incrementCount(postId, 'likes_count', 1)
  return { liked: true, count }
}

/** Is this post currently saved by this user? */
export const checkSaved = async (postId, userId) => {
  if (!userId) return false
  const { data } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

/**
 * Toggle a save for (postId, userId). Updates saved_posts AND saves_count.
 */
export const toggleSave = async (postId, userId, currentlySaved) => {
  if (currentlySaved) {
    await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId)
    const count = await incrementCount(postId, 'saves_count', -1)
    return { saved: false, count }
  } else {
    await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId })
    const count = await incrementCount(postId, 'saves_count', 1)
    return { saved: true, count }
  }
}
