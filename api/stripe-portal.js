/**
 * Vercel Serverless Function — Stripe Billing Portal session
 *
 * POST /api/stripe-portal
 * Body: { customerId, returnUrl? }
 *
 * Redirects the user to Stripe's self-serve billing portal where they can
 * manage their subscription, update payment details, or cancel.
 */
import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey.includes('your-')) {
    return res.status(503).json({ error: 'Stripe is not configured.' })
  }

  const stripe = new Stripe(stripeKey)
  const { customerId, returnUrl } = req.body ?? {}

  if (!customerId) return res.status(400).json({ error: 'customerId is required' })

  const appUrl =
    process.env.VITE_APP_URL && !process.env.VITE_APP_URL.includes('your-domain')
      ? process.env.VITE_APP_URL
      : 'https://philomni.app'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: returnUrl || `${appUrl}/billing`,
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[api/stripe-portal]', err)
    return res.status(500).json({ error: err.message })
  }
}
