import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useApiClient } from '@/lib/authenticatedApiClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ServiceModal from "@/components/ServiceModal";
import CustomerModal from "@/components/CustomerModal";
import ProcessModal from "@/components/ProcessModal";
import DocumentUpload from "@/components/DocumentUpload";
import StatusBadge from "@/components/StatusBadge";
import SDLCStageBadge from "@/components/SDLCStageBadge";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Plus, 
  CheckCircle,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
  UserPlus,
  Bot,
  Upload,
  Eye,
  Edit
} from "lucide-react";

export default function Dashboard() {
  console.log('🚀🚀🚀 FULL DASHBOARD COMPONENT LOADED - NO DATE-FNS!!!');
  const [, setLocation] = useLocation();
  const apiClient = useApiClient();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      return await apiClient.get('/dashboard/metrics');
    },
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      return await apiClient.get('/customers');
    },
  });

  const { data: processes, isLoading: processesLoading } = useQuery({
    queryKey: ["/api/processes"],
    queryFn: async () => {
      return await apiClient.get('/processes');
    },
  });

  console.log('FULL DASHBOARD DATA:', { metrics, customers: customers?.length, processes: processes?.length });

  // Show loading state
  if (metricsLoading || customersLoading || processesLoading) {
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

  const recentCustomers = (customers as any)?.slice(0, 4) || [];
  
  // Apply sorting to active processes
  let filteredProcesses = (processes as any)?.filter((p: any) => p.status === "Not Started" || p.status === "In Progress") || [];
  
  if (sortField) {
    filteredProcesses = [...filteredProcesses].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases for sorting
      if (sortField === 'customerId') {
        const aCustomer = customers?.find((c: any) => c.id === a.customerId);
        const bCustomer = customers?.find((c: any) => c.id === b.customerId);
        aValue = aCustomer?.name || '';
        bValue = bCustomer?.name || '';
      } else if (sortField === 'dueDate') {
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">No upcoming tasks</p>
                <p className="text-xs text-neutral-500 mt-1">You're all caught up!</p>
              </div>
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
                {activeProcesses.map((process: any) => {
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
                                return isNaN(date.getTime()) ? 'No due date' : date.toLocaleDateString();
                              } catch (error) {
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