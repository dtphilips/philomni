import Stripe from 'https://esm.sh/stripe@14'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
function err(msg: string, status = 400) { return json({ error: msg }, status) }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Auth
  const jwt = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!jwt) return err('Unauthorized', 401)
  const { data: { user } } = await supabase.auth.getUser(jwt)
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const { action, deal_id, milestone_id, email, payment_method, payment_ref } = body

  // Load deal
  const { data: deal, error: dealErr } = await supabase
    .from('brief_deals')
    .select('*, company:company_id(id, name, owner_id), brief:brief_id(title)')
    .eq('id', deal_id)
    .single()

  if (dealErr || !deal) return err('Deal not found', 404)

  // ── ACTION: create_payment_intent (brand pays into escrow) ──────────────────
  if (action === 'create_payment_intent') {
    // Only company owner/member can initiate payment
    const isBrand = deal.company?.owner_id === user.id
    if (!isBrand) return err('Only the brand can initiate payment', 403)

    // Determine amount for this payment
    let amount = 0
    let description = ''
    let meta: Record<string, string> = { deal_id, type: 'deal_escrow' }

    if (milestone_id) {
      const { data: ms } = await supabase.from('deal_milestones').select('*').eq('id', milestone_id).single()
      if (!ms) return err('Milestone not found', 404)
      amount = Number(ms.amount)
      description = `Milestone: ${ms.title} — ${deal.brief?.title}`
      meta.milestone_id = milestone_id
    } else {
      amount = Number(deal.agreed_amount)
      description = `Deal escrow: ${deal.brief?.title}`
    }

    if (!amount || amount <= 0) return err('Invalid amount', 400)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description,
      metadata: meta,
      receipt_email: email ?? undefined,
    })

    // Log payment record
    await supabase.from('deal_payments').insert({
      deal_id,
      milestone_id: milestone_id ?? null,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency: 'usd',
      direction: 'brand_to_escrow',
      status: 'pending',
    })

    return json({ client_secret: paymentIntent.client_secret, amount })
  }

  // ── ACTION: confirm_escrow (webhook / manual — mark funds held after PI succeeds) ─
  if (action === 'confirm_escrow') {
    const { stripe_payment_intent_id } = body
    const pi = await stripe.paymentIntents.retrieve(stripe_payment_intent_id)

    if (pi.status !== 'succeeded') return err('Payment not succeeded', 400)

    await supabase.from('deal_payments').update({ status: 'succeeded' }).eq('stripe_payment_intent_id', stripe_payment_intent_id)

    if (milestone_id) {
      await supabase.from('deal_milestones').update({ status: 'in_progress' }).eq('id', milestone_id)
    } else {
      await supabase.from('brief_deals').update({ payment_status: 'held', stripe_payment_intent_id }).eq('id', deal_id)
    }

    return json({ ok: true })
  }

  // ── ACTION: release_to_creator (brand approves — Philomni pays out) ──────────
  if (action === 'release_to_creator') {
    const isBrand = deal.company?.owner_id === user.id
    if (!isBrand) return err('Only the brand can release payment', 403)

    let amount = 0
    if (milestone_id) {
      const { data: ms } = await supabase.from('deal_milestones').select('amount').eq('id', milestone_id).single()
      amount = Number(ms?.amount ?? 0)
    } else {
      amount = Number(deal.agreed_amount)
    }

    if (!amount || amount <= 0) return err('Invalid amount', 400)

    // Platform fee: 5%
    const platformFee = Math.round(amount * 100 * 0.05)
    const creatorAmount = Math.round(amount * 100) - platformFee

    // Try Stripe transfer if creator has a connected account in users table
    const { data: creatorUser } = await supabase
      .from('users')
      .select('stripe_account_id, bank_connected')
      .eq('id', deal.creator_id)
      .maybeSingle()

    let transferId: string | null = null
    const resolvedMethod = payment_method ?? 'manual'
    const isStripeTransfer = resolvedMethod === 'Stripe / Card' && !!creatorUser?.stripe_account_id && creatorUser.bank_connected

    if (isStripeTransfer) {
      try {
        const transfer = await stripe.transfers.create({
          amount: creatorAmount,
          currency: 'usd',
          destination: creatorUser!.stripe_account_id,
          metadata: { deal_id, milestone_id: milestone_id ?? '', type: 'deal_payout' },
        })
        transferId = transfer.id
      } catch (_) {
        // Stripe transfer failed — record as manual
      }
    }

    const finalMethod = transferId ? 'stripe' : resolvedMethod

    // Log payment record
    await supabase.from('deal_payments').insert({
      deal_id,
      milestone_id: milestone_id ?? null,
      stripe_transfer_id: transferId,
      amount: creatorAmount / 100,
      currency: 'usd',
      direction: 'escrow_to_creator',
      status: 'succeeded',
      notes: payment_ref ?? null,
    })

    if (milestone_id) {
      await supabase.from('deal_milestones').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        ...(transferId ? { stripe_transfer_id: transferId } : {}),
      }).eq('id', milestone_id)
    } else {
      await supabase.from('brief_deals').update({
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
        status: 'completed',
      }).eq('id', deal_id)
    }

    return json({
      ok: true,
      transfer_id: transferId,
      amount_paid: creatorAmount / 100,
      payment_method: finalMethod,
    })
  }

  // ── ACTION: refund (deal cancelled before completion) ────────────────────────
  if (action === 'refund') {
    const isBrand = deal.company?.owner_id === user.id
    if (!isBrand) return err('Only the brand can request a refund', 403)
    if (!deal.stripe_payment_intent_id) return err('No payment to refund', 400)

    const refund = await stripe.refunds.create({ payment_intent: deal.stripe_payment_intent_id })

    await supabase.from('deal_payments').insert({
      deal_id, milestone_id: null,
      amount: Number(deal.agreed_amount),
      currency: 'usd',
      direction: 'refund',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
    })

    await supabase.from('brief_deals').update({ payment_status: 'refunded', status: 'cancelled' }).eq('id', deal_id)

    return json({ ok: true, refund_id: refund.id })
  }

  return err('Unknown action', 400)
})
