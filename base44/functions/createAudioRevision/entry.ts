import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      project_id,
      audio_url,
      snapshot_name,
      description,
      timeline_comments,
      edits_data,
      metadata,
      is_auto_save = false
    } = await req.json();

    if (!project_id || !audio_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current highest revision number
    const existingRevisions = await base44.entities.AudioRevision.filter(
      { project_id },
      '-revision_number',
      1
    );

    const nextRevisionNumber = existingRevisions.length > 0
      ? existingRevisions[0].revision_number + 1
      : 1;

    // Mark any previous 'current' revision as not current
    if (!is_auto_save) {
      const currentRevisions = await base44.entities.AudioRevision.filter({
        project_id,
        is_current: true
      });

      for (const rev of currentRevisions) {
        await base44.entities.AudioRevision.update(rev.id, { is_current: false });
      }
    }

    // Create new revision
    const revision = await base44.entities.AudioRevision.create({
      project_id,
      creator_id: user.id,
      revision_number: nextRevisionNumber,
      snapshot_name: snapshot_name || `Revision ${nextRevisionNumber}`,
      description,
      audio_url,
      timeline_comments: timeline_comments || [],
      edits_data: edits_data || {},
      metadata: metadata || {},
      is_auto_save,
      is_current: !is_auto_save
    });

    return Response.json({
      success: true,
      revision: revision
    });
  } catch (error) {
    console.error('Create revision error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});