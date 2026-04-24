import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Zap } from 'lucide-react';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import WorkflowsList from '@/components/workflow/WorkflowsList';

export default function WorkflowAutomation() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="w-8 h-8" />
          Workflow Automation
        </h1>
        <p className="text-muted-foreground mt-1">Chain content generation steps together for end-to-end automation</p>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Templates</CardTitle>
          <CardDescription>Popular workflow combinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-sm">📝 Blog to Social</p>
              <p className="text-xs text-muted-foreground mt-1">Generate blog → social posts</p>
            </button>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-sm">🎬 Script to Schedule</p>
              <p className="text-xs text-muted-foreground mt-1">Write script → schedule publication</p>
            </button>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-sm">💼 Full Campaign</p>
              <p className="text-xs text-muted-foreground mt-1">Blog → social → schedule → export</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Your Workflows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Workflows</CardTitle>
            <CardDescription>Active automation sequences</CardDescription>
          </div>
          <Button
            onClick={() => setIsBuilderOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </Button>
        </CardHeader>
        <CardContent key={refreshKey}>
          <WorkflowsList />
        </CardContent>
      </Card>

      <WorkflowBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}