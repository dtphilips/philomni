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
// Recompute likes_count from the actual (deduped, unique-constrained) likes rows
// — the source of truth — so the displayed count can never drift or double-count.
const recountLikes = async (postId) => {
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
  const n = count ?? 0
  await supabase.from('posts').update({ likes_count: n }).eq('id', postId)
  return n
}

export const toggleLike = async (postId, userId, currentlyLiked) => {
  if (currentlyLiked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
  } else {
    // upsert + ignoreDuplicates: a re-like (or a race) is a harmless no-op insert,
    // never an error — so liking always succeeds, every time, this session or next.
    await supabase.from('likes').upsert(
      { post_id: postId, user_id: userId },
      { onConflict: 'post_id,user_id', ignoreDuplicates: true },
    )
  }
  const count = await recountLikes(postId)
  return { liked: !currentlyLiked, count }
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
