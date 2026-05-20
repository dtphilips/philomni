/**
 * Vercel Serverless Function — Stripe Checkout session creation
 * POST /api/stripe-checkout
 *   { priceId, userId, userEmail, successUrl?, cancelUrl? }
 *
 * Returns { sessionId, url } on success.
 * Returns { error } with status 503 when Stripe is not configured.
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
  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body ?? {}

  if (!priceId) return res.status(400).json({ error: 'priceId is required' })

  const appUrl =
    process.env.VITE_APP_URL && !process.env.VITE_APP_URL.includes('your-domain')
      ? process.env.VITE_APP_URL
      : 'https://philomni.app'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${appUrl}/billing?success=true`,
      cancel_url: cancelUrl || `${appUrl}/billing?cancelled=true`,
      metadata: { user_id: userId ?? '' },
      allow_promotion_codes: true,
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('[api/stripe-checkout]', err)
    return res.status(500).json({ error: err.message })
  }
}
