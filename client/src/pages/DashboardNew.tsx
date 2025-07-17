import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Plus, 
  CheckCircle,
  TrendingUp,
  Activity,
  Clock,
  BarChart3
} from "lucide-react";

export default function DashboardNew() {
  console.log('🚀🚀🚀 COMPLETELY NEW DASHBOARD COMPONENT - FORCE CACHE BUST!!!');
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: processes, isLoading: processesLoading } = useQuery({
    queryKey: ["/api/processes"],
    queryFn: async () => {
      const response = await fetch("/api/processes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  console.log('NEW DASHBOARD DATA:', { metrics, customers: customers?.length, processes: processes?.length });

  if (metricsLoading || customersLoading || processesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Dashboard Overview</h2>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Dashboard Overview</h2>
        <p className="text-neutral-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-neutral-800">{metrics?.totalCustomers || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Active Processes</p>
                <p className="text-2xl font-bold text-neutral-800">{metrics?.activeProcesses || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Total Services</p>
                <p className="text-2xl font-bold text-neutral-800">{metrics?.totalServices || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Total Teams</p>
                <p className="text-2xl font-bold text-neutral-800">{metrics?.totalTeams || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Settings className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Recent Customers</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/customers')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {customers && customers.slice(0, 5).map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-800">{customer.name}</p>
                    <p className="text-sm text-neutral-600">{customer.industry || 'Industry not specified'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
                  }`}>
                    {customer.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Recent Processes</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/processes')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {processes && processes.slice(0, 5).map((process: any) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-800">{process.name}</p>
                    <p className="text-sm text-neutral-600">{process.customerName || 'Customer not specified'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    process.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-800'
                  }`}>
                    {process.status || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">FORCED CACHE BUST - NEW Dashboard!</h3>
        <p className="text-neutral-600">This is a completely new component with NO date-fns usage.</p>
      </div>
    </div>
  );
}