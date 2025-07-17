import React, { useState, useEffect } from 'react';
import { parseExcelFile, fetchFileAsArrayBuffer } from '../../lib/fileParser';
import { Loader2, FileSpreadsheet, AlertCircle, Grid, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ExcelViewerProps {
  url: string;
  filename: string;
}

interface ExcelData {
  sheets: string[];
  currentSheet: string;
  rawData: any[][];
}

export default function ExcelViewer({ url, filename }: ExcelViewerProps) {
  const [content, setContent] = useState<string>('');
  const [data, setData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcelFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const arrayBuffer = await fetchFileAsArrayBuffer(url);
        const result = await parseExcelFile(arrayBuffer);
        
        if (result.type === 'error') {
          setError(result.error || 'Failed to parse Excel file');
        } else {
          setContent(result.content);
          setData(result.data as ExcelData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Excel file');
      } finally {
        setLoading(false);
      }
    };

    loadExcelFile();
  }, [url]);

  const downloadAsCSV = () => {
    if (!data || !data.rawData) return;
    
    const csvContent = data.rawData
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_${data.currentSheet}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading Excel file...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96 p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-destructive mb-2">Failed to load Excel file</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm">{filename}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadAsCSV}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        
        {data && (
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Grid className="h-3 w-3" />
              <span>{data.rawData.length} rows × {data.rawData[0]?.length || 0} columns</span>
            </div>
            {data.sheets.length > 1 && (
              <Badge variant="outline" className="text-xs">
                {data.sheets.length} sheets
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto border-t">
          <div 
            className="excel-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        
        {data && data.sheets.length > 1 && (
          <div className="border-t p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Available sheets:</p>
            <div className="flex flex-wrap gap-1">
              {data.sheets.map(sheet => (
                <Badge 
                  key={sheet} 
                  variant={sheet === data.currentSheet ? "default" : "outline"}
                  className="text-xs"
                >
                  {sheet}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently showing: <strong>{data.currentSheet}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// CSS styles for Excel content (to be added to global CSS)
export const excelViewerStyles = `
.excel-content {
  /* Container styling */
}

.excel-viewer {
  font-family: system-ui, -apple-system, sans-serif;
}

.sheet-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  line-height: 1.4;
}

.excel-table th {
  background-color: var(--muted);
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 1;
}

.excel-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.excel-table tr:nth-child(even) {
  background-color: var(--muted/50);
}

.excel-table tr:hover {
  background-color: var(--accent);
}

/* Zebra striping */
.excel-table tbody tr:nth-child(odd) {
  background-color: rgba(0, 0, 0, 0.02);
}

.excel-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .excel-table tbody tr:nth-child(odd) {
    background-color: rgba(255, 255, 255, 0.02);
  }
  
  .excel-table tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
`;