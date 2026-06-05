// ─── Payment Provider Configuration ──────────────────────────────────────────
// Active provider is set via VITE_PAYMENT_PROVIDER in Vercel env vars.
// Country-based routing overrides the env default at runtime.
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_CONFIG = {
  provider: import.meta.env.VITE_PAYMENT_PROVIDER ?? 'stripe',
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
    active: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  },
  paystack: {
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? '',
    active: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  },
  flutterwave: {
    publicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ?? '',
    active: !!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
  },
}

// ── Country → provider routing ────────────────────────────────────────────────
// Nigeria: Paystack (lower fees, best local UX)
export const PAYSTACK_COUNTRIES = ['NG']

// Other African markets: Flutterwave (widest coverage, mobile money)
export const FLUTTERWAVE_COUNTRIES = [
  'GH', 'KE', 'ZA', 'UG', 'TZ', 'RW', 'ZM', 'ET',
  'CM', 'SN', 'CI', 'EG', 'MA', 'TN', 'GM', 'SL',
]

/**
 * Detect the user's country code via ipapi.co.
 * Falls back to 'US' on error (→ Stripe).
 */
export const getUserCountry = async () => {
  try {
    const res  = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    return data.country_code ?? 'US'
  } catch {
    return 'US'
  }
}

/**
 * Choose the best payment provider for a given ISO country code.
 * Only returns a provider if the corresponding key is active.
 * Falls back through the chain: paystack → flutterwave → stripe → null
 */
export const getPaymentProvider = (countryCode) => {
  if (PAYSTACK_COUNTRIES.includes(countryCode) && PAYMENT_CONFIG.paystack.active)
    return 'paystack'
  if (FLUTTERWAVE_COUNTRIES.includes(countryCode) && PAYMENT_CONFIG.flutterwave.active)
    return 'flutterwave'
  if (PAYMENT_CONFIG.stripe.active)
    return 'stripe'
  return null
}

/** Returns true only when the configured provider has a key set. */
export const isPaymentActive = () => {
  const { provider } = PAYMENT_CONFIG
  return PAYMENT_CONFIG[provider]?.active ?? false
}

// ── Script loaders ────────────────────────────────────────────────────────────

/**
 * Lazily load the Paystack inline script.
 * Safe to call multiple times — resolves immediately if already loaded.
 */
export const loadPaystackScript = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const s = document.createElement('script')
    s.src     = 'https://js.paystack.co/v1/inline.js'
    s.onload  = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })

/**
 * Lazily load the Flutterwave v3 checkout script.
 */
export const loadFlutterwaveScript = () =>
  new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) { resolve(); return }
    const s = document.createElement('script')
    s.src     = 'https://checkout.flutterwave.com/v3.js'
    s.onload  = resolve
    s.onerror = reject
    document.body.appendChild(s)
  })

// ── Provider wrappers ─────────────────────────────────────────────────────────

/**
 * Open the Paystack popup.
 * amountKobo  — amount in kobo (NGN × 100). $1 USD ≈ ₦1500 → USD × 1500 × 100
 */
export const openPaystackPopup = ({
  email, amountKobo, currency = 'NGN', metadata = {}, onSuccess, onClose,
}) => {
  const handler = window.PaystackPop.setup({
    key:      PAYMENT_CONFIG.paystack.publicKey,
    email,
    amount:   amountKobo,
    currency,
    metadata,
    callback: (response) => onSuccess?.(response.reference),
    onClose:  () => onClose?.(),
  })
  handler.openIframe()
}

/**
 * Open the Flutterwave checkout modal.
 * amount — human amount in the chosen currency (e.g. 8.00 for $8 USD)
 */
export const openFlutterwaveCheckout = ({
  email, name, amount, currency = 'USD', txRef, metadata = {}, onSuccess, onClose,
}) => {
  window.FlutterwaveCheckout({
    public_key:      PAYMENT_CONFIG.flutterwave.publicKey,
    tx_ref:          txRef ?? `phi-${Date.now()}`,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd',
    customer:        { email, name },
    customizations:  {
      title:       'Philomni',
      description: metadata.description ?? 'Philomni Coins',
      logo:        'https://philomni.vercel.app/favicon.ico',
    },
    meta:     metadata,
    callback: (response) => {
      if (response.status === 'successful' || response.status === 'completed') {
        onSuccess?.(String(response.transaction_id))
      }
    },
    onclose: () => onClose?.(),
  })
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

/**
 * Create a payment_intent row in Supabase before processing.
 * Returns the inserted row (id needed for tracking).
 */
export const createPaymentIntent = async (supabase, {
  userId,
  amount,       // lowest currency unit (cents / kobo)
  currency,     // 'usd' | 'ngn' | …
  type,         // 'coins' | 'campaign' | 'boost' | …
  metadata = {},
}) => {
  const { data, error } = await supabase
    .from('payment_intents')
    .insert({
      user_id:    userId,
      amount,
      currency,
      type,
      provider:   PAYMENT_CONFIG.provider,
      status:     'pending',
      metadata,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Mark a payment_intent as completed (or failed). */
export const recordPayment = async (supabase, {
  paymentIntentId,
  providerPaymentId,
  status = 'completed',
}) => {
  await supabase
    .from('payment_intents')
    .update({
      status,
      provider_payment_id: providerPaymentId,
      completed_at:        new Date().toISOString(),
    })
    .eq('id', paymentIntentId)
}

// ── Provider display metadata ─────────────────────────────────────────────────
export const PROVIDER_BADGES = {
  paystack:    { text: 'Secured by Paystack · NGN charged',          dot: 'bg-emerald-500' },
  flutterwave: { text: 'Secured by Flutterwave · Multi-currency',    dot: 'bg-orange-500'  },
  stripe:      { text: 'Secured by Stripe · USD charged',            dot: 'bg-blue-500'    },
}
