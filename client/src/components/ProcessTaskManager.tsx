import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import type { ProcessTask, Contact } from "@shared/types";

interface ProcessTaskManagerProps {
  processId: string;
  contacts?: Contact[];
}

export default function ProcessTaskManager({ processId, contacts = [] }: ProcessTaskManagerProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProcessTask | null>(null);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<ProcessTask | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tasks for this process
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [`/api/processes/${processId}/tasks`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/tasks`);
      return response.json();
    },
  });

  // Fetch task progress
  const { data: progress } = useQuery({
    queryKey: [`/api/processes/${processId}/progress`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/progress`);
      return response.json();
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      // DELETE returns 204 No Content, so no JSON to parse
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/progress`] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    setSelectedTask(null);
    setParentTaskForSubtask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: ProcessTask) => {
    setSelectedTask(task);
    setParentTaskForSubtask(null);
    setIsTaskModalOpen(true);
  };

  const handleAddSubtask = (parentTask: ProcessTask) => {
    setSelectedTask(null);
    setParentTaskForSubtask(parentTask);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task? This will also delete all subtasks.")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setParentTaskForSubtask(null);
  };

  if (tasksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Task Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusCounts = () => {
    const allTasks: ProcessTask[] = [];
    
    const flattenTasks = (taskList: ProcessTask[]) => {
      for (const task of taskList) {
        allTasks.push(task);
        if (task.subtasks && task.subtasks.length > 0) {
          flattenTasks(task.subtasks);
        }
      }
    };
    
    flattenTasks(tasks);

    return {
      total: allTasks.length,
      notStarted: allTasks.filter(t => t.status === 'Not Started').length,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      completed: allTasks.filter(t => t.status === 'Completed').length,
      blocked: allTasks.filter(t => t.status === 'Blocked').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Task Management</span>
            </CardTitle>
            <Button onClick={handleCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          {progress && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Progress Overview</h4>
                <span className="text-2xl font-bold text-blue-600">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {progress.completed} of {progress.total} tasks completed
              </div>
            </div>
          )}

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Not Started ({statusCounts.notStarted})</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-blue-600" />
              <span className="text-sm text-gray-600">In Progress ({statusCounts.inProgress})</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-sm text-gray-600">Completed ({statusCounts.completed})</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-sm text-gray-600">Blocked ({statusCounts.blocked})</span>
            </div>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first task to start tracking progress on this process.
              </p>
              <Button onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  contacts={contacts}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onAddSubtask={handleAddSubtask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        processId={processId}
        task={selectedTask}
        parentTask={parentTaskForSubtask}
        contacts={contacts}
      />
    </>
  );
}