/**
 * Vercel Serverless Function — Ideogram image generation
 * POST /api/generate-image  { prompt, style?, size? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, style = 'REALISTIC', size = '1024x1024' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) {
    // Fallback: return a placeholder for dev environments
    return res.status(200).json({
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt).slice(0, 20)}/1024/1024`,
    });
  }

  // Ideogram V_2 valid style_type values: AUTO, GENERAL, REALISTIC, DESIGN, RENDER_3D, ANIME
  const styleMap = {
    photorealistic: 'REALISTIC',
    cinematic: 'REALISTIC',
    illustration: 'DESIGN',
    anime: 'ANIME',
    '3d': 'RENDER_3D',
    logo: 'DESIGN',
    editorial: 'GENERAL',
    abstract: 'GENERAL',
    fantasy: 'GENERAL',
    portrait: 'REALISTIC',
    nature: 'REALISTIC',
    neon: 'GENERAL',
    noir: 'REALISTIC',
  };

  const ideogramStyle = styleMap[style?.toLowerCase()] ?? 'AUTO';
  const [width, height] = (size || '1024x1024').split('x').map(Number);

  try {
    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          aspect_ratio: width >= height ? 'ASPECT_1_1' : 'ASPECT_9_16',
          model: 'V_2',
          magic_prompt_option: 'AUTO',
          style_type: ideogramStyle,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[api/generate-image] Ideogram error:', err);
      return res.status(502).json({ error: 'Image generation failed', details: err });
    }

    const data = await response.json();
    const url = data.data?.[0]?.url;
    if (!url) return res.status(502).json({ error: 'No image URL returned' });

    return res.status(200).json({ url });
  } catch (err) {
    console.error('[api/generate-image]', err);
    return res.status(500).json({ error: err.message });
  }
}
