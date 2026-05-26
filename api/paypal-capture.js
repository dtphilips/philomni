/**
 * Vercel Serverless Function — PayPal order capture + plan activation
 *
 * POST /api/paypal-capture
 * Body: { orderId, userId, plan }
 *
 * 1. Captures the PayPal order using the PayPal REST API
 * 2. Confirms the capture status is 'COMPLETED'
 * 3. Updates users.plan in Supabase
 * 4. Returns { success, plan }
 *
 * Env vars required:
 *   PAYPAL_CLIENT_ID     — or VITE_PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET — secret key (server-side only, NOT VITE_ prefixed)
 *   PAYPAL_ENV           — 'sandbox' | 'live' (default 'sandbox')
 *   SUPABASE_URL         — or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

function normalisePlan(raw) {
  if (!raw) return 'free'
  const s = raw.toLowerCase().replace(/[_\s-]/g, '')
  if (s === 'promax') return 'promax'
  if (s === 'pro')    return 'pro'
  return 'free'
}

async function getPayPalAccessToken(clientId, clientSecret, env) {
  const base = env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res  = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return { token: data.access_token, base }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { orderId, userId, plan } = req.body ?? {}
  if (!orderId || !userId || !plan) {
    return res.status(400).json({ error: 'orderId, userId, and plan are required' })
  }

  const clientId     = process.env.PAYPAL_CLIENT_ID     || process.env.VITE_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const env          = process.env.PAYPAL_ENV || 'sandbox'

  if (!clientId || !clientSecret) {
    return res.status(503).json({ error: 'PayPal is not configured.' })
  }

  try {
    // ── Get PayPal access token ────────────────────────────────────────────
    const { token, base } = await getPayPalAccessToken(clientId, clientSecret, env)

    // ── Capture the order ─────────────────────────────────────────────────
    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const captureData = await captureRes.json()

    if (captureData.status !== 'COMPLETED') {
      console.error('[api/paypal-capture] capture failed:', captureData.status, captureData.message)
      return res.status(402).json({ error: 'PayPal payment not completed', details: captureData.message })
    }

    const planName = normalisePlan(plan)
    console.log(`[api/paypal-capture] captured orderId=${orderId} plan=${planName} user=${userId}`)

    // ── Update Supabase ────────────────────────────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const { error } = await supabase
      .from('users')
      .update({ plan: planName })
      .eq('id', userId)

    if (error) {
      console.error('[api/paypal-capture] supabase update error:', error.message)
      return res.status(500).json({ error: 'Plan activation failed' })
    }

    return res.status(200).json({ success: true, plan: planName })
  } catch (err) {
    console.error('[api/paypal-capture] unexpected error:', err)
    return res.status(500).json({ error: err.message })
  }
}
