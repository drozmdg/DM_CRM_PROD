import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// Test component that demonstrates React Query integration patterns
const TestDataComponent = ({ customerId }: { customerId: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['test-data', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/test/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {error.message}</div>;
  
  return (
    <div data-testid="data-display">
      <h2>{data?.name}</h2>
      <p>{data?.description}</p>
    </div>
  );
};

// Test component for form interactions
const TestFormComponent = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = React.useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form data-testid="test-form" onSubmit={handleSubmit}>
      <input
        data-testid="name-input"
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      <input
        data-testid="email-input"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      <button type="submit" data-testid="submit-button">Submit</button>
    </form>
  );
};

// Test component for state management
const TestCounterComponent = () => {
  const [count, setCount] = React.useState(0);
  const [step, setStep] = React.useState(1);

  return (
    <div data-testid="counter">
      <span data-testid="count-display">Count: {count}</span>
      <input
        data-testid="step-input"
        type="number"
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <button
        data-testid="increment-button"
        onClick={() => setCount(prev => prev + step)}
      >
        Increment
      </button>
      <button
        data-testid="decrement-button"
        onClick={() => setCount(prev => prev - step)}
      >
        Decrement
      </button>
      <button
        data-testid="reset-button"
        onClick={() => setCount(0)}
      >
        Reset
      </button>
    </div>
  );
};

describe('Component Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('React Query Integration', () => {
    it('should show loading state initially', () => {
      // Mock fetch to delay response
      global.fetch = vi.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'Test', description: 'Test description' })
        } as Response), 100))
      );

      render(
        <QueryClientProvider client={queryClient}>
          <TestDataComponent customerId="123" />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show data when fetch succeeds', async () => {
      // Mock successful fetch
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'Test Customer', description: 'A test customer' })
        } as Response)
      );

      render(
        <QueryClientProvider client={queryClient}>
          <TestDataComponent customerId="123" />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('data-display')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('A test customer')).toBeInTheDocument();
    });

    it('should show error when fetch fails', async () => {
      // Mock failed fetch
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: false,
          status: 404
        } as Response)
      );

      render(
        <QueryClientProvider client={queryClient}>
          <TestDataComponent customerId="invalid" />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Error: Failed to fetch/)).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      // Mock network error
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      render(
        <QueryClientProvider client={queryClient}>
          <TestDataComponent customerId="123" />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });
  });

  describe('Form Component Integration', () => {
    it('should handle form input changes', () => {
      const mockSubmit = vi.fn();
      
      render(<TestFormComponent onSubmit={mockSubmit} />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should submit form with correct data', () => {
      const mockSubmit = vi.fn();
      
      render(<TestFormComponent onSubmit={mockSubmit} />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com'
      });
    });

    it('should prevent default form submission', () => {
      const mockSubmit = vi.fn();
      
      render(<TestFormComponent onSubmit={mockSubmit} />);

      const form = screen.getByTestId('test-form');
      const mockPreventDefault = vi.fn();

      fireEvent.submit(form, { preventDefault: mockPreventDefault } as any);

      expect(mockSubmit).toHaveBeenCalled();
    });

    it('should handle empty form submission', () => {
      const mockSubmit = vi.fn();
      
      render(<TestFormComponent onSubmit={mockSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        name: '',
        email: ''
      });
    });
  });

  describe('State Management Integration', () => {
    it('should initialize with default values', () => {
      render(<TestCounterComponent />);

      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('step-input')).toHaveValue(1);
    });

    it('should increment counter by step value', () => {
      render(<TestCounterComponent />);

      const incrementButton = screen.getByTestId('increment-button');
      
      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1');
      
      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 2');
    });

    it('should decrement counter by step value', () => {
      render(<TestCounterComponent />);

      const incrementButton = screen.getByTestId('increment-button');
      const decrementButton = screen.getByTestId('decrement-button');
      
      // Increment first
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 2');
      
      // Then decrement
      fireEvent.click(decrementButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1');
    });

    it('should use custom step value', () => {
      render(<TestCounterComponent />);

      const stepInput = screen.getByTestId('step-input');
      const incrementButton = screen.getByTestId('increment-button');

      fireEvent.change(stepInput, { target: { value: '5' } });
      fireEvent.click(incrementButton);

      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 5');
    });

    it('should reset counter to zero', () => {
      render(<TestCounterComponent />);

      const incrementButton = screen.getByTestId('increment-button');
      const resetButton = screen.getByTestId('reset-button');

      // Increment to non-zero value
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 2');

      // Reset to zero
      fireEvent.click(resetButton);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 0');
    });

    it('should handle negative steps', () => {
      render(<TestCounterComponent />);

      const stepInput = screen.getByTestId('step-input');
      const incrementButton = screen.getByTestId('increment-button');

      fireEvent.change(stepInput, { target: { value: '-3' } });
      fireEvent.click(incrementButton);

      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: -3');
    });
  });

  describe('Component Lifecycle Integration', () => {
    it('should handle component unmounting', () => {
      const mockSubmit = vi.fn();
      
      const { unmount } = render(<TestFormComponent onSubmit={mockSubmit} />);

      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid state updates', () => {
      render(<TestCounterComponent />);

      const incrementButton = screen.getByTestId('increment-button');

      // Rapidly click increment button
      for (let i = 0; i < 10; i++) {
        fireEvent.click(incrementButton);
      }

      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 10');
    });

    it('should maintain state consistency during updates', () => {
      render(<TestCounterComponent />);

      const stepInput = screen.getByTestId('step-input');
      const incrementButton = screen.getByTestId('increment-button');

      // Change step and increment simultaneously
      fireEvent.change(stepInput, { target: { value: '7' } });
      fireEvent.click(incrementButton);

      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 7');
      expect(screen.getByTestId('step-input')).toHaveValue(7);
    });
  });

  describe('Error Boundary Integration', () => {
    const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="no-error">No error</div>;
    };

    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid error output in tests
      const originalError = console.error;
      console.error = vi.fn();

      const { rerender } = render(<ThrowErrorComponent shouldThrow={false} />);
      
      expect(screen.getByTestId('no-error')).toBeInTheDocument();

      // Component throwing error should be caught by error boundary in real app
      expect(() => {
        rerender(<ThrowErrorComponent shouldThrow={true} />);
      }).toThrow('Test error');

      console.error = originalError;
    });
  });
});