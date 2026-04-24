/**
 * Vercel Serverless Function — Daily.co room creation
 * POST /api/daily-room  { name, properties? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, properties = {} } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const apiKey = process.env.DAILY_API_KEY;
  const domain = process.env.DAILY_DOMAIN || 'philomni';

  if (!apiKey) {
    // Fallback URL for dev / no API key
    return res.status(200).json({ url: `https://demo.daily.co/${name}`, name });
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        privacy: 'public',
        properties: {
          max_participants: properties.max_participants || 50,
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: properties.enable_recording || false,
          exp: properties.exp || Math.floor(Date.now() / 1000) + 4 * 60 * 60,
          start_video_off: false,
          start_audio_off: false,
          ...properties,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Daily.co API error', details: err });
    }

    const data = await response.json();
    return res.status(200).json({ url: data.url, name: data.name });
  } catch (err) {
    console.error('[api/daily-room]', err);
    return res.status(500).json({ error: err.message });
  }
}
