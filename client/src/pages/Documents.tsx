import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentApi, customerApi } from '../lib/api';
import { Document } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import DocumentUpload from '../components/DocumentUpload';
import DocumentViewer from '../components/DocumentViewer';
import DocumentSearch from '../components/DocumentSearch';
import { 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Search,
  Filter,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

// Extended Document interface to include database fields
interface ExtendedDocument extends Document {
  customer_id?: string;
  created_at?: string;
  uploaded_by?: string;
}

const DOCUMENT_CATEGORIES = [
  'Contract', 'Proposal', 'Requirements', 'Design', 
  'Technical', 'Report', 'Invoice', 'Other'
] as const;

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showViewer, setShowViewer] = useState(false);  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentApi.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll(),
  });  // Filter documents based on search and category
  const filteredDocuments = (documents as ExtendedDocument[]).filter((doc: ExtendedDocument) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group documents by category for overview
  const documentsByCategory = DOCUMENT_CATEGORIES.reduce((acc, category) => {
    acc[category] = (documents as ExtendedDocument[]).filter((doc: ExtendedDocument) => doc.category === category);
    return acc;
  }, {} as Record<string, ExtendedDocument[]>);

  const getCustomerName = (customerId: string) => {
    const customer = (customers as any[]).find((c: any) => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Contract: 'bg-blue-100 text-blue-800',
      Proposal: 'bg-green-100 text-green-800',
      Requirements: 'bg-purple-100 text-purple-800',
      Design: 'bg-pink-100 text-pink-800',
      Technical: 'bg-orange-100 text-orange-800',
      Report: 'bg-yellow-100 text-yellow-800',
      Invoice: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };
  const handleDocumentDownload = async (document: Document) => {
    try {
      // Create a download link
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize all your business documents
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
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

          {/* Documents List */}
          <div className="grid gap-4">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                </CardContent>
              </Card>            ) : (
              filteredDocuments.map((document: ExtendedDocument) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{document.name}</h3>
                          {document.description && (
                            <p className="text-sm text-muted-foreground">{document.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            {document.customer_id && (
                              <div className="flex items-center">
                                <Building className="mr-1 h-3 w-3" />
                                {getCustomerName(document.customer_id)}
                              </div>
                            )}
                            {document.created_at && (
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(document.created_at), 'MMM d, yyyy')}
                              </div>
                            )}
                            {document.uploaded_by && (
                              <div className="flex items-center">
                                <User className="mr-1 h-3 w-3" />
                                {document.uploaded_by}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(document.category)}>
                          {document.category}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentView(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Advanced Search Tab */}
        <TabsContent value="search">
          <DocumentSearch 
            documents={documents}
            customers={customers}
            onDocumentSelect={handleDocumentView}
          />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DOCUMENT_CATEGORIES.map(category => {
              const categoryDocs = documentsByCategory[category];
              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryDocs.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {categoryDocs.length === 1 ? 'document' : 'documents'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Recently uploaded documents across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>              <div className="space-y-2">
                {(documents as ExtendedDocument[])
                  .sort((a: ExtendedDocument, b: ExtendedDocument) => 
                    new Date(b.created_at || b.uploadDate).getTime() - new Date(a.created_at || a.uploadDate).getTime()
                  )
                  .slice(0, 5)
                  .map((document: ExtendedDocument) => (
                    <div key={document.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{document.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {document.customer_id ? getCustomerName(document.customer_id) : 'Unknown Customer'} • {format(new Date(document.created_at || document.uploadDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <Button variant="ghost" onClick={() => setShowUpload(false)}>
                ×
              </Button>
            </div>
            <DocumentUpload
              onUploadComplete={() => {
                setShowUpload(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}

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
