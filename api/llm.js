/**
 * Vercel Serverless Function — Claude LLM proxy
 * POST /api/llm  { prompt, response_json_schema? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, response_json_schema } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const systemPrompt = response_json_schema
      ? `You are a helpful AI assistant. Respond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`
      : 'You are a helpful AI assistant for Philomni, a global creator and professional platform. Be concise, helpful, and professional.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'LLM API error', details: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    // If a schema was requested, parse JSON
    if (response_json_schema) {
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        return res.status(200).json({ result: text });
      }
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error('[api/llm]', err);
    return res.status(500).json({ error: err.message });
  }
}
