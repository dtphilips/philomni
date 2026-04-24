import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, itemType } = await req.json();

    if (!itemId || !itemType) {
      return Response.json({ error: 'Missing itemId or itemType' }, { status: 400 });
    }

    const entityName = itemType === 'project' ? 'ProjectCollaborator' : 'ScheduledPublicationCollaborator';
    const projectField = itemType === 'project' ? 'project_id' : 'scheduled_publication_id';

    // Check if user is the owner or a collaborator
    const query = {};
    query[projectField] = itemId;
    const collaborators = await base44.entities[entityName].filter(query);

    const userCollab = collaborators.find(c => c.collaborator_id === user.id);
    
    if (!userCollab) {
      return Response.json({ access: 'none' });
    }

    return Response.json({
      access: userCollab.role,
      status: userCollab.status,
      isAccepted: userCollab.status === 'accepted'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});