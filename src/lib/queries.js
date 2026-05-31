// ================================================
// PHILOMNI CENTRAL QUERY FILE
// All Supabase database queries live here.
// NEVER write inline Supabase queries in pages.
// Always add new queries to this file first.
// This prevents column name errors and
// broken queries after deployments.
// ================================================

import { supabase } from './supabase'

// ============================================
// POSTS / FEED
// ============================================
export const fetchFeedPosts = async (limit = 10, offset = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) console.error('fetchFeedPosts:', error)
  return data || []
}

export const fetchPostById = async (id) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) console.error('fetchPostById:', error)
  return data || null
}

export const createPost = async (postData) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single()

  if (error) console.error('createPost:', error)
  return { data, error }
}

// ============================================
// REELS - Videos only
// ============================================
export const fetchReels = async (limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('media_type', 'video')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchReels:', error)
  return data || []
}

// ============================================
// MUSIC TRACKS
// ============================================
export const fetchAllTracks = async (limit = 50) => {
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchAllTracks:', error)
  return data || []
}

export const fetchPhilomniOriginals = async () => {
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .eq('is_philomni_original', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('fetchPhilomniOriginals:', error)
  return data || []
}

export const fetchArtistTracks = async () => {
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .eq('track_type', 'artist_track')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('fetchArtistTracks:', error)
  return data || []
}

// ============================================
// USER PROFILE
// ============================================
export const fetchUserProfile = async (userId) => {
  if (!userId) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) console.error('fetchUserProfile:', error)
  return data || null
}

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) console.error('updateUserProfile:', error)
  return { data, error }
}

// ============================================
// NOTIFICATIONS
// ============================================
export const fetchNotifications = async (userId, limit = 20) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchNotifications:', error)
  return data || []
}

export const markNotificationRead = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) console.error('markNotificationRead:', error)
}

// ============================================
// MESSAGES
// ============================================
export const fetchConversations = async (userId) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) console.error('fetchConversations:', error)
  return data || []
}

// ============================================
// ROOMS
// ============================================
export const fetchRooms = async (limit = 20) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchRooms:', error)
  return data || []
}

// ============================================
// GROUPS
// ============================================
export const fetchGroups = async (limit = 20) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchGroups:', error)
  return data || []
}

export const fetchUserGroups = async (userId) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', userId)
    .limit(20)

  if (error) console.error('fetchUserGroups:', error)
  return data || []
}

// ============================================
// CELEBRATIONS
// ============================================
export const fetchCelebrations = async (limit = 20) => {
  const { data, error } = await supabase
    .from('celebrations')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchCelebrations:', error)
  return data || []
}

// ============================================
// LIVES
// ============================================
export const fetchActiveLives = async () => {
  const { data, error } = await supabase
    .from('lives')
    .select('*, users(id, full_name, avatar_url)')
    .eq('status', 'live')
    .order('viewer_count', { ascending: false })
    .limit(10)

  if (error) console.error('fetchActiveLives:', error)
  return data || []
}

// ============================================
// SPOTLIGHT
// ============================================
export const fetchActiveSpotlight = async () => {
  const { data, error } = await supabase
    .from('spotlight_winners')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchActiveSpotlight:', error)
  }
  return data || null
}

// ============================================
// ADS
// ============================================
export const fetchActiveAds = async (limit = 5) => {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'active')
    .limit(limit)

  if (error) console.error('fetchActiveAds:', error)
  return data || []
}

// ============================================
// WALLET
// ============================================
export const fetchUserWallet = async (userId) => {
  if (!userId) return null
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchUserWallet:', error)
  }
  return data || null
}

export const fetchWalletTransactions = async (walletId, limit = 20) => {
  if (!walletId) return []
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchWalletTransactions:', error)
  return data || []
}

// ============================================
// JOBS
// ============================================
export const fetchJobs = async (limit = 20) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchJobs:', error)
  return data || []
}

// ============================================
// MARKETPLACE / DIGITAL PRODUCTS
// ============================================
export const fetchDigitalProducts = async (limit = 20) => {
  const { data, error } = await supabase
    .from('digital_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchDigitalProducts:', error)
  return data || []
}

// ============================================
// COURSES
// ============================================
export const fetchCourses = async (limit = 20) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchCourses:', error)
  return data || []
}

// ============================================
// SKILL EXCHANGE
// ============================================
export const fetchSkillOffers = async (limit = 20) => {
  const { data, error } = await supabase
    .from('skill_offers')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchSkillOffers:', error)
  return data || []
}

// ============================================
// PITCH VAULT
// ============================================
export const fetchPitches = async (userId) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('pitches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) console.error('fetchPitches:', error)
  return data || []
}

// ============================================
// ANALYTICS
// ============================================
export const fetchUserAnalytics = async (userId) => {
  if (!userId) return null
  const { data, error } = await supabase
    .from('creator_metrics')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchUserAnalytics:', error)
  }
  return data || null
}

// ============================================
// GIFTS
// ============================================
export const fetchGiftCatalog = async () => {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .eq('is_active', true)
    .order('coin_value', { ascending: true })

  if (error) console.error('fetchGiftCatalog:', error)
  return data || []
}

export const fetchUserCoinBalance = async (userId) => {
  if (!userId) return 0
  const { data, error } = await supabase
    .from('users')
    .select('coin_balance')
    .eq('id', userId)
    .single()

  if (error) console.error('fetchUserCoinBalance:', error)
  return data?.coin_balance || 0
}
