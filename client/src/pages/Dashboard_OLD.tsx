import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ServiceModal from "@/components/ServiceModal";
import CustomerModal from "@/components/CustomerModal";
import ProcessModal from "@/components/ProcessModal";
import DocumentUpload from "@/components/DocumentUpload";
import StatusBadge from "@/components/StatusBadge";
import SDLCStageBadge from "@/components/SDLCStageBadge";
import { usePermissions } from "@/components/auth/ProtectedRoute";
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
// import { format } from "date-fns"; // TEMPORARILY REMOVED

export default function Dashboard() {
  console.log('🚀 DASHBOARD FULLY UPDATED - NO MORE DATE-FNS - CACHE BUSTED - ' + new Date().toISOString());
  const [, setLocation] = useLocation();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { canEdit, isManagerOrAdmin } = usePermissions();
  
  // Add simple test to see if component loads
  console.log("Dashboard component is rendering");

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: processes, isLoading: processesLoading, error: processesError } = useQuery({
    queryKey: ["/api/processes"],
    queryFn: async () => {
      const response = await fetch("/api/processes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });


  // Temporarily disable upcoming tasks to isolate date error
  const upcomingTasks = [];
  const tasksLoading = false;

  console.log("Dashboard data:", { metrics, customers, processes, upcomingTasks });
  console.log("Dashboard loading states:", { metricsLoading, customersLoading, processesLoading, tasksLoading });
  console.log("Dashboard errors:", { metricsError, customersError, processesError });

  // Show loading state
  if (metricsLoading || customersLoading || processesLoading || tasksLoading) {
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
  if (metricsError || customersError || processesError) {
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
  
  // Apply sorting to active processes
  let filteredProcesses = (processes as any)?.filter((p: any) => p.status === "Not Started" || p.status === "In Progress") || [];
  
  if (sortField) {
    filteredProcesses = [...filteredProcesses].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases for sorting
      if (sortField === 'customerId') {
        // Sort by customer name instead of ID
        const aCustomer = customers?.find((c: any) => c.id === a.customerId);
        const bCustomer = customers?.find((c: any) => c.id === b.customerId);
        aValue = aCustomer?.name || '';
        bValue = bCustomer?.name || '';
      } else if (sortField === 'dueDate') {
        // Convert dates for proper comparison
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }
      
      // Compare values based on their types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        // For numbers and dates
        return sortDirection === 'asc'
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }
    });
  }
  
  const activeProcesses = filteredProcesses.slice(0, 5);

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-warning text-warning-foreground";
      case "Completed": return "bg-success text-success-foreground";
      case "Not Started": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getSDLCStageColor = (stage: string) => {
    switch (stage) {
      case "Requirements": return "bg-gray-100 text-gray-600";
      case "Design": return "bg-primary/10 text-primary";
      case "Development": return "bg-primary text-primary-foreground";
      case "Testing": return "bg-warning/10 text-warning";
      case "Deployment": return "bg-success/10 text-success";
      case "Maintenance": return "bg-success text-success-foreground";
      default: return "bg-gray-100 text-gray-600";
    }
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
  
  // Handler for table header clicks to toggle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
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
                <p className="text-sm font-medium text-neutral-600">Active Customers</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {(metrics as any)?.customers?.total || 0}
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
                  {(metrics as any)?.processes?.total || 0}
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
                <p className="text-sm font-medium text-neutral-600">Services</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {(metrics as any)?.services?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <UserPlus className="text-warning" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-600">Active services</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Documents</p>
                <p className="text-2xl font-semibold text-neutral-800 mt-1">
                  {(metrics as any)?.documents?.total || 0}
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
              {canEdit() && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="text-primary" size={16} />
                  </div>
                  Add New Customer
                </Button>
              )}
              
              {isManagerOrAdmin() && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setIsServiceModalOpen(true)}
                >
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="text-warning" size={16} />
                  </div>
                  Add Service
                </Button>
              )}
              
              {canEdit() && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3"
                  onClick={() => {
                    setSelectedProcess(null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="text-accent" size={16} />
                  </div>
                  Create Process
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3"
                onClick={() => setLocation('/ai-chat')}
              >
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center mr-3">
                  <Bot className="text-warning" size={16} />
                </div>
                AI Assistant
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3"
                onClick={() => setIsDocumentUploadOpen(true)}
              >
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
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary"
                onClick={() => setLocation('/customers')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentCustomers.map((customer: any) => (
                <div 
                  key={customer.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/customers/${customer.id}`)}
                >
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

        {/* Upcoming Tasks Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Upcoming Tasks</h3>
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary"
                onClick={() => setLocation('/processes')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* TEMPORARILY DISABLED - debugging date issues */}
              {false && upcomingTasks && upcomingTasks.length > 0 ? (
                upcomingTasks.filter(task => task && task.id).map((task: any) => {
                  // Additional null checks
                  if (!task || !task.id) {
                    console.log('Skipping invalid task:', task);
                    return null;
                  }
                  
                  // Handle both dueDate and due_date formats, and validate the date
                  const dueDateString = task.dueDate || task.due_date;
                  console.log('Processing task:', task.id, 'dueDateString:', dueDateString);
                  
                  if (!dueDateString) {
                    console.log('Skipping task with no due date:', task.id);
                    return null; // Skip tasks without due dates
                  }
                  
                  const dueDate = new Date(dueDateString);
                  console.log('Created date object:', dueDate, 'isValid:', !isNaN(dueDate.getTime()));
                  
                  // Check if date is valid
                  if (isNaN(dueDate.getTime())) {
                    console.log('Skipping task with invalid date:', task.id, dueDateString);
                    return null; // Skip tasks with invalid dates
                  }
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  // Additional safety checks for date operations
                  let isToday = false;
                  let isTomorrow = false;
                  let daysUntilDue = 0;
                  
                  try {
                    isToday = dueDate.toDateString() === today.toDateString();
                    isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
                    daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  } catch (error) {
                    console.error('Error in date comparison:', error, 'dueDate:', dueDate, 'task:', task);
                    // Default to safe values
                    isToday = false;
                    isTomorrow = false;
                    daysUntilDue = 0;
                  }
                  
                  return (
                    <div key={task.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        isToday ? 'bg-red-500' : 
                        isTomorrow ? 'bg-amber-500' : 
                        daysUntilDue <= 3 ? 'bg-yellow-500' : 
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{task.title}</p>
                        <p className="text-xs text-neutral-600 mt-0.5">{task.processName || 'Unknown Process'} • {task.customerName || 'Unknown Customer'}</p>
                        <p className={`text-xs mt-1 font-medium ${
                          isToday ? 'text-red-600' : 
                          isTomorrow ? 'text-amber-600' : 
                          'text-neutral-500'
                        }`}>
                          {isToday ? 'Due Today' : 
                           isTomorrow ? 'Due Tomorrow' : 
                           (() => {
                             try {
                               return dueDate.toLocaleDateString();
                             } catch (error) {
                               console.error('Date formatting error:', error, 'dueDate:', dueDate, 'task:', task);
                               return 'Invalid date';
                             }
                           })()}
                        </p>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600">Upcoming tasks temporarily disabled</p>
                  <p className="text-xs text-neutral-500 mt-1">Debugging date formatting issues</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processes Overview - TEMPORARILY DISABLED */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Active Processes</h3>
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setSelectedProcess(null);
                  setIsProcessModalOpen(true);
                }}
              >
                <Plus className="mr-2" size={16} />
                New Process
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Process Name
                      {sortField === 'name' && (
                        <span className={`ml-2 text-xs ${sortDirection === 'asc' ? 'text-primary' : 'text-danger'}`}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('customerId')}
                    >
                      Customer
                      {sortField === 'customerId' && (
                        <span className={`ml-2 text-xs ${sortDirection === 'asc' ? 'text-primary' : 'text-danger'}`}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' && (
                        <span className={`ml-2 text-xs ${sortDirection === 'asc' ? 'text-primary' : 'text-danger'}`}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('sdlcStage')}
                    >
                      SDLC Stage
                      {sortField === 'sdlcStage' && (
                        <span className={`ml-2 text-xs ${sortDirection === 'asc' ? 'text-primary' : 'text-danger'}`}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date
                      {sortField === 'dueDate' && (
                        <span className={`ml-2 text-xs ${sortDirection === 'asc' ? 'text-primary' : 'text-danger'}`}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* TEMPORARILY DISABLED - debugging date errors */}
                {false && activeProcesses.map((process: any) => {
                  const customer = customers?.find((c: any) => c.id === process.customerId);
                  return (
                    <tr key={process.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-800">{process.name}</div>
                        <div className="text-sm text-neutral-600">{process.description}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: customer?.avatarColor }}
                          >
                            {customer ? getCustomerInitials(customer.name) : '?'}
                          </div>
                          <span className="font-medium text-neutral-800">{customer?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={process.status} />
                      </td>
                      <td className="py-4 px-4">
                        <SDLCStageBadge stage={process.sdlcStage} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="text-neutral-400" size={16} />
                          <span className="text-sm text-neutral-600">
                            {process.dueDate ? (() => {
                              try {
                                const date = new Date(process.dueDate);
                                return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                              } catch (error) {
                                console.error('Dashboard process date error:', error, 'dueDate:', process.dueDate);
                                return 'Invalid date';
                              }
                            })() : 'No due date'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/processes/${process.id}`)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProcess(process);
                              setIsProcessModalOpen(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Fallback row since table is disabled */}
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Processes table temporarily disabled - debugging date formatting issues
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {activeProcesses.length === 0 && (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-neutral-600 mb-2">No Active Processes</p>
              <p className="text-neutral-500 mb-4">Get started by creating your first process.</p>
              <Button onClick={() => {
                setSelectedProcess(null);
                setIsProcessModalOpen(true);
              }}>
                <Plus className="mr-2" size={16} />
                Create Process
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ServiceModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
      />
      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
      />
      <ProcessModal 
        isOpen={isProcessModalOpen} 
        onClose={() => {
          setIsProcessModalOpen(false);
          setSelectedProcess(null);
        }}
        process={selectedProcess}
      />
      <DocumentUpload 
        isOpen={isDocumentUploadOpen} 
        onClose={() => setIsDocumentUploadOpen(false)} 
      />
    </div>
  );
}
