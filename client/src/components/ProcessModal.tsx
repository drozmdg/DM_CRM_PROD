import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProcessSchema } from "@shared/schema";

const processFormSchema = insertProcessSchema.extend({
  startDate: z.string(),
  dueDate: z.string().optional(),
});

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process?: any;
}

export default function ProcessModal({ isOpen, onClose, process }: ProcessModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const form = useForm({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      name: "",
      customerId: "",
      jiraTicket: "",
      status: "Not Started",
      sdlcStage: "Requirements",
      startDate: "",
      dueDate: "",
      approvalStatus: "Pending",
      estimate: "",
      functionalArea: "",
      responsibleContactId: "",
      progress: 0,
    },
  });

  useEffect(() => {
    if (process) {
      form.reset({
        name: process.name || "",
        customerId: process.customerId?.toString() || "",
        jiraTicket: process.jiraTicket || "",
        status: process.status || "Not Started",
        sdlcStage: process.sdlcStage || "Requirements",
        startDate: process.startDate || "",
        dueDate: process.dueDate || "",
        approvalStatus: process.approvalStatus || "Pending",
        estimate: process.estimate?.toString() || "",
        functionalArea: process.functionalArea || "",
        responsibleContactId: process.responsibleContactId?.toString() || "",
        progress: process.progress || 0,
      });
    } else {
      form.reset({
        name: "",
        customerId: "",
        jiraTicket: "",
        status: "Not Started",
        sdlcStage: "Requirements",
        startDate: "",
        dueDate: "",
        approvalStatus: "Pending",
        estimate: "",
        functionalArea: "",
        responsibleContactId: "",
        progress: 0,
      });
    }
  }, [process, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = process ? `/api/processes/${process.id}` : "/api/processes";
      const method = process ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Process ${process ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${process ? "update" : "create"} process`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      customerId: parseInt(data.customerId),
      estimate: data.estimate ? parseInt(data.estimate) : null,
      responsibleContactId: data.responsibleContactId ? parseInt(data.responsibleContactId) : null,
      dueDate: data.dueDate || null,
    };
    mutation.mutate(submitData);
  };

  const selectedCustomerId = form.watch("customerId");
  const customerContacts = contacts?.filter(contact => 
    contact.customerId === parseInt(selectedCustomerId)
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {process ? "Edit Process" : "Create New Process"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Process Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter process name"
              />
            </div>

            <div>
              <Label htmlFor="customerId">Customer *</Label>
              <Select value={form.watch("customerId")} onValueChange={(value) => form.setValue("customerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jiraTicket">JIRA Ticket</Label>
              <Input
                id="jiraTicket"
                {...form.register("jiraTicket")}
                placeholder="JIRA-XXX-000"
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sdlcStage">SDLC Stage *</Label>
              <Select value={form.watch("sdlcStage")} onValueChange={(value) => form.setValue("sdlcStage", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SDLC stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Requirements">Requirements</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Deployment">Deployment</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
            </div>

            <div>
              <Label htmlFor="approvalStatus">Approval Status</Label>
              <Select value={form.watch("approvalStatus")} onValueChange={(value) => form.setValue("approvalStatus", value)}>
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

            <div>
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                {...form.register("estimate")}
                placeholder="240"
              />
            </div>

            <div>
              <Label htmlFor="functionalArea">Functional Area</Label>
              <Input
                id="functionalArea"
                {...form.register("functionalArea")}
                placeholder="Custom Extract"
              />
            </div>

            <div>
              <Label htmlFor="responsibleContactId">Responsible Contact</Label>
              <Select value={form.watch("responsibleContactId")} onValueChange={(value) => form.setValue("responsibleContactId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {customerContacts.map((contact: any) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.name} - {contact.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                {...form.register("progress", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : process ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
