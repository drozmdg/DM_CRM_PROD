import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Building, 
  Mail, 
  Phone,
  Filter,
  Users,
  Download,
  Upload
} from "lucide-react";
import ContactModal from "@/components/ContactModal";
import ContactHistory from "@/components/ContactHistory";
import ContactImport from "@/components/ContactImport";
import type { Contact, Customer } from "@shared/types";

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });
  // Fetch customers for filtering
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch dashboard metrics for live customer count
  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });
  // Filter contacts
  const filteredContacts = contacts?.filter((contact: Contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (contact.role && contact.role.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCustomer = !selectedCustomer || selectedCustomer === "all-customers" || contact.customerId === selectedCustomer;
    const matchesType = !selectedType || selectedType === "all-types" || contact.type === selectedType;
    
    return matchesSearch && matchesCustomer && matchesType;
  }) || [];

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleViewHistory = (contact: Contact) => {
    setSelectedContact(contact);
    setIsHistoryOpen(true);
  };
  const exportContacts = (format: 'csv' | 'json') => {
    const dataToExport = filteredContacts.map((contact: Contact) => ({
      name: contact.name,
      title: contact.title || '',
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || '',
      type: contact.type,
      customer: customers?.find((c: Customer) => c.id === contact.customerId)?.name || ''
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const csvHeaders = ['Name', 'Title', 'Email', 'Phone', 'Role', 'Type', 'Customer'];
      const csvRows = dataToExport.map((contact: any) => [
        `"${contact.name}"`,
        `"${contact.title}"`,
        `"${contact.email}"`,
        `"${contact.phone}"`,
        `"${contact.role}"`,
        contact.type,
        `"${contact.customer}"`,
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  if (contactsLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Contacts</h1>
            <p className="text-neutral-600">Manage all customer and internal contacts</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportContacts('csv')}
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportContacts('json')}
          >
            <Download size={16} className="mr-2" />
            Export JSON
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload size={16} className="mr-2" />
            Import
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedContact(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Contacts</p>
                <p className="text-2xl font-bold text-neutral-800">{contacts?.length || 0}</p>
              </div>
              <Users className="text-primary" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Client Contacts</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {contacts?.filter((c: Contact) => c.type === 'Client').length || 0}
                </p>
              </div>
              <Building className="text-blue-600" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Internal Contacts</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {contacts?.filter((c: Contact) => c.type === 'Internal').length || 0}
                </p>
              </div>
              <User className="text-green-600" size={20} />
            </div>
          </CardContent>
        </Card>        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Active Customers</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {(metrics as any)?.customers?.total || 0}
                </p>
              </div>
              <Building className="text-purple-600" size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <Input
                placeholder="Search contacts by name, email, title, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-customers">All customers</SelectItem>
                {customers?.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All types</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Internal">Internal</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact: Contact) => {
                const customer = customers?.find((c: Customer) => c.id === contact.customerId);
                
                return (
                  <Card key={contact.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {contact.type === "Client" ? (
                              <Building className="text-primary" size={16} />
                            ) : (
                              <User className="text-primary" size={16} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-800">{contact.name}</h4>
                            {contact.title && (
                              <p className="text-sm text-neutral-600">{contact.title}</p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={contact.type === "Client" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}
                        >
                          {contact.type}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-neutral-600">
                          <Mail className="mr-2 text-neutral-400" size={14} />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center text-sm text-neutral-600">
                            <Phone className="mr-2 text-neutral-400" size={14} />
                            {contact.phone}
                          </div>
                        )}
                        {contact.role && (
                          <p className="text-sm text-neutral-600">{contact.role}</p>
                        )}
                        {customer && (
                          <p className="text-sm text-neutral-500">
                            <Building className="inline mr-1" size={12} />
                            {customer.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewContact(contact)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewHistory(contact)}
                        >
                          <Search size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No contacts found</h3>              <p className="text-neutral-600 mb-4">
                {searchTerm || (selectedCustomer && selectedCustomer !== "all-customers") || (selectedType && selectedType !== "all-types")
                  ? "Try adjusting your search filters to see more contacts."
                  : "Get started by adding your first contact."
                }
              </p>
              <Button onClick={() => {
                setSelectedContact(null);
                setIsModalOpen(true);
              }}>
                <Plus size={16} className="mr-2" />
                Add First Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
        customers={customers || []}
      />

      <ContactHistory
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
      />

      <ContactImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        customers={customers || []}
      />
    </div>
  );
}
