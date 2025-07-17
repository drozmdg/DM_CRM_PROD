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
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar
} from "lucide-react";
import type { ApprovalStatus } from "@shared/types";

const approvalFormSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected", "Not Required"]),
  approverNotes: z.string().optional(),
  approvedDate: z.string().optional(),
});

interface ProcessApprovalProps {
  processId: string;
  currentStatus: ApprovalStatus;
  approvedDate?: string;
  approverNotes?: string;
}

const statusIcons = {
  "Pending": Clock,
  "Approved": CheckCircle,
  "Rejected": XCircle,
  "Not Required": AlertCircle,
};

const statusColors = {
  "Pending": "text-yellow-600 bg-yellow-100",
  "Approved": "text-green-600 bg-green-100",
  "Rejected": "text-red-600 bg-red-100",
  "Not Required": "text-gray-600 bg-gray-100",
};

export default function ProcessApproval({ 
  processId, 
  currentStatus, 
  approvedDate, 
  approverNotes 
}: ProcessApprovalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      status: currentStatus,
      approverNotes: approverNotes || "",
      approvedDate: approvedDate || new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const approvalData = {
        ...data,
        approvedDate: data.status === "Approved" ? data.approvedDate : null,
      };
      
      const response = await apiRequest("PUT", `/api/processes/${processId}/approval`, approvalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      toast({
        title: "Success",
        description: "Approval status updated successfully",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = () => {
    form.reset({
      status: currentStatus,
      approverNotes: approverNotes || "",
      approvedDate: approvedDate || new Date().toISOString().split('T')[0],
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

  const StatusIcon = statusIcons[currentStatus];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Approval Workflow</h4>
        <Button size="sm" onClick={handleOpenModal}>
          Update Approval
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[currentStatus]}`}>
              <StatusIcon size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-neutral-800">Current Status</h5>
                <Badge variant="outline" className={`${statusColors[currentStatus]} border-0`}>
                  {currentStatus}
                </Badge>
              </div>
              
              {approvedDate && currentStatus === "Approved" && (
                <div className="flex items-center text-sm text-neutral-600 mb-2">
                  <Calendar className="mr-2" size={14} />
                  Approved on {new Date(approvedDate).toLocaleDateString()}
                </div>
              )}
              
              {approverNotes && (
                <div className="mt-2">
                  <p className="text-sm text-neutral-600 font-medium mb-1">Approver Notes:</p>
                  <p className="text-sm text-neutral-800 bg-neutral-50 p-2 rounded">
                    {approverNotes}
                  </p>
                </div>
              )}
              
              {currentStatus === "Pending" && (
                <p className="text-sm text-neutral-600 mt-2">
                  This process is awaiting approval before proceeding.
                </p>
              )}
              
              {currentStatus === "Not Required" && (
                <p className="text-sm text-neutral-600 mt-2">
                  No approval required for this process.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Workflow Steps */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-neutral-600">Approval Workflow</h5>
        
        <div className="space-y-2">
          {/* Step 1: Submission */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle size={14} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">Process Submitted</p>
              <p className="text-xs text-neutral-600">Process created and ready for review</p>
            </div>
          </div>
          
          {/* Step 2: Review */}
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStatus === "Pending" ? "bg-yellow-100 text-yellow-600" :
              currentStatus === "Approved" || currentStatus === "Rejected" ? "bg-green-100 text-green-600" :
              "bg-gray-100 text-gray-400"
            }`}>
              {currentStatus === "Pending" ? <Clock size={14} /> : 
               currentStatus === "Approved" || currentStatus === "Rejected" ? <CheckCircle size={14} /> :
               <User size={14} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">Under Review</p>
              <p className="text-xs text-neutral-600">
                {currentStatus === "Pending" ? "Awaiting approval decision" :
                 currentStatus === "Approved" || currentStatus === "Rejected" ? "Review completed" :
                 "No review required"}
              </p>
            </div>
          </div>
          
          {/* Step 3: Decision */}
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStatus === "Approved" ? "bg-green-100 text-green-600" :
              currentStatus === "Rejected" ? "bg-red-100 text-red-600" :
              currentStatus === "Not Required" ? "bg-gray-100 text-gray-600" :
              "bg-gray-100 text-gray-400"
            }`}>
              {currentStatus === "Approved" ? <CheckCircle size={14} /> :
               currentStatus === "Rejected" ? <XCircle size={14} /> :
               currentStatus === "Not Required" ? <AlertCircle size={14} /> :
               <Clock size={14} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">Decision</p>
              <p className="text-xs text-neutral-600">
                {currentStatus === "Approved" ? "Process approved and can proceed" :
                 currentStatus === "Rejected" ? "Process rejected and needs revision" :
                 currentStatus === "Not Required" ? "No approval required" :
                 "Decision pending"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Approval Status</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="status">Approval Status</Label>
              <Select 
                value={form.watch("status")} 
                onValueChange={(value) => form.setValue("status", value as ApprovalStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approval status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.watch("status") === "Approved" && (
              <div>
                <Label htmlFor="approvedDate">Approval Date</Label>
                <Input
                  id="approvedDate"
                  type="date"
                  {...form.register("approvedDate")}
                />
              </div>
            )}

            <div>
              <Label htmlFor="approverNotes">Approver Notes</Label>
              <Textarea
                id="approverNotes"
                {...form.register("approverNotes")}
                placeholder="Add notes about the approval decision (optional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
