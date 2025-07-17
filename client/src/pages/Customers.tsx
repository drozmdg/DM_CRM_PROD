import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Download } from "lucide-react";
import CustomerModal from "@/components/CustomerModal";
import CustomerCardGrid from "@/components/CustomerCardGrid";
import { customerApi } from "@/lib/api";
import { usePermissions } from "@/components/auth/ProtectedRoute";
import { useApiClient } from "@/lib/authenticatedApiClient";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions();
  const apiClient = useApiClient();

  // Use React Query for data fetching
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: [includeInactive ? "/api/customers?includeInactive=true" : "/api/customers"],
    queryFn: async () => {
      const endpoint = includeInactive ? "/customers?includeInactive=true" : "/customers";
      const data = await apiClient.get(endpoint);
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.error('API returned non-array data:', data);
        return [];
      }
      
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false
  });

  // Early return for loading and error states
  if (isLoading) {
    return <div className="p-6">Loading customers...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading customers: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phase.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Debug logging
  console.log('Customers data:', customers, 'Type:', typeof customers, 'Is Array:', Array.isArray(customers));
  console.log('Filtered customers length:', filteredCustomers.length);

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };
  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };  const handleReactivateCustomer = async (customer: any) => {
    try {
      await customerApi.reactivate(customer.id);
      // Invalidate and refetch customer queries
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers?includeInactive=true"] });
    } catch (error) {
      console.error('Failed to reactivate customer:', error);
    }
  };
  const handleDeactivateCustomer = async (customer: any) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${customer.name}"?\n\nThis will mark the customer as inactive but keep all their data. You can reactivate them later if needed.`
      );
      
      if (confirmed) {
        await customerApi.delete(customer.id);
        // Invalidate and refetch customer queries
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers?includeInactive=true"] });
      }
    } catch (error) {
      console.error('Failed to deactivate customer:', error);
      alert('Failed to deactivate customer. Please try again.');
    }
  };

  const handleExportCustomers = () => {
    try {
      // Create CSV content
      const csvHeaders = [
        'Customer ID',
        'Customer Name', 
        'Phase',
        'Contract Start Date',
        'Contract End Date',
        'Active Status',
        'Created Date',
        'Updated Date',
        'Total Teams',
        'Total Contacts',
        'Total Documents',
        'Total Services',
        'Total Monthly Hours',
        'Total Processes',
        'Timeline Events'
      ];

      const csvRows = filteredCustomers.map((customer: any) => [
        customer.id || '',
        customer.name || '',
        customer.phase || '',
        customer.contractStartDate || '',
        customer.contractEndDate || '',
        customer.active ? 'Active' : 'Inactive',
        customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
        customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : '',
        customer.teams?.length || 0,
        customer.contacts?.length || 0,
        customer.documents?.length || 0,
        customer.services?.length || 0,
        customer.services?.reduce((sum: number, service: any) => sum + (service.monthlyHours || 0), 0) || 0,
        customer.processes?.length || 0,
        customer.timeline?.length || 0
      ]);      // Convert to CSV format
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: any[]) => 
          row.map((field: any) => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Customers</h2>
          <p className="text-neutral-600">Manage your customer relationships and track their progress</p>
        </div>
        {canEdit() && (
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2" size={16} />
            Add Customer
          </Button>
        )}
      </div>      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <label htmlFor="include-inactive" className="text-sm font-medium">
                Show inactive
              </label>            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort</Button>
            <Button 
              variant="outline" 
              onClick={handleExportCustomers}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>        </CardContent>
      </Card>

      {/* Enhanced Customer Grid */}      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error loading customers:</h3>
          <p className="text-red-600 text-sm mt-1">{String(error)}</p>
        </div>
      )}
      
      <CustomerCardGrid 
        customers={filteredCustomers}
        isLoading={isLoading}
        onViewCustomer={handleViewCustomer}
        onEditCustomer={handleEditCustomer}
        onReactivateCustomer={handleReactivateCustomer}
        onDeactivateCustomer={handleDeactivateCustomer}
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}