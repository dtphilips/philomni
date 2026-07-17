// Memory Studio — Stage 3: Generate narration audio via ElevenLabs

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Curated ElevenLabs voices — warm, documentary, storytelling styles
const VOICE_IDS: Record<string, string> = {
  'Rachel — Warm & Clear':    '21m00Tcm4TlvDq8ikWAM',
  'Antoni — Calm & Deep':     'ErXwobaYiN019PkySvjV',
  'Bella — Soft & Intimate':  'EXAVITQu4vr4xnSDxMaL',
  'Josh — Documentary':       'TxGEqnHWrfWFTfGW9XjX',
  'Adam — Grounded':          'pNInz6obpgDQGcFmaJgB',
  'Elli — Gentle & Bright':   'MF3mGyEYCl7XYWbV9V6O',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { lines, voiceName } = await req.json()
    // lines: Array<{ id: string, text: string }>

    if (!lines?.length) throw new Error('No narration lines provided')

    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenKey) throw new Error('ELEVENLABS_API_KEY not configured')

    const voiceId = VOICE_IDS[voiceName] || VOICE_IDS['Rachel — Warm & Clear']

    const results: Array<{ id: string, audioBase64: string }> = []

    for (const line of lines) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: line.text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.80,
              style: 0.35,
              use_speaker_boost: true,
            },
          }),
        },
      )

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`ElevenLabs error for line "${line.text}": ${err}`)
      }

      const audioBuffer = await res.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
      results.push({ id: line.id, audioBase64: base64 })
    }

    return new Response(
      JSON.stringify({ success: true, narrations: results }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
