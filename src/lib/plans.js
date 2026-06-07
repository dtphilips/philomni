/**
 * Philomni subscription plan definitions — single source of truth.
 *
 * Stripe Price IDs are read from environment variables.
 * Set these in your Vercel dashboard (or .env.local for dev):
 *   VITE_STRIPE_PRO_MONTHLY    → your pro monthly price ID
 *   VITE_STRIPE_PRO_ANNUAL     → your pro annual price ID
 *   VITE_STRIPE_PROMAX_MONTHLY → your pro max monthly price ID
 *   VITE_STRIPE_PROMAX_ANNUAL  → your pro max annual price ID
 */

/** Sentinel value — use for unlimited tiers */
export const UNLIMITED = Infinity

/** Stripe price IDs — env vars override the hardcoded live defaults */
export const PRICE_IDS = {
  pro_monthly:    import.meta.env.VITE_STRIPE_PRO_MONTHLY    || 'price_1TfgArDItBtYSeBAnwhjXUys',
  pro_annual:     import.meta.env.VITE_STRIPE_PRO_ANNUAL     || 'price_1TfgAtDItBtYSeBADZxoA7qs',
  promax_monthly: import.meta.env.VITE_STRIPE_PROMAX_MONTHLY || 'price_1TfgAuDItBtYSeBA0OZr6TZX',
  promax_annual:  import.meta.env.VITE_STRIPE_PROMAX_ANNUAL  || 'price_1TfgAvDItBtYSeBAV97KgIFN',
}

/** Usage limits per plan */
export const PLAN_LIMITS = {
  free: {
    ai_messages_per_day:          20,
    image_gen_per_day:             0,
    job_applications_per_month:    3,
    pitch_uploads_per_month:       1,
  },
  pro: {
    ai_messages_per_day:         200,
    image_gen_per_day:            10,
    job_applications_per_month: UNLIMITED,
    pitch_uploads_per_month:    UNLIMITED,
  },
  promax: {
    ai_messages_per_day:        UNLIMITED,
    image_gen_per_day:          UNLIMITED,
    job_applications_per_month: UNLIMITED,
    pitch_uploads_per_month:    UNLIMITED,
  },
}

/** Plan display metadata */
export const PLAN_META = {
  free: {
    key: 'free',
    name: 'Free',
    tagline: 'Get started on Philomni',
    price_monthly: 0,
    price_annual_mo: 0,
    annual_total: 0,
    badge: null,
    highlight: false,
    cta: 'Get Started',
    features: [
      'Access to feed, posts, messages & community',
      '3 job applications per month',
      '1 pitch vault upload per month',
      '20 Philo AI messages per day',
      'Browse Skill Exchange',
      'Basic profile only',
    ],
    not_included: [
      'Image generation',
      'Analytics',
      'Verified badge',
      'Philomni Rooms',
      'Priority SmartMatch',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'For serious creators & professionals',
    price_monthly: 29.99,
    price_annual_mo: 24.99,
    annual_total: 299,
    badge: 'Most Popular',
    highlight: true,
    cta: 'Upgrade to Pro',
    features: [
      'Everything in Free',
      'Unlimited job applications',
      'Unlimited pitch vault uploads',
      '200 Philo AI messages per day',
      '10 image generations per day',
      'Full post & profile analytics',
      'Eligible for verified badge',
      'Priority SmartMatch',
      'Philomni Rooms access',
      'Read receipts in messaging',
      'Early access to new features',
    ],
    not_included: [
      'Unlimited AI messages',
      'Unlimited image generation',
      'Video generation',
      'Voice AI responses',
      'Business API access',
    ],
  },
  promax: {
    key: 'promax',
    name: 'Pro Max',
    tagline: 'Unlimited power for creators & teams',
    price_monthly: 49.99,
    price_annual_mo: 39.99,
    annual_total: 479,
    badge: null,
    highlight: false,
    cta: 'Go Pro Max',
    features: [
      'Everything in Pro',
      'Unlimited Philo AI messages',
      'Unlimited image generation',
      'Video generation via Runway API',
      'ElevenLabs voice responses from Philo',
      'Advanced AI tools (post planner, pitch builder)',
      'Priority SmartMatch with white-glove matching',
      'Business API access',
    ],
    not_included: [],
  },
}

/**
 * Normalise a raw plan string from the DB to 'free' | 'pro' | 'promax'.
 * Handles variants like 'pro_max', 'proMax', 'PRO'.
 */
export function normalisePlan(raw) {
  if (!raw) return 'free'
  const s = raw.toLowerCase().replace(/[_\s-]/g, '')
  if (s === 'promax' || s === 'promax') return 'promax'
  if (s === 'pro') return 'pro'
  return 'free'
}

/** Annual saving as a percentage vs monthly billing */
export function annualSavingsPct(planKey) {
  const p = PLAN_META[planKey]
  if (!p?.price_monthly || !p?.price_annual_mo) return 0
  return Math.round((1 - p.price_annual_mo / p.price_monthly) * 100)
}
