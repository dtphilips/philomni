// ─── Shared constants for the Celebrations feature ────────────────────────────

export const CELEBRATION_TYPES = [
  { type: 'birthday',        emoji: '🎂', label: 'Birthday',        gradient: 'from-pink-500 to-yellow-400'  },
  { type: 'memorial',        emoji: '🕊️', label: 'Memorial',        gradient: 'from-slate-600 to-slate-400'  },
  { type: 'achievement',     emoji: '🏆', label: 'Achievement',     gradient: 'from-green-500 to-yellow-400' },
  { type: 'graduation',      emoji: '🎓', label: 'Graduation',      gradient: 'from-blue-600 to-purple-500'  },
  { type: 'anniversary',     emoji: '💍', label: 'Anniversary',     gradient: 'from-rose-500 to-pink-400'    },
  { type: 'new_baby',        emoji: '👶', label: 'New Baby',        gradient: 'from-yellow-400 to-orange-400'},
  { type: 'recovery',        emoji: '🏥', label: 'Recovery',        gradient: 'from-teal-500 to-green-400'   },
  { type: 'business_launch', emoji: '🚀', label: 'Business Launch', gradient: 'from-teal-600 to-purple-600'  },
  { type: 'promotion',       emoji: '📈', label: 'Promotion',       gradient: 'from-blue-500 to-cyan-400'    },
  { type: 'just_because',    emoji: '❤️', label: 'Just Because',    gradient: 'from-red-500 to-pink-400'     },
  { type: 'other',           emoji: '🎉', label: 'Other',           gradient: 'from-purple-500 to-blue-500'  },
]

export const TIERS = {
  basic: {
    key: 'basic',
    label: 'Basic',
    price: 0,
    badge: null,
    duration: 1,   // days
    color: 'text-muted-foreground',
    features: ['24 hours in celebrations feed', 'Community reactions & wishes', 'Shareable link', 'Standard celebration page'],
  },
  featured: {
    key: 'featured',
    label: 'Featured',
    price: 4.99,
    badge: '⭐',
    duration: 7,
    color: 'text-amber-400',
    features: ['Everything in Basic', 'Pinned at top for 48 hours', 'Notify all your followers', 'Gold Featured badge', '7 days duration'],
  },
  grand: {
    key: 'grand',
    label: 'Grand',
    price: 14.99,
    badge: '👑',
    duration: 14,
    color: 'text-yellow-400',
    popular: true,
    features: ['Everything in Featured', 'Platform-wide notification', '14 days duration', 'Animated gold border', 'Downloadable digital certificate', 'Grand Celebration badge'],
  },
  sponsored: {
    key: 'sponsored',
    label: 'Sponsored',
    price: 49.99,
    badge: '🚀',
    duration: 30,
    color: 'text-primary',
    features: ['Everything in Grand', 'Appears in main feed', 'Reaches ALL users', '30 days duration', 'Priority placement everywhere', 'Custom banner option'],
  },
}

export const REACTIONS = [
  { key: 'love',      emoji: '❤️',  label: 'Love'      },
  { key: 'celebrate', emoji: '🎉',  label: 'Celebrate' },
  { key: 'emotional', emoji: '😭',  label: 'Emotional' },
  { key: 'fire',      emoji: '🔥',  label: 'Fire'      },
  { key: 'clap',      emoji: '👏',  label: 'Clap'      },
  { key: 'blessings', emoji: '🙏',  label: 'Blessings' },
]

export const RELATIONSHIPS = [
  'Myself', 'Family', 'Friend', 'Colleague', 'Fan', 'Customer', 'Other',
]

export const getTypeInfo = (type) =>
  CELEBRATION_TYPES.find(t => t.type === type) || CELEBRATION_TYPES[CELEBRATION_TYPES.length - 1]

export const getTierInfo = (tier) => TIERS[tier] || TIERS.basic

export const getExpiresAt = (tier) => {
  const info = getTierInfo(tier)
  const d = new Date()
  d.setDate(d.getDate() + info.duration)
  return d.toISOString()
}

export const makeShareableCode = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase()

export const tierBorderClass = (tier) => {
  if (tier === 'grand' || tier === 'sponsored') return 'grand-shimmer'
  if (tier === 'featured') return 'ring-2 ring-amber-400/60'
  return ''
}
