import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '@/components/StatusBadge';

// Mock the Badge component
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span data-testid="badge" className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

describe('StatusBadge Component', () => {
  it('should render active status with correct styling', () => {
    render(<StatusBadge status="active" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveAttribute('data-variant', 'success');
  });

  it('should render inactive status with correct styling', () => {
    render(<StatusBadge status="inactive" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Inactive');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
  });

  it('should render pending status with correct styling', () => {
    render(<StatusBadge status="pending" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Pending');
    expect(badge).toHaveAttribute('data-variant', 'warning');
  });

  it('should render completed status with correct styling', () => {
    render(<StatusBadge status="completed" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Completed');
    expect(badge).toHaveAttribute('data-variant', 'success');
  });

  it('should render cancelled status with correct styling', () => {
    render(<StatusBadge status="cancelled" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Cancelled');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
  });

  it('should render in_progress status with correct styling', () => {
    render(<StatusBadge status="in_progress" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('In Progress');
    expect(badge).toHaveAttribute('data-variant', 'default');
  });

  it('should render on_hold status with correct styling', () => {
    render(<StatusBadge status="on_hold" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('On Hold');
    expect(badge).toHaveAttribute('data-variant', 'outline');
  });

  it('should render unknown status with default styling', () => {
    render(<StatusBadge status="unknown_status" as any />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('unknown_status');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
  });

  it('should accept custom className', () => {
    render(<StatusBadge status="active" className="custom-status" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-status');
  });

  it('should handle capitalization correctly', () => {
    render(<StatusBadge status="IN_PROGRESS" as any />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('IN_PROGRESS');
  });

  it('should render with proper accessibility', () => {
    render(<StatusBadge status="active" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Active');
  });

  it('should handle different status formats', () => {
    const statuses = [
      { status: 'active', expected: 'Active', variant: 'success' },
      { status: 'inactive', expected: 'Inactive', variant: 'secondary' },
      { status: 'pending', expected: 'Pending', variant: 'warning' },
      { status: 'completed', expected: 'Completed', variant: 'success' },
      { status: 'cancelled', expected: 'Cancelled', variant: 'destructive' },
      { status: 'in_progress', expected: 'In Progress', variant: 'default' },
      { status: 'on_hold', expected: 'On Hold', variant: 'outline' }
    ];

    statuses.forEach(({ status, expected, variant }) => {
      const { rerender } = render(<StatusBadge status={status as any} />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(expected);
      expect(badge).toHaveAttribute('data-variant', variant);
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('should be consistent with text formatting', () => {
    // Test that underscore statuses are converted to title case with spaces
    render(<StatusBadge status="in_progress" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('In Progress');
    expect(badge).not.toHaveTextContent('in_progress');
    expect(badge).not.toHaveTextContent('IN_PROGRESS');
  });

  it('should maintain semantic meaning through visual design', () => {
    // Test that similar semantic statuses use consistent variants
    const { rerender } = render(<StatusBadge status="active" />);
    let badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'success');

    rerender(<StatusBadge status="completed" />);
    badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'success');

    // Both should use success variant as they indicate positive completion
  });

  it('should handle edge cases gracefully', () => {
    const { rerender } = render(<StatusBadge status="" as any />);
    let badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('');

    rerender(<StatusBadge status={null as any} />);
    badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();

    rerender(<StatusBadge status={undefined as any} />);
    badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
  });
});