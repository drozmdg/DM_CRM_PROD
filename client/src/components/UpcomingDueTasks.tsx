import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, User, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ProcessTask, TaskStatus, Contact } from "@shared/types";

interface UpcomingDueTasksProps {
  processId: string;
  contacts?: Contact[];
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'Completed':
      return <CheckCircle className="text-green-600" size={14} />;
    case 'In Progress':
      return <Clock className="text-blue-600" size={14} />;
    case 'Blocked':
      return <AlertCircle className="text-red-600" size={14} />;
    default:
      return <AlertCircle className="text-gray-400" size={14} />;
  }
}

function getStatusColor(status: TaskStatus) {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function flattenTasks(tasks: ProcessTask[]): ProcessTask[] {
  const flattened: ProcessTask[] = [];
  
  function flatten(taskList: ProcessTask[]) {
    for (const task of taskList) {
      flattened.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        flatten(task.subtasks);
      }
    }
  }
  
  flatten(tasks);
  return flattened;
}

export default function UpcomingDueTasks({ processId, contacts = [] }: UpcomingDueTasksProps) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: [`/api/processes/${processId}/tasks`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/tasks`);
      return response.json();
    },
  });

  // Process tasks to get upcoming due dates
  const upcomingTasks = (() => {
    if (!tasks.length) return [];
    
    const allTasks = flattenTasks(tasks);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for better comparison
    
    // Filter tasks with due dates in the future and not completed
    const tasksWithDueDates = allTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Set to start of day
      
      return dueDate >= today && task.status !== 'Completed';
    });
    
    // Sort by due date (earliest first)
    const sortedTasks = tasksWithDueDates.sort((a, b) => 
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
    
    // Return first 3
    return sortedTasks.slice(0, 3);
  })();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarClock size={18} />
            <span>Upcoming Due Tasks</span>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarClock size={18} />
            <span>Upcoming Due Tasks</span>
          </div>
          <Badge variant="outline">{upcomingTasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-4">
            {upcomingTasks.map((task) => {
              const assignedContact = task.assignedToId 
                ? contacts.find(c => c.id === task.assignedToId)
                : null;
              const daysUntilDue = getDaysUntilDue(task.dueDate!);
              
              return (
                <div key={task.id} className="flex items-start justify-between p-3 border border-neutral-200 rounded-lg">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-800 truncate">{task.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        {assignedContact && (
                          <div className="flex items-center space-x-1 text-xs text-neutral-500">
                            <User size={12} />
                            <span>{assignedContact.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-medium text-neutral-800">
                      {new Date(task.dueDate!).toLocaleDateString()}
                    </div>
                    <div className={`text-xs ${daysUntilDue <= 1 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-neutral-500'}`}>
                      {daysUntilDue === 0 ? 'Due Today' : 
                       daysUntilDue === 1 ? 'Due Tomorrow' : 
                       `${daysUntilDue} days`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarClock className="mx-auto text-neutral-400 mb-2" size={32} />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No upcoming due tasks</h3>
            <p className="text-neutral-600">
              All tasks are either completed or don't have due dates set.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}