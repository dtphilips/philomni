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

    const body = await req.json()
    const { action } = body

    // ── Create room + host token (for Live streaming) ─────────────────────────
    if (action === 'create') {
      const { liveId } = body
      if (!liveId) throw new Error('liveId required')

      const expiry = Math.floor(Date.now() / 1000) + 4 * 3600

      let room: any = null

      // Try with cloud recording first; fall back without it
      for (const enableRecording of [true, false]) {
        const roomBody: any = {
          properties: {
            exp: expiry,
            enable_screenshare: false,
            enable_chat: false,
            start_video_off: false,
            start_audio_off: false,
          },
        }
        if (enableRecording) roomBody.properties.enable_recording = 'cloud'

        const roomResp = await fetch(`${DAILY_BASE}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify(roomBody),
        })
        const data = await roomResp.json()
        if (data.url) { room = data; break }
        if (!enableRecording) throw new Error(`Daily.co room creation failed: ${JSON.stringify(data)}`)
      }

      // Host token — owner can broadcast video + audio
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

      await supabase.from('lives').update({
        room_url: room.url,
        room_name: room.name,
      }).eq('id', liveId)

      return new Response(
        JSON.stringify({ roomUrl: room.url, roomName: room.name, token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    // ── Create generic room (for Rooms / Meetings — no DB update) ─────────────
    } else if (action === 'create-generic') {
      const expiry = Math.floor(Date.now() / 1000) + 8 * 3600
      // Caller can pass type-specific overrides (e.g. audio-only, screenshare)
      const overrides = body.roomProps ?? {}

      const roomResp = await fetch(`${DAILY_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            exp: expiry,
            enable_screenshare: true,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            ...overrides,
          },
        }),
      })
      const room = await roomResp.json()
      if (!room.url) throw new Error(`Daily.co room creation failed: ${JSON.stringify(room)}`)

      // Host token
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

      return new Response(
        JSON.stringify({ roomUrl: room.url, roomName: room.name, token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    // ── Viewer join token ─────────────────────────────────────────────────────
    } else if (action === 'join') {
      const { roomName } = body
      if (!roomName) throw new Error('roomName required')

      const expiry = Math.floor(Date.now() / 1000) + 4 * 3600

      const tokenResp = await fetch(`${DAILY_BASE}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            is_owner: false,
            exp: expiry,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      })
      const { token } = await tokenResp.json()

      return new Response(
        JSON.stringify({ token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    // ── Delete room ───────────────────────────────────────────────────────────
    } else if (action === 'delete') {
      const { liveId, roomName: directRoomName } = body

      let roomName = directRoomName
      if (!roomName && liveId) {
        const { data: live } = await supabase.from('lives').select('room_name').eq('id', liveId).single()
        roomName = live?.room_name
      }

      if (roomName) {
        await fetch(`${DAILY_BASE}/rooms/${roomName}`, {
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
    console.error('create-live-room error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
