// Memory Studio — Analyze clips via frame extraction + Gemini vision + Claude director

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OUTPUT_DURATIONS: Record<string, number> = { reel: 60, highlight: 180, documentary: 300 }
const GEMINI_FILE_SIZE_LIMIT = 1_900_000_000 // 1.9 GB (Gemini Files API max is 2 GB)

// ── Gemini Files API: upload a video buffer and return its URI ─────────────
async function uploadToGeminiFiles(
  videoBytes: Uint8Array,
  mimeType: string,
  displayName: string,
  apiKey: string,
): Promise<string> {
  // Step 1: initiate resumable upload
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(videoBytes.length),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    },
  )
  const uploadUrl = initRes.headers.get('x-goog-upload-url')
  if (!uploadUrl) throw new Error('Gemini Files API did not return an upload URL')

  // Step 2: upload the bytes in one shot
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(videoBytes.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: videoBytes,
  })
  const fileInfo = await uploadRes.json()
  if (!fileInfo?.file?.uri) throw new Error(`Gemini file upload failed: ${JSON.stringify(fileInfo)}`)
  return fileInfo.file.uri
}

// ── Poll until file is ACTIVE (Gemini processes video async) ──────────────
async function waitForGeminiFile(fileUri: string, apiKey: string): Promise<void> {
  const fileName = fileUri.split('/files/')[1]
  for (let i = 0; i < 30; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${apiKey}`,
    )
    const data = await res.json()
    if (data?.state === 'ACTIVE') return
    if (data?.state === 'FAILED') throw new Error('Gemini file processing failed')
    await new Promise(r => setTimeout(r, 4000))
  }
  throw new Error('Gemini file processing timed out after 2 minutes')
}

// ── Analyze a clip that was uploaded to Supabase Storage ──────────────────
async function analyzeViaGeminiFile(
  clip: { name: string; storageUrl: string; size: number; duration: number | null },
  geminiKey: string,
  promptText: string,
): Promise<string> {
  // Download from Supabase Storage (server-to-server, fast same-region)
  const downloadRes = await fetch(clip.storageUrl, {
    headers: clip.size > GEMINI_FILE_SIZE_LIMIT
      ? { Range: `bytes=0-${GEMINI_FILE_SIZE_LIMIT}` }
      : {},
  })
  if (!downloadRes.ok) throw new Error(`Failed to download ${clip.name} from storage`)
  const videoBytes = new Uint8Array(await downloadRes.arrayBuffer())

  // Upload to Gemini Files API
  const fileUri = await uploadToGeminiFiles(videoBytes, 'video/mp4', clip.name, geminiKey)

  // Wait for Gemini to finish processing
  await waitForGeminiFile(fileUri, geminiKey)

  // Analyze with Gemini using the file URI (full native video understanding)
  const durStr = clip.duration
    ? `${Math.floor(clip.duration / 60)}:${String(Math.floor(clip.duration % 60)).padStart(2, '0')}`
    : 'unknown'

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this video clip. Name: "${clip.name}". Approximate duration: ${durStr}.

Return a structured inventory:
1. DURATION: Your estimate of total length
2. LOCATION: Where is this filmed?
3. PEOPLE: Who is visible, expressions, emotions?
4. TIMELINE: Key moments throughout the video — for each, note the timestamp, what's happening, emotional tone (joyful / calm / chaotic / tender / funny / awe-inspiring), and visual quality
5. BEST MOMENTS: The 3–5 timestamps most emotionally compelling or visually strong — be specific with timestamps in M:SS format
6. AUDIO: Key sounds, speech, laughter noted

Provide your structured analysis now:`,
            },
            { fileData: { fileUri, mimeType: 'video/mp4' } },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    },
  )
  const geminiData = await geminiRes.json()
  return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || `Clip ${clip.name}: Analysis unavailable`
}

// ── Analyze a clip via pre-extracted frames (small files, browser-side) ────
async function analyzeViaFrames(
  clip: { name: string; duration: number; frames: Array<{ timestamp: number; data: string }> },
  geminiKey: string,
): Promise<string> {
  const mins = Math.floor(clip.duration / 60)
  const secs = Math.floor(clip.duration % 60)
  const durStr = `${mins}:${String(secs).padStart(2, '0')}`

  const parts: any[] = [
    {
      text: `Analyze this video clip. Name: "${clip.name}". Duration: ${durStr}. I'm showing you ${clip.frames.length} frames sampled every ~12 seconds.

For each frame I label the timestamp. Using these frames, return a structured inventory:

1. DURATION: ${durStr}
2. LOCATION: Where is this filmed?
3. PEOPLE: Who is visible, expressions, emotions?
4. TIMELINE: For each timestamp I show you, describe:
   - What is visually happening
   - Emotional tone (joyful / calm / chaotic / tender / funny / awe-inspiring)
   - Visual quality (sharp / shaky / dark / well-lit)
5. BEST MOMENTS: The 3–5 timestamps most emotionally compelling or visually strong — be specific
6. AUDIO GUESS: Based on body language and context, what sounds/laughter/speech likely occurred?

Frames follow:`,
    },
  ]

  for (const frame of clip.frames) {
    const fm = Math.floor(frame.timestamp / 60)
    const fs = Math.floor(frame.timestamp % 60)
    parts.push({ text: `[${fm}:${String(fs).padStart(2, '0')}]` })
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: frame.data } })
  }
  parts.push({ text: 'Provide your structured analysis now:' })

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    },
  )
  const geminiData = await geminiRes.json()
  return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || `Clip ${clip.name}: Analysis unavailable`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { clips, prompt, outputFormat } = await req.json()
    if (!clips?.length) throw new Error('No clips provided')

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')
    if (!claudeKey) throw new Error('ANTHROPIC_API_KEY not configured')

    // ── Stage 1: Analyze each clip with Gemini ────────────────────────────────
    const clipInventories: string[] = []

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      let analysis: string

      if (clip.storageUrl) {
        // Large file uploaded to Supabase Storage → Gemini Files API (full video)
        analysis = await analyzeViaGeminiFile(clip, geminiKey, prompt)
      } else if (clip.frames?.length > 0) {
        // Small file → frames extracted in browser → inlineData
        analysis = await analyzeViaFrames(clip, geminiKey)
      } else {
        analysis = `Clip ${i + 1} (${clip.name}): No data available — file could not be read on this device.`
      }

      const durStr = clip.duration
        ? `${Math.floor(clip.duration / 60)}:${String(Math.floor(clip.duration % 60)).padStart(2, '0')}`
        : '?:??'
      clipInventories.push(`CLIP ${i + 1} (${clip.name}, ${durStr}):\n${analysis}`)
    }

    const fullInventory = clipInventories.join('\n\n---\n\n')
    const targetSeconds = OUTPUT_DURATIONS[outputFormat] || 180

    // ── Stage 2: Claude director builds the edit plan ─────────────────────────
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

CREATIVE DIRECTION FROM CREATOR:
"${prompt}"

TARGET FORMAT: ${outputFormat} (${targetSeconds} seconds total)

CLIP INVENTORY (from AI frame analysis):
${fullInventory}

Produce a complete edit plan in this exact JSON structure. Every timestamp must come from the inventory above — no guessing:

{
  "title": "Short descriptive title for this video",
  "totalDuration": ${targetSeconds},
  "musicDirection": "Music mood, tempo, where it swells or fades",
  "segments": [
    {
      "id": 1,
      "name": "Segment name",
      "startTime": 0,
      "endTime": 22,
      "clips": [
        {
          "clipIndex": 1,
          "inPoint": "1:24",
          "outPoint": "1:38",
          "notes": "Why this moment — what makes it great"
        }
      ],
      "pacing": "slow|medium|fast",
      "narrate": true,
      "narrationLine": "The exact words the narrator says. Natural, warm, conversational — written to be spoken aloud.",
      "narrationTiming": "start|middle|end",
      "audioNote": "Keep original audio / mute / mix with music"
    }
  ],
  "closingNote": "What feeling to leave the viewer with"
}

Rules:
- inPoint and outPoint must be in "M:SS" format (e.g. "1:24", "0:08", "12:03")
- clipIndex is 1-based — clip 1, clip 2, etc.
- Only add narration where it genuinely adds something — some moments should be silent or music-only
- Narration lines must sound natural spoken aloud — no stiff phrasing
- Vary pacing: slow for beauty/emotion, fast for energy/kids/action
- Tell a real story: beginning, middle, end
- Return ONLY the JSON object, nothing else`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const rawPlan = claudeData?.content?.[0]?.text || ''

    const jsonMatch = rawPlan.match(/\{[\s\S]*\}/)
    let editPlan = null
    if (jsonMatch) {
      try { editPlan = JSON.parse(jsonMatch[0]) } catch { /* ignore parse errors */ }
    }

    return new Response(
      JSON.stringify({ success: true, inventory: fullInventory, editPlan, rawPlan: editPlan ? null : rawPlan }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
