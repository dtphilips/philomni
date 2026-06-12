import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SMTP_HOST = Deno.env.get('NAMECHEAP_SMTP_HOST') ?? 'smtp.privateemail.com'
const SMTP_PORT = Number(Deno.env.get('NAMECHEAP_SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('NAMECHEAP_EMAIL_USER') ?? 'noreply@philomni.com'
const SMTP_PASS = Deno.env.get('NAMECHEAP_EMAIL_PASSWORD') ?? ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const {
      attendeeName,
      attendeeEmail,
      eventTitle,
      eventDate,
      eventType,      // 'virtual' | 'in-person'
      eventLocation,  // address for in-person, platform name for virtual
      joinUrl,        // only for virtual
      ticketRef,      // e.g. phi-evt-abc-usr-xyz
      status,         // 'FREE RSVP' | 'PAID'
      price,
    } = await req.json()

    if (!SMTP_PASS) {
      console.warn('NAMECHEAP_EMAIL_PASSWORD not set — ticket email skipped')
      return new Response(JSON.stringify({ success: false, skipped: true }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // QR code via free public API — encodes the ticket reference
    const qrData   = encodeURIComponent(JSON.stringify({ ref: ticketRef, event: eventTitle, attendee: attendeeName, status }))
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${qrData}`

    const isPhysical = eventType === 'in-person'
    const statusColor = status === 'PAID' ? '#7c3aed' : '#059669'
    const statusBg    = status === 'PAID' ? '#ede9fe' : '#d1fae5'

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid #2d2d4e">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 28px;text-align:center">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase">Philomni Events</p>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">Your Ticket 🎟</h1>
    </div>

    <!-- Ticket body -->
    <div style="padding:28px">
      <!-- Event title -->
      <h2 style="margin:0 0 4px;color:#fff;font-size:20px;font-weight:700">${eventTitle}</h2>
      <p style="margin:0 0 20px;color:#a0a0c0;font-size:14px">${eventDate}</p>

      <!-- Status badge -->
      <div style="display:inline-block;background:${statusBg};color:${statusColor};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:20px;letter-spacing:0.5px">
        ${status === 'PAID' ? '✓ PAID TICKET' : '✓ FREE RSVP CONFIRMED'}
      </div>

      <!-- Attendee info -->
      <div style="background:#0f0f1a;border-radius:12px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:1px">Attendee</p>
        <p style="margin:0;color:#fff;font-size:16px;font-weight:600">${attendeeName}</p>
      </div>

      <!-- Location / Join -->
      <div style="background:#0f0f1a;border-radius:12px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:1px">${isPhysical ? '📍 Venue' : '💻 How to Join'}</p>
        <p style="margin:0;color:#fff;font-size:14px;font-weight:500">${eventLocation ?? '—'}</p>
        ${!isPhysical && joinUrl ? `<a href="${joinUrl}" style="display:inline-block;margin-top:10px;background:#7c3aed;color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600">Join Event →</a>` : ''}
      </div>

      <!-- QR Code -->
      <div style="text-align:center;background:#fff;border-radius:16px;padding:20px;margin-bottom:20px">
        <img src="${qrImgUrl}" width="180" height="180" alt="QR Ticket" style="display:block;margin:0 auto 12px" />
        <p style="margin:0;color:#111;font-size:11px;font-family:monospace;letter-spacing:0.5px">${ticketRef}</p>
        ${isPhysical ? '<p style="margin:6px 0 0;color:#666;font-size:11px">Show this QR code at the door</p>' : ''}
      </div>

      ${status === 'PAID' && price ? `<p style="text-align:center;color:#a0a0c0;font-size:12px;margin:0 0 20px">Amount paid: <strong style="color:#fff">$${parseFloat(price).toFixed(2)}</strong></p>` : ''}

      <hr style="border:none;border-top:1px solid #2d2d4e;margin:0 0 20px">
      <p style="margin:0;color:#6b6b8a;font-size:12px;text-align:center;line-height:1.6">
        This ticket was issued by Philomni · <a href="https://philomni.com" style="color:#7c3aed">philomni.com</a><br>
        Questions? Reply to this email or contact the event organizer.
      </p>
    </div>
  </div>
</body>
</html>`

    const text = `
Your Ticket — ${eventTitle}

Attendee: ${attendeeName}
Date: ${eventDate}
Status: ${status}
${isPhysical ? `Venue: ${eventLocation ?? '—'}` : `Join: ${joinUrl ?? eventLocation ?? '—'}`}
Ticket Ref: ${ticketRef}

${isPhysical ? 'Show the QR code in the HTML version of this email at the door.' : ''}

— Philomni Events · philomni.com
`

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port:     SMTP_PORT,
        tls:      SMTP_PORT === 465,
        auth:     { username: SMTP_USER, password: SMTP_PASS },
      },
    })

    await client.send({
      from:    `Philomni Events <${SMTP_USER}>`,
      to:      attendeeEmail,
      subject: `🎟 Your ticket for "${eventTitle}"`,
      content: text,
      html,
    })
    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('send-event-ticket error:', err)
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
