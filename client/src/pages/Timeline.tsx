import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock as TimelineIcon,
  Filter,
  Search,
  Download,
  Plus,
  Activity,
  Clock,
  TrendingUp
} from "lucide-react";
import { TimelineFilters } from "@/components/TimelineFilters";
import TimelineEvent from "@/components/TimelineEvent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TimelineEvent as TimelineEventType, Customer, Process } from "@shared/types";

interface UnifiedTimelineEvent extends TimelineEventType {
  customerId?: string;
  customerName?: string;
  processId?: string;
  processName?: string;
  entityType: 'customer' | 'process' | 'document' | 'team' | 'service' | 'contact';
}

interface TimelineFilters {
  dateRange: {
    start: string;
    end: string;
  };
  entityTypes: string[];
  searchQuery: string;
  selectedCustomer: string;
}

const timelineEventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["phase-change", "project-added", "process-launched", "other"]),
  date: z.string().min(1, "Date is required"),
  customerId: z.string().min(1, "Customer is required"),
});

export default function Timeline() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);  const [filters, setFilters] = useState<TimelineFilters>({
    dateRange: {
      start: '',
      end: '',
    },
    entityTypes: [],
    searchQuery: '',
    selectedCustomer: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(timelineEventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "other" as const,
      date: new Date().toISOString().split('T')[0],
      customerId: "",
    },
  });

  // Fetch all timeline events
  const { data: timelineEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/timeline"],
    queryFn: async () => {
      const response = await fetch("/api/timeline", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch customers for filtering and event creation
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch processes for enhanced timeline data
  const { data: processes } = useQuery({
    queryKey: ["/api/processes"],
    queryFn: async () => {
      const response = await fetch("/api/processes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/timeline", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      toast({
        title: "Success",
        description: "Timeline event created successfully",
      });
      setIsEventModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timeline event",
        variant: "destructive",
      });
    },
  });

  // Enhance timeline events with customer and process information
  const enhancedTimelineEvents: UnifiedTimelineEvent[] = useMemo(() => {
    if (!timelineEvents || !customers || !processes) return [];

    return timelineEvents.map((event: TimelineEventType) => {
      const customer = customers.find((c: Customer) => c.id === event.metadata?.customerId);
      const process = processes.find((p: Process) => p.id === event.metadata?.processId);

      return {
        ...event,
        customerId: customer?.id,
        customerName: customer?.name,
        processId: process?.id,
        processName: process?.name,
        entityType: event.metadata?.entityType || 'customer' as const,
      };
    });
  }, [timelineEvents, customers, processes]);

  // Apply filters to timeline events
  const filteredEvents = useMemo(() => {
    if (!enhancedTimelineEvents) return [];

    let filtered = enhancedTimelineEvents;

    // Apply search filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.customerName?.toLowerCase().includes(searchLower) ||
        event.processName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply entity type filter
    if (filters.entityTypes.length > 0) {
      filtered = filtered.filter(event =>
        filters.entityTypes.includes(event.entityType)
      );
    }    // Apply customer filter
    if (filters.selectedCustomer) {
      filtered = filtered.filter(event =>
        event.customerId === filters.selectedCustomer
      );
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(event =>
        new Date(event.date) >= new Date(filters.dateRange.start!)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(event =>
        new Date(event.date) <= new Date(filters.dateRange.end!)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [enhancedTimelineEvents, filters]);

  // Export timeline data
  const exportTimeline = (format: 'csv' | 'json') => {
    const dataToExport = filteredEvents.map(event => ({
      date: event.date,
      title: event.title,
      description: event.description,
      type: event.type,
      customer: event.customerName || '',
      process: event.processName || '',
      entityType: event.entityType,
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const csvHeaders = ['Date', 'Title', 'Description', 'Type', 'Customer', 'Process', 'Entity Type'];
      const csvRows = dataToExport.map(event => [
        event.date,
        `"${event.title}"`,
        `"${event.description}"`,
        event.type,
        `"${event.customer}"`,
        `"${event.process}"`,
        event.entityType,
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const onSubmit = (data: any) => {
    createEventMutation.mutate(data);
  };

  if (isLoadingEvents) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <TimelineIcon className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Unified Timeline</h1>
            <p className="text-neutral-600">Track all events across customers, processes, and operations</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTimeline('csv')}
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTimeline('json')}
          >
            <Download size={16} className="mr-2" />
            Export JSON
          </Button>

          <Button
            size="sm"
            onClick={() => setIsEventModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Events</p>
                <p className="text-2xl font-bold text-neutral-800">{filteredEvents.length}</p>
              </div>
              <Activity className="text-primary" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">This Week</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {filteredEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return eventDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Clock className="text-green-600" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Active Customers</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {new Set(filteredEvents.map(event => event.customerId).filter(Boolean)).size}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Event Types</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {new Set(filteredEvents.map(event => event.type)).size}
                </p>
              </div>
              <Badge variant="outline">Types</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
            <Input
              type="text"
              placeholder="Search timeline events..."
              className="pl-10"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}        {isFiltersOpen && (
          <div className="lg:col-span-1">
            <TimelineFilters
              isOpen={isFiltersOpen}
              onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
              filters={filters}
              onFiltersChange={setFilters}
              customers={customers || []}
              onClearFilters={() => setFilters({
                dateRange: { start: '', end: '' },
                entityTypes: [],
                searchQuery: '',
                selectedCustomer: '',
              })}
            />
          </div>
        )}

        {/* Timeline Content */}
        <div className={`${isFiltersOpen ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Timeline Events ({filteredEvents.length})</span>
                {filteredEvents.length > 0 && (
                  <Badge variant="outline">{filteredEvents[0]?.date && new Date(filteredEvents[0].date).toLocaleDateString()}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event, index) => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isLast={index === filteredEvents.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TimelineIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">No timeline events found</h3>                  <p className="text-neutral-600 mb-4">
                    {filters.searchQuery || filters.entityTypes.length > 0 || filters.selectedCustomer
                      ? "Try adjusting your filters to see more events."
                      : "Get started by creating your first timeline event."
                    }
                  </p>
                  <Button onClick={() => setIsEventModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add First Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Event Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Timeline Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter event title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Enter event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select 
                value={form.watch("type")} 
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase-change">Phase Change</SelectItem>
                  <SelectItem value="project-added">Project Added</SelectItem>
                  <SelectItem value="process-launched">Process Launched</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customerId">Customer</Label>
              <Select 
                value={form.watch("customerId")} 
                onValueChange={(value) => form.setValue("customerId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: Customer) => (
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
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
