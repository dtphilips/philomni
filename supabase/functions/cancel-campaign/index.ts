import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { campaignId, userId, action } = await req.json()
    // action: 'pause' | 'cancel'

    const { data: campaign, error: fetchErr } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('advertiser_id', userId)
      .single()

    if (fetchErr || !campaign) throw new Error('Campaign not found or access denied')

    const today    = new Date()
    const startDate = campaign.start_date ? new Date(campaign.start_date) : today
    const endDate   = campaign.end_date   ? new Date(campaign.end_date)   : today

    const totalDays     = Math.max(1, Math.ceil((endDate - startDate) / 86_400_000))
    const daysUsed      = Math.max(0, Math.ceil((today - startDate) / 86_400_000))
    const daysRemaining = Math.max(0, totalDays - daysUsed)

    const dailyRate    = Number(campaign.daily_budget ?? 10)
    const refundAmount = daysRemaining * dailyRate

    console.log('cancel-campaign:', { campaignId, action, totalDays, daysUsed, daysRemaining, refundAmount })

    let refundIssued = false
    if (action === 'cancel' && refundAmount > 0 && campaign.stripe_payment_intent_id) {
      const stripeStatus = campaign.stripe_payment_status
      try {
        if (stripeStatus === 'requires_capture') {
          // Not yet captured — cancel the authorization entirely
          await stripe.paymentIntents.cancel(campaign.stripe_payment_intent_id)
          refundIssued = true
        } else if (stripeStatus === 'captured' || stripeStatus === 'succeeded') {
          // Already captured — issue a partial refund
          await stripe.refunds.create({
            payment_intent: campaign.stripe_payment_intent_id,
            amount: Math.round(refundAmount * 100),
            reason: 'requested_by_customer',
          })
          refundIssued = true
        }
      } catch (stripeErr) {
        console.error('Stripe refund error (non-fatal):', stripeErr.message)
        // Continue with DB update even if Stripe call fails
      }
    }

    const newStatus = action === 'pause' ? 'paused' : 'cancelled'
    await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', campaignId)

    const message = action === 'pause'
      ? 'Campaign paused. Resume anytime to continue.'
      : refundIssued && refundAmount > 0
        ? `Campaign cancelled. $${refundAmount.toFixed(2)} refund issued for ${daysRemaining} unused days. Allow 5–10 business days.`
        : 'Campaign cancelled.'

    return new Response(JSON.stringify({ success: true, daysUsed, daysRemaining, refundAmount, refundIssued, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('cancel-campaign error:', err)
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
