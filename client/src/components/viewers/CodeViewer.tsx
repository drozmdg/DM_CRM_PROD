import React, { useState, useEffect } from 'react';
import { formatTextContent, fetchFileAsText } from '../../lib/fileParser';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, FileText, AlertCircle, Copy, Download, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CodeViewerProps {
  url: string;
  filename: string;
}

interface TextData {
  language: string;
  lineCount: number;
  characterCount: number;
}

export default function CodeViewer({ url, filename }: CodeViewerProps) {
  const [content, setContent] = useState<string>('');
  const [data, setData] = useState<TextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(isDark);
    };
    
    checkTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    
    return () => mediaQuery.removeEventListener('change', checkTheme);
  }, []);

  useEffect(() => {
    const loadTextFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const text = await fetchFileAsText(url);
        const language = getLanguageFromFilename(filename);
        const result = formatTextContent(text, language);
        
        if (result.type === 'error') {
          setError(result.error || 'Failed to load text file');
        } else {
          setContent(result.content);
          setData(result.data as TextData);
          setSelectedLanguage(language);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load text file');
      } finally {
        setLoading(false);
      }
    };

    loadTextFile();
  }, [url, filename]);

  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'sql':
        return 'sql';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'md':
        return 'markdown';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'sh':
      case 'bash':
        return 'bash';
      default:
        return 'text';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const highlightSearchTerm = (code: string) => {
    if (!searchTerm.trim()) return code;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return code.replace(regex, '<mark style="background: yellow; color: black;">$1</mark>');
  };

  const getMatchCount = () => {
    if (!searchTerm.trim()) return 0;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (content.match(regex) || []).length;
  };

  const availableLanguages = [
    { value: 'text', label: 'Plain Text' },
    { value: 'sql', label: 'SQL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'yaml', label: 'YAML' },
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'bash', label: 'Bash' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading file...</p>
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
            <p className="text-sm text-destructive mb-2">Failed to load file</p>
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
            <FileText className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm">{filename}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadFile}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        {data && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>{data.lineCount} lines</span>
              <span>{data.characterCount} characters</span>
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  {getMatchCount()} matches
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative w-32">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                  <ChevronDown className="h-3 w-3" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value} className="text-xs">
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto border-t">
          <SyntaxHighlighter
            language={selectedLanguage === 'text' ? undefined : selectedLanguage}
            style={isDarkTheme ? oneDark : oneLight}
            showLineNumbers
            customStyle={{
              margin: 0,
              fontSize: '0.75rem',
              lineHeight: '1.4',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, "Roboto Mono", Consolas, monospace'
              }
            }}
          >
            {searchTerm ? highlightSearchTerm(content) : content}
          </SyntaxHighlighter>
        </div>
      </CardContent>
    </Card>
  );
}