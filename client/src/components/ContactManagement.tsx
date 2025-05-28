import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Mail, 
  Phone, 
  User, 
  Building,
  Trash2
} from "lucide-react";
import type { Contact, ContactType } from "@shared/types";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(["Client", "Internal"]),
});

interface ContactManagementProps {
  customerId: string;
  contacts: Contact[];
}

export default function ContactManagement({ customerId, contacts }: ContactManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const contactData = {
        ...data,
        customerId,
      };
      
      const url = selectedContact 
        ? `/api/contacts/${selectedContact.id}` 
        : "/api/contacts";
      const method = selectedContact ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, contactData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", { customerId }] });
      toast({
        title: "Success",
        description: `Contact ${selectedContact ? "updated" : "created"} successfully`,
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${selectedContact ? "update" : "create"} contact`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiRequest("DELETE", `/api/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", { customerId }] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setSelectedContact(contact);
      form.reset({
        name: contact.name,
        title: contact.title || "",
        email: contact.email,
        phone: contact.phone || "",
        role: contact.role || "",
        type: contact.type,
      });
    } else {
      setSelectedContact(null);
      form.reset({
        name: "",
        title: "",
        email: "",
        phone: "",
        role: "",
        type: "Client",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    form.reset();
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleDelete = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(contactId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Contacts</h4>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="mr-2" size={16} />
          Add Contact
        </Button>
      </div>
      
      {contacts?.map((contact: Contact) => (
        <Card key={contact.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {contact.type === "Client" ? (
                    <Building className="text-primary" size={16} />
                  ) : (
                    <User className="text-primary" size={16} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-neutral-800">{contact.name}</h4>
                  {contact.title && (
                    <p className="text-sm text-neutral-600">{contact.title}</p>
                  )}
                  {contact.role && (
                    <p className="text-sm text-neutral-600 mt-1">{contact.role}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={contact.type === "Client" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
                >
                  {contact.type}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleOpenModal(contact)}
                >
                  <Edit size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center text-sm text-neutral-800">
                <Mail className="mr-2 text-neutral-400" size={14} />
                {contact.email}
              </div>
              {contact.phone && (
                <div className="flex items-center text-sm text-neutral-800">
                  <Phone className="mr-2 text-neutral-400" size={14} />
                  {contact.phone}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {(!contacts || contacts.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <h4 className="font-medium text-neutral-800 mb-2">No contacts yet</h4>
            <p className="text-sm text-neutral-600 mb-4">
              Add contacts to manage your customer relationships.
            </p>
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="mr-2" size={16} />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter job title"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                {...form.register("role")}
                placeholder="Enter role description"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
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
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : selectedContact ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
