import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ProcessDocumentManager from "@/components/ProcessDocumentManager";
import ProcessModal from "@/components/ProcessModal";
import ProcessTaskManager from "@/components/ProcessTaskManager";
import ProcessMilestones from "@/components/ProcessMilestones";
import ProcessFileTransferConfig from "@/components/ProcessFileTransferConfig";
import ProcessNotificationList from "@/components/ProcessNotificationList";
import UpcomingDueTasks from "@/components/UpcomingDueTasks";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  Shield
} from "lucide-react";

interface ProcessDetailsHeaderProps {
  process: any;
  customer?: any;
  onEdit: () => void;
}

function ProcessDetailsHeader({ process, customer, onEdit }: ProcessDetailsHeaderProps) {
  // Fetch task progress for the header
  const { data: taskProgress } = useQuery({
    queryKey: [`/api/processes/${process.id}/progress`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${process.id}/progress`);
      return response.json();
    },
  });

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Processes</span>
          </Button>
          
          <Button onClick={onEdit} className="bg-primary hover:bg-primary/90">
            <Edit size={16} className="mr-2" />
            Edit Process
          </Button>
        </div>

        <div className="flex items-start space-x-6">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
            <Briefcase className="text-primary" size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-neutral-800">{process.name}</h1>
              <Badge variant="outline" className={getStatusColor(process.status)}>
                {process.status}
              </Badge>
            </div>
            
            {customer && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-neutral-600">For:</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => window.location.href = `/customers/${customer.id}`}
                >
                  {customer.name}
                </Button>
              </div>
            )}
            
            <p className="text-neutral-600 mb-4">{process.description}</p>

            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">
                  {process.startDate ? new Date(process.startDate).toLocaleDateString() : "TBD"}
                </div>
                <div className="text-sm text-neutral-600">Start Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">
                  {process.endDate ? new Date(process.endDate).toLocaleDateString() : "TBD"}
                </div>
                <div className="text-sm text-neutral-600">End Date</div>
              </div>              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">
                  {taskProgress ? `${taskProgress.percentage}%` : "0%"}
                </div>
                <div className="text-sm text-neutral-600">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Active": return "bg-success/10 text-success border-success/20";
    case "Completed": return "bg-primary/10 text-primary border-primary/20";
    case "On Hold": return "bg-warning/10 text-warning border-warning/20";
    case "Cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

interface ProcessInformationProps {
  process: any;
  customer?: any;
  contacts?: any[];
}

function ProcessInformation({ process, customer, contacts = [] }: ProcessInformationProps) {
  // Fetch task progress for real-time data
  const { data: taskProgress } = useQuery({
    queryKey: [`/api/processes/${process.id}/progress`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${process.id}/progress`);
      return response.json();
    },
  });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase size={18} />
            <span>Process Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Process Name</label>
              <p className="text-sm text-neutral-800">{process.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Status</label>
              <div className="mt-1">
                <Badge variant="outline" className={getStatusColor(process.status)}>
                  {process.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-neutral-600">Description</label>
            <p className="text-sm text-neutral-800 mt-1">{process.description || "No description provided"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Start Date</label>
              <p className="text-sm text-neutral-800">
                {process.startDate 
                  ? new Date(process.startDate).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Due Date</label>
              <p className="text-sm text-neutral-800">
                {process.dueDate 
                  ? new Date(process.dueDate).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Estimated Hours</label>
              <div className="mt-1">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {process.estimate ? `${process.estimate} hours` : "Not estimated"}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-neutral-600">Responsible Contact</label>
            <p className="text-sm text-neutral-800">
              {process.responsibleContactId && contacts.length > 0
                ? (() => {
                    const contact = contacts.find(c => c.id === process.responsibleContactId);
                    return contact ? `${contact.name} - ${contact.title}` : "Contact not found";
                  })()
                : "Not assigned"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target size={18} />
            <span>Progress & Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-600">Overall Progress</span>
                <span className="text-sm font-bold text-neutral-800">
                  {taskProgress ? `${taskProgress.percentage}%` : "0%"}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${taskProgress ? taskProgress.percentage : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-lg font-bold text-success">
                  {taskProgress ? taskProgress.completed : 0}
                </div>
                <div className="text-xs text-neutral-600">Completed Tasks</div>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-lg font-bold text-warning">
                  {taskProgress ? (taskProgress.total - taskProgress.completed) : 0}
                </div>
                <div className="text-xs text-neutral-600">Remaining Tasks</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Tasks</span>
                <span className="text-sm font-medium text-neutral-800">
                  {taskProgress ? taskProgress.total : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Start Date</span>
                <span className="text-sm font-medium text-neutral-800">
                  {process.startDate ? new Date(process.startDate).toLocaleDateString() : "Not set"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Due Date</span>
                <span className="text-sm font-medium text-neutral-800">
                  {process.dueDate ? new Date(process.dueDate).toLocaleDateString() : "Not set"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


interface ProcessTpaInformationProps {
  process: any;
  contacts: any[];
}

function ProcessTpaInformation({ process, contacts }: ProcessTpaInformationProps) {
  const tpaContact = contacts.find(c => c.id === process.tpaResponsibleContactId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield size={18} />
          <span>Third-Party Agreement (TPA)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {process.isTpaRequired ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">TPA Required</label>
                <p className="text-sm text-neutral-800">Yes</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Data Source</label>
                <p className="text-sm text-neutral-800">{process.tpaDataSource || "Not specified"}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-600">Responsible Person</label>
              <p className="text-sm text-neutral-800">
                {tpaContact ? `${tpaContact.name} - ${tpaContact.title || tpaContact.type}` : "Not assigned"}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">Agreement Start Date</label>
                <p className="text-sm text-neutral-800">
                  {process.tpaStartDate 
                    ? new Date(process.tpaStartDate).toLocaleDateString()
                    : "Not set"
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Agreement End Date</label>
                <p className="text-sm text-neutral-800">
                  {process.tpaEndDate 
                    ? new Date(process.tpaEndDate).toLocaleDateString()
                    : "Not set"
                  }
                </p>
              </div>
            </div>
            
            {process.tpaEndDate && new Date(process.tpaEndDate) < new Date() && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>This TPA has expired and may need renewal</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Shield className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-sm text-neutral-600">TPA Required: No</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProcessTeamViewProps {
  processId: string;
  customerId?: string;
}

function ProcessTeamView({ processId, customerId }: ProcessTeamViewProps) {
  
  // Get all teams for this customer
  const { data: allTeams } = useQuery({
    queryKey: ["/api/teams", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/teams?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customerId,
  });

  // Get teams assigned to this process
  const { data: assignedTeams, refetch: refetchAssignedTeams } = useQuery({
    queryKey: [`/api/processes/${processId}/teams`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/teams`);
      return response.json();
    },
    enabled: !!processId,
  });

  const handleToggleTeamAssignment = async (teamId: string, isAssigned: boolean) => {
    try {
      console.log(`${isAssigned ? 'Unassigning' : 'Assigning'} team ${teamId} to process ${processId}`);
      
      if (isAssigned) {
        // Unassign team
        const response = await apiRequest("DELETE", `/api/processes/${processId}/teams/${teamId}`);
        console.log("Unassign response:", response);
      } else {
        // Assign team
        const response = await apiRequest("POST", `/api/processes/${processId}/teams/${teamId}`);
        console.log("Assign response:", response);
      }
      
      // Refresh both queries to update the UI
      await refetchAssignedTeams();
      console.log("Refetched assigned teams");
    } catch (error) {
      console.error("Error toggling team assignment:", error);
      alert(`Failed to ${isAssigned ? 'unassign' : 'assign'} team: ${error}`);
    }
  };

  const isTeamAssigned = (teamId: string) => {
    return assignedTeams?.some((team: any) => team.id === teamId) || false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={18} />
            <span>Teams</span>
          </div>
          <Badge variant="outline">{assignedTeams?.length || 0} of {allTeams?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allTeams && allTeams.length > 0 ? (
          <div className="space-y-3">
            {allTeams.map((team: any) => {
              const isAssigned = isTeamAssigned(team.id);
              return (
                <div key={team.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAssigned ? 'bg-success/10' : 'bg-neutral-100'
                    }`}>
                      <User className={isAssigned ? 'text-success' : 'text-neutral-400'} size={14} />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-800">{team.name}</h4>
                      <p className="text-sm text-neutral-600">{team.financeCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={isAssigned ? "default" : "outline"} 
                      className={isAssigned ? "bg-success text-white" : ""}
                    >
                      {isAssigned ? "Assigned" : "Available"}
                    </Badge>
                    <Button
                      size="sm"
                      variant={isAssigned ? "destructive" : "default"}
                      onClick={() => handleToggleTeamAssignment(team.id, isAssigned)}
                    >
                      {isAssigned ? "Remove" : "Assign"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No teams available for this customer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ProcessMilestones component is now imported from the separate component file

interface ProcessDocumentsProps {
  processId: string;
  customerId?: string;
}

function ProcessDocuments({ processId, customerId }: ProcessDocumentsProps) {
  const { data: customer } = useQuery({
    queryKey: ["/api/customers", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customerId,
  });

  return (
    <div className="space-y-6">
      <ProcessDocumentManager
        processId={processId}
        customerId={customerId || ""}
        readonly={false}
        showHeader={true}
      />
    </div>
  );
}

export default function ProcessDetails() {
  const { processId } = useParams<{ processId: string }>();
  const [, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: process, isLoading: processLoading } = useQuery({
    queryKey: ["/api/processes", processId],
    queryFn: async () => {
      const response = await fetch(`/api/processes/${processId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!processId,
  });

  const { data: customer } = useQuery({
    queryKey: ["/api/customers", process?.customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${process.customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!process?.customerId,
  });

  // Fetch contacts for task assignment
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts", { customerId: process?.customerId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/contacts?customerId=${process.customerId}`);
      return response.json();
    },
    enabled: !!process?.customerId,
  });
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  if (processLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading process details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Process Not Found</h2>
            <p className="text-neutral-600 mb-4">The process you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/processes")}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Processes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <ProcessDetailsHeader process={process} customer={customer} onEdit={handleEdit} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="file-transfers">File Transfers</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProcessInformation process={process} customer={customer} contacts={contacts} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UpcomingDueTasks processId={processId!} contacts={contacts} />
              <ProcessTeamView processId={processId!} customerId={process.customerId} />
            </div>
            {process.isTpaRequired && (
              <ProcessTpaInformation process={process} contacts={contacts} />
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <ProcessTaskManager processId={processId!} contacts={contacts} />
          </TabsContent>


          <TabsContent value="milestones" className="space-y-6">
            <ProcessMilestones processId={processId!} />
          </TabsContent>

          <TabsContent value="file-transfers" className="space-y-6">
            <ProcessFileTransferConfig processId={processId!} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <ProcessNotificationList processId={processId!} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <ProcessDocuments processId={processId!} customerId={process.customerId} />
          </TabsContent>        </Tabs>
      </div>
      
      <ProcessModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        process={process}
      />
    </div>
  );
}
