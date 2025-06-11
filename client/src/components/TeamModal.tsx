import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTeamSchema } from "@shared/schema";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: any;
  customerId?: string;
}

export default function TeamModal({ isOpen, onClose, team, customerId }: TeamModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      financeCode: "",
      customerId: customerId || "",
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name || "",
        financeCode: team.financeCode || "",
        customerId: customerId || "",
      });
    } else {
      form.reset({
        name: "",
        financeCode: "",
        customerId: customerId || "",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {team ? "Edit Team" : "Create New Team"}
          </DialogTitle>
        </DialogHeader>

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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : team ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
