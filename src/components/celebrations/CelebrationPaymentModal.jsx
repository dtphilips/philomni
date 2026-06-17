import React, { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { X, Loader2, Lock } from 'lucide-react'
import { TIERS } from '../../lib/celebrations'
import { getPaymentGateway, resolveCountry, GATEWAY_META } from '../../lib/paymentGateway'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
const FLW_KEY      = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || ''

// Paystack inner component — hook must live at top level of a component
function PaystackButton({ amount, email, reference, onSuccess, onClose, loading, setLoading }) {
  const config = {
    reference,
    email: email || 'user@philomni.com',
    amount: Math.round(amount * 100), // USD cents (Paystack USD mode)
    currency: 'USD',
    publicKey: PAYSTACK_KEY,
    metadata: {
      custom_fields: [
        { display_name: 'Product', variable_name: 'product', value: 'celebration' },
      ],
    },
  }
  const initPaystack = usePaystackPayment(config)

  return (
    <button
      onClick={() => {
        setLoading(true)
        initPaystack({
          onSuccess: (txn) => { setLoading(false); onSuccess(txn) },
          onClose:   () =>    { setLoading(false); onClose() },
        })
      }}
      disabled={loading}
      className="w-full py-3.5 rounded-xl bg-[#0ba4db] hover:bg-[#0993c4] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <>🏦 Pay ${amount} with Paystack</>}
    </button>
  )
}

// Flutterwave button (uses SDK script loaded inline)
function FlutterwaveButton({ amount, email, name, reference, onSuccess, onClose, loading, setLoading }) {
  const handlePay = () => {
    if (!window.FlutterwaveCheckout) {
      alert('Flutterwave is loading, please try again in a moment.')
      return
    }
    setLoading(true)
    window.FlutterwaveCheckout({
      public_key:    FLW_KEY,
      tx_ref:        reference,
      amount,
      currency:      'USD',
      payment_options: 'card,mobilemoney,ussd',
      customer:      { email, name: name || '' },
      customizations: { title: 'Philomni Celebration', description: 'Celebration tier payment', logo: '' },
      callback: (response) => { setLoading(false); if (response.status === 'successful') onSuccess(response) },
      onclose:  () => { setLoading(false); onClose() },
    })
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3.5 rounded-xl bg-[#f5a623] hover:bg-[#e0961e] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <>📱 Pay ${amount} with Flutterwave</>}
    </button>
  )
}

// Stripe redirect button
function StripeButton({ tier, user, loading, setLoading }) {
  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-celebration-checkout`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ tier, userId: user?.id, userEmail: user?.email }),
        },
      )
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      alert(`Stripe checkout failed: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3.5 rounded-xl bg-[#635bff] hover:bg-[#5147f0] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
        : <>💳 Pay ${TIERS[tier]?.price} with Stripe</>}
    </button>
  )
}

export default function CelebrationPaymentModal({ tier, user, onPaid, onClose }) {
  const [loading, setLoading] = useState(false)
  const tierInfo   = TIERS[tier]
  const country    = resolveCountry(user?.country)
  const gateway    = getPaymentGateway(country)
  const gatewayMeta = GATEWAY_META[gateway] || GATEWAY_META.paypal
  const reference  = `philomni_cel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const handlePaystackSuccess = (txn) => {
    onPaid({ reference: txn.reference, gateway: 'paystack' })
  }
  const handleFlwSuccess = (res) => {
    onPaid({ reference: res.transaction_id?.toString() || res.tx_ref, gateway: 'flutterwave' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Complete Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your celebration goes live immediately after payment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{tierInfo.badge} {tierInfo.label} Tier</p>
              <p className="text-3xl font-black text-foreground">${tierInfo.price}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tierInfo.duration} days active</p>
            </div>
            <span className="text-5xl">{tierInfo.badge}</span>
          </div>

          {/* Gateway label */}
          <p className="text-xs text-muted-foreground text-center">
            {gatewayMeta.emoji} Paying via {gatewayMeta.name} · {gatewayMeta.label}
          </p>

          {/* Pay buttons */}
          {gateway === 'paystack' && PAYSTACK_KEY && (
            <PaystackButton
              amount={tierInfo.price}
              email={user?.email}
              reference={reference}
              onSuccess={handlePaystackSuccess}
              onClose={() => {}}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {gateway === 'flutterwave' && FLW_KEY && (
            <FlutterwaveButton
              amount={tierInfo.price}
              email={user?.email}
              name={user?.full_name}
              reference={reference}
              onSuccess={handleFlwSuccess}
              onClose={() => {}}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {gateway === 'stripe' && (
            <StripeButton tier={tier} user={user} loading={loading} setLoading={setLoading} />
          )}

          {/* Fallback: if no key configured, show Paystack anyway (will show error when clicked) */}
          {gateway !== 'stripe' && !PAYSTACK_KEY && !FLW_KEY && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 text-center">
              Payment gateway not configured. Please contact support.
            </div>
          )}

          {/* PayPal fallback — use Paystack if key exists, otherwise message */}
          {gateway === 'paypal' && (
            PAYSTACK_KEY
              ? <PaystackButton
                  amount={tierInfo.price}
                  email={user?.email}
                  reference={reference}
                  onSuccess={handlePaystackSuccess}
                  onClose={() => {}}
                  loading={loading}
                  setLoading={setLoading}
                />
              : <div className="text-center text-xs text-muted-foreground py-2">
                  Card payment coming soon for your region.
                </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Secure, encrypted payment</span>
          </div>
        </div>
      </div>
    </div>
  )
}
