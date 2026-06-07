import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Namecheap Private Email SMTP — same mailbox the signup confirmations use.
// Configurable via env, with sensible Namecheap defaults.
const SMTP_HOST = Deno.env.get('NAMECHEAP_SMTP_HOST') ?? 'smtp.privateemail.com'
const SMTP_PORT = Number(Deno.env.get('NAMECHEAP_SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('NAMECHEAP_EMAIL_USER') ?? 'noreply@philomni.com'
const SMTP_PASS = Deno.env.get('NAMECHEAP_EMAIL_PASSWORD') ?? ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { brandName, contactName, email, website, phone, packageInterest, budget, campaignGoal, message } = await req.json()

    // If the mailbox password isn't configured yet, skip gracefully —
    // the inquiry is still saved to the DB by the caller.
    if (!SMTP_PASS) {
      console.warn('NAMECHEAP_EMAIL_PASSWORD not set — inquiry email skipped')
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'no_smtp_password' }),
        { headers: { 'Content-Type': 'application/json', ...CORS } },
      )
    }

    const text =
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
      `---\nReply directly to: ${email}\n` +
      `This inquiry was submitted via philomni.com/advertise`

    const html =
      `<h2>New Campaign Inquiry on Philomni</h2>` +
      `<table cellpadding="6" style="border-collapse:collapse">` +
      `<tr><td><b>Brand</b></td><td>${brandName ?? ''}</td></tr>` +
      `<tr><td><b>Contact</b></td><td>${contactName ?? ''}</td></tr>` +
      `<tr><td><b>Email</b></td><td>${email ?? ''}</td></tr>` +
      `<tr><td><b>Phone</b></td><td>${phone ?? 'Not provided'}</td></tr>` +
      `<tr><td><b>Website</b></td><td>${website ?? 'Not provided'}</td></tr>` +
      `<tr><td><b>Package</b></td><td>${packageInterest ?? 'Not specified'}</td></tr>` +
      `<tr><td><b>Budget</b></td><td>${budget ?? 'Not specified'}</td></tr>` +
      `<tr><td><b>Goal</b></td><td>${campaignGoal ?? 'Not specified'}</td></tr>` +
      `</table>` +
      `<h3>Message</h3><p>${(message ?? '(none)').replace(/\n/g, '<br>')}</p>` +
      `<hr><p>Reply to: <a href="mailto:${email}">${email}</a></p>`

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port:     SMTP_PORT,
        tls:      SMTP_PORT === 465,          // implicit TLS on 465, STARTTLS on 587
        auth:     { username: SMTP_USER, password: SMTP_PASS },
      },
    })

    await client.send({
      from:    `Philomni <${SMTP_USER}>`,
      to:      'support@philomni.com',
      replyTo: email,
      subject: `New Campaign Inquiry - ${brandName} (${packageInterest ?? 'general'})`,
      content: text,
      html,
    })
    await client.close()

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...CORS } },
    )
  } catch (err) {
    // Never fail the inquiry — it's already saved to the DB by the caller.
    console.error('send-inquiry-email error:', err)
    return new Response(
      JSON.stringify({ success: true, emailError: (err as Error).message }),
      { headers: { 'Content-Type': 'application/json', ...CORS } },
    )
  }
})
