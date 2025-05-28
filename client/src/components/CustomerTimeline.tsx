import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Clock,
  Building,
  FolderPlus,
  Play,
  Calendar,
  Settings
} from "lucide-react";
import type { TimelineEvent } from "@shared/types";

const timelineEventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["phase-change", "project-added", "process-launched", "other"]),
  date: z.string().min(1, "Date is required"),
});

interface CustomerTimelineProps {
  customerId: string;
  timeline: TimelineEvent[];
}

const eventIcons = {
  "phase-change": Building,
  "project-added": FolderPlus,
  "process-launched": Play,
  "other": Settings,
};

const eventColors = {
  "phase-change": "text-blue-600 bg-blue-100",
  "project-added": "text-green-600 bg-green-100",
  "process-launched": "text-purple-600 bg-purple-100",
  "other": "text-gray-600 bg-gray-100",
};

export default function CustomerTimeline({ customerId, timeline }: CustomerTimelineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(timelineEventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "other" as const,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const eventData = {
        ...data,
        customerId,
        date: new Date(data.date).toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/timeline", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", { customerId }] });
      toast({
        title: "Success",
        description: "Timeline event created successfully",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timeline event",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = () => {
    form.reset({
      title: "",
      description: "",
      type: "other",
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const formatEventType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Sort timeline events by date (newest first)
  const sortedTimeline = [...(timeline || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Timeline</h4>
        <Button size="sm" onClick={handleOpenModal}>
          <Plus className="mr-2" size={16} />
          Add Event
        </Button>
      </div>
      
      <div className="space-y-4">
        {sortedTimeline?.map((event: TimelineEvent, index: number) => {
          const Icon = eventIcons[event.type as keyof typeof eventIcons] || Settings;
          const isLast = index === sortedTimeline.length - 1;
          
          return (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${eventColors[event.type as keyof typeof eventColors]}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-neutral-800">{event.title}</h5>
                        <div className="flex items-center text-xs text-neutral-500">
                          <Calendar className="mr-1" size={12} />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-neutral-600 mb-2">{event.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                          {formatEventType(event.type)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(event.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
        
        {(!timeline || timeline.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
              <h4 className="font-medium text-neutral-800 mb-2">No timeline events yet</h4>
              <p className="text-sm text-neutral-600 mb-4">
                Track important milestones and events in your customer relationship.
              </p>
              <Button size="sm" onClick={handleOpenModal}>
                <Plus className="mr-2" size={16} />
                Add First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter event title"
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
                placeholder="Enter event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select 
                value={form.watch("type")} 
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase-change">Phase Change</SelectItem>
                  <SelectItem value="project-added">Project Added</SelectItem>
                  <SelectItem value="process-launched">Process Launched</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
