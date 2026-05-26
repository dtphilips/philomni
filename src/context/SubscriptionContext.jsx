import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { PLAN_LIMITS, UNLIMITED, normalisePlan } from '../lib/plans'

const SubscriptionContext = createContext(null)

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().slice(0, 10)   // "YYYY-MM-DD"
const monthISO  = () => new Date().toISOString().slice(0, 7)    // "YYYY-MM"

// ── Empty usage object (used before DB row loads) ─────────────────────────────
const EMPTY_USAGE = {
  ai_message_count:      0,
  image_gen_count:       0,
  job_application_count: 0,
  pitch_upload_count:    0,
  last_reset:            todayISO(),
}

export function SubscriptionProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id || null
  const plan   = normalisePlan(user?.plan)
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free

  const [usage,        setUsage]        = useState(null)
  const [loadingUsage, setLoadingUsage] = useState(true)

  // ── Load / reset usage row ──────────────────────────────────────────────────
  const loadUsage = useCallback(async () => {
    if (!userId) { setUsage(EMPTY_USAGE); setLoadingUsage(false); return }

    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[SubscriptionContext] loadUsage:', error.message)
    }

    const now      = todayISO()
    const nowMonth = monthISO()

    if (!data) {
      // First time — create the row
      const fresh = { ...EMPTY_USAGE, last_reset: now }
      const { data: created } = await supabase
        .from('ai_usage')
        .insert({ user_id: userId, ...fresh })
        .select('*')
        .single()
      setUsage(created || fresh)
    } else {
      const lastReset = data.last_reset || now
      const lastMonth = lastReset.slice(0, 7)
      const updates   = {}

      // Reset daily counters if the date changed
      if (lastReset !== now) {
        updates.ai_message_count = 0
        updates.image_gen_count  = 0
        updates.last_reset       = now
      }
      // Reset monthly counters if the month changed
      if (lastMonth !== nowMonth) {
        updates.job_application_count = 0
        updates.pitch_upload_count    = 0
      }

      if (Object.keys(updates).length > 0) {
        const merged = { ...data, ...updates }
        await supabase.from('ai_usage').update(updates).eq('user_id', userId)
        setUsage(merged)
      } else {
        setUsage(data)
      }
    }

    setLoadingUsage(false)
  }, [userId])

  useEffect(() => {
    if (authLoading) return
    loadUsage()
  }, [authLoading, loadUsage])

  // ── canUse — check if an action is within limits ───────────────────────────
  const canUse = useCallback((feature) => {
    if (!usage) return { allowed: true, reason: null } // optimistic while loading

    const ok = (count, limit, dailyOrMonthly, upgradeText) => {
      if (limit === UNLIMITED) return { allowed: true, reason: null }
      if (count >= limit) {
        return {
          allowed: false,
          reason: upgradeText,
          isLimitError: true,
        }
      }
      return { allowed: true, reason: null }
    }

    switch (feature) {
      case 'ai_message':
        return ok(
          usage.ai_message_count || 0,
          limits.ai_messages_per_day,
          'daily',
          plan === 'free'
            ? `You've used your ${limits.ai_messages_per_day} daily AI messages. Upgrade to Pro for 200 messages/day and image generation.`
            : plan === 'pro'
            ? `You've used your ${limits.ai_messages_per_day} daily AI messages. Upgrade to Pro Max for unlimited messages.`
            : 'Daily AI message limit reached.',
        )

      case 'image_gen': {
        const limit = limits.image_gen_per_day
        if (limit === 0) {
          return {
            allowed: false,
            reason: 'Image generation is a Pro feature. Upgrade to Pro for 10 images/day.',
            isLimitError: true,
          }
        }
        return ok(
          usage.image_gen_count || 0,
          limit,
          'daily',
          plan === 'pro'
            ? `You've used your ${limit} daily image generations. Upgrade to Pro Max for unlimited generation.`
            : 'Daily image generation limit reached.',
        )
      }

      case 'job_application':
        return ok(
          usage.job_application_count || 0,
          limits.job_applications_per_month,
          'monthly',
          `You've used your ${limits.job_applications_per_month} monthly job applications. Upgrade to Pro for unlimited applications.`,
        )

      case 'pitch_upload':
        return ok(
          usage.pitch_upload_count || 0,
          limits.pitch_uploads_per_month,
          'monthly',
          `You've used your ${limits.pitch_uploads_per_month} monthly pitch upload. Upgrade to Pro for unlimited uploads.`,
        )

      default:
        return { allowed: true, reason: null }
    }
  }, [usage, limits, plan])

  // ── incrementUsage — call AFTER a successful action ────────────────────────
  const incrementUsage = useCallback(async (feature) => {
    if (!userId || !usage) return

    const field = {
      ai_message:      'ai_message_count',
      image_gen:        'image_gen_count',
      job_application: 'job_application_count',
      pitch_upload:    'pitch_upload_count',
    }[feature]
    if (!field) return

    const newVal = (usage[field] || 0) + 1
    setUsage(prev => ({ ...prev, [field]: newVal }))
    await supabase.from('ai_usage').update({ [field]: newVal }).eq('user_id', userId)
  }, [userId, usage])

  // ── Computed display helpers ────────────────────────────────────────────────
  const usageDisplay = usage ? {
    aiMessages: {
      used:  usage.ai_message_count || 0,
      limit: limits.ai_messages_per_day === UNLIMITED ? '∞' : limits.ai_messages_per_day,
      pct:   limits.ai_messages_per_day === UNLIMITED
        ? 0
        : Math.min(100, Math.round(((usage.ai_message_count || 0) / limits.ai_messages_per_day) * 100)),
    },
    imageGen: {
      used:  usage.image_gen_count || 0,
      limit: limits.image_gen_per_day === UNLIMITED ? '∞' : limits.image_gen_per_day,
      pct:   limits.image_gen_per_day === UNLIMITED || limits.image_gen_per_day === 0
        ? 0
        : Math.min(100, Math.round(((usage.image_gen_count || 0) / limits.image_gen_per_day) * 100)),
    },
    jobApplications: {
      used:  usage.job_application_count || 0,
      limit: limits.job_applications_per_month === UNLIMITED ? '∞' : limits.job_applications_per_month,
    },
    pitchUploads: {
      used:  usage.pitch_upload_count || 0,
      limit: limits.pitch_uploads_per_month === UNLIMITED ? '∞' : limits.pitch_uploads_per_month,
    },
    resetDate: usage.last_reset,
  } : null

  return (
    <SubscriptionContext.Provider value={{
      plan,
      limits,
      usage,
      usageDisplay,
      loadingUsage,
      canUse,
      incrementUsage,
      refreshUsage: loadUsage,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
