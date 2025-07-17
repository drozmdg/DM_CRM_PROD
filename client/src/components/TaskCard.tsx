import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Pause
} from "lucide-react";
import type { ProcessTask, TaskStatus, TaskPriority } from "@shared/types";

interface TaskCardProps {
  task: ProcessTask;
  contacts?: any[];
  onEdit: (task: ProcessTask) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: ProcessTask) => void;
  level?: number;
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'Completed':
      return <CheckCircle className="text-green-600" size={16} />;
    case 'In Progress':
      return <Clock className="text-blue-600" size={16} />;
    case 'Blocked':
      return <AlertCircle className="text-red-600" size={16} />;
    default:
      return <Pause className="text-gray-400" size={16} />;
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

function getPriorityColor(priority: TaskPriority) {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
}

export default function TaskCard({ 
  task, 
  contacts = [], 
  onEdit, 
  onDelete, 
  onAddSubtask,
  level = 0 
}: TaskCardProps) {
  const assignedContact = task.assignedToId 
    ? contacts.find(c => c.id === task.assignedToId)
    : null;

  const marginLeft = level * 24; // Indent subtasks

  return (
    <div style={{ marginLeft: `${marginLeft}px` }}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(task.status)}
                <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {task.dueDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                {assignedContact && (
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{assignedContact.name}</span>
                  </div>
                )}
                {task.completedDate && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle size={12} />
                    <span>Completed: {new Date(task.completedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSubtask(task)}
                className="h-8 w-8 p-0"
              >
                <Plus size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="h-8 w-8 p-0"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Render subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-2">
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              contacts={contacts}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}