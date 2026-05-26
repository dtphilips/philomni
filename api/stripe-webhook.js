/**
 * Vercel Serverless Function — Stripe webhook handler
 *
 * POST /api/stripe-webhook
 *
 * Add this URL in Stripe Dashboard → Webhooks:
 *   https://your-app.vercel.app/api/stripe-webhook
 *
 * Required events to enable in Stripe:
 *   checkout.session.completed
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.payment_failed
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

/** Normalise raw plan string to 'free' | 'pro' | 'promax' */
function normalisePlan(raw) {
  if (!raw) return 'free'
  const s = raw.toLowerCase().replace(/[_\s-]/g, '')
  if (s === 'promax') return 'promax'
  if (s === 'pro')    return 'pro'
  return 'free'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig    = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err) {
    console.error('[stripe-webhook] signature error:', err.message)
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL     || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  console.log(`[stripe-webhook] event: ${event.type}`)

  try {
    switch (event.type) {

      // ── Checkout completed — activate plan ──────────────────────────────
      case 'checkout.session.completed': {
        const session   = event.data.object
        const userId    = session.metadata?.user_id
        const plan      = normalisePlan(session.metadata?.plan || 'pro')
        const subId     = session.subscription
        const custId    = session.customer

        if (!userId) { console.warn('[stripe-webhook] no user_id in metadata'); break }

        // Fetch subscription to get period_end
        let periodEnd = null
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId)
            periodEnd = new Date(sub.current_period_end * 1000).toISOString()
          } catch (e) {
            console.warn('[stripe-webhook] could not fetch subscription:', e.message)
          }
        }

        // Update users table directly
        const { error: userErr } = await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id:      custId,
            stripe_subscription_id:  subId,
            plan_expires_at:         periodEnd,
          })
          .eq('id', userId)
        if (userErr) console.error('[stripe-webhook] update users error:', userErr.message)

        // Upsert subscriptions table (legacy support)
        await supabase.from('subscriptions').upsert({
          user_id:                userId,
          stripe_customer_id:     custId,
          stripe_subscription_id: subId,
          plan,
          status:             'active',
          current_period_end: periodEnd,
          updated_at:         new Date().toISOString(),
        }, { onConflict: 'user_id' })

        console.log(`[stripe-webhook] activated plan=${plan} for user=${userId}`)
        break
      }

      // ── Subscription updated (renewal, plan change) ─────────────────────
      case 'customer.subscription.updated': {
        const sub       = event.data.object
        const isActive  = sub.status === 'active' || sub.status === 'trialing'
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString()
        const plan      = normalisePlan(sub.metadata?.plan)

        // Update subscriptions table
        await supabase
          .from('subscriptions')
          .update({ status: sub.status, current_period_end: periodEnd })
          .eq('stripe_subscription_id', sub.id)

        // If now active with a plan, update users
        if (isActive && plan !== 'free') {
          const { data: dbSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single()
          if (dbSub?.user_id) {
            await supabase.from('users').update({
              plan,
              plan_expires_at: periodEnd,
            }).eq('id', dbSub.user_id)
          }
        }
        break
      }

      // ── Subscription deleted / cancelled ────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', current_period_end: new Date(sub.current_period_end * 1000).toISOString() })
          .eq('stripe_subscription_id', sub.id)

        // Downgrade user back to free
        const { data: dbSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()
        if (dbSub?.user_id) {
          await supabase.from('users').update({
            plan:                    'free',
            stripe_subscription_id:  null,
            plan_expires_at:         null,
          }).eq('id', dbSub.user_id)
          console.log(`[stripe-webhook] downgraded user=${dbSub.user_id} to free`)
        }
        break
      }

      // ── Payment failed (optional — could notify user) ───────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.warn(`[stripe-webhook] payment failed for customer=${invoice.customer}`)
        // Future: send email notification, mark subscription as past_due
        break
      }

      // ── Creator payouts via Stripe Connect ──────────────────────────────
      case 'transfer.created': {
        const transfer = event.data.object
        await supabase.from('creator_earnings').update({
          status: 'paid',
          stripe_payout_id: transfer.id,
        }).eq('stripe_payout_id', transfer.id)
        break
      }

      default:
        break
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
