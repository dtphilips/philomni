/**
 * Vercel Serverless Function — Ideogram image generation proxy
 *
 * POST /api/image
 * Body:
 *   prompt  string  — description of the image to generate (required)
 *
 * Returns:
 *   { imageUrl: string, prompt: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // Works with either IDEOGRAM_API_KEY or VITE_IDEOGRAM_API_KEY in Vercel env vars
  const apiKey = process.env.IDEOGRAM_API_KEY || process.env.VITE_IDEOGRAM_API_KEY;
  if (!apiKey) {
    console.error('[api/image] IDEOGRAM_API_KEY not configured');
    return res.status(500).json({ error: 'Image generation is not configured. Add IDEOGRAM_API_KEY to your environment variables.' });
  }

  try {
    console.log('[api/image] Calling Ideogram API for prompt:', prompt.slice(0, 80));

    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          model: 'V_2',
          aspect_ratio: 'ASPECT_1_1',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[api/image] Ideogram error:', response.status, errText);
      return res.status(502).json({ error: 'Image generation failed', details: errText });
    }

    const data = await response.json();
    console.log('[api/image] Ideogram response keys:', Object.keys(data));

    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[api/image] No URL in Ideogram response:', JSON.stringify(data));
      return res.status(502).json({ error: 'No image URL returned from Ideogram' });
    }

    console.log('[api/image] Success — imageUrl:', imageUrl.slice(0, 80));
    return res.status(200).json({ imageUrl, prompt });
  } catch (err) {
    console.error('[api/image] Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
