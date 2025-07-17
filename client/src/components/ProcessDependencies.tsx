import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus,
  ArrowRight,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";

interface ProcessDependency {
  id: string;
  dependentProcessId: string;
  dependencyProcessId: string;
  dependencyType: "blocks" | "enables" | "requires";
  dependentProcess: {
    id: string;
    name: string;
    status: string;
    sdlcStage: string;
  };
  dependencyProcess: {
    id: string;
    name: string;
    status: string;
    sdlcStage: string;
  };
}

interface ProcessDependenciesProps {
  processId: string;
  customerId: string;
}

export default function ProcessDependencies({ processId, customerId }: ProcessDependenciesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDependencyType, setSelectedDependencyType] = useState<string>("blocks");
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all processes for this customer (excluding current process)
  const { data: availableProcesses } = useQuery({
    queryKey: ["/api/processes", { customerId, excludeId: processId }],
    queryFn: async () => {
      const response = await fetch(`/api/processes?customerId=${customerId}`, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const processes = await response.json();
      return processes.filter((p: any) => p.id !== processId);
    },
    enabled: !!customerId,
  });

  // Get dependencies for this process
  const { data: dependencies } = useQuery({
    queryKey: ["/api/process-dependencies", { processId }],
    queryFn: async () => {
      const response = await fetch(`/api/process-dependencies?processId=${processId}`, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!processId,
  });

  const addDependencyMutation = useMutation({
    mutationFn: async (data: { dependencyProcessId: string; dependencyType: string }) => {
      const dependencyData = {
        dependentProcessId: processId,
        dependencyProcessId: data.dependencyProcessId,
        dependencyType: data.dependencyType,
      };
      
      const response = await apiRequest("POST", "/api/process-dependencies", dependencyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/process-dependencies", { processId }] });
      toast({
        title: "Success",
        description: "Process dependency added successfully",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add process dependency",
        variant: "destructive",
      });
    },
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async (dependencyId: string) => {
      const response = await apiRequest("DELETE", `/api/process-dependencies/${dependencyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/process-dependencies", { processId }] });
      toast({
        title: "Success",
        description: "Process dependency removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove process dependency",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = () => {
    setSelectedDependencyType("blocks");
    setSelectedProcessId("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDependencyType("blocks");
    setSelectedProcessId("");
  };

  const handleAddDependency = () => {
    if (!selectedProcessId) {
      toast({
        title: "Error",
        description: "Please select a process",
        variant: "destructive",
      });
      return;
    }

    addDependencyMutation.mutate({
      dependencyProcessId: selectedProcessId,
      dependencyType: selectedDependencyType,
    });
  };

  const handleRemoveDependency = (dependencyId: string) => {
    if (confirm("Are you sure you want to remove this dependency?")) {
      removeDependencyMutation.mutate(dependencyId);
    }
  };

  const getDependencyIcon = (type: string) => {
    switch (type) {
      case "blocks": return AlertTriangle;
      case "enables": return CheckCircle;
      case "requires": return Clock;
      default: return GitBranch;
    }
  };

  const getDependencyColor = (type: string) => {
    switch (type) {
      case "blocks": return "text-red-600 bg-red-100";
      case "enables": return "text-green-600 bg-green-100";
      case "requires": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "text-green-600 bg-green-100";
      case "In Progress": return "text-blue-600 bg-blue-100";
      case "Not Started": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Process Dependencies</h4>
        <Button size="sm" onClick={handleOpenModal} disabled={!availableProcesses?.length}>
          <Plus className="mr-2" size={16} />
          Add Dependency
        </Button>
      </div>

      {dependencies?.map((dependency: ProcessDependency) => {
        const DependencyIcon = getDependencyIcon(dependency.dependencyType);
        
        return (
          <Card key={dependency.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDependencyColor(dependency.dependencyType)}`}>
                    <DependencyIcon size={16} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-medium text-neutral-800">{dependency.dependencyProcess.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(dependency.dependencyProcess.status)}>
                          {dependency.dependencyProcess.status}
                        </Badge>
                        <Badge variant="outline">{dependency.dependencyProcess.sdlcStage}</Badge>
                      </div>
                    </div>
                    <ArrowRight className="text-neutral-400" size={16} />
                    <div>
                      <Badge variant="outline" className={getDependencyColor(dependency.dependencyType)}>
                        {dependency.dependencyType}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveDependency(dependency.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="mt-3 text-sm text-neutral-600">
                {dependency.dependencyType === "blocks" && 
                  "This process cannot start until the dependency is completed."}
                {dependency.dependencyType === "enables" && 
                  "This process enables the dependent process to begin."}
                {dependency.dependencyType === "requires" && 
                  "This process requires the dependency to be in progress or completed."}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(!dependencies || dependencies.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <h4 className="font-medium text-neutral-800 mb-2">No dependencies yet</h4>
            <p className="text-sm text-neutral-600 mb-4">
              Define dependencies between processes to manage workflow and priorities.
            </p>
            {availableProcesses?.length > 0 && (
              <Button size="sm" onClick={handleOpenModal}>
                <Plus className="mr-2" size={16} />
                Add First Dependency
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Dependency Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Process Dependency</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dependencyType">Dependency Type</Label>
              <Select 
                value={selectedDependencyType} 
                onValueChange={setSelectedDependencyType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dependency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">Blocks - Must complete before this process</SelectItem>
                  <SelectItem value="enables">Enables - Allows this process to start</SelectItem>
                  <SelectItem value="requires">Requires - Needed during this process</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="processId">Dependent Process</Label>
              <Select 
                value={selectedProcessId} 
                onValueChange={setSelectedProcessId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select process" />
                </SelectTrigger>
                <SelectContent>
                  {availableProcesses?.map((process: any) => (
                    <SelectItem key={process.id} value={process.id.toString()}>
                      {process.name} ({process.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-neutral-50 p-3 rounded text-sm text-neutral-600">
              <p className="font-medium mb-1">Dependency explanation:</p>
              {selectedDependencyType === "blocks" && 
                "The selected process must be completed before this process can start."}
              {selectedDependencyType === "enables" && 
                "The selected process enables this process to begin when it starts."}
              {selectedDependencyType === "requires" && 
                "The selected process is required to be active during this process."}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDependency} 
                disabled={addDependencyMutation.isPending || !selectedProcessId}
              >
                {addDependencyMutation.isPending ? "Adding..." : "Add Dependency"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
