import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Product, TherapeuticArea, DrugClass, RegulatoryStatus } from "@shared/types";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
  customerId: z.string(),
  therapeuticArea: z.string().optional().nullable(),
  drugClass: z.string().optional().nullable(),
  indication: z.string().optional(),
  regulatoryStatus: z.string().optional(),
});

const therapeuticAreas: TherapeuticArea[] = [
  'Oncology', 'Cardiology', 'Neurology', 'Immunology', 'Infectious Disease',
  'Endocrinology', 'Gastroenterology', 'Respiratory', 'Dermatology',
  'Ophthalmology', 'Psychiatry', 'Rheumatology', 'Rare Disease', 'Other'
];

const drugClasses: DrugClass[] = [
  'Monoclonal Antibody', 'Small Molecule', 'Protein Therapeutic', 'Gene Therapy',
  'Cell Therapy', 'Vaccine', 'Biosimilar', 'Combination Therapy',
  'Radiopharmaceutical', 'Medical Device', 'Diagnostic', 'Other'
];

const regulatoryStatuses: RegulatoryStatus[] = [
  'Approved', 'Phase III', 'Phase II', 'Phase I', 'Pre-clinical',
  'Discovery', 'Discontinued', 'On Hold'
];

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  customerId: string;
  teamId?: string; // Team context for auto-assignment
  onSuccess?: () => void; // Callback for successful operations
}

export default function ProductModal({ isOpen, onClose, product, customerId, teamId, onSuccess }: ProductModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
      isActive: true,
      customerId: customerId,
      therapeuticArea: "none",
      drugClass: "none",
      indication: "",
      regulatoryStatus: "Pre-clinical",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        code: product.code || "",
        isActive: product.isActive,
        customerId: customerId,
        therapeuticArea: product.therapeuticArea || "none",
        drugClass: product.drugClass || "none",
        indication: product.indication || "",
        regulatoryStatus: product.regulatoryStatus || "Pre-clinical",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        code: "",
        isActive: true,
        customerId: customerId,
        therapeuticArea: "none",
        drugClass: "none",
        indication: "",
        regulatoryStatus: "Pre-clinical",
      });
    }
  }, [product, customerId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      const response = await apiRequest("POST", "/api/products", data);
      const newProduct = await response.json();
      
      // Auto-assign to team if teamId is provided
      if (teamId && newProduct.id) {
        await apiRequest("POST", `/api/products/${newProduct.id}/teams`, { teamId, isPrimary: true });
      }
      
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/products/team", teamId] });
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      }
      toast({
        title: "Pharmaceutical product created",
        description: teamId 
          ? "The product has been created and assigned to the team successfully."
          : "The product has been created successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      const response = await apiRequest("PUT", `/api/products/${product?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/products/team", teamId] });
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      }
      toast({
        title: "Pharmaceutical product updated",
        description: "The product has been updated successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    // Convert "none" values back to empty strings for API
    const apiData = {
      ...data,
      therapeuticArea: data.therapeuticArea === "none" ? undefined : data.therapeuticArea,
      drugClass: data.drugClass === "none" ? undefined : data.drugClass,
    };
    
    if (product) {
      updateMutation.mutate(apiData);
    } else {
      createMutation.mutate(apiData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Pharmaceutical Product" : "Create Pharmaceutical Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter product name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Product Code (Optional)</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="e.g., PRD-001"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="therapeuticArea">Therapeutic Area</Label>
                <Select
                  value={form.watch("therapeuticArea") || "none"}
                  onValueChange={(value) => form.setValue("therapeuticArea", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapeutic area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None selected</SelectItem>
                    {therapeuticAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="drugClass">Drug Class</Label>
                <Select
                  value={form.watch("drugClass") || "none"}
                  onValueChange={(value) => form.setValue("drugClass", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drug class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None selected</SelectItem>
                    {drugClasses.map((drugClass) => (
                      <SelectItem key={drugClass} value={drugClass}>
                        {drugClass}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="indication">Indication</Label>
              <Input
                id="indication"
                {...form.register("indication")}
                placeholder="Medical condition or indication the product treats"
              />
            </div>

            <div>
              <Label htmlFor="regulatoryStatus">Regulatory Status</Label>
              <Select
                value={form.watch("regulatoryStatus") || "Pre-clinical"}
                onValueChange={(value) => form.setValue("regulatoryStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select regulatory status" />
                </SelectTrigger>
                <SelectContent>
                  {regulatoryStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {product ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}