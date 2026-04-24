/**
 * Vercel Serverless Function — Runway ML video generation
 * POST /api/generate-video  { prompt, imageUrl?, style?, duration? }
 *
 * When imageUrl is provided → image-to-video (Gen-3 Alpha Turbo)
 * When only prompt is provided → text-to-video (uses a neutral seed image)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, imageUrl, duration = 5 } = req.body ?? {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status: 'mock',
    });
  }

  // Runway Gen-3 Alpha Turbo requires an input image.
  // For text-to-video, we use a neutral dark gradient as the seed image.
  const promptImage = imageUrl
    || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1280&q=80';

  const clampedDuration = Math.min(Math.max(parseInt(duration) || 5, 5), 10);

  try {
    // Step 1: Create generation task
    const createRes = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptImage,
        promptText: prompt,
        model: 'gen3a_turbo',
        duration: clampedDuration,
        ratio: '1280:768',
        watermark: false,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('[api/generate-video] Runway create error:', err);
      return res.status(502).json({ error: 'Runway API error', details: err });
    }

    const { id: taskId } = await createRes.json();

    // Step 2: Poll for completion (max 90s — 18 × 5s)
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });
      if (!pollRes.ok) continue;
      const task = await pollRes.json();

      if (task.status === 'SUCCEEDED') {
        return res.status(200).json({ video_url: task.output?.[0], status: 'complete' });
      }
      if (task.status === 'FAILED') {
        return res.status(502).json({ error: 'Video generation failed', details: task.failure });
      }
    }

    return res.status(202).json({
      status: 'processing',
      taskId,
      message: 'Video is still generating. Poll /api/video-status?taskId=... to check progress.',
    });
  } catch (err) {
    console.error('[api/generate-video]', err);
    return res.status(500).json({ error: err.message });
  }
}
