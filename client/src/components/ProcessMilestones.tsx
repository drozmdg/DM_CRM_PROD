import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Target,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProcessMilestone } from "@shared/types";

interface ProcessMilestonesProps {
  processId: string;
}

const MILESTONE_TYPES = [
  'Requirements Complete',
  'Requirements Approved Client',
  'Requirements Approved Dev',
  'Estimate Received',
  'Estimate Internal Partner Review',
  'Estimate Internal Approval Received',
  'Sprint(s) Confirmed',
  'Development Started',
  'Development Completed',
  'UAT Started',
  'UAT Approved',
  'Deployment Date',
  'Production Release Date',
  'Process Implementation Complete'
] as const;

const MILESTONE_DESCRIPTIONS = {
  'Requirements Complete': 'All requirements have been gathered and documented',
  'Requirements Approved Client': 'Client has approved the requirements',
  'Requirements Approved Dev': 'Development team has approved the requirements',
  'Estimate Received': 'Project estimate has been received from development team',
  'Estimate Internal Partner Review': 'Internal partner review of the estimate is complete',
  'Estimate Internal Approval Received': 'Internal approval for the estimate has been received',
  'Sprint(s) Confirmed': 'Development sprint(s) have been confirmed and scheduled',
  'Development Started': 'Development work has officially begun',
  'Development Completed': 'All development work has been completed',
  'UAT Started': 'User Acceptance Testing has begun',
  'UAT Approved': 'UAT has been completed and approved',
  'Deployment Date': 'Solution has been deployed to production',
  'Production Release Date': 'Solution is live and available to end users',
  'Process Implementation Complete': 'Process implementation is fully complete'
};

export default function ProcessMilestones({ processId }: ProcessMilestonesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProcessMilestone | null>(null);
  const [editingType, setEditingType] = useState<string>("");
  const [achievedDate, setAchievedDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch milestones for this process
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: [`/api/processes/${processId}/milestones`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/milestones`);
      return response.json();
    },
  });

  // Create or update milestone mutation
  const milestoneMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = selectedMilestone 
        ? `/api/processes/milestones/${selectedMilestone.id}`
        : `/api/processes/${processId}/milestones`;
      const method = selectedMilestone ? "PUT" : "POST";
      
      const payload = selectedMilestone ? data : { ...data, processId };
      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/milestones`] });
      toast({
        title: "Success",
        description: `Milestone ${selectedMilestone ? "updated" : "created"} successfully`,
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${selectedMilestone ? "update" : "create"} milestone`,
        variant: "destructive",
      });
    },
  });

  const handleEditMilestone = (milestoneType: string) => {
    const existing = milestones.find(m => m.milestoneType === milestoneType);
    setSelectedMilestone(existing || null);
    setEditingType(milestoneType);
    setAchievedDate(existing?.achievedDate ? existing.achievedDate.split('T')[0] : "");
    setNotes(existing?.notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const data: any = {
      milestoneType: editingType,
      notes: notes || null,
    };

    if (achievedDate) {
      data.achievedDate = achievedDate;
    } else if (selectedMilestone) {
      data.achievedDate = null; // Clear the date if being removed
    }

    milestoneMutation.mutate(data);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMilestone(null);
    setEditingType("");
    setAchievedDate("");
    setNotes("");
  };

  const getMilestoneStatus = (milestoneType: string) => {
    const milestone = milestones.find(m => m.milestoneType === milestoneType);
    return milestone?.achievedDate ? 'completed' : 'pending';
  };

  const getProjectDuration = () => {
    const completedMilestones = milestones.filter(m => m.achievedDate);
    if (completedMilestones.length < 2) return null;

    const dates = completedMilestones
      .map(m => new Date(m.achievedDate!))
      .sort((a, b) => a.getTime() - b.getTime());

    const start = dates[0];
    const end = dates[dates.length - 1];
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString(),
      days: diffDays
    };
  };

  const duration = getProjectDuration();
  const completedMilestones = milestones.filter(m => m.achievedDate).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Project Milestones</span>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Project Milestones</span>
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedMilestones} / {MILESTONE_TYPES.length} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Project Duration Summary */}
          {duration && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Project Duration</h4>
              </div>
              <p className="text-sm text-blue-700">
                From {duration.start} to {duration.end} ({duration.days} days)
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {Math.round((completedMilestones / MILESTONE_TYPES.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(completedMilestones / MILESTONE_TYPES.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Milestone List */}
          <div className="space-y-3">
            {MILESTONE_TYPES.map((milestoneType, index) => {
              const milestone = milestones.find(m => m.milestoneType === milestoneType);
              const isCompleted = getMilestoneStatus(milestoneType) === 'completed';
              
              return (
                <div
                  key={milestoneType}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{milestoneType}</h4>
                      <p className="text-sm text-gray-600">
                        {MILESTONE_DESCRIPTIONS[milestoneType]}
                      </p>
                      {milestone?.achievedDate && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Achieved: {new Date(milestone.achievedDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {milestone?.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          "{milestone.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMilestone(milestoneType)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Milestone Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMilestone ? "Update" : "Set"} Milestone
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {editingType}
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                {MILESTONE_DESCRIPTIONS[editingType as keyof typeof MILESTONE_DESCRIPTIONS]}
              </p>
            </div>

            <div>
              <Label htmlFor="achievedDate">Achievement Date</Label>
              <Input
                id="achievedDate"
                type="date"
                value={achievedDate}
                onChange={(e) => setAchievedDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this milestone..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={milestoneMutation.isPending}>
                {milestoneMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}