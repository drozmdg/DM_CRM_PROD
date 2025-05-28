import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Clock,
  Settings,
  Trash2
} from "lucide-react";
import type { Service } from "@shared/types";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  monthlyHours: z.number().min(0, "Monthly hours must be positive"),
});

interface ServiceManagementProps {
  customerId: string;
  services: Service[];
}

export default function ServiceManagement({ customerId, services }: ServiceManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      monthlyHours: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const serviceData = {
        ...data,
        customerId,
      };
      
      const url = selectedService 
        ? `/api/services/${selectedService.id}` 
        : "/api/services";
      const method = selectedService ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, serviceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", { customerId }] });
      toast({
        title: "Success",
        description: `Service ${selectedService ? "updated" : "created"} successfully`,
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${selectedService ? "update" : "create"} service`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await apiRequest("DELETE", `/api/services/${serviceId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", { customerId }] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setSelectedService(service);
      form.reset({
        name: service.name,
        monthlyHours: service.monthlyHours,
      });
    } else {
      setSelectedService(null);
      form.reset({
        name: "",
        monthlyHours: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
    form.reset();
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleDelete = (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate(serviceId);
    }
  };

  const getTotalMonthlyHours = () => {
    return services?.reduce((total, service) => total + service.monthlyHours, 0) || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">Services</h4>
          <p className="text-sm text-neutral-600">
            Total monthly hours: {getTotalMonthlyHours()}
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="mr-2" size={16} />
          Add Service
        </Button>
      </div>
      
      {services?.map((service: Service) => (
        <Card key={service.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="text-primary" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-800">{service.name}</h4>
                  <div className="flex items-center text-sm text-neutral-600 mt-1">
                    <Clock className="mr-1" size={12} />
                    {service.monthlyHours} hours/month
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleOpenModal(service)}
                >
                  <Edit size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(service.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {(!services || services.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <h4 className="font-medium text-neutral-800 mb-2">No services yet</h4>
            <p className="text-sm text-neutral-600 mb-4">
              Define services to track monthly hours and support commitments.
            </p>
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="mr-2" size={16} />
              Add First Service
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Service Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter service name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="monthlyHours">Monthly Hours</Label>
              <Input
                id="monthlyHours"
                type="number"
                min="0"
                step="0.5"
                {...form.register("monthlyHours", { valueAsNumber: true })}
                placeholder="Enter monthly hours"
              />
              {form.formState.errors.monthlyHours && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.monthlyHours.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : selectedService ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
