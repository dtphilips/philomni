const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { brandName, contactName, email, website, phone, packageInterest, budget, campaignGoal, message } = await req.json()

    const emailContent =
      `New Campaign Inquiry on Philomni!\n\n` +
      `Brand: ${brandName}\n` +
      `Contact: ${contactName}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone ?? 'Not provided'}\n` +
      `Website: ${website ?? 'Not provided'}\n` +
      `Package Interest: ${packageInterest ?? 'Not specified'}\n` +
      `Budget: ${budget ?? 'Not specified'}\n` +
      `Goal: ${campaignGoal ?? 'Not specified'}\n\n` +
      `Message:\n${message ?? '(none)'}\n\n` +
      `Reply directly to: ${email}`

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — inquiry email skipped')
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'no_resend_key' }), { headers: { 'Content-Type': 'application/json', ...CORS } })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Philomni <noreply@philomni.com>',
        to: 'support@philomni.com',
        reply_to: email,
        subject: `New Campaign Inquiry - ${brandName} (${packageInterest ?? 'general'})`,
        text: emailContent,
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      console.error('Resend error:', result)
      return new Response(JSON.stringify({ success: false, error: result }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } })
    }
    return new Response(JSON.stringify({ success: true, id: result.id }), { headers: { 'Content-Type': 'application/json', ...CORS } })
  } catch (err) {
    console.error('send-inquiry-email error:', err)
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } })
  }
})
