/**
 * Vercel Serverless Function — Stripe webhook handler
 * POST /api/stripe-webhook
 * Add this URL in Stripe dashboard → Webhooks
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan || 'pro';

        if (userId) {
          // Update user plan
          await supabase.from('users').update({ plan }).eq('id', userId);
          // Upsert subscription record
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan,
            status: 'active',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const isActive = sub.status === 'active';
        await supabase
          .from('subscriptions')
          .update({ status: sub.status, current_period_end: new Date(sub.current_period_end * 1000).toISOString() })
          .eq('stripe_subscription_id', sub.id);

        // Downgrade if cancelled
        if (!isActive) {
          const { data: dbSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single();
          if (dbSub?.user_id) {
            await supabase.from('users').update({ plan: 'free' }).eq('id', dbSub.user_id);
          }
        }
        break;
      }

      case 'transfer.created': {
        // Payout to creator via Stripe Connect
        const transfer = event.data.object;
        await supabase.from('creator_earnings').update({
          status: 'paid',
          stripe_payout_id: transfer.id,
        }).eq('stripe_payout_id', transfer.id);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return res.status(500).json({ error: err.message });
  }
}
