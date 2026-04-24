import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return Response.json({ error: 'videoUrl required' }, { status: 400 });
    }

    // Use AI to generate captions from video
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional video caption generator. Analyze the provided video and generate accurate captions with timestamps.

Return a JSON array with this structure:
[
  { "startTime": 0, "endTime": 2, "text": "Caption text here" },
  { "startTime": 2, "endTime": 5, "text": "Next caption" }
]

Video URL: ${videoUrl}

Guidelines:
- Generate captions for speech and important sounds
- Keep captions concise (max 40 characters per line)
- Include accurate timestamps
- Use natural language`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          captions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                startTime: { type: 'number' },
                endTime: { type: 'number' },
                text: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      captions: result.captions || [],
      status: 'success'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});