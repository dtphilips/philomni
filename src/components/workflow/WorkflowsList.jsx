import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowsList() {
  const [executing, setExecuting] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ContentWorkflow.filter({ user_id: user.id });
    }
  });

  const handleExecute = async (workflow) => {
    setExecuting(workflow.id);
    try {
      await base44.functions.invoke('executeWorkflow', {
        steps: workflow.steps,
        workflowName: workflow.name
      });

      await base44.entities.ContentWorkflow.update(workflow.id, {
        run_count: (workflow.run_count || 0) + 1
      });

      toast.success(`Workflow "${workflow.name}" started!`);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    } catch (error) {
      toast.error(`Failed to execute: ${error.message}`);
    }
    setExecuting(null);
  };

  const handleDelete = async (workflowId) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await base44.entities.ContentWorkflow.delete(workflowId);
      toast.success('Workflow deleted');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading workflows...</div>;
  }

  if (workflows.length === 0) {
    return (
      <div className="p-6 text-center rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">No workflows yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map(workflow => (
        <div
          key={workflow.id}
          className="p-4 rounded-lg border border-border hover:border-primary transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {workflow.steps.length} steps
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Ran {workflow.run_count || 0} times
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleExecute(workflow)}
                disabled={executing === workflow.id}
                className="gap-2"
              >
                {executing === workflow.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Run
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(workflow.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}