import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { creatorId, contentId, eventType, visitorId, country, device, referralSource, isConversion } = await req.json();

    if (!creatorId || !contentId || !eventType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AnalyticsEvent.create({
      creator_id: creatorId,
      content_id: contentId,
      event_type: eventType,
      visitor_id: visitorId || 'anonymous',
      visitor_country: country || null,
      visitor_device: device || 'desktop',
      referral_source: referralSource || 'direct',
      conversion: isConversion || false,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});