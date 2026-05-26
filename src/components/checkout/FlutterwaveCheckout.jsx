import React, { useCallback } from 'react'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import { Loader2 } from 'lucide-react'

const PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || ''
const IS_READY   = !!PUBLIC_KEY && !PUBLIC_KEY.includes('your-')

const PHILOMNI_LOGO = 'https://philomni.app/logo.png' // update to real logo URL

/**
 * FlutterwaveCheckout — renders a Flutterwave payment button.
 *
 * Props:
 *   amount       number   — amount in the currency's major unit (NOT kobo)
 *   currency     string   — e.g. 'NGN', 'GHS', 'XOF', 'USD'
 *   email        string
 *   name         string
 *   phone        string?
 *   planKey      string   — 'pro' | 'promax'
 *   userId       string
 *   onSuccess    fn
 *   onError      fn
 *   loading      bool
 *   setLoading   fn
 */
export default function FlutterwaveCheckout({
  amount, currency = 'NGN', email, name, phone,
  planKey, userId,
  onSuccess, onError,
  loading, setLoading,
}) {
  const txRef = `philomni_${planKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const config = {
    public_key:      PUBLIC_KEY,
    tx_ref:          txRef,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email,
      name:         name || 'Philomni User',
      phone_number: phone || '',
    },
    customizations: {
      title:       'Philomni ' + (planKey === 'promax' ? 'Pro Max' : 'Pro'),
      description: 'Unlock the full power of Philomni',
      logo:        PHILOMNI_LOGO,
    },
    meta: { user_id: userId, plan: planKey },
  }

  const handleFlutterPayment = useFlutterwave(config)

  const handlePay = useCallback(() => {
    if (!IS_READY) {
      onError?.('Flutterwave is not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY.')
      return
    }

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal()
        if (response.status !== 'successful') {
          onError?.('Payment was not completed. Please try again.')
          return
        }
        setLoading(true)
        try {
          const res  = await fetch('/api/payments?action=verify-flutterwave', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              transactionId: response.transaction_id,
              txRef:         response.tx_ref,
              userId,
              plan:          planKey,
            }),
          })
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Verification failed')
          onSuccess?.({ plan: data.plan })
        } catch (err) {
          onError?.(err.message)
        } finally {
          setLoading(false)
        }
      },
      onClose: () => {},
    })
  }, [handleFlutterPayment, planKey, userId, onSuccess, onError, setLoading])

  if (!IS_READY) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        Flutterwave not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY.
      </div>
    )
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3 rounded-xl bg-[#f5a623] hover:bg-[#e09510] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <>📱 Pay with Flutterwave</>}
    </button>
  )
}
