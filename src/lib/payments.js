// ─── Payment Provider Configuration ──────────────────────────────────────────
// Active provider is set via VITE_PAYMENT_PROVIDER in Vercel env vars.
// All providers are inactive until the matching key is present.
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

/** Returns true only when the configured provider has a key set. */
export const isPaymentActive = () => {
  const { provider } = PAYMENT_CONFIG
  return PAYMENT_CONFIG[provider]?.active ?? false
}

/**
 * Detect whether the current user's browser is in Nigerian timezone.
 * Used to decide Paystack vs email-fallback on Advertise page.
 */
export const isNigerianTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Lagos'
  } catch {
    return false
  }
}

/**
 * Lazily load the Paystack inline script.
 * Safe to call multiple times — resolves immediately if already loaded.
 */
export const loadPaystackScript = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.onload  = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })

/**
 * Open the Paystack popup.
 *
 * Options:
 *   email, amountKobo, currency ('NGN'|'USD'|…), metadata,
 *   onSuccess(reference), onClose()
 */
export const openPaystackPopup = ({ email, amountKobo, currency = 'NGN', metadata = {}, onSuccess, onClose }) => {
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
