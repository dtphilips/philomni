import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalContent, originalType, contentId } = await req.json();

    if (!originalContent || !originalType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assets = {};
    const assetTypes = ['linkedin_thread', 'twitter_summary', 'video_script'];

    // Generate each asset type
    for (const assetType of assetTypes) {
      const prompt = getPromptForAssetType(assetType, originalContent, originalType);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      // Save asset to database
      await base44.entities.ContentAsset.create({
        user_id: user.id,
        original_content_id: contentId,
        original_type: originalType,
        asset_type: assetType,
        content: response.content,
        hashtags: response.hashtags || [],
        title: originalContent.split('\n')[0].substring(0, 100)
      });

      assets[assetType] = {
        content: response.content,
        hashtags: response.hashtags || []
      };
    }

    return Response.json({ success: true, assets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getPromptForAssetType(assetType, content, originalType) {
  const prompts = {
    linkedin_thread: `Convert this ${originalType} into a compelling LinkedIn thread (5-7 posts). 
Make it professional, engaging, and suitable for a professional audience. 
Include relevant hashtags. Format as individual numbered posts.

Original content:
${content}`,

    twitter_summary: `Create a Twitter-friendly summary (max 280 characters) and 3 follow-up tweet ideas of this ${originalType}. 
Make it catchy, engaging, and include relevant hashtags. Keep it concise and punchy.

Original content:
${content}`,

    video_script: `Convert this ${originalType} into a video script (3-5 minutes). 
Include scene descriptions, visuals, and voiceover directions. 
Make it engaging and suitable for YouTube or TikTok format.

Original content:
${content}`
  };

  return prompts[assetType] || prompts.twitter_summary;
}