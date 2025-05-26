import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import CustomerModal from "@/components/CustomerModal";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phase.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Customers</h2>
          <p className="text-neutral-600">Manage your customer relationships and track their progress</p>
        </div>
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
      </div>

      {/* Search and Filters */}
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
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort</Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: customer.avatarColor }}
                >
                  {getCustomerInitials(customer.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 truncate">{customer.name}</h3>
                  <Badge variant="outline" className={getPhaseColor(customer.phase)}>
                    {customer.phase}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {customer.contractStartDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Contract Start:</span>
                    <span className="text-neutral-800">
                      {new Date(customer.contractStartDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {customer.contractEndDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Contract End:</span>
                    <span className="text-neutral-800">
                      {new Date(customer.contractEndDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span className="text-xs text-neutral-600">Active</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No customers found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first customer"}
            </p>
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
          </CardContent>
        </Card>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
