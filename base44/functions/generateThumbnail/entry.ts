import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    const isVideo = 'video_url' in data;
    const isProject = 'image_url' in data && 'prompt' in data;

    if (!isVideo && !isProject) {
      return Response.json({ error: 'Invalid item type' }, { status: 400 });
    }

    // Skip if thumbnail already exists
    const thumbnailField = isVideo ? data.thumbnail_url : data.style_id;
    if (thumbnailField && isVideo) {
      return Response.json({ status: 'skipped', reason: 'Thumbnail already exists' });
    }

    // Generate thumbnail prompt based on item content
    const sourceText = isVideo
      ? `Video titled "${data.title}" with description: ${data.description || data.prompt || 'No description'}`
      : `Generated image with prompt: "${data.prompt}" in style: ${data.style_label || 'default'}`;

    const promptResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a concise, visually descriptive prompt for an AI thumbnail image (512x512px) that represents this creative work. Focus on composition, colors, mood, and visual appeal that would attract viewers to click.

Work details: ${sourceText}

Respond with just the thumbnail image prompt, nothing else.`,
    });

    const thumbnailPrompt = promptResponse.trim();

    // Generate the thumbnail image
    const imageResponse = await base44.integrations.Core.GenerateImage({
      prompt: thumbnailPrompt,
    });

    const thumbnailUrl = imageResponse.url;

    // Update the item with the generated thumbnail
    if (isVideo) {
      await base44.asServiceRole.entities.SharedVideo.update(data.id, {
        thumbnail_url: thumbnailUrl,
      });
    } else {
      await base44.asServiceRole.entities.SharedProject.update(data.id, {
        thumbnail_url: thumbnailUrl,
      });
    }

    return Response.json({
      status: 'success',
      itemId: data.id,
      itemType: isVideo ? 'video' : 'project',
      thumbnailUrl: thumbnailUrl,
    });
  } catch (error) {
    return Response.json(
      { error: error.message, status: 'failed' },
      { status: 500 }
    );
  }
});