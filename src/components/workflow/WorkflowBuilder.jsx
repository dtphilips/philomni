import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, Plus, Trash2, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STEP_TYPES = [
  { id: 'generate_blog', label: 'Generate Blog Post', icon: '📝' },
  { id: 'generate_social', label: 'Create Social Posts', icon: '📱' },
  { id: 'generate_script', label: 'Write Script', icon: '🎬' },
  { id: 'schedule_publication', label: 'Schedule Publication', icon: '📅' },
  { id: 'export_content', label: 'Export Content', icon: '💾' }
];

export default function WorkflowBuilder({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  const handleAddStep = (stepType) => {
    const newStep = {
      id: `step_${Date.now()}`,
      order: steps.length,
      type: stepType,
      config: {},
      enabled: true
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (stepId) => {
    setSteps(steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i })));
  };

  const handleSaveWorkflow = async () => {
    if (!name.trim() || steps.length === 0) {
      toast.error('Enter name and add at least one step');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.ContentWorkflow.create({
        user_id: user.id,
        name,
        description,
        steps
      });

      toast.success('Workflow created!');
      setName('');
      setDescription('');
      setSteps([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to create workflow');
    }
    setLoading(false);
  };

  const handleExecuteWorkflow = async () => {
    if (steps.length === 0) {
      toast.error('Add steps to workflow first');
      return;
    }

    setExecuting(true);
    try {
      const user = await base44.auth.me();
      const execution = await base44.functions.invoke('executeWorkflow', {
        steps,
        workflowName: name || 'Untitled Workflow'
      });

      toast.success('Workflow execution started!');
      onSuccess?.();
    } catch (error) {
      toast.error(`Workflow failed: ${error.message}`);
    }
    setExecuting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Content Workflow</DialogTitle>
          <DialogDescription>Chain multiple content generation steps together</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Workflow Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Blog to Social Pipeline"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Available Steps</Label>
              <div className="grid grid-cols-2 gap-2">
                {STEP_TYPES.map(stepType => (
                  <Button
                    key={stepType.id}
                    variant="outline"
                    onClick={() => handleAddStep(stepType.id)}
                    disabled={loading}
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <span>{stepType.icon}</span>
                    <span className="text-xs">{stepType.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Workflow Sequence</Label>
              {steps.length === 0 ? (
                <div className="p-4 text-center rounded-lg border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Add steps above to create your workflow</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, idx) => {
                    const stepDef = STEP_TYPES.find(s => s.id === step.type);
                    return (
                      <div key={step.id}>
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                          <span className="text-lg">{stepDef?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{stepDef?.label}</p>
                            <p className="text-xs text-muted-foreground">Step {step.order + 1}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveStep(step.id)}
                            disabled={loading}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveWorkflow}
                disabled={loading || steps.length === 0}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Workflow
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">WORKFLOW NAME</p>
                <p className="font-semibold">{name || 'Untitled Workflow'}</p>
              </div>
              {description && (
                <div>
                  <p className="text-xs text-muted-foreground">DESCRIPTION</p>
                  <p className="text-sm">{description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2">STEPS ({steps.length})</p>
                <div className="space-y-2">
                  {steps.map((step, idx) => {
                    const stepDef = STEP_TYPES.find(s => s.id === step.type);
                    return (
                      <div key={step.id}>
                        <Badge variant="secondary">{stepDef?.label}</Badge>
                        {idx < steps.length - 1 && <ArrowDown className="w-3 h-3 my-1 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {steps.length > 0 && (
              <Button
                onClick={handleExecuteWorkflow}
                disabled={executing || !name}
                className="w-full gap-2"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test Run Workflow
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}