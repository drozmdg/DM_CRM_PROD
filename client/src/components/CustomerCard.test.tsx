import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockCustomer } from '../test/setup';
import CustomerCard from './CustomerCard';

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockNavigate]
}));

describe('CustomerCard', () => {
  it('should render customer information', async () => {
    await renderWithProviders(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText(mockCustomer.name)).toBeInTheDocument();
    expect(screen.getByText(mockCustomer.phase)).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const mockOnEdit = vi.fn();
    const user = userEvent.setup();
    
    await renderWithProviders(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={mockOnEdit} 
        onDelete={vi.fn()} 
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const mockOnDelete = vi.fn();
    const user = userEvent.setup();
    
    await renderWithProviders(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={vi.fn()} 
        onDelete={mockOnDelete} 
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockCustomer.id);
  });

  it('should navigate to customer profile when card is clicked', async () => {
    const user = userEvent.setup();
    
    await renderWithProviders(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    const cardContent = screen.getByText(mockCustomer.name);
    await user.click(cardContent);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/customers/${mockCustomer.id}`);
  });

  it('should display customer avatar or initials', async () => {
    const customerWithAvatar = {
      ...mockCustomer,
      avatar: 'https://example.com/avatar.jpg'
    };
    
    await renderWithProviders(
      <CustomerCard 
        customer={customerWithAvatar} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    const avatar = screen.getByRole('img', { name: /customer avatar/i });
    expect(avatar).toBeInTheDocument();
  });

  it('should show inactive status for inactive customers', async () => {
    const inactiveCustomer = {
      ...mockCustomer,
      active: false
    };
    
    await renderWithProviders(
      <CustomerCard 
        customer={inactiveCustomer} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it('should display contract dates when available', async () => {
    const customerWithDates = {
      ...mockCustomer,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31'
    };
    
    await renderWithProviders(
      <CustomerCard 
        customer={customerWithDates} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText(/2024-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/2024-12-31/)).toBeInTheDocument();
  });
});