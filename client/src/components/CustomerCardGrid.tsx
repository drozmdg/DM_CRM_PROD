import { Customer } from "@shared/types";
import CustomerCard from "./CustomerCard";

interface CustomerCardGridProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onReactivateCustomer?: (customer: Customer) => void;
  onDeactivateCustomer?: (customer: Customer) => void;
  isLoading?: boolean;
}

export default function CustomerCardGrid({ 
  customers, 
  onViewCustomer, 
  onEditCustomer, 
  onReactivateCustomer,
  onDeactivateCustomer,
  isLoading = false 
}: CustomerCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-neutral-200 rounded-lg h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 mb-4">
          <svg 
            className="w-16 h-16 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>        <h3 className="text-lg font-medium text-neutral-800 mb-2">No customers found</h3>
        <p className="text-neutral-600">Get started by adding your first customer</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onView={onViewCustomer}
          onEdit={onEditCustomer}
          onReactivate={onReactivateCustomer}
          onDeactivate={onDeactivateCustomer}
        />
      ))}
    </div>
  );
}
