import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, content, hashtags, audience } = await req.json();

    if (!action || !content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashtagString = hashtags?.length ? `Relevant hashtags: ${hashtags.join(', ')}` : '';
    const audienceString = audience ? `Target audience: ${audience}` : 'General audience';

    let prompt = '';

    switch (action) {
      case 'draft':
        prompt = `You are a social media expert. Help the user draft an engaging post based on their idea.

Idea: "${content}"
${hashtagString}
${audienceString}

Create a well-crafted, engaging social media post that:
- Is clear and compelling
- Uses proper tone for the target audience
- Includes natural calls-to-action
- Has good formatting with line breaks
- Incorporates the hashtags naturally if relevant

Return ONLY the post text, no explanations.`;
        break;

      case 'rewrite':
        prompt = `You are a social media copywriter. Improve this post to be more engaging and impactful.

Original post: "${content}"
${hashtagString}
${audienceString}

Rewrite the post to:
- Improve clarity and engagement
- Better match the target audience
- Strengthen the call-to-action
- Use more persuasive language
- Maintain the original meaning

Return ONLY the rewritten post text, no explanations.`;
        break;

      case 'summarize':
        prompt = `You are a content summarizer. Create a concise summary of this post.

Original post: "${content}"
${hashtagString}
${audienceString}

Create a brief, punchy summary that:
- Captures the main message in 1-2 sentences
- Is suitable for a preview or headline
- Maintains engagement
- Is under 100 characters if possible

Return ONLY the summary text, no explanations.`;
        break;

      case 'expand':
        prompt = `You are a content strategist. Expand this post to be more detailed and impactful.

Original post: "${content}"
${hashtagString}
${audienceString}

Expand the post to:
- Add more context and details
- Tell a more complete story
- Include benefits or insights
- Maintain engagement throughout
- Add formatting for readability

Return ONLY the expanded post text, no explanations.`;
        break;

      case 'tone':
        prompt = `You are a tone adjuster. Rewrite this post in a more professional but still engaging tone.

Original post: "${content}"
${hashtagString}
${audienceString}

Adjust the tone to be:
- More professional and credible
- Still engaging and conversational
- Appropriate for the target audience
- Maintain personality

Return ONLY the adjusted post text, no explanations.`;
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
    });

    return Response.json({
      action,
      result: result.trim(),
    });
  } catch (error) {
    console.error('Error in aiPostAssistant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});