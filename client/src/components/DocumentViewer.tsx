import React, { useState } from 'react';
import { Document } from '../../../shared/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Image, 
  FileVideo, 
  FileAudio,
  Archive,
  File,
  FileSpreadsheet,
  Code
} from 'lucide-react';
import { format } from 'date-fns';
import WordViewer from './viewers/WordViewer';
import ExcelViewer from './viewers/ExcelViewer';
import CsvViewer from './viewers/CsvViewer';
import CodeViewer from './viewers/CodeViewer';
import { getFileType as getParserFileType } from '../lib/fileParser';

// Extended Document interface to include database fields
interface ExtendedDocument extends Document {
  customer_id?: string;
  created_at?: string;
  uploaded_by?: string;
  file_size?: number;
}

interface DocumentViewerProps {
  document: ExtendedDocument;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);

  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6 text-blue-500" />;
      case 'txt':
      case 'sql':
      case 'md':
      case 'json':
      case 'xml':
      case 'js':
      case 'ts':
      case 'py':
      case 'css':
      case 'html':
        return <Code className="h-6 w-6 text-purple-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="h-6 w-6 text-pink-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <FileVideo className="h-6 w-6 text-orange-600" />;
      case 'mp3':
      case 'wav':
      case 'aac':
        return <FileAudio className="h-6 w-6 text-purple-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-6 w-6 text-yellow-600" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const getFileType = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) return 'document';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'aac'].includes(extension || '')) return 'audio';
    return 'other';
  };

  const canPreview = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    return [
      'pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', // Original supported formats
      'doc', 'docx', 'xlsx', 'xls', 'csv', // Office documents
      'txt', 'sql', 'md', 'json', 'xml', 'js', 'ts', 'py', 'css', 'html', 'yaml', 'yml' // Text/code files
    ].includes(extension || '');
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Create a download link
      const link = window.document.createElement('a');      link.href = document.url;
      link.download = document.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleOpenExternal = () => {
    window.open(document.url, '_blank');
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
  const renderPreview = () => {
    const parsedFileType = getParserFileType(document.name);
    
    if (!canPreview(document.name)) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
          {getFileIcon(document.name)}
          <p className="mt-4 text-sm text-muted-foreground">
            Preview not available for this file type
          </p>
          <p className="text-xs text-muted-foreground">
            Click "Open in New Tab" or "Download" to view the file
          </p>
        </div>
      );
    }

    // Use new viewer components for supported file types
    switch (parsedFileType) {
      case 'word':
        return <WordViewer url={document.url} filename={document.name} />;
        
      case 'excel':
        return <ExcelViewer url={document.url} filename={document.name} />;
        
      case 'csv':
        return <CsvViewer url={document.url} filename={document.name} />;
        
      case 'text':
        return <CodeViewer url={document.url} filename={document.name} />;
        
      case 'image':
        return (
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <img
              src={document.url}
              alt={document.name}
              className="max-h-96 max-w-full object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex flex-col items-center justify-center h-96">
              <Image className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          </div>
        );
        
      case 'document':
        if (document.name.toLowerCase().endsWith('.pdf')) {
          return (
            <div className="h-96 bg-muted rounded-lg">
              <iframe
                src={`${document.url}#toolbar=0`}
                className="w-full h-full rounded-lg"
                title={document.name}
                onError={() => console.log('PDF preview failed')}
              />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Document preview not available
            </p>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            {getFileIcon(document.name)}
            <p className="mt-4 text-sm text-muted-foreground">
              Preview not available for this file type
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">          <div className="flex items-center space-x-3">
            {getFileIcon(document.name)}
            <div>
              <h2 className="text-lg font-semibold">{document.name}</h2>
              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleOpenExternal}
              className="hidden sm:flex"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Preview */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium mb-3">Preview</h3>
              {renderPreview()}
            </div>

            {/* Document Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Document Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <div className="mt-1">
                      <Badge className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                    </div>
                  </div>
                    <div>
                    <label className="text-xs font-medium text-muted-foreground">Uploaded</label>
                    <p className="text-sm">{document.created_at ? format(new Date(document.created_at), 'PPP') : format(new Date(document.uploadDate), 'PPP')}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Uploaded by</label>
                    <p className="text-sm">{document.uploaded_by}</p>
                  </div>
                  
                  {document.file_size && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">File Size</label>
                      <p className="text-sm">{(document.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Version History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">Version 1.0</p>
                        <p className="text-xs text-muted-foreground">Current version</p>
                      </div>
                      <Badge variant="outline">Current</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Version control will be available in future updates
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Related Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Related Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No related documents found
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
