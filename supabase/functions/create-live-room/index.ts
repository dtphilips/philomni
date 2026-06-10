import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_BASE = 'https://api.daily.co/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') ?? ''
    if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, liveId } = await req.json()

    if (action === 'create') {
      if (!liveId) throw new Error('liveId required')

      const expiry = Math.floor(Date.now() / 1000) + 4 * 3600 // 4hr

      // Create Daily.co room
      const roomResp = await fetch(`${DAILY_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            exp: expiry,
            enable_screenshare: false,
            enable_chat: false,
            start_video_off: false,
            start_audio_off: false,
            max_participants: 200,
          },
        }),
      })
      const room = await roomResp.json()
      if (!room.url) throw new Error(`Daily.co room creation failed: ${JSON.stringify(room)}`)

      // Create host token (owner = can broadcast)
      const tokenResp = await fetch(`${DAILY_BASE}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: room.name,
            is_owner: true,
            exp: expiry,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      })
      const { token } = await tokenResp.json()

      // Save room_url and room_name to lives table
      await supabase.from('lives').update({
        room_url: room.url,
        room_name: room.name,
      }).eq('id', liveId)

      return new Response(
        JSON.stringify({ roomUrl: room.url, roomName: room.name, token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    } else if (action === 'delete') {
      if (!liveId) throw new Error('liveId required')

      // Get room_name from DB
      const { data: live } = await supabase.from('lives').select('room_name').eq('id', liveId).single()
      if (live?.room_name) {
        await fetch(`${DAILY_BASE}/rooms/${live.room_name}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

  } catch (err: any) {
    console.error('create-live-room error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
