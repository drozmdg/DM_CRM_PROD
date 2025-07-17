import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, Process } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Plus,
  Trash2,
  Paperclip,
  Clock,
  User,
  Search,
  X,
  Workflow,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from './DocumentViewer';

interface ProcessDocumentManagerProps {
  processId: string;
  customerId: string;
  process?: Process;
  readonly?: boolean;
  showHeader?: boolean;
}

export default function ProcessDocumentManager({ 
  processId, 
  customerId, 
  process,
  readonly = false,
  showHeader = true 
}: ProcessDocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch process documents
  const { data: documents = [], isLoading: isLoadingDocs, refetch } = useQuery({
    queryKey: ['documents', 'process', processId],
    queryFn: () => apiRequest('GET', `/api/processes/${processId}/documents`).then(res => res.json()),
  });

  // Fetch available documents that can be attached
  const { data: availableDocuments = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['documents', 'available', processId, customerId],
    queryFn: () => apiRequest('GET', `/api/processes/${processId}/available-documents?customerId=${customerId}`).then(res => res.json()),
    enabled: showAttachDialog, // Only fetch when dialog is open
  });

  // Remove document from process mutation
  const removeDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('DELETE', `/api/processes/${processId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'process', processId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'available', processId, customerId] });
      toast({
        title: "Success",
        description: "Document removed from process",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove document from process",
        variant: "destructive",
      });
    },
  });

  // Attach existing document to process mutation
  const attachDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('POST', `/api/processes/${processId}/documents/${documentId}/attach`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'process', processId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'available', processId, customerId] });
      setShowAttachDialog(false);
      toast({
        title: "Success",
        description: "Document attached to process",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to attach document to process",
        variant: "destructive",
      });
    },
  });

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    return documents.filter((doc: Document) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [documents, searchQuery]);

  const getCategoryColor = (category: string) => {
    const colors = {
      Contract: 'bg-blue-100 text-blue-800 border-blue-200',
      Proposal: 'bg-green-100 text-green-800 border-green-200',
      Requirements: 'bg-purple-100 text-purple-800 border-purple-200',
      Design: 'bg-pink-100 text-pink-800 border-pink-200',
      Technical: 'bg-orange-100 text-orange-800 border-orange-200',
      Report: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Invoice: 'bg-red-100 text-red-800 border-red-200',
      Other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  const DocumentCard = ({ document }: { document: Document }) => {
    // Type assertion to access additional metadata fields that may be present
    const extendedDoc = document as Document & {
      created_at?: string;
      uploaded_by?: string;
      file_size?: number;
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{document.name}</h4>
                  {document.category && (
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(document.category)}`}>
                      {document.category}
                    </Badge>
                  )}
                </div>
                {document.description && (
                  <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                )}
                
                {/* Enhanced metadata display */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {extendedDoc.created_at 
                        ? format(new Date(extendedDoc.created_at), 'MMM d, yyyy')
                        : format(new Date(document.uploadDate), 'MMM d, yyyy')
                      }
                    </span>
                  </div>
                  
                  {extendedDoc.uploaded_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{extendedDoc.uploaded_by}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>
                      {extendedDoc.file_size 
                        ? formatFileSize(extendedDoc.file_size)
                        : document.size 
                          ? formatFileSize(document.size)
                          : 'Unknown size'
                      }
                    </span>
                  </div>
                  
                  {process && (
                    <div className="flex items-center gap-1">
                      <Workflow className="h-3 w-3" />
                      <span className="truncate">{process.name}</span>
                      <Badge variant="outline" className="ml-1 text-xs">
                        {process.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {document.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDocument(document);
                    setShowViewer(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {!readonly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocumentMutation.mutate(document.id)}
                  disabled={removeDocumentMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const AvailableDocumentCard = ({ document }: { document: Document }) => {
    // Type assertion to access additional metadata fields that may be present
    const extendedDoc = document as Document & {
      created_at?: string;
      uploaded_by?: string;
      file_size?: number;
    };

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => attachDocumentMutation.mutate(document.id)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{document.name}</h4>
                  {document.category && (
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(document.category)}`}>
                      {document.category}
                    </Badge>
                  )}
                </div>
                {document.description && (
                  <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                )}
                
                {/* Enhanced metadata display */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {extendedDoc.created_at 
                        ? format(new Date(extendedDoc.created_at), 'MMM d, yyyy')
                        : format(new Date(document.uploadDate), 'MMM d, yyyy')
                      }
                    </span>
                  </div>
                  
                  {extendedDoc.uploaded_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{extendedDoc.uploaded_by}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>
                      {extendedDoc.file_size 
                        ? formatFileSize(extendedDoc.file_size)
                        : document.size 
                          ? formatFileSize(document.size)
                          : 'Unknown size'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Paperclip className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingDocs) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Process Documents</h3>
            <p className="text-sm text-gray-600">
              Documents specific to this process ({documents.length})
            </p>
          </div>
          {!readonly && (
            <div className="flex gap-2">
              <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Existing
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Attach Existing Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isLoadingAvailable ? (
                      <div className="text-center py-8">Loading available documents...</div>
                    ) : availableDocuments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No additional documents available to attach
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 mb-4">
                          Click on a document to attach it to this process:
                        </p>
                        {availableDocuments.map((doc: Document) => (
                          <AvailableDocumentCard key={doc.id} document={doc} />
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Document for Process</DialogTitle>
                  </DialogHeader>
                  <DocumentUpload
                    customerId={customerId}
                    processId={processId}
                    standalone={true}
                    onClose={() => setShowUploadDialog(false)}
                    onUploadComplete={() => {
                      setShowUploadDialog(false);
                      refetch();
                    }}
                  />
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUploadDialog(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">
                {documents.length === 0 
                  ? "This process doesn't have any documents yet." 
                  : "No documents match your search criteria."
                }
              </p>
              {!readonly && documents.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button variant="outline" onClick={() => setShowAttachDialog(true)}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Existing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((document: Document) => (
            <DocumentCard key={document.id} document={document} />
          ))
        )}
      </div>

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
}
