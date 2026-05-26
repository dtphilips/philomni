/**
 * Vercel Serverless Function — Paystack payment verification
 *
 * POST /api/paystack-verify
 * Body: { reference, userId, plan }
 *
 * 1. Verifies the transaction with Paystack's API using the secret key
 * 2. Confirms the payment status is 'success'
 * 3. Updates users.plan in Supabase
 * 4. Returns { success, plan }
 *
 * Env vars required:
 *   PAYSTACK_SECRET_KEY  — from Paystack dashboard (sk_live_... or sk_test_...)
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { reference, userId, plan } = req.body ?? {}
  if (!reference || !userId || !plan) {
    return res.status(400).json({ error: 'reference, userId, and plan are required' })
  }

  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey || paystackKey.includes('your-')) {
    return res.status(503).json({ error: 'Paystack is not configured.' })
  }

  try {
    // ── Verify with Paystack ───────────────────────────────────────────────
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackKey}` } }
    )
    const verifyData = await verifyRes.json()

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      console.error('[api/paystack-verify] verification failed:', verifyData.message)
      return res.status(402).json({ error: 'Payment not successful', details: verifyData.message })
    }

    const planName = normalisePlan(plan)
    console.log(`[api/paystack-verify] verified ref=${reference} plan=${planName} user=${userId}`)

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
      console.error('[api/paystack-verify] supabase update error:', error.message)
      return res.status(500).json({ error: 'Plan activation failed' })
    }

    return res.status(200).json({ success: true, plan: planName })
  } catch (err) {
    console.error('[api/paystack-verify] unexpected error:', err)
    return res.status(500).json({ error: err.message })
  }
}
