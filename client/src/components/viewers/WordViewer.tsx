import React, { useState, useEffect } from 'react';
import { parseWordDocument, fetchFileAsArrayBuffer } from '../../lib/fileParser';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface WordViewerProps {
  url: string;
  filename: string;
}

export default function WordViewer({ url, filename }: WordViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWordDocument = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const arrayBuffer = await fetchFileAsArrayBuffer(url);
        const result = await parseWordDocument(arrayBuffer);
        
        if (result.type === 'error') {
          setError(result.error || 'Failed to parse Word document');
        } else {
          setContent(result.content);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Word document');
      } finally {
        setLoading(false);
      }
    };

    loadWordDocument();
  }, [url]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading Word document...</p>
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
            <p className="text-sm text-destructive mb-2">Failed to load Word document</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b p-4 bg-muted/50">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{filename}</span>
          </div>
        </div>
        
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <div 
            className="word-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.6',
              color: 'var(--foreground)'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// CSS styles for Word content (to be added to global CSS or styled component)
export const wordViewerStyles = `
.word-content {
  /* Basic text styling */
}

.word-content p {
  margin-bottom: 1em;
}

.word-content h1, .word-content h2, .word-content h3, 
.word-content h4, .word-content h5, .word-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.word-content h1 { font-size: 1.5em; }
.word-content h2 { font-size: 1.3em; }
.word-content h3 { font-size: 1.1em; }

.word-content ul, .word-content ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.word-content li {
  margin-bottom: 0.25em;
}

.word-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  border: 1px solid var(--border);
}

.word-content th, .word-content td {
  border: 1px solid var(--border);
  padding: 0.5em;
  text-align: left;
}

.word-content th {
  background-color: var(--muted);
  font-weight: 600;
}

.word-content strong {
  font-weight: 600;
}

.word-content em {
  font-style: italic;
}

.word-content img {
  max-width: 100%;
  height: auto;
  margin: 1em 0;
}
`;