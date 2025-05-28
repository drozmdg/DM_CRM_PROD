import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit, Clock } from "lucide-react";
import ServiceModal from "@/components/ServiceModal";
import { serviceApi, customerApi } from "@/lib/api";

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => serviceApi.getAll(),
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => customerApi.getAll(),
  });
  const filteredServices = services?.filter((service: any) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  const handleViewService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getHoursColor = (hours: number) => {
    if (hours >= 40) return "text-destructive";
    if (hours >= 20) return "text-warning";
    return "text-success";
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Services</h2>
          <p className="text-neutral-600">Manage customer services and track monthly hours allocation</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => {
            setSelectedService(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2" size={16} />
          Add Service
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: any) => (
            <Card key={service.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800 mb-2">{service.name}</h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      Customer: {getCustomerName(service.customerId)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Monthly Hours:</span>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-neutral-400" />
                      <span className={`font-medium ${getHoursColor(service.monthlyHours)}`}>
                        {service.monthlyHours}h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Status:</span>
                    <Badge 
                      variant="outline" 
                      className={service.monthlyHours > 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
                    >
                      {service.monthlyHours > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${service.monthlyHours > 0 ? "bg-success" : "bg-muted"}`}></span>
                    <span className="text-xs text-neutral-600">
                      {service.monthlyHours > 0 ? "Active" : "Inactive"}
                    </span>
                  </div>
                    <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewService(service)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              {searchTerm ? "No services found" : "No services yet"}
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first service"}
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setSelectedService(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="mr-2" size={16} />
              Add Service
            </Button>
          </CardContent>
        </Card>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
      />
    </div>
  );
}
