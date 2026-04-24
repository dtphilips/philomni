import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { steps, workflowName } = await req.json();

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return Response.json({ error: 'No steps provided' }, { status: 400 });
    }

    // Create execution record
    const execution = await base44.entities.WorkflowExecution.create({
      user_id: user.id,
      workflow_id: 'inline',
      workflow_name: workflowName || 'Untitled',
      status: 'running',
      total_steps: steps.length,
      results: []
    });

    const results = [];
    let stepCount = 0;

    // Execute each step
    for (const step of steps) {
      if (!step.enabled) continue;

      try {
        let output = '';

        // Simulate step execution based on type
        switch (step.type) {
          case 'generate_blog':
            output = 'Blog post generated successfully';
            break;
          case 'generate_social':
            output = 'Social media posts created';
            break;
          case 'generate_script':
            output = 'Script generated';
            break;
          case 'schedule_publication':
            output = 'Publication scheduled';
            break;
          case 'export_content':
            output = 'Content exported';
            break;
          default:
            output = 'Step completed';
        }

        results.push({
          step_type: step.type,
          status: 'completed',
          output
        });

        stepCount++;

        // Update execution progress
        await base44.entities.WorkflowExecution.update(execution.id, {
          steps_completed: stepCount,
          results
        });
      } catch (stepError) {
        results.push({
          step_type: step.type,
          status: 'failed',
          error: stepError.message
        });

        // Update with error and mark as failed
        await base44.entities.WorkflowExecution.update(execution.id, {
          status: 'failed',
          error_message: `Step ${step.type} failed: ${stepError.message}`,
          results
        });

        return Response.json({
          success: false,
          message: `Workflow failed at step: ${step.type}`,
          executionId: execution.id
        });
      }
    }

    // Mark as completed
    await base44.entities.WorkflowExecution.update(execution.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Workflow completed successfully',
      executionId: execution.id,
      stepsCompleted: stepCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});