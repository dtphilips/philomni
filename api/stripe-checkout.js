/**
 * Vercel Serverless Function — Stripe Checkout session creation
 *
 * POST /api/stripe-checkout
 * Body:
 *   priceId    string  — Stripe price ID (required)
 *   plan       string  — 'pro' | 'promax' — stored in metadata so webhook knows what to activate
 *   userId     string  — Supabase user ID
 *   userEmail  string  — pre-fills the checkout email field
 *   successUrl string? — override success redirect (default: /billing?success=true)
 *   cancelUrl  string? — override cancel redirect  (default: /pricing)
 *
 * Returns { sessionId, url } on success.
 * Returns { error }        on failure.
 */
import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey.includes('your-')) {
    return res.status(503).json({
      error: 'Payment processing is not yet configured. Set STRIPE_SECRET_KEY in your environment.',
    })
  }

  const stripe = new Stripe(stripeKey)
  const { priceId, plan, userId, userEmail, successUrl, cancelUrl } = req.body ?? {}

  if (!priceId) return res.status(400).json({ error: 'priceId is required' })

  const appUrl =
    process.env.VITE_APP_URL && !process.env.VITE_APP_URL.includes('your-domain')
      ? process.env.VITE_APP_URL
      : 'https://philomni.app'

  // Normalise plan name for metadata storage
  const planName = (plan || 'pro').toLowerCase().replace(/[_\s-]/g, '') === 'promax' ? 'promax' : 'pro'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items:  [{ price: priceId, quantity: 1 }],
      mode:        'subscription',
      success_url: successUrl || `${appUrl}/billing?success=true`,
      cancel_url:  cancelUrl  || `${appUrl}/pricing`,
      metadata: {
        user_id: userId ?? '',
        plan:    planName,          // 'pro' or 'promax' — read by webhook
      },
      subscription_data: {
        metadata: { user_id: userId ?? '', plan: planName },
      },
      allow_promotion_codes: true,
    })

    console.log(`[api/stripe-checkout] created session ${session.id} for plan=${planName} user=${userId}`)
    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('[api/stripe-checkout]', err)
    return res.status(500).json({ error: err.message })
  }
}
