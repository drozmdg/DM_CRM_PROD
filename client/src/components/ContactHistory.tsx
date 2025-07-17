import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { communicationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar,
  Clock,
  User,
  Building
} from "lucide-react";
import type { Contact } from "@shared/types";

const communicationSchema = z.object({
  type: z.enum(["email", "phone", "meeting", "other"]),
  subject: z.string().min(1, "Subject is required"),
  notes: z.string().min(1, "Notes are required"),
  date: z.string().min(1, "Date is required"),
});

interface CommunicationEntry {
  id: string;
  contactId: string;
  type: "email" | "phone" | "meeting" | "other";
  subject: string;
  notes: string;
  date: string;
  createdAt: string;
}

interface ContactHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export default function ContactHistory({ isOpen, onClose, contact }: ContactHistoryProps) {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: "email" as const,
      subject: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],
    },
  });  // Fetch communication history for the contact
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ["/api/communications", { contactId: contact?.id }],
    queryFn: async () => {
      if (!contact?.id) return [];
      return communicationApi.getAll(contact.id);
    },
    enabled: !!contact?.id,
  });const mutation = useMutation({
    mutationFn: async (data: any) => {
      const communicationData = {
        ...data,
        contactId: String(contact?.id),
        date: new Date(data.date).toISOString(),
      };
      
      return communicationApi.create(communicationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", { contactId: contact?.id }] });
      toast({
        title: "Success",
        description: "Communication entry added successfully",
      });
      setIsAddingEntry(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add communication entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="text-blue-500" size={16} />;
      case "phone": return <Phone className="text-green-500" size={16} />;
      case "meeting": return <Calendar className="text-purple-500" size={16} />;
      default: return <MessageCircle className="text-neutral-500" size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "email": return "bg-blue-50 text-blue-700";
      case "phone": return "bg-green-50 text-green-700";
      case "meeting": return "bg-purple-50 text-purple-700";
      default: return "bg-neutral-50 text-neutral-700";
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="text-primary" size={20} />
            </div>
            <div>
              <DialogTitle>Communication History</DialogTitle>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <span>{contact.name}</span>
                {contact.title && (
                  <>
                    <span>•</span>
                    <span>{contact.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Entry Button */}
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Communication History</h4>
            <Button
              size="sm"
              onClick={() => setIsAddingEntry(true)}
              disabled={isAddingEntry}
            >
              <Plus size={16} className="mr-2" />
              Add Entry
            </Button>
          </div>

          {/* Add Entry Form */}
          {isAddingEntry && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Communication Type *</Label>
                      <Select
                        value={form.watch("type")}
                        onValueChange={(value) => form.setValue("type", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="Enter communication subject"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.subject.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes *</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Enter communication details and notes"
                      rows={3}
                    />
                    {form.formState.errors.notes && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.notes.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingEntry(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Adding..." : "Add Entry"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Communication History List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-neutral-600">Loading communication history...</p>
              </div>
            ) : communications.length > 0 ? (
              communications.map((comm: CommunicationEntry) => (
                <Card key={comm.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(comm.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-neutral-800">{comm.subject}</h5>
                            <Badge variant="outline" className={getTypeColor(comm.type)}>
                              {comm.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">{comm.notes}</p>
                          <div className="flex items-center space-x-3 text-xs text-neutral-500">
                            <div className="flex items-center">
                              <Calendar size={12} className="mr-1" />
                              {new Date(comm.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {new Date(comm.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                  <h4 className="font-medium text-neutral-800 mb-2">No communication history</h4>
                  <p className="text-sm text-neutral-600 mb-4">
                    Start tracking your communications with this contact.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsAddingEntry(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Add First Entry
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
