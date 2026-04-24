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

    // Use InvokeLLM to process the video and extract speech
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all speech and dialogue from this video as a script with timestamps. Format as JSON with array of objects: [{start_time: seconds, end_time: seconds, text: "spoken text"}]. Be precise with timing.`,
      file_urls: [videoUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          captions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                start_time: { type: 'number' },
                end_time: { type: 'number' },
                text: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      captions: result.captions || []
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});