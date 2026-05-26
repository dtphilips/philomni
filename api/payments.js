/**
 * Vercel Serverless Function — Consolidated payment verification
 *
 * POST /api/payments?action=<action>
 *
 * Actions:
 *   verify-paystack    { reference, userId, plan }
 *   verify-flutterwave { transactionId?, txRef?, userId, plan }
 *   capture-paypal     { orderId, userId, plan }
 *
 * Each action:
 *   1. Verifies the payment with the respective gateway
 *   2. Updates users.plan in Supabase
 *   3. Returns { success, plan }
 *
 * Env vars required (per gateway):
 *   PAYSTACK_SECRET_KEY        sk_live_... or sk_test_...
 *   FLUTTERWAVE_SECRET_KEY     FLWSECK_...
 *   PAYPAL_CLIENT_ID           or VITE_PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET       server-side only
 *   PAYPAL_ENV                 'sandbox' | 'live' (default 'sandbox')
 *   SUPABASE_URL               or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

// ── Shared helpers ────────────────────────────────────────────────────────────

function normalisePlan(raw) {
  if (!raw) return 'free'
  const s = raw.toLowerCase().replace(/[_\s-]/g, '')
  if (s === 'promax') return 'promax'
  if (s === 'pro')    return 'pro'
  return 'free'
}

function makeSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

async function activatePlan(userId, planName) {
  const supabase = makeSupabase()
  const { error } = await supabase
    .from('users')
    .update({ plan: planName })
    .eq('id', userId)
  if (error) throw new Error('Plan activation failed: ' + error.message)
}

// ── Paystack verification ─────────────────────────────────────────────────────

async function verifyPaystack(body) {
  const { reference, userId, plan } = body
  if (!reference || !userId || !plan) {
    return { status: 400, json: { error: 'reference, userId, and plan are required' } }
  }

  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey || paystackKey.includes('your-')) {
    return { status: 503, json: { error: 'Paystack is not configured.' } }
  }

  const verifyRes  = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${paystackKey}` } },
  )
  const verifyData = await verifyRes.json()

  if (!verifyData.status || verifyData.data?.status !== 'success') {
    console.error('[api/payments] paystack verification failed:', verifyData.message)
    return { status: 402, json: { error: 'Payment not successful', details: verifyData.message } }
  }

  const planName = normalisePlan(plan)
  console.log(`[api/payments] paystack verified ref=${reference} plan=${planName} user=${userId}`)
  await activatePlan(userId, planName)
  return { status: 200, json: { success: true, plan: planName } }
}

// ── Flutterwave verification ──────────────────────────────────────────────────

async function verifyFlutterwave(body) {
  const { transactionId, txRef, userId, plan } = body
  if ((!transactionId && !txRef) || !userId || !plan) {
    return { status: 400, json: { error: 'transactionId (or txRef), userId, and plan are required' } }
  }

  const fwKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!fwKey || fwKey.includes('your-')) {
    return { status: 503, json: { error: 'Flutterwave is not configured.' } }
  }

  let verifyData
  if (transactionId) {
    const r = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
      { headers: { Authorization: `Bearer ${fwKey}` } },
    )
    verifyData = await r.json()
  } else {
    const r = await fetch(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${fwKey}` } },
    )
    const listData = await r.json()
    verifyData = { status: listData.status, data: listData.data?.[0] }
  }

  if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
    console.error('[api/payments] flutterwave verification failed:', verifyData.message)
    return { status: 402, json: { error: 'Payment not successful', details: verifyData.message } }
  }

  const planName = normalisePlan(plan)
  console.log(`[api/payments] flutterwave verified txId=${transactionId || txRef} plan=${planName} user=${userId}`)
  await activatePlan(userId, planName)
  return { status: 200, json: { success: true, plan: planName } }
}

// ── PayPal capture ────────────────────────────────────────────────────────────

async function getPayPalAccessToken(clientId, clientSecret, env) {
  const base = env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res  = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  })
  const data = await res.json()
  return { token: data.access_token, base }
}

async function capturePayPal(body) {
  const { orderId, userId, plan } = body
  if (!orderId || !userId || !plan) {
    return { status: 400, json: { error: 'orderId, userId, and plan are required' } }
  }

  const clientId     = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const env          = process.env.PAYPAL_ENV || 'sandbox'

  if (!clientId || !clientSecret) {
    return { status: 503, json: { error: 'PayPal is not configured.' } }
  }

  const { token, base } = await getPayPalAccessToken(clientId, clientSecret, env)

  const captureRes  = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const captureData = await captureRes.json()

  if (captureData.status !== 'COMPLETED') {
    console.error('[api/payments] paypal capture failed:', captureData.status, captureData.message)
    return { status: 402, json: { error: 'PayPal payment not completed', details: captureData.message } }
  }

  const planName = normalisePlan(plan)
  console.log(`[api/payments] paypal captured orderId=${orderId} plan=${planName} user=${userId}`)
  await activatePlan(userId, planName)
  return { status: 200, json: { success: true, plan: planName } }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const action = req.query?.action || req.body?.action
  if (!action) return res.status(400).json({ error: 'action query param is required' })

  try {
    let result
    switch (action) {
      case 'verify-paystack':    result = await verifyPaystack(req.body ?? {}); break
      case 'verify-flutterwave': result = await verifyFlutterwave(req.body ?? {}); break
      case 'capture-paypal':     result = await capturePayPal(req.body ?? {}); break
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
    return res.status(result.status).json(result.json)
  } catch (err) {
    console.error(`[api/payments] unexpected error (action=${action}):`, err)
    return res.status(500).json({ error: err.message })
  }
}
