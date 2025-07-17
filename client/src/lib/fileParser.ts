import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedFileContent {
  type: 'text' | 'html' | 'table' | 'error';
  content: string;
  data?: any; // For structured data like CSV/Excel
  error?: string;
}

/**
 * Fetches file content from a URL as ArrayBuffer
 */
export async function fetchFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching file:', error);
    throw error;
  }
}

/**
 * Fetches file content from a URL as text
 */
export async function fetchFileAsText(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching file as text:', error);
    throw error;
  }
}

/**
 * Parses Word documents (.doc, .docx) to HTML
 */
export async function parseWordDocument(arrayBuffer: ArrayBuffer): Promise<ParsedFileContent> {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Word document conversion warnings:', result.messages);
    }
    
    return {
      type: 'html',
      content: result.value
    };
  } catch (error) {
    console.error('Error parsing Word document:', error);
    return {
      type: 'error',
      content: '',
      error: `Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses Excel files (.xlsx, .xls) to table data
 */
export async function parseExcelFile(arrayBuffer: ArrayBuffer): Promise<ParsedFileContent> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Create HTML table
    let htmlContent = '<div class="excel-viewer">';
    htmlContent += `<h4 class="sheet-title">Sheet: ${worksheetName}</h4>`;
    htmlContent += '<table class="excel-table">';
    
    jsonData.forEach((row: any, index: number) => {
      const tag = index === 0 ? 'th' : 'td';
      htmlContent += '<tr>';
      if (Array.isArray(row)) {
        row.forEach((cell: any) => {
          htmlContent += `<${tag}>${cell || ''}</${tag}>`;
        });
      }
      htmlContent += '</tr>';
    });
    
    htmlContent += '</table></div>';
    
    return {
      type: 'table',
      content: htmlContent,
      data: {
        sheets: workbook.SheetNames,
        currentSheet: worksheetName,
        rawData: jsonData
      }
    };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return {
      type: 'error',
      content: '',
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses CSV files to table data
 */
export async function parseCsvFile(text: string): Promise<ParsedFileContent> {
  try {
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<string[]>) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const data = results.data as string[][];
          
          // Create HTML table
          let htmlContent = '<div class="csv-viewer">';
          htmlContent += '<table class="csv-table">';
          
          data.forEach((row: string[], index: number) => {
            const tag = index === 0 ? 'th' : 'td';
            htmlContent += '<tr>';
            row.forEach((cell: string) => {
              htmlContent += `<${tag}>${cell || ''}</${tag}>`;
            });
            htmlContent += '</tr>';
          });
          
          htmlContent += '</table></div>';
          
          resolve({
            type: 'table',
            content: htmlContent,
            data: {
              rawData: data,
              rowCount: data.length,
              columnCount: data[0]?.length || 0
            }
          });
        },
        error: (error: Papa.ParseError) => {
          resolve({
            type: 'error',
            content: '',
            error: `Failed to parse CSV file: ${error.message}`
          });
        }
      });
    });
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    return {
      type: 'error',
      content: '',
      error: `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Formats text content for display (for .txt, .sql files)
 */
export function formatTextContent(text: string, language?: string): ParsedFileContent {
  try {
    return {
      type: 'text',
      content: text,
      data: {
        language: language || 'text',
        lineCount: text.split('\n').length,
        characterCount: text.length
      }
    };
  } catch (error) {
    console.error('Error formatting text content:', error);
    return {
      type: 'error',
      content: '',
      error: `Failed to format text content: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Determines the appropriate parser based on file extension
 */
export function getFileType(filename: string): 'word' | 'excel' | 'csv' | 'text' | 'unsupported' {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'doc':
    case 'docx':
      return 'word';
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'csv':
      return 'csv';
    case 'txt':
    case 'sql':
    case 'md':
    case 'json':
    case 'xml':
    case 'log':
      return 'text';
    default:
      return 'unsupported';
  }
}

/**
 * Main parser function that handles different file types
 */
export async function parseFile(url: string, filename: string): Promise<ParsedFileContent> {
  const fileType = getFileType(filename);
  
  try {
    switch (fileType) {
      case 'word': {
        const arrayBuffer = await fetchFileAsArrayBuffer(url);
        return await parseWordDocument(arrayBuffer);
      }
      case 'excel': {
        const arrayBuffer = await fetchFileAsArrayBuffer(url);
        return await parseExcelFile(arrayBuffer);
      }
      case 'csv': {
        const text = await fetchFileAsText(url);
        return await parseCsvFile(text);
      }
      case 'text': {
        const text = await fetchFileAsText(url);
        const language = filename.toLowerCase().endsWith('.sql') ? 'sql' : 'text';
        return formatTextContent(text, language);
      }
      default:
        return {
          type: 'error',
          content: '',
          error: 'Unsupported file type for parsing'
        };
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    return {
      type: 'error',
      content: '',
      error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}