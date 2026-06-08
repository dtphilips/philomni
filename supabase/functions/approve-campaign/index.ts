import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const stripe   = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { campaignId, action, adminId, rejectionReason } = await req.json()

    const { data: campaign, error: fetchError } = await supabase
      .from('ad_campaigns').select('*').eq('id', campaignId).single()
    if (fetchError || !campaign) throw new Error('Campaign not found')
    console.log('approve-campaign:', campaignId, action)

    const piId = campaign.stripe_payment_intent_id

    if (action === 'approve') {
      if (piId) {
        try { await stripe.paymentIntents.capture(piId); console.log('captured') }
        catch (e) {
          console.error('capture error:', (e as Error).message)
          if (!(e as Error).message.includes('already captured') && !(e as Error).message.includes('automatic')) throw e
        }
      }
      await supabase.from('ad_campaigns').update({
        status: 'active', reviewed_by: adminId ?? null, reviewed_at: new Date().toISOString(),
        stripe_payment_status: 'captured', starts_at: campaign.starts_at ?? new Date().toISOString(),
      }).eq('id', campaignId)

      const budget = campaign.total_budget ?? campaign.budget ?? 0
      await supabase.rpc('record_platform_revenue', {
        p_source_type: 'ad', p_source_id: campaignId,
        p_gross_amount: Math.round(budget * 100), p_platform_cut: Math.round(budget * 100),
        p_sender_id: campaign.advertiser_id, p_recipient_id: null,
      }).catch((e) => console.error('revenue err', e))

      const { data: adv } = await supabase.from('users').select('email').eq('id', campaign.advertiser_id).single()
      await supabase.functions.invoke('send-campaign-email', {
        body: { type: 'approved', campaignId, advertiserEmail: adv?.email, campaignName: campaign.name ?? campaign.title },
      }).catch(() => {})

    } else if (action === 'reject') {
      if (piId) { try { await stripe.paymentIntents.cancel(piId); console.log('cancelled') } catch (e) { console.error('cancel error:', (e as Error).message) } }
      await supabase.from('ad_campaigns').update({
        status: 'rejected', rejection_reason: rejectionReason ?? 'Did not meet guidelines',
        reviewed_by: adminId ?? null, reviewed_at: new Date().toISOString(), stripe_payment_status: 'cancelled',
      }).eq('id', campaignId)
      const { data: adv } = await supabase.from('users').select('email').eq('id', campaign.advertiser_id).single()
      await supabase.functions.invoke('send-campaign-email', {
        body: { type: 'rejected', campaignId, advertiserEmail: adv?.email, campaignName: campaign.name ?? campaign.title, reason: rejectionReason },
      }).catch(() => {})
    } else {
      throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...CORS } })
  } catch (err) {
    console.error('approve-campaign error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } })
  }
})
