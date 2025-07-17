import React, { useState, useMemo } from 'react';
import { Document, Customer } from '../../../shared/types';

// Extended Document type to include additional properties from database
interface ExtendedDocument extends Document {
  created_at?: string;
  uploaded_by?: string;
  file_size?: number;
  filename?: string;
  file_url?: string;
}

interface DocumentSearchProps {
  documents: Document[];
  customers: Customer[];
  onDocumentSelect: (document: Document) => void;
}
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Search, 
  Filter,
  X,
  Building,
  User,
  Eye,
  Download
} from 'lucide-react';
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';

const DOCUMENT_CATEGORIES = [
  'Contract', 'Proposal', 'Requirements', 'Design', 
  'Technical', 'Report', 'Invoice', 'Other'
] as const;

interface DocumentSearchProps {
  documents: Document[];
  customers: Customer[];
  onDocumentSelect: (document: Document) => void;
}

interface SearchFilters {
  query: string;
  category: string;
  customerId: string;
  uploadedBy: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  minSize: string;
  maxSize: string;
}

export default function DocumentSearch({ documents, customers, onDocumentSelect }: DocumentSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    customerId: 'all',
    uploadedBy: 'all',
    dateFrom: null,
    dateTo: null,
    minSize: '',
    maxSize: ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cast documents to ExtendedDocument for better typing
  const extendedDocuments = documents as ExtendedDocument[];

  // Get unique uploaders
  const uploaders = useMemo(() => {
    const uniqueUploaders = Array.from(new Set(extendedDocuments.map(doc => doc.uploaded_by).filter(Boolean)));
    return uniqueUploaders.sort();
  }, [extendedDocuments]);
  // Filter documents based on all criteria
  const filteredDocuments = useMemo(() => {
    return extendedDocuments.filter(doc => {
      // Text search
      if (filters.query) {
        const searchText = filters.query.toLowerCase();
        const matches = 
          (doc.filename || doc.name)?.toLowerCase().includes(searchText) ||
          doc.description?.toLowerCase().includes(searchText) ||
          doc.category.toLowerCase().includes(searchText);
        if (!matches) return false;
      }

      // Category filter
      if (filters.category !== 'all' && doc.category !== filters.category) {
        return false;
      }      // Customer filter
      if (filters.customerId !== 'all' && doc.customerId && doc.customerId !== filters.customerId) {
        return false;
      }

      // Uploader filter
      if (filters.uploadedBy !== 'all' && doc.uploaded_by !== filters.uploadedBy) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const dateStr = doc.created_at || doc.uploadDate;
        if (dateStr) {
          const docDate = parseISO(dateStr);
          if (filters.dateFrom && isBefore(docDate, startOfDay(filters.dateFrom))) {
            return false;
          }
          if (filters.dateTo && isAfter(docDate, endOfDay(filters.dateTo))) {
            return false;
          }
        }
      }

      // File size filter
      if (doc.file_size && (filters.minSize || filters.maxSize)) {
        const sizeInMB = doc.file_size / (1024 * 1024);
        if (filters.minSize && sizeInMB < parseFloat(filters.minSize)) {
          return false;
        }
        if (filters.maxSize && sizeInMB > parseFloat(filters.maxSize)) {
          return false;
        }
      }

      return true;
    });
  }, [extendedDocuments, filters]);

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      customerId: 'all',
      uploadedBy: 'all',
      dateFrom: null,
      dateTo: null,
      minSize: '',
      maxSize: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.query !== '' ||
           filters.category !== 'all' ||
           filters.customerId !== 'all' ||
           filters.uploadedBy !== 'all' ||
           filters.dateFrom !== null ||
           filters.dateTo !== null ||
           filters.minSize !== '' ||
           filters.maxSize !== '';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
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
  const handleDocumentDownload = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const extDoc = document as ExtendedDocument;
      const link = window.document.createElement('a');
      link.href = extDoc.file_url || extDoc.url;
      link.download = extDoc.filename || extDoc.name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Advanced Document Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by filename, description, or category..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {hasActiveFilters() && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 bg-muted rounded-lg">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Customer Filter */}
              <div>
                <label className="text-sm font-medium">Customer</label>
                <Select
                  value={filters.customerId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Uploader Filter */}
              <div>
                <label className="text-sm font-medium">Uploaded By</label>
                <Select
                  value={filters.uploadedBy}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, uploadedBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Uploaders</SelectItem>                    {uploaders.map(uploader => uploader && (
                      <SelectItem key={uploader} value={uploader}>
                        {uploader}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* File Size Range */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">File Size (MB)</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minSize}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSize: e.target.value }))}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxSize}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxSize: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Search Results ({filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or clearing filters
              </p>
            </div>
          ) : (
            <div className="space-y-2">              {filteredDocuments.map(document => {
                const extDoc = document as ExtendedDocument;
                return (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  onClick={() => onDocumentSelect(document)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{extDoc.filename || extDoc.name}</h4>
                      {document.description && (
                        <p className="text-sm text-muted-foreground">{document.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">                        <div className="flex items-center">
                          <Building className="mr-1 h-3 w-3" />
                          {getCustomerName(document.customerId || '')}
                        </div>
                        {extDoc.uploaded_by && (
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {extDoc.uploaded_by}
                          </div>
                        )}
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {extDoc.created_at 
                            ? format(new Date(extDoc.created_at), 'MMM d, yyyy')
                            : format(new Date(document.uploadDate), 'MMM d, yyyy')
                          }
                        </div>
                        {extDoc.file_size && (
                          <span>{(extDoc.file_size / 1024 / 1024).toFixed(1)} MB</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentSelect(document);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDocumentDownload(document, e)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>                </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
