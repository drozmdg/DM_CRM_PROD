import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Contact, ContactType, Customer } from "@shared/types";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(["Client", "Internal"]),
  customerId: z.string().min(1, "Customer is required"),
});

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  customers: Customer[];
}

export default function ContactModal({ isOpen, onClose, contact, customers }: ContactModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      phone: "",
      role: "",
      type: "Client" as ContactType,
      customerId: "",
    },
  });

  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name || "",
        title: contact.title || "",
        email: contact.email || "",
        phone: contact.phone || "",
        role: contact.role || "",
        type: contact.type || "Client",
        customerId: contact.customerId || "",
      });
    } else {
      form.reset({
        name: "",
        title: "",
        email: "",
        phone: "",
        role: "",
        type: "Client",
        customerId: "",
      });
    }
  }, [contact, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = contact ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: `Contact ${contact ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${contact ? "update" : "create"} contact`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Create New Contact"}
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
                {customers.map((customer) => (
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter contact name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Enter job title"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="role">Role Description</Label>
            <Input
              id="role"
              {...form.register("role")}
              placeholder="Enter role description"
            />
          </div>

          <div>
            <Label htmlFor="type">Contact Type *</Label>
            <Select 
              value={form.watch("type")} 
              onValueChange={(value) => form.setValue("type", value as ContactType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Internal">Internal</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : contact ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
