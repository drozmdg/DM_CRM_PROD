import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { importantDatesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, Trash2, Save, X, Calendar, CalendarDays, Clock } from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import type { CustomerImportantDate } from "@shared/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface CustomerImportantDatesProps {
  customerId: string;
}

interface DateFormData {
  description: string;
  date: string;
}

export default function CustomerImportantDates({ customerId }: CustomerImportantDatesProps) {
  const [isAddingDate, setIsAddingDate] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DateFormData>({
    description: "",
    date: "",
  });
  const [deleteDateId, setDeleteDateId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for important dates
  const { data: importantDates = [], isLoading } = useQuery({
    queryKey: ['customerImportantDates', customerId],
    queryFn: () => importantDatesApi.getAll(customerId),
    enabled: !!customerId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DateFormData) => 
      importantDatesApi.create(customerId, data.description, data.date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerImportantDates', customerId] });
      setIsAddingDate(false);
      setFormData({ description: "", date: "" });
      toast({
        title: "Important date added",
        description: "The important date has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & DateFormData) => 
      importantDatesApi.update(id, data.description, data.date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerImportantDates', customerId] });
      setEditingDateId(null);
      setFormData({ description: "", date: "" });
      toast({
        title: "Important date updated",
        description: "The important date has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => importantDatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerImportantDates', customerId] });
      setDeleteDateId(null);
      toast({
        title: "Important date deleted",
        description: "The important date has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDate = () => {
    if (!formData.description.trim() || !formData.date) return;

    if (editingDateId) {
      updateMutation.mutate({ id: editingDateId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEditDate = (date: CustomerImportantDate) => {
    setEditingDateId(date.id);
    setFormData({
      description: date.description,
      date: date.date,
    });
    setIsAddingDate(false);
  };

  const handleCancel = () => {
    setIsAddingDate(false);
    setEditingDateId(null);
    setFormData({ description: "", date: "" });
  };

  const handleDeleteDate = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getDateStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return "past";
    if (isToday(date)) return "today";
    if (isTomorrow(date)) return "tomorrow";
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 7) return "soon";
    if (daysUntil <= 30) return "upcoming";
    return "future";
  };

  const getDateBadge = (dateStr: string) => {
    const status = getDateStatus(dateStr);
    switch (status) {
      case "past":
        return <Badge variant="secondary">Past</Badge>;
      case "today":
        return <Badge variant="destructive">Today</Badge>;
      case "tomorrow":
        return <Badge variant="destructive">Tomorrow</Badge>;
      case "soon":
        return <Badge>This Week</Badge>;
      case "upcoming":
        return <Badge variant="outline">Upcoming</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Important Dates
          </CardTitle>
          {!isAddingDate && !editingDateId && (
            <Button
              size="sm"
              onClick={() => setIsAddingDate(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Date
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Date Form */}
        {(isAddingDate || editingDateId) && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Contract renewal, Annual review"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDate}
                disabled={!formData.description.trim() || !formData.date || 
                  createMutation.isPending || updateMutation.isPending}
                className="gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingDateId ? "Update" : "Save"} Date
              </Button>
            </div>
          </div>
        )}

        {/* Important Dates List */}
        {importantDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No important dates yet</p>
            <p className="text-sm">Add important dates to track renewals, meetings, and milestones</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {importantDates.map((importantDate: CustomerImportantDate) => {
                const dateStatus = getDateStatus(importantDate.date);
                const isPastDate = dateStatus === "past";
                
                return (
                  <div
                    key={importantDate.id}
                    className={`p-4 rounded-lg border ${
                      editingDateId === importantDate.id 
                        ? 'border-primary bg-primary/5' 
                        : isPastDate 
                        ? 'bg-muted/50 opacity-75' 
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isPastDate ? 'line-through text-muted-foreground' : ''}`}>
                            {importantDate.description}
                          </p>
                          {getDateBadge(importantDate.date)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(importantDate.date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {isPastDate 
                                ? `${formatDistanceToNow(new Date(importantDate.date), { addSuffix: true })}`
                                : `In ${formatDistanceToNow(new Date(importantDate.date))}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      {editingDateId !== importantDate.id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDate(importantDate)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDateId(importantDate.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDateId} onOpenChange={() => setDeleteDateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Important Date</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this important date? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDateId && handleDeleteDate(deleteDateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}