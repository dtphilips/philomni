import React, { useCallback } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Loader2 } from 'lucide-react'

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''
const IS_READY  = !!CLIENT_ID && !CLIENT_ID.includes('your-')

/**
 * PayPalCheckout — renders PayPal Smart Payment Buttons.
 *
 * Props:
 *   amount       number   — amount in USD (major unit, e.g. 29.99)
 *   currency     string   — 'USD' (PayPal handles FX on their end)
 *   planKey      string   — 'pro' | 'promax'
 *   userId       string
 *   onSuccess    fn
 *   onError      fn
 *   loading      bool
 *   setLoading   fn
 */
export default function PayPalCheckout({
  amount, currency = 'USD',
  planKey, userId,
  onSuccess, onError,
  loading, setLoading,
}) {
  const createOrder = useCallback(async (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: {
          value:         String(amount),
          currency_code: currency,
        },
        description: `Philomni ${planKey === 'promax' ? 'Pro Max' : 'Pro'} Plan`,
        custom_id:   `${userId}|${planKey}`,
      }],
      application_context: {
        brand_name: 'Philomni',
        user_action: 'PAY_NOW',
      },
    })
  }, [amount, currency, planKey, userId])

  const onApprove = useCallback(async (data, actions) => {
    setLoading(true)
    try {
      const res  = await fetch('/api/paypal-capture', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderId: data.orderID,
          userId,
          plan:    planKey,
        }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'PayPal capture failed')
      onSuccess?.({ plan: result.plan })
    } catch (err) {
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }, [planKey, userId, onSuccess, onError, setLoading])

  const onPayPalError = useCallback((err) => {
    onError?.('PayPal encountered an error. Please try again.')
    console.error('[PayPalCheckout]', err)
  }, [onError])

  if (!IS_READY) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        PayPal not configured. Set VITE_PAYPAL_CLIENT_ID.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full py-3 rounded-xl bg-[#ffc439]/80 flex items-center justify-center gap-2 text-[#003087] font-semibold text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Processing…
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        'client-id': CLIENT_ID,
        currency,
        intent: 'capture',
        'disable-funding': 'credit,card',
      }}
    >
      <PayPalButtons
        style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'pay', height: 44 }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onPayPalError}
        disabled={loading}
      />
    </PayPalScriptProvider>
  )
}
