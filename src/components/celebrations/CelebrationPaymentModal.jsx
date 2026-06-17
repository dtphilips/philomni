import React, { useState, useMemo } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { X, Loader2, Lock, Globe } from 'lucide-react'
import { TIERS } from '../../lib/celebrations'
import {
  getPaymentGateway, resolveCountry, storeCountry,
  GATEWAY_META, COUNTRY_LIST,
} from '../../lib/paymentGateway'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
const FLW_KEY      = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || ''

// ── Paystack button (hook must live in its own component) ─────────────────────
function PaystackButton({ amount, email, reference, onSuccess, loading, setLoading }) {
  const config = {
    reference,
    email:     email || 'user@philomni.com',
    amount:    Math.round(amount * 100), // USD cents
    currency:  'USD',
    publicKey: PAYSTACK_KEY,
    metadata:  { custom_fields: [{ display_name: 'Product', variable_name: 'product', value: 'celebration' }] },
  }
  const initPaystack = usePaystackPayment(config)

  return (
    <button
      onClick={() => {
        setLoading(true)
        initPaystack({
          onSuccess: (txn) => { setLoading(false); onSuccess(txn) },
          onClose:   ()    => { setLoading(false) },
        })
      }}
      disabled={loading || !PAYSTACK_KEY}
      className="w-full py-3.5 rounded-xl bg-[#0ba4db] hover:bg-[#0993c4] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        : <>🏦 Pay ${amount} with Paystack</>}
    </button>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function CelebrationPaymentModal({
  tier,
  user,
  onPaid,               // called with { reference, gateway } on Paystack/Flutterwave success
  onCreatePending,      // async fn → returns celebrationId (used for Stripe redirect)
  onClose,
}) {
  const [country,      setCountry]      = useState(() => resolveCountry(user?.country))
  const [showPicker,   setShowPicker]   = useState(false)
  const [pickerQuery,  setPickerQuery]  = useState('')
  const [loading,      setLoading]      = useState(false)

  const tierInfo    = TIERS[tier]
  const gateway     = getPaymentGateway(country)
  const gatewayMeta = GATEWAY_META[gateway] || GATEWAY_META.paypal
  const reference   = useMemo(
    () => `philomni_cel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    [],
  )

  const selectedCountryMeta  = COUNTRY_LIST.find(c => c.code === country)
  const filteredCountries    = useMemo(() => {
    if (!pickerQuery) return COUNTRY_LIST
    const q = pickerQuery.toLowerCase()
    return COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [pickerQuery])

  const handleCountryChange = (code) => {
    setCountry(code)
    storeCountry(code)
    setShowPicker(false)
    setPickerQuery('')
  }

  // Paystack / Flutterwave success
  const handlePaystackSuccess = (txn) => {
    onPaid({ reference: txn.reference, gateway: 'paystack' })
  }
  const handleFlwSuccess = (res) => {
    onPaid({ reference: res.transaction_id?.toString() || res.tx_ref, gateway: 'flutterwave' })
  }

  // Stripe: create pending celebration first, then redirect to Stripe Checkout
  const handleStripeCheckout = async () => {
    setLoading(true)
    try {
      // Create the celebration record (pending) so we have an ID to pass to Stripe
      const celebrationId = await onCreatePending()
      if (!celebrationId) throw new Error('Could not create celebration record.')

      const origin = window.location.origin
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-celebration-checkout`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            tier,
            celebrationId,
            userId:     user?.id,
            userEmail:  user?.email,
            successUrl: `${origin}/celebrations/${celebrationId}?payment=success`,
            cancelUrl:  `${origin}/celebrations/create`,
          }),
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

  // Flutterwave via SDK (loaded via script tag if available)
  const handleFlutterwave = () => {
    if (!window.FlutterwaveCheckout) {
      alert('Flutterwave is loading. Please try again.')
      return
    }
    setLoading(true)
    window.FlutterwaveCheckout({
      public_key:      FLW_KEY,
      tx_ref:          reference,
      amount:          tierInfo.price,
      currency:        'USD',
      payment_options: 'card,mobilemoney,ussd',
      customer:        { email: user?.email || '', name: user?.full_name || '' },
      customizations:  { title: 'Philomni Celebration', description: `${tierInfo.label} tier`, logo: '' },
      callback: (res) => { setLoading(false); if (res.status === 'successful') handleFlwSuccess(res) },
      onclose:  ()    => { setLoading(false) },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Complete Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Goes live immediately after payment</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Tier summary */}
          <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{tierInfo.badge} {tierInfo.label} Tier</p>
              <p className="text-3xl font-black text-foreground">${tierInfo.price}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tierInfo.duration} days active</p>
            </div>
            <span className="text-5xl">{tierInfo.badge}</span>
          </div>

          {/* Country picker */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-sm"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Country:</span>
                <span className="text-foreground font-medium">
                  {selectedCountryMeta?.flag} {selectedCountryMeta?.name || country}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Change</span>
            </button>

            {showPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input
                    type="text"
                    placeholder="Search country…"
                    value={pickerQuery}
                    onChange={e => setPickerQuery(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleCountryChange(c.code)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors text-left ${
                        c.code === country ? 'text-primary font-medium bg-primary/5' : 'text-foreground'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {gateway === 'flutterwave' && FLW_KEY && (
            <button
              onClick={handleFlutterwave}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#f5a623] hover:bg-[#e0961e] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <>📱 Pay ${tierInfo.price} with Flutterwave</>}
            </button>
          )}

          {gateway === 'stripe' && (
            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#635bff] hover:bg-[#5147f0] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                : <>💳 Pay ${tierInfo.price} with Stripe</>}
            </button>
          )}

          {/* PayPal fallback — use Paystack if key exists */}
          {gateway === 'paypal' && PAYSTACK_KEY && (
            <PaystackButton
              amount={tierInfo.price}
              email={user?.email}
              reference={reference}
              onSuccess={handlePaystackSuccess}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {/* No gateway configured */}
          {gateway !== 'stripe' && !PAYSTACK_KEY && !FLW_KEY && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 text-center">
              Payment gateway not configured. Please contact support.
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
