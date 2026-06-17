import Stripe from 'https://esm.sh/stripe@14'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const TIER_PRICES: Record<string, number> = {
  featured:  499,   // $4.99
  grand:     1499,  // $14.99
  spotlight: 4999,  // $49.99
}

const TIER_LABELS: Record<string, string> = {
  featured:  'Featured Celebration (7 days)',
  grand:     'Grand Celebration (14 days)',
  spotlight: 'Spotlight Celebration (30 days)',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { tier, celebrationId, userId, userEmail, successUrl, cancelUrl } = await req.json()

    const amountCents = TIER_PRICES[tier]
    if (!amountCents) throw new Error(`Unknown tier: ${tier}`)

    const origin = req.headers.get('origin') || 'https://philomni.com'

    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency:     'usd',
          unit_amount:  amountCents,
          product_data: { name: TIER_LABELS[tier] || 'Celebration', description: 'Philomni Celebrations' },
        },
      }],
      metadata: {
        type:            'celebration',
        tier,
        userId:          userId || '',
        celebration_id:  celebrationId || '',
      },
      success_url: successUrl || `${origin}/celebrations/${celebrationId}?payment=success`,
      cancel_url:  cancelUrl  || `${origin}/celebrations/create`,
    })

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
