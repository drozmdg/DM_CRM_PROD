import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CustomerAvatar from '@/components/CustomerAvatar';

// Mock the Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className, ...props }: any) => (
    <div data-testid="avatar" className={className} {...props}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt, ...props }: any) => (
    <img data-testid="avatar-image" src={src} alt={alt} {...props} />
  ),
  AvatarFallback: ({ children, className, ...props }: any) => (
    <div data-testid="avatar-fallback" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('CustomerAvatar Component', () => {
  const mockCustomer = {
    id: '1',
    name: 'John Doe',
    logo: null,
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    active: true,
    phase: 'active' as const
  };

  it('should render customer avatar with fallback initials', () => {
    render(<CustomerAvatar customer={mockCustomer} />);
    
    const avatar = screen.getByTestId('avatar');
    const fallback = screen.getByTestId('avatar-fallback');
    
    expect(avatar).toBeInTheDocument();
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('JD');
  });

  it('should render customer avatar with logo when provided', () => {
    const customerWithLogo = {
      ...mockCustomer,
      logo: 'https://example.com/logo.png'
    };

    render(<CustomerAvatar customer={customerWithLogo} />);
    
    const avatar = screen.getByTestId('avatar');
    const image = screen.getByTestId('avatar-image');
    
    expect(avatar).toBeInTheDocument();
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/logo.png');
    expect(image).toHaveAttribute('alt', 'John Doe');
  });

  it('should generate correct initials for single name', () => {
    const singleNameCustomer = {
      ...mockCustomer,
      name: 'John'
    };

    render(<CustomerAvatar customer={singleNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('J');
  });

  it('should generate correct initials for multiple names', () => {
    const multipleNameCustomer = {
      ...mockCustomer,
      name: 'John Michael Doe'
    };

    render(<CustomerAvatar customer={multipleNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JD');
  });

  it('should handle empty name gracefully', () => {
    const emptyNameCustomer = {
      ...mockCustomer,
      name: ''
    };

    render(<CustomerAvatar customer={emptyNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('?');
  });

  it('should handle name with special characters', () => {
    const specialCharCustomer = {
      ...mockCustomer,
      name: 'John-Paul O\'Connor'
    };

    render(<CustomerAvatar customer={specialCharCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JO');
  });

  it('should accept custom size prop', () => {
    render(<CustomerAvatar customer={mockCustomer} size="lg" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('h-10', 'w-10');
  });

  it('should accept custom className', () => {
    render(<CustomerAvatar customer={mockCustomer} className="custom-avatar" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('custom-avatar');
  });

  it('should handle names with numbers and symbols', () => {
    const companyNameCustomer = {
      ...mockCustomer,
      name: '123 Tech Solutions & Co.'
    };

    render(<CustomerAvatar customer={companyNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('TC');
  });

  it('should handle very long names', () => {
    const longNameCustomer = {
      ...mockCustomer,
      name: 'Very Long Company Name That Exceeds Normal Length Expectations'
    };

    render(<CustomerAvatar customer={longNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('VE');
  });

  it('should handle names with only lowercase letters', () => {
    const lowercaseCustomer = {
      ...mockCustomer,
      name: 'john doe'
    };

    render(<CustomerAvatar customer={lowercaseCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JD');
  });

  it('should handle names with mixed case', () => {
    const mixedCaseCustomer = {
      ...mockCustomer,
      name: 'jOhN dOe'
    };

    render(<CustomerAvatar customer={mixedCaseCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JD');
  });

  it('should handle names with extra whitespace', () => {
    const whitespaceCustomer = {
      ...mockCustomer,
      name: '  John   Doe  '
    };

    render(<CustomerAvatar customer={whitespaceCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JD');
  });

  it('should render with correct accessibility attributes', () => {
    render(<CustomerAvatar customer={mockCustomer} />);
    
    const image = screen.queryByTestId('avatar-image');
    if (image) {
      expect(image).toHaveAttribute('alt', 'John Doe');
    }
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('should handle undefined customer gracefully', () => {
    // This test ensures the component doesn't crash with invalid data
    const invalidCustomer = {
      ...mockCustomer,
      name: undefined as any
    };

    render(<CustomerAvatar customer={invalidCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('?');
  });

  it('should handle null customer name gracefully', () => {
    const nullNameCustomer = {
      ...mockCustomer,
      name: null as any
    };

    render(<CustomerAvatar customer={nullNameCustomer} />);
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('?');
  });
});