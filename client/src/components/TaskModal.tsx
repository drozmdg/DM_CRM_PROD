import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProcessTask, TaskStatus, TaskPriority, Contact } from "@shared/types";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["Not Started", "In Progress", "Completed", "Blocked"]),
  priority: z.enum(["Low", "Medium", "High"]),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
});

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  task?: ProcessTask | null;
  parentTask?: ProcessTask | null;
  contacts?: Contact[];
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  processId, 
  task, 
  parentTask,
  contacts = [] 
}: TaskModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Not Started" as TaskStatus,
      priority: "Medium" as TaskPriority,
      assignedToId: "unassigned",
      dueDate: "",
      completedDate: "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "Not Started",
        priority: task.priority || "Medium",
        assignedToId: task.assignedToId || "unassigned",
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : "",
        completedDate: task.completedDate ? task.completedDate.split('T')[0] : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "Not Started",
        priority: "Medium",
        assignedToId: "unassigned",
        dueDate: "",
        completedDate: "",
      });
    }
  }, [task, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const taskData = {
        ...data,
        processId,
        parentTaskId: parentTask?.id || null,
        dueDate: data.dueDate || null,
        completedDate: data.completedDate || null,
        assignedToId: data.assignedToId === "unassigned" ? null : data.assignedToId || null,
        description: data.description || null,
      };

      const url = task ? `/api/tasks/${task.id}` : `/api/processes/${processId}/tasks`;
      const method = task ? "PUT" : "POST";
      const response = await apiRequest(method, url, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/progress`] });
      toast({
        title: "Success",
        description: `Task ${task ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${task ? "update" : "create"} task`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const modalTitle = task 
    ? "Edit Task" 
    : parentTask 
      ? `Add Subtask to "${parentTask.title}"`
      : "Create New Task";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Enter task title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={form.watch("status")} 
                onValueChange={(value) => form.setValue("status", value as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={form.watch("priority")} 
                onValueChange={(value) => form.setValue("priority", value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assignedToId">Assigned To</Label>
            <Select 
              value={form.watch("assignedToId") || "unassigned"} 
              onValueChange={(value) => form.setValue("assignedToId", value === "unassigned" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
            </div>

            <div>
              <Label htmlFor="completedDate">Completed Date</Label>
              <Input
                id="completedDate"
                type="date"
                {...form.register("completedDate")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : task ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}