import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Building, Users, FileText, Activity, Settings, Clock, Package, Download } from "lucide-react";
import CustomerAvatar from "@/components/CustomerAvatar";
import CustomerStatusIndicator from "@/components/CustomerStatusIndicator";
import CustomerDocumentManager from "@/components/CustomerDocumentManager";
import EditCustomerModal from "@/components/EditCustomerModal";
import CustomerNotes from "@/components/CustomerNotes";
import CustomerImportantDates from "@/components/CustomerImportantDates";
import InternalContactManager from "@/components/InternalContactManager";
import ProductModal from "@/components/ProductModal";
import TeamModal from "@/components/TeamModal";
import CustomerReportExportModal from "@/components/CustomerReportExportModal";
import { Badge } from "@/components/ui/badge";
import CustomerPhaseBadge from "@/components/CustomerPhaseBadge";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import ContactTypeBadge from "@/components/ContactTypeBadge";
import StatusBadge from "@/components/StatusBadge";

interface CustomerProfileHeaderProps {
  customer: any;
  onEdit: () => void;
  onExportReport: () => void;
}

function CustomerProfileHeader({ customer, onEdit, onExportReport }: CustomerProfileHeaderProps) {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Customers</span>
          </Button>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onExportReport}
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Download size={16} className="mr-2" />
              Export Report
            </Button>
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/90">
              <Edit size={16} className="mr-2" />
              Edit Customer
            </Button>
          </div>
        </div>

        <div className="flex items-start space-x-6">
          <CustomerAvatar
            name={customer.name}
            avatarColor={customer.avatarColor}
            size="xl"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-neutral-800">{customer.name}</h1>
              <CustomerStatusIndicator phase={customer.phase} />
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-neutral-600 mb-4">
              {customer.contractStartDate && (
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Started {new Date(customer.contractStartDate).toLocaleDateString()}</span>
                </div>
              )}
              {customer.contractEndDate && (
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Ends {new Date(customer.contractEndDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">{customer.processes?.length || 0}</div>
                <div className="text-sm text-neutral-600">Processes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">{customer.services?.filter((s: any) => s.monthlyHours > 0).length || 0}</div>
                <div className="text-sm text-neutral-600">Active Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">{customer.teams?.length || 0}</div>
                <div className="text-sm text-neutral-600">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">{customer.documents?.length || 0}</div>
                <div className="text-sm text-neutral-600">Documents</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CustomerInformationProps {
  customer: any;
}

function CustomerInformation({ customer }: CustomerInformationProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building size={18} />
            <span>Company Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Company Name</label>
              <p className="text-sm text-neutral-800">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Phase</label>
              <div className="mt-1">
                <CustomerPhaseBadge phase={customer.phase} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Contract Start</label>
              <p className="text-sm text-neutral-800">
                {customer.contractStartDate 
                  ? new Date(customer.contractStartDate).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Contract End</label>
              <p className="text-sm text-neutral-800">
                {customer.contractEndDate 
                  ? new Date(customer.contractEndDate).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings size={18} />
            <span>Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerServices customerId={customer.id} />
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomerServicesProps {
  customerId: string;
}

function CustomerServices({ customerId }: CustomerServicesProps) {
  const { data: services } = useQuery({
    queryKey: ["/api/services", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/services?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const getTotalMonthlyHours = () => {
    return services?.reduce((total: number, service: any) => total + service.monthlyHours, 0) || 0;
  };

  const getHoursColor = (hours: number) => {
    if (hours >= 40) return "text-red-600";
    if (hours >= 20) return "text-yellow-600";
    return "text-green-600";
  };

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-6">
        <Settings className="mx-auto text-neutral-400 mb-2" size={32} />
        <h4 className="font-medium text-neutral-800 mb-2">No services yet</h4>
        <p className="text-sm text-neutral-600">
          Services will appear here once they are added to this customer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-neutral-600">Total Services: {services.length}</p>
          <p className="text-sm text-neutral-600">
            Monthly Hours: <span className={`font-medium ${getHoursColor(getTotalMonthlyHours())}`}>
              {getTotalMonthlyHours()}h
            </span>
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {services.slice(0, 4).map((service: any) => (
          <div key={service.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="text-primary" size={14} />
              </div>
              <div>
                <h4 className="font-medium text-neutral-800">{service.name}</h4>
                <div className="flex items-center text-sm text-neutral-600 mt-1">
                  <Clock className="mr-1" size={12} />
                  <span className={getHoursColor(service.monthlyHours)}>
                    {service.monthlyHours} hours/month
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ServiceStatusBadge isActive={service.monthlyHours > 0} />
            </div>
          </div>
        ))}
        
        {services.length > 4 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              View All {services.length} Services
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


interface RelatedProcessesProps {
  customerId: string;
}

function RelatedProcesses({ customerId }: RelatedProcessesProps) {
  const [, setLocation] = useLocation();
  const { data: processes } = useQuery({
    queryKey: ["/api/processes", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/processes?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} />
            <span>Related Processes</span>
          </div>
          <Badge variant="outline">{processes?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processes && processes.length > 0 ? (
          <div className="space-y-3">            {processes.slice(0, 5).map((process: any) => (
              <div 
                key={process.id} 
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/processes/${process.id}`)}
              >
                <div>
                  <h4 className="font-medium text-neutral-800">{process.name}</h4>
                  <p className="text-sm text-neutral-600">{process.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={process.status} />
                </div>
              </div>
            ))}
            {processes.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All {processes.length} Processes
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No processes found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


interface CustomerTeamsProps {
  customerId: string;
}

function CustomerTeams({ customerId }: CustomerTeamsProps) {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  const { data: teams } = useQuery({
    queryKey: ["/api/teams", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/teams?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });
  
  // Fetch products for each team to show in the display
  const { data: allProducts } = useQuery({
    queryKey: ["/api/products", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/products?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });
  
  const getTeamProducts = (teamId: string) => {
    if (!allProducts) return [];
    return allProducts.filter((product: any) => 
      product.teams?.some((tp: any) => tp.teamId === teamId)
    );
  };
  
  const handleTeamClick = (team: any) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={18} />
            <span>Teams</span>
          </div>
          <Badge variant="outline">{teams?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.slice(0, 5).map((team: any) => {
              const teamProducts = getTeamProducts(team.id);
              return (
                <div 
                  key={team.id} 
                  className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => handleTeamClick(team)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="text-primary" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-neutral-800">{team.name}</h4>
                          {teamProducts.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {teamProducts.length} product{teamProducts.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                          <span>Finance Code: {team.financeCode}</span>
                          <span>Start: {formatDate(team.startDate)}</span>
                          <span>End: {formatDate(team.endDate)}</span>
                        </div>
                        
                        {/* Show pharmaceutical products this team manages */}
                        {teamProducts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-neutral-500 mb-1">Manages pharmaceutical products:</p>
                            <div className="flex flex-wrap gap-1">
                              {teamProducts.slice(0, 3).map((product: any) => (
                                <Badge key={product.id} variant="secondary" className="text-xs">
                                  {product.name}
                                  {product.therapeuticArea && ` (${product.therapeuticArea})`}
                                </Badge>
                              ))}
                              {teamProducts.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{teamProducts.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeamClick(team);
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
            {teams.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All {teams.length} Teams
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No teams found</p>
          </div>
        )}
      </CardContent>
      
      {showTeamModal && (
        <TeamModal
          isOpen={showTeamModal}
          onClose={() => {
            setShowTeamModal(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          customerId={customerId}
        />
      )}
    </Card>
  );
}


interface CustomerContactsProps {
  customerId: string;
}

function CustomerContacts({ customerId }: CustomerContactsProps) {
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts", { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?customerId=${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={18} />
            <span>Contacts</span>
          </div>
          <Badge variant="outline">{contacts?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contacts && contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.slice(0, 5).map((contact: any) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="text-primary" size={14} />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-800">{contact.name}</h4>
                    <p className="text-sm text-neutral-600">{contact.title || contact.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.email && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Mail size={12} />
                    </Button>
                  )}
                  {contact.phone && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Phone size={12} />
                    </Button>
                  )}
                  <ContactTypeBadge type={contact.type} />
                </div>
              </div>
            ))}
            {contacts.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All {contacts.length} Contacts
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600">No contacts found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomerActivityFeedProps {
  customerId: string;
}


export default function CustomerProfile() {
  const { customerId } = useParams<{ customerId: string }>();
  const [, setLocation] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ["/api/customers", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!customerId,
  });


  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleExportReport = () => {
    setShowExportModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading customer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Customer Not Found</h2>
            <p className="text-neutral-600 mb-4">The customer you're looking for doesn't exist.</p>            <Button onClick={() => setLocation("/customers")}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-neutral-50">
      <CustomerProfileHeader customer={customer} onEdit={handleEdit} onExportReport={handleExportReport} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="processes">Processes</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="dates">Important Dates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CustomerInformation customer={customer} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RelatedProcesses customerId={customerId!} />
              <CustomerTeams customerId={customerId!} />
            </div>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            <RelatedProcesses customerId={customerId!} />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomerContacts customerId={customerId!} />
              <InternalContactManager 
                customerId={customerId!} 
                customerName={customer.name}
              />
            </div>
          </TabsContent>          <TabsContent value="documents" className="space-y-6">
            <CustomerDocumentManager 
              customerId={customerId!} 
              customerName={customer.name}
            />
          </TabsContent>          <TabsContent value="notes" className="space-y-6">
            <CustomerNotes customerId={customerId!} />
          </TabsContent>

          <TabsContent value="dates" className="space-y-6">
            <CustomerImportantDates customerId={customerId!} />
          </TabsContent>

        </Tabs>
      </div>      <EditCustomerModal
        customer={customer}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          refetch();
        }}
      />

      <CustomerReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        customerId={customerId!}
        customerName={customer.name}
      />
    </div>
  );
}
