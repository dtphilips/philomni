/**
 * Vercel Serverless Function — Flutterwave payment verification
 *
 * POST /api/flutterwave-verify
 * Body: { transactionId, txRef, userId, plan }
 *
 * 1. Verifies the transaction with Flutterwave's API using the secret key
 * 2. Confirms the payment status is 'successful'
 * 3. Updates users.plan in Supabase
 * 4. Returns { success, plan }
 *
 * Env vars required:
 *   FLUTTERWAVE_SECRET_KEY  — from Flutterwave dashboard (FLWSECK_...)
 *   SUPABASE_URL            — or VITE_SUPABASE_URL
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { transactionId, txRef, userId, plan } = req.body ?? {}
  if ((!transactionId && !txRef) || !userId || !plan) {
    return res.status(400).json({ error: 'transactionId (or txRef), userId, and plan are required' })
  }

  const fwKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!fwKey || fwKey.includes('your-')) {
    return res.status(503).json({ error: 'Flutterwave is not configured.' })
  }

  try {
    // ── Verify with Flutterwave ────────────────────────────────────────────
    // Prefer transactionId; fall back to txRef search
    let verifyData
    if (transactionId) {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
        { headers: { Authorization: `Bearer ${fwKey}` } }
      )
      verifyData = await verifyRes.json()
    } else {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
        { headers: { Authorization: `Bearer ${fwKey}` } }
      )
      const listData = await verifyRes.json()
      verifyData = { status: listData.status, data: listData.data?.[0] }
    }

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
      console.error('[api/flutterwave-verify] verification failed:', verifyData.message)
      return res.status(402).json({ error: 'Payment not successful', details: verifyData.message })
    }

    const planName = normalisePlan(plan)
    console.log(`[api/flutterwave-verify] verified txId=${transactionId || txRef} plan=${planName} user=${userId}`)

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
      console.error('[api/flutterwave-verify] supabase update error:', error.message)
      return res.status(500).json({ error: 'Plan activation failed' })
    }

    return res.status(200).json({ success: true, plan: planName })
  } catch (err) {
    console.error('[api/flutterwave-verify] unexpected error:', err)
    return res.status(500).json({ error: err.message })
  }
}
