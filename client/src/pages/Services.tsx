import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit, Clock, Building, Settings, User } from "lucide-react";
import ServiceModal from "@/components/ServiceModal";
import { serviceApi, customerApi } from "@/lib/api";
import CustomerPhaseBadge from "@/components/CustomerPhaseBadge";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import CustomerActivityBadge from "@/components/CustomerActivityBadge";
import { useApiClient } from "@/lib/authenticatedApiClient";

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const apiClient = useApiClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => apiClient.get('/services'),
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiClient.get('/customers'),
  });

  // Group services by customer
  const getServicesByCustomer = () => {
    if (!services || !customers) return {};
    
    const servicesByCustomer: { [key: string]: any } = {};
    
    // Initialize each customer with empty services array
    customers.forEach((customer: any) => {
      servicesByCustomer[customer.id] = {
        customer,
        services: [],
        totalMonthlyHours: 0,
        activeServices: 0
      };
    });
    
    // Group services by customer
    services.forEach((service: any) => {
      if (servicesByCustomer[service.customerId]) {
        servicesByCustomer[service.customerId].services.push(service);
        servicesByCustomer[service.customerId].totalMonthlyHours += service.monthlyHours || 0;
        if (service.monthlyHours > 0) {
          servicesByCustomer[service.customerId].activeServices += 1;
        }
      }
    });
    
    return servicesByCustomer;
  };

  const servicesByCustomer = getServicesByCustomer();
  
  // Filter customers based on search term
  const filteredCustomerData = Object.values(servicesByCustomer).filter((customerData: any) => {
    const customerName = customerData.customer.name.toLowerCase();
    const serviceNames = customerData.services.map((s: any) => s.name.toLowerCase()).join(' ');
    const searchLower = searchTerm.toLowerCase();
    
    return customerName.includes(searchLower) || serviceNames.includes(searchLower);
  });

  const handleViewService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const getHoursColor = (hours: number) => {
    if (hours >= 40) return "text-destructive";
    if (hours >= 20) return "text-warning";
    return "text-success";
  };

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
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
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Services by Client</h2>
          <p className="text-neutral-600">Manage customer services organized by client with total monthly hours</p>
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
                placeholder="Search clients or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Service Cards */}
      {filteredCustomerData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCustomerData.map((customerData: any) => (
            <Card key={customerData.customer.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: customerData.customer.avatarColor }}
                    >
                      {getCustomerInitials(customerData.customer.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800">
                        {customerData.customer.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <CustomerPhaseBadge phase={customerData.customer.phase} />
                        {customerData.customer.active === false && (
                          <CustomerActivityBadge isActive={false} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Hours Summary */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-neutral-800">
                      <span className={getHoursColor(customerData.totalMonthlyHours)}>
                        {customerData.totalMonthlyHours}h
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600">Total Monthly</div>
                    <div className="text-xs text-neutral-500">
                      {customerData.activeServices}/{customerData.services.length} active
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {customerData.services.length > 0 ? (
                  <div className="space-y-3">
                    {customerData.services.map((service: any) => (
                      <div 
                        key={service.id} 
                        className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Settings className="text-primary" size={14} />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-800">{service.name}</h4>
                            <div className="flex items-center text-sm text-neutral-600 mt-1">
                              <Clock className="mr-1" size={12} />
                              <span className={getHoursColor(service.monthlyHours)}>
                                {service.monthlyHours} hours/month
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <ServiceStatusBadge isActive={service.monthlyHours > 0} />
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Settings className="text-neutral-400" size={20} />
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">No services yet</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedService(null);
                        setIsModalOpen(true);
                      }}
                    >
                      <Plus className="mr-2" size={14} />
                      Add Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              {searchTerm ? "No clients found" : "No clients with services yet"}
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding services to your clients"}
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
      )}      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService || undefined}
      />
    </div>
  );
}
