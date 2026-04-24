import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, status, current_section } = await req.json();

    if (!project_id || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if presence record exists
    const existingPresence = await base44.entities.WorkspacePresence.filter({
      workspace_id: project_id,
      user_id: user.id
    });

    let presence;
    if (existingPresence.length > 0) {
      presence = await base44.entities.WorkspacePresence.update(
        existingPresence[0].id,
        {
          status,
          current_section,
          last_seen: new Date().toISOString()
        }
      );
    } else {
      presence = await base44.entities.WorkspacePresence.create({
        workspace_id: project_id,
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url || '',
        status,
        current_section,
        last_seen: new Date().toISOString()
      });
    }

    return Response.json({ success: true, presence });
  } catch (error) {
    console.error('Update presence error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});