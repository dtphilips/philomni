// ─── Payment Provider Configuration ──────────────────────────────────────────
// Set the active provider in .env:
//   VITE_PAYMENT_PROVIDER=stripe | paystack | flutterwave
//
// All providers are inactive until the matching key is added to .env.
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
 * Create a payment_intent row in Supabase before processing.
 * Returns the inserted row (includes the `id` needed for tracking).
 */
export const createPaymentIntent = async (supabase, {
  userId,
  amount,       // lowest currency unit (cents / kobo)
  currency,     // 'usd' | 'ngn' | 'ghs' …
  type,         // 'subscription' | 'boost' | 'campaign' | 'coins' | 'product'
  metadata = {},
}) => {
  const { data, error } = await supabase
    .from('payment_intents')
    .insert({
      user_id: userId,
      amount,
      currency,
      type,
      provider: PAYMENT_CONFIG.provider,
      status: 'pending',
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
      completed_at: new Date().toISOString(),
    })
    .eq('id', paymentIntentId)
}
