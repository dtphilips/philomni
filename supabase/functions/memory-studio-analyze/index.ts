// Memory Studio — Stage 1: Analyze video clips with Gemini
// Stage 2: Generate edit plan + narration with Claude

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OUTPUT_DURATIONS: Record<string, number> = {
  reel: 60,
  highlight: 180,
  documentary: 300,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { videoUrls, prompt, outputFormat, voiceName } = await req.json()

    if (!videoUrls?.length) throw new Error('No video URLs provided')

    const geminiKey  = Deno.env.get('GEMINI_API_KEY')
    const claudeKey  = Deno.env.get('ANTHROPIC_API_KEY')

    if (!geminiKey)  throw new Error('GEMINI_API_KEY not configured')
    if (!claudeKey)  throw new Error('ANTHROPIC_API_KEY not configured')

    // ── Stage 1: Analyze each clip with Gemini ────────────────────────────────
    const clipInventories: string[] = []

    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i]

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  fileData: {
                    mimeType: 'video/mp4',
                    fileUri: url,
                  },
                },
                {
                  text: `Analyze this video clip carefully. Return a structured inventory:

1. DURATION: How long is the clip?
2. LOCATION: Where does this appear to be filmed?
3. PEOPLE: Who is visible? How many? Any notable reactions or expressions?
4. TIMELINE: Break the clip into segments every 10-15 seconds. For each segment describe:
   - What is happening visually
   - Emotional tone (joyful, calm, chaotic, tender, funny, awe)
   - Audio: speech/laughter/ambient sound/silence
   - Visual quality: sharp and clear / shaky / dark / well-lit
5. BEST MOMENTS: The 2-3 specific timestamps that are most emotionally compelling or visually strong
6. AUDIO HIGHLIGHTS: Any laughter, speech, or ambient sound worth keeping in the final edit

Be specific with timestamps. Format: [MM:SS - MM:SS] description`,
                },
              ],
            }],
            generationConfig: { temperature: 0.2 },
          }),
        },
      )

      const geminiData = await geminiRes.json()
      const analysis = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || `Clip ${i + 1}: Analysis unavailable`
      clipInventories.push(`CLIP ${i + 1} (${url.split('/').pop()}):\n${analysis}`)
    }

    const fullInventory = clipInventories.join('\n\n---\n\n')
    const targetSeconds = OUTPUT_DURATIONS[outputFormat] || 180

    // ── Stage 2: Director — Claude generates edit plan + narration ────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a professional video editor and documentary filmmaker.
You have analyzed footage from multiple clips (inventory below) and must now produce a complete edit plan.

CREATIVE DIRECTION FROM CREATOR:
"${prompt}"

TARGET FORMAT: ${outputFormat} (${targetSeconds} seconds)

CLIP INVENTORY (from AI video analysis):
${fullInventory}

Produce a complete edit plan in this exact JSON structure:

{
  "title": "Short descriptive title for this video",
  "totalDuration": ${targetSeconds},
  "musicDirection": "Description of music mood, tempo, where it swells or fades",
  "segments": [
    {
      "id": 1,
      "name": "Segment name",
      "startTime": 0,
      "endTime": 22,
      "clips": [
        {
          "clipIndex": 1,
          "inPoint": "0:04",
          "outPoint": "0:10",
          "holdSeconds": 6,
          "notes": "Why this moment was chosen"
        }
      ],
      "pacing": "slow|medium|fast",
      "narrate": true,
      "narrationLine": "The exact words the narrator will say over this segment. Natural, warm, conversational.",
      "narrationTiming": "start|middle|end",
      "audioNote": "Keep original audio / mute / mix with music"
    }
  ],
  "closingNote": "What the final feeling should leave the viewer with"
}

Rules:
- Choose REAL clips and timestamps from the inventory — not guesses
- Only narrate where it adds something. Some moments should be silent or music-only
- Narration lines must sound natural when spoken aloud — no stiff phrasing
- Pacing should vary: slow for beauty/emotion, fast for energy/kids/action
- The edit should tell a story with a beginning, middle, and end
- Flag the single most emotionally powerful moment as the video's peak`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const rawPlan = claudeData?.content?.[0]?.text || ''

    // Extract JSON from Claude's response
    const jsonMatch = rawPlan.match(/\{[\s\S]*\}/)
    let editPlan = null
    if (jsonMatch) {
      try { editPlan = JSON.parse(jsonMatch[0]) } catch {}
    }

    return new Response(
      JSON.stringify({
        success: true,
        inventory: fullInventory,
        editPlan,
        rawPlan: editPlan ? null : rawPlan,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
