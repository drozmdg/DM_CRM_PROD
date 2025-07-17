import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Server, Upload, Download, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileTransfer {
  id: string;
  processId: string;
  direction: 'inbound' | 'outbound';
  connectionType: 'SFTP' | 'ADLS' | 'S3' | 'FTP' | 'HTTP' | 'Local';
  connectionConfig: Record<string, any>;
  filePattern?: string;
  sourcePath: string;
  destinationPath?: string;
  scheduleType: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  scheduleConfig: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProcessFileTransferConfigProps {
  processId: string;
}

export default function ProcessFileTransferConfig({ processId }: ProcessFileTransferConfigProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<FileTransfer | null>(null);
  const [formData, setFormData] = useState({
    direction: 'inbound' as 'inbound' | 'outbound',
    connectionType: 'SFTP' as FileTransfer['connectionType'],
    connectionConfig: {} as Record<string, any>,
    filePattern: '',
    sourcePath: '',
    destinationPath: '',
    scheduleType: 'manual' as FileTransfer['scheduleType'],
    scheduleConfig: {} as Record<string, any>,
    isActive: true
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch file transfers for this process
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: [`/api/processes/${processId}/file-transfers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/processes/${processId}/file-transfers`);
      return response.json();
    },
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest("POST", `/api/processes/${processId}/file-transfers`, transferData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/file-transfers`] });
      toast({ title: "Success", description: "File transfer configuration created successfully" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create file transfer", variant: "destructive" });
    },
  });

  // Update transfer mutation
  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/file-transfers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/file-transfers`] });
      toast({ title: "Success", description: "File transfer configuration updated successfully" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update file transfer", variant: "destructive" });
    },
  });

  // Delete transfer mutation
  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/file-transfers/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}/file-transfers`] });
      toast({ title: "Success", description: "File transfer configuration deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete file transfer", variant: "destructive" });
    },
  });

  const handleCreateTransfer = () => {
    setSelectedTransfer(null);
    setFormData({
      direction: 'inbound',
      connectionType: 'SFTP',
      connectionConfig: {},
      filePattern: '',
      sourcePath: '',
      destinationPath: '',
      scheduleType: 'manual',
      scheduleConfig: {},
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEditTransfer = (transfer: FileTransfer) => {
    setSelectedTransfer(transfer);
    setFormData({
      direction: transfer.direction,
      connectionType: transfer.connectionType,
      connectionConfig: transfer.connectionConfig,
      filePattern: transfer.filePattern || '',
      sourcePath: transfer.sourcePath,
      destinationPath: transfer.destinationPath || '',
      scheduleType: transfer.scheduleType,
      scheduleConfig: transfer.scheduleConfig,
      isActive: transfer.isActive
    });
    setIsModalOpen(true);
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm("Are you sure you want to delete this file transfer configuration?")) {
      deleteTransferMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransfer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTransfer) {
      updateTransferMutation.mutate({ id: selectedTransfer.id, data: formData });
    } else {
      createTransferMutation.mutate(formData);
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'SFTP': return <Server className="h-4 w-4" />;
      case 'S3': return <Server className="h-4 w-4" />;
      case 'ADLS': return <Server className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />;
  };

  const getScheduleDisplay = (scheduleType: string, scheduleConfig: Record<string, any>) => {
    switch (scheduleType) {
      case 'manual': return 'Manual';
      case 'hourly': return 'Every hour';
      case 'daily': return `Daily at ${scheduleConfig.hour || 0}:${String(scheduleConfig.minute || 0).padStart(2, '0')}`;
      case 'weekly': return `Weekly on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduleConfig.dayOfWeek || 0]}`;
      case 'monthly': return `Monthly on day ${scheduleConfig.dayOfMonth || 1}`;
      default: return scheduleType;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Transfer Configuration</CardTitle>
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
              <Server className="h-5 w-5" />
              <span>File Transfer Configuration</span>
            </CardTitle>
            <Button onClick={handleCreateTransfer} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Transfer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No file transfers configured</h3>
              <p className="text-gray-600 mb-4">
                Set up file transfer configurations to automate data movement for this process.
              </p>
              <Button onClick={handleCreateTransfer}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Transfer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer: FileTransfer) => (
                <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(transfer.direction)}
                          <span className="font-medium capitalize">{transfer.direction}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getConnectionTypeIcon(transfer.connectionType)}
                          <span className="text-sm text-gray-600">{transfer.connectionType}</span>
                        </div>
                        <Badge variant={transfer.isActive ? "default" : "secondary"}>
                          {transfer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Source:</span>
                          <span className="ml-1 font-mono">{transfer.sourcePath}</span>
                        </div>
                        {transfer.destinationPath && (
                          <div>
                            <span className="text-gray-600">Destination:</span>
                            <span className="ml-1 font-mono">{transfer.destinationPath}</span>
                          </div>
                        )}
                        {transfer.filePattern && (
                          <div>
                            <span className="text-gray-600">Pattern:</span>
                            <span className="ml-1 font-mono">{transfer.filePattern}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{getScheduleDisplay(transfer.scheduleType, transfer.scheduleConfig)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransfer(transfer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransfer(transfer.id)}
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

      {/* Transfer Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTransfer ? "Edit File Transfer" : "Create File Transfer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select value={formData.direction} onValueChange={(value: 'inbound' | 'outbound') => setFormData({...formData, direction: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound (Pickup)</SelectItem>
                    <SelectItem value="outbound">Outbound (Delivery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="connectionType">Connection Type</Label>
                <Select value={formData.connectionType} onValueChange={(value: FileTransfer['connectionType']) => setFormData({...formData, connectionType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SFTP">SFTP</SelectItem>
                    <SelectItem value="S3">Amazon S3</SelectItem>
                    <SelectItem value="ADLS">Azure Data Lake Storage</SelectItem>
                    <SelectItem value="FTP">FTP</SelectItem>
                    <SelectItem value="HTTP">HTTP/HTTPS</SelectItem>
                    <SelectItem value="Local">Local File System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="sourcePath">Source Path *</Label>
              <Input
                id="sourcePath"
                value={formData.sourcePath}
                onChange={(e) => setFormData({...formData, sourcePath: e.target.value})}
                placeholder="/data/exports/"
                required
              />
            </div>

            <div>
              <Label htmlFor="destinationPath">Destination Path</Label>
              <Input
                id="destinationPath"
                value={formData.destinationPath}
                onChange={(e) => setFormData({...formData, destinationPath: e.target.value})}
                placeholder="/processed/imports/"
              />
            </div>

            <div>
              <Label htmlFor="filePattern">File Pattern</Label>
              <Input
                id="filePattern"
                value={formData.filePattern}
                onChange={(e) => setFormData({...formData, filePattern: e.target.value})}
                placeholder="*.csv, report_*.xml"
              />
            </div>

            <div>
              <Label htmlFor="scheduleType">Schedule</Label>
              <Select value={formData.scheduleType} onValueChange={(value: FileTransfer['scheduleType']) => setFormData({...formData, scheduleType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={createTransferMutation.isPending || updateTransferMutation.isPending}>
                {createTransferMutation.isPending || updateTransferMutation.isPending ? "Saving..." : selectedTransfer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}