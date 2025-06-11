import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import ProcessModal from "@/components/ProcessModal";

export default function Processes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [, setLocation] = useLocation();

  const { data: processes, isLoading } = useQuery({
    queryKey: ["/api/processes"],
    queryFn: async () => {
      const response = await fetch("/api/processes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

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

  const handleViewProcess = (process: any) => {
    setLocation(`/processes/${process.id}`);
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

  // Apply search filtering
  let filteredProcesses = (processes as any)?.filter((process: any) =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.sdlcStage?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Apply sorting to filtered processes
  if (sortField) {
    filteredProcesses = [...filteredProcesses].sort((a: any, b: any) => {
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading processes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Processes</h2>
          <p className="text-neutral-600">Track and manage your business processes and workflows</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => {
            setSelectedProcess(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2" size={16} />
          New Process
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter by Status</Button>
            <Button variant="outline">Filter by Stage</Button>
          </div>
        </CardContent>
      </Card>

      {/* Processes Table */}
      <Card>
        <CardContent className="p-6">
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
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('progress')}
                    >
                      Progress
                      {sortField === 'progress' && (
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
                {filteredProcesses.map((process: any) => {
                  const customer = customers?.find((c: any) => c.id === process.customerId);
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
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-neutral-400" />
                          <span className="text-sm text-neutral-800">
                            {process.dueDate && format(new Date(process.dueDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Progress value={process.progress || 0} className="w-20" />
                          <span className="text-xs text-neutral-600">{process.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewProcess(process)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProcess(process);
                              setIsModalOpen(true);
                            }}
                          >
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

          {filteredProcesses.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No processes found</h3>
              <p className="text-neutral-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first process"}
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setSelectedProcess(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="mr-2" size={16} />
                New Process
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        process={selectedProcess}
      />
    </div>
  );
}
