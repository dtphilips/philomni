// ─── Coin Economy Constants ───────────────────────────────────────────────────
// Single source of truth for the Philomni coin/dollar conversion rate
// and the platform's revenue split.
// ─────────────────────────────────────────────────────────────────────────────

/** Number of coins equal to one US dollar. */
export const COINS_PER_DOLLAR = 100

/** Fraction of gifted coins that goes to the content creator (70 %). */
export const CREATOR_REVENUE_SHARE = 0.70

/** Fraction of gifted coins retained by Philomni (30 %). */
export const PLATFORM_REVENUE_SHARE = 0.30

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a coin amount to its USD dollar equivalent. */
export const coinsToUSD = (coins) => coins / COINS_PER_DOLLAR

/** Format a coin amount as a dollar string, e.g. "$1.14". */
export const coinsToUSDString = (coins) =>
  `$${coinsToUSD(coins).toFixed(2)}`

/** Convert a USD dollar amount to its coin equivalent. */
export const usdToCoins = (usd) => Math.round(usd * COINS_PER_DOLLAR)
