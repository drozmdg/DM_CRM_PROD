import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const insertProcessSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  customerId: z.string().min(1),
  jiraTicket: z.string().optional(),
  status: z.string().min(1),
  sdlcStage: z.string().min(1),
  startDate: z.string().min(1),
  dueDate: z.string().optional(),
  approvalStatus: z.string().default("Pending"),
  estimate: z.number().optional(),
  functionalArea: z.string().optional(),
  responsibleContactId: z.string().optional(),
  progress: z.number().default(0),
  isTpaRequired: z.boolean().default(false),
  tpaResponsibleContactId: z.string().optional(),
  tpaDataSource: z.string().optional(),
  tpaStartDate: z.string().optional(),
  tpaEndDate: z.string().optional(),
});
import ProcessTimeline from "./ProcessTimeline";
import ProcessApproval from "./ProcessApproval";
import ProcessDependencies from "./ProcessDependencies";
import ProcessFileTransferConfig from "./ProcessFileTransferConfig";
import ProcessNotificationList from "./ProcessNotificationList";
import TpaDetailsForm from "./TpaDetailsForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const processFormSchema = insertProcessSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().optional(),
  estimate: z.string().optional(), // Change from number to string for form handling
  customerId: z.string().min(1, "Customer is required"),
  responsibleContactId: z.string().optional(),
  // TPA fields
  isTpaRequired: z.boolean().optional(),
  tpaResponsibleContactId: z.string().optional(),
  tpaDataSource: z.string().optional(),
  tpaStartDate: z.string().optional(),
  tpaEndDate: z.string().optional(),
});

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process?: any;
}

export default function ProcessModal({ isOpen, onClose, process }: ProcessModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      name: "",
      description: "",
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
      // TPA fields
      isTpaRequired: false,
      tpaResponsibleContactId: "",
      tpaDataSource: "",
      tpaStartDate: "",
      tpaEndDate: "",
    },
  });

  useEffect(() => {
    if (process) {
      form.reset({
        name: process.name || "",
        description: process.description || "",
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
        // TPA fields
        isTpaRequired: process.isTpaRequired || false,
        tpaResponsibleContactId: process.tpaResponsibleContactId || "",
        tpaDataSource: process.tpaDataSource || "",
        tpaStartDate: process.tpaStartDate || "",
        tpaEndDate: process.tpaEndDate || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
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
        // TPA fields
        isTpaRequired: false,
        tpaResponsibleContactId: "",
        tpaDataSource: "",
        tpaStartDate: "",
        tpaEndDate: "",
      });
    }
  }, [process, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🔄 Mutation function called with data:", data);
      const url = process ? `/api/processes/${process.id}` : "/api/processes";
      const method = process ? "PUT" : "POST";
      console.log(`📡 Making ${method} request to ${url}`);
      const response = await apiRequest(method, url, data);
      console.log("✅ API response received:", response.status);
      return response.json();
    },
    onSuccess: (result) => {
      console.log("🎉 Mutation success:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Process ${process ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("❌ Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${process ? "update" : "create"} process`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log("🔍 Form submission triggered");
    console.log("📊 Raw form data:", data);
    console.log("📝 Description from form data:", data.description);
    
    // Check for form validation errors
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.error("❌ Form validation errors:", errors);
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!data.name || !data.customerId || data.customerId.trim() === "" || !data.startDate) {
      console.error("❌ Validation failed - missing required fields:", {
        name: data.name,
        customerId: data.customerId,
        startDate: data.startDate
      });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Customer, Start Date)",
        variant: "destructive",
      });
      return;
    }

    // Validate customer ID can be converted to number
    const customerIdNum = data.customerId.startsWith('c-') ? 
      parseInt(data.customerId.substring(2)) : 
      parseInt(data.customerId);
    
    if (isNaN(customerIdNum)) {
      console.error("❌ Validation failed - invalid customer ID:", data.customerId);
      toast({
        title: "Validation Error", 
        description: "Invalid customer ID format",
        variant: "destructive",
      });
      return;
    }

    // Fix data type conversion to match backend validation schema and database format
    const submitData = {
      ...data,
      // Keep customer ID as string with "c-" prefix (database expects string format)
      customerId: data.customerId, // Send as-is: "c-1747967673251"
      // Convert estimate to number or omit field entirely
      estimate: data.estimate && data.estimate.trim() !== "" ? parseInt(data.estimate) : undefined,
      // Keep responsibleContactId as string or omit field entirely (backend expects string format)
      responsibleContactId: data.responsibleContactId && data.responsibleContactId.trim() !== "" ? data.responsibleContactId : undefined,
      // Ensure dueDate is string or omit field entirely (backend expects string, not null)
      dueDate: data.dueDate && data.dueDate.trim() !== "" ? data.dueDate : undefined,
      // Ensure functionalArea is valid enum or omit field entirely (backend rejects empty string)
      functionalArea: data.functionalArea && data.functionalArea.trim() !== "" ? data.functionalArea : undefined,
      // Ensure description is included (keep as string or undefined)
      description: data.description || undefined,
      // TPA fields
      isTpaRequired: data.isTpaRequired || false,
      tpaResponsibleContactId: data.tpaResponsibleContactId && data.tpaResponsibleContactId.trim() !== "" ? data.tpaResponsibleContactId : undefined,
      tpaDataSource: data.tpaDataSource && data.tpaDataSource.trim() !== "" ? data.tpaDataSource : undefined,
      tpaStartDate: data.tpaStartDate && data.tpaStartDate.trim() !== "" ? data.tpaStartDate : undefined,
      tpaEndDate: data.tpaEndDate && data.tpaEndDate.trim() !== "" ? data.tpaEndDate : undefined,
    };
    
    console.log('🔍 DEBUG: Description from form:', data.description);
    console.log('🔍 DEBUG: Description in submitData:', submitData.description);
    
    console.log("🚀 Processed submit data:", submitData);
    console.log("🎯 Mutation about to be called");
    
    mutation.mutate(submitData);
  };

  const selectedCustomerId = form.watch("customerId");
  const customerContacts = contacts?.filter((contact: any) => {
    // Compare customer IDs as strings since both are in "c-" prefix format
    return contact.customerId === selectedCustomerId;
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {process ? `${process.name}` : "Create New Process"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tpa">TPA</TabsTrigger>
            <TabsTrigger value="timeline" disabled={!process}>Timeline</TabsTrigger>
            <TabsTrigger value="approval" disabled={!process}>Approval</TabsTrigger>
            <TabsTrigger value="dependencies" disabled={!process}>Dependencies</TabsTrigger>
            <TabsTrigger value="file-transfers" disabled={!process}>File Transfers</TabsTrigger>
            <TabsTrigger value="notifications" disabled={!process}>Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
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

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Enter process description..."
                    rows={3}
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
                  <Select value={form.watch("functionalArea")} onValueChange={(value) => form.setValue("functionalArea", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select functional area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard Data Ingestion">Standard Data Ingestion</SelectItem>
                      <SelectItem value="Custom Data Ingestion">Custom Data Ingestion</SelectItem>
                      <SelectItem value="Standard Extract">Standard Extract</SelectItem>
                      <SelectItem value="Custom Extract">Custom Extract</SelectItem>
                      <SelectItem value="CRM Refresh">CRM Refresh</SelectItem>
                      <SelectItem value="New Team Implementation">New Team Implementation</SelectItem>
                    </SelectContent>
                  </Select>
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

              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving..." : process ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tpa">
            <TpaDetailsForm 
              form={form} 
              contacts={customerContacts} 
              isEditMode={!!process}
              onSubmit={() => form.handleSubmit(onSubmit)()}
              isSubmitting={mutation.isPending}
            />
          </TabsContent>

          <TabsContent value="timeline">
            {process && (
              <ProcessTimeline 
                processId={process.id}
                timeline={process.timeline || []}
                currentStage={process.sdlcStage}
              />
            )}
          </TabsContent>

          <TabsContent value="approval">
            {process && (
              <ProcessApproval
                processId={process.id}
                currentStatus={process.approvalStatus}
                approvedDate={process.approvedDate}
                approverNotes={process.approverNotes}
              />
            )}
          </TabsContent>

          <TabsContent value="dependencies">
            {process && (
              <ProcessDependencies
                processId={process.id}
                customerId={process.customerId}
              />
            )}
          </TabsContent>

          <TabsContent value="file-transfers">
            {process && (
              <ProcessFileTransferConfig processId={process.id} />
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {process && (
              <ProcessNotificationList processId={process.id} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
