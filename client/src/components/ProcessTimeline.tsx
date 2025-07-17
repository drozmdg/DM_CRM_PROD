import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar
} from "lucide-react";
import type { ProcessTimelineEvent, SDLCStage } from "@shared/types";

const timelineEventFormSchema = z.object({
  stage: z.enum(["Requirements", "Design", "Development", "Testing", "Deployment", "Maintenance"]),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

interface ProcessTimelineProps {
  processId: string;
  timeline: ProcessTimelineEvent[];
  currentStage: SDLCStage;
}

const stageOrder: SDLCStage[] = [
  "Requirements",
  "Design", 
  "Development",
  "Testing",
  "Deployment",
  "Maintenance"
];

const stageIcons = {
  "Requirements": Circle,
  "Design": Circle,
  "Development": Circle,
  "Testing": Circle,
  "Deployment": Circle,
  "Maintenance": Circle,
};

export default function ProcessTimeline({ processId, timeline, currentStage }: ProcessTimelineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(timelineEventFormSchema),
    defaultValues: {
      stage: "Requirements" as SDLCStage,
      description: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const eventData = {
        ...data,
        processId,
        date: new Date(data.date).toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/process-timeline", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      toast({
        title: "Success",
        description: "Timeline event added successfully",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add timeline event",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = () => {
    form.reset({
      stage: "Requirements",
      description: "",
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

  const getStageStatus = (stage: SDLCStage) => {
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "current";
    return "upcoming";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "current": return AlertCircle;
      default: return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "current": return "text-blue-600 bg-blue-100";
      default: return "text-gray-400 bg-gray-100";
    }
  };

  // Sort timeline events by date
  const sortedTimeline = [...(timeline || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Process Timeline</h4>
        <Button size="sm" onClick={handleOpenModal}>
          <Plus className="mr-2" size={16} />
          Add Event
        </Button>
      </div>

      {/* SDLC Stages Overview */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-neutral-600">SDLC Progress</h5>
        <div className="space-y-3">
          {stageOrder.map((stage, index) => {
            const status = getStageStatus(stage);
            const StatusIcon = getStatusIcon(status);
            const isLast = index === stageOrder.length - 1;
            
            return (
              <div key={stage} className="relative">
                {/* Connection line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
                    <StatusIcon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h6 className="font-medium text-neutral-800">{stage}</h6>
                      <Badge variant="outline" className={`${getStatusColor(status)} border-0`}>
                        {status}
                      </Badge>
                    </div>
                    {/* Show events for this stage */}
                    {sortedTimeline
                      .filter(event => event.stage === stage)
                      .map(event => (
                        <div key={event.id} className="mt-2 text-sm text-neutral-600">
                          <div className="flex items-center space-x-2">
                            <Calendar size={12} />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span>-</span>
                            <span>{event.description}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Timeline Events */}
      {sortedTimeline.length > 0 && (
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-neutral-600">Detailed Timeline</h5>
          {sortedTimeline.map((event: ProcessTimelineEvent) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">{event.stage}</Badge>
                      <span className="text-sm text-neutral-600">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-800">{event.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(!timeline || timeline.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <h4 className="font-medium text-neutral-800 mb-2">No timeline events yet</h4>
            <p className="text-sm text-neutral-600 mb-4">
              Track progress through each SDLC stage with timeline events.
            </p>
            <Button size="sm" onClick={handleOpenModal}>
              <Plus className="mr-2" size={16} />
              Add First Event
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="stage">SDLC Stage</Label>
              <Select 
                value={form.watch("stage")} 
                onValueChange={(value) => form.setValue("stage", value as SDLCStage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SDLC stage" />
                </SelectTrigger>
                <SelectContent>
                  {stageOrder.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe what happened in this stage"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
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
                {mutation.isPending ? "Adding..." : "Add Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
