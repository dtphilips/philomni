import { useState } from 'react'
import { PAYMENT_CONFIG, isPaymentActive, createPaymentIntent, recordPayment } from '../lib/payments'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

/**
 * Universal payment button — works with whichever provider is active.
 *
 * Props:
 *   amount      number  — human amount in dollars / naira (not cents)
 *   currency    string  — 'usd' | 'ngn' | 'ghs' …  (default 'usd')
 *   type        string  — payment type label stored in DB
 *   label       string  — button text
 *   metadata    object  — extra data stored on the payment_intent
 *   onSuccess   fn      — called after successful payment
 *   onError     fn      — called on error
 *   className   string  — Tailwind classes for the button
 */
export default function PaymentButton({
  amount,
  currency = 'usd',
  type,
  label,
  metadata = {},
  onSuccess,
  onError,
  className = '',
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!user) return

    if (!isPaymentActive()) {
      alert('Payments are coming soon! We will notify you when available.')
      return
    }

    setLoading(true)
    try {
      const amountInLowest = Math.round(amount * 100) // dollars → cents
      const intent = await createPaymentIntent(supabase, {
        userId: user.id,
        amount: amountInLowest,
        currency,
        type,
        metadata,
      })

      const provider = PAYMENT_CONFIG.provider

      if (provider === 'paystack' && PAYMENT_CONFIG.paystack.active) {
        const handler = window.PaystackPop?.setup({
          key: PAYMENT_CONFIG.paystack.publicKey,
          email: user.email,
          amount: amountInLowest,
          currency: currency.toUpperCase(),
          metadata: { payment_intent_id: intent.id, ...metadata },
          callback: async (response) => {
            await recordPayment(supabase, {
              paymentIntentId: intent.id,
              providerPaymentId: response.reference,
              status: 'completed',
            })
            onSuccess?.(response)
            setLoading(false)
          },
          onClose: () => {
            setLoading(false)
          },
        })
        handler?.openIframe()

      } else if (provider === 'flutterwave' && PAYMENT_CONFIG.flutterwave.active) {
        window.FlutterwaveCheckout?.({
          public_key: PAYMENT_CONFIG.flutterwave.publicKey,
          tx_ref: intent.id,
          amount,
          currency: currency.toUpperCase(),
          customer: { email: user.email },
          callback: async (response) => {
            await recordPayment(supabase, {
              paymentIntentId: intent.id,
              providerPaymentId: String(response.transaction_id),
              status: 'completed',
            })
            onSuccess?.(response)
            setLoading(false)
          },
          onclose: () => setLoading(false),
        })

      } else {
        // Stripe requires a server-side payment intent — show coming-soon for now
        alert('Payment processing coming soon!')
        setLoading(false)
      }
    } catch (err) {
      console.error('[PaymentButton] error:', err)
      onError?.(err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading ? 'Processing…' : label}
    </button>
  )
}
