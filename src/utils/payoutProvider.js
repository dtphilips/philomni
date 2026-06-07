// ─── Payout Provider Routing ──────────────────────────────────────────────────
// Mirrors the coin-purchase routing in src/lib/payments.js but for payouts.
// The same provider that processes incoming payments (buying coins) also handles
// outgoing payments (creator payouts) for each region.
// ─────────────────────────────────────────────────────────────────────────────

export const PAYSTACK_COUNTRIES    = ['NG']
export const FLUTTERWAVE_COUNTRIES = ['GH','KE','ZA','UG','TZ','RW','CM','CI','SN','ZM','ET','EG','MA','TN']

/**
 * Determine the correct payout provider for a given ISO country code.
 * Falls back to Stripe for all western/international markets.
 */
export const detectPayoutProvider = (country) => {
  if (!country) return 'stripe'
  if (PAYSTACK_COUNTRIES.includes(country))    return 'paystack'
  if (FLUTTERWAVE_COUNTRIES.includes(country)) return 'flutterwave'
  return 'stripe'
}

// ── Constants (re-exported from lib/constants for convenience) ────────────────
export const COINS_PER_DOLLAR      = 100
export const CREATOR_REVENUE_SHARE = 0.70
export const PLATFORM_REVENUE_SHARE = 0.30
export const MINIMUM_PAYOUT_USD    = 10.00

// ── Nigerian bank list (Paystack) ─────────────────────────────────────────────
export const NIGERIAN_BANKS = [
  { name: 'Access Bank',              code: '044' },
  { name: 'Citibank Nigeria',         code: '023' },
  { name: 'Ecobank Nigeria',          code: '050' },
  { name: 'Fidelity Bank',            code: '070' },
  { name: 'First Bank of Nigeria',    code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank',              code: '00103' },
  { name: 'Guaranty Trust Bank',      code: '058' },
  { name: 'Heritage Bank',            code: '030' },
  { name: 'Keystone Bank',            code: '082' },
  { name: 'Kuda Bank',                code: '50211' },
  { name: 'OPay',                     code: '999992' },
  { name: 'Palmpay',                  code: '999991' },
  { name: 'Parallex Bank',            code: '526' },
  { name: 'Polaris Bank',             code: '076' },
  { name: 'Providus Bank',            code: '101' },
  { name: 'Stanbic IBTC Bank',        code: '221' },
  { name: 'Standard Chartered',       code: '068' },
  { name: 'Sterling Bank',            code: '232' },
  { name: 'Titan Trust Bank',         code: '102' },
  { name: 'Union Bank of Nigeria',    code: '032' },
  { name: 'United Bank for Africa',   code: '033' },
  { name: 'Unity Bank',               code: '215' },
  { name: 'VFD Microfinance Bank',    code: '566' },
  { name: 'Wema Bank',                code: '035' },
  { name: 'Zenith Bank',              code: '057' },
]

// ── Flutterwave country/currency map ─────────────────────────────────────────
export const FLW_COUNTRY_CURRENCIES = {
  GH: { currency: 'GHS', name: 'Ghana' },
  KE: { currency: 'KES', name: 'Kenya' },
  ZA: { currency: 'ZAR', name: 'South Africa' },
  UG: { currency: 'UGX', name: 'Uganda' },
  TZ: { currency: 'TZS', name: 'Tanzania' },
  RW: { currency: 'RWF', name: 'Rwanda' },
  CM: { currency: 'XAF', name: 'Cameroon' },
  CI: { currency: 'XOF', name: 'Côte d\'Ivoire' },
  SN: { currency: 'XOF', name: 'Senegal' },
  ZM: { currency: 'ZMW', name: 'Zambia' },
  ET: { currency: 'ETB', name: 'Ethiopia' },
  EG: { currency: 'EGP', name: 'Egypt' },
  MA: { currency: 'MAD', name: 'Morocco' },
  TN: { currency: 'TND', name: 'Tunisia' },
}

/** Return the next Friday from today as a formatted string. */
export const getNextPayoutDate = () => {
  const d = new Date()
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntilFriday)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
