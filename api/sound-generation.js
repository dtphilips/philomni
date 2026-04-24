/**
 * Vercel Serverless Function — ElevenLabs Sound Effects / Music Generation
 * POST /api/sound-generation  { text, duration_seconds? }
 * Returns audio/mpeg binary
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, duration_seconds = 22 } = req.body ?? {};
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: 'ELEVENLABS_API_KEY not configured', fallback: true });
  }

  const clampedDuration = Math.min(Math.max(parseFloat(duration_seconds) || 22, 0.5), 22);

  try {
    const r = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        duration_seconds: clampedDuration,
        prompt_influence: 0.3,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[api/sound-generation] ElevenLabs error:', err);
      return res.status(502).json({ error: 'Sound generation failed', details: err });
    }

    const audioBuffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('[api/sound-generation]', err);
    return res.status(500).json({ error: err.message });
  }
}
