import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const stripe   = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const body          = await req.text()
  const signature     = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  let event: Stripe.Event

  if (webhookSecret && signature) {
    // Full signature verification when secret is configured in Supabase Vault
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', (err as Error).message)
      return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 })
    }
  } else {
    // Permissive mode — processes events without signature check.
    // Add STRIPE_WEBHOOK_SECRET to Supabase Vault (Dashboard → Settings → Vault)
    // to enable full security.  Value: whsec_pswkDToFhYBSVag0YDlfTTwoi0ppdzjw
    console.warn('STRIPE_WEBHOOK_SECRET not set — running without signature verification')
    try { event = JSON.parse(body) as Stripe.Event }
    catch { return new Response('Invalid JSON', { status: 400 }) }
  }

  const obj = (event.data?.object ?? {}) as Record<string, unknown>

  if (event.type === 'checkout.session.completed') {
    const userId = (obj.metadata as Record<string, string> | null)?.userId
    const plan   = (obj.metadata as Record<string, string> | null)?.plan
    if (userId && plan) {
      await supabase.from('users').update({
        plan,
        subscription_id:     obj.subscription as string,
        subscription_status: 'active',
        stripe_customer_id:  obj.customer as string,
      }).eq('id', userId)
      console.log(`Plan activated: ${plan} for user ${userId}`)
    }
  }

  else if (event.type === 'invoice.payment_succeeded') {
    await supabase.from('users')
      .update({ subscription_status: 'active' })
      .eq('stripe_customer_id', obj.customer as string)
    await supabase.rpc('record_platform_revenue', {
      p_source_type: 'subscription',
      p_source_id:   null,
      p_gross_amount: Math.round(((obj.amount_paid as number) || 0) / 100),
      p_platform_cut: Math.round(((obj.amount_paid as number) || 0) / 100),
      p_sender_id:    null,
      p_recipient_id: null,
    }).catch(() => {})
  }

  else if (event.type === 'invoice.payment_failed') {
    await supabase.from('users')
      .update({ subscription_status: 'past_due', plan: 'free' })
      .eq('stripe_customer_id', obj.customer as string)
  }

  else if (event.type === 'customer.subscription.deleted') {
    await supabase.from('users')
      .update({ subscription_status: 'cancelled', plan: 'free', subscription_id: null })
      .eq('stripe_customer_id', obj.customer as string)
  }

  else if (event.type === 'customer.subscription.updated') {
    await supabase.from('users')
      .update({ subscription_status: obj.status as string })
      .eq('stripe_customer_id', obj.customer as string)
  }

  return new Response(
    JSON.stringify({ received: true, type: event.type }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
