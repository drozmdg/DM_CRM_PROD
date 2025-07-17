import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  Clock,
  User,
  Plus,
  UserPlus,
  Edit
} from "lucide-react";
import { z } from "zod";

const insertCustomerSchema = z.object({
  name: z.string().min(1),
  phase: z.string().min(1),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  logoUrl: z.string().optional(),
  avatarColor: z.string().default("#1976D2"),
  active: z.boolean().default(true),
});
import TeamModal from "./TeamModal";
import ProcessModal from "./ProcessModal";
import ContactManagement from "./ContactManagement";
import ServiceManagement from "./ServiceManagement";
import CustomerAvatar from "./CustomerAvatar";
import DocumentUpload from "./DocumentUpload";

const customerFormSchema = insertCustomerSchema.extend({
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
});

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
}

export default function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts", { customerId: customer?.id }],
    queryFn: async () => {
      const url = `/api/contacts?customerId=${customer?.id}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customer?.id,
  });

  const { data: processes } = useQuery({
    queryKey: ["/api/processes", { customerId: customer?.id }],
    queryFn: async () => {
      const url = `/api/processes?customerId=${customer?.id}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customer?.id,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services", { customerId: customer?.id }],
    queryFn: async () => {
      const url = `/api/services?customerId=${customer?.id}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customer?.id,
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/documents", { customerId: customer?.id }],
    queryFn: async () => {
      const url = `/api/documents?customerId=${customer?.id}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customer?.id,
  });


  const { data: teams } = useQuery({
    queryKey: ["/api/teams", { customerId: customer?.id }],
    queryFn: async () => {
      const url = `/api/teams?customerId=${customer?.id}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customer?.id,
  });

  const form = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phase: "New Activation",
      contractStartDate: "",
      contractEndDate: "",
      avatarColor: "#1976D2",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        phase: customer.phase || "New Activation",
        contractStartDate: customer.contractStartDate || "",
        contractEndDate: customer.contractEndDate || "",
        avatarColor: customer.avatarColor || "#1976D2",
      });
    } else {
      form.reset({
        name: "",
        phase: "New Activation",
        contractStartDate: "",
        contractEndDate: "",
        avatarColor: "#1976D2",
      });
    }
  }, [customer, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers?includeInactive=true"] });
      toast({
        title: "Success",
        description: `Customer ${customer ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${customer ? "update" : "create"} customer`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      contractStartDate: data.contractStartDate || null,
      contractEndDate: data.contractEndDate || null,
    };
    mutation.mutate(submitData);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "New Activation": return "bg-success/10 text-success";
      case "Steady State": return "bg-primary/10 text-primary";
      case "Contracting": return "bg-warning/10 text-warning";
      case "Pending Termination": return "bg-destructive/10 text-destructive";
      case "Terminated": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            {customer && (
              <CustomerAvatar 
                name={customer.name}
                avatarColor={customer.avatarColor}
                size="lg"
              />
            )}
            <div>
              <DialogTitle>
                {customer ? customer.name : "Add New Customer"}
              </DialogTitle>
              {customer && (
                <Badge variant="outline" className={getPhaseColor(customer.phase)}>
                  {customer.phase}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams" disabled={!customer}>Teams</TabsTrigger>
            <TabsTrigger value="contacts" disabled={!customer}>Contacts</TabsTrigger>
            <TabsTrigger value="services" disabled={!customer}>Services</TabsTrigger>
            <TabsTrigger value="processes" disabled={!customer}>Processes</TabsTrigger>
            <TabsTrigger value="documents" disabled={!customer}>Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phase">Customer Phase</Label>
                  <Select value={form.watch("phase")} onValueChange={(value) => form.setValue("phase", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contracting">Contracting</SelectItem>
                      <SelectItem value="New Activation">New Activation</SelectItem>
                      <SelectItem value="Steady State">Steady State</SelectItem>
                      <SelectItem value="Steady State + New Activation">Steady State + New Activation</SelectItem>
                      <SelectItem value="Pending Termination">Pending Termination</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contractStartDate">Contract Start Date</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    {...form.register("contractStartDate")}
                  />
                </div>

                <div>
                  <Label htmlFor="contractEndDate">Contract End Date</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    {...form.register("contractEndDate")}
                  />
                </div>

                <div>
                  <Label htmlFor="avatarColor">Avatar Color</Label>
                  <Input
                    id="avatarColor"
                    type="color"
                    {...form.register("avatarColor")}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : customer ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="teams">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Teams</h4>
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedTeam(null);
                    setIsTeamModalOpen(true);
                  }}
                >
                  <Plus className="mr-2" size={16} />
                  Add Team
                </Button>
              </div>
              
              {teams?.map((team: any) => (
                <Card key={team.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <UserPlus className="text-primary" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-800">{team.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              {team.financeCode}
                            </Badge>
                            {team.startDate && (
                              <span className="text-xs text-neutral-600">
                                {new Date(team.startDate).toLocaleDateString()} - {team.endDate ? new Date(team.endDate).toLocaleDateString() : 'Present'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsTeamModalOpen(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!teams || teams.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserPlus className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                    <h4 className="font-medium text-neutral-800 mb-2">No teams yet</h4>
                    <p className="text-sm text-neutral-600 mb-4">
                      Create teams to organize your customer's billing and tracking.
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedTeam(null);
                        setIsTeamModalOpen(true);
                      }}
                    >
                      <Plus className="mr-2" size={16} />
                      Add First Team
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <ContactManagement customerId={customer?.id} contacts={contacts || []} />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement customerId={customer?.id} services={services || []} />
          </TabsContent>

          <TabsContent value="processes">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Processes</h4>
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedProcess(null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  <Plus className="mr-2" size={16} />
                  Add Process
                </Button>
              </div>
              
              {processes?.map((process: any) => (
                <Card key={process.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-800">{process.name}</h4>
                        {process.jiraTicket && (
                          <p className="text-sm text-neutral-600">{process.jiraTicket}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{process.status}</Badge>
                        <Badge variant="outline">{process.sdlcStage}</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedProcess(process);
                            setIsProcessModalOpen(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-neutral-600">
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        Due: {process.dueDate && new Date(process.dueDate).toLocaleDateString()}
                      </div>
                      <div>Progress: {process.progress || 0}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Documents</h4>
                <Button 
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Plus className="mr-2" size={16} />
                  Upload Document
                </Button>
              </div>
              
              {documents?.map((document: any) => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="text-neutral-400" size={20} />
                        <div>
                          <h4 className="font-medium text-neutral-800">{document.name}</h4>
                          {document.description && (
                            <p className="text-sm text-neutral-600">{document.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{document.category}</Badge>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-neutral-600">
                      <Clock className="mr-1" size={14} />
                      Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
      
      {/* Team Modal */}
      {customer && (
        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => {
            setIsTeamModalOpen(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          customerId={customer.id}
        />
      )}
      
      {/* Document Upload Modal */}
      {customer && (
        <DocumentUpload
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          customerId={customer.id}
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/documents", { customerId: customer.id }] });
          }}
        />
      )}
      
      {/* Process Modal */}
      <ProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => {
          setIsProcessModalOpen(false);
          setSelectedProcess(null);
        }}
        process={selectedProcess}
      />
    </Dialog>
  );
}
