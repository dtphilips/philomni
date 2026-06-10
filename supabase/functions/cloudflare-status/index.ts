const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { cloudflareUid } = await req.json()
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const token = Deno.env.get('CLOUDFLARE_STREAM_TOKEN')
    const customerSubdomain = Deno.env.get('CLOUDFLARE_CUSTOMER_SUBDOMAIN') ?? 'customer-lrknbwoduz'

    if (!accountId || !token) throw new Error('Cloudflare credentials not configured')

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${cloudflareUid}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = await response.json()
    const video = data.result

    return new Response(
      JSON.stringify({
        status: video?.status?.state ?? 'processing',
        readyToStream: video?.readyToStream,
        duration: video?.duration,
        thumbnail: video?.thumbnail,
        embedUrl: `https://${customerSubdomain}.cloudflarestream.com/${cloudflareUid}/iframe`,
        playbackUrl: `https://${customerSubdomain}.cloudflarestream.com/${cloudflareUid}/manifest/video.m3u8`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
