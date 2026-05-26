/**
 * Philomni — Multi-gateway payment routing
 *
 * Gateway priority:
 *   Stripe      → US, CA, GB, AU, NZ, EU
 *   Paystack    → NG, GH, ZA, KE, RW, CI
 *   Flutterwave → all other African countries
 *   PayPal      → everywhere else (global fallback)
 */

// ── Stripe countries ──────────────────────────────────────────────────────────
const STRIPE_COUNTRIES = new Set([
  'US','CA','GB','AU','NZ',
  // EU member states
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI',
  'FR','GR','HR','HU','IE','IT','LT','LU','LV','MT',
  'NL','PL','PT','RO','SE','SI','SK',
  // Other Stripe-strong markets
  'CH','NO','IS','JP','SG','HK','KR','IN','MX','BR',
])

// ── Paystack countries ────────────────────────────────────────────────────────
const PAYSTACK_COUNTRIES = new Set(['NG','GH','ZA','KE','RW','CI'])

// ── Flutterwave African countries ─────────────────────────────────────────────
const FLUTTERWAVE_COUNTRIES = new Set([
  'CM','TZ','UG','SN','EG','ET','MZ','MG','BJ','TG',
  'ZM','ZW','AO','NA','MW','BW','MU','LS','SZ','SD',
  'ER','LR','SL','GM','GW','CV','ST','GQ','GA','CG',
  'CD','CF','TD','NE','ML','BF','GN','MR','DZ','MA',
  'TN','LY','SO','DJ','KM','SC',
])

// ── Timezone → ISO country code ───────────────────────────────────────────────
const TIMEZONE_TO_COUNTRY = {
  // Africa
  'Africa/Lagos': 'NG', 'Africa/Abuja': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Johannesburg': 'ZA', 'Africa/Cape_Town': 'ZA',
  'Africa/Nairobi': 'KE',
  'Africa/Kigali': 'RW',
  'Africa/Abidjan': 'CI',
  'Africa/Douala': 'CM',
  'Africa/Dar_es_Salaam': 'TZ', 'Africa/Zanzibar': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Dakar': 'SN',
  'Africa/Cairo': 'EG',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Maputo': 'MZ',
  'Africa/Antananarivo': 'MG',
  'Africa/Cotonou': 'BJ',
  'Africa/Lome': 'TG',
  'Africa/Lusaka': 'ZM',
  'Africa/Harare': 'ZW',
  'Africa/Luanda': 'AO',
  'Africa/Windhoek': 'NA',
  'Africa/Blantyre': 'MW',
  'Africa/Gaborone': 'BW',
  'Africa/Bamako': 'ML',
  'Africa/Ouagadougou': 'BF',
  'Africa/Conakry': 'GN',
  'Africa/Nouakchott': 'MR',
  'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Tripoli': 'LY',
  'Africa/Mogadishu': 'SO',
  'Africa/Djibouti': 'DJ',
  'Africa/Ndjamena': 'TD',
  'Africa/Niamey': 'NE',
  'Africa/Kinshasa': 'CD',
  'Africa/Bangui': 'CF',
  'Africa/Brazzaville': 'CG',
  'Africa/Libreville': 'GA',
  'Africa/Malabo': 'GQ',
  'Africa/Monrovia': 'LR',
  'Africa/Freetown': 'SL',
  'Africa/Banjul': 'GM',
  'Africa/Bissau': 'GW',
  'Africa/Sao_Tome': 'ST',
  'Africa/Mbabane': 'SZ',
  'Africa/Maseru': 'LS',
  'Africa/Asmara': 'ER',
  'Africa/Moroni': 'KM',
  'Africa/Victoria': 'SC',
  'Africa/Porto-Novo': 'BJ',
  'Africa/Bujumbura': 'BI',
  'Africa/El_Aaiun': 'EH',
  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'America/Indiana/Indianapolis': 'US', 'America/Detroit': 'US',
  'America/Boise': 'US', 'America/Juneau': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'America/Edmonton': 'CA', 'America/Regina': 'CA',
  'America/St_Johns': 'CA',
  'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR',
  'America/Belem': 'BR', 'America/Fortaleza': 'BR',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Mendoza': 'AR',
  'America/Caracas': 'VE',
  'America/Mexico_City': 'MX', 'America/Tijuana': 'MX',
  'America/Monterrey': 'MX', 'America/Merida': 'MX',
  'America/Guatemala': 'GT',
  'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI',
  'America/Costa_Rica': 'CR',
  'America/Panama': 'PA',
  'America/Jamaica': 'JM',
  'America/Port_of_Spain': 'TT',
  'America/Guyana': 'GY',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Montevideo': 'UY',
  'America/Quito': 'EC',
  'America/Havana': 'CU',
  'America/Santo_Domingo': 'DO',
  'America/Port-au-Prince': 'HT',
  // Europe
  'Europe/London': 'GB', 'Europe/Belfast': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE', 'Europe/Hamburg': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Milan': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH', 'Europe/Geneva': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG',
  'Europe/Athens': 'GR',
  'Europe/Helsinki': 'FI',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Dublin': 'IE',
  'Europe/Lisbon': 'PT',
  'Europe/Riga': 'LV',
  'Europe/Tallinn': 'EE',
  'Europe/Vilnius': 'LT',
  'Europe/Ljubljana': 'SI',
  'Europe/Zagreb': 'HR',
  'Europe/Belgrade': 'RS',
  'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
  'Europe/Moscow': 'RU', 'Europe/Kaliningrad': 'RU',
  'Europe/Istanbul': 'TR',
  'Europe/Nicosia': 'CY',
  'Europe/Valletta': 'MT',
  'Europe/Luxembourg': 'LU',
  'Europe/Bratislava': 'SK',
  'Europe/Podgorica': 'ME',
  'Europe/Sarajevo': 'BA',
  'Europe/Skopje': 'MK',
  'Europe/Tirana': 'AL',
  'Europe/Minsk': 'BY',
  'Europe/Chisinau': 'MD',
  'Atlantic/Reykjavik': 'IS',
  // Asia / Middle East
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN',
  'Asia/Seoul': 'KR',
  'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Hong_Kong': 'HK',
  'Asia/Dubai': 'AE',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Taipei': 'TW',
  'Asia/Beirut': 'LB',
  'Asia/Riyadh': 'SA',
  'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ',
  'Asia/Amman': 'JO',
  'Asia/Muscat': 'OM',
  'Asia/Kuwait': 'KW',
  'Asia/Kathmandu': 'NP',
  'Asia/Yangon': 'MM',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
  'Asia/Ulaanbaatar': 'MN',
  'Asia/Tashkent': 'UZ',
  'Asia/Almaty': 'KZ',
  'Asia/Tbilisi': 'GE',
  'Asia/Baku': 'AZ',
  'Asia/Yerevan': 'AM',
  'Asia/Bishkek': 'KG',
  'Asia/Ashgabat': 'TM',
  'Asia/Dushanbe': 'TJ',
  'Asia/Kabul': 'AF',
  'Asia/Katmandu': 'NP',
  'Asia/Aden': 'YE',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL',
  'Asia/Nicosia': 'CY',
  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU', 'Australia/Darwin': 'AU',
  'Australia/Hobart': 'AU',
  'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ',
  'Pacific/Fiji': 'FJ',
  'Pacific/Port_Moresby': 'PG',
  'Pacific/Guam': 'GU',
  'Pacific/Samoa': 'WS',
}

// ── Country display names ─────────────────────────────────────────────────────
export const COUNTRY_NAMES = {
  NG: 'Nigeria', GH: 'Ghana', ZA: 'South Africa', KE: 'Kenya',
  RW: 'Rwanda', CI: 'Côte d\'Ivoire', CM: 'Cameroon', TZ: 'Tanzania',
  UG: 'Uganda', SN: 'Senegal', EG: 'Egypt', ET: 'Ethiopia',
  US: 'United States', CA: 'Canada', GB: 'United Kingdom',
  AU: 'Australia', NZ: 'New Zealand', DE: 'Germany', FR: 'France',
  IT: 'Italy', ES: 'Spain', NL: 'Netherlands', BE: 'Belgium',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  JP: 'Japan', SG: 'Singapore', HK: 'Hong Kong', IN: 'India',
  BR: 'Brazil', MX: 'Mexico',
}

// ── Local pricing (approximate equivalents to USD prices) ────────────────────
// These are set at reasonable market rates. Adjust as needed.
export const LOCAL_PRICING = {
  NG: { currency: 'NGN', symbol: '₦',    pro_monthly: 24900, pro_annual: 199000, promax_monthly: 39900, promax_annual: 319000 },
  GH: { currency: 'GHS', symbol: 'GH₵',  pro_monthly: 380,   pro_annual: 3040,   promax_monthly: 620,   promax_annual: 4960   },
  ZA: { currency: 'ZAR', symbol: 'R',    pro_monthly: 550,   pro_annual: 4400,   promax_monthly: 900,   promax_annual: 7200   },
  KE: { currency: 'KES', symbol: 'KSh',  pro_monthly: 3900,  pro_annual: 31200,  promax_monthly: 6400,  promax_annual: 51200  },
  RW: { currency: 'RWF', symbol: 'RF',   pro_monthly: 39000, pro_annual: 312000, promax_monthly: 64000, promax_annual: 512000 },
  CI: { currency: 'XOF', symbol: 'CFA',  pro_monthly: 18000, pro_annual: 144000, promax_monthly: 29500, promax_annual: 236000 },
}

// ── Detect country from browser timezone ─────────────────────────────────────
export function detectCountryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TIMEZONE_TO_COUNTRY[tz] || null
  } catch {
    return null
  }
}

// ── Load country (from localStorage cache, then timezone) ────────────────────
export function getStoredCountry() {
  try { return localStorage.getItem('philomni_country') || null } catch { return null }
}
export function storeCountry(code) {
  try { if (code) localStorage.setItem('philomni_country', code) } catch {}
}
export function resolveCountry(userCountry) {
  // Priority: user DB profile > localStorage > timezone detection
  return userCountry || getStoredCountry() || detectCountryFromTimezone() || 'US'
}

// ── Main routing function ─────────────────────────────────────────────────────
/**
 * Returns which payment gateway to use for a given ISO country code.
 * @param {string} country  ISO 3166-1 alpha-2 country code (e.g. 'NG')
 * @returns {'stripe'|'paystack'|'flutterwave'|'paypal'}
 */
export function getPaymentGateway(country) {
  if (!country) return 'paypal'
  const c = country.toUpperCase()
  if (STRIPE_COUNTRIES.has(c))      return 'stripe'
  if (PAYSTACK_COUNTRIES.has(c))    return 'paystack'
  if (FLUTTERWAVE_COUNTRIES.has(c)) return 'flutterwave'
  return 'paypal'
}

// ── Get price for a country ───────────────────────────────────────────────────
/**
 * Returns { amount, currency, symbol, display } for a given plan + billing + country.
 * Falls back to USD for countries without local pricing.
 */
export function getPriceForCountry(country, planKey, billing) {
  const local = LOCAL_PRICING[country?.toUpperCase()]
  const field  = `${planKey}_${billing === 'annual' ? 'annual' : 'monthly'}`

  if (local && local[field] !== undefined) {
    return {
      amount:   local[field],
      currency: local.currency,
      symbol:   local.symbol,
      display:  `${local.symbol}${local[field].toLocaleString()}`,
      isLocal:  true,
    }
  }

  // USD fallback
  const USD_PRICES = {
    pro_monthly: 29.99, pro_annual: 299,
    promax_monthly: 49.99, promax_annual: 479,
  }
  const usd = USD_PRICES[field] || 29.99
  return {
    amount:   usd,
    currency: 'USD',
    symbol:   '$',
    display:  `$${usd}`,
    isLocal:  false,
  }
}

// ── Gateway display metadata ──────────────────────────────────────────────────
export const GATEWAY_META = {
  stripe:      { name: 'Stripe',      label: 'Card / Bank',    emoji: '💳' },
  paystack:    { name: 'Paystack',    label: 'Card / USSD / Transfer', emoji: '🏦' },
  flutterwave: { name: 'Flutterwave', label: 'Card / Mobile Money / Bank', emoji: '📱' },
  paypal:      { name: 'PayPal',      label: 'PayPal / Card',  emoji: '🅿️' },
}

// ── All selectable countries (for manual picker) ──────────────────────────────
export const COUNTRY_LIST = [
  { code: 'NG', name: 'Nigeria',        flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana',          flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa',   flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya',          flag: '🇰🇪' },
  { code: 'RW', name: 'Rwanda',         flag: '🇷🇼' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon',       flag: '🇨🇲' },
  { code: 'TZ', name: 'Tanzania',       flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda',         flag: '🇺🇬' },
  { code: 'SN', name: 'Senegal',        flag: '🇸🇳' },
  { code: 'EG', name: 'Egypt',          flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia',       flag: '🇪🇹' },
  { code: 'ZM', name: 'Zambia',         flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',       flag: '🇿🇼' },
  { code: 'MZ', name: 'Mozambique',     flag: '🇲🇿' },
  { code: 'AO', name: 'Angola',         flag: '🇦🇴' },
  { code: 'BW', name: 'Botswana',       flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia',        flag: '🇳🇦' },
  { code: 'MA', name: 'Morocco',        flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria',        flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia',        flag: '🇹🇳' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand',    flag: '🇳🇿' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { code: 'FR', name: 'France',         flag: '🇫🇷' },
  { code: 'IT', name: 'Italy',          flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',          flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland',    flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden',         flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',         flag: '🇳🇴' },
  { code: 'IN', name: 'India',          flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore',      flag: '🇸🇬' },
  { code: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',         flag: '🇲🇽' },
  { code: 'AE', name: 'UAE',            flag: '🇦🇪' },
  { code: 'OTHER', name: 'Other',       flag: '🌍' },
]
