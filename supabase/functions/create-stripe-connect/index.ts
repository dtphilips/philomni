import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe  = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const siteUrl = Deno.env.get('SITE_URL') ?? 'https://philomni.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const { userId, userEmail } = await req.json()
    if (!userId || !userEmail) throw new Error('userId and userEmail required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check if user already has a Stripe account
    const { data: userData } = await supabase
      .from('users').select('stripe_account_id').eq('id', userId).single()

    let accountId = userData?.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type:  'express',
        email: userEmail,
        capabilities: { transfers: { requested: true } },
      })
      accountId = account.id

      await supabase.from('users').update({
        stripe_account_id: accountId,
        payout_provider:   'stripe',
        bank_connected:    false, // true only after onboarding completes
      }).eq('id', userId)
    }

    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      refresh_url: `${siteUrl}/wallet?connect=refresh`,
      return_url:  `${siteUrl}/wallet?connect=success`,
      type:        'account_onboarding',
    })

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
