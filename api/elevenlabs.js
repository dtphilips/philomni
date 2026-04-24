/**
 * Vercel Serverless Function — ElevenLabs TTS proxy
 * POST /api/elevenlabs  { action: "tts", text, voice_id?, settings? }
 * GET  /api/elevenlabs?action=voices
 */
export default async function handler(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // ── GET /api/elevenlabs?action=voices ────────────────────────────────────
  if (req.method === 'GET') {
    if (!apiKey) {
      return res.status(200).json({
        voices: [
          { voice_id: 'browser', name: 'Browser Default', category: 'browser' },
        ],
      });
    }

    try {
      const r = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });
      if (!r.ok) throw new Error(`ElevenLabs voices error: ${r.status}`);
      const data = await r.json();
      return res.status(200).json({ voices: data.voices ?? [] });
    } catch (err) {
      console.error('[api/elevenlabs] voices:', err);
      return res.status(502).json({ error: err.message });
    }
  }

  // ── POST /api/elevenlabs ─────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, text, voice_id = 'EXAVITQu4vr4xnSDxMaL', settings } = req.body ?? {};

  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  if (!apiKey) {
    return res.status(200).json({ error: 'ELEVENLABS_API_KEY not configured', fallback: true });
  }

  const voiceSettings = settings ?? {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  };

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[api/elevenlabs] TTS error:', err);
      return res.status(502).json({ error: 'TTS generation failed', details: err });
    }

    const audioBuffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('[api/elevenlabs]', err);
    return res.status(500).json({ error: err.message });
  }
}
