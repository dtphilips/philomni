const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { fileName, fileSize } = await req.json()
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const token = Deno.env.get('CLOUDFLARE_STREAM_TOKEN')

    if (!accountId || !token) throw new Error('Cloudflare credentials not configured')

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': fileSize.toString(),
          'Upload-Metadata': `name ${btoa(fileName)}`,
        },
      },
    )

    const uploadUrl = response.headers.get('Location')
    const streamMediaId = response.headers.get('stream-media-id')

    if (!uploadUrl || !streamMediaId) {
      throw new Error('Failed to get upload URL from Cloudflare')
    }

    return new Response(
      JSON.stringify({ uploadUrl, streamMediaId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
