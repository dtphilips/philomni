import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const { userId, accountNumber, bankCode, accountName } = await req.json()
    if (!userId || !accountNumber || !bankCode || !accountName) {
      throw new Error('userId, accountNumber, bankCode and accountName are required')
    }

    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')!

    // Create transfer recipient on Paystack
    const res = await fetch('https://api.paystack.co/transferrecipient', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type:           'nuban',
        name:           accountName,
        account_number: accountNumber,
        bank_code:      bankCode,
        currency:       'NGN',
      }),
    })

    const data = await res.json()
    if (!data.status) throw new Error(data.message ?? 'Paystack error')

    const recipientCode = data.data.recipient_code

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    await supabase.from('users').update({
      paystack_recipient_code: recipientCode,
      payout_provider:         'paystack',
      bank_connected:          true,
      bank_country:            'NG',
    }).eq('id', userId)

    return new Response(JSON.stringify({ success: true, recipient_code: recipientCode }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
