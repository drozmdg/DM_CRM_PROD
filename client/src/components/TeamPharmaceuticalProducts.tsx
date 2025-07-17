import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Package, Plus, Edit, Trash2, Users, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProductModal from "@/components/ProductModal";
import type { Team, Product, TeamProduct, ResponsibilityLevel } from "@shared/types";

interface TeamPharmaceuticalProductsProps {
  team: Team;
  customerId: string;
  onUpdate: () => void;
}

export default function TeamPharmaceuticalProducts({ 
  team, 
  customerId, 
  onUpdate 
}: TeamPharmaceuticalProductsProps) {
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProductToAssign, setSelectedProductToAssign] = useState<string>("");
  const [responsibilityLevel, setResponsibilityLevel] = useState<ResponsibilityLevel>("Secondary");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch products for this team
  const { data: teamProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/team", team.id],
    queryFn: async () => {
      const response = await fetch(`/api/products/team/${team.id}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error("Failed to fetch team products");
      return response.json();
    },
    enabled: !!team.id,
  });

  // Fetch all customer products for assignment
  const { data: allCustomerProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/products?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error("Failed to fetch customer products");
      return response.json();
    },
    enabled: !!customerId,
  });

  // Remove product from team
  const removeProductMutation = useMutation({
    mutationFn: async ({ productId, teamId }: { productId: string; teamId: string }) => {
      await apiRequest("DELETE", `/api/products/${productId}/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/team", team.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onUpdate();
      toast({
        title: "Product removed",
        description: "Product has been removed from this team successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove product from team",
        variant: "destructive",
      });
    },
  });

  // Assign existing product to team
  const assignProductMutation = useMutation({
    mutationFn: async ({ productId, teamId, responsibility }: { 
      productId: string; 
      teamId: string; 
      responsibility: ResponsibilityLevel;
    }) => {
      await apiRequest("POST", `/api/products/${productId}/teams`, {
        teamId,
        isPrimary: responsibility === "Primary",
        responsibilityLevel: responsibility
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/team", team.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onUpdate();
      setShowAssignModal(false);
      setSelectedProductToAssign("");
      setResponsibilityLevel("Secondary");
      toast({
        title: "Product assigned",
        description: "Product has been assigned to this team successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign product to team",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = () => {
    setSelectedProduct(undefined);
    setShowProductModal(true);
  };

  const handleAssignExistingProduct = () => {
    setShowAssignModal(true);
  };

  const handleAssignProduct = () => {
    if (!selectedProductToAssign) {
      toast({
        title: "Error",
        description: "Please select a product to assign.",
        variant: "destructive",
      });
      return;
    }
    assignProductMutation.mutate({
      productId: selectedProductToAssign,
      teamId: team.id,
      responsibility: responsibilityLevel
    });
  };

  // Get products available for assignment (not already assigned to this team)
  const availableProducts = allCustomerProducts.filter(product => 
    !product.teams?.some(tp => tp.teamId === team.id)
  );

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleRemoveProduct = (productId: string) => {
    if (confirm("Are you sure you want to remove this product from this team?")) {
      removeProductMutation.mutate({ productId, teamId: team.id });
    }
  };

  const getResponsibilityBadge = (teamProduct: TeamProduct) => {
    const level = teamProduct.responsibilityLevel || (teamProduct.isPrimary ? "Primary" : "Secondary");
    const variant = level === "Primary" ? "default" : level === "Secondary" ? "secondary" : "outline";
    return (
      <Badge variant={variant} className="text-xs">
        {level}
      </Badge>
    );
  };

  const getRegulatoryStatusBadge = (status?: string) => {
    if (!status) return null;
    const variant = status === "Approved" ? "default" : "outline";
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading pharmaceutical products...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Pharmaceutical Products</h3>
            <p className="text-sm text-gray-600">
              Products managed by the {team.name} team
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAssignExistingProduct}>
              <Link className="mr-2 h-4 w-4" />
              Assign Existing
            </Button>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>

        {teamProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">
                This team doesn't manage any pharmaceutical products yet.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAssignExistingProduct}>
                  <Link className="mr-2 h-4 w-4" />
                  Assign Existing
                </Button>
                <Button onClick={handleCreateProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teamProducts.map((product) => {
              const teamAssignment = product.teams?.find(tp => tp.teamId === team.id);
              
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {product.name}
                          {teamAssignment && getResponsibilityBadge(teamAssignment)}
                        </CardTitle>
                        {product.code && (
                          <p className="text-sm text-gray-500 mt-1">{product.code}</p>
                        )}
                      </div>
                      <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                    
                    {/* Pharmaceutical Information */}
                    <div className="space-y-2">
                      {product.therapeuticArea && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Therapeutic Area:</span>
                          <Badge variant="secondary" className="text-xs">{product.therapeuticArea}</Badge>
                        </div>
                      )}
                      {product.drugClass && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Drug Class:</span>
                          <Badge variant="outline" className="text-xs">{product.drugClass}</Badge>
                        </div>
                      )}
                      {product.indication && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Indication:</span>
                          <span className="text-xs text-gray-700">{product.indication}</span>
                        </div>
                      )}
                      {product.regulatoryStatus && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Status:</span>
                          {getRegulatoryStatusBadge(product.regulatoryStatus)}
                        </div>
                      )}
                    </div>

                    {/* Other Teams */}
                    {product.teams && product.teams.length > 1 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-500">Also managed by:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.teams
                            .filter(tp => tp.teamId !== team.id)
                            .map((tp) => (
                              <Badge key={tp.teamId} variant="outline" className="text-xs">
                                {tp.team?.name || tp.teamId}
                                {tp.responsibilityLevel && ` (${tp.responsibilityLevel})`}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(undefined);
          }}
          product={selectedProduct}
          customerId={customerId}
          teamId={team.id} // Pass team context
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/products/team", team.id] });
            onUpdate();
          }}
        />
      )}

      {/* Assign Existing Product Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Existing Product to {team.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Select Product</Label>
              <Select value={selectedProductToAssign} onValueChange={setSelectedProductToAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No products available for assignment
                    </SelectItem>
                  ) : (
                    availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                        {product.therapeuticArea && ` (${product.therapeuticArea})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsibility">Responsibility Level</Label>
              <Select value={responsibilityLevel} onValueChange={(value: ResponsibilityLevel) => setResponsibilityLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary - Main responsible team</SelectItem>
                  <SelectItem value="Secondary">Secondary - Supporting team</SelectItem>
                  <SelectItem value="Support">Support - Advisory role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProductToAssign("");
                  setResponsibilityLevel("Secondary");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignProduct}
                disabled={!selectedProductToAssign || assignProductMutation.isPending}
              >
                {assignProductMutation.isPending ? "Assigning..." : "Assign Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}