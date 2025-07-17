import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatDataProvider from "@/components/ChatDataProvider";
import OptionalChatDataProvider from "@/components/OptionalChatDataProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteDebugger from "@/components/RouteDebugger";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
console.log('🚨 APP.TSX USING FULL DASHBOARD COMPONENT - FULLY RESTORED!');
import Customers from "@/pages/Customers";
import CustomerProfile from "@/pages/CustomerProfile";
import Contacts from "@/pages/Contacts";
import Processes from "@/pages/Processes";
import ProcessDetails from "@/pages/ProcessDetails";
import Services from "@/pages/Services";
import Products from "@/pages/Products";
import Documents from "@/pages/Documents";
import AIChat from "@/pages/AIChat";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/Navigation";
import { Suspense } from "react";

// Loading component for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <RouteDebugger>
        <ChatProvider>
          <ErrorBoundary>
            <OptionalChatDataProvider enabled={true}>
              <div className="min-h-screen bg-neutral-50">
                <Navigation />
                <main className="pt-16">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <Switch>
                        <Route path="/" component={() => (
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        )} />
                        <Route path="/customers" component={() => (
                          <ProtectedRoute>
                            <Customers />
                          </ProtectedRoute>
                        )} />
                        <Route path="/customers/:customerId" component={() => (
                          <ProtectedRoute>
                            <CustomerProfile />
                          </ProtectedRoute>
                        )} />
                        <Route path="/contacts" component={() => (
                          <ProtectedRoute requiredRoles={['Admin', 'Manager']}>
                            <Contacts />
                          </ProtectedRoute>
                        )} />
                        <Route path="/processes" component={() => (
                          <ProtectedRoute>
                            <Processes />
                          </ProtectedRoute>
                        )} />
                        <Route path="/processes/:processId" component={() => (
                          <ProtectedRoute>
                            <ProcessDetails />
                          </ProtectedRoute>
                        )} />
                        <Route path="/services" component={() => (
                          <ProtectedRoute requiredRoles={['Admin', 'Manager']}>
                            <Services />
                          </ProtectedRoute>
                        )} />
                        <Route path="/products" component={() => (
                          <ProtectedRoute requiredRoles={['Admin', 'Manager']}>
                            <Products />
                          </ProtectedRoute>
                        )} />
                        <Route path="/documents" component={() => (
                          <ProtectedRoute>
                            <Documents />
                          </ProtectedRoute>
                        )} />
                        <Route path="/ai-chat" component={() => (
                          <ProtectedRoute>
                            <AIChat />
                          </ProtectedRoute>
                        )} />
                        <Route component={NotFound} />
                      </Switch>
                    </Suspense>
                  </ErrorBoundary>
                </main>
              </div>
            </OptionalChatDataProvider>
          </ErrorBoundary>
        </ChatProvider>
      </RouteDebugger>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
