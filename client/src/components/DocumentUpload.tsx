import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const documentFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  customerId: z.number().min(1, "Customer is required"),
});

interface DocumentUploadProps {
  isOpen?: boolean;
  onClose?: () => void;
  customerId?: number;
  onUploadComplete?: () => void;
  standalone?: boolean;
}

export default function DocumentUpload({ 
  isOpen = true, 
  onClose, 
  customerId, 
  onUploadComplete,
  standalone = false 
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Technical",
      customerId: customerId || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // In a real app, you would upload the file to a storage service
      const documentData = {
        ...data,
        fileUrl: `/uploads/${selectedFile?.name || "document.pdf"}`,
        fileSize: selectedFile?.size || 0,
        mimeType: selectedFile?.type || "application/pdf",
      };
      
      const response = await apiRequest("POST", "/api/documents", documentData);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
      setTimeout(() => {
        handleClose();
        onUploadComplete && onUploadComplete();
      }, 1000);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File | null) => {
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, DOC, DOCX, XLS, XLSX, TXT, or image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      if (!form.getValues("name")) {
        form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose && onClose();
  };

  const onSubmit = (data: any) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt={file.name} className="w-8 h-8 object-cover rounded" />;
    }
    return <FileText className="w-8 h-8 text-primary" />;
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <Label>File Upload *</Label>
        <div className="mt-2">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-neutral-300 hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-neutral-800 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-neutral-600">
                PDF, DOC, DOCX, XLS, XLSX, TXT, or image files up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(selectedFile)}
                      <div>
                        <p className="font-medium text-neutral-800">{selectedFile.name}</p>
                        <p className="text-sm text-neutral-600">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    {!mutation.isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  
                  {/* Upload Progress */}
                  {(mutation.isPending || uploadProgress > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {uploadProgress === 100 ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Upload complete
                            </span>
                          ) : mutation.isError ? (
                            <span className="flex items-center text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Upload failed
                            </span>
                          ) : (
                            `Uploading... ${uploadProgress}%`
                          )}
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerId">Customer *</Label>
          <Select 
            value={form.watch("customerId").toString()} 
            onValueChange={(value) => form.setValue("customerId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(customers) && customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Requirements">Requirements</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Report">Report</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Document Name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter document name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Enter document description (optional)"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {!standalone && (
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={mutation.isPending || !selectedFile || uploadProgress === 100}
        >
          {mutation.isPending ? "Uploading..." : 
           uploadProgress === 100 ? "Upload Complete" :
           "Upload Document"}
        </Button>
      </div>
    </form>
  );

  if (standalone) {
    return formContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
