import React, { useCallback } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { Loader2 } from 'lucide-react'

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
const IS_READY   = !!PUBLIC_KEY && !PUBLIC_KEY.includes('your-')

/**
 * PaystackCheckout — renders a Paystack payment button.
 *
 * Props:
 *   amount       number   — amount in the MINOR unit (kobo, pesewas, etc.)
 *   currency     string   — 'NGN' | 'GHS' | 'ZAR' | 'KES'
 *   email        string   — user email
 *   name         string   — user display name
 *   planKey      string   — 'pro' | 'promax'
 *   userId       string   — Supabase user ID
 *   onSuccess    fn       — called with { plan } after server-side verification
 *   onError      fn       — called with error message string
 *   loading      bool     — shows spinner when true
 *   setLoading   fn       — setter
 */
export default function PaystackCheckout({
  amount, currency = 'NGN', email, name,
  planKey, userId,
  onSuccess, onError,
  loading, setLoading,
}) {
  const reference = `philomni_${planKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const config = {
    reference,
    email,
    amount,         // already in kobo / pesewas
    currency,
    publicKey: PUBLIC_KEY,
    metadata: {
      custom_fields: [
        { display_name: 'Name', variable_name: 'name', value: name || '' },
        { display_name: 'Plan', variable_name: 'plan', value: planKey },
      ],
    },
  }

  const initializePayment = usePaystackPayment(config)

  const handlePay = useCallback(() => {
    if (!IS_READY) {
      onError?.('Paystack is not configured. Contact support.')
      return
    }
    initializePayment({
      onSuccess: async (txn) => {
        setLoading(true)
        try {
          const res  = await fetch('/api/paystack-verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ reference: txn.reference, userId, plan: planKey }),
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
      onClose: () => {
        // User closed the modal — no action needed
      },
    })
  }, [initializePayment, planKey, userId, onSuccess, onError, setLoading])

  if (!IS_READY) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        Paystack not configured. Set VITE_PAYSTACK_PUBLIC_KEY.
      </div>
    )
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3 rounded-xl bg-[#0ba4db] hover:bg-[#0993c4] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <>🏦 Pay with Paystack</>}
    </button>
  )
}
