import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const insertTeamSchema = z.object({
  name: z.string().min(1),
  financeCode: z.string().min(1),
  customerId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
import TeamPharmaceuticalProducts from "@/components/TeamPharmaceuticalProducts";
import type { Team } from "@shared/types";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team;
  customerId?: string;
}

export default function TeamModal({ isOpen, onClose, team, customerId }: TeamModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const form = useForm({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      financeCode: "",
      customerId: customerId || "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name || "",
        financeCode: team.financeCode || "",
        customerId: customerId || "",
        startDate: team.startDate || "",
        endDate: team.endDate || "",
      });
    } else {
      form.reset({
        name: "",
        financeCode: "",
        customerId: customerId || "",
        startDate: "",
        endDate: "",
      });
    }
  }, [team, form, customerId]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = team ? `/api/teams/${team.id}` : "/api/teams";
      const method = team ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams", { customerId }] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Team ${team ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${team ? "update" : "create"} team`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {team ? `Manage Team: ${team.name}` : "Create New Team"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products" disabled={!team}>
              Pharmaceutical Products
              {team?.products && team.products.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {team.products.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" disabled={!team}>Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter team name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="financeCode">Finance Code *</Label>
            <Input
              id="financeCode"
              {...form.register("financeCode")}
              placeholder="REG-2025-001"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Finance code for billing and tracking purposes
            </p>
            {form.formState.errors.financeCode && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.financeCode.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : team ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {team && (
              <TeamPharmaceuticalProducts 
                team={team} 
                customerId={customerId!} 
                onUpdate={() => {
                  // Refresh team data when products are updated
                  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
                  if (customerId) {
                    queryClient.invalidateQueries({ queryKey: ["/api/teams", { customerId }] });
                    queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
                  }
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {team && (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Process Assignments</h3>
                <p className="text-gray-600 mb-4">Manage team assignments to processes and projects.</p>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
