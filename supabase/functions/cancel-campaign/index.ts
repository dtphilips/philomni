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

    const { data: campaign, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) throw new Error('Campaign not found')

    console.log('cancel-campaign:', {
      id: campaign.id, status: campaign.status,
      pi: campaign.stripe_payment_intent_id,
      piStatus: campaign.stripe_payment_status,
      action,
    })

    let refundAmount = 0
    let refundMessage = ''

    if (action === 'cancel') {
      if (campaign.stripe_payment_intent_id) {
        try {
          const pi = await stripe.paymentIntents.retrieve(campaign.stripe_payment_intent_id)
          console.log('PaymentIntent status:', pi.status)

          if (pi.status === 'requires_capture') {
            // Manual capture — never charged. Cancel releases the hold entirely.
            await stripe.paymentIntents.cancel(campaign.stripe_payment_intent_id)
            refundAmount = Number(campaign.total_budget ?? 0)
            refundMessage =
              'Campaign cancelled. Your card was never charged — ' +
              'the authorization hold has been released. ' +
              'Allow 1–3 business days to clear.'
            console.log('Hold released — no charge ever made')

          } else if (pi.status === 'succeeded' || pi.status === 'captured') {
            // Already charged — calculate unused-days partial refund
            const today     = new Date()
            const startDate = campaign.start_date ? new Date(campaign.start_date) : today
            const endDate   = campaign.end_date   ? new Date(campaign.end_date)   : today
            const totalDays     = Math.max(1, Math.ceil((endDate - startDate) / 86_400_000))
            const daysUsed      = Math.max(0, Math.ceil((today - startDate) / 86_400_000))
            const daysRemaining = Math.max(0, totalDays - daysUsed)
            const dailyRate     = Number(campaign.daily_budget ?? 10)
            refundAmount = daysRemaining * dailyRate

            if (refundAmount > 0) {
              await stripe.refunds.create({
                payment_intent: campaign.stripe_payment_intent_id,
                amount: Math.round(refundAmount * 100),
                reason: 'requested_by_customer',
              })
              refundMessage =
                `Campaign cancelled. $${refundAmount.toFixed(2)} USD refund issued ` +
                `for ${daysRemaining} unused days. Allow 5–10 business days.`
              console.log('Partial refund issued:', refundAmount)
            } else {
              refundMessage = 'Campaign cancelled. No refund — all days were already served.'
            }

          } else {
            // Any other status (requires_payment_method etc.) — try to cancel
            try {
              await stripe.paymentIntents.cancel(campaign.stripe_payment_intent_id)
              refundMessage = 'Campaign cancelled. Payment authorization released.'
            } catch (e: any) {
              console.log('Could not cancel PI:', e.message)
              refundMessage = 'Campaign cancelled. Contact support@philomni.com if a charge appears.'
            }
          }
        } catch (stripeErr: any) {
          console.error('Stripe error (non-fatal):', stripeErr.message)
          refundMessage = 'Campaign cancelled in system. Contact support@philomni.com regarding any payment.'
        }
      } else {
        refundMessage = 'Campaign cancelled.'
      }

      // Remove platform revenue entries for this campaign
      await supabase.from('platform_revenue').delete().eq('source_id', campaignId)

      // Mark cancelled in DB
      await supabase.from('ad_campaigns').update({
        status: 'cancelled',
        stripe_payment_status: 'cancelled',
      }).eq('id', campaignId)

    } else if (action === 'pause') {
      await supabase.from('ad_campaigns').update({ status: 'paused' }).eq('id', campaignId)
      refundMessage = 'Campaign paused. Resume anytime to continue.'

    } else if (action === 'resume') {
      await supabase.from('ad_campaigns').update({ status: 'active' }).eq('id', campaignId)
      refundMessage = 'Campaign resumed.'

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, refundAmount, message: refundMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err: any) {
    console.error('cancel-campaign error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
