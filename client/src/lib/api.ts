import { apiRequest } from "./queryClient";

// Customer API functions
export const customerApi = {
  getAll: async (includeInactive: boolean = false) => {
    const url = includeInactive ? "/api/customers?includeInactive=true" : "/api/customers";
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  getById: async (id: number) => {
    const response = await apiRequest("GET", `/api/customers/${id}`);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/customers", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/customers/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/customers/${id}`);
  },
  
  reactivate: async (id: number) => {
    const response = await apiRequest("PATCH", `/api/customers/${id}/reactivate`);
    return response.json();
  },
};

// Contact API functions
export const contactApi = {
  getAll: async (customerId?: number) => {
    const url = customerId ? `/api/contacts?customerId=${customerId}` : "/api/contacts";
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/contacts", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/contacts/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/contacts/${id}`);
  },
};

// Communication API functions
export const communicationApi = {
  getAll: async (contactId: string) => {
    const response = await apiRequest("GET", `/api/communications?contactId=${contactId}`);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/communications", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/communications/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/communications/${id}`);
  },
};

// Process API functions
export const processApi = {
  getAll: async (customerId?: number) => {
    const url = customerId ? `/api/processes?customerId=${customerId}` : "/api/processes";
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/processes", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/processes/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/processes/${id}`);
  },
};

// Team API functions
export const teamApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/teams");
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/teams", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/teams/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/teams/${id}`);
  },
};

// Service API functions
export const serviceApi = {
  getAll: async (customerId?: number) => {
    const url = customerId ? `/api/services?customerId=${customerId}` : "/api/services";
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/services", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/services/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/services/${id}`);
  },
};

// Document API functions
export const documentApi = {
  getAll: async (customerId?: number) => {
    const url = customerId ? `/api/documents?customerId=${customerId}` : "/api/documents";
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/documents", data);
    return response.json();
  },
  
  update: async (id: number, data: any) => {
    const response = await apiRequest("PUT", `/api/documents/${id}`, data);
    return response.json();
  },
  
  delete: async (id: number) => {
    await apiRequest("DELETE", `/api/documents/${id}`);
  },
};

// Timeline API functions
export const timelineApi = {
  getEvents: async (customerId?: number, processId?: number) => {
    let url = "/api/timeline";
    const params = new URLSearchParams();
    if (customerId) params.append("customerId", customerId.toString());
    if (processId) params.append("processId", processId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  createEvent: async (data: any) => {
    const response = await apiRequest("POST", "/api/timeline", data);
    return response.json();
  },
};

// AI Chat API functions
export const aiChatApi = {
  getSessions: async () => {
    const response = await apiRequest("GET", "/api/chat/sessions");
    return response.json();
  },
  
  createSession: async (data: any) => {
    const response = await apiRequest("POST", "/api/chat/sessions", data);
    return response.json();
  },
  
  getMessages: async (sessionId: number) => {
    const response = await apiRequest("GET", `/api/chat/sessions/${sessionId}/messages`);
    return response.json();
  },
  
  sendMessage: async (sessionId: number, data: any) => {
    const response = await apiRequest("POST", `/api/chat/sessions/${sessionId}/messages`, data);
    return response.json();
  },
};

// Dashboard API functions
export const dashboardApi = {
  getMetrics: async () => {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  },
};

// Customer Notes API
export const customerNotesApi = {
  getAll: async (customerId: string) => {
    const response = await apiRequest("GET", `/api/customers/${customerId}/notes`);
    return response.json();
  },
  
  create: async (customerId: string, noteContent: string) => {
    const response = await apiRequest("POST", `/api/customers/${customerId}/notes`, { noteContent });
    return response.json();
  },
  
  update: async (id: string, noteContent: string) => {
    const response = await apiRequest("PUT", `/api/customers/notes/${id}`, { noteContent });
    return response.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/customers/notes/${id}`);
  },
};

// Important Dates API
export const importantDatesApi = {
  getAll: async (customerId: string) => {
    const response = await apiRequest("GET", `/api/customers/${customerId}/important-dates`);
    return response.json();
  },
  
  create: async (customerId: string, description: string, date: string) => {
    const response = await apiRequest("POST", `/api/customers/${customerId}/important-dates`, { 
      description, 
      date 
    });
    return response.json();
  },
  
  update: async (id: string, description: string, date: string) => {
    const response = await apiRequest("PUT", `/api/customers/important-dates/${id}`, { 
      description, 
      date 
    });
    return response.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/customers/important-dates/${id}`);
  },
  
  getUpcoming: async (daysAhead: number = 30) => {
    const response = await apiRequest("GET", `/api/important-dates/upcoming?days=${daysAhead}`);
    return response.json();
  },
};
