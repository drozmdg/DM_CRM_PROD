import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Settings, 
  FileText, 
  UserPlus, 
  Plus, 
  Bot, 
  Upload,
  Eye,
  Edit,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function Dashboard() {
  // Add simple test to see if component loads
  console.log("Dashboard component is rendering");

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: processes, isLoading: processesLoading, error: processesError } = useQuery({
    queryKey: ["/api/processes"],
  });

  const { data: timelineEvents, isLoading: timelineLoading, error: timelineError } = useQuery({
    queryKey: ["/api/timeline"],
  });

  console.log("Dashboard data:", { metrics, customers, processes, timelineEvents });
  console.log("Dashboard loading states:", { metricsLoading, customersLoading, processesLoading, timelineLoading });
  console.log("Dashboard errors:", { metricsError, customersError, processesError, timelineError });

  // Show loading state
  if (metricsLoading || customersLoading || processesLoading || timelineLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Dashboard Overview</h2>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (metricsError || customersError || processesError || timelineError) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Dashboard Overview</h2>
          <p className="text-red-600">Error loading dashboard data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const recentCustomers = (customers as any)?.slice(0, 4) || [];
  const activeProcesses = (processes as any)?.filter((p: any) => p.status === "active" || p.status === "planning").slice(0, 3) || [];
  const recentActivity = (timelineEvents as any)?.slice(0, 4) || [];

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-warning text-warning-foreground";
      case "Completed": return "bg-success text-success-foreground";
      case "Not Started": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSDLCStageColor = (stage: string) => {
    switch (stage) {
      case "Requirements": return "bg-muted text-muted-foreground";
      case "Design": return "bg-primary/10 text-primary";
      case "Development": return "bg-primary text-primary-foreground";
      case "Testing": return "bg-warning/10 text-warning";
      case "Deployment": return "bg-success/10 text-success";
      case "Maintenance": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "New Activation": return "bg-success/10 text-success";
      case "Steady State": return "bg-primary/10 text-primary";
      case "Contracting": return "bg-warning/10 text-warning";
      case "Pending Termination": return "bg-destructive/10 text-destructive";
      case "Terminated": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Dashboard Overview</h2>
        <p className="text-neutral-600">Welcome back! Here's what's happening with your customers and processes today.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Customers</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {(metrics as any)?.totalCustomers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="text-primary" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="text-success mr-1" size={16} />
              <span className="text-success font-medium">Growing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Processes</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {metrics?.activeProcesses || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Settings className="text-accent" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="text-warning mr-1" size={16} />
              <span className="text-neutral-600">In progress</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Teams</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {metrics?.totalTeams || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <UserPlus className="text-warning" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-600">Active teams</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Documents</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {metrics?.totalDocuments || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <FileText className="text-success" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="text-success mr-1" size={16} />
              <span className="text-neutral-600">Uploaded</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-auto p-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="text-primary" size={16} />
                </div>
                Add New Customer
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto p-3">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="text-accent" size={16} />
                </div>
                Create Process
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto p-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center mr-3">
                  <Bot className="text-warning" size={16} />
                </div>
                AI Assistant
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto p-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mr-3">
                  <Upload className="text-success" size={16} />
                </div>
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Customers Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Recent Customers</h3>
              <Button variant="link" size="sm" className="text-primary">View All</Button>
            </div>
            
            <div className="space-y-3">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: customer.avatarColor }}
                  >
                    {getCustomerInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">{customer.name}</p>
                    <Badge variant="outline" className={getPhaseColor(customer.phase)}>
                      {customer.phase}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    <span className="text-xs text-neutral-600">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Recent Activity</h3>
              <Button variant="link" size="sm" className="text-primary">View All</Button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="text-primary" size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800">{activity.title}</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {activity.createdAt && format(new Date(activity.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processes Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Active Processes</h3>
            <div className="flex items-center space-x-3">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2" size={16} />
                New Process
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Process Name</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">SDLC Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Progress</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeProcesses.map((process) => {
                  const customer = customers?.find(c => c.id === process.customerId);
                  return (
                    <tr key={process.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-800">{process.name}</div>
                        {process.jiraTicket && (
                          <div className="text-sm text-neutral-600">{process.jiraTicket}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {customer && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded text-white text-xs flex items-center justify-center"
                              style={{ backgroundColor: customer.avatarColor }}
                            >
                              {getCustomerInitials(customer.name)}
                            </div>
                            <span className="text-sm text-neutral-800">{customer.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(process.status)}>
                          {process.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={getSDLCStageColor(process.sdlcStage)}>
                          {process.sdlcStage}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-neutral-800">
                          {process.dueDate && format(new Date(process.dueDate), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Progress value={process.progress || 0} className="w-20" />
                          <span className="text-xs text-neutral-600">{process.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
