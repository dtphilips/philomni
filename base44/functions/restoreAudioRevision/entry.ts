import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { revision_id, project_id } = await req.json();

    if (!revision_id || !project_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the revision to restore
    const revisions = await base44.entities.AudioRevision.filter({
      id: revision_id,
      project_id,
      creator_id: user.id
    });

    if (revisions.length === 0) {
      return Response.json({ error: 'Revision not found' }, { status: 404 });
    }

    const revision = revisions[0];

    // Mark the revision as current
    await base44.entities.AudioRevision.update(revision_id, {
      is_current: true
    });

    // Mark all other revisions in this project as not current
    const otherRevisions = await base44.entities.AudioRevision.filter({
      project_id,
      creator_id: user.id
    });

    for (const rev of otherRevisions) {
      if (rev.id !== revision_id && rev.is_current) {
        await base44.entities.AudioRevision.update(rev.id, { is_current: false });
      }
    }

    return Response.json({
      success: true,
      message: `Restored to revision ${revision.revision_number}: ${revision.snapshot_name}`,
      revision: revision
    });
  } catch (error) {
    console.error('Restore revision error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});