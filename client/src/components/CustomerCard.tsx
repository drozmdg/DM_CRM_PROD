import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Eye, 
  Edit, 
  Users, 
  FolderOpen, 
  Settings,
  Building,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  RotateCcw,
  UserX,
  Lock
} from "lucide-react";
import CustomerAvatar from "./CustomerAvatar";
import { usePermissions } from "./auth/ProtectedRoute";
import type { Customer } from "@shared/types";

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onReactivate?: (customer: Customer) => void;
  onDeactivate?: (customer: Customer) => void;
}

export default function CustomerCard({ customer, onView, onEdit, onReactivate, onDeactivate }: CustomerCardProps) {
  const [, setLocation] = useLocation();
  const { canEditCustomers } = usePermissions();
  
  // Fetch related data for this customer
  const { data: processes } = useQuery({
    queryKey: ["/api/processes", { customerId: customer.id }],
    queryFn: async () => {
      const response = await fetch(`/api/processes?customerId=${customer.id}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams", { customerId: customer.id }],
    queryFn: async () => {
      const response = await fetch(`/api/teams?customerId=${customer.id}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services", { customerId: customer.id }],
    queryFn: async () => {
      const response = await fetch(`/api/services?customerId=${customer.id}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts", { customerId: customer.id }],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?customerId=${customer.id}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "New Activation": return "bg-success/10 text-success border-success/20";
      case "Steady State": return "bg-primary/10 text-primary border-primary/20";
      case "Contracting": return "bg-warning/10 text-warning border-warning/20";
      case "Pending Termination": return "bg-destructive/10 text-destructive border-destructive/20";      case "Terminated": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getProcessStatusCounts = () => {
    if (!processes) return { active: 0, completed: 0, onHold: 0 };
    
    return {
      active: processes.filter((p: any) => p.status === 'In Progress' || p.status === 'Planning').length,
      completed: processes.filter((p: any) => p.status === 'Completed').length,
      onHold: processes.filter((p: any) => p.status === 'On Hold').length,
    };
  };
  const getActiveServices = () => {
    if (!services) return [];
    return services.filter((s: any) => s.monthlyHours > 0);
  };

  const getLeadContact = () => {
    if (!contacts) return null;
    return contacts.find((c: any) => c.type === 'Client') || contacts[0];
  };

  const statusCounts = getProcessStatusCounts();
  const activeServices = getActiveServices();
  const leadContact = getLeadContact();
  
  // Check edit permissions
  const canEdit = canEditCustomers;
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 ${
      customer.active === false 
        ? 'border-l-neutral-300 opacity-75 bg-neutral-50' 
        : 'border-l-primary/20'
    }`}>
      <CardContent className="p-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CustomerAvatar 
              name={customer.name}
              avatarColor={customer.avatarColor}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-800 truncate text-lg">
                {customer.name}
              </h3>
              <Badge variant="outline" className={getPhaseColor(customer.phase)}>
                {customer.phase}
              </Badge>
            </div>
          </div>
            {/* Status Indicator */}
          <div className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${customer.active === false ? 'bg-neutral-400' : 'bg-success'}`}></span>
            <span className="text-xs text-neutral-600">
              {customer.active === false ? 'Inactive' : 'Active'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Processes */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FolderOpen className="text-blue-600" size={16} />
            </div>
            <div className="text-lg font-semibold text-neutral-800">
              {processes?.length || 0}
            </div>
            <div className="text-xs text-neutral-600">Processes</div>
            {statusCounts.active > 0 && (
              <div className="text-xs text-success mt-1">
                {statusCounts.active} active
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="text-green-600" size={16} />
            </div>
            <div className="text-lg font-semibold text-neutral-800">
              {teams?.length || 0}
            </div>
            <div className="text-xs text-neutral-600">Teams</div>
            {teams && teams.length > 0 && (
              <div className="text-xs text-neutral-500 mt-1">
                {teams[0].name}
              </div>
            )}
          </div>

          {/* Services */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Settings className="text-purple-600" size={16} />
            </div>
            <div className="text-lg font-semibold text-neutral-800">
              {activeServices.length}
            </div>
            <div className="text-xs text-neutral-600">Services</div>
            {activeServices.length > 0 && (
              <div className="text-xs text-success mt-1">
                Active
              </div>
            )}
          </div>
        </div>

        {/* Lead Contact */}
        {leadContact && (
          <div className="bg-neutral-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="text-primary" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-neutral-800">
                  {leadContact.name}
                </div>
                <div className="text-xs text-neutral-600">
                  {leadContact.title || 'Primary Contact'}
                </div>
              </div>
              <div className="flex space-x-1">
                {leadContact.email && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Mail size={12} />
                  </Button>
                )}
                {leadContact.phone && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Phone size={12} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contract Dates */}
        {(customer.contractStartDate || customer.contractEndDate) && (
          <div className="space-y-2 mb-4 text-sm">
            {customer.contractStartDate && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 flex items-center">
                  <Clock size={12} className="mr-1" />
                  Contract Start:
                </span>
                <span className="text-neutral-800">
                  {new Date(customer.contractStartDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {customer.contractEndDate && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 flex items-center">
                  <Clock size={12} className="mr-1" />
                  Contract End:
                </span>
                <span className="text-neutral-800">
                  {new Date(customer.contractEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/customers/${customer.id}`);
            }}
            className="text-primary hover:text-primary/80"
          >
            <Eye size={14} className="mr-1" />
            View Profile
          </Button>
            <div className="flex items-center space-x-2">            {/* Reactivate button */}
            {customer.active === false && onReactivate && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReactivate(customer);
                }}
                className="text-success hover:text-success/80"
                title="Reactivate customer"
              >
                <RotateCcw size={14} />
              </Button>
            )}
            {customer.active !== false && onDeactivate && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(customer);
                }}
                className="text-destructive hover:text-destructive/80"
                title="Deactivate customer"
              >
                <UserX size={14} />
              </Button>
            )}
            
            {/* Edit button with permission check */}
            {canEdit ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(customer);
                }}
                title="Edit customer"
                className="hover:bg-neutral-100"
              >
                <Edit size={14} />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                disabled
                title="You don't have permission to edit this customer"
                className="opacity-50"
              >
                <Lock size={14} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(customer);
              }}
              className="group-hover:translate-x-1 transition-transform"
            >
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
