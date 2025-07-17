import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Bell, Mail, User, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProcessNotification {
  id: string;
  processId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole?: string;
  notifyOn: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventType {
  key: string;
  label: string;
  description: string;
}

interface ProcessNotificationListProps {
  processId: string;
}

export default function ProcessNotificationList({ processId }: ProcessNotificationListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ProcessNotification | null>(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientRole: '',
    notifyOn: {} as Record<string, boolean>,
    isActive: true
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications for this process
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: [`/api/processes/${processId}/notifications`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/notifications`);
      return response.json();
    },
  });

  // Fetch available event types
  const { data: eventTypes = [] } = useQuery({
    queryKey: ["/api/notifications/events/types"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notifications/events/types");
      return response.json();
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await apiRequest("POST", `/api/processes/${processId}/notifications`, notificationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/notifications`] });
      toast({ title: "Success", description: "Notification recipient added successfully" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add notification recipient", variant: "destructive" });
    },
  });

  // Update notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/notifications/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/notifications`] });
      toast({ title: "Success", description: "Notification recipient updated successfully" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update notification recipient", variant: "destructive" });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/notifications`] });
      toast({ title: "Success", description: "Notification recipient removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove notification recipient", variant: "destructive" });
    },
  });

  // Initialize form with event types when they're loaded
  useEffect(() => {
    if (eventTypes.length > 0 && !selectedNotification) {
      const initialNotifyOn: Record<string, boolean> = {};
      eventTypes.forEach((eventType: EventType) => {
        initialNotifyOn[eventType.key] = false;
      });
      setFormData(prev => ({ ...prev, notifyOn: initialNotifyOn }));
    }
  }, [eventTypes, selectedNotification]);

  const handleCreateNotification = () => {
    setSelectedNotification(null);
    const initialNotifyOn: Record<string, boolean> = {};
    eventTypes.forEach((eventType: EventType) => {
      initialNotifyOn[eventType.key] = false;
    });
    setFormData({
      recipientName: '',
      recipientEmail: '',
      recipientRole: '',
      notifyOn: initialNotifyOn,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEditNotification = (notification: ProcessNotification) => {
    setSelectedNotification(notification);
    setFormData({
      recipientName: notification.recipientName,
      recipientEmail: notification.recipientEmail,
      recipientRole: notification.recipientRole || '',
      notifyOn: notification.notifyOn,
      isActive: notification.isActive
    });
    setIsModalOpen(true);
  };

  const handleDeleteNotification = (id: string) => {
    if (confirm("Are you sure you want to remove this notification recipient?")) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientName || !formData.recipientEmail) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }

    if (selectedNotification) {
      updateNotificationMutation.mutate({ id: selectedNotification.id, data: formData });
    } else {
      createNotificationMutation.mutate(formData);
    }
  };

  const handleEventToggle = (eventKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifyOn: {
        ...prev.notifyOn,
        [eventKey]: checked
      }
    }));
  };

  const getActiveEventsCount = (notifyOn: Record<string, boolean>) => {
    return Object.values(notifyOn).filter(Boolean).length;
  };

  const getActiveEventsList = (notifyOn: Record<string, boolean>) => {
    return Object.entries(notifyOn)
      .filter(([, enabled]) => enabled)
      .map(([eventKey]) => {
        const eventType = eventTypes.find((et: EventType) => et.key === eventKey);
        return eventType?.label || eventKey;
      });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Process Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Process Notifications</span>
            </CardTitle>
            <Button onClick={handleCreateNotification} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notification recipients</h3>
              <p className="text-gray-600 mb-4">
                Add recipients to receive notifications about process events.
              </p>
              <Button onClick={handleCreateNotification}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Recipient
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification: ProcessNotification) => (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{notification.recipientName}</span>
                        </div>
                        {notification.recipientRole && (
                          <Badge variant="outline">{notification.recipientRole}</Badge>
                        )}
                        <Badge variant={notification.isActive ? "default" : "secondary"}>
                          {notification.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{notification.recipientEmail}</span>
                      </div>

                      <div className="text-sm">
                        <span className="text-gray-600">Notifications:</span>
                        <div className="mt-1">
                          {getActiveEventsCount(notification.notifyOn) === 0 ? (
                            <span className="text-gray-500 italic">No events selected</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {getActiveEventsList(notification.notifyOn).map((eventLabel, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {eventLabel}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditNotification(notification)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedNotification ? "Edit Notification Recipient" : "Add Notification Recipient"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientName">Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <Label htmlFor="recipientEmail">Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recipientRole">Role</Label>
              <Input
                id="recipientRole"
                value={formData.recipientRole}
                onChange={(e) => setFormData({...formData, recipientRole: e.target.value})}
                placeholder="Data Provider, Project Manager, etc."
              />
            </div>

            <div>
              <Label className="text-base font-medium">Notification Events</Label>
              <p className="text-sm text-gray-600 mb-3">Select which events should trigger notifications for this recipient.</p>
              
              <div className="space-y-3 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                {eventTypes.map((eventType: EventType) => (
                  <div key={eventType.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={eventType.key}
                      checked={formData.notifyOn[eventType.key] || false}
                      onCheckedChange={(checked) => handleEventToggle(eventType.key, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={eventType.key} className="font-medium cursor-pointer">
                        {eventType.label}
                      </Label>
                      <p className="text-xs text-gray-500">{eventType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createNotificationMutation.isPending || updateNotificationMutation.isPending}>
                {createNotificationMutation.isPending || updateNotificationMutation.isPending ? "Saving..." : selectedNotification ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}