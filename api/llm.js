/**
 * Vercel Serverless Function — Claude LLM proxy
 *
 * POST /api/llm
 * Body:
 *   prompt            string   — current user message text (required unless content provided)
 *   content           array    — multipart content for current user message (vision etc.)
 *   system            string   — custom system prompt (overrides default)
 *   history           array    — prior messages [{role, content}] for multi-turn chat
 *   max_tokens        number   — max tokens to generate (default 4096)
 *   response_json_schema object — if set, forces JSON response matching the schema
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    prompt,
    content: userContent,
    response_json_schema,
    system,
    history = [],
    max_tokens,
  } = req.body;

  // Need at least one of: prompt or content
  const hasInput = prompt || (Array.isArray(userContent) && userContent.length > 0);
  if (!hasInput) return res.status(400).json({ error: 'prompt or content is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    // Determine system prompt:
    // 1. Caller-supplied `system` wins
    // 2. JSON schema mode uses schema-enforcement prompt
    // 3. Default Philomni assistant prompt
    let systemPrompt;
    if (system) {
      systemPrompt = system;
    } else if (response_json_schema) {
      systemPrompt = `You are a helpful AI assistant. Respond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`;
    } else {
      systemPrompt = 'You are a helpful AI assistant for Philomni, a global creator and professional platform. Be concise, helpful, and professional.';
    }

    // Build the current user message content.
    // userContent is an array (e.g. vision: [{type:'image',...},{type:'text',...}])
    // prompt is a plain string. Fall back gracefully.
    const currentContent = userContent || prompt;

    // Build messages: validated history + current user message
    const filteredHistory = history.filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && m.content
    );
    const messages = [
      ...filteredHistory,
      { role: 'user', content: currentContent },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'LLM API error', details: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    // If a JSON schema was requested, parse and return raw JSON
    if (response_json_schema) {
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        return res.status(200).json({ result: text });
      }
    }

    // Normal response: return both `result` (legacy) and `content` (new Philo field)
    return res.status(200).json({
      result: text,
      content: text,
      usage: data.usage,
    });
  } catch (err) {
    console.error('[api/llm]', err);
    return res.status(500).json({ error: err.message });
  }
}
