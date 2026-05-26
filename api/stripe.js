/**
 * Vercel Serverless Function — Stripe checkout + billing portal
 *
 * POST /api/stripe?action=<action>
 *
 * Actions:
 *   checkout   { priceId, plan, userId, userEmail, successUrl?, cancelUrl? }
 *              → { sessionId, url }
 *   portal     { customerId, returnUrl? }
 *              → { url }
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   VITE_APP_URL   (optional — defaults to https://philomni.app)
 */
import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('your-')) return null
  return new Stripe(key)
}

function getAppUrl() {
  const u = process.env.VITE_APP_URL
  return u && !u.includes('your-domain') ? u : 'https://philomni.app'
}

// ── Checkout session ──────────────────────────────────────────────────────────

async function createCheckout(stripe, body) {
  const { priceId, plan, userId, userEmail, successUrl, cancelUrl } = body
  if (!priceId) return { status: 400, json: { error: 'priceId is required' } }

  const appUrl   = getAppUrl()
  const planName = (plan || 'pro').toLowerCase().replace(/[_\s-]/g, '') === 'promax' ? 'promax' : 'pro'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    ...(userEmail ? { customer_email: userEmail } : {}),
    line_items:  [{ price: priceId, quantity: 1 }],
    mode:        'subscription',
    success_url: successUrl || `${appUrl}/billing?success=true`,
    cancel_url:  cancelUrl  || `${appUrl}/pricing`,
    metadata:    { user_id: userId ?? '', plan: planName },
    subscription_data: { metadata: { user_id: userId ?? '', plan: planName } },
    allow_promotion_codes: true,
  })

  console.log(`[api/stripe] checkout session ${session.id} plan=${planName} user=${userId}`)
  return { status: 200, json: { sessionId: session.id, url: session.url } }
}

// ── Billing portal ────────────────────────────────────────────────────────────

async function createPortal(stripe, body) {
  const { customerId, returnUrl } = body
  if (!customerId) return { status: 400, json: { error: 'customerId is required' } }

  const appUrl  = getAppUrl()
  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: returnUrl || `${appUrl}/billing`,
  })

  console.log(`[api/stripe] portal session for customer=${customerId}`)
  return { status: 200, json: { url: session.url } }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment processing is not configured. Set STRIPE_SECRET_KEY.',
    })
  }

  const action = req.query?.action || req.body?.action
  if (!action) return res.status(400).json({ error: 'action query param is required' })

  try {
    let result
    switch (action) {
      case 'checkout': result = await createCheckout(stripe, req.body ?? {}); break
      case 'portal':   result = await createPortal(stripe, req.body ?? {}); break
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
    return res.status(result.status).json(result.json)
  } catch (err) {
    console.error(`[api/stripe] unexpected error (action=${action}):`, err)
    return res.status(500).json({ error: err.message })
  }
}
