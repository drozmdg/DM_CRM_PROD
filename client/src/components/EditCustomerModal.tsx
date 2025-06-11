import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editCustomerSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  phase: z.string().min(1, "Phase is required"),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  avatarColor: z.string().optional(),
});

interface EditCustomerModalProps {
  customer: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCustomerModal({ customer, open, onClose, onSuccess }: EditCustomerModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      name: '',
      phase: 'New Activation',
      contractStartDate: '',
      contractEndDate: '',
      avatarColor: '#1976D2',
    },
  });

  // Initialize form with customer data
  useEffect(() => {
    if (customer && open) {
      form.reset({
        name: customer.name || '',
        phase: customer.phase || 'New Activation',
        contractStartDate: customer.contractStartDate || '',
        contractEndDate: customer.contractEndDate || '',
        avatarColor: customer.avatarColor || '#1976D2',
      });
    }
  }, [customer, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/customers/${customer.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer.id] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      contractStartDate: data.contractStartDate || null,
      contractEndDate: data.contractEndDate || null,
    };
    mutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer: {customer?.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input 
              id="name" 
              {...form.register("name")}
              placeholder="Enter company name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phase">Customer Phase *</Label>
              <Select 
                value={form.watch("phase")} 
                onValueChange={(value) => form.setValue("phase", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contracting">Contracting</SelectItem>
                  <SelectItem value="New Activation">New Activation</SelectItem>
                  <SelectItem value="Steady State">Steady State</SelectItem>
                  <SelectItem value="Steady State + New Activation">Steady State + New Activation</SelectItem>
                  <SelectItem value="Pending Termination">Pending Termination</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.phase && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.phase.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarColor">Avatar Color</Label>
              <Input
                id="avatarColor"
                type="color"
                {...form.register("avatarColor")}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractStartDate">Contract Start Date</Label>
              <Input
                id="contractStartDate"
                type="date"
                {...form.register("contractStartDate")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contractEndDate">Contract End Date</Label>
              <Input
                id="contractEndDate"
                type="date"
                {...form.register("contractEndDate")}
                min={form.watch("contractStartDate")}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
