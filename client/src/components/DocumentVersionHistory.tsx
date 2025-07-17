import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  History, 
  Download, 
  Eye, 
  RotateCcw, 
  Upload,
  FileText,
  User,
  Calendar,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  name: string;
  description?: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  version_notes?: string;
  uploaded_by: string;
  created_at: string;
  is_current: boolean;
  checksum: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
}

export default function DocumentVersionHistory({
  documentId,
  isOpen,
  onClose,
  documentName
}: DocumentVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [restoreNotes, setRestoreNotes] = useState('');
  const [showCompare, setShowCompare] = useState<{ v1: DocumentVersion; v2: DocumentVersion } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch document versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => apiRequest('GET', `/api/documents/${documentId}/versions`).then(res => res.json()),
    enabled: isOpen,
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async ({ versionId, notes }: { versionId: string; notes: string }) => {
      return apiRequest('POST', `/api/documents/${documentId}/versions/${versionId}/restore`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document version restored successfully",
      });
      setShowRestoreConfirm(null);
      setRestoreNotes('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore document version",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVersionChangeType = (currentVersion: DocumentVersion, previousVersion?: DocumentVersion) => {
    if (!previousVersion) return null;
    
    if (currentVersion.file_size > previousVersion.file_size) {
      return { type: 'increase', icon: ArrowUp, color: 'text-green-600' };
    } else if (currentVersion.file_size < previousVersion.file_size) {
      return { type: 'decrease', icon: ArrowDown, color: 'text-red-600' };
    }
    return { type: 'same', icon: null, color: 'text-gray-600' };
  };

  const handleDownloadVersion = (version: DocumentVersion) => {
    try {
      const link = window.document.createElement('a');
      link.href = version.file_url;
      link.download = `${version.name}_v${version.version_number}`;
      link.click();
    } catch (error) {
      console.error('Error downloading version:', error);
      toast({
        title: "Error",
        description: "Failed to download document version",
        variant: "destructive",
      });
    }
  };

  const handleViewVersion = (version: DocumentVersion) => {
    window.open(version.file_url, '_blank');
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    if (version.is_current) {
      toast({
        title: "Info",
        description: "This is already the current version",
      });
      return;
    }
    setShowRestoreConfirm(version.id);
  };

  const confirmRestore = () => {
    if (showRestoreConfirm) {
      restoreVersionMutation.mutate({
        versionId: showRestoreConfirm,
        notes: restoreNotes
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Version History - {documentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Loading version history...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Version Timeline */}
            <div className="space-y-3">
              {versions.map((version: DocumentVersion, index: number) => {
                const previousVersion = versions[index + 1];
                const changeType = getVersionChangeType(version, previousVersion);
                
                return (
                  <Card key={version.id} className={`transition-shadow ${version.is_current ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              version.is_current 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {version.is_current ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <GitBranch className="h-4 w-4" />
                              )}
                            </div>
                            {index < versions.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold">
                                Version {version.version_number}
                              </h4>
                              {version.is_current && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {changeType?.icon && (
                                <div className={`flex items-center ${changeType.color}`}>
                                  <changeType.icon className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            
                            {version.version_notes && (
                              <p className="text-sm text-gray-700 mb-2">{version.version_notes}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <User className="mr-1 h-3 w-3" />
                                {version.uploaded_by}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                              </div>
                              <div className="flex items-center">
                                <FileText className="mr-1 h-3 w-3" />
                                {formatFileSize(version.file_size)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVersion(version)}
                            title="View this version"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadVersion(version)}
                            title="Download this version"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {!version.is_current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              title="Restore this version"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {versions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No version history available</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Version Statistics */}
            {versions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Version Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{versions.length}</div>
                      <div className="text-xs text-muted-foreground">Total Versions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {formatFileSize(versions.find(v => v.is_current)?.file_size || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Current Size</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {new Set(versions.map(v => v.uploaded_by)).size}
                      </div>
                      <div className="text-xs text-muted-foreground">Contributors</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {formatDistanceToNow(new Date(versions[versions.length - 1]?.created_at), { addSuffix: false })}
                      </div>
                      <div className="text-xs text-muted-foreground">Age</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Restore Confirmation Dialog */}
        {showRestoreConfirm && (
          <Dialog open={!!showRestoreConfirm} onOpenChange={() => setShowRestoreConfirm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Version Restore</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      This will create a new version based on the selected version and make it the current version.
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="restore-notes">Restoration Notes (Optional)</Label>
                  <Textarea
                    id="restore-notes"
                    value={restoreNotes}
                    onChange={(e) => setRestoreNotes(e.target.value)}
                    placeholder="Explain why you're restoring this version..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRestoreConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmRestore}
                    disabled={restoreVersionMutation.isPending}
                  >
                    {restoreVersionMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore Version
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
