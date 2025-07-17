import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import type { Customer, Contact } from "@shared/types";

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

interface ContactImportProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
}

export default function ContactImport({ isOpen, onClose, customers }: ContactImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultCustomerId, setDefaultCustomerId] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'json') {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or JSON file",
          variant: "destructive",
        });
      }
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const contact: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const normalizedHeader = header.toLowerCase();
        
        if (normalizedHeader.includes('name')) contact.name = value;
        else if (normalizedHeader.includes('email')) contact.email = value;
        else if (normalizedHeader.includes('phone')) contact.phone = value;
        else if (normalizedHeader.includes('title') || normalizedHeader.includes('job')) contact.title = value;
        else if (normalizedHeader.includes('role')) contact.role = value;
        else if (normalizedHeader.includes('type')) contact.type = value;
        else if (normalizedHeader.includes('customer')) contact.customerName = value;
      });
      
      contacts.push(contact);
    }
    
    return contacts;
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      
      setIsImporting(true);
      setImportProgress(0);
      
      const text = await selectedFile.text();
      let contacts: any[] = [];
      
      try {
        if (selectedFile.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          contacts = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          contacts = parseCSV(text);
        }
      } catch (error) {
        throw new Error("Failed to parse file. Please check the format.");
      }
      
      if (contacts.length === 0) {
        throw new Error("No valid contacts found in the file");
      }
      
      // Process contacts in batches
      const results: ImportResult = {
        success: true,
        imported: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        setImportProgress(((i + 1) / contacts.length) * 100);
        
        try {
          // Validate required fields
          if (!contact.name || !contact.email) {
            results.errors.push({
              row: i + 1,
              error: "Missing required fields (name or email)",
              data: contact
            });
            results.failed++;
            continue;
          }
          
          // Find customer ID
          let customerId = defaultCustomerId;
          if (contact.customerName && !customerId) {
            const customer = customers.find(c => 
              c.name.toLowerCase() === contact.customerName.toLowerCase()
            );
            customerId = customer?.id || "";
          }
          
          if (!customerId) {
            results.errors.push({
              row: i + 1,
              error: "No customer specified or found",
              data: contact
            });
            results.failed++;
            continue;
          }
          
          const contactData = {
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            title: contact.title || null,
            role: contact.role || null,
            type: contact.type === "Internal" ? "Internal" : "Client",
            customerId: customerId
          };
          
          await apiRequest("POST", "/api/contacts", contactData);
          results.imported++;
          
        } catch (error: any) {
          results.errors.push({
            row: i + 1,
            error: error.message || "Failed to import contact",
            data: contact
          });
          results.failed++;
        }
      }
      
      return results;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setIsImporting(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      toast({
        title: "Import Complete",
        description: `Imported ${result.imported} contacts. ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (error: any) => {
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      });
    },
  });

  const downloadTemplate = (format: 'csv' | 'json') => {
    const template = {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      title: "Manager",
      role: "Project Manager",
      type: "Client",
      customerName: "Acme Corp"
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify([template], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contact-import-template.json';
      a.click();
    } else {
      const csv = [
        'name,email,phone,title,role,type,customerName',
        `"${template.name}","${template.email}","${template.phone}","${template.title}","${template.role}","${template.type}","${template.customerName}"`
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contact-import-template.csv';
      a.click();
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setDefaultCustomerId("");
    setImportResult(null);
    setIsImporting(false);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="text-blue-500 mt-1" size={16} />
                <div>
                  <h4 className="font-medium text-neutral-800 mb-1">Import Instructions</h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Upload a CSV or JSON file with contact information</li>
                    <li>• Required fields: name, email</li>
                    <li>• Optional fields: phone, title, role, type, customerName</li>
                    <li>• If no customer is specified in the file, select a default customer below</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Download */}
          <div>
            <Label className="text-sm font-medium">Download Template</Label>
            <div className="flex space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('csv')}
              >
                <Download size={14} className="mr-2" />
                CSV Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('json')}
              >
                <Download size={14} className="mr-2" />
                JSON Template
              </Button>
            </div>
          </div>

          {/* Default Customer Selection */}
          <div>
            <Label htmlFor="defaultCustomer">Default Customer (Optional)</Label>
            <Select value={defaultCustomerId} onValueChange={setDefaultCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select default customer for contacts without one" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">Upload File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-dashed border-2"
                disabled={isImporting}
              >
                <div className="text-center">
                  <Upload className="mx-auto mb-2" size={24} />
                  <p>Click to select CSV or JSON file</p>
                  {selectedFile && (
                    <p className="text-sm text-neutral-600 mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Importing contacts...</p>
                    <Progress value={importProgress} className="mt-2" />
                    <p className="text-xs text-neutral-600 mt-1">{Math.round(importProgress)}% complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {importResult.failed === 0 ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertCircle className="text-yellow-500" size={20} />
                    )}
                    <h4 className="font-medium">Import Results</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                      <div className="text-sm text-neutral-600">Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-neutral-600">Failed</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-neutral-800 mb-2">Errors:</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm bg-red-50 p-2 rounded">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {selectedFile && !importResult && (
              <Button
                onClick={() => importMutation.mutate()}
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : "Import Contacts"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
