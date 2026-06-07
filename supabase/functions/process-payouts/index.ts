/**
 * Weekly payout processor — runs every Friday at 09:00 UTC.
 *
 * Set up Supabase cron (Dashboard → Database → Cron Jobs):
 *   Name:     weekly-creator-payouts
 *   Schedule: 0 9 * * 5        (09:00 every Friday)
 *   Command:  SELECT net.http_post(
 *               url := 'https://<project>.supabase.co/functions/v1/process-payouts',
 *               headers := '{"Authorization":"Bearer <service_role_key>"}'
 *             );
 */
import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MINIMUM_PAYOUT_USD = 10.00
const NGN_RATE = 1600   // USD → NGN approximation; replace with live FX API if needed

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

  // Fetch all creators eligible for payout
  const { data: creators, error } = await supabase
    .from('users')
    .select('id, email, full_name, payout_provider, stripe_account_id, paystack_recipient_code, flutterwave_account_id, available_balance_usd, total_withdrawn_usd')
    .gte('available_balance_usd', MINIMUM_PAYOUT_USD)
    .eq('bank_connected', true)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const results = { processed: 0, failed: 0, skipped: 0, total: creators?.length ?? 0 }

  for (const creator of creators ?? []) {
    const amountUsd = Number(creator.available_balance_usd)
    try {
      if (creator.payout_provider === 'stripe' && creator.stripe_account_id) {
        const transfer = await stripe.transfers.create({
          amount:      Math.floor(amountUsd * 100),
          currency:    'usd',
          destination: creator.stripe_account_id,
          metadata:    { creator_id: creator.id },
        })
        await supabase.from('payouts').insert({
          creator_id: creator.id, amount_usd: amountUsd, local_currency: 'USD',
          payout_provider: 'stripe', stripe_transfer_id: transfer.id,
          status: 'completed', processed_at: new Date().toISOString(),
        })

      } else if (creator.payout_provider === 'paystack' && creator.paystack_recipient_code) {
        const amountKobo = Math.floor(amountUsd * NGN_RATE * 100)
        const res = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'balance', amount: amountKobo, recipient: creator.paystack_recipient_code, reason: 'Philomni creator payout' }),
        })
        const data = await res.json()
        await supabase.from('payouts').insert({
          creator_id: creator.id, amount_usd: amountUsd,
          amount_local: amountUsd * NGN_RATE, local_currency: 'NGN',
          payout_provider: 'paystack', paystack_transfer_code: data.data?.transfer_code,
          status: data.status ? 'completed' : 'failed',
          failure_reason: data.status ? null : data.message,
          processed_at: new Date().toISOString(),
        })
        if (!data.status) { results.failed++; continue }

      } else if (creator.payout_provider === 'flutterwave' && creator.flutterwave_account_id) {
        const bankDetails = JSON.parse(creator.flutterwave_account_id)
        const res = await fetch('https://api.flutterwave.com/v3/transfers', {
          method: 'POST',
          headers: { Authorization: `Bearer ${Deno.env.get('FLUTTERWAVE_SECRET_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_bank:   bankDetails.bankCode,
            account_number: bankDetails.accountNumber,
            amount:         amountUsd,
            currency:       bankDetails.currency,
            narration:      'Philomni creator payout',
            reference:      `phi_${creator.id}_${Date.now()}`,
          }),
        })
        const data = await res.json()
        await supabase.from('payouts').insert({
          creator_id: creator.id, amount_usd: amountUsd,
          local_currency: bankDetails.currency, payout_provider: 'flutterwave',
          flutterwave_transfer_id: data.data?.id?.toString(),
          status: data.status === 'success' ? 'completed' : 'failed',
          failure_reason: data.status === 'success' ? null : data.message,
          processed_at: new Date().toISOString(),
        })
        if (data.status !== 'success') { results.failed++; continue }

      } else {
        results.skipped++
        continue
      }

      // Reset available balance and update withdrawn total
      await supabase.from('users').update({
        available_balance_usd: 0,
        total_withdrawn_usd:   (Number(creator.total_withdrawn_usd) || 0) + amountUsd,
      }).eq('id', creator.id)

      // Notify creator
      await supabase.from('notifications').insert({
        user_id:    creator.id,
        type:       'payout',
        content:    `Your payout of $${amountUsd.toFixed(2)} has been sent to your bank account. It usually arrives within 1–3 business days.`,
        is_read:    false,
        created_by: creator.id,
        created_at: new Date().toISOString(),
      }).catch(() => {})

      results.processed++
    } catch (err) {
      await supabase.from('payouts').insert({
        creator_id: creator.id, amount_usd: amountUsd,
        payout_provider: creator.payout_provider ?? 'unknown',
        status: 'failed', failure_reason: (err as Error).message,
        processed_at: new Date().toISOString(),
      }).catch(() => {})
      results.failed++
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
