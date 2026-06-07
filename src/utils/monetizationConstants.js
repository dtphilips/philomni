/**
 * Philomni monetization constants.
 *
 * CPM / RPM are NOT hardcoded — they are market-driven from actual
 * advertiser spend via distribute_campaign_revenue().
 * The ESTIMATED_* ranges below are only for UI hint copy, never for math.
 */

// ── Gift economy (coin-based) ─────────────────────────────────────────────────
export const CREATOR_GIFT_SHARE   = 0.70   // 70 % of gifted coins → creator USD balance
export const PLATFORM_GIFT_SHARE  = 0.30   // 30 % of gifted coins → platform revenue
export const COINS_PER_DOLLAR     = 100    // 100 coins = $1.00 USD

// ── Content ad revenue (impression-based) ─────────────────────────────────────
export const CREATOR_CONTENT_SHARE  = 0.55  // 55 % of campaign spend → creator
export const PLATFORM_CONTENT_SHARE = 0.45  // 45 % of campaign spend → platform
export const CONTENT_MONETIZATION_THRESHOLD = 10_000  // min monthly views to qualify

// ── Payouts ───────────────────────────────────────────────────────────────────
export const MINIMUM_PAYOUT_USD = 10.00

// ── Estimated ranges (display-only, never used in calculations) ───────────────
// Actual CPM / RPM depend on live advertiser bids and campaign budgets.
export const ESTIMATED_CPM_RANGE = { min: 0.50, max: 15.00 }  // $/1000 impressions
export const ESTIMATED_RPM_RANGE = { min: 0.28, max:  8.25 }  // $/1000 views (creator share)

// ── Coin math helpers ─────────────────────────────────────────────────────────
/** Convert coins to USD. Always use Math.floor for creator cut. */
export const coinsToUSD = (coins) => coins / COINS_PER_DOLLAR

/** Creator's cut (floor, so no rounding error). */
export const creatorCutCoins = (totalCoins) =>
  Math.floor(totalCoins * CREATOR_GIFT_SHARE)

/** Platform cut = remainder after floor, so total always balances. */
export const platformCutCoins = (totalCoins) =>
  totalCoins - creatorCutCoins(totalCoins)
