import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, DocumentCategory } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Share2,
  Lock,
  History,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  User,
  Tag,
  Filter,
  Search,
  FolderOpen,
  Star,
  Clock,
  Workflow
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Extended Document interface with additional metadata
interface CustomerDocument extends Document {
  customerId: string;
  customer_id?: string;
  created_at?: string;
  uploaded_by?: string;
  file_size?: number;
  shared_with?: string[];
  access_level?: 'private' | 'team' | 'customer' | 'public';
  tags?: string[];
  version?: number;
  is_latest?: boolean;
  parent_document_id?: string;
  version_notes?: string;
  last_accessed?: string;
  is_favorite?: boolean;
}

interface CustomerDocumentManagerProps {
  customerId: string;
  customerName?: string;
  readonly?: boolean;
  showHeader?: boolean;
}

const DOCUMENT_CATEGORIES = [
  'Contract', 'Proposal', 'Requirements', 'Design', 
  'Technical', 'Report', 'Invoice', 'Other'
] as const;

const ACCESS_LEVELS = [
  { value: 'private', label: 'Private', description: 'Only you can access' },
  { value: 'team', label: 'Team', description: 'Team members can access' },
  { value: 'customer', label: 'Customer', description: 'Customer can access' },
  { value: 'public', label: 'Public', description: 'Everyone can access' }
] as const;

export default function CustomerDocumentManager({ 
  customerId, 
  customerName, 
  readonly = false,
  showHeader = true 
}: CustomerDocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch customer documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', 'customer', customerId],
    queryFn: () => apiRequest('GET', `/api/documents?customerId=${customerId}`).then(res => res.json()),
  });

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['documents', 'tags', customerId],
    queryFn: () => apiRequest('GET', `/api/documents/tags?customerId=${customerId}`).then(res => res.json()),
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ documentId, isFavorite }: { documentId: string; isFavorite: boolean }) => {
      return apiRequest('PATCH', `/api/documents/${documentId}/favorite`, { isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'customer', customerId] });
      toast({
        title: "Success",
        description: "Document favorite status updated",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'customer', customerId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
  });

  // Filter and sort documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = (documents as CustomerDocument[]).filter((doc: CustomerDocument) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesAccessLevel = selectedAccessLevel === 'all' || doc.access_level === selectedAccessLevel;
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => doc.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesAccessLevel && matchesTags;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at || a.uploadDate);
          bValue = new Date(b.created_at || b.uploadDate);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'size':
          aValue = a.file_size || 0;
          bValue = b.file_size || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, selectedCategory, selectedAccessLevel, selectedTags, sortBy, sortOrder]);

  // Group documents by category for overview
  const documentsByCategory = React.useMemo(() => {
    return DOCUMENT_CATEGORIES.reduce((acc, category) => {
      acc[category] = (documents as CustomerDocument[]).filter((doc: CustomerDocument) => doc.category === category);
      return acc;
    }, {} as Record<string, CustomerDocument[]>);
  }, [documents]);

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

  const getAccessLevelColor = (level: string) => {
    const colors = {
      private: 'bg-red-100 text-red-800',
      team: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      public: 'bg-gray-100 text-gray-800',
    };
    return colors[level as keyof typeof colors] || colors.private;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDocumentView = (document: CustomerDocument) => {
    // Implementation for viewing document
    window.open(document.url, '_blank');
  };

  const handleDocumentDownload = async (document: CustomerDocument) => {
    try {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = (document: CustomerDocument) => {
    toggleFavoriteMutation.mutate({
      documentId: document.id,
      isFavorite: !document.is_favorite
    });
  };

  const handleDeleteDocument = (document: CustomerDocument) => {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      deleteDocumentMutation.mutate(document.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Documents {customerName && `for ${customerName}`}
            </h2>
            <p className="text-muted-foreground">
              Manage customer-specific documents and files
            </p>
          </div>
          {!readonly && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <DocumentUploadForm 
                  customerId={customerId}
                  onSuccess={() => {
                    setShowUploadDialog(false);
                    refetch();
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {DOCUMENT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="access-level">Access Level</Label>
                  <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Access Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Access Levels</SelectItem>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {availableTags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {documents.length === 0 ? 'No documents found' : 'No documents match your filters'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((document: CustomerDocument) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onView={handleDocumentView}
                  onDownload={handleDocumentDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={readonly ? undefined : handleDeleteDocument}
                  onShowVersionHistory={(id) => setShowVersionHistory(id)}
                  onShowShare={(id) => setShowShareDialog(id)}
                  getCategoryColor={getCategoryColor}
                  getAccessLevelColor={getAccessLevelColor}
                  formatFileSize={formatFileSize}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DOCUMENT_CATEGORIES.map(category => {
              const categoryDocs = documentsByCategory[category];
              return (
                <Card key={category} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>{category}</span>
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryDocs.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {categoryDocs.length === 1 ? 'document' : 'documents'}
                    </p>
                    <Badge className={`${getCategoryColor(category)} mt-2`}>
                      {category}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <div className="space-y-4">
            {filteredDocuments.filter(doc => doc.is_favorite).map((document: CustomerDocument) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={handleDocumentView}
                onDownload={handleDocumentDownload}
                onToggleFavorite={handleToggleFavorite}
                onDelete={readonly ? undefined : handleDeleteDocument}
                onShowVersionHistory={(id) => setShowVersionHistory(id)}
                onShowShare={(id) => setShowShareDialog(id)}
                getCategoryColor={getCategoryColor}
                getAccessLevelColor={getAccessLevelColor}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-4">
            {filteredDocuments
              .sort((a, b) => new Date(b.created_at || b.uploadDate).getTime() - new Date(a.created_at || a.uploadDate).getTime())
              .slice(0, 10)
              .map((document: CustomerDocument) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onView={handleDocumentView}
                  onDownload={handleDocumentDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={readonly ? undefined : handleDeleteDocument}
                  onShowVersionHistory={(id) => setShowVersionHistory(id)}
                  onShowShare={(id) => setShowShareDialog(id)}
                  getCategoryColor={getCategoryColor}
                  getAccessLevelColor={getAccessLevelColor}
                  formatFileSize={formatFileSize}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Document Card Component
interface DocumentCardProps {
  document: CustomerDocument;
  onView: (doc: CustomerDocument) => void;
  onDownload: (doc: CustomerDocument) => void;
  onToggleFavorite: (doc: CustomerDocument) => void;
  onDelete?: (doc: CustomerDocument) => void;
  onShowVersionHistory: (id: string) => void;
  onShowShare: (id: string) => void;
  getCategoryColor: (category: string) => string;
  getAccessLevelColor: (level: string) => string;
  formatFileSize: (bytes?: number) => string;
}

function DocumentCard({
  document,
  onView,
  onDownload,
  onToggleFavorite,
  onDelete,
  onShowVersionHistory,
  onShowShare,
  getCategoryColor,
  getAccessLevelColor,
  formatFileSize
}: DocumentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <FileText className="h-8 w-8 text-muted-foreground mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold truncate">{document.name}</h3>
                {document.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                {document.version && document.version > 1 && (
                  <Badge variant="outline" className="text-xs">
                    v{document.version}
                  </Badge>
                )}
              </div>
              
              {document.description && (
                <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
              )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(new Date(document.created_at || document.uploadDate), 'MMM d, yyyy')}
                </div>
                
                {document.uploaded_by && (
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {document.uploaded_by}
                  </div>
                )}
                
                <div className="flex items-center">
                  <FileText className="mr-1 h-3 w-3" />
                  {formatFileSize(document.file_size)}
                </div>
                
                {document.processInfo && (
                  <div className="flex items-center">
                    <Workflow className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{document.processInfo.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {document.processInfo.status}
                    </Badge>
                  </div>
                )}
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="mr-1 h-2 w-2" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-1">
              <Badge className={getCategoryColor(document.category)} variant="outline">
                {document.category}
              </Badge>
              {document.access_level && (
                <Badge className={getAccessLevelColor(document.access_level)} variant="outline">
                  {document.access_level}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(document)}
                className="h-8 w-8 p-0"
              >
                <Star className={`h-4 w-4 ${document.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(document)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(document)}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowShare(document.id)}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowVersionHistory(document.id)}
                className="h-8 w-8 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(document)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Document Upload Form Component
interface DocumentUploadFormProps {
  customerId: string;
  onSuccess: () => void;
}

function DocumentUploadForm({ customerId, onSuccess }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other' as DocumentCategory,
    access_level: 'customer' as 'private' | 'team' | 'customer' | 'public',
    tags: [] as string[],
    version_notes: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!formData.name) {
      setFormData(prev => ({
        ...prev,
        name: selectedFile.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // Format data to match the API schema (same as DocumentUpload.tsx)
      const uploadData = {
        name: formData.name,
        description: formData.description || "",
        url: `http://localhost:5000/uploads/${file.name}`, // Mock URL for now
        type: file.type,
        category: formData.category,
        size: file.size,
        customerId,
      };

      await apiRequest('POST', '/api/documents', uploadData);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          required
        />
      </div>

      <div>
        <Label htmlFor="name">Document Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: DocumentCategory) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="access-level">Access Level</Label>
          <Select
            value={formData.access_level}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, access_level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-muted-foreground">{level.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" onClick={handleAddTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="mr-1 h-2 w-2" />
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-3 w-3 p-0"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="version-notes">Version Notes</Label>
        <Textarea
          id="version-notes"
          value={formData.version_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
          placeholder="Describe what's new in this version..."
          rows={2}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={uploading || !file}>
          {uploading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
