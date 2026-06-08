import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const SMTP_HOST = Deno.env.get('NAMECHEAP_SMTP_HOST') ?? 'smtp.privateemail.com'
const SMTP_PORT = Number(Deno.env.get('NAMECHEAP_SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('NAMECHEAP_EMAIL_USER') ?? 'noreply@philomni.com'
const SMTP_PASS = Deno.env.get('NAMECHEAP_EMAIL_PASSWORD') ?? ''

const TEMPLATES: Record<string, (n: string, reason?: string) => { subject: string; body: string }> = {
  received: (n) => ({ subject: `Campaign received: ${n}`, body: `Hi,\n\nWe've received your campaign "${n}" and it's now under review. Our team reviews within 24 hours and you'll get an email once it's approved and live.\n\n— The Philomni Team` }),
  approved: (n) => ({ subject: `🎉 Campaign approved: ${n}`, body: `Hi,\n\nGreat news — your campaign "${n}" has been approved and is now live on Philomni. Track its performance under My Campaigns.\n\n— The Philomni Team` }),
  rejected: (n, reason) => ({ subject: `Campaign update: ${n}`, body: `Hi,\n\nUnfortunately your campaign "${n}" was not approved.\n\nReason: ${reason ?? 'Did not meet our advertising guidelines'}\n\nNo charge was made — your card authorization has been released. You're welcome to submit a revised campaign.\n\n— The Philomni Team` }),
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { type, advertiserEmail, campaignName, reason } = await req.json()
    const tpl = TEMPLATES[type]
    if (!tpl) throw new Error('Unknown email type')
    const { subject, body } = tpl(campaignName ?? 'your campaign', reason)
    const adminNote = `\n\n[admin copy] Campaign: ${campaignName} | type: ${type} | advertiser: ${advertiserEmail}`

    if (!SMTP_PASS) {
      console.warn('NAMECHEAP_EMAIL_PASSWORD not set — campaign email skipped')
      return new Response(JSON.stringify({ success: false, skipped: true }), { headers: { 'Content-Type': 'application/json', ...CORS } })
    }

    const client = new SMTPClient({ connection: { hostname: SMTP_HOST, port: SMTP_PORT, tls: SMTP_PORT === 465, auth: { username: SMTP_USER, password: SMTP_PASS } } })
    const recipients = [advertiserEmail, 'support@philomni.com'].filter(Boolean)
    for (const to of recipients) {
      await client.send({ from: `Philomni <${SMTP_USER}>`, to, subject, content: to === 'support@philomni.com' ? body + adminNote : body })
    }
    await client.close()
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...CORS } })
  } catch (err) {
    console.error('send-campaign-email error:', err)
    return new Response(JSON.stringify({ success: true, emailError: (err as Error).message }), { headers: { 'Content-Type': 'application/json', ...CORS } })
  }
})
