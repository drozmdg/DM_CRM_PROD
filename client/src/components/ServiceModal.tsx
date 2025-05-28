import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { customerApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { insertServiceSchema } from "@shared/schema";
import { Service } from "@shared/types";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service & { customerId?: string };
}

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: customerApi.getAll,
  });

  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      monthlyHours: 0,
      customerId: "",
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name || "",
        monthlyHours: service.monthlyHours || 0,
        customerId: service.customerId || "",
      });
    } else {
      form.reset({
        name: "",
        monthlyHours: 0,
        customerId: "",
      });
    }
  }, [service, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = service ? `/api/services/${service.id}` : "/api/services";
      const method = service ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Service ${service ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${service ? "update" : "create"} service`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const getHoursColorClass = (hours: number) => {
    if (hours >= 40) return "text-red-600";
    if (hours >= 20) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {service ? "Edit Service" : "Create New Service"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="customerId">Customer *</Label>
            <Select
              value={form.watch("customerId")}
              onValueChange={(value) => form.setValue("customerId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customerId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.customerId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Service Name *</Label>
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
              step="1"
              {...form.register("monthlyHours", { valueAsNumber: true })}
              placeholder="0"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Expected monthly hours for this service
              </p>
              {form.watch("monthlyHours") > 0 && (
                <span className={`text-xs font-medium ${getHoursColorClass(form.watch("monthlyHours"))}`}>
                  {form.watch("monthlyHours") >= 40 ? "High Load" : 
                   form.watch("monthlyHours") >= 20 ? "Medium Load" : "Low Load"}
                </span>
              )}
            </div>
            {form.formState.errors.monthlyHours && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.monthlyHours.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : service ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
