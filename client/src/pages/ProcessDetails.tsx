import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ProcessDocumentManager from "@/components/ProcessDocumentManager";
import ProcessModal from "@/components/ProcessModal";
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
  Briefcase
} from "lucide-react";

interface ProcessDetailsHeaderProps {
  process: any;
  customer?: any;
  onEdit: () => void;
}

function ProcessDetailsHeader({ process, customer, onEdit }: ProcessDetailsHeaderProps) {
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
                <Button variant="link" className="p-0 h-auto text-primary">
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
                <div className="text-2xl font-bold text-neutral-800">65%</div>
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
    default: return "bg-muted text-muted-foreground border-muted/20";
  }
}

interface ProcessInformationProps {
  process: any;
  customer?: any;
}

function ProcessInformation({ process, customer }: ProcessInformationProps) {
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
              <label className="text-sm font-medium text-neutral-600">End Date</label>
              <p className="text-sm text-neutral-800">
                {process.endDate 
                  ? new Date(process.endDate).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
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
                <span className="text-sm font-bold text-neutral-800">65%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-lg font-bold text-success">12</div>
                <div className="text-xs text-neutral-600">Completed Tasks</div>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <div className="text-lg font-bold text-warning">5</div>
                <div className="text-xs text-neutral-600">Pending Tasks</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Duration</span>
                <span className="text-sm font-medium text-neutral-800">45 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Time Remaining</span>
                <span className="text-sm font-medium text-neutral-800">18 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Last Updated</span>
                <span className="text-sm font-medium text-neutral-800">2 hours ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProcessTimelineProps {
  processId: string;
}

function ProcessTimeline({ processId }: ProcessTimelineProps) {
  const { data: timeline } = useQuery({
    queryKey: ["/api/timeline", { processId }],
    queryFn: async () => {
      const response = await fetch(`/api/timeline?processId=${processId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock size={18} />
          <span>Process Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((event: any, index: number) => (
              <div key={event.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-neutral-300'}`}></div>
                  {index < timeline.length - 1 && (
                    <div className="w-px h-8 bg-neutral-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-800">{event.title}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No timeline events found</p>
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
  const { data: teams } = useQuery({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={18} />
            <span>Team Members</span>
          </div>
          <Badge variant="outline">{teams?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="text-primary" size={14} />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-800">{team.name}</h4>
                    <p className="text-sm text-neutral-600">{team.finance_code}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Team
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No team members assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProcessMilestonesProps {
  processId: string;
}

function ProcessMilestones({ processId }: ProcessMilestonesProps) {
  // Mock milestone data - in a real app this would come from an API
  const milestones = [
    {
      id: 1,
      title: "Project Initiation",
      description: "Initial setup and requirements gathering",
      dueDate: "2024-01-15",
      status: "Completed",
      progress: 100
    },
    {
      id: 2,
      title: "Design Phase",
      description: "System design and architecture planning",
      dueDate: "2024-02-01",
      status: "Completed",
      progress: 100
    },
    {
      id: 3,
      title: "Development Sprint 1",
      description: "Core functionality implementation",
      dueDate: "2024-02-28",
      status: "In Progress",
      progress: 65
    },
    {
      id: 4,
      title: "Testing & QA",
      description: "Quality assurance and bug fixes",
      dueDate: "2024-03-15",
      status: "Pending",
      progress: 0
    },
    {
      id: 5,
      title: "Deployment",
      description: "Production deployment and go-live",
      dueDate: "2024-03-30",
      status: "Pending",
      progress: 0
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle className="text-success" size={16} />;
      case "In Progress": return <Clock className="text-warning" size={16} />;
      case "Pending": return <AlertCircle className="text-neutral-400" size={16} />;
      default: return <AlertCircle className="text-neutral-400" size={16} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target size={18} />
          <span>Milestones</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                {getStatusIcon(milestone.status)}
                {index < milestones.length - 1 && (
                  <div className="w-px h-8 bg-neutral-200 mt-2"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-neutral-800">{milestone.title}</h4>
                  <span className="text-xs text-neutral-500">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mb-2">{milestone.description}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-neutral-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all" 
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-neutral-600">{milestone.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProcessInformation process={process} customer={customer} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessTimeline processId={processId!} />
              <ProcessTeamView processId={processId!} customerId={process.customerId} />
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ProcessTimeline processId={processId!} />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <ProcessTeamView processId={processId!} customerId={process.customerId} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <ProcessMilestones processId={processId!} />
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
