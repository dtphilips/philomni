import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const stripe   = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { userId, userEmail, amount, adType, postId, campaignData } = await req.json()
    if (!userId || !userEmail || !amount || !adType) {
      throw new Error('userId, userEmail, amount and adType are required')
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('users').select('stripe_customer_id').eq('id', userId).single()

    let customerId = userData?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_id: userId },
      })
      customerId = customer.id
      await supabase.from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const description = adType === 'boost'
      ? `Boost post ${postId ?? ''} — ${campaignData?.days ?? ''} days`
      : `Ad campaign — ${campaignData?.name ?? 'Campaign'}`

    const paymentIntent = await stripe.paymentIntents.create({
      amount:         Math.round(amount * 100), // dollars → cents
      currency:       'usd',
      customer:       customerId,
      capture_method: 'manual', // authorize only — capture on admin approval
      description,
      metadata: {
        userId,
        adType,
        postId:       postId        ?? '',
        campaignData: JSON.stringify(campaignData ?? {}),
      },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { headers: { 'Content-Type': 'application/json', ...CORS } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } },
    )
  }
})
