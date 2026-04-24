import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audio_url, asset_id } = await req.json();

    if (!audio_url) {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }

    // Call LLM to analyze audio
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this audio file and provide detailed music/sound analysis in JSON format:
      
Audio URL: ${audio_url}

Provide analysis with the following structure:
{
  "genre": "primary genre",
  "secondary_genres": ["genre1", "genre2"],
  "tempo": number (BPM, or null if not detectable),
  "tempo_range": "slow|moderate|fast|very-fast",
  "mood": "primary mood",
  "mood_scores": {
    "energetic": 0-100,
    "calm": 0-100,
    "dark": 0-100,
    "happy": 0-100,
    "sad": 0-100,
    "aggressive": 0-100
  },
  "instrumentation": ["instrument1", "instrument2"],
  "key": "musical key or null",
  "description": "brief description of the audio",
  "confidence": 0-100
}

Be analytical and specific. If you cannot determine a value, use null.`,
      response_json_schema: {
        type: 'object',
        properties: {
          genre: { type: 'string' },
          secondary_genres: { type: 'array', items: { type: 'string' } },
          tempo: { type: ['number', 'null'] },
          tempo_range: { type: 'string' },
          mood: { type: 'string' },
          mood_scores: { type: 'object' },
          instrumentation: { type: 'array', items: { type: 'string' } },
          key: { type: ['string', 'null'] },
          description: { type: 'string' },
          confidence: { type: 'number' }
        }
      }
    });

    // Update the audio asset with analysis results
    if (asset_id) {
      await base44.entities.AudioAsset.update(asset_id, {
        genre: analysisResult.genre,
        secondary_genres: analysisResult.secondary_genres || [],
        tempo: analysisResult.tempo,
        tempo_range: analysisResult.tempo_range,
        mood: analysisResult.mood,
        mood_scores: analysisResult.mood_scores,
        instrumentation: analysisResult.instrumentation || [],
        key: analysisResult.key,
        analysis_confidence: analysisResult.confidence,
        is_analyzed: true,
        analysis_data: analysisResult,
        tags: [
          analysisResult.genre,
          analysisResult.mood,
          analysisResult.tempo_range,
          ...(analysisResult.instrumentation || [])
        ].filter(Boolean)
      });
    }

    return Response.json({ success: true, analysis: analysisResult });
  } catch (error) {
    console.error('Audio analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});