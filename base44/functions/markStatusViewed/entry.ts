import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statusId } = await req.json();

    if (!statusId) {
      return Response.json({ error: 'Status ID required' }, { status: 400 });
    }

    // Get current status
    const status = await base44.entities.Status.read(statusId);
    if (!status) {
      return Response.json({ error: 'Status not found' }, { status: 404 });
    }

    // Add viewer if not already viewed
    const viewers = status.viewer_ids || [];
    if (!viewers.includes(user.id)) {
      viewers.push(user.id);
      await base44.entities.Status.update(statusId, {
        viewer_ids: viewers,
        viewer_count: viewers.length
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});