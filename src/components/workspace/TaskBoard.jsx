import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

export default function TaskBoard({ workspaceId, collaborators }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: () => base44.entities.WorkspaceTask.filter({ workspace_id: workspaceId }, '-created_date'),
  });

  const createTaskMutation = useMutation({
    mutationFn: (title) => base44.entities.WorkspaceTask.create({
      workspace_id: workspaceId,
      title: title.trim(),
      status: 'todo',
      priority: 'medium',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      setNewTaskTitle('');
      setShowNewTask(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.WorkspaceTask.update(taskId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.WorkspaceTask.delete(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] }),
  });

  const statusGroups = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const statusConfig = {
    todo: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/50' },
    in_progress: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    review: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  };

  const priorityColor = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Task Board</h3>
        <Button size="sm" onClick={() => setShowNewTask(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {showNewTask && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <Input
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTaskTitle.trim()) {
                createTaskMutation.mutate(newTaskTitle);
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createTaskMutation.mutate(newTaskTitle)}
              disabled={!newTaskTitle.trim()}
            >
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewTask(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusGroups).map(([status, statusTasks]) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;

          return (
            <div key={status} className={`rounded-lg border-2 border-border p-4 ${config.bg}`}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                <span className="text-sm font-semibold capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="outline" className="ml-auto text-xs">{statusTasks.length}</Badge>
              </div>

              <div className="space-y-2">
                {statusTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                ) : (
                  statusTasks.map(task => (
                    <div key={task.id} className="bg-card rounded-lg p-3 border border-border space-y-2 hover:border-primary transition-colors">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="text-sm font-medium flex-1">{task.title}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {task.assigned_to && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {task.assigned_avatar ? (
                              <img src={task.assigned_avatar} alt={task.assigned_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium">{task.assigned_name?.[0]}</span>
                            )}
                          </div>
                          <span className="text-muted-foreground">{task.assigned_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <Badge variant="outline" className={`text-xs ${priorityColor[task.priority]}`}>
                            {task.priority}
                          </Badge>
                        )}
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <Select
                        value={status}
                        onValueChange={(newStatus) =>
                          updateTaskMutation.mutate({ taskId: task.id, updates: { status: newStatus } })
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}