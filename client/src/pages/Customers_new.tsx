import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import CustomerModal from "@/components/CustomerModal";
import CustomerCardGrid from "@/components/CustomerCardGrid";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const filteredCustomers = (customers as any[])?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phase.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

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

      {/* Enhanced Customer Grid */}
      <CustomerCardGrid 
        customers={filteredCustomers}
        isLoading={isLoading}
        onView={handleViewCustomer}
        onEdit={handleEditCustomer}
        emptyStateAction={() => {
          setSelectedCustomer(null);
          setIsModalOpen(true);
        }}
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
