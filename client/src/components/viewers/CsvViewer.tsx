import React, { useState, useEffect } from 'react';
import { parseCsvFile, fetchFileAsText } from '../../lib/fileParser';
import { Loader2, FileText, AlertCircle, Grid, Download, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CsvViewerProps {
  url: string;
  filename: string;
}

interface CsvData {
  rawData: string[][];
  rowCount: number;
  columnCount: number;
}

export default function CsvViewer({ url, filename }: CsvViewerProps) {
  const [content, setContent] = useState<string>('');
  const [data, setData] = useState<CsvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<string[][] | null>(null);

  useEffect(() => {
    const loadCsvFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const text = await fetchFileAsText(url);
        const result = await parseCsvFile(text);
        
        if (result.type === 'error') {
          setError(result.error || 'Failed to parse CSV file');
        } else {
          setContent(result.content);
          setData(result.data as CsvData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV file');
      } finally {
        setLoading(false);
      }
    };

    loadCsvFile();
  }, [url]);

  useEffect(() => {
    if (!data || !searchTerm.trim()) {
      setFilteredData(null);
      return;
    }

    const filtered = data.rawData.filter((row, index) => {
      // Always include header row
      if (index === 0) return true;
      
      return row.some(cell => 
        cell?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredData(filtered);
  }, [searchTerm, data]);

  const downloadAsExcel = () => {
    if (!data) return;
    
    // Create a simple TSV format for Excel compatibility
    const tsvContent = data.rawData
      .map(row => row.join('\t'))
      .join('\n');
    
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\.[^/.]+$/, '')}.tsv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayData = filteredData || data?.rawData || [];
  const displayRowCount = filteredData ? filteredData.length - 1 : (data?.rowCount || 0) - 1; // Subtract header

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading CSV file...</p>
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
            <p className="text-sm text-destructive mb-2">Failed to load CSV file</p>
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
            <FileText className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm">{filename}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadAsExcel}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              TSV
            </Button>
          </div>
        </div>
        
        {data && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Grid className="h-3 w-3" />
                <span>{displayRowCount} rows × {data.columnCount} columns</span>
              </div>
              {filteredData && (
                <Badge variant="outline" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
            
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto border-t">
          {displayData.length > 0 ? (
            <table className="csv-table w-full border-collapse text-xs">
              <thead>
                <tr>
                  {displayData[0]?.map((header, index) => (
                    <th key={index} className="csv-header">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className="csv-row">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="csv-cell">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No data to display</p>
            </div>
          )}
        </div>
        
        {filteredData && (
          <div className="border-t p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Showing {displayRowCount} of {(data?.rowCount || 0) - 1} rows matching "{searchTerm}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// CSS styles for CSV content (to be added to global CSS)
export const csvViewerStyles = `
.csv-table {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.75rem;
  line-height: 1.4;
}

.csv-header {
  background-color: var(--muted);
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.csv-cell {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.csv-row:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

.csv-row:nth-child(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.csv-row:hover {
  background-color: var(--accent);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .csv-row:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }
  
  .csv-row:nth-child(odd) {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
`;