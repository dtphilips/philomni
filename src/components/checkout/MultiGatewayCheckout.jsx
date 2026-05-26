import React, { useState, useEffect, useMemo } from 'react'
import { X, Globe, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  getPaymentGateway,
  getPriceForCountry,
  resolveCountry,
  storeCountry,
  COUNTRY_LIST,
  GATEWAY_META,
} from '../../lib/paymentGateway'
import { PLAN_META, PRICE_IDS } from '../../lib/plans'
import PaystackCheckout    from './PaystackCheckout'
import FlutterwaveCheckout from './FlutterwaveCheckout'
import PayPalCheckout      from './PayPalCheckout'

const STRIPE_READY =
  !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
  !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('your-')

/**
 * MultiGatewayCheckout
 *
 * Orchestrating modal that:
 *   1. Detects the user's country (DB > localStorage > timezone > 'US')
 *   2. Routes to the correct payment gateway
 *   3. Shows local currency pricing
 *   4. Lets the user manually change their country
 *   5. On success: calls onSuccess({ plan })
 *
 * Props:
 *   planKey     string  — 'pro' | 'promax'
 *   billing     string  — 'monthly' | 'annual'
 *   user        object  — Supabase user (with user.country if saved)
 *   onSuccess   fn
 *   onClose     fn
 */
export default function MultiGatewayCheckout({ planKey, billing, user, onSuccess, onClose }) {
  const [country,        setCountry]        = useState(() => resolveCountry(user?.country))
  const [showPicker,     setShowPicker]     = useState(false)
  const [pickerQuery,    setPickerQuery]    = useState('')
  const [loading,        setLoading]        = useState(false)
  const [stripeLoading,  setStripeLoading]  = useState(false)

  // Re-resolve if user profile loads country after mount
  useEffect(() => {
    if (user?.country) setCountry(user.country)
  }, [user?.country])

  const gateway  = getPaymentGateway(country)
  const priceInfo = getPriceForCountry(country, planKey, billing)
  const planMeta  = PLAN_META[planKey]

  // Paystack expects minor units (kobo/pesewas), Flutterwave expects major units
  const paystackAmount = useMemo(() => {
    // NGN, GHS, ZAR, KES, RWF, XOF — all multiply by 100 for minor unit
    return Math.round(priceInfo.amount * 100)
  }, [priceInfo.amount])

  const handleCountryChange = (code) => {
    setCountry(code)
    storeCountry(code)
    setShowPicker(false)
    setPickerQuery('')
  }

  const handleSuccess = ({ plan }) => {
    toast.success(`🎉 You're now on ${PLAN_META[plan]?.name || plan}!`)
    onSuccess?.({ plan })
    onClose?.()
  }

  const handleError = (msg) => {
    toast.error(msg || 'Payment failed. Please try again.')
  }

  // Stripe checkout (server-side redirect)
  const handleStripeCheckout = async () => {
    if (!STRIPE_READY) {
      toast.info('Stripe payments are not configured yet.')
      return
    }
    const priceIdKey = `${planKey}_${billing === 'annual' ? 'annual' : 'monthly'}`
    const priceId    = PRICE_IDS[priceIdKey]

    setStripeLoading(true)
    try {
      const res  = await fetch('/api/stripe-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          priceId,
          plan:      planKey,
          userId:    user?.id,
          userEmail: user?.email,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      toast.error(`Checkout failed: ${err.message}`)
    } finally {
      setStripeLoading(false)
    }
  }

  const filteredCountries = useMemo(() => {
    if (!pickerQuery) return COUNTRY_LIST
    const q = pickerQuery.toLowerCase()
    return COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [pickerQuery])

  const selectedCountryMeta = COUNTRY_LIST.find(c => c.code === country)
  const gatewayMeta         = GATEWAY_META[gateway]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">
              Upgrade to {planMeta?.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Secure checkout</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Price display */}
          <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {planMeta?.name} · {billing === 'annual' ? 'Annual' : 'Monthly'}
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {priceInfo.display}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {billing === 'annual' ? 'year' : 'month'}
                </span>
              </p>
              {!priceInfo.isLocal && (
                <p className="text-xs text-muted-foreground mt-0.5">USD · billed in US dollars</p>
              )}
            </div>
            <div className="text-3xl">{billing === 'annual' ? '🎯' : '⚡'}</div>
          </div>

          {/* Country selector */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
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
                <div className="max-h-48 overflow-y-auto">
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
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">
              {gatewayMeta.emoji} Pay via {gatewayMeta.name} · {gatewayMeta.label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Payment button(s) */}
          {gateway === 'stripe' && (
            <button
              onClick={handleStripeCheckout}
              disabled={stripeLoading}
              className="w-full py-3 rounded-xl bg-[#635bff] hover:bg-[#5147f0] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {stripeLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                : <>💳 Pay with Stripe</>}
            </button>
          )}

          {gateway === 'paystack' && (
            <PaystackCheckout
              amount={paystackAmount}
              currency={priceInfo.currency}
              email={user?.email || ''}
              name={user?.user_metadata?.full_name || user?.email || ''}
              planKey={planKey}
              userId={user?.id || ''}
              onSuccess={handleSuccess}
              onError={handleError}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {gateway === 'flutterwave' && (
            <FlutterwaveCheckout
              amount={priceInfo.amount}
              currency={priceInfo.currency}
              email={user?.email || ''}
              name={user?.user_metadata?.full_name || user?.email || ''}
              phone={user?.user_metadata?.phone || ''}
              planKey={planKey}
              userId={user?.id || ''}
              onSuccess={handleSuccess}
              onError={handleError}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {gateway === 'paypal' && (
            <PayPalCheckout
              amount={priceInfo.amount}
              currency={priceInfo.currency}
              planKey={planKey}
              userId={user?.id || ''}
              onSuccess={handleSuccess}
              onError={handleError}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Secure, encrypted payment · 7-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  )
}
