import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, file_name, file_url, file_type } = await req.json();

    if (!project_id || !file_name || !file_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the project
    const projects = await base44.entities.SharedAudioProject.filter({
      id: project_id
    });

    if (projects.length === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[0];

    // Create file entry
    const newFile = {
      id: `file_${Date.now()}`,
      file_name,
      file_url,
      file_type: file_type || 'audio',
      uploaded_by: user.id,
      uploaded_by_name: user.full_name,
      uploaded_at: new Date().toISOString()
    };

    // Add to shared_files array
    const updatedFiles = [...(project.shared_files || []), newFile];

    await base44.entities.SharedAudioProject.update(project_id, {
      shared_files: updatedFiles
    });

    return Response.json({
      success: true,
      file: newFile,
      message: `File "${file_name}" shared successfully`
    });
  } catch (error) {
    console.error('Share file error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});