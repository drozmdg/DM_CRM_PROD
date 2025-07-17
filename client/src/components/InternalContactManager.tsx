import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, UserCheck, X } from "lucide-react";
import type { Contact } from "@shared/types";

interface InternalContactManagerProps {
  customerId: string;
  customerName: string;
}

export default function InternalContactManager({ customerId, customerName }: InternalContactManagerProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all internal contacts
  const { data: internalContacts = [], isLoading: loadingInternal } = useQuery({
    queryKey: ['internal-contacts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contacts/internal');
      return response.json() as Promise<Contact[]>;
    }
  });

  // Get contacts for this customer (includes assigned internal contacts)
  const { data: customerContacts = [], isLoading: loadingCustomer } = useQuery({
    queryKey: ['contacts', customerId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/contacts?customerId=${customerId}`);
      return response.json() as Promise<Contact[]>;
    }
  });

  // Get assigned internal contacts for this customer
  const assignedInternalContacts = customerContacts.filter(contact => contact.type === 'Internal');

  // Get unassigned internal contacts (available for assignment)
  // Note: Internal contacts might have a customerId from before the schema change
  // They are still available for assignment to additional customers
  const unassignedInternalContacts = internalContacts.filter(
    internal => !assignedInternalContacts.some(assigned => assigned.id === internal.id)
  );

  // Debug logging
  console.log('InternalContactManager Debug:', {
    internalContacts: internalContacts.length,
    customerContacts: customerContacts.length,
    assignedInternalContacts: assignedInternalContacts.length,
    unassignedInternalContacts: unassignedInternalContacts.length,
    loadingInternal,
    loadingCustomer,
    internalContactsData: internalContacts.map(c => ({ id: c.id, name: c.name, customerId: c.customerId })),
    assignedContactsData: assignedInternalContacts.map(c => ({ id: c.id, name: c.name, customerId: c.customerId }))
  });

  // Assign contact mutation
  const assignMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await apiRequest('POST', `/api/contacts/${contactId}/assign/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', customerId] });
      queryClient.invalidateQueries({ queryKey: ['internal-contacts'] });
      setIsAssignModalOpen(false);
      setSelectedContactId("");
      toast({
        title: "Success",
        description: "Internal contact assigned successfully"
      });
    },
    onError: (error) => {
      console.error('Error assigning contact:', error);
      toast({
        title: "Error",
        description: "Failed to assign internal contact",
        variant: "destructive"
      });
    }
  });

  // Unassign contact mutation
  const unassignMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await apiRequest('DELETE', `/api/contacts/${contactId}/assign/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', customerId] });
      queryClient.invalidateQueries({ queryKey: ['internal-contacts'] });
      toast({
        title: "Success",
        description: "Internal contact unassigned successfully"
      });
    },
    onError: (error) => {
      console.error('Error unassigning contact:', error);
      toast({
        title: "Error",
        description: "Failed to unassign internal contact",
        variant: "destructive"
      });
    }
  });

  const handleAssign = () => {
    if (selectedContactId) {
      assignMutation.mutate(selectedContactId);
    }
  };

  const handleUnassign = (contactId: string) => {
    unassignMutation.mutate(contactId);
  };

  if (loadingInternal || loadingCustomer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck size={18} />
            <span>Internal Contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck size={18} />
              <span>Internal Contacts</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              disabled={loadingInternal || loadingCustomer || unassignedInternalContacts.length === 0}
              title={
                loadingInternal || loadingCustomer 
                  ? "Loading..."
                  : internalContacts.length === 0 
                    ? "No internal contacts available. Create internal contacts first."
                    : unassignedInternalContacts.length === 0 
                      ? "All internal contacts are already assigned to this customer"
                      : "Assign an internal contact to this customer"
              }
            >
              <Plus size={14} className="mr-1" />
              Assign Internal Contact
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedInternalContacts.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                No internal contacts assigned to this customer.
              </p>
              {internalContacts.length === 0 && (
                <p className="text-xs text-amber-600">
                  💡 Create internal contacts first, then you can assign them to customers.
                </p>
              )}
              {internalContacts.length > 0 && unassignedInternalContacts.length === 0 && (
                <p className="text-xs text-blue-600">
                  ℹ️ All available internal contacts are already assigned to this customer.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {assignedInternalContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{contact.name}</p>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        Internal
                      </Badge>
                    </div>
                    {contact.title && (
                      <p className="text-sm text-neutral-600">{contact.title}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(contact.id)}
                    disabled={unassignMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={14} className="mr-1" />
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Contact Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Internal Contact to {customerName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Select Internal Contact</label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an internal contact..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedInternalContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.name}</span>
                        {contact.title && (
                          <span className="text-sm text-neutral-600">{contact.title}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {unassignedInternalContacts.length === 0 && (
              <p className="text-sm text-neutral-600">
                All available internal contacts are already assigned to this customer.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedContactId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedContactId || assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}