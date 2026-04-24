import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, targetLanguage, contentType } = await req.json();

    if (!content || !targetLanguage) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use LLM to translate
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following ${contentType || 'content'} into ${targetLanguage}. 
Maintain the tone, style, and formatting. Provide only the translated content without any explanation:

${content}`,
      model: 'automatic'
    });

    return Response.json({
      success: true,
      translated_content: response,
      target_language: targetLanguage
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});